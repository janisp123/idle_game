# Drops, rarity and crafting — IMPLEMENTED (alpha)

**Source/tuning:** [loot.mjs](../../site/play/loot.mjs) → `LOOT_TABLES`, [production.mjs](../../site/play/production.mjs) → `PRODUCTION_RECIPES`, [engine.mjs](../../site/play/engine.mjs) → `ACTIVITIES[id]` and `SKILL_BALANCE`. This is resource generation, **not simulated animal combat**.

## Total raw spoils

For one settlement batch of `N` full work cycles, `baseSpoils = N × ACTIVITIES[id].yield × skillEfficiency` (currently every resource-producing activity has base yield `1`). Calculate the batch's +/-10% varied total and stochastic integer rounding as documented in [Progression](PROGRESSION.md). There is **no per-cycle RNG replay** after a long offline absence.

For gathering activities with a `LOOT_TABLES` entry, split that *fixed resulting total* among eligible rarity tiers. Rare items **replace** common items; never give free extra items. For other raw activities use the ordinary `item`. Resource-free training, leisure, Fighting → zero item stacks, although those activities still earn skill and attribute XP.

## Weighted rarities / tier unlocks

Each row defines `{ item, label, minLevel, weight, growth, cap }`. The tier is eligible iff **activated skill level** `L >= minLevel`.

```text
weightAtLevel(t, L) = min(t.cap, t.weight + max(0, L − t.minLevel) × t.growth)
chance(t, L) = weightAtLevel(t, L) / sum(weightAtLevel(eligible tiers, L))
```

For a concrete mining example, at activated level 2: Stone weight 100, Copper ore weight 10 → Stone chance **100/110**, Copper chance **10/110**. At level 1, only Stone unlocks. At level 10 Iron ore becomes eligible. The table itself controls level thresholds and how probabilities change; do not hand-code tiers into the UI.

**Allocation:** `allocateLoot` samples higher tiers first, from the `remaining` batch with conditional probability `chanceTier / remainingChanceMass`; common stock takes the remainder. All output counts are **nonnegative integers summing to the original total**.

**Sampling costs / approximation:** `sampleBinomial` uses exact Bernoulli draws for counts `<= 64`; for larger counts uses a bounded Poisson approximation if `mean = count × chance < 12`, otherwise a rounded, clamped Gaussian with mean `count × chance` and variance `count × chance × (1−chance)`. This is **approximate** for large batches (not mathematically exact per-item loot history). Those thresholds are algorithm-selection constants, not item rarity balance. Keep this accuracy tradeoff explicit if changing the sampler.

## Ingredient-limited crafting

`PRODUCTION_RECIPES` entries define `{input, output, label, minLevel, weight, growth, cap}`. Example: Smelting Copper ore → Ingot at level 1; Iron ore → Iron ingot at level 10; Silver ore → Silver ingot at level 25. Alchemy/Carpentry/Masonry/Cooking each have one input→one output initially.

1. Filter to **unlocked** recipes with `inventory[input] > 0`.
2. `capacity = min(fullWorkCycles, sum(available eligible inputs))` (computed with bounded sums).
3. For each eligible recipe, `recipeWeight = min(cap, weight + (L−minLevel) × growth)`. Allocate quotas with weighted, bounded binomial draws, respecting each `inventory[input]`.
4. Redistribute any quota overflow to other inputs with spare eligible inventory; do not discard usable capacity just because a preferred ingredient ran out.
5. Each completed recipe **consumes one actual input and produces one output**. `completed = sum(consumed counts) = sum(created counts) <= capacity`.
6. Only *completed*, ingredient-backed cycles award skill XP; time spent on empty ingredients still earns attribute XP. Old inventory and outputs remain exact; no protection toggles or resource fabrication.

**Important:** `SKILL_BALANCE.maxEfficiency` applies to XP and **raw gathering**. It does **not** turn a single iron ore into two iron ingots. Production does not take the raw ±10% spoil variation.

## Edit one thing at a time

- Change an item's unlock rank, weight/growth/cap: edit only its `LOOT_TABLES` row, run tier tests and sampled distribution checks.
- Change input/output unlock or crafting preference: edit `PRODUCTION_RECIPES`; add corresponding inventory/output labels through current module-derived mapping. Check shortages and conservation.
- Change base XP or work duration: edit the specific `ACTIVITIES` row, **not** loot/crafting equations.
- Change overall +/- variation or skill level efficiency: `SKILL_BALANCE` in engine.
- Adding a new item or changing keys is a **save-schema migration task**, even if its weight formula stays the same.

**Not implemented:** combat-simulated hunting, risk-based rare loot, quest substitution ratios, player trading or economy pricing.
