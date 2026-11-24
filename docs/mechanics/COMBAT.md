# Physical arena combat

Fighting resolves automatically with a seeded physical battle engine. The active view, simulator, and arena purse all consume the same outcomes. Playing the same frozen fighter with the same seed and bout index yields the same sequence. Three provisional terrains determine initial distance and whether retreat is available. GLAD-004 owns the five-arena positioning roll.

## Actions and distance

Each bout starts at Far, Reach, or Close. Fighters approach to reach their weapon's range, and mobility and Dexterity affect action order. The bow can retreat during recovery when it has room and is lighter on its feet than the opponent. Its four arrows are spent even on a miss. It switches automatically to a shorter-range, lower-power dagger when arrows run out or the bow breaks. The spear begins threatening at Reach and loses precision and power at Close. Sword & Shield blocks and can spend its counter on a low-damage stagger bash. Greatsword reaches farther and parries when ready. War Hammer is slower and short-ranged, with strong blunt damage against shields and armour.

Piercing, slashing and blunt use different protection coefficients. Unguarded cutting or piercing damage can open a two-action bleed. A strong blunt blow or Shield Bash can interrupt the opponent's next action. A decisive hit can amplify damage. Every HP change is recorded once.

## Condition and verdict

Each equipped armour piece, the weapon and the shield have separate condition. Non-Masterwork items can break. A broken shield stops blocking, broken armour stops protecting its portion of the body, and a broken weapon loses attack power. Masterwork holds its condition throughout a bout. Between bouts, equipment returns to its original condition. The UI displays resolved HP, condition and break events, with neutral arena artwork when an exact illustration is unavailable.

A battle ends at zero HP or after 32 action rounds. At timeout, higher **raw HP** wins only if that fighter did HP damage. The guards execute both on a tie or when the higher-HP fighter dealt no damage. The losing fighter reaches zero HP. A defeat or double death takes 20 seconds of productive time for automatic resurrection and return. Gear, currency and XP already acquired remain available.

## Timeline and payouts

The fixed 200-second bout timeline reserves the final 20 seconds for recovery or resurrection. The 256-bout seeded schedule makes exact offline settlement bounded. It counts actual victories and productive time without replaying years of bouts. The save retains the frozen fighter, arena clock and prize cursor. V10 uses the physical snapshot; prior alpha saves reset once with notice.

Source of truth: `physical-duel.mjs`, `combat.mjs`, `arena-wallet.mjs`, `smith.mjs`, and the Fighting path in `engine.mjs`.

## Initial matchup check

Using production snapshots with equal base stats, full Non-grade Poor Leather, Far starting distance, and 256 seeded bouts per ordered pairing, these are player wins out of 256. The remainder includes defeats and double deaths. This sample leaves wider grade, quality, armour and arena calibration to GLAD-005.

| Player / opponent | Bow | Spear | Sword & Shield | Greatsword | War Hammer |
| --- | ---: | ---: | ---: | ---: | ---: |
| Bow | 126 | 107 | 107 | 125 | 171 |
| Spear | 144 | 124 | 64 | 150 | 115 |
| Sword & Shield | 141 | 202 | 122 | 156 | 137 |
| Greatsword | 157 | 112 | 98 | 138 | 156 |
| War Hammer | 106 | 151 | 136 | 111 | 128 |
