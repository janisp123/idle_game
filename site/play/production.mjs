/**
 * Input-limited processing. Prototype recipes are configurable and consume
 * one raw resource to create one finished resource. No fabricated materials.
 *
 * Bounded batch calculation: never simulates every work cycle after an absence.
 * Higher unlocked outputs are selected automatically, not individually chosen.
 */
import { sampleBinomial } from "./loot.mjs?v=20261121-loot1";

const recipe = (input, output, label, minLevel, weight, growth = 0, cap = weight) =>
  Object.freeze({ input, output, label, minLevel, weight, growth, cap });

export const PRODUCTION_RECIPES = Object.freeze({
  smelting: Object.freeze([
    recipe("copper_ore", "ingot", "Copper ingots", 1, 100),
    recipe("iron_ore", "iron_ingot", "Iron ingots", 10, 25, 0.5, 55),
    recipe("silver_ore", "silver_ingot", "Silver ingots", 25, 8, 0.4, 34)
  ]),
  // Initial one-ingredient prototype recipes. Higher-tier recipes and more
  // complex ingredients require separate balance/design approval.
  alchemy: Object.freeze([recipe("herb", "potion", "Potions", 1, 100)]),
  carpentry: Object.freeze([recipe("log", "plank", "Planks", 1, 100)]),
  masonry: Object.freeze([recipe("stone", "block", "Stone blocks", 1, 100)]),
  cooking: Object.freeze([recipe("fish", "meal", "Meals", 1, 100)])
});
export const PRODUCTION_INPUTS = Object.freeze([...new Set(
  Object.values(PRODUCTION_RECIPES).flatMap(list => list.map(r => r.input))
)]);
export const PRODUCTION_LABELS = Object.freeze(Object.fromEntries(
  Object.values(PRODUCTION_RECIPES).flatMap(list => list.map(r => [r.output, r.label]))
));

function weight(recipe, level) {
  return Math.min(recipe.cap, recipe.weight + (level - recipe.minLevel) * recipe.growth);
}

export function recipeOptions(activity, level) {
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError("Invalid skill level");
  return (PRODUCTION_RECIPES[activity] ?? []).filter(r => level >= r.minLevel);
}

/**
 * Compute batch output using the full saved inventory available at settlement,
 * honoring protected ingredients. A depleted input cannot be fabricated.
 *
 * Quotas are drawn from eligible recipe weights, capped to available input,
 * then unused work capacity is filled from remaining available eligible inputs.
 * Individual single-action choices are weighted; large batches use bounded
 * binomial approximations. All counts stay integer and nonnegative.
 */
export function produce(activity, level, workCycles, inventory, protectedItems = [], random = Math.random) {
  if (!Number.isSafeInteger(workCycles) || workCycles < 0 ||
      !inventory || typeof inventory !== "object" || !Array.isArray(protectedItems))
    throw new RangeError("Invalid production request");
  const excluded = new Set(protectedItems);
  const options = recipeOptions(activity, level).filter(r =>
    !excluded.has(r.input) && Number.isSafeInteger(inventory[r.input]) && inventory[r.input] > 0
  );
  const consumed = {}, created = {};
  if (!workCycles || !options.length) return { completed: 0, consumed, created };
  let capacity = 0;
  for (const r of options) capacity = Math.min(workCycles, capacity + Math.min(workCycles, inventory[r.input]));
  let remaining = capacity;
  let remainingWeight = options.reduce((n, r) => n + weight(r, level), 0);
  const units = new Map();
  for (let i = options.length - 1; i >= 0; i--) {
    const r = options[i];
    const available = inventory[r.input];
    const share = i === 0 ? remaining :
      sampleBinomial(remaining, Math.min(1, weight(r, level) / remainingWeight), random);
    const used = Math.min(available, share);
    units.set(r.input, used);
    remaining -= used;
    remainingWeight -= weight(r, level);
  }
  // When the preferred input runs out, continue with any other unlocked stock.
  if (remaining) for (const r of options) {
    const spare = Math.max(0, inventory[r.input] - (units.get(r.input) ?? 0));
    const used = Math.min(remaining, spare);
    units.set(r.input, (units.get(r.input) ?? 0) + used);
    remaining -= used;
    if (!remaining) break;
  }
  let completed = 0;
  for (const r of options) {
    const count = units.get(r.input) ?? 0;
    if (!count) continue;
    consumed[r.input] = count;
    created[r.output] = count;
    completed += count;
  }
  return { completed, consumed, created };
}
