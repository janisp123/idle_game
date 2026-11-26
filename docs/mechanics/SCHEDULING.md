# Work cycles, schedules, offline settlement and save migration — IMPLEMENTED (alpha)

AUTO-MASTER-001 candidate (PR #191): foreground automatic claims/gear upgrades at committed boundaries, offline frozen cap remains, and login processes claims after absence. Existing finite wagons end at cap even online. Historical explicit-confirmation wording below is superseded on release.

APPRENTICE-A3 retains the existing save schema and ownership. Within the same rules version the frozen bout behavior is unchanged; unpaid bouts spanning the balance release use the new resolver and opponent/prize tables. Historical combat rules are not versioned in this early alpha. No automatic save reset or duplication of previously paid prizes is introduced.

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

A route has **1–3 distinct activities**, currently `MAX_WAGONS=3`. The final wagon always has `plannedMs:null` and remains selected **Forever**; it pauses when its current XP bar fills. Earlier wagons can have:

- A finite duration `n × unit`, where `n` is an integer in `SCHEDULE_BALANCE.minDurationUnits…maxDurationUnits` (currently **1..8**) and `unit` is **minutes, hours or days** (minutes offered in alpha UI). These are **productive** intervals, not wall time including switching.
- `plannedMs:"untilLevelUp"`: stop at the **first completed work cycle** where the skill XP bar is full. Does **not** level automatically or pay Master tribute.

For a finite wagon, accrue `productiveElapsedMs` only while it actually works; when the configured period ends, preserve the already earned resources, finish the current incomplete full work cycle, then transition to the next route item. An edit to a running wagon's duration restarts its planned productive window from the edit, without deleting already earned XP/items. CAP-001: every finite wagon ends early at full XP; the final Forever wagon remains selected but rewards pause at cap.

`validPlannedDuration(ms)` accepts exactly integer values `n × 60,000`, `n × 3,600,000`, or `n × 86,400,000`, constrained by `SCHEDULE_BALANCE`. The planner and existing queued-wagon editors **both generate amount choices** from the same `SCHEDULE_BALANCE` values. Do not duplicate a `1..8` list in HTML.

When only one Forever wagon exists, scheduling a new finite activity inserts it **before** the old Forever (old task resumes afterwards). With a current finite wagon, the newly inserted finite task precedes the existing Forever. Future-only changes do not reset active work. Changing current job performs a new transition, preserving earned gains. Queue slots may be reordered; slot duration remains with the slot.

### Offline and `untilLevelUp` efficiency

The engine processes route boundaries chronologically with a small, **fixed upper bound** on segments, independent of offline years. Each finite/Forever chunk is settled in bulk. To find readiness, it tests whether XP+resources are possible by the end of the available full cycles, then binary-searches for the **first eligible full cycle**, using **repeatable seeded randomness across probes** so the condition is monotone. Ingredient depletion blocks progress until resources really exist; no phantom items.

There is no calendar-based offline time cutoff. CAP-001 stops all rewards, including attribute effort, material stocks, crafting and arena coins/expertise, at one full current-level XP bar. Timed and readiness wagons automatically advance at cap; the final wagon pauses. Effective **skill levels, attributes and the entire combat character/equipment snapshot stay frozen** during an absent batch (OFF-001). Equipment changes settle prior earned time under the old gear before starting a new duel. The Skill Master still requires player confirmation.

## Saves and migration

- `SAVE_KEY = "idle-game-prototype-v1"` stays the same. `readSave` on the pending A8 branch accepts V15 (the live GLAD-005 release still uses V11). Earlier alpha saves start fresh with a reset notice on eventual release.
- Saved values include individual skill XP/levels, `attributeEffort`, items, current activity, partial work, transition phase, wagon route, productive-period progress, timestamp, and `combatSession`.
- Current-build progress across timing-profile changes is scaled **proportionally** to preserve the fraction of the unfinished work cycle or transition phase. Item totals, skill levels, XP and routes are not reset.
- Inventory is available to eligible recipes. Skill Master action deliberately forfeits the selected skills' output resources only after confirmation.
- This is **browser localStorage**, not backed up or synchronized. The app is not anti-cheat-secure; a future authoritative multiplayer server requires a separate system.

## What to edit and what needs extra work

- Cycle speed / travel durations: `TIMING_PROFILES`; preserve the normal profile when altering alpha tests. Updating a saved timing profile requires migration/regression checks, not just new constants.
- Work-cycle rewards/XP: a particular `ACTIVITIES` record; for universal XP variation/efficiency: `SKILL_BALANCE`.
- Offered duration amounts: `SCHEDULE_BALANCE` (shared with UI); changes to previously valid plans can invalidate old saves, so **extend/backward-compatibly migrate** rather than shrink carelessly.
- Number of queue slots: `MAX_WAGONS` is centralized **but not an isolated balance change**—the current UI layout, three-wagon tests and settlement iteration bounds assume three. Increasing this requires a separate tested structural/UI change. Do **not** casually set 5 and assume it works.
- Phase ordering, offline freeze, explicit Skill Master gate and selected final wagon are **core invariants**, not balance numbers.

## A3 expertise and offline settlement (draft)

Saved expertise earned/active maps and the session's actual frozen training kit keep weapon and armour practice separate from general activity skill. Only completed productive bouts earn expertise, excluding resurrection; A7 makes the current bout immutable, so ordinary gear changes or departure cannot abandon it. Every completed bout credits its saved kit, not newly selected equipment. `settle` uses the saved active map for the whole absence. Return/visible tick publishes earned practice, which changes effective equipment at the next completed bout boundary while retaining the old bout outcome, prize cursor, seed and other frozen stats. A settlement may split at one extra boundary, with each bounded arena segment; no replay per level or hour. Twenty-year split/reload and duplicate-credit tests passed. V13 saved maps and kit validate shape and bounds. See [ARMOUR.md](ARMOUR.md).


## A7 — immutable arena bouts (verified in draft)

V14 saves store earned and active attribute effort separately and bank fractional Fighting work on departure. Return/visible tick publishes attributes and expertise, never inside offline settlement. The current bout including recovery retains its kit, grade, stats, seed, prize cursor and practice attribution. At the next boundary the chosen kit/grade and published attributes/skills/expertise apply together. Settlement splits at most once per activity segment. Fighting departure finishes the actual bout, banks partial skill-cycle progress, then travels/prepares; returning restores the fraction. Noncombat transitions unchanged. No added cooldown or discarded earned prizes. V14 alpha reset on eventual release. Max Stats follows the same boundary rule.


A7 code head 81d0c5c passed all four workflows, including 109 game/UI and 13 systems tests. The split-absence regression now uses settle for intermediate checkpoints rather than enterGame (an actual return legitimately activates earned attributes). No live deployment or real browser smoke yet.


A8 advances V14 to V15 solely to prevent old frozen bouts being replayed under changed physical combat formulas. No offline architecture changes in A8; A7 immutable-bout rules remain. No live reset until eventual alpha release.


## CAP-001 bounded cap settlement

The engine first determines whether a full XP bar is even reachable within a segment. Ordinary ticks below that bound use the normal batch calculation. For possible cap crossings, freeze two XP RNG draws and replay resource RNG draws in pure probes; bound the first probe by worst ordinary XP efficiency and maximum arena downtime, and binary-search the first rewarding cycle (or first actual productive millisecond for arena resurrection). Cache immutable arena outcomes per frozen snapshot/seed during the probes only; do not persist cache or duplicate formulas. Commit only the winning probe. A capped final activity advances its wall clock but not productive time; an unfinished combat clock remains paused until the Master advances Fighting. Capped departure skips finishing and discards only an unfinished bout; completed prizes and practice remain exact-once. A timed wagon ending before its cap still finishes an incomplete action as before, unless the cap is reached first. V16 save schema/earned inventory and rewards retained. Batch variation was already not exact per-cycle random replay; cap probes are deterministic within their own batch, not a promise of identical random samples for arbitrary split boundaries.
