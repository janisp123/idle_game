/**
 * Input-limited processing. Prototype recipes are configurable and consume
 * one or more raw resources to create one finished resource. No fabricated materials.
 *
 * Bounded batch calculation: never simulates every work cycle after an absence.
 * Eligible outputs are selected automatically.
 */
import { sampleBinomial } from "./loot.mjs?v=glad-001";

const recipe = (inputs, output, label, weight = 100) =>
  Object.freeze({ inputs: Object.freeze(inputs), output, label, minLevel: 1, weight });

export const PRODUCTION_RECIPES = Object.freeze({
  smithing: Object.freeze([recipe(["iron_ore"], "iron_ingot", "Iron ingots")]),
  construction: Object.freeze([
    recipe(["limestone", "fuel"], "mortar", "Mortar"),
    recipe(["log"], "plank", "Planks"),
    recipe(["stone"], "block", "Stone blocks"),
    recipe(["hide"], "leather", "Leather")
  ]),
  cooking: Object.freeze([
    recipe(["grain"], "ration", "Rations"),
    recipe(["meat"], "ration", "Rations"),
    recipe(["fish"], "ration", "Rations"),
    recipe(["herb"], "ration", "Rations")
  ])
});
export const PRODUCTION_INPUTS = Object.freeze([...new Set(
  Object.values(PRODUCTION_RECIPES).flatMap(list => list.flatMap(r => r.inputs))
)]);
export const PRODUCTION_LABELS = Object.freeze(Object.fromEntries(
  Object.values(PRODUCTION_RECIPES).flatMap(list => list.map(r => [r.output, r.label]))
));

export function recipeOptions(activity, level) {
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError("Invalid skill level");
  return (PRODUCTION_RECIPES[activity] ?? []).filter(r => level >= r.minLevel);
}

/**
 * Compute batch output using the full saved inventory available at settlement,
 * with no protection flags. A depleted input cannot be fabricated.
 *
 * Quotas are drawn from eligible recipe weights, capped to available input,
 * then unused work capacity is filled from remaining available eligible inputs.
 * Individual single-action choices are weighted; large batches use bounded
 * binomial approximations. All counts stay integer and nonnegative.
 */
export function produce(activity, level, workCycles, inventory, random = Math.random) {
  if (!Number.isSafeInteger(workCycles) || workCycles < 0 ||
      !inventory || typeof inventory !== "object")
    throw new RangeError("Invalid production request");
  const consumed = {}, created = {};
  const stock = item => Number.isSafeInteger(inventory[item]) && inventory[item] > 0
    ? inventory[item] - (consumed[item] ?? 0) : 0;
  const capacity = recipe => Math.min(...recipe.inputs.map(stock));
  const options = recipeOptions(activity, level).filter(r => capacity(r) > 0);
  let remaining = workCycles;
  let remainingWeight = options.reduce((sum, recipe) => sum + recipe.weight, 0);

  function craft(recipe, quota) {
    const count = Math.min(quota, capacity(recipe));
    if (!count) return;
    for (const item of recipe.inputs) consumed[item] = (consumed[item] ?? 0) + count;
    created[recipe.output] = (created[recipe.output] ?? 0) + count;
    remaining -= count;
  }

  for (const recipe of options) {
    if (!remaining) break;
    craft(recipe, sampleBinomial(remaining, recipe.weight / remainingWeight, random));
    remainingWeight -= recipe.weight;
  }
  // Fill unused work capacity with eligible stock left after the weighted pass.
  for (const recipe of options) {
    if (!remaining) break;
    craft(recipe, remaining);
  }
  return { completed: workCycles - remaining, consumed, created };
}
