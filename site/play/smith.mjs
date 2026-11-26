import { ARMOUR_SLOTS, pieceProtection } from "./armour.mjs?v=bal-002";
import { GRADES, validTier } from "./difficulty.mjs?v=gear-a3";
import { proficiency,validExpertise,fullExpertise } from "./expertise.mjs?v=alpha-gear-a3";

export const ITEM_GRADES = Object.freeze([...GRADES]);
export const ITEM_QUALITIES = Object.freeze(["poor", "common", "fine", "masterwork"]);
const QUALITY_POWER = Object.freeze({ poor: 0, common: 1, fine: 2, masterwork: 3 });
const QUALITY_COST = Object.freeze({ poor: 0, common: 45, fine: 120, masterwork: 245 });
// ALPHA-GEAR-001 A1: provisional prices, to be calibrated with real duels.
export const SMITH_BALANCE = Object.freeze({
  fightingLevels: Object.freeze([1,5,10,17,25,33,40,50]),
  commonGradeCosts: Object.freeze([0,2500,9000,24000,60000,120000,225000,400000]),
  qualityFactors: Object.freeze({poor:0.85,common:1,fine:1.2,masterwork:1.5}),
  firstArmourCost: 24
});
export function equipmentUnlockLevel(grade) {
  if(!validTier(grade))throw new RangeError("Invalid equipment grade");
  return SMITH_BALANCE.fightingLevels[grade];
}
export function equipmentPrice(item) {
  if(!isEquipmentItem(item))throw new RangeError("Invalid equipment specification");
  return Math.round(SMITH_BALANCE.commonGradeCosts[item.grade]*
    SMITH_BALANCE.qualityFactors[item.quality])+QUALITY_COST[item.quality];
}
export const STARTER_ITEM = Object.freeze({ grade: 0, quality: "poor" });
export const isEquipmentItem = item => Boolean(item && validTier(item.grade) &&
  ITEM_QUALITIES.includes(item.quality));

export function itemPower(item) {
  if (!isEquipmentItem(item)) throw new RangeError("Invalid equipment item");
  return item.grade * 4 + QUALITY_POWER[item.quality];
}

// A2: grade multiplies the physical weapon/armour contribution, not the
// character's unrelated attributes. Quality is deliberately a smaller step.
export const GEAR_BALANCE=Object.freeze({
  gradeFactor:1.35,
  qualityFactors:Object.freeze({poor:1,common:1.04,fine:1.09,masterwork:1.15}),
  armourResistance:Object.freeze({padded:0.95,leather:1.00,plate:1.15}),
  armourMobility:Object.freeze({padded:1.0,leather:0.7,plate:0.2}),
  armourDodge:Object.freeze({padded:0.028,leather:0.018,plate:0.001}),
  weaponAccuracy:Object.freeze({bow:0.012,spear:0.010,sword_shield:0.006,greatsword:0.006,hammer:0.004}),
  weaponPenetration:Object.freeze({bow:0.012,spear:0.014,sword_shield:0.006,greatsword:0.008,hammer:0.016})
});
export function gearFactor(item) {
  if(!isEquipmentItem(item))throw new RangeError("Invalid equipment item");
  return GEAR_BALANCE.gradeFactor**item.grade*GEAR_BALANCE.qualityFactors[item.quality];
}
// Practice discounts only the newly unlocked increment, preserving mastered grades.
function cumulative(grade, effort, value) {
  let result=0;
  for(let t=1;t<=grade;t++) result+=(value(t)-value(t-1))*proficiency(effort,t);
  return result;
}
function effectiveFlat(item,effort) {
  return cumulative(item.grade,effort,t=>4*t)+QUALITY_POWER[item.quality]*proficiency(effort,item.grade);
}
function effectiveMultiplier(item,effort) {
  const factor=GEAR_BALANCE.gradeFactor;
  return 1+cumulative(item.grade,effort,t=>factor**t)+factor**item.grade*
    (GEAR_BALANCE.qualityFactors[item.quality]-1)*proficiency(effort,item.grade);
}
function weaponEffects(style,item,effort) {
  const g=item.grade,C=v=>cumulative(g,effort,v);
  return {proficiency:proficiency(effort,g),flatAttack:Math.round(effectiveFlat(item,effort)),
    damageMultiplier:effectiveMultiplier(item,effort),
    accuracy:C(t=>t*(GEAR_BALANCE.weaponAccuracy[style]??0)+Math.max(0,t-1)*.01),
    penetration:C(t=>t*(GEAR_BALANCE.weaponPenetration[style]??0)),
    speed:C(t=>t*.02),crit:C(t=>Math.max(0,t-2)*.005),critDamage:C(t=>Math.max(0,t-3)*.03)};
}
function armourEffects(slot,family,item,effort) {
  const g=item.grade,coverage=slot.coverage/100,C=v=>cumulative(g,effort,v);
  return {proficiency:proficiency(effort,g),protection:pieceProtection(slot,family),
    guard:Math.ceil(effectiveFlat(item,effort)/4),
    resistance:coverage*(effectiveMultiplier(item,effort)-1)*GEAR_BALANCE.armourResistance[family],
    mobility:coverage*C(t=>t*GEAR_BALANCE.armourMobility[family]),
    dodge:coverage*C(t=>t*GEAR_BALANCE.armourDodge[family]+Math.max(0,t-1)*.005*({padded:1,leather:.65,plate:.15}[family])),
    critResist:coverage*C(t=>Math.max(0,t-2)*.005),critReduction:coverage*C(t=>Math.max(0,t-3)*.03)};
}
export function conditionProfile(itemId, item) {
  if (!isEquipmentItem(item)) throw new RangeError("Invalid equipment item");
  return Object.freeze({ itemId, maxHP: 24 + 3*item.grade + 12*ITEM_QUALITIES.indexOf(item.quality),
    breakable: item.quality !== "masterwork" });
}

// Prices are cumulative so the price of incremental improvements is the same
// as buying the same final item directly.
// Every owned item advances exactly one of the 32 stages. Never refund or downgrade.
export function nextEquipmentUpgrade(current) {
  if(current==null)return {...STARTER_ITEM};
  if(!isEquipmentItem(current))throw new RangeError("Invalid current equipment");
  const q=ITEM_QUALITIES.indexOf(current.quality);
  if(q<ITEM_QUALITIES.length-1)return {grade:current.grade,quality:ITEM_QUALITIES[q+1]};
  return current.grade<ITEM_GRADES.length-1?{grade:current.grade+1,quality:"poor"}:null;
}
export function smithQuote(state,itemId,target) {
  if(!isEquipmentItem(target))throw new RangeError("Invalid equipment specification");
  const current=Object.hasOwn(state.equipment??{},itemId)?state.equipment[itemId]:null;
  const next=nextEquipmentUpgrade(current);
  const improves=Boolean(next&&target.grade===next.grade&&target.quality===next.quality);
  const cost=improves?(current?equipmentPrice(target)-equipmentPrice(current):SMITH_BALANCE.firstArmourCost):0;
  const requiredFightingLevel=equipmentUnlockLevel(target.grade),levelReady=(state.skills?.fighting?.level??1)>=requiredFightingLevel,affordable=cost<=state.coins;
  const reason=!improves||!Number.isSafeInteger(cost)||cost<=0?"no_improvement":!levelReady?"fighting_level":!affordable?"coins":null;
  return {current,cost,improves,requiredFightingLevel,levelReady,affordable,reason,available:reason===null};
}

export function equipmentBonuses(state) {
  const condition=equippedCondition(state.armour,state.combatLoadout,state.equipment,state.expertiseActive);
  const pieces=Object.values(condition.armour);
  const attack=condition.weapon.flatAttack, defense=pieces.reduce((n,p)=>n+p.guard,0);
  return { attack, defense, damageMultiplier:condition.weapon.damageMultiplier,
    accuracy:condition.weapon.accuracy,penetration:condition.weapon.penetration,
    resistance:pieces.reduce((n,p)=>n+p.resistance,0),
    mobility:pieces.reduce((n,p)=>n+p.mobility,0),
    dodge:pieces.reduce((n,p)=>n+p.dodge,0),
    speed:condition.weapon.speed, crit:condition.weapon.crit, critDamage:condition.weapon.critDamage,
    critResist:pieces.reduce((n,p)=>n+p.critResist,0),
    critReduction:pieces.reduce((n,p)=>n+p.critReduction,0) };
}

// Omitted expertise means a fully trained synthetic/NPC build, not a player default.
export function equippedCondition(armour, loadout, equipment, expertise=fullExpertise()) {
  if(!validExpertise(expertise))throw new RangeError("Invalid equipment expertise");
  const weapon = equipment[loadout] ?? STARTER_ITEM;
  const pieces = Object.fromEntries(ARMOUR_SLOTS.filter(slot => armour[slot.id] !== "none").map(slot => {
    const family = armour[slot.id];
    const id = slot.id + ":" + family;
    const item=equipment[id]??STARTER_ITEM;
    return [slot.id, { ...conditionProfile(id,item),...armourEffects(slot,family,item,expertise[family]) }];
  }));
  return {
    weapon: {...conditionProfile(loadout, weapon),...weaponEffects(loadout,weapon,expertise[loadout])},
    shield: loadout === "sword_shield" ? {...conditionProfile("shield",weapon),...weaponEffects(loadout,weapon,expertise[loadout])} : null,
    armour: pieces
  };
}


// Persist the actual loadout's gear, not later choices made in a finishing wagon.
export function trainingKit(armour,loadout,equipment){
  const ids=[loadout,...Object.entries(armour).filter(([,family])=>family!=="none")
    .map(([slot,family])=>slot+":"+family)];
  return {armour:{...armour},equipment:Object.fromEntries(ids.map(id=>[id,{...equipment[id]}]))};
}
export function validTrainingKit(kit,loadout){
  if(!kit||!kit.armour||!kit.equipment||Array.isArray(kit.armour)||Array.isArray(kit.equipment)||
    Object.keys(kit.armour).length!==ARMOUR_SLOTS.length||
    !ARMOUR_SLOTS.every(({id})=>["none","padded","leather","plate"].includes(kit.armour[id])))return false;
  const ids=[loadout,...Object.entries(kit.armour).filter(([,family])=>family!=="none")
    .map(([slot,family])=>slot+":"+family)];
  return Object.keys(kit.equipment).length===ids.length&&
    ids.every(id=>Object.hasOwn(kit.equipment,id)&&isEquipmentItem(kit.equipment[id]));
}
export function trainingEffects(kit,loadout,expertise){
  const condition=equippedCondition(kit.armour,loadout,kit.equipment,expertise);
  return {condition,gearAttack:condition.weapon.flatAttack,
    gearDefense:Object.values(condition.armour).reduce((sum,p)=>sum+p.guard,0)};
}