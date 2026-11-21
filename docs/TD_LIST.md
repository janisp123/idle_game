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
- **Implemented by:** Not yet.


## GAME-006 — Skill-gated probabilistic encounters and resources
- **Goal:** Progress hunting, mining, gathering and processing outcomes within a single activity; players never manually choose creature, vein or ore quality.
- **Acceptance criteria:** Data-driven level thresholds and probability weights; low-tier results remain available; higher tiers grow more likely with relevant skill levels; crafting requires and consumes real inventory ingredients, with protections against unwanted ingredient use; encounter difficulty respects combat ability; offline resolution uses frozen skill levels and scales over long absences; deterministic balance and rarity tests.
- **Status:** PARTIAL (five raw gathering skills have weighted loot in merged PR #43; inventory-limited smelting with resource protection is in review; other processing and actual combat remain TODO).
- **Dependencies:** GAME-005, OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.


## GAME-006A — Skill-weighted gathering rewards (first slice of GAME-006)
- **Goal:** Keep one activity per skill while unlocking rarer resource drops from higher effective skill levels.
- **Acceptance criteria:** data-driven tier tables for hunting, mining, gathering, woodcutting and fishing; no manual resource targeting, low-tier stays obtainable, high-tier gates by skill, variable batch rewards conserve total quantity, unlocked drops shown in activity menu; no timing displays; save backward compatibility; 100-year offline batch handled without per-action replay and frozen skill effectiveness; deterministic tests.
- **Status:** IN_REVIEW (feature PR; checks and automatic merge readiness gate apply).
- **Dependencies:** GAME-005, OFF-001, UI-TIME-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet (pending verified merge).

## GAME-006B — Auto-smelting from inventory, with optional protected ore
- **Goal:** Make Smelting choose from actually available ores according to its own skill level, without player micro-selection.
- **Acceptance criteria:** no ore means zero ingots and XP; copper at skill 1, iron at 10, silver at 25; one ore consumed per ingot; no negative stock or unavailable material production; protected ore never consumed; save protections backward-compatible; offline catch-up bounded independently of time away and uses frozen skill; UI reports created goods only, with no timers.
- **Status:** IN_REVIEW (PR pending automatic merge readiness check).
- **Dependencies:** GAME-006A, GAME-005, OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet (pending verified integration).
