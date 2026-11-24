import { chooseArena } from "./arenas.mjs?v=glad-004";
/** Seeded, bounded arena timeline shared by play, prizes and the simulator. */
import { resolvePhysicalDuel } from "./physical-duel.mjs?v=glad-004";
import { equippedCondition } from "./smith.mjs?v=glad-003";
import { COMBAT_SKILLS, COMBAT_LOADOUTS, DEFAULT_COMBAT_LOADOUT, validCombatLoadout }
  from "./combat-skills.mjs?v=glad-002";
import { armourStats, initialArmour } from "./armour.mjs?v=glad-003";
export { COMBAT_SKILLS, COMBAT_LOADOUTS, DEFAULT_COMBAT_LOADOUT, validCombatLoadout }
  from "./combat-skills.mjs?v=glad-002";
export { COMBAT_ART } from "./combat-art.mjs?v=glad-003";

export const BOUT_MS = 200_000;
export const RESURRECTION_MS = 20_000;
import { benchmark, validTier } from "./difficulty.mjs?v=glad-004";
const ENCOUNTERS=[
  {role:"Tank",weapon:"sword_shield",sets:["plate"]},
  {role:"Vanguard",weapon:"greatsword",sets:["leather","plate"]},
  {role:"Breaker",weapon:"hammer",sets:["leather","plate"]},
  {role:"Archer",weapon:"bow",sets:["leather"]},
  {role:"Spearman",weapon:"spear",sets:["padded","leather"]}
];
const OPPONENTS = ["Varrik the Loud", "Odran Ironjaw", "Kest the Crow", "Brann of the Ash"];
const validUnsigned = value => Number.isSafeInteger(value) && value >= 0;
const validStat = value => Number.isFinite(value) && value >= 0 &&
  value <= Number.MAX_SAFE_INTEGER / 100;
export function seededCombatRandom(seed) {
  if (!validUnsigned(seed)) throw new RangeError("Invalid combat seed");
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 0x100000000;
  };
}
const validGear = gear => gear && typeof gear === "object" && !Array.isArray(gear) &&
  ["physicalReductionPct","evasionScore","dodgeMargin",
   "initiativePenalty","mobilityPct","totalKg","armourKg","weaponKg"].every(k =>
     typeof gear[k] === "number" && Number.isFinite(gear[k])) &&
  (gear.gearDefense === undefined || (Number.isSafeInteger(gear.gearDefense) &&
    gear.gearDefense >= 0 && gear.gearDefense <= 10000)) &&
  gear.physicalReductionPct >= 0 && gear.physicalReductionPct <= 60 &&
  gear.evasionScore >= -4 && gear.evasionScore <= 4 &&
  gear.dodgeMargin >= 1 && gear.dodgeMargin <= 99 &&
  gear.initiativePenalty >= 0 && gear.initiativePenalty <= 4 &&
  gear.mobilityPct >= 60 && gear.mobilityPct <= 100 &&
  gear.totalKg >= 0 && gear.totalKg <= 60 &&
  gear.armourKg >= 0 && gear.armourKg <= 40 &&
  gear.weaponKg >= 0 && gear.weaponKg <= 12;
const validPiece = piece => Boolean(piece && Number.isSafeInteger(piece.maxHP) &&
  piece.maxHP > 0 && piece.maxHP <= 1000 && typeof piece.breakable === "boolean");

function validCondition(condition) {
  return Boolean(condition && validPiece(condition.weapon) &&
    (condition.shield === null || validPiece(condition.shield)) &&
    condition.armour && typeof condition.armour === "object" && !Array.isArray(condition.armour) &&
    Object.entries(condition.armour).every(([id, piece]) =>
      ["head", "torso", "arms", "legs"].includes(id) && validPiece(piece) &&
      Number.isFinite(piece.protection) && piece.protection >= 0 && piece.protection <= 50));
}

function validateFighter(f) {
  if (!f || typeof f !== "object" || typeof f.name !== "string" || !f.name ||
    f.name.length > 40 || !validCombatLoadout(f.loadout) ||
    !["str","dex","end","skill"].every(k => validStat(f[k])) ||
    (f.difficulty!==undefined && !validTier(f.difficulty)) ||
    (f.defenseSkill !== undefined && f.defenseSkill !== null &&
      COMBAT_SKILLS[f.defenseSkill]?.role !== "defense") ||
    (f.gear !== undefined && !validGear(f.gear)) ||
    (f.condition !== undefined && !validCondition(f.condition)) ||
    (f.gearAttack !== undefined && (!Number.isSafeInteger(f.gearAttack) ||
      f.gearAttack < 0 || f.gearAttack > 10000)))
    throw new RangeError("Invalid fighter");
}
export function makeOpponent(bout,tier=0,random=seededCombatRandom(bout)) {
  if (!validUnsigned(bout)) throw new RangeError("Invalid bout number");
  const pick=list=>list[Math.floor(random()*list.length)];
  const model=benchmark(tier),profile=pick(ENCOUNTERS),armour=pick(profile.sets);
  const loadout=profile.weapon;
  const pieces=Object.fromEntries(Object.keys(initialArmour()).map(id=>[id,armour]));
  const stat=()=>model.stat+Math.floor(random()*5)-2;
  return {name:OPPONENTS[bout%OPPONENTS.length],role:profile.role,armour,loadout,
    str:stat(),dex:stat(),end:stat(),skill:model.skill,gearAttack:model.gearPower,
    condition: equippedCondition(pieces, loadout, { [loadout]: { grade: tier, quality: "poor" } }),
    gear:{...armourStats(pieces,loadout),gearDefense:model.gearPower}};

}
export function validCombatSession(session) {
  return session === null || Boolean(session && typeof session === "object" &&
    !Array.isArray(session) && validUnsigned(session.elapsedMs) &&
    validUnsigned(session.seed) && session.seed <= 0xffffffff &&
    (session.prizeCursor === undefined || validUnsigned(session.prizeCursor) &&
      session.prizeCursor <= Math.floor(session.elapsedMs / BOUT_MS)) &&
    (()=>{try{validateFighter(session.player);return true;}catch{return false;}})());
}
export function startCombatSession(player, seed) {
  validateFighter(player);
  if (!validUnsigned(seed)) throw new RangeError("Invalid combat seed");
  return {timelineVersion:2,elapsedMs:0,seed:seed>>>0,player:{...player}};
}
export function advanceCombatSession(session, elapsedMs) {
  if (!validCombatSession(session) || !session || !validUnsigned(elapsedMs))
    throw new RangeError("Invalid combat time");
  const total=session.elapsedMs+elapsedMs;
  if (!validUnsigned(total)) throw new RangeError("Combat clock exceeded safe range");
  return {...session,elapsedMs:total};
}
// The interim arena repeats a seeded match schedule per frozen build. A full
// schedule can be counted once when settling many years of exact prizes.
export const ARENA_SCHEDULE_BOUTS = 256;

/** Rebuild only the observable duel, in bounded work over arbitrary time. */
export function combatAtTime(session) {
  if(!validCombatSession(session)||!session)return null;
  const bout=Math.floor(session.elapsedMs/BOUT_MS);
  const inside=session.elapsedMs%BOUT_MS;
  const scheduledBout = bout % ARENA_SCHEDULE_BOUTS;
  const seed = Math.imul(session.seed ^ scheduledBout, 2654435761) >>> 0;
  const foe=makeOpponent(bout,session.player.difficulty??0,seededCombatRandom((seed^0x35b6d119)>>>0));
  const positioning = chooseArena(session.player, foe, seededCombatRandom((seed ^ 0x749ae237) >>> 0));
  const terrain = positioning.arena;
  const duel = resolvePhysicalDuel(session.player, foe, seed, terrain);
  // The existing fixed arena schedule remains the unit of offline settlement.
  // Reserve the end of each bout for its outcome and automatic recovery.
  const eventMs = Math.floor((BOUT_MS - RESURRECTION_MS - 5_000) / (duel.events.length - 1));
  const step = Math.min(duel.events.length - 1, Math.floor(inside / eventMs));
  const recoveryMs = inside - step * eventMs;
  return { ...duel, terrain, positioning, enemyRole: foe.role, enemyArmour: foe.armour,
    bout: bout + 1, enemyLoadout: foe.loadout, step, eventElapsedMs: recoveryMs,
    event: duel.events[step], progress: inside / BOUT_MS,
    recovering: inside >= BOUT_MS - RESURRECTION_MS };
}
