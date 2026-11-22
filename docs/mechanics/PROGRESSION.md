# Progression, XP, stats and Skill Master — IMPLEMENTED (alpha)

**Runtime:** [engine.mjs](../../site/play/engine.mjs), [attributes.mjs](../../site/play/attributes.mjs). **Tune:** `SKILL_BALANCE`, the per-activity `ACTIVITIES` rows, `MASTER_DEFAULT_ITEM_MINIMUM` / `MASTER_ITEM_MINIMUM_OVERRIDES` in engine, and `ATTRIBUTE_BALANCE` / `ACTIVITY_STAT_WEIGHTS` in attributes. No global character level.

## Independent skill XP

Let `L` be the **currently activated** skill level (starts at 1). Current code uses `SKILL_BALANCE.xpPerNextLevel = 40`:

- **XP bar to reach next level:** `requiredXP(L) = xpPerNextLevel × L`. Examples: level 1 needs 40; level 2 needs 80; level 10 needs 400.
- **Historical cumulative XP formula** (used for older-save migration, not current XP banking): `xpForLevel(L) = xpPerNextLevel × (L − 1) × L / 2`; inverse `floor((1 + sqrt(1 + 8 × XP / xpPerNextLevel))/2)`, corrected at rounding boundaries.
- **Productive full work cycles:** `count = floor((progressMs + productiveElapsedMs) / durationMs)`; remainder becomes the next work bar. Partial cycles do not give items or skill XP.
- **Base skill XP per batch:** `productiveCompletedCycles × ACTIVITIES[id].xp × efficiency`, followed by a single independent batch variation and stochastic rounding (below).
- **Awarded skill XP:** `min(requiredXP(L) − savedCurrentXP, max(0, variedBatchXP))`. XP **never banks** beyond one full current-level bar and **never levels automatically**, including after decades offline. Empty-input crafting produces no skill XP.
- **Mastered skill efficiency:** `efficiency = min(maxEfficiency, 1 + max(0, L−1) × efficiencyPerLevel)`, currently `maxEfficiency=2` and `efficiencyPerLevel=0.02` → +2% per activated skill level, capped at 2×. It multiplies skill XP and **basic raw gathering yield**. For crafting the result is limited by genuine ingredients: do not double recipes for free.

### Batch variation (not one roll per cycle)

For each XP or raw material **batch**: `scaled = base × (1 − v + 2v × U)`, where `v = SKILL_BALANCE.batchVariation = 0.10`, `U` is uniform on `[0,1)`. Award `floor(scaled) + (U₂ < fractionalPart(scaled) ? 1 : 0)`. These are independent random rolls per total; **not** exact per-action randomness. Long absences can therefore be computed in bounded work.

## Skill Master gate and sacrifice

- `xpReady = savedCurrentXP >= requiredXP(L)`.
- `resourcesReady = sum(eligible owned outputs) >= requiredItemMinimum`. Default is **1 across all outputs** for producing activities, **0** for XP-only activities; per-skill overrides exist.
- `ready = xpReady && resourcesReady`. Scheduler `untilLevelUp` uses **exactly the same** predicate.
- On explicit player confirmation, **each eligible skill gains exactly one level** and its current XP resets to 0. **ALL currently owned output resources** for every advanced skill (including rare variants) are surrendered. Unrelated inventory is untouched. No auto-visit, permanent save penalty, trading or currency.
- Changing XP cost or Master minimum is a **game-design and existing-save migration decision**, not a harmless visual change. See [checklist](CHANGING_BALANCE.md).

## Five uncapped time-based attributes

`ATTRIBUTE_IDS = STR, DEX, END, INT, WIL`; each starts at `ATTRIBUTE_BALANCE.startingStat=10`.

For productive time `t` milliseconds in activity `A`, each attribute `i` gains persistent effort units `t × weight[A][i]`; each activity's weights must be non-negative integers summing to **100** (zero is omitted). Conversion to XP:

`attributeXP_i = effort_i × xpPerProductiveHour / (3,600,000 × 100)`.

Currently `xpPerProductiveHour=100`, so every productive hour grants a **shared total of 100 attribute XP**, distributed by activity. Example Fighting: STR 30%, DEX 35%, END 25%, WIL 10%; one productive hour produces 30, 35, 25, 0, 10 attribute XP respectively. Choosing a different activity changes **distribution**, never overall hourly rate.

For `d` full points above the starting attribute, the total XP needed is:

`xpForAttributeValue(start + d) = firstStatPointXP × d + additionalXPPerPoint × d(d−1)/2`.

Current cost parameters are 20 XP for the first point, then +20 XP **per successive point**. Stat level and bar are computed using the closed-form inverse with boundary correction; saved **effort**, not allocated points, is authoritative. Editing `xpPerProductiveHour` or point costs **rebases existing characters**; editing activity weights affects **future effort only**. Changing the overall time budget is different from changing an activity's weight.

**Key invariant:** travel, preparation and waiting are not productive; no stat effort or XP then. Skill readiness does not stop attribute growth. During an offline interval, effective combat stats and activated skills stay frozen at the saved session snapshot (OFF-001), even though attribute effort accumulates.

## Things not implemented

No player-controlled global XP pool, no manual attribute assignment, no account-based progression, no passive defensive combat bonus from `shield_drills` yet. Those require explicitly designed mechanics.
