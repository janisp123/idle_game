/**
 * Tiny offline-capable prototype engine.
 * No DOM, storage, network, accounts or combat simulation dependencies.
 * OFF-001: action rates and effective levels remain frozen while absent.
 */
export const SAVE_KEY = "idle-game-prototype-v1";
export const GAME_VERSION = 2;
// A completed action represents an entire work cycle, not one swing or strike.
// Adjust BASE_CYCLE_MS or a single activity's speed multiplier to rebalance.
export const BASE_CYCLE_MS = 60_000;
export const ZONE_TRAVEL_MS = 5 * 60_000; // reserved for future zone-change mechanic
const task = (title, subject, item, itemLabel, minutes, xp, description, zone, speed = 1, category = "craft") =>
  Object.freeze({ title, subject, item, itemLabel, durationMs: Math.round(minutes * BASE_CYCLE_MS / speed),
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
  slave_raiding: task("Slave raiding", "Villages", "faction_tribute", "Faction tribute", 90, 5, "Raid settlements to seize captives for a cruel faction; collect tribute for the deed.", "Borderlands", 1, "outlaw")
});
export const ITEM_KEYS = Object.freeze([...new Set(Object.values(ACTIVITIES).map(a => a.item))]);
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

export function newGame(now = Date.now()) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  return {
    version: GAME_VERSION,
    name: "Wanderer",
    skills: blankSkills(),
    // V1 global XP cannot be assigned to individual activities reliably.
    unattributedXP: 0,
    items: Object.fromEntries(ITEM_KEYS.map(key => [key, 0])),
    activity: null,
    progressMs: 0,
    settledAtMs: now
  };
}

/** Read previous V1 browser saves without losing inventory, unfinished work or XP. */
export function readSave(value) {
  try {
    const s = typeof value === "string" ? JSON.parse(value) : value;
    if (!s || (s.version !== 1 && s.version !== GAME_VERSION) ||
        typeof s.name !== "string" || s.name.length > 40 ||
        !s.items || typeof s.items !== "object" ||
        !ITEM_KEYS.every(key => s.items[key] === undefined || isCount(s.items[key])) ||
        (s.activity !== null && !Object.hasOwn(ACTIVITIES, s.activity)) ||
        !isCount(s.progressMs) || !validTime(s.settledAtMs)) return null;
    if (s.activity && s.progressMs >= ACTIVITIES[s.activity].durationMs) return null;
    if (!s.activity && s.progressMs !== 0) return null;

    const oldVersion = s.version === 1;
    if (oldVersion) {
      if (!isCount(s.level) || s.level < 1 || !isCount(s.totalXP) ||
          s.level > levelFromXP(s.totalXP)) return null;
    } else {
      if (!isCount(s.unattributedXP) || !s.skills || typeof s.skills !== "object" ||
          !SKILL_IDS.every(id => {
            const skill = s.skills[id];
            return skill === undefined || (skill && typeof skill === "object" &&
              isCount(skill.xp) && isCount(skill.level) && skill.level >= 1 &&
              skill.level <= levelFromXP(skill.xp));
          })) return null;
    }
    const skills = blankSkills();
    if (!oldVersion) {
      for (const id of SKILL_IDS) {
        if (s.skills[id]) skills[id] = { xp: s.skills[id].xp, level: s.skills[id].level };
      }
    }
    return {
      version: GAME_VERSION, name: s.name, skills,
      unattributedXP: oldVersion ? s.totalXP : s.unattributedXP,
      items: Object.fromEntries(ITEM_KEYS.map(key => [key, s.items[key] ?? 0])),
      activity: s.activity, progressMs: s.progressMs, settledAtMs: s.settledAtMs
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

export function settle(state, now = Date.now(), random = Math.random) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  const end = Math.max(state.settledAtMs, now);
  const elapsedMs = end - state.settledAtMs;
  const next = { ...state, skills: { ...state.skills }, items: { ...state.items }, settledAtMs: end };
  const report = { activity: state.activity, elapsedMs, completed: 0, gainedXP: 0, item: null, gainedItems: 0 };
  if (!state.activity || elapsedMs === 0) return { state: next, report };

  const rules = ACTIVITIES[state.activity]; // snapshot at start of this whole settlement
  const totalMs = state.progressMs + elapsedMs;
  const count = Math.floor(totalMs / rules.durationMs);
  next.progressMs = totalMs % rules.durationMs;
  if (count > 0) {
    report.completed = count;
    report.item = rules.item;
    report.gainedItems = variedTotal(count * rules.yield, random);
    report.gainedXP = variedTotal(count * rules.xp, random);
    next.items[rules.item] = safeAdd(state.items[rules.item], report.gainedItems);
    const prior = state.skills[state.activity];
    next.skills[state.activity] = { ...prior, xp: safeAdd(prior.xp, report.gainedXP) };
    // Offline skill effectiveness stays frozen at the last activated level.
  }
  // Intentionally DO NOT modify next.level here, regardless of XP thresholds.
  return { state: next, report };
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
  return { state: { ...outcome.state, skills }, report: outcome.report, levelsGained };
}

export function chooseActivity(state, activity, now = Date.now(), random = Math.random) {
  if (!Object.hasOwn(ACTIVITIES, activity)) throw new RangeError("Unknown activity");
  const settled = settle(state, now, random);
  if (settled.state.activity === activity) return settled;
  return { state: { ...settled.state, activity, progressMs: 0 }, report: settled.report };
}

export function testOfflineDay(state, now = Date.now(), random = Math.random) {
  if (!state.activity) return { state, report: null, levelsGained: 0 };
  // A transparent, local-only testing shortcut. No hidden duration cap.
  const simulated = { ...state, settledAtMs: state.settledAtMs - 86400000 };
  return enterGame(simulated, now, random);
}
