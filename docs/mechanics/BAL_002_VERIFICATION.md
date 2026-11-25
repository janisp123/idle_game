# BAL-002 — Tactical balance verification (2026-11-25)

Owner approved physical counters and material/terrain tradeoffs. Production code candidate 4 `90fd330`, full test head `0db45d7a7210a35b53253b9fea24a9578c13d9f6`, [PR #165](https://github.com/janisp123/idle_game/pull/165), [full systems audit 45618540299](https://github.com/janisp123/idle_game/actions/runs/45618540299), job 139220212247. Full audit passed. Candidate 4 website regression initially failed on a stale V15 browser assertion, subsequently corrected to V16 and real Chromium passed at head 17161f2, [website 45618793276](https://github.com/janisp123/idle_game/actions/runs/45618793276), systems 45618793320, protocol 45618793321, combat 45618793322. Final merge/deploy gates separate.

## Scope and methodology

Original audit: 214,320 duels plus progression; independent tactical validation 152,640 duel executions (3 grades × [28,800 matched-material weapon duels + 19,200 same-weapon armour comparisons + 2,880 NPC encounters]), separate seed 20261201 with 64 paired seeds/cell per arena/family. Some mirrored scenarios overlap by design; do not interpret as independent samples. Combined 366,960 audit duel executions, excluding dedicated benchmark and trajectory bouts. Common quality, fully trained, matched stats/skill 10/1, 62/17, 150/50 for Non/D/S. Equal arena weights, not live dice-weighted frequencies. Draws are not wins. No real-player playtest or proof of every future mixed build.

Four tuning candidates: 1 overshot dagger weakness and greatsword strength, shield still dominant; all 15 daily builds reached S MW days 169–177 but three site tests failed. Candidate 2 restored ranged impact and hammer guard pressure; spear still lost heavily to shield; field geometry required spear preference correction. Candidate 3 improved spear reach (S vs Greatsword 67%, vs Shield 29.2%) but Bow lacked favourable overall matches. Candidate 4 boosts ranged impact only, retains weak close shots/dagger; every style has at least one greater-than-50% and one less-than-50% non-mirror overall matchup at each tested grade. Advantages vary by arena and armour; not all have a strong 60/40 overall counter. No scripted winners.

## Weapon matrix — same material, row win %

### Non

| Weapon | Bow | Spear | Sword & Shield | Greatsword | Hammer |
| --- | --- | --- | --- | --- | --- |
| Bow | 49.4 | 51.7 | 30.2 | 45.1 | 34.7 |
| Spear | 47.9 | 49.3 | 53.6 | 57.1 | 56 |
| Sword & Shield | 69.4 | 46.1 | 49.3 | 37.6 | 27.7 |
| Greatsword | 54.4 | 42.6 | 61.9 | 49.6 | 60.9 |
| Hammer | 65.2 | 44 | 72.3 | 39.1 | 49.9 |

### D

| Weapon | Bow | Spear | Sword & Shield | Greatsword | Hammer |
| --- | --- | --- | --- | --- | --- |
| Bow | 49.7 | 53.9 | 27.8 | 44.9 | 46 |
| Spear | 46.1 | 49.1 | 35.9 | 68.9 | 57.2 |
| Sword & Shield | 72.2 | 64 | 49.8 | 52.2 | 50.5 |
| Greatsword | 54.7 | 30.9 | 47.4 | 49.5 | 62.1 |
| Hammer | 53.8 | 42.7 | 49.5 | 37.6 | 47.2 |

### S

| Weapon | Bow | Spear | Sword & Shield | Greatsword | Hammer |
| --- | --- | --- | --- | --- | --- |
| Bow | 49.8 | 54.4 | 26.6 | 50.2 | 45.2 |
| Spear | 45.4 | 48.9 | 29.2 | 67 | 51.9 |
| Sword & Shield | 73.3 | 70.7 | 49.8 | 57.6 | 43 |
| Greatsword | 49.7 | 33 | 42.1 | 49 | 55.3 |
| Hammer | 54.8 | 48.1 | 57 | 44.5 | 47.6 |

## Arena performance — same material, row win %

### Non

| Weapon | Field | Bridge | Ruins | Courtyard | Gatehouse |
| --- | --- | --- | --- | --- | --- |
| Bow | 82.1 | 58.8 | 21 | 23.3 | 25.9 |
| Spear | 51.8 | 62.3 | 66.1 | 57.3 | 26.4 |
| Sword & Shield | 23 | 36.8 | 53.2 | 44.9 | 72.2 |
| Greatsword | 60.1 | 45.5 | 49.6 | 69.6 | 44.5 |
| Hammer | 32.6 | 45.8 | 59.4 | 54.5 | 78.1 |

### D

| Weapon | Field | Bridge | Ruins | Courtyard | Gatehouse |
| --- | --- | --- | --- | --- | --- |
| Bow | 76.9 | 55.5 | 25 | 23.1 | 41.9 |
| Spear | 53.8 | 62.5 | 64 | 57.4 | 19.7 |
| Sword & Shield | 35.5 | 51.1 | 67.3 | 55.8 | 78.9 |
| Greatsword | 54.5 | 41.8 | 44.1 | 67.6 | 36.6 |
| Hammer | 28.4 | 38 | 48.6 | 45.6 | 70.2 |

### S

| Weapon | Field | Bridge | Ruins | Courtyard | Gatehouse |
| --- | --- | --- | --- | --- | --- |
| Bow | 74.5 | 55.9 | 27.7 | 24.5 | 43.5 |
| Spear | 48.6 | 59.9 | 60.8 | 52.8 | 20.2 |
| Sword & Shield | 35.4 | 54.5 | 69.5 | 56.8 | 78.2 |
| Greatsword | 58 | 32.8 | 38.6 | 67.4 | 32.2 |
| Hammer | 32.8 | 45.6 | 52.4 | 47.9 | 73.3 |

Bow Field 74.5% vs Courtyard 24.5% at S. Spear Bridge 59.9% vs Gatehouse 20.2%; Ruins slightly better at 60.8%. Greatsword Court 67.4% vs Gatehouse 32.2%; Hammer Gatehouse 73.3% vs Field 32.8%. Shield Ruins 69.5%, Gatehouse 78.2%, Field 35.4%; both tight arenas useful, not sole owner of Ruins. Intended preference dice remain fallible and actual geometry-based, with existing terrain contrast test passed. Remaining concern: shield vs Bow/Spear at S 73.3/70.7%; Bow only modest positive overall vs Spear, Greatsword vs Hammer only 55.3%. Keep under observation rather than claiming perfect competitive balance.

## Material matchups — same weapon, row win %

### Non

| Material | Padded | Leather | Plate |
| --- | --- | --- | --- |
| Padded | 49.7 | 42.3 | 37 |
| Leather | 57.4 | 49.8 | 45.8 |
| Plate | 62.3 | 53.4 | 49.1 |

### D

| Material | Padded | Leather | Plate |
| --- | --- | --- | --- |
| Padded | 48.9 | 52.7 | 49.6 |
| Leather | 47.2 | 48.8 | 53 |
| Plate | 50 | 46.6 | 49.5 |

### S

| Material | Padded | Leather | Plate |
| --- | --- | --- | --- |
| Padded | 48.8 | 41 | 48.6 |
| Leather | 58.9 | 48.6 | 60 |
| Plate | 51.4 | 39.9 | 49.7 |

S-specific armour matrices (same weapon):

**Bow**

| Material | Padded | Leather | Plate |
| --- | --- | --- | --- |
| Padded | 50 | 42.2 | 47.3 |
| Leather | 57.7 | 49.8 | 63.3 |
| Plate | 52.7 | 36.6 | 49.5 |

**Spear**

| Material | Padded | Leather | Plate |
| --- | --- | --- | --- |
| Padded | 48.6 | 45 | 53.9 |
| Leather | 54.8 | 48.4 | 74.1 |
| Plate | 46.1 | 25.9 | 49.7 |

**Sword & Shield**

| Material | Padded | Leather | Plate |
| --- | --- | --- | --- |
| Padded | 49.8 | 28.3 | 42 |
| Leather | 71.4 | 49.5 | 59.7 |
| Plate | 58 | 40.3 | 50 |

**Greatsword**

| Material | Padded | Leather | Plate |
| --- | --- | --- | --- |
| Padded | 49.1 | 34.1 | 21.6 |
| Leather | 65.9 | 48.8 | 30.9 |
| Plate | 78.4 | 68.8 | 49.1 |

**Hammer**

| Material | Padded | Leather | Plate |
| --- | --- | --- | --- |
| Padded | 46.3 | 55.3 | 78 |
| Leather | 44.7 | 46.6 | 72.2 |
| Plate | 22 | 27.8 | 50 |

## Cross-material, cross-weapon S audit (original seed group)

| Build | Bow | Spear | Sword & Shield | Greatsword | Hammer |
| --- | --- | --- | --- | --- | --- |
| bow/padded | 47.4 | 60.8 | 29.4 | 56.3 | 54.9 |
| bow/leather | 46.3 | 64.4 | 31.3 | 61 | 34 |
| bow/plate | 56.3 | 53.9 | 25.3 | 65.1 | 16.8 |
| spear/padded | 35.3 | 45.8 | 43.9 | 60.4 | 58.9 |
| spear/leather | 45.7 | 52.9 | 49.9 | 73.1 | 47.1 |
| spear/plate | 39.6 | 50.7 | 37.8 | 78.6 | 30.6 |
| sword_shield/padded | 72.6 | 62.5 | 35.8 | 50.4 | 77.2 |
| sword_shield/leather | 77.6 | 71 | 52.1 | 65.6 | 47.9 |
| sword_shield/plate | 63.6 | 35 | 62.1 | 60.3 | 7.4 |
| greatsword/padded | 36.5 | 28.2 | 36.4 | 39.4 | 65.4 |
| greatsword/leather | 46.1 | 35.1 | 44.2 | 50.3 | 50.8 |
| greatsword/plate | 34.4 | 24.4 | 43.2 | 59.3 | 19.3 |
| hammer/padded | 67.9 | 67.4 | 51.8 | 51.7 | 73.2 |
| hammer/leather | 71.7 | 64.2 | 54.6 | 55.7 | 55.3 |
| hammer/plate | 53.9 | 31.9 | 61.1 | 57.1 | 21 |

| Material | Bow | Spear | Sword & Shield | Greatsword | Hammer |
| --- | --- | --- | --- | --- | --- |
| padded | 51.9 | 52.9 | 39.5 | 51.6 | 65.9 |
| leather | 57.5 | 57.5 | 46.4 | 61.1 | 47 |
| plate | 49.6 | 39.2 | 45.9 | 64.1 | 19 |

Padded against hammer users 65.9%, Leather 47%, Plate 19%; Plate against Greatsword 64.1%, Padded 51.6%. Same-weapon S Hammer/Padded beats Hammer/Plate 78%, but Greatsword/Plate beats Greatsword/Padded 78.4%. Same-weapon S Spear/Leather beats Spear/Plate 74.1%. All families have real strengths and vulnerabilities. Leather still broadly strong at S; early Plate still wins 62.3% vs Padded in same-weapon aggregate. Some extreme specific combos remain: Shield/Plate vs Hammer (all materials) 7.4%. No universal winning build demonstrated; exhaustive optimal-strategy proof not claimed. Unarmoured remains an intentional ungraded equipment gap pending owner decision.

## All 15 normal daily-play build trajectories

| Build | Full S MW day | Fighting Lv | Lifetime win % | Wallet day 180 |
| --- | --- | --- | --- | --- |
| bow/padded | 170 | 52 | 78.99 | 1,893,259 |
| bow/leather | 171 | 51 | 78.03 | 1,813,401 |
| bow/plate | 171 | 51 | 72.7 | 1,390,625 |
| spear/padded | 170 | 52 | 80.08 | 1,991,103 |
| spear/leather | 171 | 51 | 77.19 | 1,787,583 |
| spear/plate | 171 | 51 | 75.01 | 1,594,827 |
| sword_shield/padded | 170 | 52 | 82.65 | 2,172,581 |
| sword_shield/leather | 170 | 52 | 80.75 | 2,056,731 |
| sword_shield/plate | 171 | 51 | 70.2 | 1,236,561 |
| greatsword/padded | 170 | 52 | 76.49 | 1,730,515 |
| greatsword/leather | 171 | 51 | 76.56 | 1,683,741 |
| greatsword/plate | 171 | 51 | 76.32 | 1,624,177 |
| hammer/padded | 169 | 52 | 88.26 | 2,582,911 |
| hammer/leather | 170 | 52 | 85.81 | 2,384,205 |
| hammer/plate | 170 | 52 | 79.29 | 1,911,187 |

All 15 finish day 169–171, skills 51–52. Normal month-one rapid claims two seeds: level 20, no S bought; no price, purchase gate or expertise threshold changes. Normal weekly claim mechanic unchanged; do not infer daily login requirement removed. Alpha accelerated profile remains separate. S Masterwork vs S Common 79.67%; S fully trained vs both unfamiliar 1200/1200 wins; independent mirror player win Non 49.83%, D 49.38%, S 50.20%. Dedicated grade separation, wallet conservation, production parity and browser suite remain required. V16 resets disposable alpha saves for changed frozen outcomes, with explicit reset notice.

## Recommendation

Release as provisional alpha improvement once final-head and Pages pass. No further tuning without user feedback/approval. Follow up on shield-vs-bow, remaining extreme material matchups, terrain preference mismatch and whether unarmoured or weekly users should receive different progression policy. No claim of human enjoyment or perfect balance.
