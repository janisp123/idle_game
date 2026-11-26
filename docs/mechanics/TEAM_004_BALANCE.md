# TEAM-004 — native team balance and six-month economy baseline

**Candidate only; no formula changes.** 2026-11-26, PR #188, branch feature/two-gladiators. Code head 2fdad95d, [audit run 45834609305](https://github.com/janisp123/idle_game/actions/runs/45834609305) all eight jobs PASS. [Compact numerical record](TEAM_004_BASELINE.json), including all seven trajectory checkpoints. Full 675-row matrix available as workflow artifact; reproducible from source.

## Reproduce
- `node tools/team-balance-audit.mjs` — fixed seed 20261126, 16 common seeds, five terrains, all 225 ordered weapon/material pairs per grade (0,3,7): 54,000 encounters. NPC compositions/stats from actual opponent generator, Common player equipment and full synthetic expertise; Non-grade NPC quality Poor. Additional 2,880 mirror, 5,760 Teamwork, 11,520 cross-grade bouts; total 74,160. Each pair/grade cell has only 80 samples; extreme ranks are exploratory and need independent-seed confirmation. Uniform terrain for comparisons, unlike actual biased arena dice. No copied damage formulas.
- `node tools/team-economy-audit.mjs <scenario>` — same seed, temporary isolated normal-timing copy of actual engine, no reward/price/formula overrides; manual Master claim when ready at visits, initial armour purchases and weak-first upgrades before unlock, automatic upgrades after. Last-millisecond live boundary acceleration mirrors earlier solo economy methodology, not identical stochastic XP to every real foreground tick. Mixed scenario five days Fighting, two Mining. 401,127 settled bouts, 1,106 fixed-offline-stage checks, wallet conservation and current-build save validity PASS. No starting money grant; no actual user data.

## Results

| Scenario | Visit every N days | Live min | Fighting | Teamwork | First S day | Gross coins | Spent | Win rate |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| tank_archer_long | 1 | 30 | 52 | 34 | 168 | 4,575,053 | 4,481,092 | 91.54% |
| dual_bow | 1 | 5 | 52 | 34 | 168 | 4,619,703 | 4,561,167 | 93.33% |
| dual_shield | 1 | 5 | 51 | 34 | 170 | 4,287,698 | 4,240,867 | 89.79% |
| weekly | 7 | 5 | 26 | 16 | — | 515,296 | 451,172 | 89.87% |
| mixed | 1 | 5 | 41 | 28 | — | 2,473,020 | 2,430,942 | 92.34% |
| tank_archer | 1 | 5 | 52 | 34 | 168 | 4,387,642 | 4,320,942 | 91.90% |
| hammer_spear | 1 | 5 | 52 | 35 | 165 | 4,822,150 | 4,721,317 | 92.75% |

No trajectory reaches both complete S Masterwork kits by day 180. All five daily pure-Fighting trajectories have all ten pieces at S Common/Fine by day 180; hammer+spear reaches highest actual S and remains at S in final snapshot; others end A after having defeated S. Daily automatic equipment unlock day 15, Teamwork level 34–35. Weekly ends mixed C Poor/D Masterwork, mixed activity ends A Common/Fine. These are single-seed trajectories and not player forecasts. Exact full-kit upgrade-only price 6,002,450 coins (plus initial armour purchase), and gross income 4.29–4.82m among daily pure Fighters. This is slower than the prior solo all-S-Masterwork target days 166–169. Do not silently double payouts: the two-fighter economy already makes a meaningful S-grade milestone within six months, and finishing Masterwork later might be acceptable. If six-month Masterwork is desired, test modest team purse scaling (e.g. +25% and +40%) using the same actual engine and additional seeds before committing numbers; earlier purchases change later win rates, so simple arithmetic is not sufficient.

Mean matched-benchmark NPC win rates across 225 ordered pairs: NG 68.07%, D 49.65%, S 50.48%. Strongest exploratory cells: NG spear/plate + greatsword/plate 90%; D spear/plate + hammer/plate 80%; S spear/plate + hammer/padded 75%. Weakest: NG dual shield/padded 32.5%, D greatsword/padded + greatsword/leather 17.5%, S dual shield/plate 25%. Do not interpret ranks as universal strategy: fixed shared seed/roster sample; changes of terrain and opponents matter.

Grade separation: S beats NG in 1,440/1,440 higher-side trials over stat 10/80/150, lower side wins zero. Adjacent F vs NG and S vs A are very strong (higher-side 97.29–99.58% over tested stat groups, trained common gear); adjacent grade gap is probably too harsh compared with prior solo balance. Mirror cells range 41.25–67.5% and reversing mixed roster order changes estimates by as much as 18.75 percentage points. Need larger independent-seed paired orientation sample and symmetric grid review before claiming fairness. Teamwork level 1→50 generally improves the selected named pair results, but some cells flat or worse (D dual shield 37.5→36.25%). D tank/archer 41.25→55%, S hammer/spear 46.25→62.5%. No universal damage multiplier or scripted winner.

## Browser and release status
Engine/browser candidate bbc1fe74 all four workflows PASS (website 45834356817, systems 45834356800, combat 45834356802, protocol 45834356736). Earlier browser run 45834210422 independently confirmed 117 Node regressions and real Chromium at 390/1440px. Team equipment and report assertions pass. Team audit jobs PASS on 2fdad95d; final website check for that head still in progress at audit collection. New fresh characters have two fighters; old V16 solo saves currently remain solo. Alpha max-stat tool still trains only first fighter. No merge/deployment. Next: confirm final-head browser status, then independent-seed mirror/adjacent grade and economy sensitivity research; choose final reward target and alpha save release policy. No mechanical retuning without evidence.
