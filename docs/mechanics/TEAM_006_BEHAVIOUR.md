# TEAM-006 — selectable team behaviour, first candidate test

Source main 997ded2d75c29cbdd03cbb1ac335f6b443fc9afa; harness tools/team-behaviour-audit.mjs at 112a39ee4128081b305341f1662d37efaf9c02fa. [Native run 45844151597](https://github.com/janisp123/idle_game/actions/runs/45844151597): all nine jobs PASS. [Results](TEAM_006_BEHAVIOUR.json). 1,714,176 direct battles, 1080 exact normal trace parity fixtures (additional resolver calls). Seed 20261129; per cell 32 search, 64 independent holdout, 128 NPC seeds per team and mode. 12 teams, eight enemy archetypes, five arenas, NG/D/S, behaviour mastery 1/25/50. General Teamwork 25 for matched teams, enemy 1 for generated NPC. Equal grade Common, fully trained synthetic gear. Actual resolver in disposable copy; unchanged physical strikes, gear, rewards, saves. No public gameplay edits.

Candidate rules: Protect uses ready action to move shield bearer toward threatened non-shield ally; interception probability max(existing coordination, mastery chance) with existing adjacent melee guard and recovery constraints. Focus adds wounded/shared-target preference (3 health-loss weight, 6 teammate-target weight), can waste movement. Range spends a ready action and finite retreat budget to increase nearest enemy distance for reach/ranged weapons, mobility-gated. Activation probability .25+.60*(mastery-1)/49, separate tactical RNG. The mastery curve is a research choice, not approved progression.

## Held-out win percentages

| Grade index | Mastery | Normal | Protect | Focus | Range | Own-team policy | Context policy |
|---|---:|---:|---:|---:|---:|---:|---:|
| 0 | 1 | 50.4 | 49.7 | 49.1 | 50.9 | 50.6 | 50.5 |
| 0 | 25 | 50.4 | 48.5 | 48.2 | 51.0 | 50.9 | 51.0 |
| 0 | 50 | 50.4 | 48.0 | 48.4 | 51.2 | 51.5 | 52.3 |
| 3 | 1 | 50.8 | 49.6 | 49.7 | 51.5 | 51.6 | 51.3 |
| 3 | 25 | 50.8 | 48.3 | 48.3 | 51.8 | 51.7 | 52.0 |
| 3 | 50 | 50.8 | 47.4 | 48.4 | 52.0 | 52.5 | 53.4 |
| 7 | 1 | 50.8 | 49.1 | 49.1 | 51.4 | 51.4 | 51.0 |
| 7 | 25 | 50.8 | 48.0 | 48.0 | 51.7 | 51.7 | 52.5 |
| 7 | 50 | 50.8 | 47.2 | 48.1 | 51.9 | 52.4 | 53.7 |

Own-team policy uses only the team composition to select a mode on search data, then independent holdout; contextual policy additionally knows enemy and arena (not available before battle in current game). Gains modest: own-team policy about +0.2–1.7 points; contextual +0.1–2.9. Range improves aggregate by 0.5–1.2 points, generally small downsides but often inert in melee or no-retreat terrain. Focus has substantial conditional upside and downside, but overall loses 1.1–2.8 points vs normal. Protect overall loses 0.7–3.6 points, increasingly with mastery. No universal new power bonus.

## Meaningful examples (64 held-out bouts per context, selected after train filter)

- S grade dual greatswords vs dual spears, walled courtyard: Focus 28.1% normal -> 48.4%, 64.1%, 79.7% at mastery 1/25/50. Conversely S dual shields vs dual greatswords, gatehouse, normal 95.3% -> 37.5% max Focus. Extreme cells exploratory, independent holdout but multiple comparisons.
- S shield+spear vs hammer+spear, open field: Range 28.1% -> 56.3%, 71.9%, 76.6%. D same context 43.8% -> 79.7% at max mastery. S dual greatswords vs tank+archer, ruined streets: 82.8% -> 71.9% max Range.
- Protect does redirect more blows but too often sacrifices attacks to chase the ward. S tank+archer versus random NPC normal 38.3% -> 32.0%, 25.0%, 21.9%; interceptions per bout 0.08 -> 0.16, 0.32, 0.76. D tank+archer normal 42.2% -> 25.8% max. S tank+archer against dual hammers in courtyard has a niche 23.4% -> 40.6%, but broad failure outweighs it.
- Fixed generated NPC samples (128 each): S hammer+spear normal 65.6% -> 69.5% max Range, S dual archers 56.3% -> 48.4% max Focus, D hammer+spear 67.2% -> 70.3% max Range. These are small samples, not a definitive economy estimate. NPC uses representative arena dice and generated opponents, not full offline trajectory.

## Verdict and next research

Behaviour choices can materially alter some matchups with no new fighters, but this first implementation is not ready to ship. Keep Normal, refine Focus (avoid chasing targets when an immediate useful attack exists), refine Range (distance preservation during recovery or only when benefit is plausible, avoid retreat into worse positioning), redesign Protect (threat-based escort/formation and meaningful adjacent interception rather than repeatedly chasing ally). Test alternatives against baseline and current variants, use paired held-out seeds, evaluate actual fixed NPC distribution and broader mastery/gear samples. Require meaningful fixed-composition choices, useful mastery curve, counters and action-cost evidence; don't confuse extreme per-context results with achievable idle win rate. No companions needed yet; no gameplay change, no merge. Prior TEAM-005 research in PR #189. Save and offline parity, progression design and economy require separate validation before release.
