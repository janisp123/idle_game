# Active project tasks

Current work is identified by the task ID and changelog entry on its remote branch or draft PR. Use the checkpoint for verified releases.

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## REPO-CLEANUP-002 — Codex execution priority: finish repository hygiene before features

- **Goal / acceptance:** Owner instructs Codex to execute the nine-phase cleanup continuously, using existing evidence instead of restarting research. Freeze features, balance retuning and unrelated work until independent final audit and Owner acceptance. Preserve useful knowledge, exact evidence, current behavior and security. No history rewrite. [Master plan](mechanics/REPOSITORY_CLEANUP_MASTER_PLAN.md).
- **Status:** PARTIAL — #244 handoff merged at `2a5d9e6c`. Codex verified 216 guarded removals, 194 recoverable archive tags and 22 deliberately retained branches. [Manifest](mechanics/REPO_CLEANUP_002_REF_MANIFEST.md), [PR #245](https://github.com/janisp123/idle_game/pull/245). Phase 01 journal merged at `da8d4c7a`. The Owner approved Phase 02, merged as `8053f789`. Phase 03 documentation merged at `5a8e11c4`. Phase 04 library corrections are in [PR #248](https://github.com/janisp123/idle_game/pull/248). Simulation-evidence inventory follows.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

### Execute in order — implementation, not another planning exercise

1. **Preflight:** Fetch latest remote main:TD_LIST first, AGENTS, decisions, checkpoint, open PRs and merge/deployment. Read the master plan, [branch inventory](mechanics/BRANCH_INVENTORY_20261128.md), [exact ancestry/deletion candidates](https://github.com/janisp123/idle_game/pull/243#issuecomment-7242566717), [instruction audit](https://github.com/janisp123/idle_game/pull/243#issuecomment-7242585835). Reuse findings; verify changed facts and destructive-action prerequisites only. #243 and #244 merged. #242 is the latest verified game deployment.
2. **Git hygiene:** Use authenticated local git/gh. All 213 merged PR merge SHAs reachable from audited main; 19 exact branch heads reachable. Recheck remote heads, main ancestry, protection and open PR use. Delete only verified disposable refs using exact-SHA leases. For 194 nonancestor heads, 25 exceptional refs and any new branches, preserve unique work and research in durable reachable refs or main evidence first; verify recovery. Review shared heads, unrelated template histories and closed research separately. No blanket deletion, force-push to main, history rewrite or garbage collection. Record exact SHA, disposition, archival location, verification and deletion manifest.
3. **AI instructions:** Reconcile AGENTS and DECISIONS using saved nine-point audit, latest approved decisions and current code. Preserve rule IDs, security, licensing, research, merge gates, mobile/class/terrain identity and alpha policy. Archive old manual Master, two-character/queue/material economy, obsolete MVP/handoffs and conflicting active labels. Separate governance PR; exact diff for required Owner review/manual checked merge; no native auto-merge for governance changes.
4. **Documentation:** Make WORK_CHECKPOINT concise/current, TD_LIST active, mechanics README current source map. Archive superseded specs, completed tasks and chronological logs via recoverable history/index. Preserve attribution, links and unfinished accepted work. Separate implemented behavior, design and unvalidated balance. Check internal links and eliminate stale candidate instructions.
5. **Knowledge library:** Keep USEFUL_EXAMPLES, BAD_EXAMPLES, RESEARCH_LIBRARY, RESEARCH_MAP, RESEARCH_QUEUE, docs/library, useful class/security/performance research even when not used by game. Correct outdated project-specific assumptions/fit tags; preserve general principles, sources, negative results and optional reading. Consolidate duplicates only without knowledge loss.
6. **Simulation evidence:** Inventory 62 baseline mechanics JSON files (10,659,473 bytes), actual consumers and harnesses. Keep unique results, seeds/configs/commands, baseline revisions, failed cases and reproducible compact summaries. Archive redundant raw outputs with verified recovery via durable main/history/refs; never delete required fixtures or irreplaceable data. Index exact blob/commit references.
7. **Source cleanup:** Trace all public entrypoints, static/dynamic imports, asset references, exported functions and test dependencies. Start with old app.mjs (71,565 bytes), legacy-work-lane, old migration/activities/UI. Separate required test-only code from production; delete only proven obsolete paths. Raid rule 5 still live; preserve shared logic. Prefer clean alpha architecture over disposable legacy compatibility, but no reset without explicit scope, notice and regression. Preserve deterministic current outcomes and no new mechanics.
8. **Website:** Audit HTML/CSS/assets/import map/cache aliases. Remove proven unused items; optimize landing PNG (2,665,574 bytes) only with visual parity. Simplify cache versions with cold/warm and stale-tab tests; check mobile 390px and desktop 1440px, Play Now and actual deployed revision. Measure site bytes separately from browser transfer.
9. **Tests/infrastructure:** Audit stale/duplicate fixtures, workflows and generated files. Preserve all behavioral/security coverage, existing gates and actual engine testing. No weakened tests or permission changes. CI/security/dependency-trust changes require separate Owner review. Run local relevant tests plus full applicable CI per PR, retain failed evidence and fix real defects.
10. **Final gate:** Fresh checkout independent review (Chat or another independent agent if Codex implements), exact before/after branch/file/byte comparisons, active-rule consistency, research recovery, public dependency graph, full CI, deterministic/save/offline and browser smoke, verified Pages deployment. Report blockers and retained exceptions. Owner acceptance before features resume.

### Execution / stop policy

- One implementation PR at a time; read-only parallel investigation allowed. Fresh main, exact file scope, STARTED journal/draft PR, meaningful pushed checkpoints, final reviewed head, full required checks. Auto-merge ordinary approved safe PRs only under existing rules; governance/CI/security/material-risk changes require separate manual approval. Verify merge/deployment before next implementation. No repeated Owner approval for ordinary agreed cleanup.
- Continue after safe completed work. While CI is pending, use local/read-only analysis, persist findings without competing edits. Isolate items needing permission and do independent work within existing rules. Stop only for genuine decision/access, failure of essential checks, conflict or inability to continue safely; report exact blocker and next step. Never claim background work, unrun tests or unverified deletion.
- No broad repeat research, new features, balance retuning, prestige, monetization, PvP/server work or arbitrary progression cap. Preserve current roster/level gates, six attributes, automatic active-choice advancement, coin-only economy, eight environments, ten-second arena, tower/raid/clan, save/reload and frozen offline settlement. No tuning changes unless separately approved reproduced defect.
- Baseline main ea49cec2: 410 tracked files / 19,119,016 bytes; site 5,137,221; docs 12,249,618; 62 mechanics JSON / 10,659,473 bytes; 240 refs at #243 inventory. Use same definitions for comparison; distinguish Git storage, tracked bytes and browser transfer. No arbitrary size target. Record phase status in TD/checkpoint and archive completed blocks in changelog.

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
- **Status:** PARTIAL — V10 elimination merged in #218 (3a3b8bf). S03 correctness, S07 performance and max-only balance remain; #221 diagnostic archived for current-baseline port.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** CLASS-MASTERY-002; EIGHT-ARENAS-001.

## CLASS-MASTERY-002 — Meaningful class skill progression

- **Goal / acceptance:** Level 1 ability effectiveness 50%, level 50 100%; mastery increases class effect reliability and scaled debuff magnitude without longer hard control, preserve max combat and frozen saves.
- **Status:** PARTIAL — v9 merged #216 (5487e23), 202 tests, seven workflows, 240 exact max parity checks. [Pages run 46025265894](https://github.com/janisp123/idle_game/actions/runs/46025265894) succeeded. Current-baseline balance remains open.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** CLASS-KITS-001, INTERLUDE-CONTROL-001, EIGHT-ARENAS-001.

## EIGHT-ARENAS-001 — Eight tactical environments

- **Goal / acceptance:** Add three meaningful geometry/terrain differences, preserve prior saves and raids, expose all eight through arena selection and analytics, test specialized max-only compositions.
- **Status:** PARTIAL — v8 merged #214 (3d404f1), 200 tests, all seven workflows, 5760 simulations. [Pages run 46021258223](https://github.com/janisp123/idle_game/actions/runs/46021258223) succeeded. Broader balance remains open.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** INTERLUDE-CONTROL-001, RANGE-GEOMETRY-001; [plan](mechanics/EIGHT_ARENAS_20261127.md).

## INTERLUDE-CONTROL-001 — Class control and utility

- **Goal / acceptance:** Distinct bounded control and debuffs, revised class identity kits, max-only paired arena tests, frozen-rule compatibility.
- **Status:** PARTIAL — v7 merged #213 (f621853), 197 tests and seven workflows; [Pages run 46019483493](https://github.com/janisp123/idle_game/actions/runs/46019483493) succeeded. Numerical balance remains open.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** CLASS-KITS-001, RANGE-GEOMETRY-001; [research #212](https://github.com/janisp123/idle_game/pull/212).

## RANGE-GEOMETRY-001 — Ranged engagement geometry

- **Goal / acceptance:** Give ranged compositions real distance-based advantages in open terrain while retaining melee strengths in close quarters, tank aggro and healer priority. No damage inflation or scripted winners.
- **Status:** PARTIAL — v6 merged #211 (938ffc8), 194 tests, seven workflows. [Pages run 46018020656](https://github.com/janisp123/idle_game/actions/runs/46018020656) succeeded. Broader balance remains open.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** [Geometry investigation](mechanics/RANGE_GEOMETRY_20261127.md), TANK-AGGRO-001.

## TANK-AGGRO-001 — Tank aggro and healer priority

- **Goal / acceptance:** Living tanks are the primary enemy target; healers prioritize injured tanks in all new group encounters, including raids. Preserve actual movement, range, cooldowns and prior frozen outcomes. Both sides use the same rules.
- **Status:** PARTIAL — v5 merged #209 (87d949f), 191 tests, all seven workflows passed. [Pages run 46011447146](https://github.com/janisp123/idle_game/actions/runs/46011447146) succeeded. Balance remains open.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.
- **Dependencies:** RAID-001; individual stats v4.

## RAID-001 — Raid bosses and blessings

- **Goal / acceptance:** Five raids (10/20/30/40/50), unique boss and six minions, tactical resistances, about five minutes for appropriate good team, coins and nonstacking 24-hour +10% Fighting XP, up to +10% damage/defence. Manual start, automatic fight/resume, persisted one-time rewards, mobile raid view.
- **Status:** PARTIAL — raid foundation merged in #207 (3836a47), with tower qualification integrated in #228. S05 duration, calibration and integrated correctness remain open.
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
- **Dependencies:** CLASS-TERRAIN-001 / GROUP-COUNTERS-001 merged PR #200; [plan](mechanics/CLASS_KITS_IMPLEMENTATION_PLAN.md).

## BATTLE-GROUP-001 — Endgame class and composition balance

- **Goal / acceptance:** Seven-character runtime, 31 classes, 10-second fights, button-only manager, independent class gear/XP, adaptive rank and analytics deployed in #198 (9fc6579, Pages 45976758295). Remaining work is maximum-stat, S Masterwork-only tuning, especially ranged stacking (115/120 wins in 5040-bout screen) and counterplay; meaningful terrain differences, class roles and equipment economy. No new mechanics until owner approves. Raw diagnostic PR #198 comment 7215109236; [plan](mechanics/BATTLE_GROUP_IMPLEMENTATION_PLAN.md).
- **Status:** PARTIAL — playable alpha merged in #198; tactical class counters and kits merged in #200. S03 and S10 own correctness and current max-only calibration. Historical 5040-bout results remain in #198 comment 7215109236. Preserve versioned frozen settlement and the current reward, progression and terrain scope.
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

Historical tasks and candidate handoffs are indexed in the [changelog](CHANGELOG.md#2026-11-28--repo-cleanup-002-phase-03-started) and preserved in the [previous backlog snapshot](https://github.com/janisp123/idle_game/blob/8053f7890154e5fcf728f3a242b14355e9fb1132/docs/TD_LIST.md). Earlier archive: [2026-11-27](TD_ARCHIVE_20261127.md).
