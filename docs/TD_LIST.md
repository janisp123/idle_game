# Active project tasks

Current work is identified by the task ID and changelog entry on its remote branch or draft PR. Use the checkpoint for verified releases.

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## CLASS-MASTERY-002 — Meaningful class skill progression

- **Goal / acceptance:** Level 1 ability effectiveness 50%, level 50 100%; mastery increases class effect reliability and scaled debuff magnitude without longer hard control, preserve max combat and frozen saves.
- **Status:** IN_REVIEW — v9 candidate; tests pending.
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

## CLAN-001 — Future coin-only clan development

- **Goal / acceptance:** Future shared clans use coin donations and coin-only improvements; no resource warehouse or material prerequisites. Existing membership/leadership/security research retained; obsolete material-economy sections superseded. Update design before implementation; no live shared clans without approved accounts/server architecture.
- **Status:** BLOCKED — server/account architecture and revised coin-only plan; no clan runtime approved in current change.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

Historical backlog: [archive](TD_ARCHIVE_20261127.md). Completed task details also remain in Git history and the changelog.


CLASS-TERRAIN-001 approved extension of BATTLE-GROUP-001: Terrain candidate: explicit bow impact/aim penalties in ruins and especially gatehouse; straight narrow bridge remains favorable to clear-line bow shots; dagger close-terrain bonus and padded/leather versus plate matchup, symmetric and applied only to new tactical rules. Added 1080 paired max-only direct dagger-versus-bow/mage/tank battles across five arenas. Fixed legacy symmetry audit's stale source signature match; no test acceptance weakened. 5880 existing max-only matches rerun as well. All class guides and effects are intended tactical identities pending validation, not guaranteed outcomes. No merge yet.


Interlude identity research completed: [31-class source-backed proposal](mechanics/INTERLUDE_CLASS_IDENTITIES_20261127.md); review/approve specific combat changes before implementation.
