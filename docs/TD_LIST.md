# Active project tasks

Current work is identified by the task ID and changelog entry on its remote branch or draft PR. Use the checkpoint for verified releases.

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## CLASS-KITS-001 — Automatic class kits

- **Goal / acceptance:** CLASS-KITS-001 — owner approved direction: one passive and two automatic abilities per specialization, no mana or manual skills. [Implementation plan](mechanics/CLASS_KITS_IMPLEMENTATION_PLAN.md) defines all 31 proposed kits, shared scheduler/effects, explicit versioned save compatibility, pilot 10-class family, max-only validation and UI/release gates. Plan only; no runtime changes or new tests run. Existing #200 terrain candidate 04f3acf all seven checks/163 tests passed; dagger/tank counter defect still open. Next: shared registry and scheduler plus old-rule dispatch. Exact candidate effects and numbers require validation, no release approval inferred.
- **Status:** IN_REVIEW — 31/31 candidate kits; support 173 tests/browser passed; batch E pending CI, full balance and guide pending.
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
