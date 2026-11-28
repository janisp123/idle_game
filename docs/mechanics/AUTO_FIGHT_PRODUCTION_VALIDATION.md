# AUTO-FIGHT-01 — Production resolver validation
2026-11-26. Baseline `de5853ae0252f2cba1c888a04359fb92bc0b6c83` (deployed A3 combat), branch `research/auto-fight-policy-001`, draft PR #183. Owner-approved direction: automatic online advance and retreat, **current stage locked throughout offline absence**, no active abilities/clicks, eight existing tiers.

## Method and evidence
- Reproduce on branch: `node tools/auto-fight-production-validation.mjs > /tmp/auto-fight-production.json`. [Raw results](https://github.com/janisp123/idle_game/blob/ea49cec28939ba0dcd75e6a2b6f150f6801b79cc/docs/mechanics/AUTO_FIGHT_PRODUCTION_VALIDATION.json). Identical harness function executed in connector JavaScript environment with fetched, unpatched production module text and import/export adapter. Native Node/CI still unverified. No site code changes.
- 105 snapshots: 15 weapon/armour builds × five milestones (0,30,90,150,180 days), plus 15 weak late-game builds and 15 weapon-expertise-reset late-game builds. Historical candidate trajectories from GEAR_TACTICAL_ECONOMY_1..4.json; recomputed through current trainingKit/trainingEffects and armourStats, with expertise converted to actual units. These are frozen fixtures, not newly simulated six-month progression or actual player saves. Switch case retains same weapon's gear but resets its expertise (synthetic new specialization).
- Two independent session seeds: 743829103 and 2986713491. All eight stages × 54 bout positions × 105 profiles × two seeds = **90,720 newly resolved seeded physical duels**, cached across policies. 36 online bouts (2h), then 18 offline bouts (1h); four policies and two starting modes (NG and current weapon grade, used only as a test proxy for already-established stage). Both modes are identical for NG gear and counted twice; no extra independence implied. 1,680 policy runs / offline wallet checks. Shared production settleArenaPrizes recomputed frozen-stage prizes and checked exact coin, bout count, fixed grade and resurrection downtime against cached duel outcomes. Offline policy counters are held outside the wallet by harness; integration still unimplemented.
- All outcomes real production resolver results; no copied damage equations. Stage decision policy experimental, not production. Reference: best fixed stage's *realized* coins over each matching seed/time window (hindsight benchmark, not a guaranteed attainable optimum). Equal weight per eligible run with positive denominator; no CAP-001, live attributes, gear purchases, queue, login or calendar economy modeled here. Offline interval only full bouts, not partial/cap/throttled-tab boundaries.
 
## Results
| Policy wins/loss/retry | Trajectory online | Trajectory offline | Trajectory defeat rate | Changes/h | Weak online / offline | Switch online / offline |
|---|---:|---:|---:|---:|---:|---:|
|1/1/1|70.81%|66.60%|42.58%|13.75|71.81% / 49.93%|71.19% / 77.73%|
|3/1/3|82.50%|87.53%|23.53%|5.57|77.71% / 91.98%|74.21% / 89.63%|
|3/1/5|83.81%|87.88%|20.58%|4.39|79.19% / 82.15%|76.37% / 94.74%|
|3/1/10|84.23%|90.19%|17.48%|3.14|75.66% / 89.52%|78.67% / 90.30%|

3/1/10 milestone breakdown (both starts):
| Day | Runs | Online ratio | Offline ratio | Loss rate | Mean end tier (NG=0) |
|---|---:|---:|---:|---:|---:|
|0|60|97.50%|100.00%|56.94%|0.00|
|30|60|88.16%|85.72%|9.31%|2.17|
|90|60|84.55%|93.67%|8.70%|4.13|
|150|60|77.83%|84.76%|8.01%|5.53|
|180|60|73.14%|86.79%|4.44%|6.47|

## Interpretation and next step
3/1/10 is the preferred initial implementation candidate: best trajectory online and offline income, lowest loss rate and tier churn of tested candidates; also lowest losses in weak and switch stress fixtures. It is not universally optimal: 3/1/5 yields higher weak online and switch offline income; immediate retreat can strand strong characters below profitable S before logout. First screen agrees with this candidate. No numeric rewards retuned. No requirement for additional stages evidenced yet; keep existing eight.
 
Proceed to AUTO-FIGHT-02/03 with pure validated policy (3 consecutive victories normally, 1 defeat/double-death retreats one stage, 10 consecutive wins to retry after failed advancement; no stage above S or below NG); retain grade history separately. Preserve retry state across absent time, never give offline streak/highest-stage credit. Prevent manual Fighting tier mutation. Test online exact-once committed outcomes, offline fixed stage (including losses), partial bouts/cap probes, reload, hidden/throttled tab, save/queue switching and gear snapshot boundaries. Establish explicit foreground interval semantics, conservative no advancement on catch-up; no unbounded per-bout offline loops. Full six-month economy and native CI/browser verification remain required before deployment. Gear change early retry was discussed but untested: do not silently add a reset-on-equip exploit; defer pending validation.
