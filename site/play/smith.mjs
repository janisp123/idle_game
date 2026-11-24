import { ARMOUR_SLOTS, pieceProtection } from "./armour.mjs?v=glad-003";
import { GRADES, validTier } from "./difficulty.mjs?v=glad-002";

export const ITEM_GRADES = Object.freeze([...GRADES]);
export const ITEM_QUALITIES = Object.freeze(["poor", "common", "fine", "masterwork"]);
const QUALITY_POWER = Object.freeze({ poor: 0, common: 2, fine: 5, masterwork: 9 });
const QUALITY_COST = Object.freeze({ poor: 0, common: 45, fine: 120, masterwork: 245 });
export const STARTER_ITEM = Object.freeze({ grade: 0, quality: "poor" });
export const isEquipmentItem = item => Boolean(item && validTier(item.grade) &&
  ITEM_QUALITIES.includes(item.quality));

export function itemPower(item) {
  if (!isEquipmentItem(item)) throw new RangeError("Invalid equipment item");
  return item.grade * 3 + QUALITY_POWER[item.quality];
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
  const gradeCost = item => 38 * item.grade + 12 * item.grade ** 2;
  const price = item => gradeCost(item) + QUALITY_COST[item.quality];
  const improves = !current || target.grade >= current.grade &&
    ITEM_QUALITIES.indexOf(target.quality) >= ITEM_QUALITIES.indexOf(current.quality) &&
    itemPower(target) > itemPower(current);
  const cost = improves ? (current ? price(target) - price(current) : 24 + price(target)) : 0;
  return { current, cost, available: improves && cost <= state.coins };
}

export function equipmentBonuses(state) {
  const attack = itemPower(state.equipment[state.combatLoadout]);
  const defense = Object.entries(state.armour).reduce((sum, [slot, family]) =>
    family === "none" ? sum : sum + Math.ceil(itemPower(state.equipment[slot + ":" + family]) / 4), 0);
  return { attack, defense };
}

export function equippedCondition(armour, loadout, equipment) {
  const weapon = equipment[loadout] ?? STARTER_ITEM;
  const pieces = Object.fromEntries(ARMOUR_SLOTS.filter(slot => armour[slot.id] !== "none").map(slot => {
    const family = armour[slot.id];
    const id = slot.id + ":" + family;
    return [slot.id, { ...conditionProfile(id, equipment[id] ?? STARTER_ITEM),
      protection: pieceProtection(slot, family) }];
  }));
  return {
    weapon: conditionProfile(loadout, weapon),
    shield: loadout === "sword_shield" ? conditionProfile("shield", weapon) : null,
    armour: pieces
  };
}
