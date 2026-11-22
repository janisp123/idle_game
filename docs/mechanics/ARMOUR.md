# Armour weight and combat balance — four-tier alpha

The OWNER requested a deliberate physical / evasion / magic counter triangle, with **exactly four choices per body slot**: `None`, `Robe`, `Leather`, `Plate`. This is a fixed selectable loadout, **not random loot, a store, or consumable/craft gear**. All 11 slots are independently changeable; each side can mix types.

## Per-item catalogue and weight (kg)

| Slot | Coverage of full suit | None | Robe | Leather | Plate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Head: Hood / Mask / Helm | 12% | 0 | 0.40 | 0.70 | 2.80 |
| Shoulder pad (each ×2) | 8% each | 0 | 0.30 | 1.00 | 2.20 |
| Chest: Vestment / Jerkin / Cuirass | 33% | 0 | 2.40 | 4.00 | 9.50 |
| Armguard (each ×2) | 5% each | 0 | 0.20 | 0.50 | 1.70 |
| Gloves (each ×2) | 2.5% each | 0 | 0.15 | 0.30 | 0.60 |
| Leggings: Robe / Leather / Plate Cuisses | 16% | 0 | 1.20 | 2.00 | 5.50 |
| Boots (each ×2) | 4% each | 0 | 0.35 | 0.85 | 1.60 |
| **Full suit** | **100%** | **0 kg** | **6 kg** | **12 kg** | **30 kg** |

Names remain consistent within each family: **Robe Hood / Leather Mask / Plate Helm**, Robe Mantle / Leather Spaulder / Plate Pauldron, Robe Vestment / Leather Jerkin / Plate Cuirass, Robe Sleeves / Leather Bracer / Plate Vambrace, Robe Gloves / Leather Gloves / Plate Gauntlets, Robe Leggings / Leather Leggings / Plate Cuisses, Robe Footwraps / Leather Boots / Plate Sabatons. `None` always unequips the slot.

**Existing weapon pieces:** Greatsword **5 kg** (greatsword style); Sword **2 kg** + Shield **5 kg** (sword-and-shield style, **7 kg** total). Those pieces are fixed and included in total weight; their old skill bonuses remain in `combat-skills.mjs`.

## Provisional full-set target balance

| Armour | Physical damage reduction (on landed hit) | Magic resistance (future) | Evasion dice score | Dodge margin needed | Armour mobility (before weapon) |
| --- | ---: | ---: | ---: | ---: | ---: |
| None | 0% | 0% | +3 | 2 | 100% |
| Robe | 4% | 45% | +0 | 5 | 95% |
| Leather | 22% | 12% | +2 | 3 | 90% |
| Plate | 50% | 0% | −3 | 99 | 75% |

A lower dodge margin makes the already-successful 3d6 defense appear as a **dodge** instead of a trained guard/parry. Plate margin `99` makes dodging exceptionally unlikely: heavy armour usually relies on direct absorption or weapon blocking. Evasion score modifies the **same genuine defender 3d6 total**, not a secretly invented second RNG roll. None has the most raw evasion but takes all damage that lands. Actual probability of a dodge is **not** equal to the above score and depends on both fighters' stats, dice and trained guards.

**Mixed sets:** Each of the 11 pieces contributes its **body coverage share**, and the shares sum to exactly 100. `physicalReductionPct = round(Σ (coverage% × typePhysicalReduction%)/100)`, similarly for magic resistance, evasion score and dodge-margin target. Equipment damage reduction applies to a landed *physical* hit once, `max(1, round(baseHitDamage × (100 − physicalReductionPct)/100))`. A successful 6–6–6 finisher still resolves through the opposed-roll finisher rule: do not fabricate a hit amount or silently weaken the special event.

**Weight and movement:** `totalKg = Σ armour piece kg + Σ weapon pieces kg`. `armourMobilityPct = max(65, 100 − round(armourKg × 25/30))`; subtract `round(weaponKg × 0.6)` for final `mobilityPct` (minimum 60%). E.g., Greatsword + None is **5 kg / 97% mobility**, + Robe **11 kg / 92%**, + Leather **17 kg / 87%**, + Plate **35 kg / 72%**. Encumbrance also imposes `initiativePenalty = min(4, floor(totalKg / 12))` on the existing three-dice initiative total. Movement and dodge are **combat mobility only in this release**; changing real-world activity travel/preparation duration would conflict with separately pending GAME-012 and needs its own timing-profile migration. There are no new timers on screen.

**Paper–scissors–rock intent:** Plate counters common physical blows; Leather favors practical dodging and light gear; Robe is fragile against steel but counters magic. **There is no spell/elemental damage system yet**, so the triangle is *not yet complete in live combat*. `magicResistancePct` is calculated/stored for future damage types but has **no current combat effect**. Do not misrepresent MR as providing protection from physical attacks. No gender/class/race restriction is added.

## Level locks and saved progression

- None and Robe: **Fighting Lv 1**. Leather: **activated Fighting Lv 5**. Plate: **activated Fighting Lv 12**. Only this recognized skill level gates the current alpha set; no global character level exists.
- Former V7 clothing keys `hood`, `cloth`, `tunic`, `wraps`, `trousers`, `worn` migrate to `robe`; old `iron` migrates to `plate` if the activated Fighting level actually qualifies. Existing `leather` and `none` persist. Missing and invalid entries become the free starter Robe, without resetting skills, XP, resources, tasks, or character name. No `SAVE_KEY` or `GAME_VERSION` bump.
- `setArmourChoice` settles any already-earned interval under the **old** frozen gear and then replaces the selection. When Fighting, the next duel starts afresh with the new effective equipment, without dropping acquired resources, XP, or any previous attribute effort. A no-change selection is a no-op.
- The frozen active Fighting session stores an optional checked `player.gear` snapshot from `armourStats`; new opponent snapshots use starting Robe equipment. Old saved sessions lacking `gear` retain their historical no-gear combat math on *both sides*, including after years offline. There are no unbounded per-duel replay loops, and OFF-001 applies as before.

## Source and verification

- Values / names / weights: `site/play/armour.mjs`.
- Combat initiative / evasion / physical mitigation: `site/play/combat.mjs`.
- Frozen snapshot and validated equipment changes: `site/play/engine.mjs`.
- Dropdown and compact stats: `site/play/app.mjs` and `site/play/iron-ui.css`. `MR*` denotes an intentionally inactive future magic counter.
- Tests: `tools/test_game_engine.mjs`, `tools/test_combat.mjs`, `tools/test_game_ui.mjs`. Full numeric balance is **provisional pending live combat playtesting**, including future NPC progression and magic matchups.
