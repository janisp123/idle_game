# TEAM-007 — Individual behaviour audit (verified)

2026-11-26. Source V17 main 997ded2d75c29cbdd03cbb1ac335f6b443fc9afa; harness tools/individual-behaviour-audit.mjs, workflow head 44c769785674f2075aa464ec83904c7f1a9ff915. [Native run 45851377250](https://github.com/janisp123/idle_game/actions/runs/45851377250): nine jobs PASS. 6,345,216 bouts plus 1080 baseline exact trace parity fixtures. Compact results by grade: [NG](TEAM_007_INDIVIDUAL_G0.json), [D](TEAM_007_INDIVIDUAL_G3.json), [S](TEAM_007_INDIVIDUAL_G7.json). Research PR #190, no production changes.

Methods: seed 20261202; 12 player compositions, eight matched opponents, five arenas, 17 configurations (16 ordered role pairs plus normal/normal), 16 search and 32 holdout seeds per cell. Separate random NPC search 512 and holdout 1024 seeds per build/configuration, actual opponent generator and representative arena dice; general Teamwork 25, NPC enemy 1. NG/D/S, both player behaviour mastery levels equal at 1,25,50. Fully trained synthetic Common equipment, benchmark stats. Role follows fighter and gear when reversing slots. Enemies normal. Temporary production resolver/strike copies, not gameplay changes. Active turn probability .35+.55*(level-1)/49. Aggressive outgoing impact ×1.22, incoming ×1.25, approach progress ×1.5; Defensive outgoing/incoming ×.8, recovery escort and guard-specific interception; Tactical refined reachable target focus (3 health, 4 focus); Range V1 finite retreat with action cost. No permanent stat boosts; explicit damage tradeoffs are research tuning, not approved final balance. RoleActive persists until the next eligible non-staggered turn, including incoming attacks; assess this duration and interruption behaviour in any later implementation.

## Independent held-out win rates (%)

| Grade | Mastery | NPC normal | NPC selected best | NPC selected same | NPC selected mixed | NPC selected poor | Matched normal | Matched selected best | Matched selected same | Matched selected mixed | Matched selected poor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 1 | 71.8 | 73.7 | 73.2 | 73.2 | 70.3 | 48.0 | 49.9 | 49.5 | 49.8 | 46.2 |
| 0 | 25 | 71.8 | 74.5 | 74.4 | 74.2 | 68.2 | 48.0 | 50.9 | 50.4 | 51.2 | 44.7 |
| 0 | 50 | 71.8 | 75.7 | 75.4 | 75.0 | 66.7 | 48.0 | 53.5 | 51.3 | 53.2 | 42.4 |
| 3 | 1 | 54.8 | 56.6 | 56.0 | 56.5 | 53.3 | 49.4 | 51.3 | 50.5 | 51.3 | 47.5 |
| 3 | 25 | 54.8 | 58.1 | 57.4 | 58.3 | 51.3 | 49.4 | 53.1 | 51.9 | 53.6 | 46.3 |
| 3 | 50 | 54.8 | 59.8 | 58.9 | 59.6 | 50.2 | 49.4 | 55.5 | 53.7 | 55.5 | 44.2 |
| 7 | 1 | 53.3 | 54.9 | 54.2 | 54.8 | 51.6 | 48.4 | 50.5 | 49.3 | 50.5 | 46.3 |
| 7 | 25 | 53.3 | 56.6 | 55.2 | 56.6 | 50.4 | 48.4 | 53.2 | 50.8 | 53.1 | 44.3 |
| 7 | 50 | 53.3 | 58.4 | 57.2 | 58.2 | 48.3 | 48.4 | 54.8 | 52.6 | 54.8 | 43.0 |

Policies are chosen on search data separately for each known own equipment composition, then evaluated on independent seeds. Same includes normal/normal; mixed requires two different non-normal roles. Selected best need not beat selected same/mixed on holdout (search uncertainty). NPC comparison does not require knowing future enemies or terrain. Each NPC table entry aggregates 12 teams, 1024 held-out bouts per team. Matched results use equal weighting of opposing archetypes and terrains; both are benchmark distributions, not full progression simulations.

## Practical examples at max mastery

- S spear/archer: defensive spear + aggressive bow 65.3% versus reverse 44.4%; normal 55.4%, both tactical 60.6%. D same pair 63.5% versus 43.0%, normal 53.2%. At S, all 16 were evaluated, but this particular pair example is selected from observed data, so not an independently pre-registered claim. The search-selected mixed pairing is defensive/aggressive in both D and S. S search-selected unrestricted best is tactical/tactical (60.6% heldout), illustrating ranking noise.
- S tank/archer: search-selected range/aggressive 46.9%, normal 38.9%, both defensive 30.7%; aggressive shield/defensive bow 29.6%, reversed 45.2%. Range on a zero-reach shield is effectively baseline behaviour, so not evidence of range-specific shield advantage.
- S dual shields: aggressive/aggressive 37.7%, normal 27.0%, defensive/defensive 24.9%. S dual spears both tactical 70.5%, both aggressive 60.3%. S hammer/spear defensive/tactical 67.1%, normal 60.5%. Distinct useful roles exist but some teams are better with identical roles. Mixed advantage on NPC aggregate relative to same is modest and not universal (NG max mixed 75.0% vs same 75.4%; D 59.6 vs 58.9; S 58.2 vs 57.2).
- S mastery curve for search-selected best NPC policy: 54.9/56.6/58.4% at 1/25/50; normal 53.3%. Poor selected choices 51.6/50.4/48.3%. Policy may change with mastery; not proof of monotonic mastery for every fixed pairing.

## Decision point

Individual behaviour adds meaningful player-accessible choices. At max mastery best-selected vs poor-selected NPC difference 9.0/9.6/10.1 pp (NG/D/S), matched 11.1/11.3/11.8 pp. Selected best NPC gain vs normal 3.9/5.0/5.1 pp. Do not require mixed roles to be universally superior. No pet needed for this objective. Recommend owner-approved next candidate: preserve Normal as an option, validate each role's actual contribution and clear UI explanation; Keep Distance has no effect for melee-only weapons, which must be explained or made meaningfully distinct; shield escort remains conditional, not proof of strong tank synergy. Test mixed mastery levels per fighter, varied gear experience/grades, opposing behaviours, early turn/interrupt parity and switching cost, progression cap/login activation, frozen offline timeline and economy before runtime release. Exact role multipliers and activation remain provisional. No live changes or merge. Prior TEAM-005/006 results preserved in their reports.
