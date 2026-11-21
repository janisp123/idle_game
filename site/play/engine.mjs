/**
 * Tiny offline-capable prototype engine.
 * No DOM, storage, network, accounts or combat simulation dependencies.
 * OFF-001: action rates and effective levels remain frozen while absent.
 */
export const SAVE_KEY = "idle-game-prototype-v1";
export const GAME_VERSION = 1;
export const ACTIVITIES = Object.freeze({
  hunting: Object.freeze({ title: "Hunting", subject: "Wolves", item: "hide", itemLabel: "Wolf hides", durationMs: 7000, xp: 3, yield: 1 }),
  mining: Object.freeze({ title: "Mining", subject: "Stone", item: "stone", itemLabel: "Stone", durationMs: 5000, xp: 2, yield: 1 })
});
const MAX = Number.MAX_SAFE_INTEGER;
const isCount = value => Number.isSafeInteger(value) && value >= 0;
const validTime = value => Number.isSafeInteger(value) && value >= 0;

export function newGame(now = Date.now()) {
  if (!validTime(now)) throw new RangeError("Invalid clock");
  return {
    version: GAME_VERSION,
    name: "Wanderer",
    level: 1,
    totalXP: 0,
    items: { hide: 0, stone: 0 },
    activity: null,
    progressMs: 0,
    settledAtMs: now
  };
}

/** Accept only the expected save schema; never trust old/corrupt local data. */
export function readSave(value) {
  try {
    const s = typeof value === "string" ? JSON.parse(value) : value;
    if (!s || s.version !== GAME_VERSION ||
      typeof s.name !== "string" || s.name.length > 40 ||
      !isCount(s.level) || s.level < 1 || !isCount(s.totalXP) ||
      !s.items || !isCount(s.items.hide) || !isCount(s.items.stone) ||
      (s.activity !== null && !Object.hasOwn(ACTIVITIES, s.activity)) ||
      !isCount(s.progressMs) || !validTime(s.settledAtMs)) return null;
    if (s.activity && s.progressMs >= ACTIVITIES[s.activity].durationMs) return null;
    if (!s.activity && s.progressMs !== 0) return null;
    if (s.level > levelFromXP(s.totalXP)) return null;
    return {
      version: GAME_VERSION, name: s.name, level: s.level,
      totalXP: s.totalXP, items: { hide: s.items.hide, stone: s.items.stone },
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
  const next = { ...state, items: { ...state.items }, settledAtMs: end };
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
    next.totalXP = safeAdd(state.totalXP, report.gainedXP);
  }
  // Intentionally DO NOT modify next.level here, regardless of XP thresholds.
  return { state: next, report };
}

/** Called only when the user ENTERS/RETURNS to the game, after full catch-up. */
export function enterGame(state, now = Date.now(), random = Math.random) {
  const outcome = settle(state, now, random);
  const earnedLevel = levelFromXP(outcome.state.totalXP);
  const levelsGained = earnedLevel - outcome.state.level;
  return { state: { ...outcome.state, level: Math.max(1, earnedLevel) },
    report: outcome.report, levelsGained };
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
