# TEAM-008 — offline login session audit, completed

2026-11-26. Research PR #190; V17 main baseline 997ded2d75c29cbdd03cbb1ac335f6b443fc9afa. Harness tools/offline-behaviour-audit.mjs, corrected commit 7f41628c3b7f36449be12e2e01c4745bad2ee839. Native run 45865654833 all nine jobs PASS. Initial run failed on signed RNG seed; corrected. 128,538 settlement calls, 16,184,349 counted settled bouts (overlapping windows and periodic repeats, not independent simulations), 108 normal parity checks. Full compact outputs TEAM_008_OFFLINE.json commit 2d7a2a3cc0ad2b05a635d051177851a660d03731; earlier partial file preserved. No production changes.

Methods: actual normal-profile engine, 200s bouts including recovery, existing 256-period frozen schedule, NPC generation and arena selection, XP cap, expertise, automatic smith. Temporary TEAM-007 role candidate only. 12 builds, 48 seeds, 1/4/8/24h, empty and 90%-full Fighting XP bar plus full-bar controls. Good and poor selected in prior TEAM-007 search, normal comparator, explicit spear/bow mixed. Synthetic Fighting levels 10/25/52, attribute practice 120/1200/3700h, Common NG/D/S fully trained active gear, Teamwork25, behaviour mastery 1/25/50. Independent comparisons shifted seed within same build. Behaviour XP not implemented.

## Maximum mastery, empty bar, 24 hours
| Grade | Good coins | Normal coins | Poor coins | Good vs poor |
|---|---:|---:|---:|---:|
| NG | 7343.59 | 7343.44 | 7341.40 | +0.03% |
| D | 28814.65 | 28801.28 | 28654.13 | +0.56% |
| S | 102288.81 | 100954.24 | 96418.60 | +6.09% |

S mastery 1 good/poor 101305.87/99654.30, mastery25 102048.25/98330.97. Mastery50 S independent good earns more at 1/4/8/24h: 55.9/76.6/83.3/87.7%; >=15% more: 21.0/14.6/13.7/11.6%. S padded shield/bow good 98614.25 vs poor 81061.60 (+21.65%), normal 93099.71; tank/bow 101700.67 vs 89495.29 (+13.64%); spear/bow explicit defensive/aggressive 105116.23 vs poor 95117.75 (+10.51%). Dual shields selected good underperforms both poor and normal (92716.60/92948.63/96590.81). Good/poor policies transferred from prior different stat distribution, not guaranteed optimal.

Fixture ceiling: normal 24h wins 431.97/429.87/389.78 of 432 = 99.99/99.51/90.23%. This valid farming case cannot establish competitive-frontier impact. Do not strengthen role multipliers based on it alone. Next calibrate representative frozen states independently to normal 40–70% win rate and test real settlement, caps and earnings. Include actual progression/grade at logout; preserve both paired and separate-session comparisons.

Near-full bars cap all rewards by 8h NG and 24h D/S. S max mastery 90%-full daily good/normal/poor 50294.56/49705.52/47658.70 (+5.53% vs poor), ~213 bouts. Full bars yield zero. D empty-bar daily five automatic upgrades across policies, S good and normal one, poor 0.9705, NG smith locked. Wallet and inactive expertise assertions passed. activeHours field erroneous (unrelated productiveElapsedMs remains zero despite fighting); use practice, bouts and downtime and correct next harness. No live changes or merge. General 15–30% target not demonstrated in these synthetic states.
