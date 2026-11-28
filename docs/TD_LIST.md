# Active project tasks

Current work is identified by the task ID and changelog entry on its remote branch or draft PR. Use the checkpoint for verified releases.

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## REPO-CLEANUP-001 — Reconcile obsolete PRs and active task records

- **Goal / acceptance:** Inspect all ten stale PRs against current main; preserve unique unfinished work and historical research by exact references, close obsolete implementation candidates, update live task statuses and next cleanup steps. No source, save, workflow, permission, history or branch deletions in this pass.
- **Status:** DONE — #241 auto-merged 32078b9, final full gate 28/28 and standalone protocol passed; no site change. Ten stale PRs closed; remaining source cleanup under S09. Duplicate CI run had Chromium startup timeout; final browser integrity 5/5.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## S09-RETIRED-ART-001 — Isolate obsolete activity artwork

- **Goal / acceptance:** Archive twelve retired activity paintings outside published site without losing image bytes; prove not used by current or historical fixture activity mappings, scan site/tools static references, retain existing art and browser tests. No gameplay, save or CI changes.
- **Status:** IN_REVIEW — #242 candidate: twelve exact artwork blobs archived outside site (757994 bytes); current/legacy required scene assets retained. Additive archive hash and literal-reference tests; full CI pending.
- **Added by:** chat.
- **Requested by:** Owner (repository cleanup).
- **Implemented by:** Not yet.

## RELEASE-NOTIFY-001 — Published game completion notice

- **Goal / acceptance:** Exactly one event-driven GitHub owner mention per merged playable revision after successful Pages deployment. Include exact SHA, cache-busting play link and deployment run. No intermediate CI spam, direct push or ambiguous PR notices; deduplicate reruns. No external mail secrets or global notification changes. GitHub email/push delivery depends on owner mention settings and must be verified.
- **Status:** PARTIAL — #238 merged e4489db, 28/28 final jobs; Pages run 46161259289 success, bot notice 7241733269 confirmed. Owner receipt/email not yet confirmed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## RELEASE-GATE-001 — Required complete test gate for native auto-merge

- **Goal / acceptance:** One always-present, fail-closed required release check on each internal PR. Preserve existing tests and Pages publishing, require all existing functional and audit workflows for non-research PRs; narrow existing research-only allowlist may run protocol only. Missing, failed, cancelled or unexpected skipped checks block the gate. No write tokens or automatic merge action inside CI; never arm external, stale, overlapping or security-sensitive PRs. Owner must add the new required check and strict up-to-date policy in the existing ruleset before native auto-merge may be used. Test both full and research-only paths.
- **Status:** PARTIAL — #236 merged b08ec6d after two complete 28/28 runs; Pages push 46156612904 passed. Owner activated protocol + release-gate, strict freshness and no bypass, verified via API. Negative PR #239 passed: intentional failing gate, standalone protocol success, actual GitHub merge rejected HTTP 405, main unchanged; closed unmerged. Positive native auto-merge #240 succeeded at 32f0864 with both full 28/28 gates and standalone protocol; Pages 46162460865 and bot notice verified. Research-only integration still pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## STABILIZATION-001 — Whole-game correctness, performance and repository audit

- **Goal / acceptance:** Audit all public systems against current approved behavior, measure runtime and repo bloat, isolate obsolete code safely, fix verified defects in small tested PRs; no new feature scope or history rewrite. [Initial audit and test matrix](mechanics/STABILIZATION_AUDIT_20261128.md). [Sequential execution and non-overlap protocol](mechanics/STABILIZATION_EXECUTION_PLAN.md).
- **Status:** PARTIAL — S00 merged #233 (41f3af7); 14/14 structural saves and four browser scenarios passed. S01 atomic clock fix merged and deployed; remaining fallback/hidden-page audit tracked. [baseline evidence](mechanics/STABILIZATION_BASELINE_RESULTS.md).
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## MAIN-CLASS-SKILLS-001 — One basic automatic skill per main class

- **Goal / acceptance:** Exactly one skill at individual level 20–29; no skill before 20; full specialist kit replaces it at 30; both sides use shared combat rules. No endgame retune.
- **Status:** PARTIAL — merged #231 (9624c14), all seven workflows and 223 tests passed; Pages verified; all-skill runtime coverage pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## STAGED-RECRUITMENT-001 — Race, class and specialization stages

- **Goal / acceptance:** Race only before individual level 20; main class at 20; specialization at 30. Grey locked controls, symmetric arena/tower stages, no new save wipe, preserve frozen legacy sessions, max-only 7v7 calibration unchanged.
- **Status:** PARTIAL — merged #231 (9624c14), all seven workflows and 223 tests passed; Pages verified; natural progression calibration pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.


## RECRUITMENT-001 — Gradual character and specialization unlocks

- **Goal / acceptance:** Seven visible slots at Fighting 1/5/10/15/20/25/30; individual character level 20 unlocks main class, 30 unlocks specialization (STAGED-RECRUITMENT-001). Locked slots neither fight, train nor buy gear; matched enemy count and novice restriction. Max-only 7v7 balance unchanged. Reset all pre-recruitment player saves at the new public save epoch; preserve frozen sessions within the new epoch.
- **Status:** PARTIAL — PR #229 merged 09a38a4; all seven workflows passed, deployed initial 1v1 and visible locked slots verified on 2026-11-28. Full balance calibration pending. Specialization presentation follow-up #230.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## TOWER-001 — Endless Tower and raid qualification

- **Goal / acceptance:** Permanent sequential floor clears unlock existing raids at 10/20/30/40/50. Endless higher floors, existing rewards/blessings, first-clear coins only, frozen deterministic attempts and offline settlement. Preserve earned legacy raid access.
- **Status:** PARTIAL — #228 merged ee6fb5a; current live tower runtime, S05 integrated correctness and calibration pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.


## ARENA-PREFERENCES-001 — Preferred environments

- **Goal / acceptance:** Exactly three starred zones; +10 percentage points per favorite, 24h lock, equal averaging for future PvP, deterministic frozen arena selection and local save/UI.
- **Status:** PARTIAL — #219 merged b4624c1; current #240 browser tests eight visible zones and saving three. Stale #222 closed unmerged; S09 stale-cache and S03 distribution/frozen behavior audit remain; future server anti-cheat separate.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** EIGHT-ARENAS-001.

## ARENA-ELIMINATION-001 — Fight until elimination

- **Goal / acceptance:** Keep 10-second arena cadence, resolve to elimination rather than remaining HP score, bounded safety draw, preserve historical frozen encounters and raid timing, compare max-only compositions across eight environments.
- **Status:** PARTIAL — V10 elimination integrated; current full CI passed. S03 correctness, S07 performance and max-only balance remain; #221 diagnostic archived for current-baseline port.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** CLASS-MASTERY-002; EIGHT-ARENAS-001.

## CLASS-MASTERY-002 — Meaningful class skill progression

- **Goal / acceptance:** Level 1 ability effectiveness 50%, level 50 100%; mastery increases class effect reliability and scaled debuff magnitude without longer hard control, preserve max combat and frozen saves.
- **Status:** PARTIAL — v9 merged #216 (5487e23), 202 tests, seven workflows, 240 exact max parity checks. Deployment verification pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** CLASS-KITS-001, INTERLUDE-CONTROL-001, EIGHT-ARENAS-001.

## EIGHT-ARENAS-001 — Eight tactical environments

- **Goal / acceptance:** Add three meaningful geometry/terrain differences, preserve prior saves and raids, expose all eight through arena selection and analytics, test specialized max-only compositions.
- **Status:** PARTIAL — v8 merged #214 (3d404f1), 200 tests, all seven workflows, 5760 simulations. Broader balance and deployment verification pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** INTERLUDE-CONTROL-001, RANGE-GEOMETRY-001; [plan](mechanics/EIGHT_ARENAS_20261127.md).

## INTERLUDE-CONTROL-001 — Class control and utility

- **Goal / acceptance:** Distinct bounded control and debuffs, revised class identity kits, max-only paired arena tests, frozen-rule compatibility.
- **Status:** PARTIAL — v7 merged #213 (f621853), 197 tests and seven workflows; numerical balance and deployment verification pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** CLASS-KITS-001, RANGE-GEOMETRY-001; [research #212](https://github.com/janisp123/idle_game/pull/212).

## RANGE-GEOMETRY-001 — Ranged engagement geometry

- **Goal / acceptance:** Give ranged compositions real distance-based advantages in open terrain while retaining melee strengths in close quarters, tank aggro and healer priority. No damage inflation or scripted winners.
- **Status:** PARTIAL — v6 merged #211 (938ffc8), 194 tests, seven workflows. Deployment verification and broader balance pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** [Geometry investigation](mechanics/RANGE_GEOMETRY_20261127.md), TANK-AGGRO-001.

## TANK-AGGRO-001 — Tank aggro and healer priority

- **Goal / acceptance:** Living tanks are the primary enemy target; healers prioritize injured tanks in all new group encounters, including raids. Preserve actual movement, range, cooldowns and prior frozen outcomes. Both sides use the same rules.
- **Status:** PARTIAL — v5 merged #209 (87d949f), 191 tests, all seven workflows passed. Balance and live deployment verification pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** RAID-001; individual stats v4.

## RAID-001 — Raid bosses and blessings

- **Goal / acceptance:** Five raids (10/20/30/40/50), unique boss and six minions, tactical resistances, about five minutes for appropriate good team, coins and nonstacking 24-hour +10% Fighting XP, up to +10% damage/defence. Manual start, automatic fight/resume, persisted one-time rewards, mobile raid view.
- **Status:** PARTIAL — full playable raid candidate with saved runs, buffs, coins and mobile UI; CI and duration/balance calibration pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** [Raid implementation plan](mechanics/RAIDS_PLAN.md), individual stats v4.

## INDIVIDUAL-STATS-001 — Six individual character attributes

- **Goal / acceptance:** Individual active fighters train STR, DEX, CON, INT, WIT, MEN; each specialization has unique starting stats and growth weights, no mana or regeneration. No shared account combat stats. Keep tuning modular, no unnecessary abstractions, historical frozen settlement preserved. Specific coefficients provisional.
- **Status:** PARTIAL — public v4 individual stats and UI merged #206 (181 tests, seven workflows); max-only balance pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** [Research](mechanics/CHARACTER_ATTRIBUTE_RESEARCH_20261127.md); [implementation plan](mechanics/INDIVIDUAL_STATS_PLAN.md).

## CLASS-KITS-001 — Automatic class kits

- **Goal / acceptance:** CLASS-KITS-001 — owner approved direction: one passive and two automatic abilities per specialization, no mana or manual skills. [Implementation plan](mechanics/CLASS_KITS_IMPLEMENTATION_PLAN.md) defines all 31 proposed kits, shared scheduler/effects, explicit versioned save compatibility, pilot 10-class family, max-only validation and UI/release gates. All 31 kits implemented and merged in #200; numerical balance and class information follow-up remain open.
- **Status:** PARTIAL — 31/31 kits merged in #200 (f18389e), all seven checks and 175 tests passed. Class info UI merged in #202; full max-only balance postponed for individual-stat redesign. ALPHA-MERGE-001 permits incremental alpha merges.
- **UI follow-up:** CLASS-GUIDE-002 / FANTASY-THEME-001 merged #202, all seven workflows and 175 tests passed; live deployment not verified.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** CLASS-TERRAIN-001 / GROUP-COUNTERS-001 draft PR #200; [plan](mechanics/CLASS_KITS_IMPLEMENTATION_PLAN.md).

## BATTLE-GROUP-001 — Endgame class and composition balance

- **Goal / acceptance:** Seven-character runtime, 31 classes, 10-second fights, button-only manager, independent class gear/XP, adaptive rank and analytics deployed in #198 (9fc6579, Pages 45976758295). Remaining work is maximum-stat, S Masterwork-only tuning, especially ranged stacking (115/120 wins in 5040-bout screen) and counterplay; meaningful terrain differences, class roles and equipment economy. No new mechanics until owner approves. Raw diagnostic PR #198 comment 7215109236; [plan](mechanics/BATTLE_GROUP_IMPLEMENTATION_PLAN.md).
- **Status:** PARTIAL — deployed playable alpha; GROUP-COUNTERS-001 started. BATTLE-GROUP-001 / GROUP-COUNTERS-001 STARTED (owner approval 2026-11-27): natural tactical class counters, shielded tanks resist arrows and protect nearby allies, melee pressure/closing, magic vs heavy armour, healing/support/summoning distinct, terrain and stance matter. No class quotas, forced balanced roster, artificial enemy-only modifiers or material economy. Test maximum stats, S Masterwork and full mastery exclusively. Prior max-only screen 5040 bouts: 7 archers 115W/5L, default 71W/48L/1D, tanks 1W/119L; raw PR #198 comment 7215109236. Candidate coefficients not final. Preserve old frozen bout rules via saved rule version; old offline intervals use old rules, switch after live boundary. No reward/gear price/timing changes. Baseline 1c9e7f5. Branch feature/group-tactical-counters.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (runtime PR #198; balance not complete).

## CLAN-BUILDINGS-001 — Five buildings and weekly local clan raids

- **Goal / acceptance:** Plan #224 approved; all buildings start zero, weekly raids, 480-day minimum construction, actual bonuses and automatic donations.
- **Status:** PARTIAL — #223 merged a038846; five-building local runtime and revised plan present; S06 verification and 50-tier calibration pending. Old plan #224 closed unmerged.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## ALPHA-CLAN-001 — Local Ashen Covenant prototype

- **Goal / acceptance:** Automatic login membership, local treasury, automatic every-tenth positive arena reward contribution; five buildings supersede Academy under CLAN-BUILDINGS-001. No retroactive reward or shared authority; save and mobile tests.
- **Status:** PARTIAL — #223 merged a038846; five-building plan supersedes Academy; current browser tests local membership, registration, five buildings and donation display. S06 correctness pending.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## CLAN-001 — Future coin-only clan development

- **Goal / acceptance:** Future shared clans use coin donations and coin-only improvements; no resource warehouse or material prerequisites. Existing membership/leadership/security research retained; obsolete material-economy sections superseded. Update design before implementation; no live shared clans without approved accounts/server architecture.
- **Status:** BLOCKED — server/account architecture and revised coin-only plan; shared clan runtime blocked; local alpha prototype separately approved in ALPHA-CLAN-001.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## STAFF-001 — Real two-handed magical staff

- **Goal / acceptance:** Owner-approved candidate #226; rebuild against current equipment/class/raid model after stabilization. No loss of earned gear; preserve class identity and tested frozen sessions. Do not merge stale candidate.
- **Status:** TODO — archived unfinished; deferred until stabilization permits.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## TACTIC-INFO-001 — Read-only stance information

- **Goal / acceptance:** Reassess #215 with level-10 stance lock; independent accessible info, current mastery and actual effects, no mutation.
- **Status:** TODO — archived unfinished; S08 UI audit.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## LANDING-ALIGNMENT-001 — Responsive landing alignment

- **Goal / acceptance:** Reassess #220 on current mobile/desktop; preserve artwork, navigation and game behavior.
- **Status:** TODO — archived unfinished; S08 UI audit.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## FORGECALLER-SIEGE-001 — Future siege design

- **Goal / acceptance:** Preserve owner-approved design-only direction from #227; exceptional in future clan warfare without live arena changes. Server-backed clan architecture prerequisite.
- **Status:** BLOCKED — archived design, future server feature.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

Stale PR disposition and exact archived revisions: [repository cleanup ledger](mechanics/REPOSITORY_CLEANUP_20261128.md). Historical balance and class research from #210/#217/#221/#212 remain accessible and are assigned to S03/S10 current-baseline audit.

Historical backlog: [archive](TD_ARCHIVE_20261127.md). Completed task details also remain in Git history and the changelog.


CLASS-TERRAIN-001 approved extension of BATTLE-GROUP-001: Terrain candidate: explicit bow impact/aim penalties in ruins and especially gatehouse; straight narrow bridge remains favorable to clear-line bow shots; dagger close-terrain bonus and padded/leather versus plate matchup, symmetric and applied only to new tactical rules. Added 1080 paired max-only direct dagger-versus-bow/mage/tank battles across five arenas. Fixed legacy symmetry audit's stale source signature match; no test acceptance weakened. 5880 existing max-only matches rerun as well. All class guides and effects are intended tactical identities pending validation, not guaranteed outcomes. No merge yet.


Interlude identity research completed: [31-class source-backed proposal](mechanics/INTERLUDE_CLASS_IDENTITIES_20261127.md); review/approve specific combat changes before implementation.


ALPHA-CLAN-001 update (owner 2026-11-27): automatic donation of every tenth positive whole-coin arena reward after enrollment. No manual donation or daily cap; replaces the candidate 100-coin donation. Zero payouts, defeats, raid prizes, prior wallet and developer grants excluded. Persist reward cursor; apply before equipment spending and keep gross combat analytics, net wallet, and contribution report. Academy costs/bonus remain provisional. Offline settlement uses the same bounded exact fractional payout calculation. First candidate passed 210 unit tests but browser script had duplicate clan variable; corrected. New CI pending.


CLAN-BUILDINGS-001 (owner approved plan #224): candidate replaces temporary Academy with five level-zero buildings, automatic 480-day minimum construction, member capacity, rotating Armoury/Portal bonuses, Bank and Fighting XP, weekly local signup and sequential actual simulated sorties carrying enemy HP across groups. Alpha uses snapshot at registration (server cutoff snapshot later); synthetic allies are based on player progression, no shared data. Personal raid integration, cost/difficulty calibration and independent full 50-tier balance simulation remain pending. Candidate cost = base × target level² (50 Barracks/Bank/Training, 20 Armoury); no measured affordability yet. Cache repair import map incorporated with additional aliases. Tests pending.

TOWER-001 candidate PR #228: permanent sequential tower floors; clear thresholds unlock current personal raids; no additional boss catalog or currency. Individual attempts use existing 10-second group cadence and V10 elimination with fixed deterministic floor opponents; manual next attempt/retry, arena resumes after completion, first-clear coins = 5 × floor. Provisional grade bracket (one per seven floors, capped S) and enemy HP/damage multiplier .35+.021×floor; no numerical balance claim. Legacy access derived from existing successful raid evidence, active blessing/attempt; no invented floor clears. CI and staff branch reconciliation pending.

RECRUITMENT-001 owner clarification (2026-11-28): wipe existing alpha player progress, no grandfathering. Public route uses manager-v2 save and clock keys; old manager/prototype saves and clocks are not migrated and are removed locally after the new valid save commits. Preserve unrelated site storage, source/history and internal historical regression fixtures. Reset occurs when updated game loads on each device; no central player database exists. Browser smoke verifies retired-key cleanup and fresh 1v1. Validation pending.
