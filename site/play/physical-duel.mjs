import { dodgeChance } from "./armour.mjs?v=bal-002";
import { PHYSICAL_RULES,WEAPONS,BASH,TACTICS,AIM,GUARD,handlingScale,attackComponents,seededRandom,fighter,wound,protection,flatGuard,vitals,healthParts,intactArmourSum,mobility,timeoutVerdict,resolveStrike } from "./physical-actions.mjs?v=team-002";
export { PHYSICAL_RULES,timeoutVerdict } from "./physical-actions.mjs?v=team-002";
const BANDS=Object.freeze(["Close","Reach","Far"]);
export function resolvePhysicalDuel(player, enemy, seed, terrain = {}) {
  const actors = [fighter(player, "player"), fighter(enemy, "enemy")];
  const [you, foe] = actors;
  const roll = seededRandom(seed); const speedRoll=seededRandom((seed^0x85ebca6b)>>>0);
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
      resolveStrike(actor,target,{active,bow,distance,terrain,roll,speedRoll,record,interruptApproach:()=>{approachProgress=0;}});
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
    resistance:intactArmourSum(a,"resistance"),speed:a.weapon.speed,crit:a.weapon.crit,critDamage:a.weapon.critDamage,critResist:intactArmourSum(a,"critResist"),critReduction:intactArmourSum(a,"critReduction"),gradedDodge:intactArmourSum(a,"dodge"),
    naturalDodge:dodgeChance(mobility(a),0),dodge:dodgeChance(mobility(a),intactArmourSum(a,"dodge")),
    initiativeScore:a.dex+mobility(a)/10,initiativeDex:a.dex,initiativeMobility:mobility(a)/10,
    aimBase:AIM.base,accuracy:a.weapon.accuracy,aimMinimum:AIM.minimum,aimMaximum:AIM.maximum,
    aimDexPerPoint:AIM.dex,aimSkillPerLevel:AIM.skill,aimCloseBow:AIM.closeBow,aimCloseSpear:AIM.closeSpear,aimClearance:AIM.clearance*(a.loadout==='greatsword'?1-.55*handlingScale(a.weapon):1),
    penetration:a.weapon.penetration,materialFactors:Object.fromEntries(Object.keys(ARMOUR_FACTOR).map(type=>[type,protection(a)>0?protection(a,type)/protection(a):0])),
    materialProtection:Object.fromEntries(Object.keys(ARMOUR_FACTOR).map(type=>[type,protection(a,type)])),
    tactics:{...TACTICS,constrainedSwing:TACTICS.constrainedSwing+(a.loadout==='greatsword'?.13*handlingScale(a.weapon):0)},guardRules:GUARD,aimFarBow:AIM.farBow,aimReachSpear:AIM.reachSpear,
    attacks:attacks.map(attack=>({...attack,...attackComponents(a,attack,attack===BASH?a.shield:a.weapon),
      condition:attack===BASH?a.shield:a.weapon})),
    block:a.shield.hp>0?GUARD.block*a.shield.proficiency:0,
    bluntBlock:a.shield.hp>0?GUARD.bluntBlock*a.shield.proficiency:0,
    parry:a.loadout==="greatsword"?(GUARD.parry+.03*handlingScale(a.weapon))*a.weapon.proficiency:0,
    recoveryParry:a.loadout==="greatsword"?(GUARD.recoveringParry+.03*handlingScale(a.weapon))*a.weapon.proficiency:0,
    arrows:a.arrows,weapon:a.weapon,shield:a.shield,armour:a.armour};
}
