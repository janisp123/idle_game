# CAP-001 — Reward-cap progression audit

2026-11-25. Owner chose per-skill capped rewards instead of unlimited offline accumulation. Production candidate `9222c7f`, [systems run 45625295136](https://github.com/janisp123/idle_game/actions/runs/45625295136), job 139243757972, completed successfully. Normal profile, 180 calendar days, daily claims, independent seed 20261201, real engine, shop, arena and frozen kit. Same 15-build fixture as BAL-002 for comparison. This is not a promise about all possible play strategies.

| Build | Full S Masterwork day | Fighting level | Lifetime wins | Wallet | Weapon practice hours (floor) |
| --- | ---: | ---: | ---: | ---: | ---: |
| bow/padded | 176 | 51 | 60.49% | 114,893 | 3540 |
| bow/leather | Not reached | 51 | 58.54% | 198,765 | 3540 |
| bow/plate | Not reached | 51 | 54.39% | 139,559 | 3541 |
| spear/padded | 174 | 51 | 61.32% | 162,401 | 3541 |
| spear/leather | 180 | 51 | 58.71% | 16,967 | 3541 |
| spear/plate | 180 | 51 | 58.62% | 5,339 | 3541 |
| sword_shield/padded | 177 | 51 | 60.28% | 79,413 | 3541 |
| sword_shield/leather | Not reached | 51 | 57.67% | 122,815 | 3540 |
| sword_shield/plate | Not reached | 51 | 47.44% | 91,057 | 3518 |
| greatsword/padded | Not reached | 51 | 56.35% | 76,413 | 3540 |
| greatsword/leather | Not reached | 51 | 55.37% | 181,731 | 3540 |
| greatsword/plate | Not reached | 51 | 54.44% | 43,975 | 3518 |
| hammer/padded | 171 | 51 | 71.74% | 849,391 | 3615 |
| hammer/leather | 172 | 51 | 68.46% | 618,023 | 3591 |
| hammer/plate | 174 | 51 | 62.21% | 175,569 | 3541 |

8 of 15 reached full S Masterwork (days 171–180), compared to 15 of 15 (169–171) before CAP-001. All reached activated Fighting Lv51. At day 180, stats 138–139 STR, 137–138 DEX, 127–128 END; weapon practice approximately 3518–3616 hours (below current 4000-hour S mastery threshold). Existing gear prices, XP thresholds, expertise thresholds and physical combat formulas were not retuned. This is a deliberately stricter progression rule; balance targets need review before adjusting prices/practice/Max Stats. The previous A8 alpha Max Stats button still provides its old stress-test build, not the recalibrated daily trajectory.

## Verified policy

XP full pauses all rewards and ingredient consumption. Capped current activity advances wall clock only, never retroactively accumulates productive time. Finite scheduled wagons move on at cap; a final selected wagon pauses. Full XP proves Master readiness without owned-output lockout; explicit confirmation still surrenders remaining eligible output. Existing V16 saves retain earned XP, inventory, gear, stats, expertise, coins and same-version validation. A paused arena can resume its same unfinished bout after Master claim; leaving it forfeits no completed prize but abandons that unfinished bout. In alpha, Lv1 XP can cap before the first 200-second bout completes, so a player may have to claim before their first arena payout. No real-player enjoyment claim.

Public README/landing avoid exact feature counts, quality/grade details and numeric pacing promises; retain original artwork, Play Now, alpha warning and FREE-001. Tests use cap-aware fixtures and retain direct arena payout conservation, frozen combat snapshots and per-recipe material conservation.
