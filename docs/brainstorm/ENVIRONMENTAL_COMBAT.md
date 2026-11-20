# Environmental combat — crucial game mechanic

**Status:** Explicitly important owner direction, not yet an approved implementation task. Updated 2026-11-20.

## Principle
**The location changes which fighting style is effective.** A fantasy character should excel at *some* situations but not *every* situation. There must be no universally best two-skill combination.

Use **real combat conditions**, not a flat “archers +30% in field” modifier:
- **Starting distance:** ranged fighters have time to shoot or cast across open terrain; in a dungeon an enemy can begin near melee range.
- **Line of sight:** forests, walls, pillars and corners affect arrows, spells and ambushes.
- **Space and obstacles:** narrow corridors restrict dodging, escape, maneuvering and the advantage of long weapons.
- **Closing distance and movement:** melee enemies spend time approaching in fields, but can immediately threaten a nearby caster in tight spaces.
- **Weapon/skill timing:** casting, aiming, attack wind-up, interruptions and recovery operate against terrain constraints.
- **Cover and concealment:** change the chance to reach a target rather than granting arbitrary class-based percentages.

## Contrasting examples

| Property | Open field | Narrow dungeon |
| --- | --- | --- |
| Example initial range | 30 metres | 3 metres |
| Mage/archer | Time to aim or cast before melee arrives | Threatened during preparation; attacks may be interrupted |
| Melee fighter | Must close distance while exposed | Starts near striking range |
| Visibility | Clear sightlines | Short sightlines, obstacles |
| Dodging/retreat | Space to maneuver | Limited by corridor walls |

**Distances above are hypothetical balancing inputs, not decided numbers.** A ranged character may still fight in a dungeon and a melee fighter may still win in open terrain. These are advantages, not restrictions.

### Natural rock-paper-scissors
- Fast close-range attackers pressure interruptible casters.
- Heavy armour resists blades and arrows but can be threatened by armour-crushing weapons or fire heating metal.
- Shields counter appropriate ranged/physical threats but do not solve every danger.
- Enemy movement speed, weapons, armour and environment can matter as much as character skill.

## Modular architecture and combat simulator
Environment is **data/configuration**: start distance, sightline/obstacle rules, usable space, cover and movement constraints. The *same* generic combat engine applies the rules to all maps without rewriting skills or hardcoding per-class buffs.

**Simulator acceptance experiments (design only):**
1. Use the same hero, opponent, two skills, weapon, levels and seeded random rolls.
2. Run many fights in the open field and dungeon corridor with only the environment changed.
3. Compare win rates, approach time, cast interruptions, average damage, fight length, survival, XP/hour and resource gain.
4. Swap fast enemies, armoured targets and ranged targets to ensure no one style dominates every environment.
5. Check counterplay is caused by real mechanics; vary range and cover to detect weird edge cases.
6. Keep ordinary fights short and dangerous. Don't paper over weak design with artificial class bonuses.

**First environment test:** two locations, **Open Field** and **Dungeon Corridor**, even if the first playable version shows only one at a time.

**Open:** exact distance and movement modelling, positioning resolution, cover rules, escape and who chooses terrain.

**Core design rule:** Choosing *where* to farm is as strategically meaningful as choosing *which skills* to practice.