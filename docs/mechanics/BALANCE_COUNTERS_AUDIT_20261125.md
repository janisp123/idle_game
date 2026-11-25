# BAL-AUDIT-001 — Current game playability, counters and environments

2026-11-25, chat. Owner requested an audit, not balance changes. Production baseline main `2eaa08866d711bc7f5cf876ab11779a292ab4b3c`; audited head `d3be32bfcb87cb50c84f75f9691df240e272a5a6`, [PR #164](https://github.com/janisp123/idle_game/pull/164), [systems run 45614599116](https://github.com/janisp123/idle_game/actions/runs/45614599116), job 139206610600, [protocol 45614599121](https://github.com/janisp123/idle_game/actions/runs/45614599121). Both succeeded; 14/14 systems tests, full build-progression and balance-audit reports completed. Temporary branch-only CI trigger because manual dispatch unavailable; removed before merge. No production code or balance changes. Full JSON reports are run artifacts (7-day retention); compact results below persist.

## Method and limits

Reused production-linked audit: 214,320 duels (same 24 fixed paired seeds, independent mirror sample, NPC, quality, expertise and adjacent-grade tests as A8), plus normal/alpha trajectories. 20 weapon/material builds at Non/D/S, same grade Common quality, trained, equal STR/DEX/END 10/62/150 and skill 1/17/50. Equal arena weighting is not actual encounter frequency. Matched-material weapon table pools padded/leather/plate and five arenas, 720 bouts/cell, both role orientations. Per-weapon pair/arena 144 bouts. Armour matrix pools all weapon pairs. NPC sample 192 bouts per build and grade. Draws count as neither win nor loss; rounding. Reproducibility with same seeds is not independent validation, or proof of all possible strategies. No new physical-device or public browser test; latest Pages browser smoke passed previously. No human fun/playtest claim.

## Verdict

Playable alpha, progression viable for tested armoured specializations; NOT healthy tactical rock-paper-scissors yet. S-grade Greatsword has no favourable overall matched-armour weapon matchup; Sword & Shield is excessively broadly effective; Spear vs Shield is severe; endgame Bow too effective in confined terrain; Plate too universally good and unarmoured lacks graded armour pieces. Existing terrain geometry creates real differences, but not all preference scores correspond to actual best results.

## Weapon matchups — equal armour, win percent row vs column

| Grade | Weapon | Bow | Spear | Shield | Greatsword | Hammer |
|---|---|---:|---:|---:|---:|---:|
| Non | Bow | 50 | 33.8 | 14.9 | 25.4 | 25 |
| Non | Spear | 65.7 | 49.6 | 9 | 46.3 | 32.4 |
| Non | Shield | 84.9 | 90.8 | 49.7 | 58.9 | 44 |
| Non | Greatsword | 74.3 | 53.3 | 41 | 49.7 | 48.1 |
| Non | Hammer | 75 | 67.6 | 56 | 51.9 | 50 |
| D | Bow | 50 | 60.6 | 35.3 | 61.4 | 63.2 |
| D | Spear | 39.4 | 50 | 5.8 | 63.1 | 35.7 |
| D | Shield | 64.7 | 94.2 | 50 | 71.3 | 44.2 |
| D | Greatsword | 38.6 | 36.7 | 28.6 | 50 | 50.1 |
| D | Hammer | 36.8 | 64.3 | 55.8 | 49.9 | 50 |
| S | Bow | 50 | 61.8 | 43.8 | 68.5 | 67.6 |
| S | Spear | 38.2 | 49.3 | 18.8 | 68.2 | 39.7 |
| S | Shield | 56.3 | 80.8 | 50 | 69.4 | 50.4 |
| S | Greatsword | 31.5 | 31.5 | 30.4 | 49.4 | 48.8 |
| S | Hammer | 32.4 | 60.3 | 49.6 | 51.3 | 50 |

## Terrain — all armoured builds, equal terrain weighting

Each row's terrain win percent pools all armoured opponents, including cross-material and mirrors, 2160 counted outcomes/cell. Reproduced historical A8 terrain values.

| Grade | Weapon | Field | Bridge | Ruins | Courtyard | Gatehouse |
|---|---|---:|---:|---:|---:|---:|
| Non | Bow | 36.90 | 38.33 | 23.61 | 24.86 | 34.58 |
| Non | Spear | 40.97 | 47.92 | 50.65 | 43.33 | 30.74 |
| Non | Shield | 55.88 | 59.44 | 64.58 | 59.54 | 70.00 |
| Non | Greatsword | 63.47 | 46.20 | 50.32 | 67.13 | 40.14 |
| Non | Hammer | 52.59 | 58.10 | 60.65 | 54.95 | 73.98 |
| D | Bow | 61.71 | 63.29 | 42.64 | 38.24 | 61.71 |
| D | Spear | 36.90 | 47.08 | 48.01 | 39.77 | 21.44 |
| D | Shield | 54.86 | 60.88 | 70.56 | 62.59 | 73.52 |
| D | Greatsword | 56.48 | 32.64 | 35.74 | 61.39 | 27.18 |
| D | Hammer | 40.05 | 46.11 | 52.96 | 48.01 | 65.97 |
| S | Bow | 61.99 | 63.98 | 49.31 | 46.67 | 64.31 |
| S | Spear | 40.56 | 49.63 | 52.22 | 45.79 | 25.00 |
| S | Shield | 57.69 | 61.53 | 63.52 | 57.13 | 73.38 |
| S | Greatsword | 52.73 | 30.51 | 37.18 | 57.92 | 23.56 |
| S | Hammer | 37.04 | 44.21 | 47.69 | 42.36 | 63.24 |

S matched-family examples: Bow vs Hammer Field 91%, Gatehouse 56.3%; Bow vs Spear Gatehouse 95.8%; Bow vs Greatsword Gatehouse 93.1%, Courtyard 36.8%; Spear vs Greatsword Bridge 90.3%; Greatsword vs Shield Courtyard 57.6%, Gatehouse 6.3%; Hammer vs Greatsword Gatehouse 86.1%, Field 27.1%. Thus terrain reverses some matchups genuinely. Configured dice preference is Field/Bow, Bridge/Spear, Ruins/Shield, Courtyard/Greatsword, Gatehouse/Hammer; selection algorithm has 64% preferred pool on non-tied high roll, otherwise uniform (ties uniform). Source inspection only for selector, not a fresh frequency experiment; preference != observed win-optimal arena. Bow/Spear/Shield best measured pooled arena differs from intended. Greatsword and Hammer fit intended terrain well.

## Armour

| Grade | Plate vs Padded | Plate vs Leather | Leather vs Padded |
|---|---:|---:|---:|
| Non | 82 | 80.6 | 51.4 |
| D | 71 | 71.8 | 50.3 |
| S | 63.7 | 62.7 | 51.5 |

S NPC wins by armour average: None 1.15%, Padded 63.44%, Leather 64.69%, Plate 71.98%. S Bow/Plate 82.29%, Bow/Leather 72.40%; S Spear/Leather 55.21%, Spear/Plate 59.90%. Every armoured S combination sampled exceeds 55% against same-grade NPCs, but synthetic equal-stat trained Common fixtures are not all real six-month progression trajectories. Unarmoured cannot buy four graded armour pieces; don't add artificial protection without owner decision.

## Economy and playability

Normal daily (no alpha controls), fixed tested builds:

| Build | Full S Masterwork day | Lifetime win % |
|---|---:|---:|
| Bow/Leather | 171 | 78.87 |
| Hammer/Plate | 168 | 85.34 |
| Greatsword/Padded | 172 | 68.85 |
| Greatsword/Plate income policy | 170 | 85.90 |
| Spear/Padded | 172 | 67.15 |
| Shield/Leather | 170 | 81.18 |
| Greatsword/Plate baseline | 170 | 80.56 |

Six distinct builds, seven strategies. Both selected tracks exceeded 4000 hours in six long audit trajectories. Normal weekly claim baseline: at day 180 Fighting 26, 97.90% wins, 2,318,707 wallet, no S purchase; mixed work baseline level 42, 91.82%, 2,135,619 wallet, no S. Normal rapid 15-minute claims across two seeds: level 20, no S purchase in month one. Alpha daily baseline first S day 73, full set day 123; mixed full set day 166; weekly no S; accelerated alpha != normal balance. S Poor unlock Fighting 50, price 340,000. Same grade Masterwork vs Common: Non 94.5%, D 85.17%, S 79.67%; F Poor vs Non Masterwork 41.67%, C Poor vs D Masterwork 70.67%, S Poor vs A Masterwork 75.58%. S fully trained vs both unfamiliar 100% (1200/1200); independent mirror player wins Non 49.36%, D 49%, S 50.17%. Skill Master claim frequency is a real progression bottleneck; confirm desired weekly-player pacing before changing.

## Recommendations — proposals, not approved changes

1. Tune Bow dagger separately: source `physical-duel.mjs` uses weapon piece scaling for backup dagger while bow kit intact; dagger is range 0, recovery 2 and no close-bow aim penalty. Test separate lower damage/penetration scaling and close-pressure opportunity, while preserving reliable fallback. Do not remove Bow viability; restore field as meaningful best terrain, gatehouse as weakness.
2. Make shield counterable by Hammer and reach/position pressure. Current shield blocks 40% of non-blunt attacks before proficiency; Bash counter and strong guard can suppress Spear. Check shield interaction with reach, guard recovery and existing blunt stagger, not arbitrary win rules. Target softer matchup bands rather than 94/6.
3. Restore Greatsword's favourable matchups in open terrain; do not erase confinement penalties. Test current recovery, parry and clearance with real damage traces. Spear reach should give a clear bridge advantage, not blanket dominance.
4. Make weight materially matter through existing mobility/approach/dodge; examine why Plate remains best for Bow. Padded vs Leather needs meaningful distinct tradeoffs; test light armour vs hammer/plate vs slash or piercing, not new unapproved stats. Keep grade separation and Masterwork unbreakability.
5. Re-run equal-grade pairwise matrix in Non/D/S, all arenas and novice/partial/trained, with independent seeds, actual NPC frequencies and all 15 armoured build trajectories. Provisional evaluation bands for owner review: every style at least one favourable and one unfavourable matched opponent/arena; avoid universal winner; intended home/away terrain advantage measurable (e.g. 10–20 percentage points), common equal-grade matchup ordinarily 30–70%, strong counters may extend beyond. Targets not fixed requirements. Measure six-month economy again, no automatic tuning or deployment without agreed scope.

No changes to game or saves. Next: Owner review of audit and approval of targeted physical-balance iteration.
