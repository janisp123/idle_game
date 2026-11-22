/**
 * Fixed, non-random armour catalogue.
 * A slot chooses one named design; it is not a stack of inventory items.
 * Fighting skill gates the two higher tiers; equipment bonuses are deliberately
 * not invented. All thresholds and designs live in this small shared registry.
 */
export const ARMOUR_LEVELS = Object.freeze({ leather: 5, iron: 12 });
const option = (id, name, level = 1, skill = "fighting") =>
  Object.freeze({ id, name, level, skill });

export const ARMOUR_CHOICES = Object.freeze({
  head: Object.freeze([
    option("none", "Bare head"),
    option("hood", "Worn hood"),
    option("leather", "Leather hood", ARMOUR_LEVELS.leather),
    option("iron", "Iron helm", ARMOUR_LEVELS.iron)
  ]),
  shoulders: Object.freeze([
    option("none", "Unarmoured"),
    option("cloth", "Cloth pad"),
    option("leather", "Leather pauldron", ARMOUR_LEVELS.leather),
    option("iron", "Iron pauldron", ARMOUR_LEVELS.iron)
  ]),
  chest: Object.freeze([
    option("none", "No armour"),
    option("tunic", "Worn tunic"),
    option("leather", "Leather cuirass", ARMOUR_LEVELS.leather),
    option("iron", "Iron breastplate", ARMOUR_LEVELS.iron)
  ]),
  armguards: Object.freeze([
    option("none", "Unarmoured"),
    option("wraps", "Cloth wraps"),
    option("leather", "Leather bracer", ARMOUR_LEVELS.leather),
    option("iron", "Iron vambrace", ARMOUR_LEVELS.iron)
  ]),
  gloves: Object.freeze([
    option("none", "Bare hand"),
    option("cloth", "Cloth glove"),
    option("leather", "Leather gauntlet", ARMOUR_LEVELS.leather),
    option("iron", "Iron gauntlet", ARMOUR_LEVELS.iron)
  ]),
  legs: Object.freeze([
    option("none", "No leg armour"),
    option("trousers", "Travel trousers"),
    option("leather", "Leather leggings", ARMOUR_LEVELS.leather),
    option("iron", "Iron greaves", ARMOUR_LEVELS.iron)
  ]),
  boots: Object.freeze([
    option("none", "Bare foot"),
    option("worn", "Worn boot"),
    option("leather", "Leather boot", ARMOUR_LEVELS.leather),
    option("iron", "Iron boot", ARMOUR_LEVELS.iron)
  ])
});

/** Render order matches the body's approximate anatomy: 3 columns, 4 rows. */
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
const defaults = Object.freeze({
  head:"hood", shoulders:"cloth", chest:"tunic", armguards:"wraps",
  gloves:"cloth", legs:"trousers", boots:"worn"
});
export function initialArmour() {
  return Object.fromEntries(ARMOUR_SLOTS.map(slot => [slot.id, defaults[slot.group]]));
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
/** Missing old-save field means free starter clothing, not a lost character. */
export function normalizeArmour(value, skills) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const base = initialArmour();
  for (const slot of ARMOUR_SLOTS) {
    if (typeof source[slot.id] === "string" &&
        armourUnlocked(skills, slot.id, source[slot.id])) {
      base[slot.id] = source[slot.id];
    }
  }
  return base;
}
