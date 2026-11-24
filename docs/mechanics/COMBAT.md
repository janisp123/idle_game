# Physical arena combat

Fighting resolves automatically with a seeded physical battle engine. The active view, simulator, and arena purse all consume the same outcomes. Playing the same frozen fighter with the same seed and bout index yields the same sequence. Five arenas change the initial distance, visibility, cover, retreat room, approach and swing clearance. Each fighter rolls 3d6 once before the opening move. On unequal totals, 64% of selections use the high roller’s preferred arena pool and 36% draw uniformly from all five. Equal rolls draw uniformly. A roll of 6–6–6 is the highest possible total, with no damage or guard effect. The same seeded choice drives play, offline payouts and simulation.

## Actions and distance

Each bout starts at Far, Reach, or Close. Fighters approach to reach their weapon's range, and mobility and Dexterity affect action order. The bow can retreat during recovery when it has room and is lighter on its feet than the opponent. Its four arrows are spent even on a miss. It switches automatically to a shorter-range, lower-power dagger when arrows run out or the bow breaks. The spear begins threatening at Reach and loses precision and power at Close. Sword & Shield blocks and can spend its counter on a low-damage stagger bash. Greatsword reaches farther and parries when ready. War Hammer is slower and short-ranged, with strong blunt damage against shields and armour.

Piercing, slashing and blunt use different protection coefficients. Unguarded cutting or piercing damage can open a two-action bleed. A strong blunt blow or Shield Bash can interrupt the opponent's next action. A decisive hit can amplify damage. Every HP change is recorded once.

## Condition and verdict

Each equipped armour piece, the weapon and the shield have separate condition. Non-Masterwork items can break. A broken shield stops blocking, broken armour stops protecting its portion of the body, and a broken weapon loses attack power. Masterwork holds its condition throughout a bout. Between bouts, equipment returns to its original condition. The UI displays resolved HP, condition and break events, with neutral arena artwork when an exact illustration is unavailable.

A battle ends at zero HP or after 32 action rounds. At timeout, higher **raw HP** wins only if that fighter did HP damage. The guards execute both on a tie or when the higher-HP fighter dealt no damage. The losing fighter reaches zero HP. A defeat or double death takes 20 seconds of productive time for automatic resurrection and return. Gear, currency and XP already acquired remain available.

## Timeline and payouts

The fixed 200-second bout timeline reserves the final 20 seconds for recovery or resurrection. The 256-bout seeded schedule makes exact offline settlement bounded. The offline report describes long absences as an estimate from the repeated schedule. A settlement inspects at most 256 bouts per frozen session, then multiplies whole-cycle counts and handles the remainder and partial resurrection window. The same model drives payouts and productive time. No unseen hit-by-hit events are reported. The save retains the frozen fighter, arena clock and prize cursor. V11 uses the five-arena schedule; prior alpha saves reset once with notice.

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

## Arena contrasts

| Arena | Physical effect | Representative contrast |
| --- | --- | --- |
| Open Field | Far start, long sightlines, three bands of retreat available across the bout | Bow won 510 of 1,024 bouts here and 208 in Ruined Streets |
| Narrow Bridge | A single slow approach and tight swings | Spear won 590 here and 231 in Gatehouse Chamber |
| Ruined Streets | Obstructed sightlines and cover, especially for a shielded approach | Sword & Shield won 811 here and 636 in Open Field |
| Walled Courtyard | Swing clearance with no extended retreat | Greatsword won 574 here and 228 in Gatehouse Chamber |
| Gatehouse Chamber | Close start and low clearance | War Hammer won 807 here and 504 in Open Field |

Each contrast used the production combat resolver and 256 seeded fights against each of four other equal-stat, Non-grade Poor Leather builds. The contrast shows a particular matchup and geometry effect. For example, Sword & Shield also performed strongly in the chamber in this sample.

## GLAD-005 representative benchmark

Run `node tools/gladiator-benchmark.mjs` to reproduce 13,760 resolved bouts with seed 20261124. The baseline is 64 bouts per ordered matchup in each of five arenas for equal-stat Non-grade Poor Leather builds. The separate upgrade sample rotates representative weapon and terrain pairings over Padded, Leather and Plate at Non-grade, F and E. It compares the full quality ladder at fixed item grade and attributes within each pairing.

| Quality | Wins / 1,152 | Break events across both fighters | Coins per productive hour |
| --- | ---: | ---: | ---: |
| Poor | 532 | 517 | 210.1 |
| Common | 626 | 415 | 233.9 |
| Fine | 808 | 296 | 289.0 |
| Masterwork | 913 | 106 | 321.6 |

The baseline had 4,105 wins, 3,894 defeats and one double death. Across both sides it recorded 3,613 breaks, 2,971 bow outcomes with an empty quiver, 57,757 bleed ticks and 6,859 stagger events. The 106 break events in the Masterwork row came from the Common opponents. These are aggregate samples, with variation by opponent and arena.

For a fixed Greatsword build in Walled Courtyard, Non-grade, F and E items won 33, 63 and 70 of 128 against an F Spear. Raising that opponent to E reduced those results to 0, 18 and 18. The current costs and power steps show a benefit in the sampled settings and remain provisional. Sword & Shield was strong overall, including 64 of 64 against Spear in Gatehouse Chamber, and won 23 of 64 against Bow in Open Field. The other four styles each had stronger and weaker pairings in the same matrix.
