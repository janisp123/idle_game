# Activity queue — finite steps, forever final activity (GAME-004)

**Status:** Owner-approved queue behavior, design/implementation plan only; **not yet in the playable game**.
**Recorded:** 2026-11-21 by chat. This supersedes the earlier brainstorming idea of an indefinitely repeating task queue.
**Related:** [ACTIVITY_SWITCH_SPEC.md](ACTIVITY_SWITCH_SPEC.md), [DECISIONS.md](DECISIONS.md) QUEUE-001 / ACT-SWITCH-001 / OFF-001 / ZONE-001 / UI-TIME-001, [TD_LIST.md](TD_LIST.md) GAME-004.

## Core rule

A character can set up to **five activities in one linear queue**. **The final activity always continues forever**. Every preceding activity runs for a player-selected **1–8 hours or 1–8 days**, after which the next transition begins. **No loop, daily login, scheduled wake-up process, offline expiry, or time cap.** The queue must still work after 20 years offline.

Illustrative plan:

| Position | Activity | Configured duration |
| --- | --- | --- |
| 1 | Mining | 2 hours |
| 2 | Alchemy | 1 day |
| 3 | Fishing | Forever |

Returning after 20 years should account for Mining, Alchemy, their switching phases, and the remaining years of Fishing, without simulating each minute or action.

**Interpretation of “1–8 hours/days”:** A discrete amount 1, 2, … 8 and unit Hours or Days. This is **an explicit planning input**, not a live countdown and therefore does not violate UI-TIME-001's prohibition on real-time clock/duration displays.

## Player interaction

- Each activity has the already-approved **Start** button beside the activity name. Start requests that activity; it never instantly teleports a working character. Preserve the three switching phases in [ACTIVITY_SWITCH_SPEC.md](ACTIVITY_SWITCH_SPEC.md).
- After selecting **Start**, present an editable **Do it for** setting: choose 1–8 and **Hours** or **Days**, or mark the activity **Forever** if it is the last activity. When the player is already doing an activity, they can set **Do it for** on that active slot and append the next activity.
- The queue counts **at most five total positions including the current activity and the forever final position**. If the player wants to append another activity, a formerly forever final activity needs a finite planned duration. Do not allow an unreachable task after a Forever entry.
- Once a queued task finishes, advance automatically. The final entry has no stop condition and runs forever, including when the user is offline. Never create an implicit idle state at the end.
- Show the queue order, activity names, **configured** finite durations, and Forever for the last entry. Do **not** show live time remaining, elapsed absence, server time, hours per reward or action totals. During switching, show the separately specified transition bar and phase text.
- Selecting/adjusting the queue while online first settles existing earned work to the current timestamp; edits must never recalculate history or retroactively overwrite already-earned resources/XP.
- The pending-target cancellation, reordering, deletion and replacement policy is **not yet approved**; defer those controls rather than secretly changing progress. The first implementation can focus on building/committing a queue before leaving.

## Transition and time budget semantics

- **Proposed implementation policy (needs final owner confirmation):** a configured duration measures productive work time starting when that activity begins. Finishing the previous task, travel and preparation would be outside that window. A 2-hour Mining task would mean 2 hours of productive Mining, not 2 hours including a trip.
- At the end of a finite productive interval, **finish the currently running full work cycle** before departing, as required by ACT-SWITCH-001. This can make the actual handoff slightly later than the planned window. Award the final eligible completed cycle at most once (subject to the duration-policy confirmation above).
- Next, apply **Moving to new location** and **Getting ready to start new activity** with no XP or materials from travel/preparation. Preserve the approved **five-minute cross-zone travel**; same-zone movement and preparation durations are still undecided (do not fill with zero or arbitrary guessed values in code).
- Once ready, set the next activity active and start its finite work interval. Advance until the forever final activity, then batch-settle all remaining elapsed time there.
- While a finite crafting job has **no unprotected ingredients**, its scheduled time still advances, but it generates **no fabricated output or XP**. It then moves to the next step normally. A final forever craft with no ingredients remains selected indefinitely without falsely granting products or resetting the queue.
- Starting from an entirely new character has no previous work cycle to finish. Initial movement/preparation rules remain part of the separate transition design.

## Offline performance

**Yes: time-bounded queues are efficient** when every activity has a bounded bulk-settlement calculation. The current engine's `settle` already uses arithmetic to calculate completed work cycles without replaying them; resource production uses bounded per-recipe allocation and probability sampling. Integrate queue segmentation into this engine rather than executing every scheduled action.

For a fixed queue of at most five steps, processing cost is proportional to **queue entries and phase boundaries**, not elapsed days or the number of work cycles. A 20-year absence should require at most five activity batches plus a small fixed number of transition computations (subject to the existing loot/recipe calculation work). Do not create daily jobs, per-cycle loops, repeated-time timers, or per-encounter event generation.

On return:

1. Load the saved authoritative **queue, active step, current phase, progress and clock**, and snapshot of effective skills/equipment at logout.
2. Calculate the total unprocessed elapsed time once. For each remaining finite queue step, process only the segment up to its configured deadline, plus at most one unfinished work cycle and its finishing/moving/preparing transition. Apply saved inventory dependencies in chronological order.
3. Settle all remaining elapsed time in one bounded batch of the forever final activity.
4. Apply **OFF-001**: all queued and final work throughout the absence use **effective skill levels and gear from the last offline snapshot**, even when earlier steps earn enough XP to level up. Activate earned levels only upon return, *after* all scheduled work is resolved.
5. Persist the new active/forever state once, and never award anything twice for the same time interval. No player click is required to make the queue advance.

Prefer splitting by actual simulation boundaries, not subtracting all finite task durations blindly: completing the last work cycle, waiting for travel and readiness, depleted ingredients, and saved partial progress all matter. A short offline period may end in the middle of any transition or activity.

**Complexity:** `O(Q × (phase work + bounded recipe/loot work))`, with `Q <= 5`. No asymptotic dependence on 20 years, assuming each underlying task resolves in a bounded batch. For future combat, this guarantee additionally requires a bounded bulk estimator (not replaying individual fights).

## Save/data contract for implementation

Preserve browser-local existing character data and migrate old saves without resetting the character. A potential shape, **not yet a final save schema**:

```js
{
  queue: [
    { activity: "mining", durationMs: 2 * 60 * 60_000 },
    { activity: "alchemy", durationMs: 24 * 60 * 60_000 },
    { activity: "fishing", durationMs: null } // forever, always last
  ],
  queueIndex: 0,
  productiveElapsedMs: 0,
  transition: null // or the phase structure of ACTIVITY_SWITCH_SPEC
}
```

Use **nonnegative safe integer milliseconds** internally, validate known activity IDs and enforce length 1–5, exactly one Forever as the final entry, finite units only in the 1–8 hour/day set, valid index, progress and phase. Handle malformed saves safely without losing existing inventory/XP; reject maliciously oversized queue inputs. The shown `durationMs` is not sufficient alone to describe an already-in-progress transition: preserve the transition phase and its exact progress as defined in the switch specification.

No player-to-player trading, server-scheduled job, network polling, global account dependency or login-triggered queue restart is needed for the first prototype.

## Suggested small verified patches

1. **Pure queue/state validation + tests:** migrate existing saves, model 1–5 steps and permitted finite durations with a forced forever final step, validate serialization and no-op edits. No UI wiring or assumed travel/preparation values.
2. **Transition settlement + tests:** finish a partial cycle, cross-zone movement, preparation, append/advance, depleted materials, offline frozen skill levels and exact-once rewards. Do not deploy this step until missing duration values are approved.
3. **UI + integration tests:** Start → Do it for (1–8, hours/days, Forever); queue list, mobile controls, accessibility and phases. No live clocks/timers.
4. **Long-duration verification:** 20-year and 100-year examples, multiple settlement calls, reloading in the middle of each phase, clock rollback, level threshold during first task, inventory produced by one task used by the next, performance bounded by queue size. Check final PR-head CI, main merge and live Pages separately.

## Outstanding owner decisions (do not silently guess)

- Whether the configured interval measures productive work only (recommended) or includes transition time; and if **Do it for** is set on an already-running activity, whether its duration starts at that edit or includes time worked before it.
- Same-zone movement time, nonzero preparation duration and whether a first-ever Start requires the same preparation.
- Queue edit/reorder/cancel policy after it has already started; transition-target change policy from ACTIVITY_SWITCH_SPEC.

Until these are decided, this document records the approved **queue rules and efficient calculation plan**; it does not claim that the current playable game already has the queue.
