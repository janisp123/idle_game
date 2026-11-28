# GEAR-RESEARCH-001 — tactical weapon, armour and terrain balance

Research only; pinned baseline 01362378d8aefcec3aa1fa4bb73116d9457237c3. Uses proposed cumulative expertise, grade perks and 24+3g+12q durability. No changes to live gameplay or deployment. Owner requested final tactical sweep after grade, durability, economy and NPC/reward studies.

## Method

Actual physical-duel resolver, smith equipment effects, five arenas, 15 builds (five existing weapons × three uniform armour families). Each unique build pair including mirrors tested on each arena with sides reversed, equal attributes/skill using original arenaBenchmark per grade. Screening: 3 points NG Masterwork, D Common, S Masterwork, fully trained, 8 deterministic LCG seeds from 20261125. Validation: same points plus S Poor at prior-grade expertise, 16 LCG seeds from 73192819. 120 unordered pairs × five arenas × 2 sides × seeds × points = 28,800 bouts per screen, 76,800 per validation. Aggregate weapon excludes same-weapon matches; armour excludes same-family; build excludes exact mirror. Draws included in denominator. Terrain figures equally weighted, not live weighted selection. Screening and validation rankings differed substantially; do not use first sweep alone. All validation variants share seeds for paired comparison; only independent from screening, not an independent holdout after variant selection.

Grade transition recheck: 7 adjacent grade pairs ×225 ordered builds ×5 arenas ×8 fixed seeds ×2 sides = 126,000 bouts; higher Poor vs lower Masterwork, shared previous grade expertise, matched target grade attributes. Combined economy pilot: 4 daily 180-day trajectories, normal profile, prior full-credit policy, medium NPC curve and targeted S prize185, seed20261201. 702,000 direct combat executions across all sweeps and transition recheck; 266,053 settled bouts in economy pilot (bounded repeated schedule, not independent executions).

Run from root: node tools/gear-tactical-study.mjs balanced --validate (other variants and raw files below); node tools/gear-tactical-transitions.mjs; node tools/gear-tactical-economy-recheck.mjs --targeted greatsword/plate hammer/padded sword_shield/plate bow/leather. Bodies executed in isolated JS against pinned sources. Standalone Node and CI pending.

## Variant comparison

| Variant | NG weapon range | D weapon range | S MW weapon range | S MW build range |
| --- | --- | --- | --- | --- |
| candidate (screen) | 41.94–63.13% | 36.63–58.68% | 31.56–62.92% | 27.23–66.52% |
| swing (screen) | 39.20–59.41% | 46.81–55.63% | 42.67–59.65% | 36.79–63.48% |
| swingHammer (screen) | 39.97–59.65% | 47.22–55.63% | 43.61–55.76% | 38.21–62.14% |
| targeted (screen) | 39.93–56.84% | 47.15–55.17% | 42.26–53.85% | 41.07–59.91% |
| candidate (validation) | 39.03–57.95% | 42.85–55.87% | 39.39–56.75% | 37.99–66.52% |
| targeted (validation) | 35.80–73.54% | 38.80–58.45% | 41.61–53.96% | 35.00–63.71% |
| scaled (validation) | 39.03–57.95% | 42.80–55.42% | 42.00–53.99% | 36.03–63.97% |
| scaledPlus (validation) | 39.03–57.64% | 42.50–54.48% | 41.39–53.14% | 35.31–63.44% |
| balanced (validation) | 38.61–57.85% | 44.01–54.34% | 44.86–52.93% | 40.18–58.39% |
| balancedLite (validation) | 38.82–57.78% | 43.84–54.27% | 44.27–52.81% | 39.46–59.42% |

Flat targeted Greatsword buff rejected: independent NG win 73.54% aggregate, plate build 79.60%, making starter combat less balanced. Scaled adjustments preserve starter rules and improve late-game handling. Balanced candidate selected over balancedLite because it reduces S build spread and brings plate closer to other armour; not proof of globally optimal balance.

## Recommended numerical adjustments (not approved for runtime)

- Greatsword: intact equipment handling scale t=clamp((effective weapon damage multiplier−1)/5,0,1). Restricted swing accuracy penalty multiplied by 1−.55t; constrained impact .85+.13t (max .98, still below open swing 1.08); intact guard parry .36+.03t and recovering .22+.03t. Intact-only attack handling, guard only when weapon intact. Explicitly expose effective handling in stat breakdown if implemented; avoid duplicating modifier formulas. Parry scale should use safe finite clamped multiplier fallback for legacy/synthetic profiles. Does not add class or independent skill.
- Hammer base power 17→16; all other blunt damage, guard-open and shield wear rules unchanged.
- Bow backup dagger grade contribution .72→.80 (not bow shot power). Still weaker than full weapon scaling.
- Plate grade resistance coefficient 1.05→1.15; natural material resistance, weight, dodge, typed blunt weakness unchanged.

Exact tested patches: {"id":"balanced","patches":[["constriction * AIM.clearance","constriction * AIM.clearance * (actor.loadout==='greatsword'?1-.55*(equipped?Math.min(1,Math.max(0,((activePiece.damageMultiplier??1)-1)/5)):0):1)"],["constriction>0?TACTICS.constrainedSwing:TACTICS.openSwing","constriction>0?TACTICS.constrainedSwing+.13*(equipped?Math.min(1,Math.max(0,((activePiece.damageMultiplier??1)-1)/5)):0):TACTICS.openSwing"],["GUARD.parry:GUARD.recoveringParry","GUARD.parry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5):GUARD.recoveringParry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5)"],["power: 17, recovery: 3","power: 16, recovery: 3"],["gradeScale: .72, strengthScale: .90","gradeScale: .80, strengthScale: .90"]],"smithPatches":[["plate:1.05","plate:1.15"]]}. Earlier scaled variants lacked intact gating for attack handling; balanced adds it. No claim that new coefficients are individually isolated.

## S Masterwork: independent-from-screen validation

| Weapon | Before | Balanced |
| --- | --- | --- |
| greatsword | 39.39% | 52.93% |
| sword_shield | 56.75% | 50.78% |
| hammer | 55.89% | 51.48% |
| bow | 44.83% | 44.86% |
| spear | 52.92% | 49.74% |

| Armour | Before | Balanced |
| --- | --- | --- |
| padded | 50.15% | 46.63% |
| leather | 58.84% | 56.50% |
| plate | 40.90% | 46.81% |

| Terrain | greatsword | sword_shield | hammer | bow | spear |
| --- | --- | --- | --- | --- | --- |
| open_field | 52.26% | 31.42% | 37.59% | 76.22% | 52.52% |
| narrow_bridge | 48.70% | 39.67% | 42.71% | 60.16% | 58.68% |
| ruined_streets | 54.86% | 53.65% | 53.13% | 25.69% | 62.59% |
| walled_courtyard | 61.20% | 50.35% | 53.73% | 22.92% | 61.72% |
| gatehouse_chamber | 47.66% | 78.82% | 70.23% | 39.32% | 13.19% |

| Build | Before | Balanced |
| --- | --- | --- |
| greatsword/padded | 38.88% | 47.23% |
| greatsword/leather | 45.85% | 56.52% |
| greatsword/plate | 37.99% | 53.79% |
| sword_shield/padded | 57.50% | 49.24% |
| sword_shield/leather | 66.52% | 58.39% |
| sword_shield/plate | 43.35% | 44.38% |
| hammer/padded | 55.31% | 49.33% |
| hammer/leather | 61.29% | 55.71% |
| hammer/plate | 48.53% | 48.75% |
| bow/padded | 46.88% | 45.94% |
| bow/leather | 51.25% | 50.67% |
| bow/plate | 38.57% | 40.18% |
| spear/padded | 51.96% | 46.21% |
| spear/leather | 56.52% | 51.70% |
| spear/plate | 49.02% | 51.43% |

Balanced S MW aggregate weapon spread 44.86–52.93%, complete-build spread 40.18–58.39%. At NG, plate retains natural protection advantage and Bow is weaker in all-terrain average. At S, leather remains strongest aggregate armour but not universally best; bow's open-space strength and short-range weaknesses preserved. These are synthetic equal-stat round robins, not PvP skill ratings. No guarantee that all individual matchups are close or every mixed-armour configuration viable.

## Grade transitions

| Transition | Higher Poor win all builds | Higher Poor win matched build |
| --- | --- | --- |
| NG→F | 65.04% | 68.83% |
| F→E | 68.87% | 76.08% |
| E→D | 65.37% | 70.17% |
| D→C | 63.96% | 68.33% |
| C→B | 67.23% | 74.25% |
| B→A | 68.63% | 74.67% |
| A→S | 67.50% | 75.08% |

All aggregate transitions still favour next-grade Poor, tactical counters still matter. Individual matchup guarantees not asserted.

## Combined economy pilot

| Build | Full S MW day | Fighting level | Day180 wallet | Weapon practice hours |
| --- | --- | --- | --- | --- |
| greatsword/plate | 169 | 52 | 2249731 | 3659.8 |
| hammer/padded | 169 | 52 | 2317740 | 3659.8 |
| sword_shield/plate | 171 | 51 | 1694963 | 3615.9 |
| bow/leather | 169 | 52 | 2104811 | 3658.8 |

All four tested builds still reach S MW days169–171. This does not supersede the earlier 15-build arena economy study: only 4 combined tactical trajectories rerun here; final NPC profitability and grade-skip retest with final tactical coefficients pending. Existing S mastery requirement 4000h remains unapproved to change.

## Remaining limitations / next

Recommend balanced as next tactical candidate. Validate final combined candidate all 15 economy trajectories and NPC difficulty/coin profitability, including mixed equipment/armour and extreme stats, before implementing. Check actual recovery-skip effect placement in resolver, validate legacy profile fallback, condition invariants, stat display and frozen snapshots. Keep all five weapons. No new gameplay mechanics or unapproved price/mastery change. Standalone Node CLI and repository CI not verified. Owner approval needed for final numbers.

## Raw evidence

- [GEAR_TACTICAL_CANDIDATE.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_CANDIDATE.json)
- [GEAR_TACTICAL_SWING.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_SWING.json)
- [GEAR_TACTICAL_SWINGHAMMER.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_SWINGHAMMER.json)
- [GEAR_TACTICAL_TARGETED.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_TARGETED.json)
- [GEAR_TACTICAL_CANDIDATE_VALIDATION.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_CANDIDATE_VALIDATION.json)
- [GEAR_TACTICAL_TARGETED_VALIDATION.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_TARGETED_VALIDATION.json)
- [GEAR_TACTICAL_SCALED_VALIDATION.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_SCALED_VALIDATION.json)
- [GEAR_TACTICAL_SCALEDPLUS_VALIDATION.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_SCALEDPLUS_VALIDATION.json)
- [GEAR_TACTICAL_BALANCED_VALIDATION.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_BALANCED_VALIDATION.json)
- [GEAR_TACTICAL_BALANCEDLITE_VALIDATION.json](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/GEAR_TACTICAL_BALANCEDLITE_VALIDATION.json)
- [Transition results](GEAR_TACTICAL_TRANSITIONS.json)
- [Combined economy pilot](GEAR_TACTICAL_ECONOMY_1.json)
