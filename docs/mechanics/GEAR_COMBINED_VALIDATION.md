# GEAR-RESEARCH-001 — Combined validation and final research handoff

2026-11-25. Research only; pinned source baseline 01362378d8aefcec3aa1fa4bb73116d9457237c3. No live gameplay, save or deployment edits. Candidate includes cumulative expertise/grade perks, quality power 0/1/2/3, grade factor 1.35, durability 24+3g+12q, unbreakable Masterwork, strictly sequential full-credit purchases, NPC stat curve 10/24/40/58/74/92/108/124, S prize185 only, and balanced tactical variant (scaled Greatsword handling/parry, Hammer power16, dagger gradeScale.80, plate resistance1.15). Earlier reports provide exact formulas. Existing 4000h S mastery unchanged.

## Economy: all 15 builds
Complete prior pilot plus 11 new trajectories; same daily manual claim/shop policy, fixed gear/stat/skill arena choice, normal profile and seed20261201 as earlier study. 998,146 settled bouts across 15 trajectories (repeating bounded schedule, not independent duel executions). 4 previous pilots reused, not newly counted. Wallet conservation and quote/debit checks in existing harness. All reach full S MW days 169–171. This is gear ownership, not full S mastery. No automatic grade purchase proposed.
| Build | S MW day | Lv | Day180 wallet | Weapon h |
| --- | --- | --- | --- | --- |
| greatsword/plate | 169 | 52 | 2,249,731 | 3,660 |
| hammer/padded | 169 | 52 | 2,317,740 | 3,660 |
| sword_shield/plate | 171 | 51 | 1,694,963 | 3,616 |
| bow/leather | 169 | 52 | 2,104,811 | 3,659 |
| greatsword/padded | 169 | 52 | 2,242,695 | 3,659 |
| greatsword/leather | 169 | 52 | 2,260,725 | 3,659 |
| hammer/plate | 170 | 52 | 1,859,567 | 3,637 |
| hammer/leather | 169 | 52 | 2,193,017 | 3,660 |
| bow/padded | 169 | 52 | 1,980,157 | 3,659 |
| bow/plate | 170 | 52 | 1,893,485 | 3,636 |
| spear/padded | 170 | 52 | 1,935,509 | 3,638 |
| spear/leather | 171 | 51 | 1,871,489 | 3,616 |
| spear/plate | 170 | 52 | 1,824,656 | 3,635 |
| sword_shield/padded | 169 | 52 | 2,201,896 | 3,660 |
| sword_shield/leather | 169 | 52 | 2,141,927 | 3,659 |

## Independent arena holdout
60 actual recalculated synthetic milestone snapshots and 120 extreme stat/gear mismatches, all eight arenas, 128 bouts/cell using four new session seeds 18737193,29382110,38193301,49172812. Actual NPC generation and arena selection. 184,320 duels. Coin/hour is continuous available fighting time, not daily calendar income.
| Day | Builds | Best same grade | Best lower | Best above | Own grade win range |
| --- | --- | --- | --- | --- | --- |
| 30 | 15 | 2 | 13 | 0 | 32.81%–97.66% |
| 90 | 15 | 7 | 8 | 0 | 62.50%–85.94% |
| 150 | 15 | 15 | 0 | 0 | 87.50%–98.44% |
| 180 | 15 | 15 | 0 | 0 | 77.34%–92.97% |
All day180 builds prefer S; wins 77.34–92.97%, income 2,576–3,096 coins/hour. Overlevelled stress: 94/120 prefer higher grade, 61/120 at least two grades higher; NG MW with S stats wins S 1.41%. No universal gear-only separation claim. Extreme low gear can still farm intermediate arenas. Keep open access unless Owner explicitly changes direction.

## Mixed equipment
288,000 duels across 630 combinations (7 grades ×15 build templates ×6 profiles), each against own, prior and up to two higher arenas with four session seeds 139412,75933291,290187822,398118173. Target grade attributes use original benchmark; gear at target Poor or prior Masterwork, expertise at previous grade threshold. Mixed families head padded/torso leather/arms plate/legs template, each family practice divided by three (synthetic stress, not exact slot-time trajectory). Weapon/armour ahead and one/two lagging pieces cover common transitional shapes, not all possible 81 family layouts or independent attribute vectors.
| Profile | Build/grade combinations | Target win | Next higher win | Best above highest | Best above minimum |
| --- | --- | --- | --- | --- | --- |
| uniformPrior | 105 | 55.21% | 2.48% | 0 | 0 |
| mixedFamilies | 105 | 45.28% | 1.96% | 0 | 0 |
| weaponAhead | 105 | 48.30% | 2.17% | 0 | 15 |
| armourAhead | 105 | 46.89% | 1.81% | 0 | 9 |
| oneSlotBehind | 105 | 54.40% | 2.41% | 0 | 19 |
| twoSlotsBehind | 105 | 52.31% | 2.31% | 0 | 19 |
No sampled case prefers an arena above its highest equipped grade. Some prefer an arena above their lowest piece, as intended for mixed upgrade paths. No hard minimum-grade lock.

## Mechanic-level verification and required correction
Candidate recovery skip was applied AFTER attack recovery assignment, so it is not overwritten. Instrumented attack paths verify every skip removes one recovery turn, never from broken pieces or NG. First 5,400 parity cases used closely spaced arithmetic seeds and overestimated rates; repeated 28,800 cases with 64 LCG seeds starting 931876234. Same complete event output for original, safe fallback and instrumented resolver in all 34,200 fully specified parity cases (three executions per case). Repeated 900 identical legacy fixture cases (not independent). 2,496 capacity/finite checks across 480 weapon and 1920 armour stage instances plus shields, all pass; no MW break observed in either stress sweep. 
| Grade | Quality | Eligible attacks | Broken-piece attacks | Recovery skips | Observed rate |
| --- | --- | --- | --- | --- | --- |
| 0 | poor | 92,549 | 5,421 | 0 | 0.00% |
| 0 | masterwork | 98,332 | 0 | 0 | 0.00% |
| 3 | poor | 96,650 | 1,191 | 5,801 | 6.00% |
| 3 | masterwork | 98,735 | 0 | 5,936 | 6.01% |
| 7 | poor | 94,591 | 83 | 13,304 | 14.06% |
| 7 | masterwork | 95,246 | 0 | 13,388 | 14.06% |
Missing legacy damageMultiplier in Greatsword parry expression leads to NaN and disables parrying. Neutral finite valid-input fallback: clamp(((damageMultiplier??1)−1)/5,0,1). 816/900 legacy event traces changed after correcting missing multiplier; ordinary full profiles identical. Implement this fallback as part of candidate, with validation rejecting nonfinite/invalid supplied multipliers; not a change in normal balance. Existing snapshot validation must be extended for speed/crit/critResist/critReduction and shared stat calculation must use effective modifiers, not raw itemPower/gearFactor. Do not treat this as tested runtime integration. An initial instrumentation script failed from nested JS template interpolation before executing; corrected and reran. No results fabricated.

## Decision
Normal progression, same-grade S profitability, mixed gear and recovery behavior supported; final tactical balance supported by earlier grade-transition checks. Combined holdout + mixed = 472,320 direct duels, plus mechanic parity executions described separately. Remaining explicit tradeoffs: endgame wallets 1,694,963–2,317,740 coins; expertise 3,616–3,660 hours, none reaches 4000h; overlevelled characters can skip intermediate grades. Bow remains terrain-dependent and NG armour balance asymmetric. Do not add a new currency sink, class, grade lock, or mastery threshold without approval. Recommend owner review of full candidate, then implement and run actual repository regression/CI, including source breakdown, frozen snapshots, speed/crit bounds, purchase UI, automatic upgrades only within owned grade, and parity of production/test engine. Standalone Node CLI and CI remain unverified; all harness bodies executed in isolated JS with pinned source. Research is ready for owner decision, not approved or deployed.

## Reproduction
- node tools/gear-tactical-economy-recheck.mjs --targeted (optional style/family args; run batches)
- node tools/gear-combined-arena-validation.mjs
- node tools/gear-combined-mixed-validation.mjs
- node tools/gear-combined-mechanics-validation.mjs
- node tools/gear-combined-mechanics-holdout.mjs

Raw results:
- [GEAR_TACTICAL_ECONOMY_1.json](GEAR_TACTICAL_ECONOMY_1.json)
- [GEAR_TACTICAL_ECONOMY_2.json](GEAR_TACTICAL_ECONOMY_2.json)
- [GEAR_TACTICAL_ECONOMY_3.json](GEAR_TACTICAL_ECONOMY_3.json)
- [GEAR_TACTICAL_ECONOMY_4.json](GEAR_TACTICAL_ECONOMY_4.json)
- [GEAR_COMBINED_ARENA_VALIDATION.json](GEAR_COMBINED_ARENA_VALIDATION.json)
- [GEAR_COMBINED_MIXED_VALIDATION.json](GEAR_COMBINED_MIXED_VALIDATION.json)
- [GEAR_COMBINED_MECHANICS_VALIDATION.json](GEAR_COMBINED_MECHANICS_VALIDATION.json)
- [GEAR_COMBINED_MECHANICS_HOLDOUT.json](GEAR_COMBINED_MECHANICS_HOLDOUT.json)
