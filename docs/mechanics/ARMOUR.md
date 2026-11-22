# Armour weight and combat balance — four-tier alpha

The OWNER requested a deliberate physical / evasion / magic counter triangle, with **exactly four choices per body slot**: `None`, `Mage Robe`, `Leather`, `Plate`. This is a fixed selectable loadout, **not random loot, a store, or consumable/craft gear**. All 11 slots are independently changeable; each side can mix types.

## Per-item catalogue and weight (kg)

| Slot | Coverage of full suit | None | Mage Robe | Leather | Plate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Head: Hood / Mask / Helm | 12% | 0 | 0.40 | 0.70 | 2.80 |
| Shoulder pad (each ×2) | 8% each | 0 | 0.30 | 1.00 | 2.20 |
| Chest: Vestment / Jerkin / Cuirass | 33% | 0 | 2.40 | 4.00 | 9.50 |
| Armguard (each ×2) | 5% each | 0 | 0.20 | 0.50 | 1.70 |
| Gloves (each ×2) | 2.5% each | 0 | 0.15 | 0.30 | 0.60 |
| Leggings: Robe / Leather / Plate Cuisses | 16% | 0 | 1.20 | 2.00 | 5.50 |
| Boots (each ×2) | 4% each | 0 | 0.35 | 0.85 | 1.60 |
| **Full suit** | **100%** | **0 kg** | **6 kg** | **12 kg** | **30 kg** |

Names remain consistent within each family: **Mage Hood / Leather Mask / Plate Helm**, Mage Mantle / Leather Spaulder / Plate Pauldron, Mage Robe / Leather Jerkin / Plate Cuirass, Mage Sleeves / Leather Bracer / Plate Vambrace, Mage Gloves / Leather Gloves / Plate Gauntlets, Mage Leggings / Leather Leggings / Plate Cuisses, Mage Footwraps / Leather Boots / Plate Sabatons. `None` always unequips the slot. The saved internal tier ID is still `robe` for backwards compatibility.

**Existing weapon pieces:** Greatsword **5 kg** (greatsword style); Sword **2 kg** + Shield **5 kg** (sword-and-shield style, **7 kg** total). Those pieces are fixed and included in total weight; their old skill bonuses remain in `combat-skills.mjs`.

## Provisional full-set target balance

| Armour | Physical damage reduction (on landed hit) | Magic resistance (future) | Evasion dice score | Dodge margin needed | Armour mobility (before weapon) |
| --- | ---: | ---: | ---: | ---: | ---: |
| None | 0% | 0% | +3 | 6 | 100% |
| Mage Robe | 4% | 45% | +0 | 9 | 95% |
| Leather | 22% | 12% | +2 | 8 | 90% |
| Plate | 50% | 0% | −3 | 99 | 75% |

A lower dodge margin makes an exceptionally successful 3d6 defense appear as a **dodge** instead of a trained guard/parry. The margin thresholds have been increased to make true dodges rarer; a block or parry can transmit partial physical impact even when the roll succeeds (see [Combat](COMBAT.md)). Plate margin `99` makes dodging exceptionally unlikely: heavy armour usually relies on direct absorption or weapon blocking. Evasion score modifies the **same genuine defender 3d6 total**, not a secretly invented second RNG roll. None has the most raw evasion but takes all damage that lands. Actual probability of a dodge is **not** equal to the above score and depends on both fighters' stats, dice and trained guards.

**Mixed sets:** Each of the 11 pieces contributes its **body coverage share**, and the shares sum to exactly 100. `physicalReductionPct = round(Σ (coverage% × typePhysicalReduction%)/100)`, similarly for magic resistance, evasion score and dodge-margin target. Equipment damage reduction applies to a landed *physical* hit once, `max(1, round(baseHitDamage × (100 − physicalReductionPct)/100))`. A successful 6–6–6 finisher still resolves through the opposed-roll finisher rule: do not fabricate a hit amount or silently weaken the special event.

**Weight and movement:** `totalKg = Σ armour piece kg + Σ weapon pieces kg`. `armourMobilityPct = max(65, 100 − round(armourKg × 25/30))`; subtract `round(weaponKg × 0.6)` for final `mobilityPct` (minimum 60%). E.g., Greatsword + None is **5 kg / 97% mobility**, + Mage Robe **11 kg / 92%**, + Leather **17 kg / 87%**, + Plate **35 kg / 72%**. Encumbrance also imposes `initiativePenalty = min(4, floor(totalKg / 12))` on the existing three-dice initiative total. Movement and dodge are **combat mobility only in this release**; changing real-world activity travel/preparation duration would conflict with separately pending GAME-012 and needs its own timing-profile migration. There are no new timers on screen.

**Paper–scissors–rock intent:** Plate counters common physical blows; Leather favors practical dodging and light gear; Mage Robe is fragile against steel but counters magic. **There is no spell/elemental damage system yet**, so the triangle is *not yet complete in live combat*. `magicResistancePct` is calculated/stored for future damage types but has **no current combat effect**. Do not misrepresent MR as providing protection from physical attacks. No gender/class/race restriction is added.

## Attribute requirements and saved progression

**Armour is equipped using permanent character attributes, not any activity skill level.** There is no global character level. The character's actual **STR, DEX and WIL** come from `allAttributeProgress(attributeEffort)` and refresh immediately when productive time raises those attributes; the Skill Master and Fighting level are irrelevant for equipment access.

| Piece family | Mage Robe — WIL required | Leather — DEX required | Plate — STR required |
| --- | ---: | ---: | ---: |
| Head | 10 | 11 | 13 |
| Shoulders (each) | 10 | 11 | 13 |
| Chest | 10 | 12 | 16 |
| Armguards (each) | 10 | 11 | 12 |
| Gloves (each) | 10 | 10 | 12 |
| Leggings | 10 | 12 | 15 |
| Boots (each) | 10 | 11 | 12 |

- **None** always has no requirements. Baseline attributes are all 10, so ordinary Mage Robe and certain light Leather pieces are immediately available. The largest Plate pieces require real STR training. Each left/right slot is independent; a player can mix qualifying pieces without inventing extra item tiers.
- These are **provisional balance thresholds** centralized in `ARMOUR_REQUIREMENTS` inside `site/play/armour.mjs`. Unlocks require real attribute **values**, never skill XP or Fighting rank. Disabled options remain visible with the exact `STR N` / `DEX N` / `WIL N` requirement and their existing weight.
- **Basic slot enchanting is now implemented:** [Glory Scrolls and slot enchantments](ENCHANTMENTS.md) enable fixed weapon-slot +attack and individual armour-slot +flat physical defense with 50% success or full reset. Enchants persist on **slots**, not generated items. Extra STR/DEX/WIL requirements per enchanted rank (especially higher WIL for Mage Robes) remain future owner decisions; base gear equip restrictions below are unchanged.
- Former V7 clothing keys `hood`, `cloth`, `tunic`, `wraps`, `trousers`, `worn` migrate to `robe`; old `iron` migrates to `plate` regardless of new stats. Existing `leather`, `robe`, `plate` and `none` persist. Unknown malformed selections alone fall back to Mage Robe. **Previously worn valid gear is grandfathered** when loading a save even if the character is below the new requirement, so the revision never silently deletes an old selection; once a player removes that piece, equipping it again requires the correct attribute. This is suitable for the existing browser-local prototype, not an anti-cheat multiplayer policy.
- `setArmourChoice` settles already-earned work time under the old frozen effective gear, then checks the resulting character attributes; a newly qualified player can equip immediately without advancing a skill. Changing a piece during Fighting starts a fresh duel without deleting acquired resources, skill XP, any attribute effort or queued activities. A same-piece selection is a no-op, including grandfathered gear.
- The frozen Fighting session retains its gear snapshot throughout offline time (OFF-001). Former gearless sessions keep the prior combat math; no retroactive changes to past effective combat.

## Source and verification

- Names, weights, tier counters and attribute gates: `site/play/armour.mjs`. Character attributes are derived by `site/play/attributes.mjs`.
- Combat initiative / evasion / physical mitigation: `site/play/combat.mjs`.
- Frozen snapshot and validated equipment changes: `site/play/engine.mjs`.
- Dropdown and compact stats: `site/play/app.mjs` and `site/play/iron-ui.css`. `MR*` denotes an intentionally inactive future magic counter.
- Tests: `tools/test_game_engine.mjs`, `tools/test_combat.mjs`, `tools/test_game_ui.mjs`. Full numeric balance is **provisional pending live combat playtesting**, including future NPC progression and magic matchups.
