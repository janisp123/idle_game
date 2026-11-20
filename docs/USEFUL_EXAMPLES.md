# Useful Examples — Browser Game Engineering Patterns

**Purpose:** Public educational reference for implementing browser and idle games.  
**Last edited:** 2026-11-20  
**Status:** Conceptual engineering guidance. Examples below are original explanatory sketches; they are **not copied source code**, audited software components, or guarantees of production performance.  
**Scope:** General browser-game techniques, **including features we might never use**. The fit tag is specific to our game and does not indicate whether a technique is valuable to someone else.

See [RESEARCH_LIBRARY.md](RESEARCH_LIBRARY.md) for the library's purpose and [ENTRY_TEMPLATE.md](library/ENTRY_TEMPLATE.md) for longer technical entries. No entry here is an approved implementation task.

## Read selectively — agents and implementers

**This file is a catalogue, not a second requirements document.** For a concrete game task, start from the [short combat/offline handoff](brainstorm/ARCHITECTURE_AND_BALANCING.md#combatoffline-handoff--concise-context-for-codex-2026-11-20), the current decision/task files and its relevant topic notes. Open **only the entry that answers a question**; never treat the P01–P18 list as a collection of features to build.

| When the task concerns... | Start with | Do not assume |
| --- | --- | --- |
| Hit/miss, damage, attack timers, combat/death/loot boundaries | [P17](#p17--small-independent-rpg-combat-and-reward-modules), then P01 as needed | The illustrative formula has been selected or tested |
| Online fights versus years of offline gains | [P18](#p18--offline-combat-research-comparison-choose-algorithms-not-foreign-gameplay), then P02/P15 as needed | Every approach is suitable; in particular, full tick replay and capped time are **not** our intended offline model |
| Lucky drops, resource statistics, large stack quantities | P03, P13 | Expected values are exact outcomes or rounding can guarantee rare drops |
| Duplicate claims, saves, large time gaps | P16, P15, then P05/P07 as needed | The project already has production-grade persistence or security |
| UI, events, groups, operations, monetisation | Relevant P06–P14 entries only | These features are in the first prototype scope |

**Evidence and priority:** Entries are original explanatory **DESIGN-NOTEs**, not proven code in our project. **OFF-001 overrides generic research examples for our own game: XP accrues offline, but no skill levels, stats, perks or effective gear are upgraded until the player returns.** An entry's usefulness tag does not override `docs/DECISIONS.md` or authorise implementation. Older brainstorm variants and external examples have lower priority than the latest explicitly supported direction. Unresolved choices go back to the owner. Detailed third-party source locations are in a separate private index and are not automatically available to Codex.

## Quick index

| ID | Technique | General-purpose use | Our-game fit |
| --- | --- | --- | --- |
| P01 | Pure simulation core | Testable gameplay without UI dependencies | `[OUR-GAME: FIT]` |
| P02 | Event-based offline catch-up | Progress while a user is absent | `[OUR-GAME: ADAPT]` |
| P03 | Bulk random rewards | Efficient, statistically sound long-term idle loot | `[OUR-GAME: FIT]` |
| P04 | Configured activities and entities | Expand content without rewriting core logic | `[OUR-GAME: FIT]` |
| P05 | Versioned saves and migrations | Keep old accounts working after updates | `[OUR-GAME: FIT]` |
| P06 | Typed event stream | Connect combat, quests, UI logs and statistics | `[OUR-GAME: ADAPT]` |
| P07 | Server-authoritative multiplayer | Prevent client-side reward forgery | `[OUR-GAME: FIT]` |
| P08 | Cooperative reward settlement | Distribute group outcomes fairly and exactly once | `[OUR-GAME: ADAPT]` |
| P09 | Feature-based mobile interface | Responsive navigation and reduced UI complexity | `[OUR-GAME: FIT]` |
| P10 | Real-time ticking / server loops | Fast-paced continuous multiplayer worlds | `[OUR-GAME: NOT-FIT]` for dormant character simulation |
| P11 | Offline progression caps | Bound computational or economy exposure | `[OUR-GAME: NOT-FIT]` |
| P12 | Daily rewards and login streaks | Encourage short repeat sessions | `[OUR-GAME: NOT-FIT]` |
| P13 | Transactional inventory accounting | Avoid duplication, negative stacks and lost claims | `[OUR-GAME: FIT]` |
| P14 | Automated testing and observability | Catch errors and measure cost before release | `[OUR-GAME: FIT]` |
| P15 | [Time-safe offline simulation](library/offline-time-units-and-boundaries.md) | Correct seconds/milliseconds, stock exhaustion, and constant-cost fast-forward where valid | `[OUR-GAME: FIT]` |
| P16 | [Idempotent reward settlement](library/idempotent-reward-settlement.md) | Atomic catch-up cursors, safe retries, concurrent claims and crash recovery | `[OUR-GAME: FIT]` |
| P17 | Simple separated RPG combat calculations | Independent hit/damage calculation, attack scheduling, defeat and reward handling | `[OUR-GAME: FIT]` |
| P18 | Offline combat estimators compared | Seeded encounter sampling, closed-form rates, tick replay and modular settlement tradeoffs | `[OUR-GAME: ADAPT]` |

Tags apply to **our design**, not to technical merit. Each technique remains documented for other developers.

---

## P01 — Pure gameplay simulation

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Mixing timers, UI rendering, inventory changes and network calls makes gameplay unpredictable and hard to test.

**Pattern:** A simulation function receives a known prior state and explicit inputs: elapsed time, player commands and a source of random outcomes. It produces a new state and a compact list of meaningful events. It should not read the device clock or render a UI itself.

**Illustrative pseudocode (not library code):**

```text
advance(state, elapsed, commands, randomSource):
    state = applyAllowedCommands(state, commands)
    state = settleCompletedActivities(state, elapsed, randomSource)
    events = summarizeImportantChanges(state)
    return state, events
```

**Benefits:** Repeatable tests, one ruleset used by online and offline logic, and a UI that can be replaced without altering combat formulas.

**Tradeoffs:** The inputs need validation; multiple systems must use a deliberate, documented processing order. Never let an untrusted browser select authoritative rewards.

**Tests:** Same starting state + seed + inputs should yield the same final state; edge cases include zero elapsed time, negative time, duplicate commands and incompatible task configurations.

---

## P02 — Efficient offline catch-up for very long absences

`[OUR-GAME: ADAPT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Replaying every action of a character absent for years is expensive. An idle loop performing one encounter per minute would require millions of simulated encounters over long periods.

**Two approaches:**
- **Small-step replay:** advance a timer a few seconds or one action at a time. Straightforward but cost grows with time absent.
- **Boundary-based aggregation:** jump to the next meaningful change (level threshold, resource depletion, queued task end, group membership transition, rule-version change), then calculate many identical actions as one segment.

**Illustrative outline:**

```text
settleUntil(character, targetTime):
    while character.time < targetTime:
        boundary = earliestRelevantChange(character, targetTime)
        segment = boundary - character.time
        applyAggregatedActions(character, segment)
        applyBoundaryTransition(character)
    return character
```

The number of loop iterations should depend mostly on **meaningful state changes**, not elapsed seconds or total mining swings.

**Important:** A five-task repeating queue can still introduce many boundaries. Repeated deterministic cycles may need fast-forward mathematics; a naive loop over cycles is not automatically scalable. Bulk reward sampling must preserve rarity. Round quantities carefully and use safe integers or a deliberate large-number representation.

**Our-game restriction:** Solo progression must continue indefinitely, including combat and rare loot. Multiplayer group membership lasts at most seven days offline, then deterministic solo fallback applies. Unlike some valid game designs, a one-day or one-week offline cap is incompatible with our promise.

**Tests:** 1 hour, 24 hours, 7-day transition, 1 year and 20 years; zero resources, skill thresholds, old rule versions, chained tasks, and extremely large totals.

---

## P03 — Randomness, loot and bulk sampling

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Long offline periods may contain millions of independent loot checks. Recording a random roll per encounter is wasteful.

**Simple statistical model:** If a reward has probability `p` for each of `n` independent eligible encounters under unchanged conditions, the number of drops follows a binomial distribution, `X ~ Binomial(n,p)`. For distinct mutually exclusive outcomes, use an appropriate multinomial model.

**Example:** One special outcome in 343 equiprobable 3d7 results has `p = 1/343`. This is a dice-event probability, **not** a guarantee of a legendary item. An additional independent drop chance must be included if there is a second check.

**Caution:** Do not award `ceil(n*p)` drops. That guarantees at least one even when the correct probability is small. Likewise, using the expected count `n*p` as an exact result removes variation.

**Design tradeoff:** Deterministic seeded RNG supports testing and replay. For a multiplayer game, the authoritative server must control/commit outcomes and not expose exploitable random-state predictions.

**Tests:** Sample-distribution means, zero/one-probability cases, large `n`, very small `p`, stable results after save/load, no double-awards.

---

## P04 — Data-driven activities and entities

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Adding one enemy or activity should not require editing the combat engine.

**Pattern:** Define zones, enemies, tools, loot tables and skills as validated content records with stable IDs. The engine interprets the records and reports missing references clearly.

**Original illustrative content:**

```json
{
  "id": "stone_mine",
  "activityKind": "mining",
  "requiredSkillLevel": 1,
  "baseEncounterSeconds": 40,
  "outputItemId": "stone",
  "sceneId": "mine_activity"
}
```

**Why:** Balancing a duration or reward becomes a content update instead of a structural rewrite.

**Warnings:** Schema validation must reject unknown IDs, invalid probabilities, missing images and impossible requirements. Content data must be versioned for long-term offline settlement, or a returning player could receive rewards using rules from a later era.

---

## P05 — Save versions and migrations

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Game state inevitably changes. Old accounts must not break when a new field appears.

**Pattern:** Every saved state has a numeric schema version. When loading, apply explicit migrations, one version at a time, and validate the final state.

```text
load(record):
    while record.version < CURRENT_VERSION:
        record = migrateOneVersion(record)
    validate(record)
    return record
```

**Storage:** Prefer transactional/atomic writes and reliable backups or recovery. Long-absent accounts may need both save-schema migrations and **ruleset-time** handling for historical progression; those are different problems.

**Tests:** Every supported old version, failed migrations, interrupted writes, corrupt data and repeated load-save cycles.

---

## P06 — Domain events and bounded activity logs

`[OUR-GAME: ADAPT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** A quest, notification and statistics panel should not all need custom changes inside the mining function.

**Pattern:** Gameplay emits typed events such as `encounter_completed`, `item_gained`, `skill_used` or `skill_level_changed`. Other systems consume the events without rewriting the core action.

**Important distinction:** A domain event is not automatically a durable network message or database transaction. Determine what needs persistence, ordering, retries and deduplication.

**For multi-year idle:** Record aggregate gains and a bounded list of significant recent events, not one log line for every historical swing. An illustrated “welcome back” summary can be generated from aggregates.

---

## P07 — Authoritative server and inexpensive browser client

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Browser code is editable by the player; a client-provided `+1000000 legendary items` message must not be accepted.

**Pattern:** Browser sends allowed intents, such as “set mining activity” or “join group.” Server validates the request, records trusted timestamps and settles results. Browser displays cached artwork, local progress estimates, and authoritative returned values.

**Cost-control principle:** A dormant account should not consume ongoing per-character CPU. Store state and timestamps, then settle on demand or at meaningful group/shared-world events.

**Tests:** Tampered requests, replayed submissions, concurrent logins, timestamp manipulation, session expiry, stale-version responses and rate limits.

---

## P08 — Shared group rewards and membership windows

`[OUR-GAME: ADAPT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Cooperative rewards must be fair, resistant to duplicates, and consistent if some members are offline.

**Pattern:** Treat a group encounter as **one** authoritative resolution with one shared outcome and reward pool. Then allocate resources using an explicit policy.

**Two distributions:**
- **Equal:** Divide among eligible members; define what happens to remainders.
- **Weighted:** For weights `w_i`, assign shares proportional to `w_i / sum(w)` while ensuring the sum of integer shares equals the actual pool.

**Correctness:** Lock or transactionally serialize reward settlement. Use stable encounter/claim IDs so retries don't award twice.

**Our-game boundary:** Offline group participation expires seven days after the last login; afterwards the character continues solo. Nobody joins another group while offline. Record member joins/leaves/kicks as timestamped boundaries instead of simulating an always-active process for each absent player.

**Tests:** 1 to 20 members, zero/negative weights, leader departure, changing equipment, last-member exit, exact remainders, duplicate claims and logout near the eligibility boundary.

---

## P09 — Mobile-first illustrated interface

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Desktop-style multi-panel RPG layouts are difficult to use one-handed on a phone.

**Pattern:** Make a large static activity scene the focus, with short text describing the current action; keep the main controls in easy thumb reach. Separate navigation, dialogs and gameplay calculations.

**Optimization:** Serve artwork at practical display size, use modern image formats and lazy loading, cache where possible, and handle eviction gracefully. Do not re-render the entire UI at frame rate when the artwork is static.

**Tests:** Narrow portrait screens, touch targets, text scaling, slow networks, reduced-motion preferences and low-memory mobile devices.

---

## P10 — Continuous ticking, polling and WebSockets

`[OUR-GAME: NOT-FIT]` for dormant-character simulation; `[EVIDENCE: DESIGN-NOTE]`

**Where useful generally:** Fast-paced shared worlds, real-time PvP, simulations requiring continuous physics, or immediate chat and presence updates.

**Options:** Fixed-step server tick; event scheduling; request/response polling; pushed events over persistent connections. Choose based on responsiveness, concurrency and actual server costs.

**Costs:** Always-on actors, high-frequency database writes, many sockets and per-player timers can become expensive even if almost nobody is actively watching. Our idle game should primarily settle dormant characters from timestamps; chat and active group presence can use separate, limited real-time mechanisms.

---

## P11 — Offline time caps

`[OUR-GAME: NOT-FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Where useful generally:** Games balancing a limited daily economy, requiring recurring player engagement, or using expensive per-action replay without efficient aggregation.

**Typical options:** Absolute cap, reduced offline efficiency, or allowing only certain activities while offline.

**Our reason not to use them:** They contradict the deliberate goal that a character can be absent for decades and still accumulate their intended progress. Solve the computation problem rather than shifting the penalty onto the player.

---

## P12 — Daily rewards and streaks

`[OUR-GAME: NOT-FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Where useful generally:** Session-based games that reward frequent return visits. Evaluate both engagement and pressure on the player; consider time zones and accessibility.

**Our reason not to use them:** We want voluntary returns without missed-day penalties, fear of lost progress or routine obligations. Any return celebration should depend on progress made, **not** an attendance streak.

---

## P13 — Inventory and exactly-once transactions

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Problem:** Concurrent reward claims, retries or disconnects can duplicate rare items or lose resources.

**Pattern:** Give each settlement a unique idempotency key. In a database transaction: check if already applied, validate the change, update balances, record the key, then commit once.

**Stack quantity:** Stacking item types avoids weight/slot complexity, but “unlimited” item counts still require explicit numeric storage choices and overflow testing. If using very large integers, serialize them safely over JSON (often as strings).

**Tests:** Retry same claim ten times, simultaneous claims, server crash between steps, split of odd-sized loot pools and negative/overflow cases.

---

## P14 — Project structure, testing and performance

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Illustrative modular layout (not a required scaffold):**

```text
src/
  core/            # Pure game rules and offline calculations
  content/         # Validated zones, activities, items and image IDs
  server/          # Authoritative accounts, groups and persistence
  ui/              # Mobile browser views and presentation
  tests/           # Unit, integration, probability, load and offline tests
assets/            # Original, optimized artwork
docs/              # Research, brainstorm, decisions, tasks and guides
```

**Testing pyramid:** Many deterministic unit tests; a smaller number of database/HTTP integration tests; targeted multi-user and mobile browser tests. Add benchmarks for 1-, 7-, 365- and 7,300-day offline gaps. Measure CPU, storage writes, bandwidth and memory instead of guessing.

**Important:** “Tests passed” means the actual tests ran successfully; a script that merely prints a success message proves nothing. Record the exact commands, environment and outcome.

---

## P15 — Time-safe resource exhaustion and boundary calculations

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**New deep dive:** [Time-Safe Offline Simulation and Resource-Depletion Boundaries](library/offline-time-units-and-boundaries.md).

Why it matters: A time-to-depletion value computed in seconds must not be treated as milliseconds. A correct offline solver advances to the next meaningful change, recomputes rates after depletion, and never silently discards leftover time because of an iteration guard. The guide includes dimensional analysis, original pseudocode, starvation policies, deterministic vs probabilistic bulk processing, a test matrix and performance alternatives.

---

## P16 — Idempotent rewards and durable settlement cursors

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**New deep dive:** [Idempotent Reward Settlement and Crash-Safe Progress Cursors](library/idempotent-reward-settlement.md).

A returning player can trigger the same catch-up from two tabs, or retry after the server committed but failed to reply. Persist the exact interval cursor, inventory, skill XP and RNG/queue state in one atomic transition. For one-time group grants and crafting commands, use stable event or request identities, database uniqueness and payload binding. A transactionally committed outbox is useful only when a durable external notification or message must follow. The guide compares row locks, optimistic versions, receipts and event grants, with failure-injection tests.

---

## P17 — Small independent RPG combat and reward modules

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Evidence examined:** publicly readable code from a classic MMORPG-style server recreation, plus a larger modular server framework. We inspected actual combat damage calculations, player/NPC fighting loops and a separate loot-roll function in the former, and the latter's high-level engine/content separation. These are **readable implementations**, not verified formulas from the proprietary original games. Source names and URLs are not published under this repository's standing rule.

**Observed boundaries and reusable lessons:**

1. **Combat maths module:** receive player/enemy attributes and equipment bonuses; calculate accuracy, defensive protection, potential maximum damage and sampled damage. The inspected example separates calculations from world/character entities.
2. **Combat scheduler:** player and enemy models independently call the damage calculation at eligible attack stages/timers. Apply resulting damage to HP and resolve victory/defeat. Keeping this outside the maths function makes formulas replaceable.
3. **Loot roller:** use configured weighted drop tables, independent of the damage formula. Victory processing grants resources/XP through a separate state update. This makes drop rates editable without rewriting combat.
4. **Modular game architecture:** prefer separate engine, content definitions and UI/presentation; do not bind combat logic to scene drawing, network handling or persistence.
5. **Our extra requirement:** adapt the same rules for an **offline estimator**. The examined servers run live game loops; they **do not provide a verified unlimited-offline combat solution**. Do not copy their real-time ticking into a server actor for dormant players.

**Original illustrative pseudocode (not extracted from other projects or intended as our final formula):**

```text
resolveHit(attacker, defender, random):
    attackScore = computeAttackScore(attacker.stats, attacker.equipment)
    defenseScore = computeDefenseScore(defender.stats, defender.equipment)
    chanceToHit = bounded(attackScore / (attackScore + defenseScore), 0, 1)
    if random.draw() >= chanceToHit:
        return { hit: false, damage: 0 }
    damage = sampleDamage(attacker.damageRange, random)
    return { hit: true, damage: max(0, damage) }

advanceCombat(state, elapsed, random):
    advanceAttackTimers(state, elapsed)
    for every attack becoming ready, in a defined order:
        result = resolveHit(currentAttacker, currentDefender, random)
        applyDamageAndCombatEffects(state, result)
        if either combatant has zero HP: finishEncounter(state); stop
    return summaryOfResultAndTime(state)

finishEncounter(state):
    if won:
        return { outcome: "win", xpEarned: xpRule(state),
                 dropChances: lootTableForDefeatedEnemy(state) }
    return { outcome: "loss", downtime: revivalAndReturnTime(state) }

estimateOffline(segment, combatModel):
    rates = estimateVictoryDeathAndDurationRates(combatModel, segment.startStats)
    applyStatisticallySampledRewardsAndTimeCosts(segment, rates)
    // OUR GAME: do NOT change skill/level/effective-equipment stats during absence.
    // Recompute only at non-advancement boundaries, e.g. activity or rule changes.
```

**Important boundaries:** The probability formula above is just one simple candidate—not an endorsement of any game's exact algorithm. The offline function is a *placeholder for a future validated statistical model*, not an implementation or guarantee of equivalence. Don't use per-battle simulation for multi-year catch-up. Preserve separate fixed-zone and resurrection downtime rules. **For our game specifically, use the frozen logout build throughout; earned XP is applied to levels only on return (OFF-001).**

**Practical tests before adopting any formula:** compare average win rate, damage, fight duration, deaths/hour and rewards/hour from seeded encounter sampling against the aggregate estimator; test extremes (zero attack/defense, near-certain hit/miss, long absences and **separate fixed builds at different skill levels**, without levelling during the absence), and verify the UI/animation cannot change progression.

**Use/rights note:** Reading source is not permission to paste it into our MIT project. At least one examined recreation declares a strong copyleft license; preserve legally required attribution for any approved integration, or write independent code. Nothing above is copied from an outside repository.

---

## P18 — Offline combat research comparison: choose algorithms, not foreign gameplay

`[OUR-GAME: ADAPT]` `[EVIDENCE: DESIGN-NOTE]`  
**Reviewed:** 2026-11-20. **Evidence:** Publicly readable implementations and documentation in several browser/mobile idle RPGs and an open source MMORPG-style server. The code was **inspected**, not executed, benchmarked or validated in our repository. Under our publication rules, do not publish the outside project names, source paths or URLs in this public document. The owner keeps the separate source-location index for future research handoffs.

### What we actually inspected

| Pattern | Observed code or design | General merit | Our-game fit and caution |
| --- | --- | --- | --- |
| **A. Seeded headless encounter estimator** | Runs a small fixed set of actual battles using normal content, actor statistics and combat rules without rendering; aggregates average damage, duration and failure rate; caches by content/build/settings fingerprint. An offline module reads these rates and converts time into rewards. | Useful whenever combat includes skills, interrupts and effects that resist simple algebra. One combat model for active play and estimation. | **FIT after adaptation.** A default of only three seeded battles is too small for dependable rare losses. The inspected implementation also used heuristic multipliers and loot quantity caps; none is automatically correct for us. The absence-duration calculation itself had no global time cap. |
| **B. Direct expected-value combat calculator** | Computes hit chance, effective damage per second, estimated kill time, enemy damage per second, time until injury, approximate win chance, expected kills and expected drops. Uses expected rates rather than replaying every fight. | Cheap, understandable mathematical baseline; aggregate work need not scale with number of virtual encounters. | **ADAPT.** An observed version capped offline time at eight hours, used a coarse survival-to-win heuristic and did not implement repeated graveyard/return cycles. Its named "O(1)" approach is only constant for unchanged statistics. |
| **C. Time-step offline replay** | Reuses online update logic in half-second steps, optionally yielding to the browser so it stays responsive. | Simple consistency with live rules; suitable for short absences and testing. | **NOT-FIT as our final offline engine.** CPU work grows roughly with elapsed seconds; one year would entail tens of millions of steps. The inspected version enforces an offline cap. Keep step replay as an **independent test oracle**, not a decades-long settlement algorithm. |
| **D. Separated combat and offline services** | Distinct files/services for combat, group encounters, loot, offline rewards, configuration and UI. Offline rewards calculated from saved activity snapshots and configured intervals. | Clear organizational boundary and options for future features. | **ADAPT.** One inspected implementation still imported many global stores directly into its combat service, making the module less isolated than we want. Its settings included a 12-hour starting cap and 80% offline efficiency, both incompatible with our goal. |
| **E. Server-side combat with small exported maths functions** | Separate hit chance, damage, defense/status effects, encounter resolution and rewards; game server owns authoritative state. | Good base for eventual multiplayer anti-cheat. | **ADAPT.** Browser-only reward authority is not sufficient for a public multiplayer game. One examined server was noncommercial-licensed; visible source does not imply permission to reuse it. |
| **F. A larger modular engine with parity tests** | Engine/game-content separation plus regression tests comparing extracted pure algorithms against frozen historical outputs, including time and randomness behavior. | A way to safely refactor mechanics without accidental balance changes. | **FUTURE CANDIDATE.** Do not import a huge framework into our small solo prototype. Reuse the principle of explicit interfaces and parity/regression tests. |

### Three independent responsibilities, one ruleset

**1. Pure combat rules:** Given an immutable player snapshot (including **two equipped skills**), enemy statistics, environment, fixed automatic skill rules, explicit elapsed time and RNG, resolve a live encounter. Output a result and typed events; do **not** read browser UI, clocks, databases, remote state, artwork or save files.

**2. Combat evaluation:** Use (A) short seeded real combats to sample win probability, duration by outcome, wounds, skill usage and recovery needs. Cache this estimate by a versioned fingerprint of the **complete inputs**, not only character level. Use (B) as a cheap cross-check or early prototype when effects are simple; do not let two independent sets of damage formulas drift apart.

**3. Offline settlement (OFF-001):** Given elapsed time and the **unchanged logout build**, calculate completed activities, expected wins/losses, resurrection/return downtime, accumulated XP and loot. **Offline XP cannot level up skills, raise stats or improve combat efficiency during the interval.** Grant/apply XP and resulting level-ups **on login after settling the full interval**. Re-evaluate only at non-advancement boundaries (different queued activity, exhausted resources, expired group membership, dated world/rule changes). Do not tick absent actors. Allow years or decades without a cap.

The UI only displays returned results and battle narratives; it never chooses or forges rewards. Death handling and reward tables are separate from combat damage formulas.

### Original example: convert encounter estimates to farming rates

This is **new illustrative pseudocode**, not an extracted formula or validated estimator.

```text
combatModel = evaluateCombat(build, monster, environment, fixedSkills, rulesVersion)
# Estimated from sampled encounters:
pWin             = combatModel.winProbability            # 0..1
meanWinSeconds   = combatModel.meanDurationIfWin
meanLossSeconds  = combatModel.meanDurationIfLoss
recoverySeconds  = combatModel.expectedRecoveryAfterWin
graveyardSeconds = reviveTime + returnToSameZoneTravelTime

expectedCycleSeconds =
    pWin     * (meanWinSeconds  + recoverySeconds) +
    (1-pWin) * (meanLossSeconds + graveyardSeconds)

winRatePerSecond  = pWin     / expectedCycleSeconds
lossRatePerSecond = (1-pWin) / expectedCycleSeconds

# For a segment with unchanged stats/rules:
expectedWins   = segmentSeconds * winRatePerSecond
expectedDeaths = segmentSeconds * lossRatePerSecond
# Draw plausible integer outcomes from a suitable, tested distribution.
# Award base resources from sampled wins, not invented guaranteed rare drops.
# OUR GAME: do not cross skill/XP thresholds during absence; the build is frozen.
# Only apply legitimate activity, resource, group or time-varying rule boundaries.
```

**This example has assumptions:** start travel, recovery after a loss, partial intervals, persistent injuries and whether the character can fight again immediately need explicit policies. Win/loss times are conditional averages, not the same as one average fight duration. No specific number of deaths or loot items should be guaranteed by floating-point rounding. Treat totally unwinnable encounters without inventing a tiny nonzero damage floor. Large-time aggregation can be efficient but is not automatically an identical replay of RNG events. Cache invalidation must reflect balance patches and all changed inputs.

### Compare offline outcomes against active battle simulation

Test these in an independently authored small prototype **before claiming correctness**:

1. Run at least thousands of seeded encounters per representative build/monster/environment; estimate uncertainty for very rare deaths instead of trusting three samples. Compare win chance, mean win/loss time, hit/damage distribution, interrupts and skill experience.
2. Run a batched estimator over many shorter windows with the same starting build; compare distributions of victories, deaths, time wasted, XP and resources against sampled active fights. Check **online/offline statistical fairness**, not exact matching of every random roll.
3. Test repeated graveyard → resurrection → return to the **same zone** (no automatic easier-zone switch). Recovering and packing/travel time count against farming time, including when survival chance is low.
4. Test XP totals spanning many theoretical level thresholds after 1 hour, 1 week, 1 year and 20 years: **all offline fights must still use the same frozen logout levels and stats**. Check application of all earned levels on return, without retroactive gain changes. Also test non-advancement boundaries, historical rules and repeating task queues. Execution cost should grow with **actual activity/world boundaries**, not offline seconds, battle count or earned XP level crossings.
5. Test impossible damage, no kills, nearly certain death, mixed enemies, overlapping attack timers, skill interrupts and recovery. Do not silently switch activities or grant loot from a fight the character could never win.
6. Test probabilistic rare rewards over a huge number of independent sessions; no `ceil(p*n)` or fixed expected counts that make rare drops guaranteed. Save/claim must be server-authoritative and idempotent.
7. The **one three-skull-dice roll when returning** is a separate claim/bonus presentation mechanic, not a requirement to generate a dice event for each offline combat. Prevent frequent logins from multiplying lucky chances; the exact bonus formula remains **open**, not a solved design decision.

### Cost, limitations and next research targets

- **Direct rate formulas:** near-constant work in a stable segment, easy to inspect, but often miss interrupts, burst damage, injury/death correlations and timing variance.
- **Seeded short simulations:** greater fidelity to real rules, cost proportional to sample count and average encounter length; cache responsibly, invalidate on rule/build changes. Too few samples may completely miss infrequent fatalities.
- **Full per-tick catch-up:** excellent short-period reference for parity; catastrophic for unbounded offline time (tens of millions or more ticks), even if browser processing is chunked.
- **Future investigation:** calibration methods for rare losses, first-passage/survival estimation, distribution-preserving aggregate loot, skill XP milestone stepping, stable versioned saves and exactly-once reward settlement. Research these without promising untested accuracy.
- **Security and rights:** public third-party code is a technical reference, not our implementation. An absent licence is **not** an open-source licence. Future integration requires separate authorization and compliance with whatever licence applies; original algorithms/formulas should be independently designed and tested.

**Status:** Research documented only. No game code, third-party dependencies, combat equations or coding tasks were approved by this review.

---

## How to extend this public library

1. Pick a reusable browser-game technique, whether or not it fits our game.
2. Investigate it and form an accurate, **independently written** explanation that readers can understand without following external references.
3. Describe its algorithm, state flow, failure cases, performance costs, security tradeoffs and alternatives.
4. Include a small original example or pseudocode, and distinguish tested results from conceptual recommendations.
5. Add both a general usefulness description and a **separate** our-game fit tag. Preserve `NOT-FIT` topics for other developers.
6. Move substantial guides into `docs/library/` using the article template; update this index with a brief entry.
7. Never copy third-party code or assets into this library. If code is ever incorporated into the game, honor the applicable license and mandatory notices; those obligations cannot be bypassed by omitting attribution.
8. Never convert an informational entry into `docs/TD_LIST.md` without explicit owner authorization.

**Research and testing honesty:** These entries explain common design patterns; they do **not** certify that an unnamed outside project implements them, or that they have been benchmarked. Cite concrete **internal test evidence** only when the tests actually exist in this repository.
