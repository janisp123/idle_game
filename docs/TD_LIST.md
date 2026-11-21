# Active project tasks

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## GAME-004 — Three-phase activity switching and bounded five-slot queue
- **Goal:** Each activity has an explicit Start button. After a current full work cycle finishes, the character moves and prepares before starting the next activity. Players may schedule up to **five activities total**: each nonfinal task runs for **1–8 hours or 1–8 days**; **the final task always runs forever**, without queue looping or offline expiry.
- **Acceptance criteria (switching):** Show a distinct transition progress bar and phase labels **Finishing current activity → Moving to new location → Getting ready to start new activity**. Existing work finishes once; travel/preparation grant no production; five-minute cross-zone travel remains binding; all transitions persist and settle offline without per-action replay. Do not show time countdowns.
- **Acceptance criteria (queue):** A finite linear queue, at most five positions including the final indefinite task; Start → Do it for supports discrete 1–8 Hours / Days or Forever on the final task. Other tasks expire based on productive work time (excluding travel/preparation), finish their current full cycle, and automatically advance. No end-of-queue stop, login requirement, or resource fabrication. Process all elapsed offline segments in bounded time using the last saved effective skill snapshot (OFF-001), preserving current save data, inventory protection, and reward idempotency. Explicit duration configuration is allowed; live timers remain prohibited.
- **Specs:** [ACTIVITY_SWITCH_SPEC.md](ACTIVITY_SWITCH_SPEC.md) and [ACTIVITY_QUEUE_SPEC.md](ACTIVITY_QUEUE_SPEC.md). **Design/specification only: neither feature is yet implemented.** Earlier looping queue ideas are superseded by the Forever-last rule.
- **Status:** TODO (owner-approved behavior/specs. Blocked on exact same-zone travel, preparation duration and queue/pending-target edit rules before complete playable integration).
- **Dependencies:** GAME-003, OFF-001, ZONE-001, UI-TIME-001, ACT-SWITCH-001, QUEUE-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.

## GAME-006 — Skill-gated probabilistic encounters and resources
- **Goal:** Progress hunting, mining, gathering and processing outcomes within a single activity; players never manually choose creature, vein or ore quality.
- **Acceptance criteria:** Data-driven level thresholds and probability weights; low-tier results remain available; higher tiers grow more likely with relevant skill levels; crafting requires and consumes real inventory ingredients, with protections against unwanted ingredient use; encounter difficulty respects combat ability; offline resolution uses frozen skill levels and scales over long absences; deterministic balance and rarity tests.
- **Status:** PARTIAL (PR #43 merged skill-weighted raw loot; PR #44 merged protected-ore Smelting; PR #54 merged ingredient-consuming Alchemy, Carpentry, Masonry and Cooking. Actual combat, encounter difficulty/risk and calibrated probability balancing are still not implemented).
- **Dependencies:** GAME-005, OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** chat (partial work merged in PRs #43, #44 and #54; combat and balance work remain).

## GAME-009 — Reversible race transformation design and implementation
- **Goal:** Eventually support one character beginning Human, able to become Undead and return to Human via resource-consuming rituals; no permanent race lock.
- **Acceptance criteria:** Race is distinct from class/profession and independent skills; ritual requires resources and roughly six cumulative days of actual ritual work (provisional), split freely across sessions; progress is saved indefinitely through breaks and unrelated activities; repeat transformations are possible, including reversal; no alts or permanently inaccessible skills; account/change-limit implications, exact costs, race effects, and offline ritual progression must be designed and approved before implementation.
- **Status:** BLOCKED (design agreed; implementation details and dependencies not yet decided).
- **Dependencies:** CHAR-001, OFF-001, future account/character persistence.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.
