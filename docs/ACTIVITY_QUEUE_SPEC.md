# Three-wagon activity queue — final wagon forever (GAME-004)

**Status:** Owner-approved design and implementation guidance, **not implemented in the playable game**.
**Updated:** 2026-11-21 by chat. **Supersedes** the earlier five-slot/looping queue designs.
**Related:** [ACTIVITY_SWITCH_SPEC.md](ACTIVITY_SWITCH_SPEC.md), [DECISIONS.md](DECISIONS.md) QUEUE-002 / SWITCH-TIMING-001 / ACT-SWITCH-001 / OFF-001 / ZONE-001 / UI-TIME-001, and [TD_LIST.md](TD_LIST.md) GAME-004.

## The three small old wagons (owner-approved)

The queue is pictured as **one to three compact, connected, old wooden wagons in the established grimdark style**, **above the current activity panel**. Their sequence conveys the future route, with readable titles and touch-friendly reorder controls on mobile. Reuse existing painted/worn materials; actual artwork and CSS still need implementation.

- **Wagon 1** = the active work / immediate destination when already transitioning. Clearly show **Changing to …** while travelling so the game never falsely claims the new job is already producing.
- **Wagon 2** = the next job, if present.
- **Wagon 3** = the final job, if present. **Whichever wagon is last always runs Forever.** With only one wagon, it is both current and Forever; with two, wagon 2 is Forever.
- No loop, automatic stop at the end, required login, daily check-in, server scheduler, idle-expiry, or limit on the final wagon's offline duration.
- Clicking an activity's separate **Start** button selects/adds a job. **Do it for** applies only to jobs that have another wagon after them: integers **1–8 Hours** or **1–8 Days**. Show **Forever** on the last wagon. Configured duration labels are planning data, **not** running clocks.
- When adding a third wagon, the previously last Forever job must become finite; retain or ask for its allowed duration rather than producing a hidden/unreachable middle Forever entry. Do not accept a fourth wagon.

Illustrative layout, not artwork:

```text
 [ old wagon 1: Mining · 2 hours ] — [ old wagon 2: Cooking · 1 day ] — [ old wagon 3: Hunting · FOREVER ]
                                 CURRENT ACTIVITY PANEL
```

The wagon strip can be horizontally scrollable on narrow phones rather than shrinking text and controls until unusable. A swipe/drag or explicit swap/reorder control must work with touch, mouse and keyboard. Avoid a heavyweight game-map subsystem.

## Previously suggested policies approved when consistent with wagons

- **Changing jobs takes real time:** first finish the currently running full work cycle; then **Moving to new location**; then **Getting ready to start new activity**. Display the **separate phase progress bar** and names, not a clock or countdown. Preserve that last cycle's earned goods/XP once.
- **Movement:** **1 minute within the same zone**; **5 minutes between different zones** (ZONE-001). Do not stack 1 + 5 minutes for cross-zone moves.
- **Preparation:** **2 minutes** for equipment/readiness after moving; the first-ever Start also requires 2 minutes of preparation. On a completely new character with no known previous zone, preparation applies, but do not invent a travel origin.
- **Scheduled duration = productive time**, starting once the job actually begins, **excluding** preceding finishing/moving/preparation. Once the configured productive period ends, finish the current work cycle before leaving. If materials are unavailable, productive time still passes but the job invents no output/XP.
- **Editing Do it for on an already-running job** counts the chosen duration **from the moment the player makes that selection**, not from when they originally started the activity. Settle work up to the edit first.
- **Future wagons may be rearranged freely**, with no immediate travel cost when wagon 1 does not change; apply the new order to work that has not happened yet. Already completed work remains earned.

## Reordering including wagon 1 (owner-approved)

**Wagons are swappable.** Changing wagon 1 changes the character's immediate destination and **restarts travel and readiness**, rather than teleporting or granting free progress.

- Before any edit, settle earned work and any completed phase to the edit timestamp exactly once; do not delete previously earned items/XP or retroactively modify finished activity segments.
- If the character is currently performing a work cycle, **finish that cycle once** before departing; do not grant its reward early. Then apply a **fresh movement phase** based on old and new zones (1 minute same zone, 5 minutes across zones), followed by **a fresh 2-minute preparation**.
- If already moving/preparing when wagon 1 changes, **discard only unfinished transition-time progress**: reset the new destination's **movement phase to its beginning**, then preparation again. Never refund, double-count or duplicate work XP/loot. A pending finishing phase remains the same remaining old work cycle; only the destination changes.
- Future-only reorder (wagons 2 and 3) **does not** restart a current transition or activity. The last position is Forever regardless of what task occupies it after reorder; finite slots must have an allowed duration before committing the new order.
- If a swap exchanges a formerly Forever job with a finite position, use the finite position's existing configured duration as a **visible, editable slot setting**; the new final position becomes Forever. Keep durations visible and avoid hidden defaults. Reordering should not silently override an already elapsed work segment.
- **Changing the first wagon is explicitly permitted while transitioning.** This supersedes the former proposal to disable all Starts until the transition completes. Preserve the existing finishing phase and restart movement/preparation for the changed first wagon.
- Selecting the exact same first wagon is a no-op: no timer reset and no lost progress.
- Other editing operations (deleting a wagon, clearing the queue) need a safe UX policy in implementation; avoid introducing a destructive Reset or silently dropping active work. The owner approved swapping/reordering and editing future durations, not losing completed resources.

This keeps the owner's rule that the first wagon represents the active/selected work while acknowledging that the **new** first wagon cannot produce anything until its switch finishes.

## Offline algorithm: efficient even after 20 years

A dormant character is **not** a running process. Save the queue, selected index/phase, progress, effective skills, inventory and settlement timestamp; on return, settle from that time to the present using bounded mathematics.

1. Process any partially completed old work cycle and transition phase, using its saved progress.
2. Settle the remaining productive time of each finite wagon in **chronological order**. At its productive-time boundary, complete at most one final old work cycle, travel, prepare, and move to the next wagon. Resources produced by earlier wagons become available to later crafting steps. Protected items remain protected.
3. Settle all remaining time in **one bounded batch** of the final Forever wagon, whether one week or 20 years. Do not simulate each action minute by minute.
4. During the whole offline absence, use the **effective skill/equipment levels from logout (OFF-001)**. Accumulate XP and rewards but activate new levels **only on return** after resolving all segments.
5. Save one new, validated state. Repeated settlement at the same timestamp must award nothing twice; clock rollbacks must not create rewards.

**Computation cost:** `O(Q × bounded activity/transition work)`, with `Q ≤ 3` and **no dependency on elapsed offline years**, provided each activity (including any future combat) has a bounded batch/estimator. Three wagons mean at most three scheduled activity batches plus a handful of transition-boundary calculations; multiple UI ticks/save resumes may legitimately split these into more calls over time.

Do not pre-sum five or three independent loot totals without respecting order: one wagon can gather ingredients that a subsequent wagon consumes. No background scheduler, server cron, or daily-login rule is necessary for this local-save prototype.

## Suggested durable state (illustrative, not an implemented save format)

```js
{
  wagons: [
    { activity: "mining", plannedMs: 2 * 60 * 60_000 },
    { activity: "cooking", plannedMs: 24 * 60 * 60_000 },
    { activity: "hunting", plannedMs: null } // last = Forever
  ],
  activeWagon: 0,
  productiveElapsedMs: 0,
  transition: null // or phase + target + elapsed phase milliseconds
}
```

- 1–3 known activities only, **exactly one final Forever**. Finite durations are integers 1–8 hours or 1–8 days. Persist the current work-cycle fraction, phase progress, timestamps, the current zone/old activity when switching, and the saved effective build.
- Check serialization, migration from older saves (no loss of existing inventory/skill XP/name/work/protection), malformed or adversarial queue data, safe integer bounds, clock rollback and multi-tab update races.
- If reordering changes the first wagon, resolve old work before recording the new immediate destination; do not magically transfer old cycle progress to a different activity.

## Small implementation patches (future, **not yet authorized by these docs alone**)

1. **State and tests:** 1–3 wagons, finite/Forever invariants, migration, duration-from-edit semantics, slot reorder validation and clear pending-target semantics. No UI or fake rewards.
2. **Engine and tests:** finish exactly one current cycle, 1/5-minute movement, 2-minute preparation, reset movement on first-wagon swaps, offline boundary segmentation and long-period idempotency.
3. **UI and tests:** aged wagon strip above task panel, Start, Do it for, reorder controls, clear active/destination state, transition labels and progress bar, phone layout, accessibility, no live clocks.
4. **Release checks:** normal browser-game CI, 20- and 100-year settlements, save migration/backward time/double-settlement, skill freeze, material dependencies, cross-zone and same-zone swaps, first-ever Start and in-progress transition reorders. Verify the deployed Pages version **separately** from passing PR CI.

The existing play page still switches activities instantly. These rules are a **completed design decision, not a claim of running gameplay**.
