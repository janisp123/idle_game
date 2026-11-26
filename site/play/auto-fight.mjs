// Automatic Fighting difficulty policy. Pure, deterministic and independent of rewards.
export const AUTO_FIGHT_RULES = Object.freeze({ advanceWins: 3, retryWins: 10, maxStage: 7 });
const grade = n => Number.isInteger(n) && n >= 0 && n <= AUTO_FIGHT_RULES.maxStage;
const historyGrade = n => n === -1 || grade(n);
export function initialAutoFight(stage = 0) {
  if (!grade(stage)) throw new RangeError("Invalid Fighting stage");
  return { stage, streak: 0, blocked: -1, highest: -1 };
}
export function requiredAutoFightWins(progress) {
  if (!grade(progress?.stage) || !historyGrade(progress.blocked)) throw new RangeError("Invalid Fighting progress");
  if (progress.stage === AUTO_FIGHT_RULES.maxStage) return null;
  return progress.blocked === progress.stage + 1 ? AUTO_FIGHT_RULES.retryWins : AUTO_FIGHT_RULES.advanceWins;
}
export function validAutoFight(progress) {
  if (!progress || typeof progress !== "object" || Array.isArray(progress) ||
      !grade(progress.stage) || !historyGrade(progress.highest) ||
      !(progress.blocked === -1 || grade(progress.blocked) && progress.blocked > 0) ||
      !Number.isInteger(progress.streak) || progress.streak < 0) return false;
  const required = requiredAutoFightWins(progress);
  return required === null ? progress.streak === 0 : progress.streak < required;
}
// Called exactly once for a committed completed live bout. No implicit time mode:
// absent/offline settlement is a no-op, including history and retry progress.
export function finishAutoFightBout(progress, outcome, online = false) {
  if (!validAutoFight(progress)) throw new RangeError("Invalid Fighting progress");
  if (!["victory", "defeat", "double_death"].includes(outcome)) throw new RangeError("Invalid bout outcome");
  if (typeof online !== "boolean") throw new TypeError("Invalid settlement mode");
  if (!online) return progress;
  const next = { ...progress };
  if (outcome !== "victory") {
    next.streak = 0;
    if (next.stage > 0) { next.blocked = next.stage; next.stage--; }
    return next;
  }
  next.highest = Math.max(next.highest, next.stage);
  const required = requiredAutoFightWins(next);
  if (required === null) { next.streak = 0; return next; }
  next.streak++;
  if (next.streak >= required) { next.stage++; next.streak = 0; }
  return next;
}
