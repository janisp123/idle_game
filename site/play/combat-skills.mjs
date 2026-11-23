/**
 * Alpha combat ability registry. Exactly one attack skill and one defense
 * skill are equipped by each preset; future skills extend data, not the duel
 * resolver. All values are provisional and deliberately in one place.
 */
export const COMBAT_SKILLS = Object.freeze({
  arrow:{id:"arrow",name:"Aimed Shot",role:"attack",windupMs:1200,attackBonus:2,damageMultiplier:1.1,blockDamagePct:8,parryDamagePct:12},
  spell:{id:"spell",name:"Arc Bolt",role:"attack",windupMs:1600,attackBonus:1,damageMultiplier:1.25,blockDamagePct:22,parryDamagePct:25},
  twin_cut:{id:"twin_cut",name:"Twin Cut",role:"attack",windupMs:0,attackBonus:3,damageMultiplier:1.15,blockDamagePct:12,parryDamagePct:18},
  sidestep:{id:"sidestep",name:"Sidestep",role:"defense",defenseBonus:1,result:"dodge"},
  cross_guard:{id:"cross_guard",name:"Cross Guard",role:"defense",defenseBonus:2,result:"parry"},
  hammer_blow:Object.freeze({id:"hammer_blow",name:"Hammer Blow",role:"attack",
    windupMs:2100,attackBonus:1,damageMultiplier:1.65,blockDamagePct:30,parryDamagePct:35}),
  haft_guard:Object.freeze({id:"haft_guard",name:"Haft Guard",role:"defense",defenseBonus:1,result:"parry"}),
  heavy_swing: Object.freeze({
    id: "heavy_swing", name: "Heavy Swing", role: "attack",
    windupMs: 1_800, attackBonus: 3, damageMultiplier: 1.9,
    blockDamagePct: 25, parryDamagePct: 35
  }),
  thrust: Object.freeze({
    id: "thrust", name: "Thrust", role: "attack",
    windupMs: 0, attackBonus: 2, damageMultiplier: 1,
    blockDamagePct: 10, parryDamagePct: 15
  }),
  blade_guard: Object.freeze({
    id: "blade_guard", name: "Blade Guard", role: "defense",
    defenseBonus: 2, result: "parry"
  }),
  shield_block: Object.freeze({
    id: "shield_block", name: "Shield Block", role: "defense",
    defenseBonus: 5, result: "block"
  })
});

export const COMBAT_LOADOUTS = Object.freeze({
  greatsword: Object.freeze({
    id: "greatsword", name: "Two-handed Greatsword",
    attackSkill: "heavy_swing", defenseSkill: "blade_guard",
    weapon: "greatsword", initiativeBonus: -2
  }),
  sword_shield: Object.freeze({
    id: "sword_shield", name: "Sword & Shield",
    attackSkill: "thrust", defenseSkill: "shield_block",
    weapon: "sword", initiativeBonus: 1
  }),
  hammer:Object.freeze({id:"hammer",name:"Two-handed Hammer",attackSkill:"hammer_blow",
    defenseSkill:"haft_guard",weapon:"hammer",initiativeBonus:-3}),
  bow:{id:"bow",name:"Longbow",weapon:"bow",attackSkill:"arrow",defenseSkill:"sidestep",initiativeBonus:1},
  staff:{id:"staff",name:"Mage Staff",weapon:"staff",attackSkill:"spell",defenseSkill:"sidestep",initiativeBonus:-1},
  twin_blades:{id:"twin_blades",name:"Dual Swords",weapon:"swords",attackSkill:"twin_cut",defenseSkill:"cross_guard",initiativeBonus:2}
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
