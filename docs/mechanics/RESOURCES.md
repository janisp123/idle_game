# Drops, rarity and crafting — IMPLEMENTED (alpha)

**Source/tuning:** [loot.mjs](../../site/play/loot.mjs) → `LOOT_TABLES`, [production.mjs](../../site/play/production.mjs) → `PRODUCTION_RECIPES`, [engine.mjs](../../site/play/engine.mjs) → `ACTIVITIES[id]` and `SKILL_BALANCE`. This is resource generation, **not simulated animal combat**.

The eleven activities are Fighting, Hunting, Fishing, Foraging, Woodcutting, Mining, Smithing, Construction, Cooking, Farming, and Training.

## Total raw spoils

For one settlement batch of `N` full work cycles, `baseSpoils = N × ACTIVITIES[id].yield × skillEfficiency` (currently every resource-producing activity has base yield `1`). Calculate the batch's +/-10% varied total and stochastic integer rounding as documented in [Progression](PROGRESSION.md). There is **no per-cycle RNG replay** after a long offline absence.

For gathering activities with a `LOOT_TABLES` entry, split that *fixed resulting total* among eligible rarity tiers. Rare items **replace** common items; never give free extra items. For other raw activities use the ordinary `item`. Training earns skill and attribute XP and produces no materials. Fighting earns XP and pays arena coins for victories.

## Weighted rarities / tier unlocks

Each row defines `{ item, label, minLevel, weight, growth, cap }`. The tier is eligible iff **activated skill level** `L >= minLevel`.

```text
weightAtLevel(t, L) = min(t.cap, t.weight + max(0, L − t.minLevel) × t.growth)
chance(t, L) = weightAtLevel(t, L) / sum(weightAtLevel(eligible tiers, L))
```

For a concrete mining example, at level 1, Stone has weight 100, Limestone 25 and Iron ore 25. Iron ore grows by 1 weight per activated Mining level above 1, capped at 55. The table itself controls level thresholds and how probabilities change; do not hand-code tiers into the UI.

**Allocation:** `allocateLoot` samples higher tiers first, from the `remaining` batch with conditional probability `chanceTier / remainingChanceMass`; common stock takes the remainder. All output counts are **nonnegative integers summing to the original total**.

**Sampling costs / approximation:** `sampleBinomial` uses exact Bernoulli draws for counts `<= 64`; for larger counts uses a bounded Poisson approximation if `mean = count × chance < 12`, otherwise a rounded, clamped Gaussian with mean `count × chance` and variance `count × chance × (1−chance)`. This is **approximate** for large batches (not mathematically exact per-item loot history). Those thresholds are algorithm-selection constants, not item rarity balance. Keep this accuracy tradeoff explicit if changing the sampler.

## Ingredient-limited crafting

All initial recipes are available at skill level 1. Smithing consumes iron ore to make iron ingots. Construction consumes limestone and wood fuel together for mortar, or processes timber, stone, and hides into planks, blocks, and leather. Cooking makes rations from grain, meat, fish, or edible plants. Farming supplies grain and separate straw. These resources support the survival loop and leave room for future uses of rations, straw, and construction stock.

Recipe definitions list one or more inputs and one output. Each craft consumes one of every listed input and creates one unit of output. The engine samples weighted quotas in bulk and fills unused work capacity from remaining eligible stock. Every quota is capped against stock after earlier allocations. Only completed crafts award skill XP. Time spent without ingredients still earns attribute XP.

**Important:** `SKILL_BALANCE.maxEfficiency` applies to XP and **raw gathering**. It does **not** turn a single iron ore into two iron ingots. Production does not take the raw ±10% spoil variation.

## Edit one thing at a time

- Change an item's unlock rank, weight/growth/cap: edit only its `LOOT_TABLES` row, run tier tests and sampled distribution checks.
- Change input/output unlock or crafting preference: edit `PRODUCTION_RECIPES`; add corresponding inventory/output labels through current module-derived mapping. Check shortages and conservation.
- Change base XP or work duration: edit the specific `ACTIVITIES` row, **not** loot/crafting equations.
- Change overall +/- variation or skill level efficiency: `SKILL_BALANCE` in engine.
- Adding a new item or changing keys is a save-schema change. The survival update starts a new alpha save version.

**Not implemented:** combat-simulated hunting, risk-based rare loot, quest substitution ratios, player trading or economy pricing.
