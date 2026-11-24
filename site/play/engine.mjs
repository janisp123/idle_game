import { settleArenaPrizes } from "./arena-wallet.mjs?v=glad-002";
import {
  ACTIVITY_STAT_WEIGHTS, blankAttributeEffort, validAttributeEffort, awardAttributeTime
} from "./attributes.mjs?v=glad-001";
export {
  ATTRIBUTE_BALANCE, ATTRIBUTES, ATTRIBUTE_IDS, ACTIVITY_STAT_WEIGHTS,
  attributeXP, attributeProgress, allAttributeProgress,
  MASTERY_ATTRIBUTE_BALANCE, masteryBonusesForSkill, masteryAwardForNextLevel,
  totalMasteryAttributeBonuses, effectiveAttributeProgress
} from "./attributes.mjs?v=glad-001";
import {
  validCombatSession, startCombatSession, advanceCombatSession, BOUT_MS
} from "./combat.mjs?v=glad-002";
import { COMBAT_LOADOUTS, DEFAULT_COMBAT_LOADOUT, validCombatLoadout }
  from "./combat-skills.mjs?v=glad-002";
import { ARMOUR_SLOTS, ARMOUR_TIERS, initialArmour, armourOption, armourStats } from "./armour.mjs?v=glad-002";
import { effectiveAttributeProgress as combatAttributeProgress } from "./attributes.mjs?v=glad-001";
import { LOOT_TABLES, EXTRA_LOOT_LABELS, allocateLoot } from "./loot.mjs?v=glad-001";
import { PRODUCTION_RECIPES, PRODUCTION_INPUTS, PRODUCTION_LABELS, produce } from "./production.mjs?v=glad-001";
export { PRODUCTION_RECIPES, PRODUCTION_INPUTS, recipeOptions } from "./production.mjs?v=glad-001";
export { LOOT_TABLES, lootChances } from "./loot.mjs?v=glad-001";
/**
 * Tiny offline-capable prototype engine.
 * No DOM, storage, network, accounts or combat simulation dependencies.
 * OFF-001: action rates and effective levels remain frozen while absent.
 */
export const SAVE_KEY = "idle-game-prototype-v1";
export const GAME_VERSION = 9;
// ALPHA: switch this single profile back to "normal" when testing is complete.
// Existing browser saves record their own profile and migrate progress fractions on load.
export const TIMING_PROFILE = "alpha";
const TIMING_PROFILES = Object.freeze({
  normal: Object.freeze({ workCycleMs: null, sameZoneMs: 60_000, zoneMs: 300_000,
    preparationMs: 120_000, firstPreparationMs: 120_000 }),
  alpha: Object.freeze({ workCycleMs: 10_000, sameZoneMs: 5_000, zoneMs: 5_000,
    preparationMs: 5_000, firstPreparationMs: 10_000 })
});
const timing = TIMING_PROFILES[TIMING_PROFILE];
// One completed action is a full work cycle, not a swing or a hit.
// Keep original balancing data intact for the normal profile.
export const BASE_CYCLE_MS = 60_000;
export const ZONE_TRAVEL_MS = timing.zoneMs;
export const SAME_ZONE_TRAVEL_MS = timing.sameZoneMs;
export const PREPARATION_MS = timing.preparationMs;
export const INITIAL_PREPARATION_MS = timing.firstPreparationMs;
const normalWorkDuration = task => Math.round(task.baseMinutes * BASE_CYCLE_MS / task.speed);
const workDurationForProfile = (task, profile) =>
  TIMING_PROFILES[profile].workCycleMs ?? normalWorkDuration(task);
const task = (title, subject, item, itemLabel, minutes, xp, description, zone, speed = 1, category = "craft") =>
  Object.freeze({ title, subject, item, itemLabel,
    durationMs: timing.workCycleMs ?? Math.round(minutes * BASE_CYCLE_MS / speed),
    baseMinutes: minutes, speed, xp, yield: 1, description, zone, category });
export const ACTIVITIES = Object.freeze({
  // Fighting is independent of hunting/raiding: real turn-by-turn attack and
  // defense outcomes drive an event-specific original illustration.
  fighting: task("Fighting", "Matched opponents", null,
    "Combat skill · automatic turn-based duels", 20, 3,
    "Fight worthy opponents in automatic turns. Attack rolls, guards, wounds and outcomes decide each illustrated scene.",
    "Fighting grounds", 1, "combat"),
  hunting: task("Hunting", "Game", "hide", "Hides", 12, 3, "Track and dress game for meat and hides.", "Wilds"),
  fishing: task("Fishing", "River fish", "fish", "Fish", 10, 2, "Catch and clean fish for camp.", "River"),
  foraging: task("Foraging", "Wild plants", "herb", "Edible plants", 8, 2, "Gather edible plants for rations.", "Wilds"),
  woodcutting: task("Woodcutting", "Trees", "log", "Timber", 12, 2, "Cut timber and gather fuel.", "Forest"),
  mining: task("Mining", "Rock and ore", "stone", "Stone", 15, 2, "Extract stone, iron ore and limestone.", "Quarry"),
  smithing: task("Smithing", "Iron ore", "iron_ingot", "Iron ingots", 20, 3, "Smelt iron ore into ingots.", "Forge"),
  construction: task("Construction", "Building materials", "mortar", "Mortar", 18, 3, "Prepare mortar, timber, stone and leather.", "Workshop"),
  cooking: task("Cooking", "Food stocks", "ration", "Rations", 12, 2, "Cook and pack rations from available food.", "Camp"),
  farming: task("Farming", "Grain crops", "grain", "Grain", 12, 2, "Harvest grain and collect straw.", "Fields"),
  training: task("Training", "Physical drills", null, "Skill practice · no resources", 20, 3,
    "Practise strength, footwork and endurance.", "Training yard", 1, "training")
});
export const ITEM_LABELS = Object.freeze({
  ...Object.fromEntries(Object.values(ACTIVITIES).filter(a => a.item !== null).map(a => [a.item, a.itemLabel])),
  ...EXTRA_LOOT_LABELS,
  ...PRODUCTION_LABELS
});
import { STARTER_ITEM, equipmentBonuses, isEquipmentItem, smithQuote } from "./smith.mjs?v=glad-002";

const equipmentIds = new Set([
  ...Object.keys(COMBAT_LOADOUTS),
  ...ARMOUR_SLOTS.flatMap(slot => ARMOUR_TIERS.slice(1).map(family => slot.id + ":" + family))
]);

function validEquipment(state) {
  const { equipment, armour } = state;
  return Boolean(equipment && typeof equipment === "object" && !Array.isArray(equipment) &&
    armour && typeof armour === "object" && Object.keys(armour).length === ARMOUR_SLOTS.length &&
    Object.keys(COMBAT_LOADOUTS).every(id => Object.hasOwn(equipment, id)) &&
    Object.entries(equipment).every(([id, item]) => equipmentIds.has(id) && isEquipmentItem(item)) &&
    ARMOUR_SLOTS.every(({ id }) => armourOption(id, armour[id]) &&
      (armour[id] === "none" || Object.hasOwn(equipment, id + ":" + armour[id]))));
}

import { validTier, unlockLevel, workMultiplier } from "./difficulty.mjs?v=glad-002";
export function setDifficulty(state,id,tier,now=Date.now(),random=Math.random) {
  if(!Object.hasOwn(ACTIVITIES,id)||!validTier(tier)||state.skills[id].level<unlockLevel(tier))
    throw new RangeError("Difficulty locked");
  const result=settle(state,now,random);
  if((state.difficulties[id]??0)===tier) return result;
  return {...result,state:{...result.state,difficulties:{...state.difficulties,[id]:tier},
    combatSession:id==="fighting"?null:result.state.combatSession,
    progressMs:result.state.activity===id?0:result.state.progressMs}};
}
export const ITEM_KEYS = Object.freeze(Object.keys(ITEM_LABELS));
export const SKILL_IDS = Object.freeze(Object.keys(ACTIVITIES));
if (Object.keys(ACTIVITY_STAT_WEIGHTS).length !== SKILL_IDS.length ||
    SKILL_IDS.some(id => !Object.hasOwn(ACTIVITY_STAT_WEIGHTS, id)))
  throw new Error("Every activity must define exactly one attribute-weight distribution");
const blankSkills = () => Object.fromEntries(SKILL_IDS.map(id => [id, { level: 1, xp: 0 }]));
export const activityDuration = (id, speedMultiplier = 1) => {
  if (!Object.hasOwn(ACTIVITIES, id) || !Number.isFinite(speedMultiplier) || speedMultiplier <= 0)
    throw new RangeError("Invalid activity or speed");
  return Math.max(1, Math.round(ACTIVITIES[id].durationMs / speedMultiplier));
};
const MAX = Number.MAX_SAFE_INTEGER;
const isCount = value => Number.isSafeInteger(value) && value >= 0;
const validTime = value => Number.isSafeInteger(value) && value >= 0;
export const MAX_WAGONS = 3;
/**
 * Independent skill progression and batch reward tuning.
 * Existing alpha numbers are unchanged. See docs/mechanics/.
 * Changing XP costs may rebase saved progression.
 */
export const SKILL_BALANCE = Object.freeze({
  xpPerNextLevel: 40,
  efficiencyPerLevel: 0.02,
  maxEfficiency: 2,
  batchVariation: 0.10
});
export const SCHEDULE_BALANCE = Object.freeze({
  minDurationUnits: 1,
  maxDurationUnits: 8
});
/** This is a scheduled STOP condition, not an automatic Skill Master visit. */
export const UNTIL_LEVEL_UP = "untilLevelUp";
// Balancing lives here, not in queue settlement or the Skill Master UI.
// Changing DEFAULT adjusts all producing skills; custom skill values can be
// placed in OVERRIDES without changing the readiness logic or save format.
export const MASTER_DEFAULT_ITEM_MINIMUM = 1;
export const MASTER_ITEM_MINIMUM_OVERRIDES = Object.freeze({});
export const MASTER_RESOURCE_MINIMUM = Object.freeze(Object.fromEntries(
  SKILL_IDS.map(id => [id, MASTER_ITEM_MINIMUM_OVERRIDES[id] ??
    (skillSpoils(id).length ? MASTER_DEFAULT_ITEM_MINIMUM : 0)])
));
export const validQueuePlan = plan => plan === UNTIL_LEVEL_UP || validPlannedDuration(plan);
export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;
// Minutes are an alpha testing option; accept them in existing saves even
// after restoring normal timings, so switching profiles never deletes a route.
export const validPlannedDuration = ms => Number.isSafeInteger(ms) &&
  [MINUTE_MS, HOUR_MS, DAY_MS].some(unit => ms % unit === 0 &&
    ms / unit >= SCHEDULE_BALANCE.minDurationUnits &&
    ms / unit <= SCHEDULE_BALANCE.maxDurationUnits);


export function newGame(now = Date.now()) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  return {
    version: GAME_VERSION,
    timingProfile: TIMING_PROFILE,
    name: "Wanderer",
    skills: blankSkills(),
    attributeEffort: blankAttributeEffort(),
    combatSession: null,
    coins: 0,
    combatLoadout: DEFAULT_COMBAT_LOADOUT,
    armour: initialArmour(),
    difficulties: {},
    equipment: Object.fromEntries(Object.keys(COMBAT_LOADOUTS).map(id => [id, STARTER_ITEM])),
    // V1 global XP cannot be assigned to individual activities reliably.
    unattributedXP: 0,
    items: Object.fromEntries(ITEM_KEYS.map(key => [key, 0])),
    activity: null,
    progressMs: 0,
    transition: null,
    wagons: [], productiveElapsedMs: 0,
    settledAtMs: now
  };
}

/**
 * Loading under a new timing preset preserves the fraction of the unfinished
 * cycle/phase rather than treating an old long-duration save as corrupted.
 * Finished rewards and skill XP are not touched.
 */
function scalePartialProgress(value, sourceMs, targetMs) {
  if (sourceMs === targetMs) return value;
  return Math.min(targetMs - 1, Math.floor((value / sourceMs) * targetMs));
}

/** Validate the current alpha save and restore its timing profile. */
export function readSave(value) {
  try {
    const s = typeof value === "string" ? JSON.parse(value) : value;
    if (!s || s.version !== GAME_VERSION ||
        typeof s.name !== "string" || s.name.length > 40 ||
        !s.items || typeof s.items !== "object" || Array.isArray(s.items) ||
        !validAttributeEffort(s.attributeEffort) || !isCount(s.coins) ||
        !validCombatLoadout(s.combatLoadout) || !validCombatSession(s.combatSession) ||
        !ITEM_KEYS.every(key => s.items[key] === undefined || isCount(s.items[key])) ||
        !validEquipment(s) ||
        (s.activity !== null && !Object.hasOwn(ACTIVITIES, s.activity)) ||
        !isCount(s.progressMs) || !validTime(s.settledAtMs)) return null;

    const savedProfile = s.timingProfile;
    if (!Object.hasOwn(TIMING_PROFILES, savedProfile)) return null;
    const sourceTiming = TIMING_PROFILES[savedProfile];
    const sourceWorkMs = s.activity ? workDurationForProfile(ACTIVITIES[s.activity], savedProfile) : 0;
    if (s.activity && s.progressMs >= sourceWorkMs) return null;
    if (!s.activity && s.progressMs !== 0) return null;

    const transition = s.transition ?? null;
    if (transition !== null) {
      if (typeof transition !== "object" || Array.isArray(transition) ||
          !Object.hasOwn(ACTIVITIES, transition.targetActivity) ||
          !["finishing", "moving", "preparing"].includes(transition.phase) ||
          !isCount(transition.phaseProgressMs) ||
          (transition.phase === "finishing" && (!s.activity || transition.phaseProgressMs !== 0)) ||
          (transition.phase === "moving" && (!s.activity || s.progressMs !== 0 ||
            transition.phaseProgressMs >= (ACTIVITIES[s.activity].zone ===
              ACTIVITIES[transition.targetActivity].zone ? sourceTiming.sameZoneMs : sourceTiming.zoneMs))) ||
          (transition.phase === "preparing" &&
            (transition.phaseProgressMs >= (s.activity ? sourceTiming.preparationMs : sourceTiming.firstPreparationMs) ||
              s.progressMs !== 0)))
        return null;
    }

    const wagons = s.wagons;
    if (!Array.isArray(wagons) || wagons.length > MAX_WAGONS ||
        wagons.some((wagon, i) => !wagon || typeof wagon !== "object" ||
          Array.isArray(wagon) || !Object.hasOwn(ACTIVITIES, wagon.activity) ||
          (i === wagons.length - 1 ? wagon.plannedMs !== null :
            !validQueuePlan(wagon.plannedMs))) ||
        new Set(wagons.map(w => w.activity)).size !== wagons.length ||
        !isCount(s.productiveElapsedMs ?? 0) ||
        (!wagons.length && (s.activity || transition || (s.productiveElapsedMs ?? 0) !== 0)) ||
        (wagons.length && wagons[0].activity !== (transition?.targetActivity ?? s.activity)) ||
        (wagons.length && (wagons[0].plannedMs === null ||
          wagons[0].plannedMs === UNTIL_LEVEL_UP) && (s.productiveElapsedMs ?? 0) !== 0) ||
        (wagons.length && typeof wagons[0].plannedMs === "number" &&
          (s.productiveElapsedMs ?? 0) > wagons[0].plannedMs)) return null;

    if (!isCount(s.unattributedXP) || !s.skills || typeof s.skills !== "object" ||
        SKILL_IDS.some(id => {
          const skill = s.skills[id];
          return !skill || !isCount(skill.xp) || !isCount(skill.level) ||
            skill.level < 1 || skill.xp > xpToNextLevel(skill.level);
        })) return null;

    const difficulties=s.difficulties===undefined?{}:s.difficulties;
    if(!difficulties || typeof difficulties!=="object" || Array.isArray(difficulties) ||
      Object.entries(difficulties).some(([id,t])=>!Object.hasOwn(ACTIVITIES,id)||
        !validTier(t)||(s.skills?.[id]?.level??1)<unlockLevel(t))) return null;
    const skills = Object.fromEntries(SKILL_IDS.map(id => [id, { ...s.skills[id] }]));
    let newProgressMs = s.activity
      ? scalePartialProgress(s.progressMs, sourceWorkMs, ACTIVITIES[s.activity].durationMs) : 0;
    const newTransition = transition ? { ...transition } : null;
    if (newTransition) {
      if (transition.phase === "moving") {
        const sameZone = ACTIVITIES[s.activity].zone === ACTIVITIES[transition.targetActivity].zone;
        const sourceMs = sameZone ? sourceTiming.sameZoneMs : sourceTiming.zoneMs;
        const targetMs = sameZone ? SAME_ZONE_TRAVEL_MS : ZONE_TRAVEL_MS;
        newTransition.phaseProgressMs = scalePartialProgress(transition.phaseProgressMs, sourceMs, targetMs);
      } else if (transition.phase === "preparing") {
        const sourceMs = s.activity ? sourceTiming.preparationMs : sourceTiming.firstPreparationMs;
        const targetMs = s.activity ? PREPARATION_MS : INITIAL_PREPARATION_MS;
        newTransition.phaseProgressMs = scalePartialProgress(transition.phaseProgressMs, sourceMs, targetMs);
      }
    }
    return {
      version: GAME_VERSION, timingProfile: TIMING_PROFILE, name: s.name, skills,
      attributeEffort: { ...s.attributeEffort },
      combatLoadout: s.combatLoadout,
      coins: s.coins,
      armour: { ...s.armour },
      equipment: Object.fromEntries(Object.entries(s.equipment).map(([id, item]) => [id, { grade: item.grade, quality: item.quality }])),
      difficulties: { ...difficulties }, combatSession: s.combatSession,
      unattributedXP: s.unattributedXP,
      items: Object.fromEntries(ITEM_KEYS.map(key => [key, s.items[key] ?? 0])),
      activity: s.activity, progressMs: newProgressMs, transition: newTransition,
      wagons: wagons.map(w => ({ activity: w.activity, plannedMs: w.plannedMs })),
      productiveElapsedMs: s.productiveElapsedMs ?? 0,
      settledAtMs: s.settledAtMs
    };
  } catch {
    return null;
  }
}

function safeAdd(a, b) {
  const value = a + b;
  if (!isCount(value)) throw new RangeError("Prototype counter exceeded safe numeric range");
  return value;
}

export function xpForLevel(level) {
  if (!Number.isSafeInteger(level) || level < 1) throw new RangeError("Invalid level");
  return SKILL_BALANCE.xpPerNextLevel * (level - 1) * level / 2;
}

/** Skill XP is per level, not a lifetime total. Each level takes longer. */
export function xpToNextLevel(level) {
  if (!Number.isSafeInteger(level) || level < 1 || level > Number.MAX_SAFE_INTEGER / SKILL_BALANCE.xpPerNextLevel)
    throw new RangeError("Invalid level");
  return SKILL_BALANCE.xpPerNextLevel * level;
}

/** O(1) calculation; no loop through level thresholds even after decades. */
export function levelFromXP(xp) {
  if (!isCount(xp)) throw new RangeError("Invalid XP");
  let result = Math.max(1, Math.floor((1 + Math.sqrt(1 + 8 * xp / SKILL_BALANCE.xpPerNextLevel)) / 2));
  while (result > 1 && xpForLevel(result) > xp) result--;
  while (xpForLevel(result + 1) <= xp) result++;
  return result;
}

/**
 * One independent +/-10% roll for each reward TOTAL per settlement batch.
 * Stochastic rounding keeps integer rewards unbiased, including single actions.
 * Constant work regardless of the number of offline actions.
 * This intentionally is not equivalent to rolling separately for every action.
 */
function variedTotal(base, random) {
  const roll = () => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError("Invalid random roll");
    return value;
  };
  const scaled = base * (1 - SKILL_BALANCE.batchVariation + 2 * SKILL_BALANCE.batchVariation * roll());
  if (!Number.isSafeInteger(Math.ceil(scaled))) throw new RangeError("Reward exceeds safe numeric range");
  const whole = Math.floor(scaled);
  const fraction = scaled - whole;
  return whole + (fraction > 0 && roll() < fraction ? 1 : 0);
}

function settleWork(state, now, random, frozenEffort, xpRandom = random) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  const end = Math.max(state.settledAtMs, now);
  const elapsedMs = end - state.settledAtMs;
  const next = { ...state, skills: { ...state.skills }, items: { ...state.items }, settledAtMs: end };
  const report = { activity: state.activity, elapsedMs, completed: 0, gainedXP: 0,
    item: null, gainedItems: 0, gainedCoins: 0, items: {}, consumed: {} };
  if (!state.activity || elapsedMs === 0) return { state: next, report };

  // Attribute progress is based on productive time, not work cycles or
  // alpha timing. Master-capped skill XP does not stop attribute growth.
  next.attributeEffort = awardAttributeTime(state.attributeEffort, state.activity, elapsedMs);
  const tier=state.difficulties[state.activity]??0;
  const multiplier=tier?workMultiplier(tier,ACTIVITY_STAT_WEIGHTS[state.activity],
    combatAttributeProgress(frozenEffort,state.skills)):1;
  if (state.activity === "fighting") {
    let session = state.combatSession;
    if (!session) {
      const attrs = combatAttributeProgress(frozenEffort, state.skills);
      const bonus = equipmentBonuses(state);
      session = startCombatSession({
        difficulty:tier, name: state.name,
        loadout: state.combatLoadout,
        gear: {...armourStats(state.armour,state.combatLoadout),
          gearDefense:bonus.defense},
        gearAttack:bonus.attack,
        str: attrs.STR.value, dex: attrs.DEX.value, end: attrs.END.value,
        skill: state.skills.fighting.level
      }, state.settledAtMs >>> 0);
    }
    session = advanceCombatSession(session, elapsedMs);
    const prize = settleArenaPrizes(session);
    next.combatSession = prize.session;
    next.coins = safeAdd(state.coins, prize.coins);
    report.gainedCoins = prize.coins;
  }
  const rules = ACTIVITIES[state.activity]; // snapshot at start of this whole settlement
  const totalMs = state.progressMs + elapsedMs;
  const count = Math.floor(totalMs / rules.durationMs);
  next.progressMs = totalMs % rules.durationMs;
  if (count > 0) {
    const prior = state.skills[state.activity];
    const crafted = PRODUCTION_RECIPES[state.activity]
      ? produce(state.activity, prior.level, count, state.items, random)
      : null;
    const productive = crafted ? crafted.completed : count;
    if (productive > 0) {
      report.completed = productive;
      report.item = rules.item;
      // Early-alpha mastery benefit: a modest 2% extra productivity per
      // activated level, capped at double. Training/leisure earn faster XP;
      // resource gatherers also bring home more material. Old-offline levels
      // stay frozen until the player explicitly trains with the Master.
      const efficiency = Math.min(SKILL_BALANCE.maxEfficiency,
        1 + Math.max(0, prior.level - 1) * SKILL_BALANCE.efficiencyPerLevel)*multiplier;
      report.gainedItems = rules.item === null ? 0 :
        crafted ? productive : variedTotal(count * rules.yield * efficiency, random);
      // The Master owns the next level. Extra XP never banks, even if a
      // character gathers resources unattended for decades.
      const missingXP = Math.max(0, xpToNextLevel(prior.level) - prior.xp);
      report.gainedXP = missingXP
        ? Math.min(missingXP, variedTotal(productive * rules.xp * efficiency, xpRandom)) : 0;
      report.items = rules.item === null ? {} :
        crafted ? crafted.created : LOOT_TABLES[state.activity]
        ? allocateLoot(state.activity, prior.level, report.gainedItems, random)
        : { [rules.item]: report.gainedItems };
      report.consumed = crafted?.consumed ?? {};
      for (const [item, amount] of Object.entries(report.consumed)) {
        next.items[item] -= amount; // produce() already bounded each recipe by unprotected inventory
      }
      for (const [item, amount] of Object.entries(report.items)) {
        next.items[item] = safeAdd(next.items[item], amount);
      }
      next.skills[state.activity] = { ...prior, xp: prior.xp + report.gainedXP };
    }
    // Empty input stock grants no crafted goods or skill XP; time-based
    // attributes remain a separate, universally accessible progression path.
    // Offline skill effectiveness stays frozen at the last activated level.
  }

  // A full XP bar cannot level here, on return or when the tab stays open.
  return { state: next, report };
}


/**
 * Travel and preparation are real elapsed time, even with the page closed.
 * At most three transition phases and one old/full new-work batch are resolved,
 * regardless of whether the absence was minutes or decades.
 */
function settleTransition(state, now, random, frozenEffort) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  if (!state.transition) return settleWork(state, now, random, frozenEffort);
  const end = Math.max(now, state.settledAtMs);
  let next = state;
  const reports = [];
  const pushReport = report => {
    if (report.completed || report.gainedCoins) reports.push(report);
  };
  let remaining = end - next.settledAtMs;

  // Each iteration completes a different phase or exhausts available time.
  for (let i = 0; i < 3 && next.transition; i++) {
    const transition = next.transition;
    if (transition.phase === "finishing") {
      const needed = ACTIVITIES[next.activity].durationMs - next.progressMs;
      const take = Math.min(remaining, needed);
      const work = settleWork(next, next.settledAtMs + take, random, frozenEffort);
      next = work.state;
      pushReport(work.report);
      remaining -= take;
      if (take < needed) break;
      next = { ...next, transition: { ...transition, phase: "moving", phaseProgressMs: 0 } };
    } else {
      const phaseDuration = transition.phase === "moving"
        ? (ACTIVITIES[next.activity].zone === ACTIVITIES[transition.targetActivity].zone
          ? SAME_ZONE_TRAVEL_MS : ZONE_TRAVEL_MS)
        : (next.activity ? PREPARATION_MS : INITIAL_PREPARATION_MS);
      const take = Math.min(remaining, phaseDuration - transition.phaseProgressMs);
      remaining -= take;
      const phaseProgressMs = transition.phaseProgressMs + take;
      next = { ...next, settledAtMs: next.settledAtMs + take,
        transition: { ...transition, phaseProgressMs } };
      if (phaseProgressMs < phaseDuration) break;
      if (transition.phase === "moving") {
        next = { ...next, transition: { ...transition, phase: "preparing", phaseProgressMs: 0 } };
      } else {
        next = { ...next, activity: transition.targetActivity, progressMs: 0,
          transition: null, combatSession: transition.targetActivity === "fighting"
            ? null : next.combatSession };
      }
    }
  }

  if (!next.transition) {
    const work = settleWork(next, end, random, frozenEffort);
    next = work.state;
    pushReport(work.report);
  }
  const report = reports.at(-1) ?? {
    activity: next.activity, elapsedMs: end - state.settledAtMs, completed: 0,
    gainedXP: 0, item: null, gainedItems: 0, items: {}, consumed: {}
  };
  return { state: next, report, reports };
}


/** Remaining transition time, bounded regardless of absent years. */
function remainingTransitionMs(state) {
  const t = state.transition;
  if (!t) return 0;
  const movement = state.activity && ACTIVITIES[state.activity].zone ===
    ACTIVITIES[t.targetActivity].zone ? SAME_ZONE_TRAVEL_MS : ZONE_TRAVEL_MS;
  const preparation = state.activity ? PREPARATION_MS : INITIAL_PREPARATION_MS;
  if (t.phase === "finishing") return ACTIVITIES[state.activity].durationMs -
    state.progressMs + movement + preparation;
  if (t.phase === "moving") return movement - t.phaseProgressMs + preparation;
  return preparation - t.phaseProgressMs;
}

const emptyReport = (state, elapsedMs) => ({
  activity: state.activity, elapsedMs, completed: 0, gainedXP: 0,
  item: null, gainedItems: 0, gainedCoins: 0, items: {}, consumed: {}
});


/** Consistent random stream for bounded probes of the same offline interval.
 * Replaying the same seed makes a binary search for the first ready work
 * cycle independent of how many probes are needed (no per-cycle replay).
 */
function seededRoll(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

/** Pure readiness shared by Skill Master and the queue's level-up stop.
 * The resource minimum currently defaults to one eligible spoil per
 * resource-producing skill; XP-only skills require zero materials.
 */
export function skillMasterReadiness(state, skillId) {
  if (!Object.hasOwn(ACTIVITIES, skillId)) throw new RangeError("Unknown skill");
  const skill = state.skills[skillId];
  const requiredXP = xpToNextLevel(skill.level);
  const requiredItems = MASTER_RESOURCE_MINIMUM[skillId];
  let availableItems = 0;
  for (const key of skillSpoils(skillId)) {
    availableItems = Math.min(requiredItems, availableItems +
      Math.min(requiredItems, state.items[key] ?? 0));
  }
  const xpReady = skill.xp >= requiredXP;
  const resourcesReady = availableItems >= requiredItems;
  return { ready: xpReady && resourcesReady, xpReady, resourcesReady,
    requiredXP, requiredItems, availableItems };
}

/**
 * Settle at most three finite wagons chronologically, then the Forever wagon.
 * No per-cycle replay; material from mining can feed subsequent masonry even
 * after a hundred years offline. Effective levels change only at the Master.
 */
export function settle(state, now = Date.now(), random = Math.random) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  if (!state.wagons?.length) return settleTransition(state, now, random, state.attributeEffort);
  const end = Math.max(now, state.settledAtMs);
  let next = state;
  const reports = [];
  const addReports = outcome => {
    for (const report of outcome.reports ?? [outcome.report]) {
      if (report?.completed || report?.gainedCoins) reports.push(report);
    }
  };
  // Three productive segments + at most three transitions; the loop is
  // bounded by queue length and independent of how long the player was away.
  for (let step = 0; step < 10; step++) {
    if (next.transition) {
      const untilReady = remainingTransitionMs(next);
      const result = settleTransition(next, Math.min(end, next.settledAtMs + untilReady), random, state.attributeEffort);
      next = result.state;
      addReports(result);
      if (next.transition) break;
      continue;
    }
    const first = next.wagons[0];
    if (!first || first.plannedMs === null) {
      const result = settleWork(next, end, random, state.attributeEffort);
      next = result.state;
      addReports(result);
      break;
    }
    if (first.plannedMs === UNTIL_LEVEL_UP) {
      // No surprise extra work when the character is already ready. We still
      // finish a previously begun work cycle through the usual transition.
      if (!skillMasterReadiness(next, first.activity).ready) {
        const task = ACTIVITIES[first.activity];
        const possibleCycles = Math.floor((next.progressMs + end - next.settledAtMs) / task.durationMs);
        if (possibleCycles === 0) {
          next = settleWork(next, end, random, state.attributeEffort).state;
          break;
        }
        const originalRoll = random();
        if (!Number.isFinite(originalRoll) || originalRoll < 0 || originalRoll >= 1)
          throw new RangeError("Invalid random roll");
        const seed = Math.floor(originalRoll * 0x100000000);
        // The XP roll must not shift when a variable-size crafting batch
        // consumes a different number of loot RNG draws during probing.
        // Holding its multiplier/rounding roll fixed makes XP (and readiness)
        // monotone across candidate cycle counts.
        const xpRoll = ((Math.imul(seed, 2246822519) + 3266489917) >>> 0) /
          0x100000000;
        const atCycle = count => next.settledAtMs + count * task.durationMs - next.progressMs;
        const probe = count => settleWork(next, atCycle(count), seededRoll(seed), state.attributeEffort,
          () => xpRoll);
        const finalResult = probe(possibleCycles);
        if (!skillMasterReadiness(finalResult.state, first.activity).ready) {
          // No crafting inputs or not enough loot/XP: stay on this task until
          // the condition really becomes true. Do not skip to Forever.
          const tail = settleWork(finalResult.state, end, random, state.attributeEffort);
          next = tail.state;
          addReports(finalResult);
          addReports(tail);
          break;
        }
        // Binary-search the first FULL work cycle satisfying both the XP and
        // resource requirements. Probe randomness is identical every time;
        // complexity is O(log completed cycles), even after decades away.
        let low = 1, high = possibleCycles;
        while (low < high) {
          const middle = low + Math.floor((high - low) / 2);
          if (skillMasterReadiness(probe(middle).state, first.activity).ready)
            high = middle;
          else low = middle + 1;
        }
        const ready = probe(low);
        next = ready.state;
        addReports(ready);
      }
    } else if (next.productiveElapsedMs < first.plannedMs) {
      const available = Math.min(end - next.settledAtMs, first.plannedMs - next.productiveElapsedMs);
      const result = settleWork(next, next.settledAtMs + available, random, state.attributeEffort);
      next = { ...result.state, productiveElapsedMs: next.productiveElapsedMs + available };
      addReports(result);
      if (next.productiveElapsedMs < first.plannedMs) break;
    }
    // The finite interval ended or the Skill Master condition is fulfilled;
    // do not create an extra old-work cycle at an exact cycle boundary.
    // An unfinished cycle is completed by the existing transition.
    const future = next.wagons.slice(1);
    if (!future.length) throw new RangeError("Finite final wagon");
    const targetActivity = future[0].activity;
    next = { ...next, wagons: future, productiveElapsedMs: 0,
      transition: targetActivity === next.activity ? null : {
        targetActivity, phase: next.progressMs > 0 ? "finishing" : "moving",
        phaseProgressMs: 0
      } };
    if (!next.transition && next.settledAtMs === end) break;
  }
  return { state: next, reports, report: reports.at(-1) ?? emptyReport(next, end - state.settledAtMs) };
}

function retargetSettled(current, targetActivity) {
  if (current.transition?.targetActivity === targetActivity ||
      (!current.transition && current.activity === targetActivity)) return current;
  const phase = !current.activity ? "preparing" :
    current.transition?.phase === "finishing" ? "finishing" :
    current.transition ? "moving" : "finishing";
  return { ...current, transition: { targetActivity, phase, phaseProgressMs: 0 } };
}

/** Start first job or append a future one. Previous Forever job becomes timed. */
export function queueStartActivity(state, activity, previousLastDurationMs = null,
  now = Date.now(), random = Math.random) {
  if (!Object.hasOwn(ACTIVITIES, activity)) throw new RangeError("Unknown activity");
  const result = settle(state, now, random);
  const current = result.state;
  if (current.wagons.some(w => w.activity === activity) || current.wagons.length >= MAX_WAGONS)
    throw new RangeError("Activity already queued or all wagons occupied");
  if (!current.wagons.length) {
    const queued = { ...current, wagons: [{ activity, plannedMs: null }], productiveElapsedMs: 0 };
    return { ...result, state: retargetSettled(queued, activity) };
  }
  if (!validQueuePlan(previousLastDurationMs)) throw new RangeError("Choose a finite duration or level-up readiness");
  const prior = current.wagons.at(-1);
  const wagons = [
    ...current.wagons.slice(0, -1),
    { ...prior, plannedMs: previousLastDurationMs },
    { activity, plannedMs: null }
  ];
  const productiveElapsedMs = current.wagons.length === 1 ? 0 : current.productiveElapsedMs;
  return { ...result, state: { ...current, wagons, productiveElapsedMs } };
}

/**
 * Add a finite task immediately BEFORE the existing Forever destination.
 * The selected task owns its chosen duration; never silently assign that
 * duration to the activity the player is leaving.
 *
 * A single Forever activity becomes the return destination: the new finite
 * task starts after finishing the old full cycle and switching normally.
 * With two wagons, the new task waits after the current finite one.
 * All previously earned work and the old Forever task survive this edit.
 */
export function queueInsertTimedActivity(state, activity, plannedMs,
  now = Date.now(), random = Math.random) {
  if (!Object.hasOwn(ACTIVITIES, activity)) throw new RangeError("Unknown activity");
  if (!validQueuePlan(plannedMs)) throw new RangeError("Choose a duration or level-up readiness");
  const result = settle(state, now, random);
  const current = result.state;
  if (!current.wagons.length) throw new RangeError("Choose Start now for the first activity");
  if (current.wagons.length >= MAX_WAGONS)
    throw new RangeError("All three hourglasses are occupied");
  if (current.wagons.some(w => w.activity === activity))
    throw new RangeError("Activity already in the route");
  const wagons = [
    ...current.wagons.slice(0, -1).map(w => ({ ...w })),
    { activity, plannedMs },
    { ...current.wagons.at(-1) }
  ];
  const startsNow = current.wagons.length === 1;
  let next = { ...current, wagons,
    productiveElapsedMs: startsNow ? 0 : current.productiveElapsedMs };
  if (startsNow) next = retargetSettled(next, activity);
  return { ...result, state: next };
}

/** Do it for: edits to the current wagon begin counting from this edit. */
export function queueSetDuration(state, index, plannedMs, now = Date.now(), random = Math.random) {
  if (!validQueuePlan(plannedMs)) throw new RangeError("Choose a duration or level-up readiness");
  const result = settle(state, now, random);
  const current = result.state;
  if (!Number.isInteger(index) || index < 0 || index >= current.wagons.length - 1)
    throw new RangeError("Final wagon must be Forever");
  const wagons = current.wagons.map((w, i) => i === index ? { ...w, plannedMs } : { ...w });
  return { ...result, state: { ...current, wagons,
    productiveElapsedMs: index === 0 ? 0 : current.productiveElapsedMs } };
}

/** Adjacent swap: duration belongs to the slot, final slot always Forever. */
export function queueSwap(state, leftIndex, now = Date.now(), random = Math.random) {
  const result = settle(state, now, random);
  const current = result.state;
  if (!Number.isInteger(leftIndex) || leftIndex < 0 || leftIndex >= current.wagons.length - 1)
    throw new RangeError("Invalid wagon swap");
  const wagons = current.wagons.map(w => ({ ...w }));
  const name = wagons[leftIndex].activity;
  wagons[leftIndex].activity = wagons[leftIndex + 1].activity;
  wagons[leftIndex + 1].activity = name;
  const changedFirst = leftIndex === 0;
  let next = { ...current, wagons,
    productiveElapsedMs: changedFirst ? 0 : current.productiveElapsedMs };
  if (changedFirst) next = retargetSettled(next, wagons[0].activity);
  return { ...result, state: next };
}

/** Remove only the last *future* wagon; current work and rewards are untouched. */
export function queueRemoveLast(state, now = Date.now(), random = Math.random) {
  const result = settle(state, now, random);
  const current = result.state;
  if (current.wagons.length < 2) throw new RangeError("Cannot remove the current wagon");
  const wagons = current.wagons.slice(0, -1).map((w, i, list) => ({
    activity: w.activity, plannedMs: i === list.length - 1 ? null : w.plannedMs
  }));
  return { ...result, state: { ...current, wagons, productiveElapsedMs: 0 } };
}

/** Start or retarget a manual transition; never grant travel rewards or skip a work cycle. */
export function requestActivityChange(state, targetActivity, now = Date.now(), random = Math.random) {
  if (!Object.hasOwn(ACTIVITIES, targetActivity)) throw new RangeError("Unknown activity");
  const outcome = settle(state, now, random);
  const current = outcome.state;
  const wagons = [{ activity: targetActivity, plannedMs: null }];
  return { ...outcome, state: retargetSettled(
    { ...current, wagons, productiveElapsedMs: 0 }, targetActivity) };
}

/** Returning is only a catch-up. No level or skill improvement applies automatically. */
export function enterGame(state, now = Date.now(), random = Math.random) {
  const outcome = settle(state, now, random);
  return { ...outcome, levelsGained: {} };
}

/** All items that a particular skill can produce, including locked rare tiers. */
export function skillSpoils(skillId) {
  if (!Object.hasOwn(ACTIVITIES, skillId)) throw new RangeError("Unknown skill");
  return [...new Set([
    ACTIVITIES[skillId].item,
    ...(LOOT_TABLES[skillId] ?? []).map(t => t.item),
    ...(PRODUCTION_RECIPES[skillId] ?? []).map(t => t.output)
  ].filter(key => key !== null))];
}

/** Quoted tribute at the exact current inventory snapshot. No fees/currency. */
export function skillMasterOffer(state) {
  const ready = [], blocked = [], tribute = {};
  for (const skillId of SKILL_IDS) {
    const skill = state.skills[skillId];
    const readiness = skillMasterReadiness(state, skillId);
    if (!readiness.xpReady) continue;
    const spoils = skillSpoils(skillId);
    if (!readiness.resourcesReady) {
      blocked.push(skillId);
      continue;
    }
    ready.push(skillId);
    for (const key of spoils) if (state.items[key] > 0) tribute[key] = state.items[key];
  }
  return { ready, blocked, tribute };
}

/** Player-confirmed exchange: advance each eligible skill ONCE, forfeit its
 * current-level XP and every owned spoil from the advanced skills.
 * This is always an explicitly confirmed inventory sacrifice.
 */
export function learnFromMaster(state, now = Date.now(), random = Math.random) {
  const outcome = settle(state, now, random);
  const offer = skillMasterOffer(outcome.state);
  if (!offer.ready.length) throw new RangeError("No mastery available to claim");
  const skills = { ...outcome.state.skills };
  const items = { ...outcome.state.items };
  for (const skillId of offer.ready) {
    const old = skills[skillId];
    skills[skillId] = { level: old.level + 1, xp: 0 };
  }
  for (const key of Object.keys(offer.tribute)) items[key] = 0;
  return { ...outcome, state: {
    ...outcome.state, skills, items,
    // A confirmed level-up grants its stat immediately. Restart only the
    // current Fighting duel, after settling old frozen power first. Offline
    // bouts and previously collected progress are never recalculated.
    combatSession: outcome.state.activity === "fighting" && !outcome.state.transition
      ? null : outcome.state.combatSession
  }, mastery: offer };
}

/**
 * Choose a different TWO-ability preset (attack skill + defense skill).
 * Settle first at old frozen power. Changing during a live duel starts a
 * fresh duel without losing any previously earned time-based XP or materials.
 */
export function setCombatLoadout(state, loadout, now = Date.now(), random = Math.random) {
  if (!validCombatLoadout(loadout)) throw new RangeError("Unknown combat loadout");
  const result = settle(state, now, random);
  if (result.state.combatLoadout === loadout) return result;
  return { ...result, state: { ...result.state, combatLoadout: loadout,
    combatSession: result.state.activity === "fighting" && !result.state.transition
      ? null : result.state.combatSession } };
}

export function setArmourChoice(state, slot, family, now = Date.now(), random = Math.random) {
  if (!armourOption(slot, family) ||
      family !== "none" && !Object.hasOwn(state.equipment, slot + ":" + family))
    throw new RangeError("Armour is not owned");
  const result = settle(state, now, random);
  if (result.state.armour[slot] === family) return result;
  return { ...result, state: { ...result.state,
    armour: { ...result.state.armour, [slot]: family }, combatSession: null } };
}

export function buyEquipment(state, id, target, now = Date.now(), random = Math.random) {
  if (!equipmentIds.has(id) || !isEquipmentItem(target)) throw new RangeError("Unknown equipment");
  const result = settle(state, now, random);
  const quote = smithQuote(result.state, id, target);
  if (!quote.available) return result;
  const slot = id.split(":")[0];
  const armour = Object.hasOwn(result.state.armour, slot)
    ? { ...result.state.armour, [slot]: id.split(":")[1] } : result.state.armour;
  const current = result.state;
  return { ...result, purchased: true, state: { ...current, armour,
    coins: current.coins - quote.cost, equipment: { ...current.equipment,
      [id]: { grade: target.grade, quality: target.quality } },
    combatSession: null } };
}

/** Legacy instant selection helper retained for historical engine fixtures only; the UI uses requestActivityChange. */
export function chooseActivity(state, activity, now = Date.now(), random = Math.random) {
  if (!Object.hasOwn(ACTIVITIES, activity)) throw new RangeError("Unknown activity");
  const settled = settle(state, now, random);
  if (settled.state.activity === activity && !settled.state.transition) return settled;
  return { state: { ...settled.state, activity, progressMs: 0, transition: null,
    combatSession: activity === "fighting" ? null : settled.state.combatSession,
    wagons: [{ activity, plannedMs: null }], productiveElapsedMs: 0 }, report: settled.report };
}

export function testOfflineDay(state, now = Date.now(), random = Math.random) {
  if (!state.activity) return { state, report: null, levelsGained: 0 };
  // A transparent, local-only testing shortcut. No hidden duration cap.
  const simulated = { ...state, settledAtMs: state.settledAtMs - 86400000 };
  return enterGame(simulated, now, random);
}
