# GEAR-RESEARCH-001 — NPC benchmarks and arena reward balancing

2026-11-25, chat. Research only. Baseline `01362378d8aefcec3aa1fa4bb73116d9457237c3`; proposed cumulative gear perks, expertise and durability from earlier studies, not deployed. No runtime files, saves or deployment modified. Goal: make appropriate-grade arenas profitable without encouraging undergeared upward skipping; preserve open access and the six-month equipment target. Exact numerical candidate requires owner approval.

## Method and reproducibility

Used pinned real NPC generation, terrain selection, physical combat, smith conditions and wallet/engine progression. Candidate NPC stat arrays replace only ARENA_BENCHMARKS in the isolated module; NPC skills, qualities, gear, role distribution and terrain unchanged. This array also informs the synthetic progression policy's readiness choice; not a new arena access restriction. Player synthetic guard stats stay at ORIGINAL grade benchmarks, not reduced candidate stats. For each stat curve: 60 existing progression snapshots × eight arenas × 64 bouts; 240 grade/quality/build guards (Poor prior-grade expertise and Masterwork fully trained), testing same and up to two higher arenas, 40,320 guard bouts, total 71,040 per curve. Initial seeds 20261125 and 1298729031, 32 bouts each. Three reward curves evaluated on same outcomes, not counted as new duels. Medium independent validation uses four fresh seeds 975318642, 314159265, 246813579, 271828182, 128 bouts per cell, four reward curves including targeted. No guarantee for every possible seed/build. Coin/hour = victories / bouts × prize ×18; recovery included; not calendar income under XP cap.

Recheck normal-profile actual engine with cumulative full-credit sequential purchases, daily manual claims/shop, original fixed gear/stat/skill-based arena selection, seed 20261201. Three moderate and 15 targeted trajectories, all 180 days. Wallet conservation and quote/debit equality checked; additional assertion verifies S prize is exactly 185 or 245 after fixing a shadowed mode variable. First mislabeled targeted batch accidentally used moderate prices; discarded and replaced with correctly rerun data (prior commits retained for audit). Final new-snapshot validation uses four fresh session seeds above, 60 recalculated milestone snapshots and 120 extreme mismatches (S stats 144/144/144, skill50, full mastery, gear grades NG–S), all eight arenas. This is independent of the first screening seeds, but uses same seed set as the earlier medium validation; the progression seed remains single. Total 610,560 direct duel executions in valid sweeps, plus 1,198,712 settled bouts across 18 completed economic trajectories (repeating bounded engine schedule, NOT independent additional direct duels). Excludes discarded mislabeled run and no standalone Node/CI execution claim.

Run:
- `node tools/gear-arena-reward-study.mjs medium --validate` (omit --validate for first sweep; other curve IDs original/gentle/strong).
- `node tools/gear-arena-economy-recheck.mjs --targeted` (optional style/family arguments for batches; omit flag for moderate).
- `node tools/gear-arena-final-validation.mjs` (uses saved targeted trajectories).
Harness bodies executed with actual fetched pinned sources in isolated JS. CLI/CI not independently verified.

## Screening

| NPC curve | NG/F/E/D/C/B/A/S | S best at day180: original/moderate/steep rewards | Masterwork next-grade aggregate wins | Worst individual next-grade MW wins |
| --- | --- | --- | --- | --- |
| original | 10/24/42/62/82/104/124/144 | 0/15 / 0/15 / 0/15 | 1.13% | 9.38% |
| gentle | 10/24/42/60/78/98/116/132 | 6/15 / 9/15 / 10/15 | 2.74% | 15.63% |
| medium | 10/24/40/58/74/92/108/124 | 12/15 / 15/15 / 15/15 | 6.01% | 26.56% |
| strong | 10/23/38/54/70/86/102/116 | 15/15 / 15/15 / 15/15 | 12.20% | 59.38% |

Original prizes 12/20/32/48/68/92/122/158. Moderate 12/20/34/52/76/112/165/245. Steep 12/21/37/60/95/145/220/340. Reward increases alone fail original NPCs; strong curve permits some previous-grade Masterwork builds to win the next grade ~59%, against strong separation goal. Medium is preferable compromise.

Independent medium validation:
| Reward | Day30 own-best | Day90 own-best | Day150 own-best | Day180 own-best | Minimum day180 own/lower income ratio |
| --- | --- | --- | --- | --- | --- |
| original | 13/15 | 8/15 | 15/15 | 12/15 | 0.911× |
| targeted | 13/15 | 8/15 | 15/15 | 15/15 | 1.066× |
| moderate | 13/15 | 11/15 | 15/15 | 15/15 | 1.044× |
| steep | 13/15 | 13/15 | 15/15 | 15/15 | 1.087× |

Medium + targeted prizes (only S 158→185) preferred. On original 60 snapshots no profitable upward best; independent guard tests next-grade win aggregate Poor 2.08%, Masterwork 6.71%; two grades above ~0.06%/0.10%. Worst individual adjacent MW win 32.81%. No guard next/two grade earns more than own in sampled comparisons. Not a guarantee for arbitrary stats/skills or mixed gear. Targeted price adjustment leaves all other prizes alone and reduces inflation compared with moderate.

## Recommended candidate (pending owner approval)

| Grade | Original NPC stat | Candidate NPC stat (each STR/DEX/END before variation) | Original prize | Candidate prize |
| --- | --- | --- | --- | --- |
| NG | 10 | 10 | 12 | 12 |
| F | 24 | 24 | 20 | 20 |
| E | 42 | 40 | 32 | 32 |
| D | 62 | 58 | 48 | 48 |
| C | 82 | 74 | 68 | 68 |
| B | 104 | 92 | 92 | 92 |
| A | 124 | 108 | 122 | 122 |
| S | 144 | 124 | 158 | 185 |

## Recalculated economy: targeted candidate

| Build | Full S MW day | Fighting Lv | Total coins | Wallet | Weapon practice h | S win (128 new bouts) | S coins/h |
| --- | --- | --- | --- | --- | --- | --- | --- |
| greatsword/plate | 169 | 52 | 4,965,815 | 1,964,494 | 3,660 | 82.81% | 2,758 |
| hammer/padded | 169 | 52 | 5,356,268 | 2,354,947 | 3,660 | 95.31% | 3,174 |
| sword_shield/plate | 171 | 51 | 4,619,460 | 1,618,139 | 3,617 | 76.56% | 2,550 |
| bow/leather | 169 | 52 | 5,120,467 | 2,119,146 | 3,659 | 86.72% | 2,888 |
| greatsword/padded | 169 | 52 | 5,118,040 | 2,116,719 | 3,659 | 82.03% | 2,732 |
| greatsword/leather | 169 | 52 | 5,160,315 | 2,158,994 | 3,659 | 89.84% | 2,992 |
| hammer/plate | 170 | 52 | 4,786,234 | 1,784,913 | 3,636 | 84.38% | 2,810 |
| hammer/leather | 169 | 52 | 5,240,617 | 2,239,296 | 3,660 | 92.97% | 3,096 |
| bow/padded | 169 | 52 | 5,009,526 | 2,008,205 | 3,659 | 85.94% | 2,862 |
| bow/plate | 170 | 52 | 4,727,967 | 1,726,646 | 3,636 | 82.03% | 2,732 |
| spear/padded | 169 | 52 | 5,073,818 | 2,072,497 | 3,659 | 82.03% | 2,732 |
| spear/leather | 171 | 51 | 4,925,215 | 1,923,894 | 3,616 | 82.03% | 2,732 |
| spear/plate | 170 | 52 | 4,704,149 | 1,702,828 | 3,635 | 75.00% | 2,498 |
| sword_shield/padded | 169 | 52 | 5,324,212 | 2,322,891 | 3,660 | 92.19% | 3,070 |
| sword_shield/leather | 169 | 52 | 5,234,238 | 2,232,917 | 3,659 | 92.97% | 3,096 |

15/15 reach full S MW days 169–171. Wallet 1,618,139–2,354,947 coins (materially higher than previous candidate 70,493–1,254,815). No change in gear prices or gates. S access remains Lv50; accelerated combat raises productive time slightly. Moderate pilot (3 builds) day169–171 with wallets 2,796,169–3,732,278; targeted reduces excess but does not eliminate it. Do not automatically raise gear prices or create sinks; excess coins can fund another build later, which is not tested. Weapon hours 3,616–3,660, all below existing S mastery 4,000h; 3,500h suggestion remains unapproved.

## Final validation of new trajectories

| Day | Builds | Best same | Best lower | Best above | Own-grade win range |
| --- | --- | --- | --- | --- | --- |
| 30 | 15 | 4 | 11 | 0 | 43.75%–96.09% |
| 90 | 15 | 6 | 9 | 0 | 58.59%–89.84% |
| 150 | 15 | 15 | 0 | 0 | 89.84%–99.22% |
| 180 | 15 | 15 | 0 | 0 | 75.00%–95.31% |

All six-month builds prefer S; S win 75–95.31%, 2,498–3,174 coins/hour. Earlier recently upgraded gear often still profits more one grade down; desirable as transitional option, not guaranteed same-grade dominance at every stage. No best arena above gear in 60 snapshots.

Extreme mismatch: 96/120 overlevelled builds prefer arena above equipment grade (prior 79/120 on different sample size/seeds; not paired), 62/120 prefer ≥2 grades above (prior 59/120). Non-grade Masterwork + S benchmark stats wins S 3.07% (prior 0.8%, different seed set); nearly always loses but not literally impossible. Lower NPC stats improve regular viability while weakening strict gear-only separation. This is an explicit tradeoff, not a tested exploit from a fresh save. No hard lock proposed. If strict gear-only dominance across overlevelled builds is desired, separately test stat scaling or gear contribution, do not add an artificial grade lock. Further mixed-piece, asymmetric stat and final tactical counter testing needed. Recheck final economy if these change.

## Durable raw evidence

- [GEAR_ARENA_REWARD_ORIGINAL.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_ARENA_REWARD_ORIGINAL.json)
- [GEAR_ARENA_REWARD_GENTLE.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_ARENA_REWARD_GENTLE.json)
- [GEAR_ARENA_REWARD_MEDIUM.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_ARENA_REWARD_MEDIUM.json)
- [GEAR_ARENA_REWARD_STRONG.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_ARENA_REWARD_STRONG.json)
- [GEAR_ARENA_REWARD_VALIDATION.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_ARENA_REWARD_VALIDATION.json)
- [GEAR_ARENA_ECONOMY_BATCH_1.json](GEAR_ARENA_ECONOMY_BATCH_1.json)
- [GEAR_ARENA_ECONOMY_TARGETED_1.json](GEAR_ARENA_ECONOMY_TARGETED_1.json)
- [GEAR_ARENA_ECONOMY_TARGETED_2.json](GEAR_ARENA_ECONOMY_TARGETED_2.json)
- [GEAR_ARENA_ECONOMY_TARGETED_3.json](GEAR_ARENA_ECONOMY_TARGETED_3.json)
- [GEAR_ARENA_ECONOMY_TARGETED_4.json](GEAR_ARENA_ECONOMY_TARGETED_4.json)
- [GEAR_ARENA_FINAL_VALIDATION.json](GEAR_ARENA_FINAL_VALIDATION.json)

Next: final same-grade weapon/armour counter matrices including terrain; evaluate whether extreme mismatch tradeoff and excess currency acceptable, then owner decision on full balance candidate and implementation. CLI/CI pending; no main merge/deploy.
