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

`ATTRIBUTE_IDS = STR, DEX, END`; each starts at `ATTRIBUTE_BALANCE.startingStat=10`.

For productive time `t` milliseconds in activity `A`, each attribute `i` gains persistent effort units `t × weight[A][i]`; each activity's weights must be non-negative integers summing to **100** (zero is omitted). Conversion to XP:

`attributeXP_i = effort_i × xpPerProductiveHour / (3,600,000 × 100)`.

Currently `xpPerProductiveHour=100`, so every productive hour grants a **shared total of 100 attribute XP**, distributed by activity. Training distributes STR 35%, DEX 35%, END 30%, or 35, 35, and 30 XP in one productive hour. Choosing a different activity changes **distribution**, never overall hourly rate.

For `d` full points above the starting attribute, the total XP needed is:

`xpForAttributeValue(start + d) = firstStatPointXP × d + additionalXPPerPoint × d(d−1)/2`.

Current cost parameters are 20 XP for the first point, then +20 XP **per successive point**. Stat level and bar are computed using the closed-form inverse with boundary correction; saved **effort**, not allocated points, is authoritative. Editing `xpPerProductiveHour` or point costs **rebases existing characters**; editing activity weights affects **future effort only**. Changing the overall time budget is different from changing an activity's weight.

**Key invariant:** travel, preparation and waiting are not productive; no stat effort or XP then. Skill readiness does not stop attribute growth. During an offline interval, effective combat stats and activated skills stay frozen at the saved session snapshot (OFF-001), even though attribute effort accumulates.

## Automatic permanent attribute points from claimed activity levels (implemented alpha)

**Each explicitly claimed activity skill level-up adds 1 permanent character attribute point.** All eleven activity levels independently contribute to the same three universal attributes, so players can eventually train every discipline; there is no irreversible manual allocation, character class, respec fee, or random stat roll.

- Starting skill level **1** grants zero extra points. When the Skill Master advances a skill **1→2**, the character gains **one** stat point. The next confirmed advance **2→3** grants another. A level `L` contributes exactly `L−1` mastery points from that activity. A full capped XP bar, offline productive work, a blocked offer, merely returning, or declining the confirmation **never** counts as a claimed skill level.
- The receiving stat is selected automatically and **deterministically** from the existing `ACTIVITY_STAT_WEIGHTS` table. We use a 100-step smooth weighted round-robin schedule: add each stat weight to its deficit, give one point to the eligible stat with the highest deficit (tie break STR/DEX/END), then subtract 100 from the chosen deficit. The schedule repeats every 100 awarded points. Thus every level adds exactly one nonnegative point; the distribution is balanced over time, not a misleading percentage chance or random roll. The direct calculation is bounded even for extremely high skill levels.
- Worked examples **10 claimed levels** (skill level 11): Mining gives **+7 STR, +3 END**.
- Effective stat displayed and used for new combat sessions and armour restrictions:
  `effectiveStat = ATTRIBUTE_BALANCE.startingStat + trainedPointsFromAttributeEffort + Σ masteredPointsFromAllActivities`.
  The physical resolver uses STR for damage, DEX for action order and aim, and END for HP. The character tooltip identifies trained/base points and mastery-added points. The Skill Master confirmation panel previews **+1 [stat]** for every ready skill, then shows a concise success notification.
- The prior time-based training system remains active at **100 total attribute XP per productive hour**, as previously approved; reducing that rate to make mastery the dominant long-term path is **not** done without a deliberate existing-save rebalance. The skill Master still costs exactly its previous capped XP and required spoils, and only one skill level per confirmation; no new mastery item, XP currency, extra resource costs or stat point UI is added.
- **Save compatibility:** bonuses are **derived from already saved activated skill levels**, in current V10 saves. An existing rank 11 Mining save automatically has ten mastery points, but only once; repeated loads cannot double-award. Long absences never auto-advance skill levels and keep combat fighter snapshots frozen under OFF-001. After an explicit Master claim while Fighting, the current duel is refreshed so the new attribute can affect the next fight, after settling prior work under the old snapshot.
- **Balance/migration warning:** changing `ACTIVITY_STAT_WEIGHTS` or `MASTERY_ATTRIBUTE_BALANCE.pointsPerClaimedLevel` would currently **rebase historical derived mastery bonuses for existing saves**. That requires an explicit Owner-approved migration or an earned-point ledger before such a retune, rather than silently rewriting characters. Tune damage and future PvP caps separately; do not allow 3d6 roll modifiers to become absurd at high stats.

**Source of truth:** `site/play/attributes.mjs`: `MASTERY_ATTRIBUTE_BALANCE`, `masteryBonusesForSkill`, `masteryAwardForNextLevel`, `totalMasteryAttributeBonuses`, `effectiveAttributeProgress`; `site/play/engine.mjs:learnFromMaster` and new-combat snapshot; `site/play/app.mjs` for terse Master preview and stat display. Tests cover all eleven weight distributions, nondecreasing rank progression, multi-activity accumulation, current saves, frozen offline power and no-repeat claims.

## Things not implemented

No player-controlled global XP pool, no manual attribute assignment, no account-based progression, no passive defensive combat bonus from `shield_drills` yet. Those require explicitly designed mechanics.

### Per-activity difficulty

Each activity starts at Non-grade (0). F, E, D, C, B, A and S unlock at that activity’s levels 10 through 70 in ten-level steps. A selection persists independently for each activity. Changing the active grade settles elapsed work and starts a new cycle at the selected grade.

For grade index t above zero the provisional target stat is 10 + 4t. The activity-weighted average of effective attributes determines readiness. XP and raw gathering yield multiply by (1 + 0.18t) × min(1, (weighted stat / target)²). Recipe quantities and ingredient costs stay paired. Combat opponents use a fixed same-grade reference build. Older saves default to Non-grade.
