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

## A2 — candidate opponent and gear scaling (draft)

Arena readiness is separate from survival work. Opponent target stats by grade are 10/24/42/62/82/104/124/144, with corresponding skill 1/5/10/17/25/33/40/50 and small stat variation. NPCs use the same smith and condition profile as the player, with matching grade on weapon and all four armour pieces; Non-grade Poor, higher-grade Common. No hard difficulty lock. Grade/quality multipliers and resistance are in [ARMOUR.md](ARMOUR.md). A2 keeps the fixed bout timeline and bounded offline payout, and advances the alpha save version to V12 (old disposable test progress resets with notice). Earlier GLAD-005 tables above are historical baseline, not current A2 results. New matrix pending CI and calibration.

### A2 verified grade-separation matrix

Source: `node tools/gladiator-benchmark.mjs`, fixed seed 20261124, [combat CI 45560649423](https://github.com/janisp123/idle_game/actions/runs/45560649423). Each equal-stat row uses 2,000 actual duels (25 ordered style pairs × five arenas × 16 seeds), Common quality and rotating Padded/Leather/Plate combinations. Because material pairings are not strictly mirrored, equal-grade rates are a broad reference, not a perfect symmetric fairness measurement. No gear/expertise penalty for unfamiliar types yet.

| Equal STR/DEX/END | Higher grade | Lower grade | Higher-grade-side win % |
| ---: | ---: | ---: | ---: |
| 10 | 0 | 0 | 57 |
| 10 | 1 | 0 | 92.45 |
| 10 | 2 | 0 | 99.2 |
| 10 | 3 | 0 | 99.9 |
| 10 | 7 | 0 | 100 |
| 80 | 0 | 0 | 56.6 |
| 80 | 1 | 0 | 85.1 |
| 80 | 2 | 0 | 95.5 |
| 80 | 3 | 0 | 99.6 |
| 80 | 7 | 0 | 100 |
| 150 | 0 | 0 | 57.25 |
| 150 | 1 | 0 | 83.8 |
| 150 | 2 | 0 | 94.65 |
| 150 | 3 | 0 | 99.35 |
| 150 | 7 | 0 | 100 |
| 150 | 7 | 6 | 81.5 |
| 150 | 7 | 5 | 94.3 |
| 150 | 7 | 4 | 99.25 |

Readiness against actual randomly selected arena NPCs: each row 320 fights (five styles × 64 seeds), player Common Leather. Matched = default benchmark stats and same item grade; low stats = 10/10/10 and skill 1 with matching gear; low gear = benchmark stats with Non-grade Common. NPC material distribution varies by role.

| Opponent grade | Matched | Low stats | Low gear |
| ---: | ---: | ---: | ---: |
| 0 | 58.44% | 58.44% | 58.44% |
| 3 | 31.88% | 0.00% | 0.00% |
| 7 | 32.81% | 0.00% | 0.00% |

S beat Non-grade in all 6,000 sampled equal-stat duels; at stat 150, S vs A/B/C won 81.5%/94.3%/99.25%. D/S readiness mismatches lost every sampled fight; no scripted result. Matched Leather wins ~32% against the NPC material mix, below a 50% broad target; Padded vs Plate, per-style bias, high-level quality and symmetric same-grade fairness need additional measurement after expertise. Early F vs Non-grade at stat 10 is stronger than the initial 75–85% one-grade target (92.45%); do not hide this. Grade factor provisional. Matrix comprises 36,000 gear and 2,880 readiness duels in addition to legacy 13,760 and the CI 10,000-bout scenario.

## A3 — verified equipment expertise matrix

Source: `node tools/gladiator-benchmark.mjs`, seed 20261124, [combat CI 45561154518](https://github.com/janisp123/idle_game/actions/runs/45561154518), verified head ff17713. Each row uses 1,200 production duels (five weapon styles × three armour families × five arenas × 16 seeds). Both builds use identical attributes, Fighting 50, same Masterwork item grade and same weapon/armour type. Player is fully trained; only opponent practice is varied. Trained control is an orientation-biased reference, not perfectly fair 50%.

| Grade | Equal stats | Opponent unfamiliar with | Trained-side wins / 1200 | Win % |
| --- | ---: | --- | ---: | ---: |
| 0 | 10 | weapon | 733 | 61.08 |
| 0 | 10 | armour | 733 | 61.08 |
| 0 | 10 | both | 733 | 61.08 |
| 0 | 10 | neither | 733 | 61.08 |
| 3 | 62 | weapon | 1107 | 92.25 |
| 3 | 62 | armour | 989 | 82.42 |
| 3 | 62 | both | 1172 | 97.67 |
| 3 | 62 | neither | 708 | 59.00 |
| 7 | 150 | weapon | 1198 | 99.83 |
| 7 | 150 | armour | 1155 | 96.25 |
| 7 | 150 | both | 1200 | 100.00 |
| 7 | 150 | neither | 691 | 57.58 |

At S, 1,198/1,200 wins against a weapon novice, 1,155/1,200 against armour novice and 1,200/1,200 against both; equipment expertise clearly matters even when actual gear/stats are identical. Non-grade has no expertise penalty. Sampled 100% does not prove guaranteed outcome. Trained-versus-trained S win 57.58%, which still indicates side bias. At D/S matched NPC readiness, the earlier Leather-vs-material-mix imbalance remains to be calibrated. No claim that every style or family is equally effective. Reassess severity and fairness in final combined calibration, not by adding scripted outcomes.

## A5 — motivational verdict presentation (draft)

The original resolver outcome remains victory/defeat/double death. A pure UI helper derives Impressive Victory or Humiliation only for an actual knockout with the winner retaining at least 80% maximum HP (at most 20% HP lost). Same threshold for either side, no timeout or double-death qualification. The loser HP in a timeout is forced to zero at verdict, so it must not count as a knockout. No extra payout, XP, expertise, penalties, timing, RNG or save changes. The final event alone is classified; no early reveal. The current UI title, picture caption and compact result token use the label. The existing correct style-specific art is used until the two exact approved outcome images can be committed. See [art handoff](OUTCOME_ART_HANDOFF.md).

### A5 verified dominance matrix

[Code head 7f12888](https://github.com/janisp123/idle_game/commit/7f1288860adda839cd65eebc1b466cb51d40b11f), [combat CI 45562341402](https://github.com/janisp123/idle_game/actions/runs/45562341402). 2,000 duels per row, equal STR/DEX/END 150, skill 50, fully trained Common Leather, all 25 ordered style pairings × five arenas × 16 seeds.

| Player / opponent grade | Wins | Losses | Double deaths | Impressive victories | Humiliations |
| --- | ---: | ---: | ---: | ---: | ---: |
| Non / Non | 1151 | 847 | 2 | 64 | 25 |
| S / Non | 2000 | 0 | 0 | 2000 | 0 |
| Non / S | 0 | 2000 | 0 | 0 | 2000 |
| S / S | 1135 | 864 | 1 | 50 | 20 |

Special results are subsets of the actual win/loss counts; no mechanical reward or HP changes. The 80% knockout threshold distinguishes gear mismatch from ordinary comparable fights in these samples. All four checks passed; the full A3/A4 normal daily trajectory is unchanged (including day 170 acquisition and 64.66% cumulative win rate). New binary art still pending; existing images remain fallback. Equal-grade player-side advantage remains for A6 review.


### A6 combined audit

[Full audited tables and findings](ALPHA_GEAR_FINAL_AUDIT.md). A6 measures paired role orientations, 20 builds, actual NPC readiness, quality, partial expertise and expanded trajectories. Greatsword and lighter armour require tuning, and mirror role bias requires review. No formula changed; A6 is not final balance approval.
