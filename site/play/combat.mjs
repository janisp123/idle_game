/**
 * GAME-011: short, spectacle-first three-dice duels.
 *
 * The simulation resolves a maximum of three attack attempts for each fighter;
 * the browser reveals its results AFTER the visible dice phase. A duel is
 * reconstructed deterministically in O(1) work from the currently visible
 * bout and never replays all historical offline fights.
 *
 * Main rates are centralized in COMBAT_BALANCE; weapon skill modifiers in
 * combat-skills.mjs; paintings in combat-art.mjs. No DOM or timers here.
 */
import { COMBAT_SKILLS, COMBAT_LOADOUTS, DEFAULT_COMBAT_LOADOUT, validCombatLoadout }
  from "./combat-skills.mjs?v=20261122-dice-duels1";
import { armourStats, initialArmour } from "./armour.mjs?v=20261122-armour-balance1";
export { COMBAT_SKILLS, COMBAT_LOADOUTS, DEFAULT_COMBAT_LOADOUT, validCombatLoadout }
  from "./combat-skills.mjs?v=20261122-dice-duels1";
export { COMBAT_ART } from "./combat-art.mjs?v=20261122-dice-duels1";

export const COMBAT_BALANCE = Object.freeze({
  eventMs: 25_000,                    // Each phase lingers; no rapid slideshow.
  maxHalfTurns: 6,                   // At most THREE attacks each, never fourteen.
  slotsPerBout: 9,                   // Engage + initiative + six turns + aftermath.
  initiativeAnimationMs: 3_500,
  attackAnimationMs: 3_500,          // Extra weapon windup is from COMBAT_SKILLS.
  startingStat: 10,
  baseHP: 16,
  hpPerEndurance: 1.4,
  baseDamage: 6,
  damagePerStrength: 0.5,
  damagePerSkill: 1.4,
  dexPerScorePoint: 6,
  endurancePerDefensePoint: 8,
  levelsPerScorePoint: 6,
  counterOpeningBonus: 2,
  untrainedDefensePenalty: 2,
  dodgeMargin: 7,
  missDiceThreshold: 5,             // 3/4/5 on 3d6 is a real blunder.
  criticalFinisherMargin: 1,        // 6–6–6 is deadly when attack beats defense.
  initiativeRerolls: 3
});
export const BOUT_MS = COMBAT_BALANCE.eventMs * COMBAT_BALANCE.slotsPerBout;
const OPPONENTS = Object.freeze([
  ["Varrik the Loud", "sword_shield", 10, 9, 10, 1],
  ["Odran Ironjaw", "greatsword", 13, 7, 13, 2],
  ["Kest the Crow", "sword_shield", 8, 13, 9, 1],
  ["Brann of the Ash", "greatsword", 12, 11, 11, 2]
]);
const validUnsigned = value => Number.isSafeInteger(value) && value >= 0;
const validStat = value => Number.isFinite(value) && value >= 0 &&
  value <= Number.MAX_SAFE_INTEGER / 100;
const sum = dice => dice.reduce((a, n) => a + n, 0);
const tripleSix = dice => dice.every(n => n === 6);
function roll(random) {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1)
    throw new RangeError("Invalid combat random roll");
  return value;
}
export function rollSkullDice(random) {
  return [1 + Math.floor(roll(random) * 6),
    1 + Math.floor(roll(random) * 6),
    1 + Math.floor(roll(random) * 6)];
}
export function seededCombatRandom(seed) {
  if (!validUnsigned(seed)) throw new RangeError("Invalid combat seed");
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 0x100000000;
  };
}
const validGear = gear => gear && typeof gear === "object" && !Array.isArray(gear) &&
  ["physicalReductionPct","magicResistancePct","evasionScore","dodgeMargin",
   "initiativePenalty","mobilityPct","totalKg","armourKg","weaponKg"].every(k =>
     typeof gear[k] === "number" && Number.isFinite(gear[k])) &&
  (gear.defenseEnchant === undefined || (Number.isSafeInteger(gear.defenseEnchant) &&
    gear.defenseEnchant >= 0 && gear.defenseEnchant <= 220)) &&
  gear.physicalReductionPct >= 0 && gear.physicalReductionPct <= 60 &&
  gear.magicResistancePct >= 0 && gear.magicResistancePct <= 55 &&
  gear.evasionScore >= -4 && gear.evasionScore <= 4 &&
  gear.dodgeMargin >= 1 && gear.dodgeMargin <= 99 &&
  gear.initiativePenalty >= 0 && gear.initiativePenalty <= 4 &&
  gear.mobilityPct >= 60 && gear.mobilityPct <= 100 &&
  gear.totalKg >= 0 && gear.totalKg <= 60 &&
  gear.armourKg >= 0 && gear.armourKg <= 40 &&
  gear.weaponKg >= 0 && gear.weaponKg <= 12;
function validateFighter(f) {
  if (!f || typeof f !== "object" || typeof f.name !== "string" || !f.name ||
    f.name.length > 40 || !validCombatLoadout(f.loadout) ||
    !["str","dex","end","skill"].every(k => validStat(f[k])) ||
    (f.defenseSkill !== undefined && f.defenseSkill !== null &&
      COMBAT_SKILLS[f.defenseSkill]?.role !== "defense") ||
    (f.gear !== undefined && !validGear(f.gear)) ||
    (f.attackEnchant !== undefined && (!Number.isSafeInteger(f.attackEnchant) ||
      f.attackEnchant < 0 || f.attackEnchant > 20)))
    throw new RangeError("Invalid fighter");
}
export function makeOpponent(bout) {
  if (!validUnsigned(bout)) throw new RangeError("Invalid bout number");
  const [name,loadout,str,dex,end,skill] = OPPONENTS[bout % OPPONENTS.length];
  // Opponents use starter Robe gear, not fictional heavy armour they never own.
  return {name,loadout,str,dex,end,skill,gear:armourStats(initialArmour(),loadout)};
}
export function validCombatSession(session) {
  return session === null || Boolean(session && typeof session === "object" &&
    !Array.isArray(session) && validUnsigned(session.elapsedMs) &&
    validUnsigned(session.seed) && session.seed <= 0xffffffff &&
    (session.gloryCursor === undefined && session.gloryEligibleUntilMs === undefined ||
      validUnsigned(session.gloryCursor) && validUnsigned(session.gloryEligibleUntilMs) &&
      session.gloryCursor <= Math.floor(session.elapsedMs/BOUT_MS)+1) &&
    (()=>{try{validateFighter(session.player);return true;}catch{return false;}})());
}
export function startCombatSession(player, seed) {
  validateFighter(player);
  if (!validUnsigned(seed)) throw new RangeError("Invalid combat seed");
  return {elapsedMs:0,seed:seed>>>0,player:{...player}};
}
export function advanceCombatSession(session, elapsedMs) {
  if (!validCombatSession(session) || !session || !validUnsigned(elapsedMs))
    throw new RangeError("Invalid combat time");
  const total=session.elapsedMs+elapsedMs;
  if (!validUnsigned(total)) throw new RangeError("Combat clock exceeded safe range");
  return {...session,elapsedMs:total};
}
const LEGACY_NO_BONUS = Object.freeze({ physicalReductionPct:0, magicResistancePct:0,
  evasionScore:0,dodgeMargin:COMBAT_BALANCE.dodgeMargin,initiativePenalty:0 });
function normalize(f,id) {
  const abilities=COMBAT_LOADOUTS[f.loadout];
  const maxHP=Math.max(1,Math.round(COMBAT_BALANCE.baseHP+f.end*COMBAT_BALANCE.hpPerEndurance));
  return {...f,id,maxHP,hp:maxHP,opening:false,
    attackEnchant:f.attackEnchant??0,
    gear:f.gear??LEGACY_NO_BONUS,
    attackAbility:COMBAT_SKILLS[abilities.attackSkill],
    defenseAbility:f.defenseSkill===null?null:
      COMBAT_SKILLS[f.defenseSkill??abilities.defenseSkill]};
}
const label = a => a.id === "player" ? "You" : a.name;
function scoreStats(a,side) {
  const dex=Math.floor((a.dex-COMBAT_BALANCE.startingStat)/COMBAT_BALANCE.dexPerScorePoint);
  if (side==="initiative")return dex;
  if (side==="attack")return dex+Math.floor((a.skill-1)/COMBAT_BALANCE.levelsPerScorePoint);
  return dex+Math.floor((a.end-COMBAT_BALANCE.startingStat)/
    COMBAT_BALANCE.endurancePerDefensePoint);
}
function initiative(player,enemy,random) {
  let playerDice,enemyDice,playerTotal=0,enemyTotal=0;
  let rerolls=0;
  do {
    playerDice=rollSkullDice(random);enemyDice=rollSkullDice(random);
    playerTotal=sum(playerDice)+scoreStats(player,"initiative")+
      (COMBAT_LOADOUTS[player.loadout].initiativeBonus??0)-player.gear.initiativePenalty;
    enemyTotal=sum(enemyDice)+scoreStats(enemy,"initiative")+
      (COMBAT_LOADOUTS[enemy.loadout].initiativeBonus??0)-enemy.gear.initiativePenalty;
    if(playerTotal!==enemyTotal)break;
    rerolls++;
  }while(rerolls<COMBAT_BALANCE.initiativeRerolls);
  // Constant seeded random used for the arena spectacle cannot spin forever
  // on a pathological equal-roll source; equal final scores go to DEX, then
  // the player. No extra attack attempt is added for ties.
  const first=playerTotal===enemyTotal
    ? player.dex>=enemy.dex?"player":"enemy"
    : playerTotal>enemyTotal?"player":"enemy";
  const starter=first==="player"?"You will strike first.":enemy.name+" strikes first.";
  return {type:"initiative",actor:first,target:first==="player"?"enemy":"player",
    playerDice,enemyDice,playerTotal,enemyTotal,rerolls,damage:0,
    text:"Skull dice decide initiative. "+
      "You roll "+playerDice.join("–")+" ("+playerTotal+"); "+
      enemy.name+" rolls "+enemyDice.join("–")+" ("+enemyTotal+"). "+
      (playerTotal===enemyTotal?"Tie broken by quickness. ":"")+starter};
}
const finisherText=Object.freeze({
  greatsword: {player:"You tear through the opponent's guard in one devastating greatsword blow.",
    enemy:"tears through your guard with a devastating greatsword blow."},
  sword_shield: {player:"Your final thrust pierces the enemy's guard and ends the duel.",
    enemy:"drives a ruthless final thrust through your guard."}
});
/** Calculate weapon damage once; blocks and parries use the SAME physical power. */
function basePhysicalDamage(a) {
  const raw=COMBAT_BALANCE.baseDamage+a.str*COMBAT_BALANCE.damagePerStrength+
    a.skill*COMBAT_BALANCE.damagePerSkill+a.attackEnchant;
  return Math.max(1,Math.round(raw*a.attackAbility.damageMultiplier));
}
function guardedImpactDamage(attacker,defender,type) {
  // A guard is already a successful defense roll. Never make another "block
  // chance" roll: the attack's nature controls how much force gets through.
  const through=type==="block"?attacker.attackAbility.blockDamagePct:
    type==="parry"?attacker.attackAbility.parryDamagePct:0;
  if (!Number.isFinite(through) || through<0 || through>100)
    throw new RangeError("Invalid weapon guard penetration");
  const impact=Math.round(basePhysicalDamage(attacker)*through/100);
  // Armour and slot enchants may absorb all transmitted impact. Unlike a
  // direct landed hit, a clean block need not force a minimum 1 HP of damage.
  const protectedImpact=Math.max(0,Math.round(impact*
    (100-defender.gear.physicalReductionPct)/100)-
    (defender.gear.defenseEnchant??0));
  return Math.min(defender.hp,protectedImpact);
}
function resolveTurn(a,d,turn,random) {
  const attackDice=rollSkullDice(random);
  const defenseDice=rollSkullDice(random);
  const opening=a.opening;
  a.opening=false;
  const attackTotal=sum(attackDice)+scoreStats(a,"attack")+
    (a.attackAbility.attackBonus??0)+(opening?COMBAT_BALANCE.counterOpeningBonus:0);
  const defenseTotal=sum(defenseDice)+scoreStats(d,"defense")+
    (d.defenseAbility?.defenseBonus??-COMBAT_BALANCE.untrainedDefensePenalty)+
    d.gear.evasionScore;
  const meta={actor:a.id,target:d.id,turn,attackSkill:a.attackAbility.id,
    defenseSkill:d.defenseAbility?.id??null,attackDice,defenseDice,
    attackTotal,defenseTotal,damage:0};
  if(sum(attackDice)<=COMBAT_BALANCE.missDiceThreshold) {
    d.opening=true;
    return {type:"miss",...meta,text:a.id==="player"?
      "Your "+a.attackAbility.name+" goes wide. "+d.name+" has an opening.":
      a.name+" overreaches with "+a.attackAbility.name+" and leaves an opening."};
  }
  if(attackTotal<=defenseTotal) {
    const gap=defenseTotal-attackTotal;
    const evasion=!d.defenseAbility || gap>=d.gear.dodgeMargin;
    const type=evasion?"dodge":d.defenseAbility.result;
    if(evasion)d.opening=true;
    const damage=evasion?0:guardedImpactDamage(a,d,type);
    d.hp-=damage;
    const prose=evasion?"dodges the blow":type==="block"?"catches the blow with a shield":
      "parries with the greatsword";
    const impact=damage?" The impact deals "+damage+" damage.":" No damage gets through.";
    return {type,...meta,damage,hpAfter:d.hp,text:d.id==="player"?
      "You "+prose+" as "+a.name+" attacks."+impact:
      d.name+" "+(evasion?"dodges":type==="block"?"blocks":"parries")+
        " your "+a.attackAbility.name+"."+impact};
  }
  if(tripleSix(attackDice) && attackTotal-defenseTotal>=COMBAT_BALANCE.criticalFinisherMargin) {
    d.hp=0;
    return {type:"finisher",...meta,hpAfter:0,dice:attackDice,
      text:"6–6–6! "+(a.id==="player"?finisherText[a.loadout].player:
        a.name+" "+finisherText[a.loadout].enemy+
          " The pit wardens carry you to safety.")};
  }
  const baseDamage=basePhysicalDamage(a);
  // Armour mitigates a LANDED physical hit; the 6–6–6 finisher remains an
  // exceptional opposed-roll event, not arbitrarily rewritten as N damage.
  // Slot enchantments are small flat bonuses, not extra dice or guaranteed
  // misses. Defence applies only after a physical hit beats the guard.
  const damage=Math.max(1,
    Math.round(baseDamage*(100-d.gear.physicalReductionPct)/100)-
      (d.gear.defenseEnchant??0));
  d.hp=Math.max(0,d.hp-damage);
  const type=d.hp===0?"collapse":d.hp<=d.maxHP/2?"wound":"strike";
  return {type,...meta,damage,hpAfter:d.hp,
    text:a.id==="player"?
      "Your "+a.attackAbility.name+" lands for "+damage+" damage. "+
        (d.hp===0?d.name+" collapses.":d.name+" staggers under the blow."):
      a.name+"'s "+a.attackAbility.name+" lands for "+damage+" damage. "+
        (d.hp===0?"You collapse.":"You struggle to recover.")};
}
/** At most six opposed attacks: initiative decides who goes first. */
export function simulateDuel(player,opponent,random) {
  validateFighter(player);validateFighter(opponent);
  if(typeof random!=="function")throw new RangeError("Invalid random source");
  const p=normalize(player,"player"),e=normalize(opponent,"enemy");
  const events=[{type:"engage",actor:null,target:null,
    text:"You face "+e.name+" in the fighting pit. "+
      COMBAT_LOADOUTS[p.loadout].name+" against "+COMBAT_LOADOUTS[e.loadout].name+"."}];
  const start=initiative(p,e,random);
  events.push(start);
  for(let t=0;t<COMBAT_BALANCE.maxHalfTurns&&p.hp>0&&e.hp>0;t++) {
    const a=(t%2===0)===(start.actor==="player")?p:e;
    const d=a===p?e:p;
    events.push(resolveTurn(a,d,t+1,random));
  }
  let outcome=e.hp===0?"victory":p.hp===0?"defeat":"stalemate";
  if(outcome==="stalemate") {
    const pFraction=p.hp/p.maxHP, eFraction=e.hp/e.maxHP;
    // On six attacks the judge ends the duel; fewer wounds win the decision.
    // No counterfeit kill or final hit is added.
    if(pFraction>eFraction)outcome="victory";
    else if(eFraction>pFraction)outcome="defeat";
  }
  const finalText=outcome==="victory"
    ? (e.hp===0?e.name+" is beaten. You stand victorious.":
      "At the final horn, "+e.name+" yields. You win the decision.")
    : outcome==="defeat"?(p.hp===0?
      "You are defeated. The pit wardens retrieve you. Your progress is safe.":
      "At the final horn, you yield. "+e.name+" wins the decision.")
    :"The duel ends even. Both warriors stand at the final horn.";
  events.push({type:outcome,actor:null,target:null,damage:0,text:finalText});
  return {events,outcome,playerHP:p.hp,enemyHP:e.hp,enemy:e.name};
}
/** Rebuild only the observable duel, in bounded work over arbitrary time. */
export function combatAtTime(session) {
  if(!validCombatSession(session)||!session)return null;
  const bout=Math.floor(session.elapsedMs/BOUT_MS);
  const inside=session.elapsedMs%BOUT_MS;
  const seed=(Math.imul(session.seed^(bout>>>0),2654435761)+(bout>>>16))>>>0;
  const foe=makeOpponent(bout);
  // A pre-gear V7 snapshot must not be retroactively upgraded on readback.
  // New sessions carry their frozen gear; old sessions retain legacy behavior
  // on BOTH sides of every reconstructed duel.
  if (session.player.gear === undefined) delete foe.gear;
  const duel=simulateDuel(session.player,foe,seededCombatRandom(seed));
  const step=Math.min(duel.events.length-1,Math.floor(inside/COMBAT_BALANCE.eventMs));
  return {...duel,bout:bout+1,enemyLoadout:foe.loadout,
    step,eventElapsedMs:inside%COMBAT_BALANCE.eventMs,
    event:duel.events[step]};
}
