/**
 * ATTR-001: Five universal, uncapped attributes. This is the single balancing
 * file for attribute growth; no activity needs its own XP formula.
 *
 * Every productive hour grants the SAME total attribute XP regardless of task
 * length, actions completed, skill rank, or the alpha timing preset.
 *
 * Edit ATTRIBUTE_BALANCE for overall progression. Edit only the weights for
 * a particular activity to change its distribution; each row must total 100.
 * Stored effort records the ORIGINAL distribution of already-trained time.
 * Adjusting xpPerHour or stat costs intentionally rebases existing characters
 * (alpha balancing); editing weights does not rewrite their training history.
 */
export const ATTRIBUTE_BALANCE = Object.freeze({
  xpPerProductiveHour: 100, // Provisional. All activities share this budget.
  startingStat: 10,
  firstStatPointXP: 20,
  additionalXPPerPoint: 20
});

export const ATTRIBUTES = Object.freeze([
  Object.freeze({ id: "STR", name: "Strength" }),
  Object.freeze({ id: "DEX", name: "Dexterity" }),
  Object.freeze({ id: "END", name: "Endurance" })
]);
export const ATTRIBUTE_IDS = Object.freeze(ATTRIBUTES.map(s => s.id));
export const STAT_WEIGHT_TOTAL = 100;
const HOUR_MS = 3_600_000;

// These are suggested character-fantasy mappings, NOT hard class restrictions.
// No activity has a faster overall attribute-XP rate than another.
export const ACTIVITY_STAT_WEIGHTS = Object.freeze({
  fighting:     { STR: 35, DEX: 35, END: 30 },
  hunting:      { STR: 20, DEX: 45, END: 35 },
  fishing:      { DEX: 60, END: 40 },
  foraging:     { DEX: 60, END: 40 },
  woodcutting:  { STR: 65, END: 35 },
  mining:       { STR: 70, END: 30 },
  smithing:     { STR: 50, DEX: 20, END: 30 },
  construction: { STR: 50, DEX: 20, END: 30 },
  cooking:      { DEX: 65, END: 35 },
  farming:      { STR: 30, DEX: 20, END: 50 },
  training:     { STR: 35, DEX: 35, END: 30 }
});

for (const [activity, weights] of Object.entries(ACTIVITY_STAT_WEIGHTS)) {
  const entries = Object.entries(weights);
  if (!entries.length || entries.some(([id, weight]) =>
    !ATTRIBUTE_IDS.includes(id) || !Number.isInteger(weight) || weight <= 0) ||
    entries.reduce((sum, [, weight]) => sum + weight, 0) !== STAT_WEIGHT_TOTAL)
    throw new Error("Invalid attribute weights for " + activity + " (must total 100)");
  Object.freeze(weights);
}

/**
 * Mastery-to-attribute bridge (alpha). Every activated skill level beyond
 * starting level 1 grants one permanent character-stat point. There is no
 * manual allocation, reroll, random draw, or second progression currency.
 *
 * Use the SAME per-activity weights already used by productive-time training.
 * The 100-step smooth weighted round-robin wheel keeps awards monotone:
 * a later level never removes a previously granted point. Repeating the
 * wheel makes calculation O(number of activities), even after decades away.
 * The skill level is the source of truth, avoiding extra save migrations or
 * duplicate awards when visiting the Master / loading older V7 saves.
 */
export const MASTERY_ATTRIBUTE_BALANCE = Object.freeze({
  pointsPerClaimedLevel: 1
});
const makeBlankBonus = () => Object.fromEntries(ATTRIBUTE_IDS.map(id => [id, 0]));
const MASTERY_PREFIXES = Object.freeze(Object.fromEntries(
  Object.entries(ACTIVITY_STAT_WEIGHTS).map(([activity, weights]) => {
    const running = makeBlankBonus();
    const deficit = makeBlankBonus();
    const prefixes = [Object.freeze({ ...running })];
    for (let step = 0; step < STAT_WEIGHT_TOTAL; step++) {
      let chosen = null;
      for (const id of ATTRIBUTE_IDS) deficit[id] += weights[id] ?? 0;
      for (const id of ATTRIBUTE_IDS) {
        if (!(weights[id] ?? 0)) continue;
        if (chosen === null || deficit[id] > deficit[chosen]) chosen = id;
      }
      if (chosen === null) throw new Error("No stat recipient: " + activity);
      running[chosen]++;
      deficit[chosen] -= STAT_WEIGHT_TOTAL;
      prefixes.push(Object.freeze({ ...running }));
    }
    if (!ATTRIBUTE_IDS.every(id => running[id] === (weights[id] ?? 0)))
      throw new Error("Mastery stat distribution must match activity weights: " + activity);
    return [activity, Object.freeze(prefixes)];
  })
));

/** Exact cumulative grant for this activity at an *activated* skill level. */
export function masteryBonusesForSkill(activity, level) {
  const prefixes = MASTERY_PREFIXES[activity];
  if (!prefixes || !Number.isSafeInteger(level) || level < 1)
    throw new RangeError("Unknown activity/skill level for mastery");
  const earned = (level - 1) * MASTERY_ATTRIBUTE_BALANCE.pointsPerClaimedLevel;
  if (!Number.isSafeInteger(earned)) throw new RangeError("Mastery point overflow");
  const cycles = Math.floor(earned / STAT_WEIGHT_TOTAL);
  const partial = prefixes[earned % STAT_WEIGHT_TOTAL];
  const weights = ACTIVITY_STAT_WEIGHTS[activity];
  return Object.fromEntries(ATTRIBUTE_IDS.map(id =>
    [id, cycles * (weights[id] ?? 0) + partial[id]]));
}

export function masteryAwardForNextLevel(activity, level) {
  const before = masteryBonusesForSkill(activity, level);
  const after = masteryBonusesForSkill(activity, level + 1);
  return Object.fromEntries(ATTRIBUTE_IDS.filter(id => after[id] > before[id])
    .map(id => [id, after[id] - before[id]]));
}

export function totalMasteryAttributeBonuses(skills) {
  if (!skills || typeof skills !== "object") throw new RangeError("Missing skills");
  const total = makeBlankBonus();
  for (const activity of Object.keys(ACTIVITY_STAT_WEIGHTS)) {
    const points = masteryBonusesForSkill(activity, skills[activity]?.level);
    for (const id of ATTRIBUTE_IDS) {
      total[id] += points[id];
      if (!Number.isSafeInteger(total[id]))
        throw new RangeError("Character mastery attribute counter overflow");
    }
  }
  return total;
}

/**
 * Time-earned stat XP and claimed skill-rank points are complementary. Only
 * activated skill levels count: a full XP bar, offline pending work, or a
 * blocked Master visit never award the point.
 */
export function effectiveAttributeProgress(effort, skills) {
  const fromTime = allAttributeProgress(effort);
  const mastered = totalMasteryAttributeBonuses(skills);
  return Object.fromEntries(ATTRIBUTE_IDS.map(id => {
    const base = fromTime[id];
    const value = base.value + mastered[id];
    if (!Number.isSafeInteger(value)) throw new RangeError("Character stat overflow");
    return [id, { ...base, value, baseValue: base.value, masteryBonus: mastered[id] }];
  }));
}

const isNonnegativeSafeInteger = x => Number.isSafeInteger(x) && x >= 0;

export function blankAttributeEffort() {
  return Object.fromEntries(ATTRIBUTE_IDS.map(id => [id, 0]));
}

export function validAttributeEffort(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === ATTRIBUTE_IDS.length &&
    ATTRIBUTE_IDS.every(id => isNonnegativeSafeInteger(value[id])));
}

/**
 * Persist time * weight in whole integer units, avoiding rounding loss from
 * seconds, short ticks, partial cycles, and decades of offline settlement.
 * The 100% weight total means one productive hour ALWAYS grants 100 base XP.
 * Travel, waiting for first activity and preparation never call this.
 */
export function awardAttributeTime(currentEffort, activityId, elapsedMs) {
  if (!validAttributeEffort(currentEffort) || !isNonnegativeSafeInteger(elapsedMs))
    throw new RangeError("Invalid attribute effort or elapsed time");
  const weights = ACTIVITY_STAT_WEIGHTS[activityId];
  if (!weights) throw new RangeError("Missing attribute weights for " + activityId);
  if (!elapsedMs) return currentEffort;
  const next = { ...currentEffort };
  for (const id of ATTRIBUTE_IDS) {
    const addition = elapsedMs * (weights[id] ?? 0);
    const total = next[id] + addition;
    if (!isNonnegativeSafeInteger(addition) || !isNonnegativeSafeInteger(total))
      throw new RangeError("Attribute effort exceeds safe numeric range");
    next[id] = total;
  }
  return next;
}

export function attributeXP(effortUnits) {
  if (!isNonnegativeSafeInteger(effortUnits)) throw new RangeError("Invalid effort");
  return effortUnits * ATTRIBUTE_BALANCE.xpPerProductiveHour /
    (HOUR_MS * STAT_WEIGHT_TOTAL);
}

export function xpForAttributeValue(value) {
  const d = value - ATTRIBUTE_BALANCE.startingStat;
  if (!Number.isSafeInteger(value) || d < 0) throw new RangeError("Invalid attribute value");
  const { firstStatPointXP: first, additionalXPPerPoint: added } = ATTRIBUTE_BALANCE;
  return first * d + added * d * (d - 1) / 2;
}

/** Closed-form inverse of the increasing linear per-point XP cost. */
export function attributeProgress(effortUnits) {
  const xp = attributeXP(effortUnits);
  const { startingStat: start, firstStatPointXP: first, additionalXPPerPoint: added } =
    ATTRIBUTE_BALANCE;
  const a = added / 2, b = first - a;
  let points = a ? Math.max(0, Math.floor((-b + Math.sqrt(b * b + 4 * a * xp)) / (2 * a)))
    : Math.floor(xp / first);
  // Correct rare floating-point boundary rounding, constant-time in practice.
  while (points > 0 && xpForAttributeValue(start + points) > xp) points--;
  while (xpForAttributeValue(start + points + 1) <= xp) points++;
  const value = start + points;
  const gained = xp - xpForAttributeValue(value);
  const nextCost = first + added * points;
  return { value, xp, progressXP: gained, nextXP: nextCost, progressPercent: 100 * gained / nextCost };
}

export function allAttributeProgress(effort) {
  if (!validAttributeEffort(effort)) throw new RangeError("Invalid attribute effort");
  return Object.fromEntries(ATTRIBUTE_IDS.map(id => [id, attributeProgress(effort[id])]));
}
