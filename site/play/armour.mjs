/**
 * Fixed four-choice armour registry, tuned for a physical / evasion / magic
 * counter triangle. All values are provisional alpha design constants.
 * No drop generation, item stacks, magical attacks, or generic item database.
 */
export const ARMOUR_LEVELS = Object.freeze({ none: 1, robe: 1, leather: 5, plate: 12 });
export const ARMOUR_TIERS = Object.freeze(["none","robe","leather","plate"]);

/** Per PIECE weights (kilograms); paired slots count twice. */
export const ARMOUR_PIECES = Object.freeze({
  head: Object.freeze({ coverage: 12, kg: [0, 0.4, 0.7, 2.8],
    names: ["None","Robe Hood","Leather Mask","Plate Helm"] }),
  shoulders: Object.freeze({ coverage: 8, kg: [0, 0.3, 1, 2.2],
    names: ["None","Robe Mantle","Leather Spaulder","Plate Pauldron"] }),
  chest: Object.freeze({ coverage: 33, kg: [0, 2.4, 4, 9.5],
    names: ["None","Robe Vestment","Leather Jerkin","Plate Cuirass"] }),
  armguards: Object.freeze({ coverage: 5, kg: [0, 0.2, 0.5, 1.7],
    names: ["None","Robe Sleeves","Leather Bracer","Plate Vambrace"] }),
  gloves: Object.freeze({ coverage: 2.5, kg: [0, 0.15, 0.3, 0.6],
    names: ["None","Robe Gloves","Leather Gloves","Plate Gauntlets"] }),
  legs: Object.freeze({ coverage: 16, kg: [0, 1.2, 2, 5.5],
    names: ["None","Robe Leggings","Leather Leggings","Plate Cuisses"] }),
  boots: Object.freeze({ coverage: 4, kg: [0, 0.35, 0.85, 1.6],
    names: ["None","Robe Footwraps","Leather Boots","Plate Sabatons"] })
});

/** Full-set target profiles. Physical mitigation applies only on landed hits.
 * Magic resistance is reserved for future spell damage; no spells exist yet.
 * Evasion is a defense-roll score modifier; dodge margin controls the chance
 * for a successful defense to be shown as a DODGE instead of a block/parry.
 */
export const ARMOUR_BALANCE = Object.freeze({
  none: Object.freeze({ physical: 0, magic: 0, evasion: 3, dodgeMargin: 2 }),
  robe: Object.freeze({ physical: 4, magic: 45, evasion: 0, dodgeMargin: 5 }),
  leather: Object.freeze({ physical: 22, magic: 12, evasion: 2, dodgeMargin: 3 }),
  plate: Object.freeze({ physical: 50, magic: 0, evasion: -3, dodgeMargin: 99 })
});

/** Existing two selectable weapon styles. Sword and shield are two pieces. */
export const WEAPON_PIECES = Object.freeze({
  greatsword: Object.freeze([Object.freeze({name:"Greatsword",kg:5})]),
  sword_shield: Object.freeze([
    Object.freeze({name:"Sword",kg:2}), Object.freeze({name:"Shield",kg:5})
  ])
});
const option = (id, name, weightKg) => Object.freeze({
  id, name, weightKg, level: ARMOUR_LEVELS[id], skill: "fighting"
});
export const ARMOUR_CHOICES = Object.freeze(Object.fromEntries(
  Object.entries(ARMOUR_PIECES).map(([group, piece]) => [group,Object.freeze(
    ARMOUR_TIERS.map((tier,i) => option(tier,piece.names[i],piece.kg[i]))
  )])
));

/** Body-shaped 11-slot visual arrangement. Each side is independent. */
export const ARMOUR_SLOTS = Object.freeze([
  Object.freeze({ id:"left_shoulder", name:"Left shoulder", short:"L SHOULDER", group:"shoulders", icon:"✥" }),
  Object.freeze({ id:"head", name:"Hood / helmet", short:"HEAD", group:"head", icon:"♜" }),
  Object.freeze({ id:"right_shoulder", name:"Right shoulder", short:"R SHOULDER", group:"shoulders", icon:"✥" }),
  Object.freeze({ id:"left_armguard", name:"Left armguard", short:"L ARM", group:"armguards", icon:"❖" }),
  Object.freeze({ id:"chest", name:"Upper body", short:"CHEST", group:"chest", icon:"♢" }),
  Object.freeze({ id:"right_armguard", name:"Right armguard", short:"R ARM", group:"armguards", icon:"❖" }),
  Object.freeze({ id:"left_glove", name:"Left glove", short:"L GLOVE", group:"gloves", icon:"✋" }),
  Object.freeze({ id:"legs", name:"Leggings", short:"LEGS", group:"legs", icon:"♜" }),
  Object.freeze({ id:"right_glove", name:"Right glove", short:"R GLOVE", group:"gloves", icon:"✋" }),
  Object.freeze({ id:"left_boot", name:"Left boot", short:"L BOOT", group:"boots", icon:"♦" }),
  Object.freeze({ id:"right_boot", name:"Right boot", short:"R BOOT", group:"boots", icon:"♦" })
]);
export const ARMOUR_SLOT_BY_ID = Object.freeze(Object.fromEntries(
  ARMOUR_SLOTS.map(slot => [slot.id, slot])
));
export function initialArmour() {
  return Object.fromEntries(ARMOUR_SLOTS.map(slot => [slot.id, "robe"]));
}
export function armourOption(slotId, optionId) {
  const slot = ARMOUR_SLOT_BY_ID[slotId];
  if (!slot) return null;
  return ARMOUR_CHOICES[slot.group].find(item => item.id === optionId) ?? null;
}
export function armourUnlocked(skills, slotId, optionId) {
  const chosen = armourOption(slotId, optionId);
  return Boolean(chosen && skills?.[chosen.skill] &&
    Number.isSafeInteger(skills[chosen.skill].level) &&
    skills[chosen.skill].level >= chosen.level);
}

/** Preserve prior V7 clothing by converting its tier once, on save read. */
const LEGACY_ROBE = Object.freeze({
  head:"hood", shoulders:"cloth", chest:"tunic", armguards:"wraps",
  gloves:"cloth", legs:"trousers", boots:"worn"
});
export function normalizeArmour(value, skills) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const base = initialArmour();
  for (const slot of ARMOUR_SLOTS) {
    const oldId = source[slot.id];
    const id = oldId === "iron" ? "plate" :
      oldId === LEGACY_ROBE[slot.group] ? "robe" : oldId;
    if (typeof id === "string" && armourUnlocked(skills, slot.id, id))
      base[slot.id] = id;
  }
  return base;
}
const round1 = n => Math.round(n * 10) / 10;

/**
 * Aggregate each covered body location once. Coverage totals exactly 100.
 * Proportional mixing prevents 11 high-tier pieces stacking 11 full bonuses.
 * This calculation runs in constant bounded time for arbitrarily long saves.
 */
export function armourStats(armour, loadout) {
  const weaponPieces = WEAPON_PIECES[loadout];
  if (!weaponPieces) throw new RangeError("Unknown weapon style");
  let armourKg=0,physical=0,magic=0,evasion=0,dodgeMargin=0;
  for (const slot of ARMOUR_SLOTS) {
    const id = armour?.[slot.id];
    const opt = armourOption(slot.id,id);
    if (!opt) throw new RangeError("Unknown equipped armour");
    const coverage = ARMOUR_PIECES[slot.group].coverage / 100;
    const stats=ARMOUR_BALANCE[id];
    armourKg += opt.weightKg;
    physical += stats.physical*coverage;
    magic += stats.magic*coverage;
    evasion += stats.evasion*coverage;
    dodgeMargin += stats.dodgeMargin*coverage;
  }
  const weaponKg=weaponPieces.reduce((sum,weapon)=>sum+weapon.kg,0);
  const armourSpeed=Math.max(65,100-Math.round(armourKg*25/30));
  const mobilityPct=Math.max(60,armourSpeed-Math.round(weaponKg*0.6));
  return Object.freeze({
    armourKg: round1(armourKg), weaponKg, totalKg: round1(armourKg+weaponKg),
    mobilityPct, physicalReductionPct:Math.round(physical),
    magicResistancePct:Math.round(magic),
    evasionScore:Math.round(evasion),
    dodgeMargin:Math.max(1,Math.round(dodgeMargin)),
    initiativePenalty:Math.min(4,Math.floor((armourKg+weaponKg)/12))
  });
}
