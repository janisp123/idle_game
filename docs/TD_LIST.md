# Active project tasks

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## GAME-004 — Zone travel and five-task repeating queue
- **Goal:** Add actual zones, five-minute zone changes, and up to five configurable repeating activities.
- **Acceptance criteria:** each zone change costs five real minutes; queue can loop or end in ongoing work; offline calculations handle zone travel and queued transitions without an offline cap; work stops appropriately on unavailable ingredients; test with long absences.
- **Status:** TODO (explicitly deferred by Owner until after the ten-task prototype).
- **Dependencies:** GAME-003.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** chat (partial work in PRs #43 and #44; remaining scope not yet implemented).


## GAME-006 — Skill-gated probabilistic encounters and resources
- **Goal:** Progress hunting, mining, gathering and processing outcomes within a single activity; players never manually choose creature, vein or ore quality.
- **Acceptance criteria:** Data-driven level thresholds and probability weights; low-tier results remain available; higher tiers grow more likely with relevant skill levels; crafting requires and consumes real inventory ingredients, with protections against unwanted ingredient use; encounter difficulty respects combat ability; offline resolution uses frozen skill levels and scales over long absences; deterministic balance and rarity tests.
- **Status:** PARTIAL (PR #43 merged skill-weighted raw loot; PR #44 merged input-limited Smelting and protected ores. Alchemy/carpentry/masonry/cooking still produce placeholder goods without ingredients, and actual combat/encounter risk is not implemented).
- **Dependencies:** GAME-005, OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.
