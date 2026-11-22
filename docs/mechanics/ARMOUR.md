# Fixed armour wardrobe — implemented UI selection (alpha)

Armour here is a **finite equipment choice list**, not a second resource inventory, random loot system or craft recipe. The owner asked for a Pit-of-War-inspired dark bronze equipment board, two gloves, two boots, shoulders, armguards, leggings, chest and hood/helmet, with a single dropdown like the existing combat style selection.

## Slots and selection

- Eleven independent slots: head, chest, legs, left/right shoulders, left/right armguards, left/right gloves, left/right boots.
- A collapsible ARMOUR panel under the character's weapon style contains an original CSS-framed body-shaped grid. Tap a slot; its **one shared native dropdown** lists exactly four preset designs for that family (none, starter, leather, iron). No resource consumption, buying, drop RNG, item stacks, or gear database.
- All 11 starter clothing pieces are selectable without prerequisites. A character may unequip each side independently.
- Level gates are centralized in `site/play/armour.mjs`: leather **Fighting Lv 5**, iron **Fighting Lv 12**. The options remain visible but disabled/greyed out until that **activated** Fighting skill level. XP waiting for the Skill Master does not count. `ARMOUR_LEVELS` and the fixed choices are provisional and easy to retune.
- Equipment selection is a **presentation/save feature only** at this stage. There are **no armor/HP/defense/stat/damage bonuses**: neither `combat.mjs` nor `combatSession` is altered. Future functional armor effects need owner-approved balance and OFF-001-compatible frozen snapshot/migration tests. Do not display invented bonuses.

## Save/offline safety

- New games begin with fixed starter clothing. `readSave` fills the optional `armour` object for all older local saves, including existing V7 saves, **without changing `GAME_VERSION` or `SAVE_KEY`**. Unknown/malformed/locked entries fall back to their base option; existing XP, skill levels, inventory, queues and combat session stay intact.
- `setArmourChoice` validates both slot and level, settles already-earned time before changing the choice, and preserves ongoing duel state because this first release provides no combat modifier. Offline simulations use the same frozen combat power as before.
- All strings are fixed source constants and rendered with DOM `textContent`, not third-party assets or injected markup.

## Test coverage

`tools/test_game_engine.mjs`: slots and choices, independent sides, level lock enforcement, read/write and legacy V7 migration, invalid-choice normalization, preservation of other game state. `tools/test_game_ui.mjs`: responsive markup, selectable tiles, disabled native options, save changes and attempts to force a locked option.

`docs/mechanics/COMBAT.md` continues to specify the actual 3d6 duel mechanics.
