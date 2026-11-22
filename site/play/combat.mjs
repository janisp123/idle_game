/**
 * GAME-011 / COMBAT-V2 alpha: two equipped skills per fighter (attack + defense).
 * A bounded duel is simulated with seeded RNG, never by DOM or wall-clock ticks.
 * Each meaningful step is a real attack, charge, defense, wound or outcome.
 * Balance is provisional; see docs/mechanics/COMBAT.md.
 */
import {
  COMBAT_SKILLS, COMBAT_LOADOUTS, DEFAULT_COMBAT_LOADOUT, validCombatLoadout
} from "./combat-skills.mjs?v=20261122-combat-skills1";
export { COMBAT_SKILLS, COMBAT_LOADOUTS, DEFAULT_COMBAT_LOADOUT, validCombatLoadout }
  from "./combat-skills.mjs?v=20261122-combat-skills1";

export const COMBAT_BALANCE = Object.freeze({
  eventMs: 20_000,
  slotsPerBout: 16,
  maxExchanges: 14,
  startingHP: 24,
  hpPerEndurance: 2,
  baseDamage: 6,
  damagePerStrength: 0.5,
  damagePerSkill: 1.4,
  baseHitChance: 0.72,
  accuracyPerDex: 0.012,
  accuracyPerSkill: 0.015,
  openingAccuracyBonus: 0.10,
  minHitChance: 0.15,
  maxHitChance: 0.96,
  dodgeChance: 0.10,
  dodgePerDex: 0.006,
  minDodgeChance: 0.02,
  maxDodgeChance: 0.28,
  untrainedGuardChance: 0.035,
  finisherWindowHP: 0.5
});
export const BOUT_MS = COMBAT_BALANCE.eventMs * COMBAT_BALANCE.slotsPerBout;
// Stable public export, while scene matching lives in its own pure art module.
export { COMBAT_ART } from "./combat-art.mjs?v=20261122-combat-scenes1";
const OPPONENTS = Object.freeze([
  ["Varrik the Loud", "sword_shield", 10, 9, 10, 1],
  ["Odran Ironjaw", "greatsword", 13, 7, 13, 2],
  ["Kest the Crow", "sword_shield", 8, 13, 9, 1],
  ["Brann of the Ash", "greatsword", 12, 11, 11, 2]
]);
const bounded = (n, min, max) => Math.max(min, Math.min(max, n));
const isInteger = n => Number.isSafeInteger(n) && n >= 0;
const validStat = n => Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER / 100;
function roll(random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new RangeError("Invalid combat roll");
  return value;
}
export const seededCombatRandom = seed => {
  if (!isInteger(seed)) throw new RangeError("Invalid combat seed");
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 0x100000000;
  };
};
export const rollSkullDice = random => [
  1 + Math.floor(roll(random) * 6),
  1 + Math.floor(roll(random) * 6),
  1 + Math.floor(roll(random) * 6)
];

/** A missing defense skill is allowed for future NPCs and tested explicitly.
 * It means weak stat-based evasion/parry, NEVER a free Shield Block.
 */
function validateFighter(f) {
  if (!f || typeof f !== "object" || typeof f.name !== "string" ||
      !f.name || f.name.length > 40 || !validCombatLoadout(f.loadout) ||
      !["str", "dex", "end", "skill"].every(k => validStat(f[k])) ||
      (f.defenseSkill !== undefined && f.defenseSkill !== null &&
        (COMBAT_SKILLS[f.defenseSkill]?.role !== "defense")))
    throw new RangeError("Invalid fighter");
}
export function makeOpponent(bout) {
  if (!isInteger(bout)) throw new RangeError("Invalid bout");
  const [name, loadout, str, dex, end, skill] = OPPONENTS[bout % OPPONENTS.length];
  return { name, loadout, str, dex, end, skill };
}
export function validCombatSession(value) {
  return value === null || Boolean(value && typeof value === "object" &&
    !Array.isArray(value) && isInteger(value.elapsedMs) &&
    isInteger(value.seed) && value.seed <= 0xffffffff &&
    (() => { try { validateFighter(value.player); return true; } catch { return false; } })());
}
export function startCombatSession(player, seed) {
  validateFighter(player);
  if (!isInteger(seed)) throw new RangeError("Invalid combat seed");
  return { elapsedMs: 0, seed: seed >>> 0, player: { ...player } };
}
export function advanceCombatSession(session, elapsedMs) {
  if (!validCombatSession(session) || !session || !isInteger(elapsedMs))
    throw new RangeError("Invalid combat session or elapsed time");
  const total = session.elapsedMs + elapsedMs;
  if (!isInteger(total)) throw new RangeError("Combat clock exceeds safe range");
  return { ...session, elapsedMs: total };
}
function normalized(f, id) {
  const maxHP = Math.max(1, Math.round(COMBAT_BALANCE.startingHP +
    COMBAT_BALANCE.hpPerEndurance * f.end));
  const loadout = COMBAT_LOADOUTS[f.loadout];
  return { ...f, id, maxHP, hp: maxHP, opening: false,
    charging: 0,
    attackSkill: COMBAT_SKILLS[loadout.attackSkill],
    defenseAbility: f.defenseSkill === null ? null :
      COMBAT_SKILLS[f.defenseSkill ?? loadout.defenseSkill] };
}
const actorLabel = a => a.id === "player" ? "You" : a.name;
const sourceText = (a, playerText, enemyText) =>
  a.id === "player" ? playerText : a.name + " " + enemyText;
const finishers = Object.freeze({
  greatsword: {
    player: "Your enormous blade tears through the broken guard and ends the fight.",
    enemy: "drives his greatsword through your broken defense."
  },
  sword_shield: {
    player: "You lunge behind your shield and deliver a ruthless final thrust.",
    enemy: "steps through your guard and delivers a fatal thrust."
  }
});
/** A resolved attack is always paired with a separate defense roll. */
function resolveStrike(a, d, random) {
  const attack = a.attackSkill;
  const defense = d.defenseAbility;
  const attackChance = bounded(COMBAT_BALANCE.baseHitChance +
    (a.dex - d.dex) * COMBAT_BALANCE.accuracyPerDex +
    (a.skill - d.skill) * COMBAT_BALANCE.accuracyPerSkill +
    (a.opening ? COMBAT_BALANCE.openingAccuracyBonus : 0) +
    attack.accuracyBonus,
    COMBAT_BALANCE.minHitChance, COMBAT_BALANCE.maxHitChance);
  a.opening = false;
  const attackRoll = roll(random);
  const meta = { actor: a.id, target: d.id, attackSkill: attack.id,
    defenseSkill: defense?.id ?? null, attackRoll, defenseRoll: null, damage: 0 };
  if (attackRoll >= attackChance) {
    d.opening = true;
    return { type: "miss", ...meta, text: sourceText(a,
      "Your " + attack.name + " goes wide, leaving you exposed.",
      "misses with " + attack.name + " and leaves an opening.") };
  }
  const defenseRoll = roll(random);
  meta.defenseRoll = defenseRoll;
  const dodge = bounded(COMBAT_BALANCE.dodgeChance +
    (d.dex - a.dex) * COMBAT_BALANCE.dodgePerDex,
    COMBAT_BALANCE.minDodgeChance, COMBAT_BALANCE.maxDodgeChance);
  if (defenseRoll < dodge) {
    d.opening = true;
    return { type: "dodge", ...meta, text: sourceText(d,
      "You dodge the " + attack.name + " and find a counter opening.",
      "dodges the " + attack.name + " and finds an opening.") };
  }
  const guardChance = defense?.guardChance ?? COMBAT_BALANCE.untrainedGuardChance;
  if (defenseRoll < dodge + guardChance) {
    const type = defense?.result ?? "parry";
    return { type, ...meta,
      text: sourceText(d,
        "You use " + (defense?.name ?? "instinctive parrying") +
          " to turn aside the " + attack.name + ".",
        "uses " + (defense?.name ?? "a desperate parry") +
          " to stop the " + attack.name + ".") };
  }
  const dice = d.hp <= d.maxHP * COMBAT_BALANCE.finisherWindowHP
    ? rollSkullDice(random) : null;
  if (dice?.every(n => n === 6)) {
    d.hp = 0;
    return { type: "finisher", ...meta, hpAfter: 0, dice,
      text: "6–6–6! " + (a.id === "player"
        ? finishers[a.loadout].player
        : a.name + " " + finishers[a.loadout].enemy +
          " You fall; the pit wardens retrieve you.") };
  }
  const base = COMBAT_BALANCE.baseDamage + a.str * COMBAT_BALANCE.damagePerStrength +
    a.skill * COMBAT_BALANCE.damagePerSkill;
  const damage = Math.max(1, Math.round(base * attack.damageMultiplier));
  d.hp = Math.max(0, d.hp - damage);
  const type = d.hp === 0 ? "collapse" :
    d.hp <= d.maxHP * COMBAT_BALANCE.finisherWindowHP ? "wound" : "strike";
  const description = d.hp === 0 ? "collapses." :
    type === "wound" ? "staggers, badly hurt." : "reels from the impact.";
  return { type, ...meta, damage, hpAfter: d.hp, dice,
    text: a.id === "player"
      ? "Your " + attack.name + " lands for " + damage + " damage. " + d.name + " " + description
      : a.name + "'s " + attack.name + " lands for " + damage +
        " damage. " + (d.hp === 0 ? "You fall." : "You struggle to recover.") };
}
/** Each fighter gets exactly one turn at a time, including wind-up turns.
 * Attack skill is automatic. On a successful attack roll, the opponent always
 * gets a defense roll (skill or weak stat-only fallback). No per-turn clicks.
 */
export function simulateDuel(player, opponent, random) {
  validateFighter(player); validateFighter(opponent);
  if (typeof random !== "function") throw new RangeError("Invalid random source");
  const p = normalized(player, "player"), e = normalized(opponent, "enemy");
  const events = [{ type: "engage", actor: null, target: null,
    text: "You face " + e.name + " in the fighting pit. " +
      COMBAT_LOADOUTS[p.loadout].name + " against " + COMBAT_LOADOUTS[e.loadout].name + "." }];
  for (let turn = 0; turn < COMBAT_BALANCE.maxExchanges && p.hp > 0 && e.hp > 0; turn++) {
    const a = turn % 2 === 0 ? p : e, d = turn % 2 === 0 ? e : p;
    // A giant blade needs a full preparation turn before its next swing.
    // This is an actual combat beat, not a visual delay or extra RNG draw.
    if (a.charging === 0 && a.attackSkill.chargeTurns > 0) {
      a.charging = a.attackSkill.chargeTurns;
      events.push({ type: "charge", actor: a.id, target: d.id,
        attackSkill: a.attackSkill.id, damage: 0,
        text: sourceText(a,
          "You set your feet and draw back the enormous greatsword for Heavy Swing.",
          "draws back a greatsword, preparing a Heavy Swing.") });
      continue;
    }
    if (a.charging > 0) a.charging--;
    events.push(resolveStrike(a, d, random));
  }
  const outcome = e.hp === 0 ? "victory" : p.hp === 0 ? "defeat" : "stalemate";
  const finalText = outcome === "victory" ? e.name + " is beaten. You stand victorious." :
    outcome === "defeat" ? "You are defeated. The wardens retrieve you; your progress is safe." :
      "Both warriors withdraw, bloodied and exhausted.";
  events.push({ type: outcome, actor: null, target: null, text: finalText });
  return { events, outcome, playerHP: p.hp, enemyHP: e.hp, enemy: e.name };
}
/** Only construct the visible duel, never replay years of unseen combats. */
export function combatAtTime(session) {
  if (!validCombatSession(session) || !session) return null;
  const bout = Math.floor(session.elapsedMs / BOUT_MS);
  const inside = session.elapsedMs % BOUT_MS;
  const seed = (Math.imul(session.seed ^ (bout >>> 0), 2654435761) + (bout >>> 16)) >>> 0;
  const opponent = makeOpponent(bout);
  const duel = simulateDuel(session.player, opponent, seededCombatRandom(seed));
  const step = Math.min(duel.events.length - 1, Math.floor(inside / COMBAT_BALANCE.eventMs));
  return { ...duel, bout: bout + 1, enemyLoadout: opponent.loadout,
    step, event: duel.events[step] };
}
