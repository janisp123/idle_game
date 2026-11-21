# Activity switching — three-phase transition specification (GAME-004)

**Status:** Owner-approved behavior, implementation specification only; **not implemented**.
**Recorded:** 2026-11-21 by chat. Applies to manual activity selection. The latest three-wagon Forever-last queue behavior is specified in [ACTIVITY_QUEUE_SPEC.md](ACTIVITY_QUEUE_SPEC.md); neither switching nor queued execution is implemented yet.
**Source of truth:** `docs/DECISIONS.md` ACT-SWITCH-001, SWITCH-TIMING-001, QUEUE-002, ZONE-001, WORK-001, OFF-001, UI-TIME-001 and this task's entry in `docs/TD_LIST.md`.

## Player experience (approved behavior)

Each activity row places a distinct **Start** button immediately **after the activity name**. Clicking the row or browsing categories should not silently switch activities. Starting a different activity queues an actual, time-consuming transition instead of teleporting:

1. **Finishing current activity** — the character completes their current full work cycle (if one is running), retaining that cycle's eligible reward/XP. They do **not** begin another cycle of the old activity.
2. **Moving to new location** — travel takes real simulation time; different-zone movement must respect **ZONE-001: five real minutes for the zone change**.
3. **Getting ready to start new activity** — preparation takes real simulation time, then the new activity begins its first work cycle.

On the click, show a **separate transition progress bar** (not the ordinary activity bar) with the exact current phase text above or beside it. Update the text/progress as phases advance. No countdown, elapsed time, ETA, timestamps or numeric durations appear on the player screen, per UI-TIME-001. A percentage is optional internally but should not be written as time text. The original activity progress bar is hidden/replaced while transitioning, not confused with travel progress. No required popup. On completion, replace the transition bar with the new activity's normal progress bar, and log the switch in Chronicle.

**Cases without a current activity:** Skip the non-applicable finishing phase and unknown-origin travel, but do **2 minutes of preparation** before the first activity. A Start press on the already-running activity is a no-op (no free restarts or lost cycle progress). Swapping a *different* activity into wagon 1 is a real change and restarts movement/preparation.

## Timing and state-machine contract

State machine:

```text
RUNNING(old)
  -- Start(new) --> FINISHING(old)
  -- old cycle completed --> MOVING(new)
  -- location reached --> PREPARING(new)
  -- preparation completed --> RUNNING(new)

IDLE -- Start(new) --> MOVING/PREPARING(new) --> RUNNING(new)
```

- **FINISHING:** use the old activity's existing complete-cycle duration and saved `progressMs`; only the remaining portion of **one** cycle elapses. Award its actual output/XP once, honoring protected and depleted ingredient rules. An activity with no supplies still consumes its remaining finishing-cycle time but fabricates nothing.
- **MOVING:** movement to a different zone is exactly `ZONE_TRAVEL_MS = 5 * 60_000`; switching jobs within the same zone is **1 minute**. These are alternative total move durations, not additive. Activities currently have a `zone` label rather than detailed sublocations.
- **PREPARING:** one **2-minute** interval for equipment/readiness, including the first-ever activity. Do not add gear durability or equipment selection mechanics as part of this feature.
- Only after all applicable phases is `state.activity` changed to the new activity. Its work progress starts at zero. No reward or XP is earned during moving/preparing.
- **A fixed, predictable switch policy** is preferred over pathfinding or per-activity travel formulas; do not silently invent a value that conflicts with five-minute cross-zone travel.
- Use a **different progress bar and state name** for each transition phase; keep the same overall UI region and accessible live announcement.

### Proposed save representation (implementation guidance, not a committed schema)

Use the existing `activity`, `progressMs`, `settledAtMs` and a single optional serializable transition object, e.g.:

```js
transition: null | {
  targetActivity: "highway_robbery", // existing ACTIVITY id
  phase: "finishing" | "moving" | "preparing",
  phaseProgressMs: 0
}
```

No extra location object is needed initially: the existing `ACTIVITIES[id].zone` identifies a region. In `finishing`, the existing `progressMs` is authoritative for the current work cycle; after it ends, `phaseProgressMs` tracks travel/readiness. Validate activity IDs, phases and nonnegative finite/safe progress values on save load. Future save versions must **migrate older local saves without deleting inventory, XP, current activity, saved progress or protection settings**. A transition must survive refresh, browser close, another tab, and years offline. Never trust client clock rollback to award extra progress.

## Exact engine behavior and integration points

Current code switches instantly in `site/play/engine.mjs:chooseActivity` by resetting work progress. The future patch must **not** call that instant-switch path on Start.

- Introduce a pure `requestActivityChange(state, targetId, now)` (name illustrative), settling completed old work up to the click and then registering one pending target.
- Advance through phase boundaries inside `settle` (or a pure, tested transition-settlement helper). Split large elapsed intervals **at most once per pending transition**, then resolve the long remainder in the target activity with the existing bounded arithmetic. Do not run a timer per action or replay 20 years of cycles.
- On finishing: settle **only** the remaining fraction of one old work cycle, then avoid further old-work rewards. On travel/preparation: advance clock/progress but no XP/items. After preparation: carry remaining elapsed time into the newly selected activity.
- Respect **OFF-001**: during any offline catch-up that crosses the switch, *both* old and new activity use the saved **pre-return effective skill levels**, even if the old finishing reward crosses an XP level threshold. Apply effective level changes only on return, after all elapsed work has been resolved.
- Use existing safe inventory counters, reward allocation, ingredient protection, clock validation and save idempotency. Never duplicate rewards when settling the same timestamp repeatedly.
- An existing activity requires at least one remaining cycle to finish; do not grant the old cycle reward immediately at Start unless it was already complete by that timestamp.
- This manual-switch patch does **not** itself implement queued scheduling, accounts or terrain. The separate [ACTIVITY_QUEUE_SPEC.md](ACTIVITY_QUEUE_SPEC.md) supersedes the old looping/five-slot queue: at most **three wagon slots**, last activity Forever. A swap that changes wagon 1 restarts movement/preparation without resetting the unfinished old work cycle or deleting earned resources/XP.

### UI implementation notes

- `site/play/app.mjs`: the current activity tile is one clickable `button.activity` with `beginActivity` on the whole tile. Refactor to a **non-clickable activity row/card with a separate Start button after the title**; never nest a button inside another button. Preserve category navigation, keyboard access, readable touch targets and existing skill/reward labels.
- `site/play/index.html`: place a transition label and dedicated progressbar near the activity art/progress area; use a distinct ID, `role="progressbar"`, meaningful `aria-label`, `aria-valuemin/max/now`, and phase text. Hide the normal work progress while transitioning.
- `site/play/game.css` / `iron-ui.css`: style Start and a visually distinguishable transition bar consistent with the existing grimdark UI; no CSS-driven clock authority.
- During a transition, wagon 1 displays the **chosen destination** and a clear **Changing to** status until the new activity is actually working. **Wagon 1 can be swapped even during a transition**: finish the original old work cycle once, then restart movement and the 2-minute preparation for the new destination. If already moving/preparing, discard only unfinished transition-time progress. Future-wagon swaps do not affect current movement. Selecting the unchanged first wagon is a no-op.
- Chronicle displays completed work and the completed switch, without a modal or duplicated welcome-back report.

## Small implementation patches (future coding — each separately verified)

1. **Engine + tests:** transition state, safe persistence/migration, request and deterministic phase advancement, same-zone 1-minute/cross-zone 5-minute movement and 2-minute preparation, bounded long-absence settlement, wagon-1 retargeting and idempotency.
2. **UI + smoke tests:** Start beside activity name, phase text and distinct bar, mobile/keyboard/ARIA support, no time labels or surprise row-click switch.
3. **Integration + release:** full game/Pages CI; tests across resource exhaustion, same/different zone, no active task, logout mid-phase, 20-year absence, skill threshold crossing, multiple tabs, backward time and repeated settlements. Verify deployed page separately, then mark this subtask implemented; keep queue execution open until independently implemented and verified.

## Confirmed switching values and remaining UI details

- **Movement:** 1 minute for same-zone switching or 5 minutes total for cross-zone movement.
- **Preparation:** 2 minutes, including first Start (no inferred initial travel location).
- **Scheduled duration:** productive work begins after readiness, so travel/preparation are outside the configured 1–8-hour/day interval. If a player sets a new duration on an already-running activity, count that interval from the edit.
- **Wagon swaps:** moving a different wagon into slot 1 restarts movement/readiness while preserving the old finishing cycle and all previously earned progress; future-only reorder is free.
- Deleting a wagon/clearing a whole queue still requires a safe, non-destructive UI treatment; do not add an instant reset shortcut.

This is an **approved implementation specification, not a claim of deployed gameplay**. UI-TIME-001 forbids showing live clocks, even though a configured duration can be selected.
