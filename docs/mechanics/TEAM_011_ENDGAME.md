# TEAM-011 — endgame meta and counter audit

2026-11-26. PR #190. Run 45876350664: max, near, common all PASS. Harness 2e788bb9, workflow 09b50f74, V17 baseline 997ded2d. 14,072,400 scored resolver calls plus 225 Masterwork parity checks. Compact results TEAM_011_ENDGAME_MAX.json, _NEAR.json, _COMMON.json (commits 1ef4aaf6, a5923221, 9dd1257c); full screening artifacts in run. No runtime changes.

Actual TEAM_SIX_MONTH_BUILD-derived stats STR141 DEX141 END129 Fighting52, 3700 productive hours; teamwork50/behaviour50. S Masterwork 4000h active expertise (max), Masterwork 3400h (near), Common 4000h. Attributes uncapped, representative ceiling not absolute. Moderate material HP, TEAM-010 C wear, TEAM-007 roles. All 2850 uniform gear/role pairs screened vs 25 opponents, 30 validation, 45 held opponents, five arenas; seed20261207. All 2850 configurations search for counters against each selected elite; 8 shortlisted counters per elite independently validated with 48 seeds per arena (240 bouts), and 20/20/21 team tournament with side-reversal and 480 bouts per directed matchup. Counter examples below are best observed among eight validated candidates, not separately pre-registered. Full exhaustive 2850×2850 matrix not performed. Mixed-slot samples assume all selected families already mastered.

## Selected dual-weapon win rates, broad held opponent pool
| Weapon | Max MW | Near MW | S Common |
|---|---:|---:|---:|
| Spear |70.50|70.68|69.19|
| Greatsword |62.90|57.43|62.17|
| Bow |61.85|62.53|60.86|
| Hammer |41.08|43.25|38.50|
| Sword/shield |39.03|39.51|41.78|

Policy selection differs by profile; these are independently validated candidates, not exact same-build causal quality comparisons. Max global validation-selected defensive/tactical plate spear pair 70.50%. Aggressive plate bow + defensive plate greatsword 73.72% held (chosen in weapon/role category, not global). Mixed shield+spear 69.15%, spear+hammer 65.83%; presence does not prove independent contribution. Max side-swapped tournament top plate defensive/tactical spear 68.67% mean score, dual tactical plate spear 68.47%, dual range plate spear 67.73%; strongest counter in this tournament dual plate aggressive/tactical or aggressive/aggressive bows (spear pair score 41.25%). Tournament excludes some independently validated best counters because field uses first two search-ranked challengers; avoid conflating independent validation and tournament. No unbeatable configuration established; persistent spear/plate concentration indicates emerging meta and tuning needed.

## Max counter validation examples (240 bouts each, directional not side-swapped)
- Defensive/tactical plate spears lose to normal leather bow + tactical plate bow (75.0% challenger wins).
- Aggressive/tactical plate bows lose to defensive leather shield + aggressive plate bow (75.83%).
- Tactical plate greatswords lose to normal plate spear + defensive plate hammer (92.5%). Extreme counter also visible side-reversed tournament: greatsword score 3.13%.
- Normal padded hammer + range leather hammer lose to defensive padded shield + range padded spear (88.75%).
- Defensive padded shield + aggressive leather shield lose to normal plate shield + normal plate spear (88.33%).

## Environment and material
Max selected local win rates open field dual range leather bows 84.03%, bridge dual aggressive plate bows 85.97%, ruined streets dual range plate spears 80.21%, courtyard dual tactical plate spears 77.78%, gatehouse defensive leather shield + aggressive leather hammer 69.65%. Held per-arena values from independently validated selections, not universal optima. Normal dual builds padded/leather/plate win %: shield 38.31/38.03/35.78, bow 51.15/54.29/59.94, spear 51.71/56.22/67.81, hammer 40.47/41.42/38.92, greatsword 49.64/53.53/61.81. Plate strongest for reach/ranged and greatsword; lighter materials weak overall, but relative preferences differ for shield/hammer. Mixed armour samples did not outperform best uniform choices except small shield gain (39.14 vs38.31).

Fixed max role assignment anchors: aggressive leather bow + defensive plate spear 65.13% vs reversed 46.75%; aggressive leather bow + defensive plate shield 57.17% vs reversed35.68%. Good evidence of tactical impact, not offline earnings proof. Near results similar.

## Next
Endgame-first targeted sensitivity: independently isolate spear reach interruption/power, shield guard and protection/escort effectiveness, hammer recovery and guard-open/stagger. No arbitrary flat boosts to all weaker gear; preserve favourable terrain and material counters. Goal reduce excessive broad spear advantage and extreme hard counters without erasing meaningful decisions. Investigate plate ranged/mobility benefit and lighter armour incentives; no wear solution for Masterwork. Run matched max-stat validation with fixed anchors, diverse opponents, independent counter search, symmetric tournament, then near/Common and lower-grade sanity and competitive actual offline earnings. Do not claim no meta or implement before review. No production changes.
