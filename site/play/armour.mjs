// Provisional physical armour and weapon tuning for the existing duel resolver.
export const ARMOUR_TIERS = Object.freeze(["none", "padded", "leather", "plate"]);
export const ARMOUR_TIER_LABELS = Object.freeze({
  none: "None", padded: "Padded", leather: "Leather", plate: "Plate"
});
export const ARMOUR_SLOTS = Object.freeze([
  { id: "head", name: "Head", short: "HEAD", coverage: 12, kg: [0, 0.3, 0.7, 2.8] },
  { id: "torso", name: "Torso", short: "TORSO", coverage: 33, kg: [0, 1.6, 4, 9.5] },
  { id: "arms", name: "Arms", short: "ARMS", coverage: 31, kg: [0, 1.4, 3.6, 9] },
  { id: "legs", name: "Legs", short: "LEGS", coverage: 24, kg: [0, 1.2, 3.7, 8.7] }
].map(Object.freeze));
export const ARMOUR_SLOT_BY_ID = Object.freeze(Object.fromEntries(ARMOUR_SLOTS.map(slot => [slot.id, slot])));
export const ARMOUR_CHOICES = Object.freeze(Object.fromEntries(ARMOUR_SLOTS.map(slot => [
  slot.id, ARMOUR_TIERS.map((id, index) => Object.freeze({
    id, name: ARMOUR_TIER_LABELS[id], weightKg: slot.kg[index]
  }))
])));

const ARMOUR_BALANCE = {
  none: { physical: 0, evasion: 3, dodgeMargin: 6 },
  padded: { physical: 12, evasion: 3, dodgeMargin: 7 },
  leather: { physical: 22, evasion: 2, dodgeMargin: 8 },
  plate: { physical: 50, evasion: -3, dodgeMargin: 99 }
};

export const WEAPON_PIECES = Object.freeze({
  bow: [{name: "Bow", kg: 2}, {name: "Backup dagger", kg: 0.5}],
  spear: [{name: "Spear", kg: 3}],
  hammer: [{name: "War Hammer", kg: 6}],
  greatsword: [{name: "Greatsword", kg: 5}],
  sword_shield: [{name: "Arming sword", kg: 2}, {name: "Heater shield", kg: 5}]
});

export function initialArmour() {
  return Object.fromEntries(ARMOUR_SLOTS.map(slot => [slot.id, "none"]));
}

export function armourOption(slotId, optionId) {
  if (!Object.hasOwn(ARMOUR_CHOICES, slotId)) return null;
  return ARMOUR_CHOICES[slotId].find(item => item.id === optionId) ?? null;
}

export function armourStats(armour, loadout) {
  if (!Object.hasOwn(WEAPON_PIECES, loadout)) throw new RangeError("Unknown weapon style");
  const weaponKg = WEAPON_PIECES[loadout].reduce((sum, piece) => sum + piece.kg, 0);
  let armourKg = 0, physical = 0, evasion = 0, dodgeMargin = 0;
  for (const slot of ARMOUR_SLOTS) {
    const option = armourOption(slot.id, armour?.[slot.id]);
    if (!option) throw new RangeError("Unknown equipped armour");
    const stats = ARMOUR_BALANCE[option.id];
    const coverage = slot.coverage / 100;
    armourKg += option.weightKg;
    physical += stats.physical * coverage;
    evasion += stats.evasion * coverage;
    dodgeMargin += stats.dodgeMargin * coverage;
  }
  const totalKg = armourKg + weaponKg;
  const armourSpeed = Math.max(65, 100 - Math.round(armourKg * 25 / 30));
  return Object.freeze({
    armourKg: Math.round(armourKg * 10) / 10, weaponKg, totalKg: Math.round(totalKg * 10) / 10,
    mobilityPct: Math.max(60, armourSpeed - Math.round(weaponKg * 0.6)),
    physicalReductionPct: Math.round(physical), evasionScore: Math.round(evasion),
    dodgeMargin: Math.max(1, Math.round(dodgeMargin)), initiativePenalty: Math.min(4, Math.floor(totalKg / 12))
  });
}
