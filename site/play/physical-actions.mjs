import { dodgeChance } from "./armour.mjs?v=bal-002";
import {COUNTERS,tacticalActor,isArrow,intactTank} from "./group-counter-rules.mjs";
import {kitStrikeModifiers,kitStatus,kitControlAllowed,kitControlDuration,kitPactHeal,wakeOnDamage} from "./class-effects.mjs";
import {kitActor,KIT_BALANCE} from "./class-kits.mjs";
import {individualActor,statAttack,statAim,statSpeed,statCrit,statEvasion,statMobility,statMagicDamageFactor,statStatusLands} from "./stat-combat.mjs";
import {combatDamageFactor} from "./raid-rules.mjs";
// Pure provisional arena rules. Distances, injuries and wear are game abstractions.
export const PHYSICAL_RULES = Object.freeze({ turnLimit: 32, arrows: 5 });
export const WEAPONS = Object.freeze({
  bow: { move: "shot", ranged: true, type: "piercing", range: 2, power: 11, recovery: 2 },
  dagger: { move: "dagger", type: "piercing", range: 0, power: 4, recovery: 2, flatScale: .75, gradeScale: .80, strengthScale: .90 },
  spear: { move: "thrust", clearance: 1, type: "piercing", range: 1, power: 12, recovery: 2 },
  sword_shield: { move: "cut", type: "slashing", range: 0, power: 8, recovery: 2 },
  greatsword: { move: "swing", clearance: 2, type: "slashing", range: 1, power: 14, recovery: 2 },
  hammer: { move: "hammer", type: "blunt", range: 0, power: 16, recovery: 3 }
});
export const BASH = Object.freeze({ move: "shield_bash", type: "blunt", range: 0, power: 4, recovery: 3, flatScale: .70, gradeScale: .75 });
export const ARMOUR_FACTOR = Object.freeze({ piercing: 0.8, slashing: 1.15, blunt: 0.45, magic: 0.8 });
export const AIM = Object.freeze({base:.72,dex:.012,skill:.004,closeBow:-.40,closeSpear:-.18,farBow:.12,reachSpear:.10,clearance:.12,minimum:.15,maximum:.96});
export const GUARD = Object.freeze({block:.29,bluntBlock:.40,parry:.36,recoveringParry:.22,flatReduction:.35,openFactor:.15,counterChance:.15,reachBlockImpact:.85,blockImpact:.43,rangedBlockImpact:.55,bluntBlockImpact:1.0});
// BAL-002: material absorbs each impact type differently. Multipliers act on
// coverage-weighted intact piece protection, not on armour grade resistance.
const MATERIAL_FACTORS=Object.freeze({
  padded:Object.freeze({piercing:.90,slashing:1.15,blunt:3.0}),
  leather:Object.freeze({piercing:1.20,slashing:1.35,blunt:1.0}),
  plate:Object.freeze({piercing:.80,slashing:1.0,blunt:.18})
});
const MAGIC_MATERIAL_FACTORS=Object.freeze({padded:1.25,leather:1.0,plate:.75});
export const TACTICS=Object.freeze({slowApproach:.75,quickMobility:85,retreatLead:-3,shortSpearImpact:.80,constrainedSwing:.85,openSwing:1.08,guardOpenTurns:3,reachInterruptTurns:2,reachSpearImpact:1.18,daggerHandling:.75,farShotImpact:1.68,reachShotImpact:1.48,closeShotImpact:.60});
// Grade handling is shared by combat and the intact-stat breakdown.
export function handlingScale(piece) {
  const multiplier=piece.damageMultiplier??1;
  return piece.hp>0&&Number.isFinite(multiplier)?Math.min(1,Math.max(0,(multiplier-1)/5)):0;
}
export function attackComponents(actor,attack,activePiece){
  const equipped=activePiece.hp>0;
  const flatScale=attack.flatScale??1,gradeScale=attack.gradeScale??1,strengthScale=attack.strengthScale??1;
  const flat=equipped?(activePiece.flatAttack??actor.gearAttack??0)*flatScale:0;
  const multiplier=equipped?1+((activePiece.damageMultiplier??1)-1)*gradeScale:1;
  const strength=statAttack(actor,attack.type)*strengthScale,gear=flat*.65;
  return {weapon:attack.power,strength,gear,flat,multiplier,flatScale,gradeScale,strengthScale,base:(attack.power+strength+gear)*multiplier};
}

export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function piece(profile, fallback) {
  return { itemId:profile?.itemId, hp: profile?.maxHP ?? fallback, maxHP: profile?.maxHP ?? fallback,
    breakable: profile?.breakable ?? true,
    flatAttack:profile?.flatAttack,damageMultiplier:profile?.damageMultiplier,
    accuracy:profile?.accuracy??0,penetration:profile?.penetration??0,proficiency:profile?.proficiency??1,
    guard:profile?.guard,resistance:profile?.resistance??0,
    mobility:profile?.mobility??0,dodge:profile?.dodge??0,speed:profile?.speed??0,crit:profile?.crit??0,critDamage:profile?.critDamage??0,critResist:profile?.critResist??0,critReduction:profile?.critReduction??0 };
}

export function healthParts(end){return {base:28,endurance:end*1.6,total:Math.max(1,Math.round(28+end*1.6))};}
export function fighter(snapshot, side) {
  const maxHP = healthParts(snapshot.end).total;
  const equipment = snapshot.condition ?? {};
  return { ...snapshot, side, hp: maxHP, maxHP, inflicted: 0, recovery: 0, stagger: 0,
    bleed: 0, guardOpen:0, counter: false, arrows: snapshot.loadout === "bow" ? PHYSICAL_RULES.arrows : 0,
    weapon: piece(equipment.weapon, 24), shield: piece(equipment.shield, snapshot.loadout === "sword_shield" ? 24 : 0),
    armour: Object.entries(equipment.armour ?? {}).map(([id, profile]) =>
      ({ ...piece(profile, 24), id, protection: profile.protection })) };
}

export function timeoutVerdict(player, enemy) {
  if (player.hp > enemy.hp && player.inflicted > 0) return "victory";
  if (enemy.hp > player.hp && enemy.inflicted > 0) return "defeat";
  return "double_death";
}

export function wound(actor, target, amount) {
  const damage = Math.min(target.hp, amount);
  target.hp -= damage;if(damage>0)wakeOnDamage(target);
  actor.inflicted += damage;
  return damage;
}

function wear(target, amount) {
  if (!target.breakable || target.hp === 0) return false;
  target.hp = Math.max(0, target.hp - amount);
  return target.hp === 0;
}

export function protection(target,type=null) {
  if (!target.armour.length) return (target.gear?.physicalReductionPct ?? 0)*(type?ARMOUR_FACTOR[type]:1);
  return target.armour.reduce((sum,item)=>{
    const family=item.itemId?.split(":")[1];
    const factor=type==="magic"?(MAGIC_MATERIAL_FACTORS[family]??ARMOUR_FACTOR.magic):type?(MATERIAL_FACTORS[family]?.[type]??ARMOUR_FACTOR[type]):1;
    return sum+(item.hp>0?item.protection*factor:0);
  },0);
}

export const intactArmourSum=(target,key)=>target.armour.reduce((sum,piece)=>
  sum+(piece.hp>0?(piece[key]??0):0),0);
export function flatGuard(target) {
  // Legacy synthetic fixtures can omit detailed profiles. Real new snapshots
  // carry per-piece guard, which disappears as each piece breaks.
  if(target.armour.some(p=>p.guard!==undefined))return intactArmourSum(target,"guard");
  if(target.armour.length)return (target.gear?.gearDefense??0)*
    target.armour.filter(p=>p.hp>0).length/target.armour.length;
  return target.gear?.gearDefense??0;
}

export const mobility = actor => Math.min(100,(actor.gear?.mobilityPct ?? 95)+intactArmourSum(actor,"mobility")+statMobility(actor));
export function vitals(target) {
  return { hp: target.hp, maxHP: target.maxHP, arrows: target.arrows, shield: target.shield.hp,
    shieldMax: target.shield.maxHP, weapon: target.weapon.hp, weaponMax: target.weapon.maxHP,
    armour: target.armour.reduce((sum, item) => sum + item.hp, 0),
    maxArmour: target.armour.reduce((sum, item) => sum + item.maxHP, 0) };
}


// Shared physical strike. Geometry and turn policy belong to the caller.
export function resolveStrike(actor,target,{active,bow,distance,terrain,roll,speedRoll,record,interruptApproach,onBleed=()=>{}}){
  const attack = actor.counter && actor.shield.hp > 0 ? BASH : active;
  const kit=kitStrikeModifiers(actor,target,attack,distance);
  const counter = actor.counter;
  actor.counter = false;
  const constriction = Math.max(0, (attack.clearance ?? 0) - (terrain.clearance ?? 2));
  // Shortened greatsword swings still lose accuracy and impact in tight
  // quarters, without paying the full recovery penalty for every swing.
  const clearanceRecovery=actor.loadout==="greatsword"?Math.max(0,constriction-1):constriction;
  actor.recovery=attack.recovery-1+clearanceRecovery+kit.recovery;
  if (attack.move === "shot"&&!actor.classId) actor.arrows--;
  const shortSpear = attack.move === "thrust" && distance === 0;
  const obscuredShot = attack.ranged && distance > 0
    ? (2 - (terrain.lineOfSight ?? 2)) * 0.15 +
      (terrain.cover ?? 0) * (target.shield.hp > 0 ? 0.10 : 0.04) : 0;
  const activePiece=attack===BASH?actor.shield:actor.weapon;
  const equipped=activePiece.hp>0;
  if(equipped && speedRoll()<activePiece.speed)actor.recovery=Math.max(0,actor.recovery-1);
  if(individualActor(actor)&&actor.recovery>0&&speedRoll()<statSpeed(actor,attack.type))actor.recovery--;
  const handling=attack.move==="dagger"?TACTICS.daggerHandling:1;
  const closeCasting=tacticalActor(actor)&&active.type==="magic"&&distance===0?COUNTERS.exposedCasterAimPenalty:0;
  const cornerAim=tacticalActor(actor)&&isArrow(attack)?(COUNTERS.arrowTerrainAim[terrain.id]??0):0;
  const aim = AIM.base - closeCasting - cornerAim + kit.aim + (equipped?activePiece.accuracy*handling:0) + statAim(actor,target,attack.type) + (actor.skill - target.skill) * AIM.skill +
    (distance === 0 && bow ? AIM.closeBow : 0) + (distance===2&&bow?AIM.farBow:0) + (shortSpear ? AIM.closeSpear : attack.move==="thrust"&&distance===1?AIM.reachSpear:0) - obscuredShot - constriction * AIM.clearance * (actor.loadout==='greatsword'?1-.55*handlingScale(activePiece):1);
  if (roll() >= Math.max(AIM.minimum, Math.min(AIM.maximum, aim))) {
    record(actor, target, "miss", { move: attack.move });
    return;
  }
  // Actual defense event after accuracy. Broken pieces lose graded dodge.
  if(roll()<Math.min(kitActor(target)?.98:1,dodgeChance(mobility(target),intactArmourSum(target,"dodge"))+kit.dodge+statEvasion(target))){
    record(target,actor,"dodge",{move:attack.move});
    return;
  }
  const guardRoll = roll();
  const tactical=tacticalActor(actor)&&tacticalActor(target),arrow=tactical&&isArrow(attack),shielded=tactical&&intactTank(target);
  // A shield catches arrows, not spells. A broken/open guard loses its advantage.
  const blockChance=tactical&&attack.type==="magic"?0:Math.min(.95,(kit.shieldChance??(arrow&&shielded?COUNTERS.arrowBlock:attack.type==="blunt"?GUARD.bluntBlock:GUARD.block))+kit.block);
  const block = target.shield.hp > 0 && guardRoll < blockChance*target.shield.proficiency*(target.guardOpen>0?GUARD.openFactor:1);
  const parry = !block && !(tactical&&attack.type==="magic") && target.loadout === "greatsword" && target.weapon.hp > 0 &&
    target.recovery <= 1 && guardRoll < (target.recovery===0?GUARD.parry+.03*handlingScale(target.weapon):GUARD.recoveringParry+.03*handlingScale(target.weapon))*target.weapon.proficiency*(target.guardOpen>0?GUARD.openFactor:1);
  const intact = actor.weapon.hp > 0 || attack.move === "dagger" || attack === BASH;
  // Broken weapons retain only improvised base damage, never their grade
  // or flat bonus. The bow's backup dagger retains the kit's bonus only
  // while the kit is intact; the shield bash uses the actual shield.
  const base = attackComponents(actor,attack,activePiece).base *
    (intact ? 1 : 0.55) * (shortSpear ? TACTICS.shortSpearImpact : attack.move==="thrust"&&distance===1?TACTICS.reachSpearImpact:1) * (attack.move==="swing"?(constriction>0?TACTICS.constrainedSwing+.13*handlingScale(activePiece):TACTICS.openSwing):1) * (counter && attack !== BASH ? 1.18 : 1);
  const vital = !block && !parry && guardRoll > 1-Math.max(0,.04+statCrit(actor,attack.type)+(equipped?activePiece.crit:0)-intactArmourSum(target,"critResist"));
  const penetration=equipped?activePiece.penetration*handling:0;
  const materialProtection=protection(target,attack.type)*(1-penetration);
  const shotImpact=attack.ranged&&attack.type!=="magic"?(arrow?(distance===2?COUNTERS.farArrowImpact:distance===1?COUNTERS.reachArrowImpact:COUNTERS.closeArrowImpact):(distance===2?TACTICS.farShotImpact:distance===1?TACTICS.reachShotImpact:TACTICS.closeShotImpact)):1;
  const blockImpact=kit.blockImpact??(arrow&&shielded?COUNTERS.arrowBlockImpact:attack.type==="blunt"?GUARD.bluntBlockImpact:attack.move==="thrust"&&distance===1?GUARD.reachBlockImpact:attack.ranged?GUARD.rangedBlockImpact:GUARD.blockImpact);
  // Separate material protection from grade resistance: equal-grade
  // equipment approximately cancels scaling, lower-grade armour does not.
  const resistance=intactArmourSum(target,"resistance");
  let matchup=1;
  if(tactical){
    if(arrow)matchup*=COUNTERS.arrowTerrain[terrain.id]??1;
    if(attack.move==="knife"){
      const family=target.trainingKit?.armour?.torso;
      matchup*=(family==="padded"?COUNTERS.daggerVsPadded:family==="leather"?COUNTERS.daggerVsLeather:family==="plate"?COUNTERS.daggerVsPlate:1)*(COUNTERS.daggerTerrain[terrain.id]??1);
    }
    if(arrow&&shielded&&!target.guardOpen)matchup*=COUNTERS.shieldedArrowImpact;
    if(arrow&&target.trainingKit?.armour?.torso==="plate")matchup*=COUNTERS.plateArrowImpact;
    if(attack.type==="magic"&&target.role==="tank")matchup*=COUNTERS.tankMagicImpact;
    if(actor.role==="melee"&&distance===0&&["mage","healer","summoner"].includes(target.role))matchup*=COUNTERS.exposedCasterMelee;
    if(actor.role==="healer")matchup*=COUNTERS.healerAttack;
    if(actor.role==="support")matchup*=COUNTERS.supportAttack;
    if(actor.role==="summoner")matchup*=COUNTERS.summonerAttack;
  }
  const classScale=(attack.damageScale??1)*matchup*kit.impact*(1+(actor.classBuff??0))*(1-(actor.classWeaken??0))*(1-(target.classGuard??0));
  const impact = Math.max(1, Math.round(base * classScale * shotImpact * (vital ? 1+Math.max(0,.65+kit.crit+(equipped?activePiece.critDamage:0)-intactArmourSum(target,"critReduction")) : 1) *
    (block ? blockImpact : parry ? (kit.parryImpact??0.35) : 1) *
    (1 - Math.min(80, materialProtection) / 100) /
    (1+resistance*(1-penetration)) * statMagicDamageFactor(target,attack.type) * combatDamageFactor(actor,target,attack) - flatGuard(target) * GUARD.flatReduction));
  const damage = wound(actor, target, impact);
  const broken = [];
  if (block && wear(target.shield, attack.type === "blunt" ? 24 : 5)) broken.push("shield");
  else if (parry && wear(target.weapon, 4)) broken.push("guard weapon");
  else if (!block && !parry) {
    const armour = target.armour.find(item => item.hp > 0);
    if (armour && wear(armour, attack.type === "blunt" ? 9 : 5)) broken.push(armour.id);
  }
  if (intact && attack.move !== "dagger" && attack !== BASH && wear(actor.weapon, 3)) broken.push("attack weapon");
  if(block&&kitActor(target)&&target.classId==="dreadguard"&&target.shield.hp>0){kitStatus(actor,"classWeaken","weakenUntil",KIT_BALANCE.dreadBlockWeaken,actor.kitRound??1);}
  if (block && target.shield.hp > 0) target.counter = !(tactical&&attack.ranged) && attack.type !== "blunt" && guardRoll < GUARD.counterChance;
  if (!block && !parry && damage >= 8 && attack.type !== "blunt" && attack.type !== "magic" && statStatusLands(target,"physical",roll)) { target.bleed = Math.max(target.bleed, 2); onBleed(actor,target); }
  if (attack.type === "blunt" && (damage >= 8 || attack === BASH)) {
    // The new melee control kits cannot repeatedly stun through immunity or Brace.
    const newControl=kitActor(actor)&&["ironfist","scrapbreaker"].includes(actor.classId);
    if((!kitActor(target)||(!target.kitBraceUntil&&!newControl)||kitControlAllowed(target,actor.kitRound??1))&&statStatusLands(target,"physical",roll)){
      target.stagger=1;
      if(newControl&&kitActor(target))target.classControlUntil=(actor.kitRound??1)+kitControlDuration(target);
    }
    // A heavy impact opens a guard without permanently breaking Masterwork.
    if(attack.move==="hammer")target.guardOpen=TACTICS.guardOpenTurns;
  }
  // A clean reach thrust disrupts a closing opponent, but cannot push
  // them back forever and does not interrupt an already ranged attacker.
  if(attack.move==="thrust"&&distance===1&&!parry&&WEAPONS[target.loadout].range===0){
    interruptApproach(target);
    target.recovery=Math.max(target.recovery,TACTICS.reachInterruptTurns);
  }
  record(actor, target, block ? "block" : parry ? "parry" : vital ? "finisher" : "hit",
    { damage, move: attack.move, broken, defenseSkill: block ? "shield_block" : parry ? "blade_guard" : null });
  if(!block&&!parry&&attack.type!=="magic"&&!attack.ranged){
    const healing=kitPactHeal(actor,damage,actor.kitRound??1);
    if(healing)record(actor,actor,"heal",{healing,fromDamage:damage,source:"blood_pact"});
  }
}
