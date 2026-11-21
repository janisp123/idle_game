import { LOOT_TABLES, EXTRA_LOOT_LABELS, allocateLoot } from "./loot.mjs?v=20261121-loot1";
import { PRODUCTION_RECIPES, PRODUCTION_INPUTS, PRODUCTION_LABELS, produce } from "./production.mjs?v=20261121-production2";
export { PRODUCTION_RECIPES, PRODUCTION_INPUTS, recipeOptions } from "./production.mjs?v=20261121-production2";
export { LOOT_TABLES, lootChances } from "./loot.mjs?v=20261121-loot1";
/**
 * Tiny offline-capable prototype engine.
 * No DOM, storage, network, accounts or combat simulation dependencies.
 * OFF-001: action rates and effective levels remain frozen while absent.
 */
export const SAVE_KEY = "idle-game-prototype-v1";
export const GAME_VERSION = 3;
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
  hunting: task("Hunting", "Wolves", "hide", "Wolf hides", 12, 3, "Track, hunt, dress and carry a wolf back to camp.", "Wilds"),
  mining: task("Mining", "Stone", "stone", "Stone", 15, 2, "Break rock, sort stone, load carts and haul it to storage.", "Quarry"),
  woodcutting: task("Woodcutting", "Trees", "log", "Logs", 12, 2, "Fell, trim and carry timber to a stack.", "Forest"),
  gathering: task("Gathering", "Wild plants", "herb", "Herbs", 8, 2, "Search, pick, clean and bundle useful plants.", "Wilds"),
  fishing: task("Fishing", "River fish", "fish", "Fish", 10, 2, "Catch, clean and carry fish.", "River"),
  smelting: task("Smelting", "Ore", "ingot", "Ingots", 20, 3, "Heat the furnace, process ore and cool ingots.", "Forge"),
  alchemy: task("Potion making", "Herbal mixtures", "potion", "Potions", 15, 3, "Prepare ingredients, brew and bottle a potion.", "Workshop"),
  carpentry: task("Carpentry", "Timber", "plank", "Planks", 15, 3, "Saw, shape and stack construction timber.", "Workshop"),
  masonry: task("Masonry", "Stone", "block", "Stone blocks", 18, 3, "Cut, dress and stack building stone.", "Workshop"),
  cooking: task("Cooking", "Meals", "meal", "Meals", 12, 2, "Prepare fuel, cook food and pack rations.", "Camp"),
  highway_robbery: task("Highway robbery", "Travellers", "stolen_purse", "Stolen purses", 25, 3, "Ambush travellers, seize their purses and disappear into the woods.", "Road", 1, "outlaw"),
  burglary: task("Burglary", "Homes", "valuables", "Stolen valuables", 35, 3, "Slip into a house, search for valuables and escape unseen.", "Settlement", 1, "outlaw"),
  bandit_raiding: task("Bandit raiding", "Farmsteads", "raid_supplies", "Raided supplies", 60, 4, "Lead a violent raid and carry away seized provisions.", "Borderlands", 1, "outlaw"),
  grave_robbing: task("Grave robbing", "Tombs", "relic", "Stolen relics", 40, 3, "Desecrate old graves in search of forgotten treasures.", "Graveyard", 1, "outlaw"),
  kidnapping: task("Kidnapping", "Ransom targets", "ransom_claim", "Ransom claims", 75, 4, "Abduct a wealthy target and secure a ransom claim.", "Settlement", 1, "outlaw"),
  extortion: task("Extortion", "Merchants", "protection_coin", "Extorted coins", 30, 3, "Intimidate merchants into paying protection money.", "Market", 1, "outlaw"),
  caravan_plundering: task("Caravan plundering", "Caravans", "trade_goods", "Plundered goods", 70, 4, "Overwhelm a caravan and haul off its cargo.", "Trade road", 1, "outlaw"),
  cattle_rustling: task("Cattle rustling", "Livestock", "stolen_cattle", "Stolen cattle", 45, 3, "Drive stolen livestock away from its owners.", "Pastures", 1, "outlaw"),
  assassination: task("Assassination", "Contract targets", "contract_seal", "Contract seals", 90, 5, "Fulfil a ruthless contract and collect its proof.", "Stronghold", 1, "outlaw"),
  slave_raiding: task("Slave raiding", "Villages", "faction_tribute", "Faction tribute", 90, 5, "Raid settlements to seize captives for a cruel faction; collect tribute for the deed.", "Borderlands", 1, "outlaw"),
  meditation: task("Meditation", "Inner silence", null, "Skill practice · no resources", 12, 2, "Sit in stillness and cultivate discipline amid the world's cruelty.", "Sanctuary", 1, "training"),
  weapons_training: task("Weapons training", "Blades and stances", null, "Skill practice · no resources", 20, 3, "Repeat cuts, parries and footwork until the movements become instinct.", "Training yard", 1, "training"),
  body_training: task("Body training", "Strength and endurance", null, "Skill practice · no resources", 25, 3, "Lift stones, run hills and harden the body through deliberate practice.", "Training yard", 1, "training"),
  ancient_texts: task("Reading ancient texts", "Forgotten lore", null, "Skill practice · no resources", 30, 3, "Study old manuscripts and wrest meaning from fading script.", "Library", 1, "training"),
  archery_practice: task("Archery practice", "Bowmanship", null, "Skill practice · no resources", 20, 3, "Loose arrow after arrow and learn patience, aim and control.", "Range", 1, "training"),
  shield_drills: task("Shield drills", "Guard and defence", null, "Skill practice · no resources", 20, 3, "Hold the line, practise blocks and strengthen the shield arm.", "Training yard", 1, "training"),
  herbal_study: task("Herbal study", "Botanical knowledge", null, "Skill practice · no resources", 25, 3, "Compare dried specimens and learn the virtues and dangers of wild plants.", "Study", 1, "training"),
  map_study: task("Studying maps", "Navigation", null, "Skill practice · no resources", 25, 3, "Trace old roads, passes and rivers across battered maps.", "Study", 1, "training"),
  rune_study: task("Studying runes", "Runic lore", null, "Skill practice · no resources", 35, 3, "Copy weathered glyphs and decipher the marks of forgotten peoples.", "Library", 1, "training"),
  breathing_exercises: task("Breathing exercises", "Composure", null, "Skill practice · no resources", 12, 2, "Steady the breath and practise calm before hardship.", "Sanctuary", 1, "training"),
  ale_with_friends: task("Drinking ale with friends", "Companionship", null, "Skill practice · no resources", 20, 2, "Share a rough table, cheap ale and familiar company.", "Tavern", 1, "leisure"),
  laughing_at_misery: task("Laughing at life's misery", "Dark humour", null, "Skill practice · no resources", 15, 2, "Laugh together at how thoroughly the world has gone to ruin.", "Tavern", 1, "leisure"),
  tavern_stories: task("Telling tavern stories", "Storytelling", null, "Skill practice · no resources", 25, 2, "Trade unlikely tales of lost fortunes and narrow escapes.", "Tavern", 1, "leisure"),
  listening_to_bards: task("Listening to bards", "Music appreciation", null, "Skill practice · no resources", 25, 2, "Listen to old ballads and remember that beauty survives.", "Tavern", 1, "leisure"),
  dice_with_friends: task("Playing dice with friends", "Gamesmanship", null, "Skill practice · no resources", 20, 2, "Roll harmless dice for bragging rights and enjoy the company.", "Tavern", 1, "leisure"),
  sharing_a_meal: task("Sharing a meal", "Fellowship", null, "Skill practice · no resources", 25, 2, "Pass bread around the fire and talk until the night grows quiet.", "Camp", 1, "leisure"),
  stargazing: task("Stargazing", "Contemplation", null, "Skill practice · no resources", 30, 2, "Watch cold stars above the ruins and wonder at the world.", "Hills", 1, "leisure"),
  campfire_talk: task("Talking by the fire", "Conversation", null, "Skill practice · no resources", 20, 2, "Sit close to the flames and speak of ordinary troubles.", "Camp", 1, "leisure"),
  singing_old_songs: task("Singing old songs", "Singing", null, "Skill practice · no resources", 25, 2, "Raise a rough voice with others in songs no kingdom remembers.", "Tavern", 1, "leisure"),
  quiet_wandering: task("Wandering without purpose", "Solitude", null, "Skill practice · no resources", 30, 2, "Walk empty lanes without an errand, a prize or a destination.", "Outskirts", 1, "leisure")
});
export const ITEM_LABELS = Object.freeze({
  ...Object.fromEntries(Object.values(ACTIVITIES).filter(a => a.item !== null).map(a => [a.item, a.itemLabel])),
  ...EXTRA_LOOT_LABELS,
  ...PRODUCTION_LABELS
});
export const ITEM_KEYS = Object.freeze(Object.keys(ITEM_LABELS));
export const SKILL_IDS = Object.freeze(Object.keys(ACTIVITIES));
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
export const HOUR_MS = 60 * 60_000;
export const DAY_MS = 24 * HOUR_MS;
export const validPlannedDuration = ms => Number.isSafeInteger(ms) &&
  Array.from({ length: 8 }, (_, i) => i + 1)
    .some(n => ms === n * HOUR_MS || ms === n * DAY_MS);


export function newGame(now = Date.now()) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  return {
    version: GAME_VERSION,
    timingProfile: TIMING_PROFILE,
    name: "Wanderer",
    skills: blankSkills(),
    protectedItems: [],
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

/** Read old V1/V2 saves and migrate progress when alpha/normal mode changes. */
export function readSave(value) {
  try {
    const s = typeof value === "string" ? JSON.parse(value) : value;
    if (!s || ![1, 2, GAME_VERSION].includes(s.version) ||
        typeof s.name !== "string" || s.name.length > 40 ||
        !s.items || typeof s.items !== "object" ||
        !ITEM_KEYS.every(key => s.items[key] === undefined || isCount(s.items[key])) ||
        (s.protectedItems !== undefined && (!Array.isArray(s.protectedItems) ||
          !s.protectedItems.every(key => typeof key === "string" && PRODUCTION_INPUTS.includes(key)))) ||
        (s.activity !== null && !Object.hasOwn(ACTIVITIES, s.activity)) ||
        !isCount(s.progressMs) || !validTime(s.settledAtMs)) return null;

    // V1/V2 used the original normal times. V3 carries an explicit timing profile.
    const savedProfile = s.version === GAME_VERSION ? s.timingProfile : "normal";
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

    // Old V1–V3 single-activity saves become a one-wagon Forever queue.
    // A saved transition already points at the intended first wagon.
    const wagons = s.version !== GAME_VERSION || s.wagons === undefined
      ? (transition ? [{ activity: transition.targetActivity, plannedMs: null }]
        : s.activity ? [{ activity: s.activity, plannedMs: null }] : [])
      : s.wagons;
    if (!Array.isArray(wagons) || wagons.length > MAX_WAGONS ||
        wagons.some((wagon, i) => !wagon || typeof wagon !== "object" ||
          Array.isArray(wagon) || !Object.hasOwn(ACTIVITIES, wagon.activity) ||
          (i === wagons.length - 1 ? wagon.plannedMs !== null :
            !validPlannedDuration(wagon.plannedMs))) ||
        new Set(wagons.map(w => w.activity)).size !== wagons.length ||
        !isCount(s.productiveElapsedMs ?? 0) ||
        (!wagons.length && (s.activity || transition || (s.productiveElapsedMs ?? 0) !== 0)) ||
        (wagons.length && wagons[0].activity !== (transition?.targetActivity ?? s.activity)) ||
        (wagons.length && wagons[0].plannedMs === null && (s.productiveElapsedMs ?? 0) !== 0) ||
        (wagons.length && wagons[0].plannedMs !== null &&
          (s.productiveElapsedMs ?? 0) > wagons[0].plannedMs)) return null;

    const oldVersion = s.version === 1;
    if (oldVersion) {
      if (!isCount(s.level) || s.level < 1 || !isCount(s.totalXP) ||
          s.level > levelFromXP(s.totalXP)) return null;
    } else if (!isCount(s.unattributedXP) || !s.skills || typeof s.skills !== "object" ||
          !SKILL_IDS.every(id => {
            const skill = s.skills[id];
            return skill === undefined || (skill && typeof skill === "object" &&
              isCount(skill.xp) && isCount(skill.level) && skill.level >= 1 &&
              skill.level <= levelFromXP(skill.xp));
          })) return null;

    const skills = blankSkills();
    if (!oldVersion) {
      for (const id of SKILL_IDS) {
        if (s.skills[id]) skills[id] = { xp: s.skills[id].xp, level: s.skills[id].level };
      }
    }
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
      protectedItems: [...new Set(s.protectedItems ?? [])],
      unattributedXP: oldVersion ? s.totalXP : s.unattributedXP,
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
  return 20 * (level - 1) * level;
}

/** O(1) calculation; no loop through level thresholds even after decades. */
export function levelFromXP(xp) {
  if (!isCount(xp)) throw new RangeError("Invalid XP");
  let result = Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 5)) / 2));
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
  const scaled = base * (0.9 + 0.2 * roll());
  if (!Number.isSafeInteger(Math.ceil(scaled))) throw new RangeError("Reward exceeds safe numeric range");
  const whole = Math.floor(scaled);
  const fraction = scaled - whole;
  return whole + (fraction > 0 && roll() < fraction ? 1 : 0);
}

function settleWork(state, now, random) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  const end = Math.max(state.settledAtMs, now);
  const elapsedMs = end - state.settledAtMs;
  const next = { ...state, skills: { ...state.skills }, items: { ...state.items }, settledAtMs: end };
  const report = { activity: state.activity, elapsedMs, completed: 0, gainedXP: 0,
    item: null, gainedItems: 0, items: {}, consumed: {} };
  if (!state.activity || elapsedMs === 0) return { state: next, report };

  const rules = ACTIVITIES[state.activity]; // snapshot at start of this whole settlement
  const totalMs = state.progressMs + elapsedMs;
  const count = Math.floor(totalMs / rules.durationMs);
  next.progressMs = totalMs % rules.durationMs;
  if (count > 0) {
    const prior = state.skills[state.activity];
    const crafted = PRODUCTION_RECIPES[state.activity]
      ? produce(state.activity, prior.level, count, state.items, state.protectedItems ?? [], random)
      : null;
    const productive = crafted ? crafted.completed : count;
    if (productive > 0) {
      report.completed = productive;
      report.item = rules.item;
      report.gainedItems = rules.item === null ? 0 :
        crafted ? productive : variedTotal(count * rules.yield, random);
      report.gainedXP = variedTotal(productive * rules.xp, random);
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
      next.skills[state.activity] = { ...prior, xp: safeAdd(prior.xp, report.gainedXP) };
    }
    // Empty input stock consumes work time but grants no crafted goods or XP.
    // Offline skill effectiveness stays frozen at the last activated level.
  }
  // Intentionally DO NOT modify next.level here, regardless of XP thresholds.
  return { state: next, report };
}


/**
 * Travel and preparation are real elapsed time, even with the page closed.
 * At most three transition phases and one old/full new-work batch are resolved,
 * regardless of whether the absence was minutes or decades.
 */
function settleTransition(state, now, random) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  if (!state.transition) return settleWork(state, now, random);
  const end = Math.max(now, state.settledAtMs);
  let next = state;
  const reports = [];
  const pushReport = report => { if (report.completed) reports.push(report); };
  let remaining = end - next.settledAtMs;

  // Each iteration completes a different phase or exhausts available time.
  for (let i = 0; i < 3 && next.transition; i++) {
    const transition = next.transition;
    if (transition.phase === "finishing") {
      const needed = ACTIVITIES[next.activity].durationMs - next.progressMs;
      const take = Math.min(remaining, needed);
      const work = settleWork(next, next.settledAtMs + take, random);
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
        next = { ...next, activity: transition.targetActivity, progressMs: 0, transition: null };
      }
    }
  }

  if (!next.transition) {
    const work = settleWork(next, end, random);
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
  item: null, gainedItems: 0, items: {}, consumed: {}
});

/**
 * Settle at most three finite wagons chronologically, then the Forever wagon.
 * No per-cycle replay; material from mining can feed subsequent masonry even
 * after a hundred years offline. Level activation remains only in enterGame().
 */
export function settle(state, now = Date.now(), random = Math.random) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  if (!state.wagons?.length) return settleTransition(state, now, random);
  const end = Math.max(now, state.settledAtMs);
  let next = state;
  const reports = [];
  const addReports = outcome => {
    for (const report of outcome.reports ?? [outcome.report]) {
      if (report?.completed) reports.push(report);
    }
  };
  // Three productive segments + at most three transitions; the loop is
  // bounded by queue length and independent of how long the player was away.
  for (let step = 0; step < 10; step++) {
    if (next.transition) {
      const untilReady = remainingTransitionMs(next);
      const result = settleTransition(next, Math.min(end, next.settledAtMs + untilReady), random);
      next = result.state;
      addReports(result);
      if (next.transition) break;
      continue;
    }
    const first = next.wagons[0];
    if (!first || first.plannedMs === null) {
      const result = settleWork(next, end, random);
      next = result.state;
      addReports(result);
      break;
    }
    if (next.productiveElapsedMs < first.plannedMs) {
      const available = Math.min(end - next.settledAtMs, first.plannedMs - next.productiveElapsedMs);
      const result = settleWork(next, next.settledAtMs + available, random);
      next = { ...result.state, productiveElapsedMs: next.productiveElapsedMs + available };
      addReports(result);
      if (next.productiveElapsedMs < first.plannedMs) break;
    }
    // The finite interval ended; do not grant a new old-work cycle at an exact
    // cycle boundary. Otherwise complete only its unfinished cycle once.
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
  if (!validPlannedDuration(previousLastDurationMs)) throw new RangeError("Choose 1–8 hours or days");
  const prior = current.wagons.at(-1);
  const wagons = [
    ...current.wagons.slice(0, -1),
    { ...prior, plannedMs: previousLastDurationMs },
    { activity, plannedMs: null }
  ];
  const productiveElapsedMs = current.wagons.length === 1 ? 0 : current.productiveElapsedMs;
  return { ...result, state: { ...current, wagons, productiveElapsedMs } };
}

/** Do it for: edits to the current wagon begin counting from this edit. */
export function queueSetDuration(state, index, plannedMs, now = Date.now(), random = Math.random) {
  if (!validPlannedDuration(plannedMs)) throw new RangeError("Choose 1–8 hours or days");
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

/** Called only when the user ENTERS/RETURNS to the game, after full catch-up. */
/** Apply all skill level-ups ONLY when the player returns, after offline settlement. */
export function enterGame(state, now = Date.now(), random = Math.random) {
  const outcome = settle(state, now, random);
  const skills = {};
  const levelsGained = {};
  for (const id of SKILL_IDS) {
    const prior = outcome.state.skills[id];
    const level = levelFromXP(prior.xp);
    skills[id] = { ...prior, level };
    if (level > prior.level) levelsGained[id] = level - prior.level;
  }
  return { state: { ...outcome.state, skills }, report: outcome.report,
    ...(outcome.reports ? { reports: outcome.reports } : {}), levelsGained };
}

/** Legacy instant selection helper retained for historical engine fixtures only; the UI uses requestActivityChange. */
export function chooseActivity(state, activity, now = Date.now(), random = Math.random) {
  if (!Object.hasOwn(ACTIVITIES, activity)) throw new RangeError("Unknown activity");
  const settled = settle(state, now, random);
  if (settled.state.activity === activity && !settled.state.transition) return settled;
  return { state: { ...settled.state, activity, progressMs: 0, transition: null,
    wagons: [{ activity, plannedMs: null }], productiveElapsedMs: 0 }, report: settled.report };
}

export function testOfflineDay(state, now = Date.now(), random = Math.random) {
  if (!state.activity) return { state, report: null, levelsGained: 0 };
  // A transparent, local-only testing shortcut. No hidden duration cap.
  const simulated = { ...state, settledAtMs: state.settledAtMs - 86400000 };
  return enterGame(simulated, now, random);
}
