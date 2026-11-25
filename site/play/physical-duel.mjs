import { dodgeChance } from "./armour.mjs?v=alpha-gear-a8";
// Pure provisional arena rules. Distances, injuries and wear are game abstractions.
export const PHYSICAL_RULES = Object.freeze({ turnLimit: 32, arrows: 5 });
const WEAPONS = Object.freeze({
  bow: { move: "shot", ranged: true, type: "piercing", range: 2, power: 11, recovery: 2 },
  dagger: { move: "dagger", type: "piercing", range: 0, power: 4, recovery: 2, flatScale: .75, gradeScale: .72, strengthScale: .90 },
  spear: { move: "thrust", clearance: 1, type: "piercing", range: 1, power: 12, recovery: 2 },
  sword_shield: { move: "cut", type: "slashing", range: 0, power: 8, recovery: 2 },
  greatsword: { move: "swing", clearance: 2, type: "slashing", range: 1, power: 14, recovery: 2 },
  hammer: { move: "hammer", type: "blunt", range: 0, power: 17, recovery: 3 }
});
const BASH = Object.freeze({ move: "shield_bash", type: "blunt", range: 0, power: 4, recovery: 3, flatScale: .70, gradeScale: .75 });
const BANDS = Object.freeze(["Close", "Reach", "Far"]);
const ARMOUR_FACTOR = Object.freeze({ piercing: 0.8, slashing: 1.15, blunt: 0.45 });
const AIM = Object.freeze({base:.72,dex:.012,skill:.004,closeBow:-.40,closeSpear:-.18,farBow:.12,reachSpear:.10,clearance:.12,minimum:.15,maximum:.96});
const GUARD = Object.freeze({block:.29,bluntBlock:.40,parry:.36,recoveringParry:.22,flatReduction:.35,openFactor:.15,counterChance:.15,reachBlockImpact:.85,blockImpact:.43,bluntBlockImpact:1.0});
// BAL-002: material absorbs each impact type differently. Multipliers act on
// coverage-weighted intact piece protection, not on armour grade resistance.
const MATERIAL_FACTORS=Object.freeze({
  padded:Object.freeze({piercing:.90,slashing:1.15,blunt:3.0}),
  leather:Object.freeze({piercing:1.20,slashing:1.35,blunt:1.0}),
  plate:Object.freeze({piercing:.80,slashing:1.0,blunt:.18})
});
const TACTICS=Object.freeze({slowApproach:.75,quickMobility:85,retreatLead:-3,shortSpearImpact:.80,constrainedSwing:.85,openSwing:1.08,guardOpenTurns:3,reachInterruptTurns:2,reachSpearImpact:1.18,daggerHandling:.75,farShotImpact:1.60,reachShotImpact:1.15,closeShotImpact:.60});
function attackComponents(actor,attack,activePiece){
  const equipped=activePiece.hp>0;
  const flatScale=attack.flatScale??1,gradeScale=attack.gradeScale??1,strengthScale=attack.strengthScale??1;
  const flat=equipped?(activePiece.flatAttack??actor.gearAttack??0)*flatScale:0;
  const multiplier=equipped?1+((activePiece.damageMultiplier??1)-1)*gradeScale:1;
  const strength=actor.str*.3*strengthScale,gear=flat*.65;
  return {weapon:attack.power,strength,gear,flat,multiplier,flatScale,gradeScale,strengthScale,base:(attack.power+strength+gear)*multiplier};
}

function seededRandom(seed) {
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
    mobility:profile?.mobility??0,dodge:profile?.dodge??0 };
}

function healthParts(end){return {base:28,endurance:end*1.6,total:Math.max(1,Math.round(28+end*1.6))};}
function fighter(snapshot, side) {
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

function wound(actor, target, amount) {
  const damage = Math.min(target.hp, amount);
  target.hp -= damage;
  actor.inflicted += damage;
  return damage;
}

function wear(target, amount) {
  if (!target.breakable || target.hp === 0) return false;
  target.hp = Math.max(0, target.hp - amount);
  return target.hp === 0;
}

function protection(target,type=null) {
  if (!target.armour.length) return (target.gear?.physicalReductionPct ?? 0)*(type?ARMOUR_FACTOR[type]:1);
  return target.armour.reduce((sum,item)=>{
    const family=item.itemId?.split(":")[1];
    const factor=type?(MATERIAL_FACTORS[family]?.[type]??ARMOUR_FACTOR[type]):1;
    return sum+(item.hp>0?item.protection*factor:0);
  },0);
}

const intactArmourSum=(target,key)=>target.armour.reduce((sum,piece)=>
  sum+(piece.hp>0?(piece[key]??0):0),0);
function flatGuard(target) {
  // Legacy synthetic fixtures can omit detailed profiles. Real new snapshots
  // carry per-piece guard, which disappears as each piece breaks.
  if(target.armour.some(p=>p.guard!==undefined))return intactArmourSum(target,"guard");
  if(target.armour.length)return (target.gear?.gearDefense??0)*
    target.armour.filter(p=>p.hp>0).length/target.armour.length;
  return target.gear?.gearDefense??0;
}

const mobility = actor => Math.min(100,(actor.gear?.mobilityPct ?? 95)+intactArmourSum(actor,"mobility"));
function vitals(target) {
  return { hp: target.hp, maxHP: target.maxHP, arrows: target.arrows, shield: target.shield.hp,
    shieldMax: target.shield.maxHP, weapon: target.weapon.hp, weaponMax: target.weapon.maxHP,
    armour: target.armour.reduce((sum, item) => sum + item.hp, 0),
    maxArmour: target.armour.reduce((sum, item) => sum + item.maxHP, 0) };
}

export function resolvePhysicalDuel(player, enemy, seed, terrain = {}) {
  const actors = [fighter(player, "player"), fighter(enemy, "enemy")];
  const [you, foe] = actors;
  const roll = seededRandom(seed);
  // Independent initiative stream, not affected by conditional attack rolls.
  const initiativeRoll=seededRandom((seed^0x9e3779b9)>>>0);
  const events = [];
  let approachProgress = 0;
  let retreatsLeft = terrain.retreatSpace ?? (terrain.retreat === false ? 0 : 3);
  let distance = Math.min(2, Math.max(0, terrain.startDistance ?? 2));

  const record = (actor, target, type, extra = {}) => {
    events.push({ type, actor: actor?.side ?? null, target: target?.side ?? null, distance: BANDS[distance],
      damage: 0, ...extra, vitals: { player: vitals(you), enemy: vitals(foe) } });
  };

  record(null, null, "engage");

  for (let turn = 0; turn < PHYSICAL_RULES.turnLimit && you.hp && foe.hp; turn++) {
    const advantage=you.dex-foe.dex+(mobility(you)-mobility(foe))/10;
    const lead=initiativeRoll()<Math.max(.05,Math.min(.95,.5+advantage*.1))?0:1;
    for (const index of [lead, 1 - lead]) {
      const actor = actors[index], target = actors[1 - index];
      if (!actor.hp || !target.hp) break;
      if(actor.guardOpen>0)actor.guardOpen--;
      if (actor.bleed > 0) {
        actor.bleed--;
        const damage = wound(target, actor, 2);
        record(target, actor, "bleed", { damage });
        if (!actor.hp) break;
      }
      if (actor.stagger > 0) {
        actor.stagger--;
        record(actor, target, "stagger");
        continue;
      }
      const bow = actor.loadout === "bow" && actor.arrows > 0 && actor.weapon.hp > 0;
      const active = actor.loadout === "bow" && !bow ? WEAPONS.dagger : WEAPONS[actor.loadout];
      if (actor.recovery > 0) {
        actor.recovery--;
        if (bow && distance < 2 && retreatsLeft > 0 && mobility(actor) >= mobility(target)+TACTICS.retreatLead) {
          distance++;
          approachProgress = 0;
          retreatsLeft--;
          record(actor, target, "retreat");
        }
        continue;
      }
      if (distance > active.range) {
        approachProgress+=mobility(actor)>=TACTICS.quickMobility?1:TACTICS.slowApproach;
        if (approachProgress >= (terrain.approachSteps ?? 1)) {
          distance--;
          approachProgress = 0;
        }
        record(actor, target, "approach");
        continue;
      }
      const attack = actor.counter && actor.shield.hp > 0 ? BASH : active;
      const counter = actor.counter;
      actor.counter = false;
      const constriction = Math.max(0, (attack.clearance ?? 0) - (terrain.clearance ?? 2));
      // Shortened greatsword swings still lose accuracy and impact in tight
      // quarters, without paying the full recovery penalty for every swing.
      const clearanceRecovery=actor.loadout==="greatsword"?Math.max(0,constriction-1):constriction;
      actor.recovery=attack.recovery-1+clearanceRecovery;
      if (attack.move === "shot") actor.arrows--;
      const shortSpear = actor.loadout === "spear" && distance === 0;
      const obscuredShot = attack.ranged && distance > 0
        ? (2 - (terrain.lineOfSight ?? 2)) * 0.15 +
          (terrain.cover ?? 0) * (target.shield.hp > 0 ? 0.10 : 0.04) : 0;
      const activePiece=attack===BASH?actor.shield:actor.weapon;
      const equipped=activePiece.hp>0;
      const handling=attack.move==="dagger"?TACTICS.daggerHandling:1;
      const aim = AIM.base + (equipped?activePiece.accuracy*handling:0) + (actor.dex - target.dex) * AIM.dex + (actor.skill - target.skill) * AIM.skill +
        (distance === 0 && bow ? AIM.closeBow : 0) + (distance===2&&bow?AIM.farBow:0) + (shortSpear ? AIM.closeSpear : attack.move==="thrust"&&distance===1?AIM.reachSpear:0) - obscuredShot - constriction * AIM.clearance;
      if (roll() >= Math.max(AIM.minimum, Math.min(AIM.maximum, aim))) {
        record(actor, target, "miss", { move: attack.move });
        continue;
      }
      // Actual defense event after accuracy. Broken pieces lose graded dodge.
      if(roll()<dodgeChance(mobility(target),intactArmourSum(target,"dodge"))){
        record(target,actor,"dodge",{move:attack.move});
        continue;
      }
      const guardRoll = roll();
      const block = target.shield.hp > 0 && guardRoll < (attack.type === "blunt" ? GUARD.bluntBlock : GUARD.block)*target.shield.proficiency*(target.guardOpen>0?GUARD.openFactor:1);
      const parry = !block && target.loadout === "greatsword" && target.weapon.hp > 0 &&
        target.recovery <= 1 && guardRoll < (target.recovery===0?GUARD.parry:GUARD.recoveringParry)*target.weapon.proficiency*(target.guardOpen>0?GUARD.openFactor:1);
      const intact = actor.weapon.hp > 0 || attack.move === "dagger" || attack === BASH;
      // Broken weapons retain only improvised base damage, never their grade
      // or flat bonus. The bow's backup dagger retains the kit's bonus only
      // while the kit is intact; the shield bash uses the actual shield.
      const base = attackComponents(actor,attack,activePiece).base *
        (intact ? 1 : 0.55) * (shortSpear ? TACTICS.shortSpearImpact : attack.move==="thrust"&&distance===1?TACTICS.reachSpearImpact:1) * (attack.move==="swing"?(constriction>0?TACTICS.constrainedSwing:TACTICS.openSwing):1) * (counter && attack !== BASH ? 1.18 : 1);
      const vital = !block && !parry && guardRoll > 0.96;
      const penetration=equipped?activePiece.penetration*handling:0;
      const materialProtection=protection(target,attack.type)*(1-penetration);
      const shotImpact=attack.ranged?(distance===2?TACTICS.farShotImpact:distance===1?TACTICS.reachShotImpact:TACTICS.closeShotImpact):1;
      const blockImpact=attack.type==="blunt"?GUARD.bluntBlockImpact:attack.move==="thrust"&&distance===1?GUARD.reachBlockImpact:GUARD.blockImpact;
      // Separate material protection from grade resistance: equal-grade
      // equipment approximately cancels scaling, lower-grade armour does not.
      const resistance=intactArmourSum(target,"resistance");
      const impact = Math.max(1, Math.round(base * shotImpact * (vital ? 1.65 : 1) *
        (block ? blockImpact : parry ? 0.35 : 1) *
        (1 - Math.min(80, materialProtection) / 100) /
        (1+resistance*(1-penetration)) - flatGuard(target) * GUARD.flatReduction));
      const damage = wound(actor, target, impact);
      const broken = [];
      if (block && wear(target.shield, attack.type === "blunt" ? 24 : 5)) broken.push("shield");
      else if (parry && wear(target.weapon, 4)) broken.push("guard weapon");
      else if (!block && !parry) {
        const armour = target.armour.find(item => item.hp > 0);
        if (armour && wear(armour, attack.type === "blunt" ? 9 : 5)) broken.push(armour.id);
      }
      if (intact && attack.move !== "dagger" && attack !== BASH && wear(actor.weapon, 3)) broken.push("attack weapon");
      if (block && target.shield.hp > 0) target.counter = attack.type !== "blunt" && guardRoll < GUARD.counterChance;
      if (!block && !parry && damage >= 8 && attack.type !== "blunt") target.bleed = Math.max(target.bleed, 2);
      if (attack.type === "blunt" && (damage >= 8 || attack === BASH)) {
        target.stagger=1;
        // A heavy impact opens a guard without permanently breaking Masterwork.
        if(attack.move==="hammer")target.guardOpen=TACTICS.guardOpenTurns;
      }
      // A clean reach thrust disrupts a closing opponent, but cannot push
      // them back forever and does not interrupt an already ranged attacker.
      if(attack.move==="thrust"&&distance===1&&!parry&&WEAPONS[target.loadout].range===0){
        approachProgress=0;
        target.recovery=Math.max(target.recovery,TACTICS.reachInterruptTurns);
      }
      record(actor, target, block ? "block" : parry ? "parry" : vital ? "finisher" : "hit",
        { damage, move: attack.move, broken, defenseSkill: block ? "shield_block" : parry ? "blade_guard" : null });
    }
  }

  const reason = foe.hp && you.hp ? "timeout" : "knockout";
  const outcome = !foe.hp ? "victory" : !you.hp ? "defeat" : timeoutVerdict(you, foe);
  if (outcome !== "victory") you.hp = 0;
  if (outcome !== "defeat") foe.hp = 0;
  record(null, null, outcome, { reason });
  return { events, outcome, reason, playerHP: you.hp, enemyHP: foe.hp, enemy: enemy.name };
}

/** Exact intact build inputs, not a forecast of a particular opponent or DPS. */
export function physicalBuildStats(snapshot){
  const a=fighter(snapshot,"player");
  const attacks=[WEAPONS[a.loadout],...(a.loadout==="bow"?[WEAPONS.dagger]:a.loadout==="sword_shield"?[BASH]:[])];
  return {health:healthParts(a.end),mobility:mobility(a),baseMobility:a.gear.mobilityPct,
    gradeMobility:intactArmourSum(a,"mobility"),protection:protection(a),
    guard:flatGuard(a),guardDamageReduction:flatGuard(a)*GUARD.flatReduction,
    resistance:intactArmourSum(a,"resistance"),gradedDodge:intactArmourSum(a,"dodge"),
    naturalDodge:dodgeChance(mobility(a),0),dodge:dodgeChance(mobility(a),intactArmourSum(a,"dodge")),
    initiativeScore:a.dex+mobility(a)/10,initiativeDex:a.dex,initiativeMobility:mobility(a)/10,
    aimBase:AIM.base,accuracy:a.weapon.accuracy,aimMinimum:AIM.minimum,aimMaximum:AIM.maximum,
    aimDexPerPoint:AIM.dex,aimSkillPerLevel:AIM.skill,aimCloseBow:AIM.closeBow,aimCloseSpear:AIM.closeSpear,aimClearance:AIM.clearance,
    penetration:a.weapon.penetration,materialFactors:Object.fromEntries(Object.keys(ARMOUR_FACTOR).map(type=>[type,protection(a)>0?protection(a,type)/protection(a):0])),
    materialProtection:Object.fromEntries(Object.keys(ARMOUR_FACTOR).map(type=>[type,protection(a,type)])),
    tactics:TACTICS,aimFarBow:AIM.farBow,aimReachSpear:AIM.reachSpear,
    attacks:attacks.map(attack=>({...attack,...attackComponents(a,attack,attack===BASH?a.shield:a.weapon),
      condition:attack===BASH?a.shield:a.weapon})),
    block:a.shield.hp>0?GUARD.block*a.shield.proficiency:0,
    bluntBlock:a.shield.hp>0?GUARD.bluntBlock*a.shield.proficiency:0,
    parry:a.loadout==="greatsword"?GUARD.parry*a.weapon.proficiency:0,
    recoveryParry:a.loadout==="greatsword"?GUARD.recoveringParry*a.weapon.proficiency:0,
    arrows:a.arrows,weapon:a.weapon,shield:a.shield,armour:a.armour};
}
