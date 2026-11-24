# Armour weight and combat balance — survival alpha

The survival batch keeps eleven independent body slots with three choices per slot. None is the default. Leather requires DEX and Plate requires STR. The four-slot shop and equipment redesign follows in GLAD-002.

## Per-item catalogue and weight (kg)

| Slot | Coverage of full suit | None | Leather | Plate |
| --- | ---: | ---: | ---: | ---: |
| Head: Hood / Mask / Helm | 12% | 0 | 0.70 | 2.80 |
| Shoulder pad (each ×2) | 8% each | 0 | 1.00 | 2.20 |
| Chest: Vestment / Jerkin / Cuirass | 33% | 0 | 4.00 | 9.50 |
| Armguard (each ×2) | 5% each | 0 | 0.50 | 1.70 |
| Gloves (each ×2) | 2.5% each | 0 | 0.30 | 0.60 |
| Leggings | 16% | 0 | 2.00 | 5.50 |
| Boots (each ×2) | 4% each | 0 | 0.85 | 1.60 |
| **Full suit** | **100%** | **0 kg** | **12 kg** | **30 kg** |

**Existing weapon pieces:** Greatsword **5 kg** (greatsword style); Sword **2 kg** + Shield **5 kg** (sword-and-shield style, **7 kg** total). Those pieces are fixed and included in total weight; their old skill bonuses remain in `combat-skills.mjs`.

## Provisional full-set target balance

| Armour | Physical damage reduction (on landed hit) | Magic resistance (future) | Evasion dice score | Dodge margin needed | Armour mobility (before weapon) |
| --- | ---: | ---: | ---: | ---:  ---: |
| None | 0% | 0% | +3 | 6 | 100% |
| Leather | 22% | 12% | +2 | 8 | 90% |
| Plate | 50% | 0% | −3 | 99 | 75% |

A lower dodge margin makes an exceptionally successful 3d6 defense appear as a **dodge** instead of a trained guard/parry. The margin thresholds have been increased to make true dodges rarer; a block or parry can transmit partial physical impact even when the roll succeeds (see [Combat](COMBAT.md)). Plate margin `99` makes dodging exceptionally unlikely: heavy armour usually relies on direct absorption or weapon blocking. Evasion score modifies the **same genuine defender 3d6 total**, not a secretly invented second RNG roll. None has the most raw evasion but takes all damage that lands. Actual probability of a dodge is **not** equal to the above score and depends on both fighters' stats, dice and trained guards.

**Mixed sets:** Each of the 11 pieces contributes its **body coverage share**, and the shares sum to exactly 100. `physicalReductionPct = round(Σ (coverage% × typePhysicalReduction%)/100)`, similarly for magic resistance, evasion score and dodge-margin target. Equipment damage reduction applies to a landed *physical* hit once, `max(1, round(baseHitDamage × (100 − physicalReductionPct)/100))`. A successful 6–6–6 finisher still resolves through the opposed-roll finisher rule: do not fabricate a hit amount or silently weaken the special event.

**Weight and movement:** `totalKg = Σ armour piece kg + Σ weapon pieces kg`. `armourMobilityPct = max(65, 100 − round(armourKg × 25/30))`; subtract `round(weaponKg × 0.6)` for final `mobilityPct` (minimum 60%). E.g., Greatsword + None is **5 kg / 97% mobility**, + Leather **17 kg / 87%**, + Plate **35 kg / 72%**. Encumbrance also imposes `initiativePenalty = min(4, floor(totalKg / 12))` on the existing three-dice initiative total. Movement and dodge are **combat mobility only in this release**; changing real-world activity travel/preparation duration would conflict with separately pending GAME-012 and needs its own timing-profile migration. There are no new timers on screen.

## Attribute requirements and saved progression

**Armour is equipped using permanent character attributes, not any activity skill level.** There is no global character level. The character's actual **STR and DEX** come from `effectiveAttributeProgress(attributeEffort, skills)` and refresh immediately when productive time raises those attributes; Mastery contributes through earned attribute points.

| Piece family | Leather — DEX required | Plate — STR required |
| --- | ---: | ---: |
| Head | 11 | 13 |
| Shoulders (each) | 11 | 13 |
| Chest | 12 | 16 |
| Armguards (each) | 11 | 12 |
| Gloves (each) | 10 | 12 |
| Leggings | 12 | 15 |
| Boots (each) | 11 | 12 |

- **None** always has no requirements. Baseline attributes are all 10, so certain light Leather pieces are immediately available. The largest Plate pieces require real STR training. Each left/right slot is independent; a player can mix qualifying pieces without inventing extra item tiers.
- These are **provisional balance thresholds** centralized in `ARMOUR_REQUIREMENTS` inside `site/play/armour.mjs`. Unlocks require real attribute **values**, never skill XP or Fighting rank. Disabled options remain visible with the exact `STR N` / `DEX N` requirement and their existing weight.
- `setArmourChoice` settles already-earned work time under the old frozen effective gear, then checks the resulting character attributes; a newly qualified player can equip immediately without advancing a skill. Changing a piece during Fighting starts a fresh duel without deleting acquired resources, skill XP, any attribute effort or queued activities. A same-piece selection is a no-op, including grandfathered gear.
- The frozen Fighting session retains its gear snapshot throughout offline time (OFF-001). Former gearless sessions keep the prior combat math; no retroactive changes to past effective combat.

## Source and verification

- Names, weights, tier counters and attribute gates: `site/play/armour.mjs`. Character attributes are derived by `site/play/attributes.mjs`.
- Combat initiative / evasion / physical mitigation: `site/play/combat.mjs`.
- Frozen snapshot and validated equipment changes: `site/play/engine.mjs`.
- Dropdown and compact stats: `site/play/app.mjs` and `site/play/iron-ui.css`. `MR*` denotes an intentionally inactive future magic counter.
- Tests: `tools/test_game_engine.mjs`, `tools/test_combat.mjs`, `tools/test_game_ui.mjs`. Full numeric balance is **provisional pending live combat playtesting**, including future NPC progression.
