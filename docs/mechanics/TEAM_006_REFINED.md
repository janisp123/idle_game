# TEAM-006 — second behaviour candidate, verified

Source main 997ded2d75c29cbdd03cbb1ac335f6b443fc9afa; harness tools/team-behaviour-refine.mjs at 57409517eacb322f0223647b3871270e23afe581. [Run 45848442829](https://github.com/janisp123/idle_game/actions/runs/45848442829): all nine jobs PASS. [Results](TEAM_006_REFINED.json). 3,290,112 bouts plus 1080 exact baseline trace parity fixtures. Fresh seed 20261201, 32 search/64 holdout seeds per matchup, 512 generated NPC trials per team and mode; same 12 teams, eight opposing archetypes, five terrains, three grades, three mastery levels; general Teamwork 25 for matched bouts, NPC opponent 1. Equal grade Common fully trained synthetic gear. Old and new variants in same fresh-seed audit. No live changes.

Protect2 escorts threatened non-shield allies against melee during recovery or when no attack is reachable; Focus2 adds reachable-target preference when an attack is available (wounded weight 3, teammate-target weight 4); Range2 retains attack reach and moves away from immediate shorter-reach threats during recovery or ready ranged action. Existing geometry, retreat limits, interception costs and physical strikes preserved. Provisional activation .25–.85; no stat buffs.

| Grade index | Mastery | Normal | Protect1 | Protect2 | Focus1 | Focus2 | Range1 | Range2 | Own-team original | Own-team refined | Context refined |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 1 | 49.5 | 48.5 | 49.3 | 48.3 | 50.3 | 50.0 | 50.0 | 49.9 | 50.1 | 50.4 |
| 0 | 25 | 49.5 | 47.4 | 49.1 | 47.8 | 51.0 | 50.2 | 50.1 | 49.9 | 51.0 | 51.2 |
| 0 | 50 | 49.5 | 47.2 | 49.1 | 47.5 | 51.9 | 50.3 | 50.1 | 50.7 | 52.0 | 52.5 |
| 3 | 1 | 51.6 | 49.7 | 51.1 | 50.4 | 52.7 | 52.3 | 52.3 | 52.2 | 52.6 | 52.7 |
| 3 | 25 | 51.6 | 48.3 | 50.5 | 49.1 | 53.4 | 52.6 | 52.4 | 52.1 | 53.6 | 53.6 |
| 3 | 50 | 51.6 | 47.2 | 50.2 | 48.9 | 54.2 | 52.8 | 52.6 | 52.8 | 55.0 | 55.2 |
| 7 | 1 | 50.8 | 49.2 | 50.4 | 49.3 | 51.7 | 51.5 | 51.3 | 51.5 | 51.3 | 51.7 |
| 7 | 25 | 50.8 | 47.7 | 50.1 | 48.6 | 52.6 | 51.7 | 51.6 | 51.6 | 52.8 | 52.9 |
| 7 | 50 | 50.8 | 47.0 | 49.7 | 48.9 | 54.0 | 51.9 | 51.7 | 52.9 | 54.3 | 54.7 |

NPC aggregate percentages (equal weighting over 12 own teams, actual representative arena dice and generated opponents; 512 per team/mode, not a progression simulation):

| Grade | Mastery | Normal | Protect1 | Protect2 | Focus1 | Focus2 | Range1 | Range2 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 1 | 73.2 | 71.8 | 73.0 | 73.1 | 73.8 | 73.7 | 73.6 |
| 0 | 25 | 73.2 | 70.5 | 72.9 | 72.5 | 74.0 | 73.8 | 73.7 |
| 0 | 50 | 73.2 | 69.5 | 72.2 | 71.3 | 74.2 | 74.0 | 73.9 |
| 3 | 1 | 54.9 | 53.5 | 54.8 | 53.6 | 55.5 | 55.7 | 55.6 |
| 3 | 25 | 54.9 | 51.9 | 54.6 | 53.1 | 56.4 | 55.9 | 55.8 |
| 3 | 50 | 54.9 | 50.7 | 53.7 | 51.9 | 57.4 | 56.2 | 56.1 |
| 7 | 1 | 52.9 | 51.8 | 52.6 | 51.4 | 53.7 | 53.9 | 53.5 |
| 7 | 25 | 52.9 | 50.5 | 52.4 | 50.9 | 54.7 | 54.0 | 53.7 |
| 7 | 50 | 52.9 | 49.4 | 52.1 | 50.9 | 56.1 | 54.2 | 54.0 |

Focus2 clearly improves broad results and mastery: max +2.4–3.2 pp over normal, but can harm dual hammers (S 61.5 to 56.5% across held-out contexts, and 65.6 to 31.3% versus dual spears in ruined streets). S dual spears 49.5 to 56.1%; dual archers 57.9 to 64.5%. Range2 small broad improvement, slightly below original Range at every mastery or equal; retains useful niche (S shield+spear vs hammer+spear on open field; see full results), but does not justify declaring superior to original. Protect2 substantially reduces original damage to win rate but remains worse than normal overall; S tank+archer NPC 35.5% normal, 25.0% original, 35.2% refined, with 0.06/0.73/0.37 intercepts per bout. D tank+archer 40.8/27.0/35.0. Shield+spear S NPC 54.1/48.4/53.9, interceptions 0.8/1.30/1.36. More interception alone is not success. Own-team refined policy at maximum gains 2.5–3.5 pp versus normal, +1.3–2.2 pp over first candidate on fresh seeds. Context-specific selection needs advance knowledge currently unavailable. Extreme cell estimates use 64 holdout bouts and are exploratory; 512 NPC samples reduce but do not eliminate uncertainty.

Recommendation: Focus2 is the strongest implementation candidate, Range1/2 need a targeted distinct-value comparison before selection, Protect2 not ready. Do not deploy all three just because simulations pass. Test threat-aware shield formation/escort or reconsider protection as automatic baseline improvement, and differentiate focus and range with actual PvE distribution, meaningful mastery and clear player choices. Progression, economy and frozen offline integration still untested. No pets or gameplay changes; research PR #190 remains draft. Requires owner approval for runtime implementation.
