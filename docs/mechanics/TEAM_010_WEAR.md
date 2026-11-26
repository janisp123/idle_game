# TEAM-010 — competitive armour wear and build diversity results

2026-11-26. PR #190, run 45873421935, all nine jobs PASS. Harness 4bcdcbf0, workflow bf615918, V17 production baseline 997ded2d. 32,962,800 scored battles plus 675 parity checks. All nine compact outputs TEAM_010_WEAR_G{0,3,7}_C{0,1,2}.json saved; full screening artifacts in native run. No production changes.

Owner decision ENDGAME-BALANCE-001: prioritize S-grade Masterwork, near-max realistic mature attributes and mastery, then scale down early grades. This run uses arena benchmark stats, Teamwork25, behaviour50, fully trained gear; it is not yet a fully max-stat endgame audit.

All candidates use moderate HP .8/1/1.25. A old wear, B sqrt(effective weapon multiplier) scaling, C B plus material-specific wear. See harness for exact parameters. Screen all 2850 uniform role pairs vs 25 teams x5 arenas x8 seeds, independent validation vs 30 teams x5 x24, held vs 45 teams x5 x32, fixed anchors, mixed-slot samples, rival cross-play and all-Masterwork sample vs 15 role-bearing teams. Masterwork outcome/trace parity passed 75 per job.

## S grade results: validation-selected dual-weapon policies, held win %
| Weapon | A Common | B Common | C Common | C Masterwork |
|---|---:|---:|---:|---:|
| Spear |68.7|64.4|66.2|69.3|
| Greatsword |66.5|61.5|59.6|62.1|
| Bow |55.7|53.9|55.2|53.9|
| Hammer |45.3|47.8|46.3|42.4|
| Sword/shield |39.4|42.1|40.6|38.8|

Masterwork tests use a narrower 15-opponent pool, not directly comparable to Common held 45. Candidate-specific shortlisted policies differ, so compare fixed anchors for causal effects. At S, identical tactical dual plate spear wins 68.7/64.4/66.2% in A/B/C; any armour break 0/77.9/61.1%. C provides substantial attrition, B generally stronger. S C selected mixed weapon teams: shield + spear 63.6%, bow + greatsword 66.6%, spear + hammer 63%, spear + greatsword 67.2%. S C same-role dual plate aggressive bows win 81.6% open field and 80.8% bridge; spear pair 75.6% ruined streets and 67.6% courtyard; shield/hammer 75.1% gatehouse. These environment differences are promising, but do not establish meta-free balance.

S C fixed spear/archer normal equipment defensive spear/aggressive bow 59.1%, reversed 43.2%; defensive shield/aggressive bow 55.3% versus reversed 37.0%. Demonstrates role assignment effects in matched battles. Daily offline results still unverified. In lower grades A/B/C dual spear ~76/75/75%; keep as progression sanity checks only.

## Next
Endgame-first: inspect actual six-month/max-stats alpha fixture and endgame progression trajectories, test near-max stats with S Masterwork and S Common, teamwork50/behaviour50. Masterwork cannot be balanced by wear alone; test direct weapon/guard/positioning adjustments to improve shield and hammer and reduce spear dominance, independently. Use broad balanced mixed opponents, paired anchors and holdout cross-play; measure same-weapon and mixed-team marginal contributions, arena counters and actual offline earnings at competitive NPC frontier. No universal meta-free claim. C worth further comparison but no final adoption. NG/D scale from verified endgame with sanity checks. No runtime changes/merge.
