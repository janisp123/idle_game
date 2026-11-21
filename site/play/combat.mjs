/**
 * GAME-011 / COMBAT-V1 — small, pure, automatic duel resolver.
 *
 * This module never reads clocks, storage, DOM or network; it never changes XP.
 * Rules are provisional alpha balance numbers in one place. Combat narration
 * describes events actually returned by the resolver, not random flavour rolls.
 * Only the present bout is reconstructed from a stable seed, so returning after
 * decades is O(1) in elapsed years. Historical kill counts are NOT invented.
 */
export const COMBAT_BALANCE = Object.freeze({
  eventMs: 20_000,                 // One meaningful beat every 20 real seconds.
  slotsPerBout: 16,               // 5 min 20 sec maximum before another bout.
  maxExchanges: 14,
  startingHP: 24,
  hpPerEndurance: 2,
  baseDamage: 6,
  damagePerStrength: 0.5,
  damagePerSkill: 1.4,
  baseHitChance: 0.72,
  dodgeChance: 0.18,
  blockChance: 0.18,
  finisherWindowHP: 0.5,         // Dice only when a CLEAN hit finds a vulnerable target.
  minHitChance: 0.15,
  maxHitChance: 0.96
});
export const BOUT_MS = COMBAT_BALANCE.eventMs * COMBAT_BALANCE.slotsPerBout;
export const COMBAT_WEAPONS = Object.freeze(["hammer", "axe", "sword", "spear"]);
export const COMBAT_ART = Object.freeze({
  engage: "fighting" // Only use paintings that honestly match an outcome.
});

const OPPONENTS = Object.freeze([
  ["Varrik the Loud", "axe", 10, 9, 10, 1],
  ["Odran Ironjaw", "hammer", 13, 7, 13, 2],
  ["Kest the Crow", "sword", 8, 13, 9, 1],
  ["Brann of the Ash", "spear", 12, 11, 11, 2]
]);

const bounded = (value, low, high) => Math.max(low, Math.min(high, value));
const validStat = n => Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER / 100;
const isInteger = n => Number.isSafeInteger(n) && n >= 0;
const roll = random => {
  const n = random();
  if (!Number.isFinite(n) || n < 0 || n >= 1) throw new RangeError("Invalid combat roll");
  return n;
};
export const seededCombatRandom = seed => {
  if (!isInteger(seed)) throw new RangeError("Invalid combat seed");
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 0x100000000;
  };
};
export function rollSkullDice(random) {
  return [1 + Math.floor(roll(random) * 6),
    1 + Math.floor(roll(random) * 6),
    1 + Math.floor(roll(random) * 6)];
}
function validateFighter(f) {
  if (!f || typeof f !== "object" || typeof f.name !== "string" ||
      !f.name || f.name.length > 40 || !COMBAT_WEAPONS.includes(f.weapon) ||
      !["str", "dex", "end", "skill"].every(k => validStat(f[k])))
    throw new RangeError("Invalid fighter");
}
export function makeOpponent(bout) {
  if (!isInteger(bout)) throw new RangeError("Invalid bout");
  const [name, weapon, str, dex, end, skill] = OPPONENTS[bout % OPPONENTS.length];
  return { name, weapon, str, dex, end, skill };
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
  if (!isInteger(total)) throw new RangeError("Combat clock exceeded safe range");
  return { ...session, elapsedMs: total };
}
function sentence(actor, text) {
  return actor.id === "player" ? "You " + text : actor.name + " " + text;
}
const finishers = Object.freeze({
  hammer: "brings the hammer down in a crushing final blow",
  axe: "tears through the broken guard with a savage axe blow",
  sword: "finds the opening and drives the sword home",
  spear: "pins the fallen opponent with a decisive spear thrust"
});
function normalized(f, id) {
  const maxHP = Math.max(1, Math.round(COMBAT_BALANCE.startingHP +
    COMBAT_BALANCE.hpPerEndurance * f.end));
  return { ...f, id, hp: maxHP, maxHP, opening: false };
}

/** Fully resolves one bounded duel. Nothing here grants loot or kills a character permanently. */
export function simulateDuel(player, opponent, random) {
  validateFighter(player);
  validateFighter(opponent);
  if (typeof random !== "function") throw new RangeError("Invalid random source");
  const p = normalized(player, "player");
  const e = normalized(opponent, "enemy");
  const events = [{
    type: "engage", actor: null, target: null,
    text: "You face " + e.name + " in the fighting pit. Neither yields the ground."
  }];
  for (let turn = 0; turn < COMBAT_BALANCE.maxExchanges && p.hp > 0 && e.hp > 0; turn++) {
    const a = turn % 2 === 0 ? p : e;
    const d = turn % 2 === 0 ? e : p;
    const hit = bounded(COMBAT_BALANCE.baseHitChance +
      (a.dex - d.dex) * 0.012 + (a.skill - d.skill) * 0.015 +
      (a.opening ? 0.1 : 0), COMBAT_BALANCE.minHitChance, COMBAT_BALANCE.maxHitChance);
    a.opening = false;
    if (roll(random) >= hit) {
      a.opening = true;
      events.push({ type: "miss", actor: a.id, target: d.id, damage: 0,
        text: sentence(a, "overreach" + (a.id === "player" ? " and leave an opening." :
          "es and leave an opening.")) });
      continue;
    }
    const defense = roll(random);
    const dodge = bounded(COMBAT_BALANCE.dodgeChance + (d.dex - a.dex) * 0.006, 0.03, 0.42);
    if (defense < dodge) {
      events.push({ type: "dodge", actor: d.id, target: a.id, damage: 0,
        text: sentence(d, d.id === "player" ? "slip aside as the blade cuts empty air." :
          "slips aside as the blow passes.") });
      continue;
    }
    if (defense < dodge + COMBAT_BALANCE.blockChance) {
      events.push({ type: "block", actor: d.id, target: a.id, damage: 0,
        text: sentence(d, d.id === "player" ? "catch the blow on your guard." :
          "catches the blow behind a battered shield.") });
      continue;
    }
    const vulnerable = d.hp <= d.maxHP * COMBAT_BALANCE.finisherWindowHP;
    const dice = vulnerable ? rollSkullDice(random) : null;
    const triple = dice && dice.every(n => n === 6);
    if (triple) {
      d.hp = 0;
      events.push({ type: "finisher", actor: a.id, target: d.id, dice,
        damage: null, hpAfter: 0,
        text: "6–6–6! " + sentence(a, a.id === "player"
          ? finishers[a.weapon] + ". The enemy falls and does not rise."
          : finishers[a.weapon].replace("brings", "bring").replace("tears", "tear")
            .replace("finds", "find").replace("pins", "pin") +
            ". You fall, and the pit wardens carry you clear.") });
      break;
    }
    const damage = Math.max(1, Math.round(COMBAT_BALANCE.baseDamage +
      a.str * COMBAT_BALANCE.damagePerStrength +
      a.skill * COMBAT_BALANCE.damagePerSkill));
    d.hp = Math.max(0, d.hp - damage);
    const grounded = d.hp === 0;
    const wounded = d.hp <= d.maxHP * COMBAT_BALANCE.finisherWindowHP;
    const action = a.weapon === "hammer" ? "hammer" :
      a.weapon === "axe" ? "axe" : a.weapon === "spear" ? "spear" : "sword";
    const text = a.id === "player"
      ? "Your " + action + " lands cleanly. " +
        (grounded ? e.name + " collapses." : wounded ? e.name + " staggers, badly hurt." :
          e.name + " reels from the blow.")
      : e.name + " lands a brutal " + action + " strike. " +
        (grounded ? "You fall to the ground." : wounded ? "You stagger and struggle to stand." :
          "You struggle to recover.");
    events.push({ type: grounded ? "collapse" : wounded ? "wound" : "strike",
      actor: a.id, target: d.id, damage, hpAfter: d.hp, dice, text });
  }
  let outcome;
  if (e.hp === 0) outcome = "victory";
  else if (p.hp === 0) outcome = "defeat";
  else outcome = "stalemate";
  const finalText = outcome === "victory" ? e.name + " is beaten. You stand victorious." :
    outcome === "defeat" ? "You are defeated. The wardens retrieve you; your progress is safe." :
      "Both warriors withdraw, bloodied and exhausted.";
  events.push({ type: outcome, actor: null, target: null, text: finalText });
  return { events, outcome, playerHP: p.hp, enemyHP: e.hp, enemy: e.name };
}

/**
 * Build ONLY the currently observable bout; no replay of thousands of offline
 * encounters or fabricated retrospective kill counts. Deterministic across
 * browser refreshes and repeated checks of the same session.
 */
export function combatAtTime(session) {
  if (!validCombatSession(session) || !session) return null;
  const bout = Math.floor(session.elapsedMs / BOUT_MS);
  const inside = session.elapsedMs % BOUT_MS;
  const seed = (Math.imul(session.seed ^ (bout >>> 0), 2654435761) + (bout >>> 16)) >>> 0;
  const duel = simulateDuel(session.player, makeOpponent(bout), seededCombatRandom(seed));
  const step = Math.min(duel.events.length - 1, Math.floor(inside / COMBAT_BALANCE.eventMs));
  return { ...duel, bout: bout + 1, step, event: duel.events[step] };
}
