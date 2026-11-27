# Current working checkpoint

## Latest integration — alpha

ALPHA-MERGE-001 — Owner directed always merge during alpha. PR #200 merged f18389ea8b655699f97cf789a10bda2b435b02a5; tested head 913cbb5, all seven workflows, 175/175 tests, mobile/desktop Chromium. 31/31 class kits confirmed on main. [Raw 6960-bout max-only screen](mechanics/CLASS_KITS_FULL_SCREEN_20261127.md) also saved in PR #200 comment 7217488307; mage stack 86/120, ranged 13/120, summoner 27/120. Class guide UI and comprehensive balance remain open, not alpha merge blockers. Pages deployment verification separate. Next: actual kit info UI and max-only class/terrain matrix on fresh main-based PR.

## CLASS-KITS-001 — STARTED

CLASS-KITS-001 STARTED — 2026-11-27, Owner instructed implementation. First shared scheduler, status lifecycle and explicit v3 pilot (three daggers, three archers, four tanks), preserve v1 and v2 behavior and frozen settlement. Source baseline 2d5df13, terrain validation 04f3acf all seven checks/163 tests. No balance release before max-only tests and completion of all families. Next: implement and validate pilot; branch feature/group-tactical-counters, PR #200.

CLASS-KITS-001 — owner approved direction: one passive and two automatic abilities per specialization, no mana or manual skills. [Implementation plan](mechanics/CLASS_KITS_IMPLEMENTATION_PLAN.md) defines all 31 proposed kits, shared scheduler/effects, explicit versioned save compatibility, pilot 10-class family, max-only validation and UI/release gates. Plan only; no runtime changes or new tests run. Existing #200 terrain candidate 04f3acf all seven checks/163 tests passed; dagger/tank counter defect still open. Next: shared registry and scheduler plus old-rule dispatch. Exact candidate effects and numbers require validation, no release approval inferred.

## GROUP-COUNTERS-001 — STARTED

BATTLE-GROUP-001 / GROUP-COUNTERS-001 STARTED (owner approval 2026-11-27): natural tactical class counters, shielded tanks resist arrows and protect nearby allies, melee pressure/closing, magic vs heavy armour, healing/support/summoning distinct, terrain and stance matter. No class quotas, forced balanced roster, artificial enemy-only modifiers or material economy. Test maximum stats, S Masterwork and full mastery exclusively. Prior max-only screen 5040 bouts: 7 archers 115W/5L, default 71W/48L/1D, tanks 1W/119L; raw PR #198 comment 7215109236. Candidate coefficients not final. Preserve old frozen bout rules via saved rule version; old offline intervals use old rules, switch after live boundary. No reward/gear price/timing changes. Baseline 1c9e7f5. Branch feature/group-tactical-counters.

ARENA-ONLY-001 #199 merged 1c9e7f5, final head cffe1be all seven checks and 158 tests. Pages 45981143856 success.


GROUP-COUNTERS-001 candidate v2: centered frontline/backline formations, tank shield arrow interception within two tiles up to twice per round, stronger actual arrow blocks and guarded arrow damage reduction, magic bypasses shield/parry and pressures tanks, mobile melee closes faster/pressures casters, no free recovery kiting, healer/support attack tradeoff and 2-round recipient heal window. All candidate coefficients centralized in group-counter-rules.mjs. New group sessions v2; old sessions explicitly resolve v1, transition only at completed foreground boundary, no paid cursor loss. Legacy nonclass duels unchanged. 5040 comparable max-only screen plus 840 direct paired role/terrain battles; functional checks for arrow intercept, block, magic bypass and healer access. Pending CI; no claim of balance or release.


First candidate 0ff3206 verified website 45982905013 (161 tests, real Chromium 390/1440), raw PR comment 7216036032; reproducible [report](mechanics/GROUP_COUNTER_SCREEN_20261127.md). 5040 clone bouts + 840 direct role battles. Archer stack 35/120 vs old 115/120, tanks 40/40 vs archers, mages 40/40 vs tanks; summoner stack 86W/33L/1D, mage 78/120, default49/120. First pass not balanced/merged. Follow-up candidate: slight relief for shielded-arrow unblocked hits, summoner hybrid damage cost, close-range spell aim penalty, preference for reachable counter-targets instead of unreachable focus, central three-lane bridge movement choke (not forced composition), role help in class editor, preview key includes rule version, frozen v1 513-bout golden test. Re-run same max-only cohort/matrix; no lower-tier tuning. Candidate v2 still unreleased.


CLASS-TERRAIN-001 owner extension: terrain should create pronounced situational advantages, not flat equal performance. All 31 class guides now have independent 44px info buttons, registry-derived weapon/armour/cooldown, actual signature action, strengths/weaknesses and terrain preferences. Read-only dialog, no selection or spend. Browser tests browse all 31. Guide is tactical intent, not guaranteed outcome; terrain tuning follows. Prior a7c78c5 website passed 162 tests + browser, results saved PR #200 comment 7216385585; ranged 14/24 open, 2/24 gatehouse; summoner 43/120. Separate sensitivity failed outdated function-signature assertion; fix follows. Pending checks.


Terrain candidate: explicit bow impact/aim penalties in ruins and especially gatehouse; straight narrow bridge remains favorable to clear-line bow shots; dagger close-terrain bonus and padded/leather versus plate matchup, symmetric and applied only to new tactical rules. Added 1080 paired max-only direct dagger-versus-bow/mage/tank battles across five arenas. Fixed legacy symmetry audit's stale source signature match; no test acceptance weakened. 5880 existing max-only matches rerun as well. All class guides and effects are intended tactical identities pending validation, not guaranteed outcomes. No merge yet.


## 2026-11-27 — Interlude class identity research

Owner requested research of all original Interlude classes. [31-class identity report](mechanics/INTERLUDE_CLASS_IDENTITIES_20261127.md) maps all original classes to our specializations, records individual skill evidence, our fixed kit, proposed identity, matchups, preferred and adverse terrain, implementation gaps and test plan. Research-only; proposals not implemented. Candidate 04f3acf all seven CI passed (163 tests, all info dialogs on mobile/desktop), 6960 max-only matches; raw PR #200 comment 7216640854. Archers 14/24 open, 0/24 gatehouse; Trickblade 2/24 vs Longshot open, 24/24 gatehouse, but 24/24 vs Oathkeeper both. Need genuine tank counter and differentiated class mechanics before balance approval; no merge yet.


CLASS-KITS-001 pilot candidate: ten immutable class kits, distinct conditional traits, two independent cooldowns, real action budget and shared strike/target/movement/heal/status policy. V3 only; explicit v1 and v2 historical golden payouts retained. Other 21 classes still use old one-signature action. Candidate dagger correction uses intact plate and shield mitigation rather than changing old rule values; actual pilot coefficients provisional. Added max-only real trace cooldown/action/HP/determinism checks; further family screen and UI update pending. No merge/deploy.


Cache-path and module identity correction: public manager, alpha, preview, timeline, team resolver and class actions share kits-001 query tags for updated code. Prevent cached old rules or duplicate weapon identity breaking bow detection. Slowed Swiftblade cannot dash. Final candidate 3cde1be: all seven workflows passed, 165 tests and real Chromium mobile/desktop. [Pilot screen](mechanics/CLASS_KITS_PILOT_SCREEN_20261127.md) records all 6960 max-only results, historical goldens restored; dagger vs Oathkeeper 0/360, mage stack 84/120, ranged stack 14/120. Counter direction improved; extreme shield counter and mage stack require follow-up after full kit coverage. Next batch A other melee; no release.


CLASS-KITS-001 batch A candidate — Owner authorized continuation 2026-11-27. Five other melee kits plus shared bounded splash, stance-exclusive totem, brace and control handling, tests. Baseline 8fdef4f (pilot 3cde1be, 165 tests, seven workflows). 15/31 kits; no balance/release approval. Next verify final CI, save raw max-only screen, investigate failures and complete mage family.


CLASS-KITS-001 batch B candidate — Owner authorized continuation 2026-11-27. Four mage kits with bounded fire splash, curse conditional impact, casting recovery tradeoffs, control immunity and actual-damage-linked healing. Melee candidate ea3d509 website passed 167 tests and mobile/desktop browser; [saved 6960-bout screen](mechanics/CLASS_KITS_MELEE_SCREEN_20261127.md): mage stack 83/120, ranged 14/120, melee 35/120. Six prior workflows passed when recorded; endgame workflow still running at observation. 19/31 kits; 12 remaining. Next validate batch B, preserve raw CI screen, then dedicated healers. No merge or deployment.


CLASS-KITS-001 batch C candidate — Owner authorized continuation 2026-11-27. Three healer kits, shared bounded ally healing/cleanse/sanctuary/melee pact. Prior mage head 3d70d59 website 168/169 tests: both mage tests passed; pilot fixture now also contains Flameweaver, old exact cohort assertion failed. Fixed cohort coverage assertion (all events still checked). [Failed-head diagnostic raw 6960 screen](mechanics/CLASS_KITS_MAGE_SCREEN_20261127.md) preserved; mage stack 84/120, not final. 22/31 kits; nine remaining. Next validate corrected head, save raw CI screen, support batch. No merge/deploy.


CLASS-KITS-001 batch D candidate — Owner authorized continuation 2026-11-27. Five support kits: focused blessing, protective song, offensive tempo, bounded cluster cooldown delay, longer stance chant. Prior healer head 9e63ccc Node suite passed (website reached Chromium); final results not yet available at authoring. 27/31 kits; four summoners remain. Next verify both CI heads, save raw screens, implement summoners. No merge or deployment.

Healer candidate 9e63ccc: website 45991891403 passed 171/171 and Chromium mobile/desktop; mage pilot assertion restored. [Healer screen](mechanics/CLASS_KITS_HEALER_SCREEN_20261127.md) saves all 6960 max-only bouts: mage stack 88/120, healer stack 25/120, ranged 17/120. Final support CI remains pending; no release.


CLASS-KITS-001 batch E candidate — Owner authorized continuation 2026-11-27. Four summoners, bounded familiar/construct utility and paid two-phase siege with expiry/fizzle. Registry covers 31/31. Prior support head b636a9f website passed 173/173 and Chromium, [6960 max-only bouts](mechanics/CLASS_KITS_SUPPORT_SCREEN_20261127.md): mage 84/120, summoner 60/120, ranged 14/120. Six workflows verified at observation, broad manager endgame workflow in progress. Next verify batch E, save raw results, update actual class info UI, full specialization matrix/mixed teams and independent holdouts, balance review. No merge/deployment.


CLASS-GUIDE-002 / FANTASY-THEME-001 — Owner approved 2026-11-27: actual kit information for all specializations, stable general README, original classic fantasy MMORPG-inspired landing and manager styling (no imported Lineage II assets). No gameplay/balance changes. Preserve 44px controls and original hero painting. Browser tests compare names/cooldowns against registry for every class; final CI and deployment pending.


INDIVIDUAL-STATS-001 — owner approved individual combat attributes, six stats, specialization-specific starting values and growth, no mana, modular tuning without unnecessary abstractions. First increment: pure 31-profile registry, exact weighted productive-time effort, configurable diminishing per-point costs, tests. Legacy account attributes and live combat unchanged until explicit versioned integration. Proposed 100-point start, 100% weights, legacy 100 XP/h and cost curve are provisional. Next: per-slot/per-specialization earned and active effort, frozen combat snapshot v4, NPC parity, six-stat derived effects, migration, UI and alpha max tool; then fresh balance simulations. No claims of live individual growth yet.


INDIVIDUAL-STATS-001 stage 2 — stage 1 merged #204 (447a0288), 177 tests and seven workflows passed. Added six-stat earned/active effort to each slot/specialization; award only frozen productive member time; old records migrate once using exact class weapon practice quarter-ms, not shared account ledger. Preserve inactive pending effort, activate selected builds only; alpha floor applies selected profiles. No v4 combat changes yet. Migration retains historical account ledger; no arbitrary duplication of shared stats. Pending CI. Next: v4 derived effects, clone parity and frozen snapshot dispatch, individual UI. Candidate 3700h alpha floor inherited from prior team benchmark; recalculate later.


INDIVIDUAL-STATS-001 stage 3 STARTED: #205 merged after 179 tests/seven workflows. Public arena v4 candidate uses individual stats and class mastery; account effort frozen for compatibility, productive time reported independently. Preserve old saved rules until live boundary. NPC clones use same class profiles. Next UI/tests before PR; no balance acceptance.


INDIVIDUAL-STATS-001 stage 3 — candidate public arena v4 uses independent STR/DEX/CON/INT/WIT/MEN and class mastery, freezes old account effort (historical compatibility only), preserves old session rule versions until live boundary, clone profiles use same class growth and grade practice, removes account stats panel, shows six selected fighter stats and class base/growth. Named derived stat tuning in stat-combat.mjs. WIT affects magical action recovery, not fixed signature cooldowns. No mana. Shared Fighting progression remains internal reward cap/rank and equipment gate, not a combat attribute. Existing v1-v3 fixture defaults retained. CI pending; numerical balance and six-month benchmark provisional.


RAID-001 STARTED (owner approval 2026-11-27). Individual stats #206 merged, 181 tests and all seven workflows passed. Five named raids and fixed crews, explicit raid-only knockout combat and nonstacking 24h blessing functions implemented as stage 1 foundation. No public raid launch or applied rewards yet; CI, raw initial screen, save/expiry integration and UI pending. See docs/mechanics/RAIDS_PLAN.md.


RAID-001 stage 2 candidate: persisted frozen attempt and single settlement through public arena coordinator, arena paused during raid; offline resume, nonstacking blessings integrated into actual fighting XP cap and v4 combat bonus snapshots, split at expiry. UI and CI pending. No numeric balance claims.


RAID-001 stage 3 candidate — launch buttons for all five raids, saved deterministic encounter, automatic arena pause/resume, strict knockout and one-time coins/blessing, 24h XP and combat bonus, expiry split, larger boss and six minion cards with actual health and weapon icons; mobile smoke and reward/reload tests. Candidate 2.5-second rounds, 120-round limit. Initial balance screen pending; approximate five-minute appropriate-level wins unverified. CI pending; do not claim deployed.


RAID-001 initial foundation screen saved in [RAID_INITIAL_SCREEN_20261127.md](mechanics/RAID_INITIAL_SCREEN_20261127.md): 183 tests and Chromium passed, max team won 12/12 lower raids, timed out 3/3 at level 50. Follow-up limits oversized boss healing base and adds 30 same-grade diagnostics; exact actual timing still unverified. Weapon icons use actual class weapons rather than adapters. Full candidate CI pending.


RAID-001 test repair: playable candidate c1afe459 website workflow 46003683324 failed the ten-second XP comparison (rounding/reward-cycle boundary); no merge. Revised test isolates XP-only level 10 blessing across 100s, confirms same coins/analytics, tests level 50 combat bonus separately and save roundtrip/expiry. Corrected numeric CSS selector in browser raid smoke. Buff timer shows hours/minutes. New CI pending.


RAID-001 matched-grade screen [RAID_MATCHED_SCREEN_20261127.md](mechanics/RAID_MATCHED_SCREEN_20261127.md) preserved, 30 matched and 15 max-only actual bouts. Counter wins 15/15, mixed 13/15; level 50 counter median 160s. Candidate tuned common 5s rounds, lower boss HP multipliers 9/15/16/15; level 50 remains 9. 10-minute timeout, ~5-minute win goal. Latest full CI pending; previous XP test failure recorded and repaired separately.


RAID-001 c5 test status: head 5a3beb7 website run 46003947892 passed all 186 Node tests, but Chromium smoke failed at line 425 because the injected JS string contained unescaped quotation marks in a numeric CSS attribute selector. Corrected to query the first button in the five-choice raid list (level 10). No gameplay changes. Full current-head CI pending; no merge.
