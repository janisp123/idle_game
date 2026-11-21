/**
 * Skill-weighted resource tables for the idle prototype.
 * All weights are provisional balance values, not publicly exposed rates.
 * One activity button covers the whole tier distribution.
 *
 * This module selects SPOILS, not combat outcomes: actual fights, HP,
 * wounds and encounter difficulty belong to a later combat simulator.
 */
const tier = (item, label, minLevel, weight, growth = 0, cap = weight) =>
  Object.freeze({ item, label, minLevel, weight, growth, cap });

export const LOOT_TABLES = Object.freeze({
  hunting: Object.freeze([
    tier("hide", "Wolf hides", 1, 100),
    tier("dire_hide", "Dire wolf hides", 8, 6, 0.8, 38),
    tier("beast_trophy", "Beast trophies", 25, 1, 0.45, 22)
  ]),
  mining: Object.freeze([
    tier("stone", "Stone", 1, 100),
    tier("copper_ore", "Copper ore", 2, 10, 0.4, 32),
    tier("iron_ore", "Iron ore", 10, 5, 0.7, 40),
    tier("silver_ore", "Silver ore", 25, 1, 0.5, 25)
  ]),
  gathering: Object.freeze([
    tier("herb", "Herbs", 1, 100),
    tier("moonleaf", "Moonleaf", 7, 6, 0.5, 30),
    tier("shadowroot", "Shadowroot", 22, 1, 0.4, 18)
  ]),
  woodcutting: Object.freeze([
    tier("log", "Logs", 1, 100),
    tier("hardwood", "Hardwood", 10, 7, 0.65, 30),
    tier("elderwood", "Elderwood", 30, 1, 0.35, 15)
  ]),
  fishing: Object.freeze([
    tier("fish", "Fish", 1, 100),
    tier("river_trout", "River trout", 9, 7, 0.6, 30),
    tier("silverfish", "Silverfish", 28, 1, 0.35, 17)
  ])
});

export const EXTRA_LOOT_LABELS = Object.freeze(Object.fromEntries(
  Object.values(LOOT_TABLES).flatMap(tiers => tiers.slice(1).map(t => [t.item, t.label]))
));

function draw(random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new RangeError("Invalid random roll");
  return value;
}

function weight(t, level) {
  return Math.min(t.cap, t.weight + Math.max(0, level - t.minLevel) * t.growth);
}

/** Returns normalized eligible probabilities, always preserving the basic tier. */
export function lootChances(activity, level) {
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError("Invalid skill level");
  const tiers = LOOT_TABLES[activity];
  if (!tiers) return [];
  const eligible = tiers.filter(t => level >= t.minLevel);
  const sum = eligible.reduce((total, t) => total + weight(t, level), 0);
  return eligible.map(t => ({ item: t.item, label: t.label,
    minLevel: t.minLevel, chance: weight(t, level) / sum }));
}

/**
 * Bounded-cost binomial sample. Exact below 65 units; approximate with a
 * Poisson or Gaussian draw for large counts, never replaying years of actions.
 * The approximation is intentionally visible in the technical documentation.
 */
export function sampleBinomial(count, chance, random) {
  if (!Number.isSafeInteger(count) || count < 0 || !(chance >= 0 && chance <= 1))
    throw new RangeError("Invalid weighted sample");
  if (count === 0 || chance === 0) return 0;
  if (chance === 1) return count;
  if (count <= 64) {
    let hits = 0;
    for (let i = 0; i < count; i++) if (draw(random) < chance) hits++;
    return hits;
  }
  const mean = count * chance;
  if (mean < 12) {
    let product = 1, hits = -1;
    const target = Math.exp(-mean);
    do {
      hits++;
      product *= Math.max(Number.MIN_VALUE, draw(random));
    } while (product > target && hits < 64);
    return Math.min(count, hits);
  }
  // Gaussian approximation is O(1) and keeps variance proportionate to count.
  const u1 = Math.max(Number.MIN_VALUE, draw(random));
  const u2 = draw(random);
  const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const value = Math.round(mean + Math.sqrt(mean * (1 - chance)) * gaussian);
  return Math.min(count, Math.max(0, value));
}

/**
 * Split one independently varied settlement batch among unlocked spoil tiers.
 * Counts always sum to the original batch total; high-tier loot replaces
 * common loot, never adds free extra resources.
 * Uses the provided (frozen offline) skill level for the entire settlement.
 */
export function allocateLoot(activity, level, count, random = Math.random) {
  if (!Number.isSafeInteger(count) || count < 0) throw new RangeError("Invalid loot total");
  const eligible = lootChances(activity, level);
  if (!eligible.length) throw new RangeError("No tier table for activity");
  let remaining = count;
  let weightLeft = 1;
  const result = {};
  for (let i = eligible.length - 1; i >= 1; i--) {
    const t = eligible[i];
    const portion = sampleBinomial(remaining, Math.min(1, t.chance / weightLeft), random);
    if (portion) result[t.item] = portion;
    remaining -= portion;
    weightLeft -= t.chance;
  }
  if (remaining) result[eligible[0].item] = remaining;
  return result;
}
