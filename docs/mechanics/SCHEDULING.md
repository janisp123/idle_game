# Work cycles, schedules, offline settlement and save migration — IMPLEMENTED (alpha)

**Source/tuning:** [engine.mjs](../../site/play/engine.mjs) → `TIMING_PROFILE`, `TIMING_PROFILES`, `BASE_CYCLE_MS`, `SCHEDULE_BALANCE`, `MAX_WAGONS`, `ACTIVITIES`, `UNTIL_LEVEL_UP`, `settle`, `readSave`. The planner UI is [app.mjs](../../site/play/app.mjs).

## Work and transition durations

The active `TIMING_PROFILE` is currently **alpha**; switch to **normal** in the one engine setting after owner approval and with regression tests. The *normal* raw work duration for an activity is:

`normalWorkDurationMs = round(ACTIVITIES[id].baseMinutes × BASE_CYCLE_MS / ACTIVITIES[id].speed)`, `BASE_CYCLE_MS=60,000`.

`ACTIVITIES[id].durationMs = TIMING_PROFILES[active].workCycleMs ?? normalWorkDurationMs`.

| Phase | Active alpha | Preserved normal |
| --- | ---: | ---: |
| Each activity's full work cycle | **10 s** | Per-activity duration formula above (e.g. Mining 15 min) |
| Move same zone | 5 s | 1 min |
| Move different zone | 5 s | 5 min |
| Prepare after moving | 5 s | 2 min |
| First-ever preparation, with no origin travel | 10 s | 2 min |

**Changing activities is a real transition:** (1) finish the current **full work cycle** if partially complete; (2) move; (3) prepare. The next activity can produce rewards only after preparation. No free items/XP or attribute effort during moving/preparation. A transition may cross a browser close, and the partial phase is saved.

## Work settlement in batches, not individual actions

Given prior unfinished cycle progress `p`, elapsed **productive** time `t`, and activity full cycle duration `d`:

```text
completedCycles = floor((p + t) / d)
nextProgressMs = (p + t) mod d
```

The engine resolves skill XP, material outputs, attribute effort and (for Fighting) the observation clock for the batch. It never loops through every work cycle, even during many offline years. Genuine inventory limits still apply to crafting. Every settlement sets `settledAtMs` forward, preventing duplicate rewards for the same saved interval; backwards device-clock changes cannot grant extra progress.

**Combat note:** the independently saved `combatSession.elapsedMs` increases during Fighting's productive interval, while it reconstructs **only the currently displayed bout**. It is *not* the 10-second alpha work cycle and it does not produce fake kill-history totals.

## Three-wagon schedule

A route has **1–3 distinct activities**, currently `MAX_WAGONS=3`. The final wagon always has `plannedMs:null` and runs **Forever**, including after arbitrarily long absences. Earlier wagons can have:

- A finite duration `n × unit`, where `n` is an integer in `SCHEDULE_BALANCE.minDurationUnits…maxDurationUnits` (currently **1..8**) and `unit` is **minutes, hours or days** (minutes offered in alpha UI). These are **productive** intervals, not wall time including switching.
- `plannedMs:"untilLevelUp"`: stop at the **first completed work cycle** where the *same* Skill Master readiness predicate is true: one full XP bar **and** required eligible output resource(s). Does **not** level automatically or pay Master tribute.

For a finite wagon, accrue `productiveElapsedMs` only while it actually works; when the configured period ends, preserve the already earned resources, finish the current incomplete full work cycle, then transition to the next route item. An edit to a running wagon's duration restarts its planned productive window from the edit, without deleting already earned XP/items. The final Forever wagon continues indefinitely.

`validPlannedDuration(ms)` accepts exactly integer values `n × 60,000`, `n × 3,600,000`, or `n × 86,400,000`, constrained by `SCHEDULE_BALANCE`. The planner and existing queued-wagon editors **both generate amount choices** from the same `SCHEDULE_BALANCE` values. Do not duplicate a `1..8` list in HTML.

When only one Forever wagon exists, scheduling a new finite activity inserts it **before** the old Forever (old task resumes afterwards). With a current finite wagon, the newly inserted finite task precedes the existing Forever. Future-only changes do not reset active work. Changing current job performs a new transition, preserving earned gains. Queue slots may be reordered; slot duration remains with the slot.

### Offline and `untilLevelUp` efficiency

The engine processes route boundaries chronologically with a small, **fixed upper bound** on segments, independent of offline years. Each finite/Forever chunk is settled in bulk. To find readiness, it tests whether XP+resources are possible by the end of the available full cycles, then binary-searches for the **first eligible full cycle**, using **repeatable seeded randomness across probes** so the condition is monotone. Ingredient depletion blocks progress until resources really exist; no phantom items.

There is no **offline time cap** or mandatory daily login. Attribute effort and item stocks continue without an XP-level cap; skill XP stops at one current-level bar. Effective **skill levels, attributes and the entire combat character/equipment snapshot stay frozen** during an absent batch (OFF-001). Equipment changes settle prior earned time under the old gear before starting a new duel. Existing V7 sessions lacking the new gear snapshot still use their original no-gear duel rules, not retroactive bonuses. The Skill Master still requires player confirmation.

## Saves and migration

- `SAVE_KEY = "idle-game-prototype-v1"` is unchanged for migration. Current `GAME_VERSION=7`; `readSave` accepts older versions 1–6 with validation, and preserves current V7 saves. Optional V7 armour data is migrated from the old iron/cloth/hood labels to the new four-tier selectable gear without dropping progress.
- Saved values include individual skill XP/levels, `attributeEffort`, items, current activity, partial work, transition phase, wagon route, productive-period progress, timestamp, and `combatSession`.
- Old progress across timing-profile changes is scaled **proportionally** to preserve the fraction of the unfinished work cycle or transition phase. Item totals, skill levels, XP and routes are not reset.
- Old protection flags are **validated then discarded**. No resource-lock system. Skill Master action deliberately forfeits the selected skills' output resources only after confirmation.
- This is **browser localStorage**, not backed up or synchronized. The app is not anti-cheat-secure; a future authoritative multiplayer server requires a separate system.

## What to edit and what needs extra work

- Cycle speed / travel durations: `TIMING_PROFILES`; preserve the normal profile when altering alpha tests. Updating a saved timing profile requires migration/regression checks, not just new constants.
- Work-cycle rewards/XP: a particular `ACTIVITIES` record; for universal XP variation/efficiency: `SKILL_BALANCE`.
- Offered duration amounts: `SCHEDULE_BALANCE` (shared with UI); changes to previously valid plans can invalidate old saves, so **extend/backward-compatibly migrate** rather than shrink carelessly.
- Number of queue slots: `MAX_WAGONS` is centralized **but not an isolated balance change**—the current UI layout, three-wagon tests and settlement iteration bounds assume three. Increasing this requires a separate tested structural/UI change. Do **not** casually set 5 and assume it works.
- Phase ordering, offline freeze, Skill Master gate and never-ending final wagon are **core invariants**, not balance numbers.
