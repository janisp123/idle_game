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

export function newGame(now = Date.now()) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  return {
    version: GAME_VERSION,
    name: "Wanderer",
    skills: blankSkills(),
    protectedItems: [],
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
        (s.protectedItems !== undefined && (!Array.isArray(s.protectedItems) ||
          !s.protectedItems.every(key => typeof key === "string" && PRODUCTION_INPUTS.includes(key)))) ||
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
      protectedItems: [...new Set(s.protectedItems ?? [])],
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
