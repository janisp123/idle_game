/**
 * Alpha combat ability registry. Exactly one attack skill and one defense
 * skill are equipped by each preset; future skills extend data, not the duel
 * resolver. All values are provisional and deliberately in one place.
 */
export const COMBAT_SKILLS = Object.freeze({
  heavy_swing: Object.freeze({
    id: "heavy_swing", name: "Heavy Swing", role: "attack",
    chargeTurns: 1, accuracyBonus: -0.06, damageMultiplier: 1.9
  }),
  thrust: Object.freeze({
    id: "thrust", name: "Thrust", role: "attack",
    chargeTurns: 0, accuracyBonus: 0.08, damageMultiplier: 1
  }),
  blade_guard: Object.freeze({
    id: "blade_guard", name: "Blade Guard", role: "defense",
    guardChance: 0.24, result: "parry"
  }),
  shield_block: Object.freeze({
    id: "shield_block", name: "Shield Block", role: "defense",
    guardChance: 0.56, result: "block"
  })
});

export const COMBAT_LOADOUTS = Object.freeze({
  greatsword: Object.freeze({
    id: "greatsword", name: "Two-handed Greatsword",
    attackSkill: "heavy_swing", defenseSkill: "blade_guard",
    weapon: "greatsword"
  }),
  sword_shield: Object.freeze({
    id: "sword_shield", name: "Sword & Shield",
    attackSkill: "thrust", defenseSkill: "shield_block",
    weapon: "sword"
  })
});
export const DEFAULT_COMBAT_LOADOUT = "greatsword";
export const validCombatLoadout = id => typeof id === "string" &&
  Object.hasOwn(COMBAT_LOADOUTS, id);

for (const [id, loadout] of Object.entries(COMBAT_LOADOUTS)) {
  const attack = COMBAT_SKILLS[loadout.attackSkill];
  const defense = COMBAT_SKILLS[loadout.defenseSkill];
  if (id !== loadout.id || attack?.role !== "attack" || defense?.role !== "defense")
    throw new Error("Invalid two-skill combat loadout: " + id);
}
