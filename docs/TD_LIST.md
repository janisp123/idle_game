# Active project tasks

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## GAME-002 — Painted grimdark game interface
- **Goal:** Implement the owner-approved dark-fantasy interface direction in real responsive HTML/CSS rather than baking a screenshot into the UI.
- **Acceptance criteria:** preserve Hunting, Mining, browser saves, unlimited offline catch-up, Play Now, accessibility and existing game-engine behaviour; use an ornate, consistent iron/parchment/crimson skin with central artwork, character and action controls, resources and progress rail, and a readable chronicle. Register a durable visual language guide for future art and UI updates.
- **Art:** The owner-approved grimdark paintings have been uploaded to the branch as original, local 960×540 WebP assets (`hunting.webp`, `mining.webp`), with matching verified Git blob checksums; the poor-quality SVG placeholders were removed. Both assets are served locally by the game and verified by the site workflow.
- **Status:** IN_REVIEW (branch; awaiting checks and owner merge approval).
- **Dependencies:** SITE-001, OFF-001, MVP-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-20).
- **Implemented by:** Not yet (pending verified merge and live deployment).

## SITE-003 — Painted 6–6–6 gate on landing page
- **Goal:** Replace the flat CSS-drawn hero with the owner-selected grimdark gate painting, retaining all website/game navigation.
- **Acceptance criteria:** Original approved image is included as a self-hosted asset, shown uncropped on desktop and phone, with meaningful alt text reflecting skulls and three sixes; no broken links; GitHub Pages validation passes; preserve the working Play Now and new-tab GitHub/Discord links.
- **Status:** IN_REVIEW (PR pending; not yet deployed).
- **Dependencies:** SITE-001, SITE-002, DICE-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet (pending verified integration into main).

## GAME-003 — Slower full-cycle work and ten foundational activities
- **Goal:** Replace implausibly fast single-strike rewards with complete work cycles; expose ten manually selectable basic activities using data-driven timing.
- **Acceptance criteria:** hunting, mining, woodcutting, gathering, fishing, smelting, potion making, carpentry, masonry and cooking; adjustable base durations and speed multipliers; old local saves preserved; offline settlement remains O(1), uncapped, and levels activate on return; no fabricated crafting input consumption.
- **Status:** IN_REVIEW (PR pending checks and owner merge approval).
- **Dependencies:** OFF-001, MVP-001, SITE-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet (pending verified integration).

## GAME-004 — Zone travel and five-task repeating queue
- **Goal:** Add actual zones, five-minute zone changes, and up to five configurable repeating activities.
- **Acceptance criteria:** each zone change costs five real minutes; queue can loop or end in ongoing work; offline calculations handle zone travel and queued transitions without an offline cap; work stops appropriately on unavailable ingredients; test with long absences.
- **Status:** TODO (explicitly deferred by Owner until after the ten-task prototype).
- **Dependencies:** GAME-003.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.

## UI-001 — Remove all timing and detailed return metrics from gameplay
- **Goal:** Keep pacing hidden: activity name and obtainable resource only, plus visual progress bar; no timers, duration labels, rates, action-count statistics or elapsed-time reports in the game UI.
- **Acceptance criteria:** no time displayed on activity buttons, scene or chronicle; remove visible test-day and time-worked widgets; simple return report lists only gathered resources; continue saving and settling offline without any time cap; automatic site checks prevent regression.
- **Status:** IN_REVIEW (expanded PR #38; awaiting owner merge approval).
- **Dependencies:** SITE-001, OFF-001, GAME-003.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet (pending verified integration).
