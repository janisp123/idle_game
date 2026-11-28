# Offline combat estimation — comparing practical approaches

**Category:** Combat / offline simulation / performance  
**General-purpose benefit:** Compare accurate short-encounter modeling with low-cost, long-duration settlement without continuous simulation.  
**Our-game fit:** `[OUR-GAME: ADAPT]` — evaluate models against the frozen-build settlement and current-level reward cap.
**Evidence:** `[EVIDENCE: DESIGN-NOTE]` — inspected ideas have not been independently tested or benchmarked here.  
**Reviewed:** 2026-11-21

## Problem and intended use

A combat-capable idle game must estimate victories, defeats, downtime and rewards while a player is absent. Exact tick replay over years is too expensive; cheap averages can be inaccurate. The alternatives below have different correctness and cost envelopes.

## Compared approaches and implementation sketch

**Reviewed:** 2026-11-20. **Evidence:** Publicly readable implementations and documentation in several browser/mobile idle RPGs and an open source MMORPG-style server. The code was **inspected**, not executed, benchmarked or validated in our repository. This historical comparison did not publish its source index. Follow the [current library sourcing rules](../RESEARCH_LIBRARY.md#what-belongs-here) when adding verifiable citations.

### Compared implementation patterns

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
# OUR GAME: stop eligible rewards at the current-level cap; keep the build frozen.
# Only apply legitimate activity, resource, group or time-varying rule boundaries.
```

**This example has assumptions:** start travel, recovery after a loss, partial intervals, persistent injuries and whether the character can fight again immediately need explicit policies. Win/loss times are conditional averages, not the same as one average fight duration. No specific number of deaths or loot items should be guaranteed by floating-point rounding. Treat totally unwinnable encounters without inventing a tiny nonzero damage floor. Large-time aggregation can be efficient but is not automatically an identical replay of RNG events. Cache invalidation must reflect balance patches and all changed inputs.

### Compare offline outcomes against active battle simulation

Test these in an independently authored small prototype **before claiming correctness**:

1. Run at least thousands of seeded encounters per representative build/monster/environment; estimate uncertainty for very rare deaths instead of trusting three samples. Compare win chance, mean win/loss time, hit/damage distribution, interrupts and skill experience.
2. Run a batched estimator over many shorter windows with the same starting build; compare distributions of victories, deaths, time wasted, XP and resources against sampled active fights. Check **online/offline statistical fairness**, not exact matching of every random roll.
3. Test repeated graveyard → resurrection → return to the **same zone** (no automatic easier-zone switch). Recovering and packing/travel time count against farming time, including when survival chance is low.
4. Test absences of 1 hour, 1 week, 1 year and 20 years, including settlement below, exactly at and beyond the current-level reward cap. Verify frozen inputs, eligible advancement after return, no retroactive gains and historical rule replay. Games with queues or offline advancement need transition tests. Measure cost against meaningful boundaries.
5. Test impossible damage, no kills, nearly certain death, mixed enemies, overlapping attack timers, skill interrupts and recovery. Do not silently switch activities or grant loot from a fight the character could never win.
6. Test probabilistic rare rewards over a huge number of independent sessions; no `ceil(p*n)` or fixed expected counts that make rare drops guaranteed. Save/claim must be server-authoritative and idempotent.
7. Any future **three-skull-dice return bonus**, if approved, is a separate claim/presentation mechanic, not a requirement to generate a dice event for each offline combat. Prevent frequent logins from multiplying lucky chances; the exact bonus formula remains **open**, not a solved design decision.

### Cost, limitations and next research targets

- **Direct rate formulas:** near-constant work in a stable segment, easy to inspect, but often miss interrupts, burst damage, injury/death correlations and timing variance.
- **Seeded short simulations:** greater fidelity to real rules, cost proportional to sample count and average encounter length; cache responsibly, invalidate on rule/build changes. Too few samples may completely miss infrequent fatalities.
- **Full per-tick catch-up:** excellent short-period reference for parity; catastrophic for unbounded offline time (tens of millions or more ticks), even if browser processing is chunked.
- **Future investigation:** calibration methods for rare losses, first-passage/survival estimation, distribution-preserving aggregate loot, skill XP milestone stepping, stable versioned saves and exactly-once reward settlement. Research these without promising untested accuracy.
- **Security and rights:** public third-party code is a technical reference, not our implementation. An absent licence is **not** an open-source licence. Future integration requires separate authorization and compliance with whatever licence applies; original algorithms/formulas should be independently designed and tested.

**Status:** Research documented only. No game code, third-party dependencies, combat equations or coding tasks were approved by this review.

## Open questions

Validate rare-loss tails, RNG-state compatibility, rule-version boundaries and empirical online/offline fairness before choosing one model.

## Rights and originality

This is independent research synthesis, not imported game code or a claim of novel invention. External integrations require separate approval and license compliance.
