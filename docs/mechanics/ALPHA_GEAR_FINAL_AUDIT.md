# ALPHA-GEAR-001 A6 — combined balance audit (2026-11-25)

**Verified audit, not final balance approval.** [Code head c4bfee9](https://github.com/janisp123/idle_game/commit/c4bfee98e56109cc2920c730f1f49a4ba5b97b61), [systems lab/audit 45562953978](https://github.com/janisp123/idle_game/actions/runs/45562953978), [website 45562954452](https://github.com/janisp123/idle_game/actions/runs/45562954452), [combat 45562953969](https://github.com/janisp123/idle_game/actions/runs/45562953969), [protocol 45562954028](https://github.com/janisp123/idle_game/actions/runs/45562954028): all passed. Full machine-readable report is the balance-audit artifact from that systems run; rerun `node tools/simulation/balance-audit.mjs` for reproducibility. No gameplay code changed in A6.

## Decision and priority

Do not deploy as final balanced gameplay. The grade gap, purchase gate, quality value, expertise curve and visual verdicts work in tested cases. However, weapon/armour differences can make one legitimate build much slower than another. Fix the core state issues first (A7), then tune physical style/material trade-offs with paired tests and rerun trajectories (A8). Keep current prices and expertise curve provisionally until those changes are measured. Owner must confirm any new policy (e.g. whether fully unarmoured S is intended to be viable) before inventing extra protection or new stats. Original two A5 illustrations are still not in Git; see OUTCOME_ART_HANDOFF.md.

## Methods

All 20 weapon/family builds, including none, at equal Non/D/S attributes and Fighting levels (10/1, 62/17, 150/50), Common quality, fully trained. Every unordered build pair including mirrors, five equally weighted arenas, 24 deterministic seeds from three seed groups, both role orientations: 151,200 actual duels. Orientation rows are raw player-side rates, paired build rows control role assignment. Actual arena NPC readiness: three fixed sessions, first 64 bouts each, 192 per build and grade (11,520 bouts). Same-grade quality 10,800 and expertise 18,000 paired duels. Total 191,520 audited duels beyond prior CI benchmark and trajectories. Quality/partial-expertise samples use eight seeds from first group; not statistical confidence intervals. No fake outcomes or alpha grants in progression. NPC coin/hour uses elapsed arena time, not just productive time.

## Same-grade results

Paired win % across all 20 build opponents; NPC win % against actual same-grade arena sessions. Including unarmoured reduces the average readiness of every style; do not read these as same-family mirror probabilities.

| Grade | Dimension | Style/family | Paired win % | NPC win % |
| --- | --- | --- | ---: | ---: |
| Non | style | bow | 37.41 | 52.73 |
| Non | style | spear | 45.8 | 54.56 |
| Non | style | sword_shield | 67.19 | 67.45 |
| Non | style | greatsword | 35.49 | 41.28 |
| Non | style | hammer | 63.85 | 71.48 |
| Non | family | none | 34.29 | 36.77 |
| Non | family | padded | 44.85 | 49.58 |
| Non | family | leather | 46.58 | 60.1 |
| Non | family | plate | 74.07 | 83.54 |
| D | style | bow | 53.85 | 37.24 |
| D | style | spear | 46.11 | 32.16 |
| D | style | sword_shield | 64.81 | 45.83 |
| D | style | greatsword | 32.93 | 16.28 |
| D | style | hammer | 52.16 | 37.37 |
| D | family | none | 20.76 | 4.69 |
| D | family | padded | 46.78 | 26.15 |
| D | family | leather | 54.58 | 38.02 |
| D | family | plate | 77.78 | 66.25 |
| S | style | bow | 55.77 | 51.69 |
| S | style | spear | 48.83 | 44.79 |
| S | style | sword_shield | 60.82 | 50.78 |
| S | style | greatsword | 33.97 | 23.44 |
| S | style | hammer | 50.46 | 45.31 |
| S | family | none | 14.55 | 2.81 |
| S | family | padded | 49.53 | 39.06 |
| S | family | leather | 56.43 | 51.56 |
| S | family | plate | 79.38 | 79.38 |

### All build combinations

| Grade | Weapon | Armour | Paired win % | NPC win % | NPC coins / elapsed hour |
| --- | --- | --- | ---: | ---: | ---: |
| Non | bow | none | 24.02 | 32.29 | 70 |
| Non | bow | padded | 30.58 | 42.19 | 91 |
| Non | bow | leather | 31.15 | 53.65 | 116 |
| Non | bow | plate | 63.88 | 82.81 | 179 |
| Non | spear | none | 31.23 | 34.9 | 75 |
| Non | spear | padded | 40.5 | 47.4 | 102 |
| Non | spear | leather | 41.56 | 54.69 | 118 |
| Non | spear | plate | 69.92 | 81.25 | 176 |
| Non | sword_shield | none | 51.15 | 46.35 | 100 |
| Non | sword_shield | padded | 63.85 | 62.5 | 135 |
| Non | sword_shield | leather | 65.88 | 70.83 | 153 |
| Non | sword_shield | plate | 87.88 | 90.1 | 195 |
| Non | greatsword | none | 20.17 | 21.88 | 47 |
| Non | greatsword | padded | 29.27 | 30.73 | 66 |
| Non | greatsword | leather | 32.92 | 41.67 | 90 |
| Non | greatsword | plate | 59.6 | 70.83 | 153 |
| Non | hammer | none | 44.9 | 48.44 | 105 |
| Non | hammer | padded | 60.04 | 65.1 | 141 |
| Non | hammer | leather | 61.4 | 79.69 | 172 |
| Non | hammer | plate | 89.08 | 92.71 | 200 |
| D | bow | none | 24.92 | 6.25 | 54 |
| D | bow | padded | 49.67 | 27.6 | 239 |
| D | bow | leather | 57.06 | 40.1 | 347 |
| D | bow | plate | 83.77 | 75 | 648 |
| D | spear | none | 19.94 | 5.21 | 45 |
| D | spear | padded | 43.42 | 25.52 | 221 |
| D | spear | leather | 49.4 | 38.54 | 333 |
| D | spear | plate | 71.71 | 59.38 | 513 |
| D | sword_shield | none | 30.42 | 6.25 | 54 |
| D | sword_shield | padded | 65.06 | 39.58 | 342 |
| D | sword_shield | leather | 73.92 | 54.69 | 473 |
| D | sword_shield | plate | 89.83 | 82.81 | 716 |
| D | greatsword | none | 11.5 | 0.52 | 5 |
| D | greatsword | padded | 28.46 | 10.42 | 90 |
| D | greatsword | leather | 34.65 | 16.67 | 144 |
| D | greatsword | plate | 57.13 | 37.5 | 324 |
| D | hammer | none | 17.02 | 5.21 | 45 |
| D | hammer | padded | 47.27 | 27.6 | 239 |
| D | hammer | leather | 57.9 | 40.1 | 347 |
| D | hammer | plate | 86.44 | 76.56 | 662 |
| S | bow | none | 17.42 | 4.17 | 119 |
| S | bow | padded | 55.33 | 51.56 | 1466 |
| S | bow | leather | 62.38 | 62.5 | 1778 |
| S | bow | plate | 87.94 | 88.54 | 2518 |
| S | spear | none | 14.1 | 4.17 | 119 |
| S | spear | padded | 49.65 | 46.88 | 1333 |
| S | spear | leather | 54.27 | 53.65 | 1526 |
| S | spear | plate | 77.31 | 74.48 | 2118 |
| S | sword_shield | none | 18 | 2.6 | 74 |
| S | sword_shield | padded | 62.48 | 48.44 | 1378 |
| S | sword_shield | leather | 72.17 | 64.06 | 1822 |
| S | sword_shield | plate | 90.65 | 88.02 | 2503 |
| S | greatsword | none | 11.83 | 0 | 0 |
| S | greatsword | padded | 31.65 | 12.5 | 356 |
| S | greatsword | leather | 36.54 | 27.6 | 785 |
| S | greatsword | plate | 55.88 | 53.65 | 1526 |
| S | hammer | none | 11.38 | 3.13 | 89 |
| S | hammer | padded | 48.56 | 35.94 | 1022 |
| S | hammer | leather | 56.79 | 50 | 1422 |
| S | hammer | plate | 85.1 | 92.19 | 2622 |

### Raw role orientation

| Grade | Identical build player win % | Mirror draw % | Mixed build raw player win % |
| --- | ---: | ---: | ---: |
| Non | 56.63 | 0.96 | 51.29 |
| D | 55.33 | 0.63 | 51.24 |
| S | 54.54 | 0.92 | 50.96 |

**Interpretation:** Identical-build raw player wins 54.54–56.63%, even with three seed groups, whereas cross-build raw player win 50.96–51.29%. Do not assume the whole discrepancy is role bias: source uses sequential RNG and >= initiative ties; investigate random-draw ordering and finite-seed sensitivity with an expanded independent mirror sample. Paired comparisons remove orientation from build ranking. At S, Greatsword 33.97% vs Sword & Shield 60.82%; Plate 79.38% vs Padded 49.53%, Leather 56.43%, None 14.55%. Against S NPCs, Greatsword/Padded 12.5% vs Hammer/Plate 92.19%. Plate is currently strongest across all styles. Source: armourStats reports evasionScore/dodgeMargin/initiativePenalty, but resolver uses mobility chiefly for initiative and bow retreat, with only grade-based dodge reducing aim; the lighter families do not realize their advertised trade-off. Greatsword swing recovery, clearance penalties and current parry opportunities merit isolated tuning. Do not flatten all styles or erase terrain/material counters. Unarmoured does not own four graded pieces; its low performance is not evidence that it deserves artificial armour.

## Same-grade quality

| Grade | Quality vs Common | Win % (paired) |
| --- | --- | ---: |
| Non | poor | 25.92 |
| Non | fine | 77.92 |
| Non | masterwork | 93.5 |
| D | poor | 40.83 |
| D | fine | 67.42 |
| D | masterwork | 80.5 |
| S | poor | 41.33 |
| S | fine | 62.67 |
| S | masterwork | 76.92 |

Quality has measurable value. Non-grade Masterwork beats Common 93.5% (cheap initial upgrade is potentially too dominant), S Masterwork 76.92%. Preserve unbreakable property; check adjacent-grade cross-quality effects and early quality price/power before modifying. Do not compare prices using only Masterwork endgame.

## Expertise — fully trained versus partially trained S Masterwork

| Opponent hours | Weapon unfamiliar | Armour unfamiliar | Both unfamiliar |
| ---: | ---: | ---: | ---: |
| 0 | 99% | 93.58% | 99.83% |
| 1000 | 96.58% | 88.92% | 99.33% |
| 2000 | 88.67% | 80.75% | 96.58% |
| 3000 | 73.42% | 67.42% | 85.17% |
| 4000 | 49.75% | 49.75% | 49.75% |

At 4,000h paired control is 49.75% each with 0.5% double deaths. At zero weapon hours specialist wins 99%, zero armour 93.58%, both zero 99.83%. Smooth intermediate improvement; 3,000h weapon novice wins ~26.6%. This strongly supports the approved specialization goal. Keep curve for now; remeasure after physical balancing. Exact matched S expert vs novice is not a grade mismatch.

## Economy and first-month rush

15-minute visits (no shortcuts), starter-rush skips lower purchases and fights Non-grade; income strategy buys successive common gear, checks all tiers once per day using 24 independent fixture bouts, then chooses largest expected prize/hour. This is a plausible aggressive policy, not an oracle or proven maximum. All progression and purchases still use real engine. Alternative 180-day normal builds use daily visits. 'Affordable' means coins only for the remaining upgrade at that visit, independent of Fighting gate. First Any S includes any purchased piece; full MW means all five items.

| Profile | Scenario | Seed | Days | End Fighting | End STR/DEX/END | First any S affordable day | First any S bought day | Full S MW day | Win % | Earned | Spent | Wallet | Weapon |
| --- | --- | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| normal | rapid-income | 20261125 | 30 | 20 | 66/65/61 | — | — | — | 89.81 | 287716 | 120321 | 167395 | D/common |
| normal | rapid-starter-rush | 20261125 | 30 | 20 | 66/65/61 | — | — | — | 94.61 | 147060 | 0 | 147060 | Non/poor |
| alpha | rapid-income | 20261125 | 30 | 270 | 153/153/136 | — | — | — | 92.05 | 760088 | 705321 | 54767 | A/common |
| alpha | rapid-starter-rush | 20261125 | 30 | 271 | 154/153/136 | — | — | — | 99.14 | 153372 | 0 | 153372 | Non/poor |
| normal | rapid-income | 20261126 | 30 | 20 | 66/65/61 | — | — | — | 89.64 | 287420 | 120321 | 167099 | D/common |
| normal | rapid-starter-rush | 20261126 | 30 | 20 | 66/65/61 | — | — | — | 94.84 | 147408 | 0 | 147408 | Non/poor |
| normal | bow-leather | 20261126 | 180 | 51 | 148/147/136 | 46 | 171 | 171 | 73.92 | 4526606 | 3001321 | 1525285 | S/masterwork |
| normal | hammer-plate | 20261126 | 180 | 52 | 150/150/137 | 40 | 166 | 166 | 92.97 | 6017968 | 3001321 | 3016647 | S/masterwork |
| normal | greatsword-padded | 20261126 | 180 | 51 | 146/145/134 | 82 | 175 | — | 36.63 | 1996288 | 1825321 | 170967 | S/common |
| normal | greatsword-plate-income | 20261126 | 180 | 52 | 150/150/137 | 46 | 167 | 167 | 93.25 | 4937226 | 3001321 | 1935905 | S/masterwork |

**Findings:** Both tested normal 15-minute strategies and two seeds reach Fighting 20, no S affordability or purchase in 30 days. Alpha income ends Fighting 270 and A Common, no S under this policy; accelerated alpha is intentionally different and no universal alpha restriction claimed. Current normal independent XP bound: 2,160 uninterrupted 20-minute cycles in 30 days × 7 XP (maximum efficiency, variation and upward rounding per cycle) = at most 15,120 Fighting XP, far below 49,000 needed for level 50. This conservative source-backed bound, also covered by engine regression, excludes legitimate first-month normal S purchases even with more frequent claims; does not prove nobody could hold 340,000 coins under every imaginable strategy. Perfect Non-grade 30-day reward 155,520 vs cheapest base S 340,000, while perfect S reward upper bound 2,047,680 (not plausible from fresh). Normal six-month Bow/Leather full S MW day 171 and Hammer/Plate day 166; Greatsword/Padded S Common at day 180, no full MW, despite 4,046/4,024 hours trained. Greatsword/Plate income policy full MW day 167, 93.25% cumulative wins; old fixed progression day 170 and 64.66% reflects strategy as well as build. Hammer/Plate earns ~6.02m with ~3.02m spare vs Greatsword/Padded ~2.00m earned and 170,967 spare. Fix physical balance before touching prices: otherwise expensive builds become even less viable. No mathematically optimal coin strategy established.

## Source review — two state issues before tuning

1. **Frozen attributes remain stale beyond return:** engine.mjs settleWork creates STR/DEX/END from frozen effort only when combatSession is null. enterGame activates expertise but not attributes; settleExpertiseArena refreshes only condition and flat gear fields at next boundary. If no Master claim/purchase/style/difficulty change invalidates the session, a returning player can see improved character stats without using them in fights. This violates intended return activation, and distorts long-absence progression. A7 should add explicit earned/active or equivalent bounded return snapshot for attributes, preserving old completed prizes and unfinished bout, applying new attributes at the next valid bout boundary and preserving offline split/reload equivalence. Test no-Master return, repeated return, live vs absent, one/three wagons, twenty years. Do not recalculate previous outcomes. No empirical reproduction added in this audit; source path confirms the stale field behavior.
2. **Restart-before-recovery loophole:** setCombatLoadout, setDifficulty, buyEquipment and Master claim settle existing work then can discard combatSession before its bout completes. Expertise is protected by completed-bout-only award, but attribute and Fighting time credit accrue from productiveMs in settleWork even when the player abandons just before resurrection; no remaining loss recovery is enforced after discard. This can avoid death time and repeat a favorable encounter search. No evidence of duplicated wallet prizes; existing completed-prize cursor remains sound. A7 should explicitly finish/settle or carry unresolved loss recovery at a real boundary before applying a new kit/difficulty, avoiding a restart loop, while preserving earned legitimate progress, UI responsiveness, immediate equipment editing semantics where possible and bounded offline processing. Test repeated switches, loss near recovery, Master and purchase interactions, transition finishing wagons and reload. Decide how to handle uncompleted actual fighting time without removing legitimate progress; do not add a surprise penalty or cooldown unsupported by approved design. This is a source-derived loophole, not a measured exploit yield.

## Next acceptance sequence

A7: reproduce and fix snapshot/restart issues in one coherent engine batch with focused and full checks; document exact policy and preserve offline bounds. A8: candidate balancing: meaningful mobility/dodge vs plate, Greatsword handling/guard, quality vs adjacent grade, mirror side RNG investigation. Use paired same-family/armoured-only and terrain-conditional results; aim for viable choices, not forced 50% in every pairing. Require no loss of existing grade separation, meaningful expertise, no S purchase month one and representative 180-day specialist progression across different weapons/families. Re-evaluate prices after A8. A5 original art transfer still open. Final code-head checks, real 390px/1440px browser verification, removal of branch-only CI reporting or explicit manual workflow, correct changelog/checkpoint and release checks before merge. No release/deployment approved by this audit.


## A7 verified engine correction retest

[Code head 81d0c5c](https://github.com/janisp123/idle_game/commit/81d0c5c941efeab7a37c3e2fa91344e8e28834b3), [systems audit 45563621103](https://github.com/janisp123/idle_game/actions/runs/45563621103), website 45563620845, combat 45563620958, protocol 45563621023 all passed. No combat balance constants changed, so paired physical/quality/expertise matrix unchanged. Arena progression changes because active attributes now apply at actual returns and kit/grade edits no longer discard a bout. First-month normal S purchase remains blocked in both tested strategies/two seeds. The original A6 source issues have dedicated passing regression tests. A8 must still tune physical tradeoffs.

| Profile | Scenario | Seed | Days | Fighting | First any S | Full S MW | Win % | Earned | Wallet |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| normal | rapid-income | 20261125 | 30 | 20 | — | — | 90.9 | 291420 | 171099 |
| normal | rapid-starter-rush | 20261125 | 30 | 20 | — | — | 95.13 | 147936 | 147936 |
| alpha | rapid-income | 20261125 | 30 | 270 | — | — | 93.12 | 775650 | 70329 |
| alpha | rapid-starter-rush | 20261125 | 30 | 271 | — | — | 99.13 | 154152 | 154152 |
| normal | rapid-income | 20261126 | 30 | 20 | — | — | 90.92 | 291472 | 171151 |
| normal | rapid-starter-rush | 20261126 | 30 | 20 | — | — | 95.14 | 147948 | 147948 |
| normal | bow-leather | 20261126 | 180 | 51 | 171 | 171 | 74.24 | 4554500 | 1553179 |
| normal | hammer-plate | 20261126 | 180 | 52 | 166 | 166 | 93.21 | 6022702 | 3021381 |
| normal | greatsword-padded | 20261126 | 180 | 51 | 175 | — | 36.63 | 1981582 | 156261 |
| normal | greatsword-plate-income | 20261126 | 180 | 52 | 167 | 167 | 93.4 | 4945860 | 1944539 |
