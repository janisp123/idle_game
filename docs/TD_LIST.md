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
- **Status:** PARTIAL (PR #43 merged skill-weighted raw loot; PR #44 merged input-limited Smelting and protected ores. Alchemy/carpentry/masonry/cooking still produce placeholder goods without ingredients, and actual combat/encounter risk is not implemented).
- **Dependencies:** GAME-005, OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** chat (partial work in PRs #43 and #44; remaining scope not yet implemented).

## UI-002 — Compact mobile activity category navigation
- **Goal:** Replace the long 20-task selector with Activities → Honest Work / Outlaw Path / Clan Activities / Other Activities → activity selection.
- **Acceptance criteria:** first screen stays compact; category buttons show only matching tasks; Clan and Other remain honest empty placeholders until implemented; visible Back controls work at each level without changing the ongoing task; selecting a task starts it and collapses the picker; mobile portrait touch targets and keyboard focus are usable; no save format change; browser smoke tests cover navigation.
- **Status:** IN_REVIEW (owner-approved implementation, pending PR checks).
- **Dependencies:** Existing 20-activity UI.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet (pending verified merge).

## GAME-008 — Training and tavern activities; forty independent skills
- **Goal:** Add ten personal training/knowledge activities and ten social/leisure activities without forcing mastery of every skill.
- **Acceptance criteria:** Forty independent skill tracks, no global character level or competitive ranking; ten Training & Knowledge and ten Tavern & Leisure actions, selectable in the nested mobile menu; these actions award skill XP only and never fabricate physical inventory; offline progression remains unlimited with frozen effective levels until return; old saves gain missing skills safely; no player-facing timers; top-left cross replaced by a grimdark skull crest.
- **Status:** IN_REVIEW (owner-approved feature branch; PR checks pending).
- **Dependencies:** GAME-005, UI-002, OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet (pending verified merge).
- **Art note:** Existing scene paintings reused for new training/leisure tasks temporarily; dedicated 20 illustrations not yet created.

## GAME-009 — Reversible race transformation design and implementation
- **Goal:** Eventually support one character beginning Human, able to become Undead and return to Human via resource-consuming rituals; no permanent race lock.
- **Acceptance criteria:** Race is distinct from class/profession and independent skills; ritual requires resources and roughly six cumulative days of actual ritual work (provisional), split freely across sessions; progress is saved indefinitely through breaks and unrelated activities; repeat transformations are possible, including reversal; no alts or permanently inaccessible skills; account/change-limit implications, exact costs, race effects, and offline ritual progression must be designed and approved before implementation.
- **Status:** BLOCKED (design agreed; implementation details and dependencies not yet decided).
- **Dependencies:** CHAR-001, OFF-001, future account/character persistence.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.
