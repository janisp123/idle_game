# Active project tasks

Current work is identified by the task ID and changelog entry on its remote branch or draft PR. Use the checkpoint for verified releases.

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## ARENA-ONLY-001 — Coins and combat XP only

- **Goal / acceptance:** ARENA-ONLY-001 — Owner approved 2026-11-27: remove noncombat progression, gathering, crafting, materials, inventories and tributes from public gameplay. Coins earned in combat and XP/stat progression from fighting only; equipment and future clan donations use coins. XP continues on defeats (existing productive combat/recovery rules). No clan implementation. Preserve coins, class builds, frozen combat, analytics, already earned attributes and historical skill bonuses; archive legacy resource mechanics for regression only. Existing material balances removed with no conversion; old noncombat levels frozen, not displayed or claimed. No changes to combat balance or gear prices. Baseline 9fc6579 / PR #198 deployed via 45976758295; ranged stack imbalance 115/120 in max screen remains separate. Branch feature/arena-only; STARTED, not tested.
- **Status:** IN_REVIEW — 42b87e8 passed seven workflows and 157 tests; cleanup revision pending final CI. PR #199.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## BATTLE-GROUP-001 — Endgame class and composition balance

- **Goal / acceptance:** Seven-character runtime, 31 classes, 10-second fights, button-only manager, independent class gear/XP, adaptive rank and analytics deployed in #198 (9fc6579, Pages 45976758295). Remaining work is maximum-stat, S Masterwork-only tuning, especially ranged stacking (115/120 wins in 5040-bout screen) and counterplay; meaningful terrain differences, class roles and equipment economy. No new mechanics until owner approves. Raw diagnostic PR #198 comment 7215109236; [plan](mechanics/BATTLE_GROUP_IMPLEMENTATION_PLAN.md).
- **Status:** PARTIAL — deployed playable alpha; numerical balance unfinished.
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
