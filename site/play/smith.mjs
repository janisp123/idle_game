import { ARMOUR_SLOTS, pieceProtection } from "./armour.mjs?v=glad-003";
import { GRADES, validTier } from "./difficulty.mjs?v=alpha-gear-a2";

export const ITEM_GRADES = Object.freeze([...GRADES]);
export const ITEM_QUALITIES = Object.freeze(["poor", "common", "fine", "masterwork"]);
const QUALITY_POWER = Object.freeze({ poor: 0, common: 2, fine: 5, masterwork: 9 });
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
  return item.grade * 3 + QUALITY_POWER[item.quality];
}

// A2: grade multiplies the physical weapon/armour contribution, not the
// character's unrelated attributes. Quality is deliberately a smaller step.
export const GEAR_BALANCE=Object.freeze({
  gradeFactor:1.35,
  qualityFactors:Object.freeze({poor:1,common:1.04,fine:1.09,masterwork:1.15}),
  armourResistance:Object.freeze({padded:0.70,leather:0.85,plate:1.15}),
  armourMobility:Object.freeze({padded:0.4,leather:0.7,plate:1.0}),
  armourDodge:Object.freeze({padded:0.007,leather:0.005,plate:0.001}),
  weaponAccuracy:Object.freeze({bow:0.012,spear:0.010,sword_shield:0.006,greatsword:0.006,hammer:0.004}),
  weaponPenetration:Object.freeze({bow:0.012,spear:0.014,sword_shield:0.006,greatsword:0.008,hammer:0.016})
});
export function gearFactor(item) {
  if(!isEquipmentItem(item))throw new RangeError("Invalid equipment item");
  return GEAR_BALANCE.gradeFactor**item.grade*GEAR_BALANCE.qualityFactors[item.quality];
}
function weaponEffects(style,item) {
  return {flatAttack:itemPower(item),damageMultiplier:gearFactor(item),
    accuracy:item.grade*(GEAR_BALANCE.weaponAccuracy[style]??0),
    penetration:item.grade*(GEAR_BALANCE.weaponPenetration[style]??0)};
}
function armourEffects(slot,family,item) {
  const coverage=slot.coverage/100;
  return {protection:pieceProtection(slot,family),
    guard:Math.ceil(itemPower(item)/4),
    resistance:coverage*(gearFactor(item)-1)*GEAR_BALANCE.armourResistance[family],
    mobility:coverage*item.grade*GEAR_BALANCE.armourMobility[family],
    dodge:coverage*item.grade*GEAR_BALANCE.armourDodge[family]};
}

export function conditionProfile(itemId, item) {
  const power = itemPower(item);
  return Object.freeze({ itemId, maxHP: 24 + power * 3,
    breakable: item.quality !== "masterwork" });
}

// Prices are cumulative so the price of incremental improvements is the same
// as buying the same final item directly.
export function smithQuote(state, itemId, target) {
  if (!isEquipmentItem(target)) throw new RangeError("Invalid equipment specification");
  const current = Object.hasOwn(state.equipment ?? {}, itemId) ? state.equipment[itemId] : null;
  const improves = !current || target.grade >= current.grade &&
    ITEM_QUALITIES.indexOf(target.quality) >= ITEM_QUALITIES.indexOf(current.quality) &&
    itemPower(target) > itemPower(current);
  const cost = improves ? (current ? equipmentPrice(target) - equipmentPrice(current) :
    SMITH_BALANCE.firstArmourCost + equipmentPrice(target)) : 0;
  const requiredFightingLevel=equipmentUnlockLevel(target.grade);
  const levelReady=(state.skills?.fighting?.level??1)>=requiredFightingLevel;
  const affordable=cost<=state.coins;
  const reason=!improves?"no_improvement":!levelReady?"fighting_level":!affordable?"coins":null;
  return { current, cost, improves, requiredFightingLevel, levelReady, affordable,
    reason, available:reason===null };
}

export function equipmentBonuses(state) {
  const attack = itemPower(state.equipment[state.combatLoadout]);
  const defense = Object.entries(state.armour).reduce((sum, [slot, family]) =>
    family === "none" ? sum : sum + Math.ceil(itemPower(state.equipment[slot + ":" + family]) / 4), 0);
  const condition=equippedCondition(state.armour,state.combatLoadout,state.equipment);
  const pieces=Object.values(condition.armour);
  return { attack, defense, damageMultiplier:condition.weapon.damageMultiplier,
    accuracy:condition.weapon.accuracy,penetration:condition.weapon.penetration,
    resistance:pieces.reduce((n,p)=>n+p.resistance,0),
    mobility:pieces.reduce((n,p)=>n+p.mobility,0),
    dodge:pieces.reduce((n,p)=>n+p.dodge,0) };
}

export function equippedCondition(armour, loadout, equipment) {
  const weapon = equipment[loadout] ?? STARTER_ITEM;
  const pieces = Object.fromEntries(ARMOUR_SLOTS.filter(slot => armour[slot.id] !== "none").map(slot => {
    const family = armour[slot.id];
    const id = slot.id + ":" + family;
    const item=equipment[id]??STARTER_ITEM;
    return [slot.id, { ...conditionProfile(id,item),...armourEffects(slot,family,item) }];
  }));
  return {
    weapon: {...conditionProfile(loadout, weapon),...weaponEffects(loadout,weapon)},
    shield: loadout === "sword_shield" ? {...conditionProfile("shield",weapon),...weaponEffects(loadout,weapon)} : null,
    armour: pieces
  };
}
