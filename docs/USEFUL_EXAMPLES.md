# Useful Examples — Browser Game Engineering Patterns

**Purpose:** Public educational reference for implementing browser and idle games.  
**Last edited:** 2026-11-21  
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
| P17 | [Independent combat modules](library/combat-module-boundaries.md) | Independent hit/damage calculation, attack scheduling, defeat and reward handling | `[OUR-GAME: FIT]` |
| P18 | [Offline combat estimators](library/offline-combat-estimation.md) | Seeded encounter sampling, closed-form rates, tick replay and modular settlement tradeoffs | `[OUR-GAME: ADAPT]` |

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

**Guide:** [Time-safe offline simulation](library/offline-time-units-and-boundaries.md). Unit-safe time calculations, exhaustion boundaries and aggregate steps; includes failure modes and tests.

---

## P16 — Idempotent rewards and durable settlement cursors

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Guide:** [Crash-safe reward settlement](library/idempotent-reward-settlement.md). Atomic advancement, concurrency, retry keys and durable grant identity.

---

## P17 — Small independent RPG combat and reward modules

`[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`

**Guide:** [Independent combat rules, scheduling and rewards](library/combat-module-boundaries.md). Separate hit/damage math, attack timing, defeat handling and loot. Illustrative formulas are not approved or tested.

---

## P18 — Offline combat research comparison: choose algorithms, not foreign gameplay

`[OUR-GAME: ADAPT]` `[EVIDENCE: DESIGN-NOTE]`

**Guide:** [Offline combat estimation approaches](library/offline-combat-estimation.md). Compare short seeded encounter sampling, rate formulas and tick replay; covers accuracy, CPU cost, rare losses and validation.

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
