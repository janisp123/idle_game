import { combatVerdict } from "./combat-verdict.mjs?v=alpha-gear-a5";
/**
 * Pure presentation-only result mapping.
 * Never turn an unimplemented event into damage, healing, or failed mining.
 * A number is visible only when the simulator explicitly produced that number.
 */
const safePositive = value => Number.isSafeInteger(value) && value > 0;
const token = (value, tone, label = "") => ({ value, tone, label });

/**
 * Return the two visible sides for one *resolved* combat event.
 * Screen placement is always player left, enemy right, regardless of initiative.
 */
export function combatReadoutForEvent(event) {
  const sides = { player: [], enemy: [] };
  if (!event || typeof event !== "object") return sides;

  // A block/parry is still a successful guard even when impact transmits
  // damage: show BOTH the named defense and the real HP loss on that side.
  if (["block","parry"].includes(event.type) &&
      (event.target === "player" || event.target === "enemy")) {
    sides[event.target].push(token(event.type === "block"?"BLOCKED":"PARRIED","guard"));
    if (safePositive(event.damage))
      sides[event.target].push(token("-" + event.damage,"damage","HP"));
  } else if (safePositive(event.damage) &&
      (event.target === "player" || event.target === "enemy")) {
    sides[event.target].push(token("-" + event.damage, "damage", "HP"));
  } else if (event.type === "finisher" &&
      (event.target === "player" || event.target === "enemy")) {
    // Finisher sets HP to zero, but its event has no measured damage figure.
    sides[event.target].push(token("FINISHED", "damage"));
  } else if (["block","parry","dodge"].includes(event.type) &&
      (event.target === "player" || event.target === "enemy")) {
    sides[event.target].push(token(
      {block:"BLOCKED",parry:"PARRIED",dodge:"DODGED"}[event.type], "guard"));
  } else if (event.type === "miss" &&
      (event.actor === "player" || event.actor === "enemy")) {
    sides[event.actor].push(token("MISSED", "guard"));
  } else if (event.type === "initiative" &&
      (event.actor === "player" || event.actor === "enemy")) {
    sides[event.actor].push(token("FIRST STRIKE", "neutral"));
  } else if (event.type === "victory") {
    sides.player.push(token(combatVerdict(event).label,"gain"));
  } else if (event.type === "defeat") {
    sides.player.push(token(combatVerdict(event).label,"damage"));
  } else if (event.type === "double_death") {
    sides.player.push(token("EXECUTED", "damage"));
    sides.enemy.push(token("EXECUTED", "damage"));
  } else if (event.type === "stalemate") {
    sides.player.push(token("DRAW","neutral"));
  }

  // Future healing abilities can submit an explicit resolved map.
  // The current combat engine emits no such field, so it never fabricates +HP.
  if (event.heals && typeof event.heals === "object") {
    for (const side of ["player","enemy"]) {
      if (safePositive(event.heals[side]))
        sides[side].push(token("+" + event.heals[side],"gain","HP"));
    }
  }
  return sides;
}

/** Compact truthful gains from a bounded work report (live or offline batch). */
export function workReadoutForReport(report, labels, activities) {
  if (!report || !report.completed || !report.activity || report.activity === "fighting" ||
      !Object.hasOwn(activities,report.activity)) return null;
  const result = { activity: report.activity, title: activities[report.activity].title, tokens: [] };
  for (const [item, amount] of Object.entries(report.items ?? {})) {
    if (safePositive(amount) && Object.hasOwn(labels,item))
      result.tokens.push(token("+" + amount,"gain",labels[item]));
  }
  if (safePositive(report.gainedXP))
    result.tokens.push(token("+" + report.gainedXP,"gain","XP"));
  for (const [item, amount] of Object.entries(report.consumed ?? {})) {
    if (safePositive(amount) && Object.hasOwn(labels,item))
      result.tokens.push(token("-" + amount,"damage",labels[item]));
  }
  if (!result.tokens.length) result.tokens.push(token("NO NEW GAINS","neutral"));
  return result;
}
