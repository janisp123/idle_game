# Active project tasks

Current work is identified by the task ID and changelog entry on its remote branch or draft PR. Use the checkpoint for verified releases.

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## INDIVIDUAL-STATS-001 — Six individual character attributes

- **Goal / acceptance:** Individual active fighters train STR, DEX, CON, INT, WIT, MEN; each specialization has unique starting stats and growth weights, no mana or regeneration. No shared account combat stats. Keep tuning modular, no unnecessary abstractions, historical frozen settlement preserved. Specific coefficients provisional.
- **Status:** PARTIAL — stage 1 merged #204 (177 tests); stage 2 individual training ledger and migration candidate; v4 combat, UI and max-only balance pending.
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
