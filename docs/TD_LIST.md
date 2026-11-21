# Active project tasks

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## GAME-004 — Three old-wagon activity queue and timed switching
- **Goal:** Replace instant switching with an activity **Start** button, then display up to **three small connected old wagons above the current activity panel**. Wagon 1 is current work (or imminent destination during a transition); the **last wagon always runs Forever**, including with one wagon. Earlier wagons have **Do it for** 1–8 hours or 1–8 days. Drag/swap wagon order; changing wagon 1 triggers fresh travel and preparation, whereas future-only swaps are free.
- **Acceptance criteria (switching):** An activity change finishes its current full work cycle once, then displays a separate progress bar with **Finishing current activity → Moving to new location → Getting ready to start new activity**. Movement costs **1 minute** within the same zone or **5 minutes** between zones, plus **2 minutes** to prepare, including first-ever Start (skip travel when starting location is unknown). Switching is real time, offline safe and never invents resource/XP. Swapping a different wagon into slot 1 restarts movement/preparation even mid-transition, without resetting the unfinished old cycle or discarding earned progress. No live clocks/countdowns.
- **Acceptance criteria (queue):** One to three wagons only; last position unconditionally Forever. Finite **1–8 hour/day** duration counts productive work after preparation, never travel; once it ends, finish the current full work cycle before changing. When **Do it for** is set on a running activity, count its duration from that edit. Future reorder/edits have no immediate travel penalty and never rewrite past results. No loop or offline cap; replay finite segments then settle the final activity in one bounded batch with frozen effective skill levels (OFF-001) and chronological resource protection. Save/migrate safely, avoid duplicate rewards, work without daily login for decades.
- **Early-alpha temporary timing override (ALPHA-TIME-001):** For hands-on testing, all activities have **10-second full cycles**; movement **5 seconds** plus preparation **5 seconds** for all inter-activity changes, after finishing one old work cycle; first-ever Start is 10-second preparation. The switching bar is **grey/steel**, distinct from productive work. Normal 1-/5-minute movement and 2-minute preparation, plus original long cycles, stay recorded for restoration. Preserve old saves with profile-aware progress migration; never introduce live countdowns.
- **Specs:** [ACTIVITY_SWITCH_SPEC.md](ACTIVITY_SWITCH_SPEC.md), [ACTIVITY_QUEUE_SPEC.md](ACTIVITY_QUEUE_SPEC.md), owner decisions QUEUE-002 / SWITCH-TIMING-001. **Manual activity switching deployed in PR #60; the three-wagon queue is not implemented.**
- **Status:** PARTIAL — manual Start buttons, three-phase finishing/moving/preparing progressbar, 1/5-minute travel, 2-minute preparation, offline settlement and compatible saves merged in PR #60 and verified on the live page (main Pages run 44901535752). The three-wagon scheduler, timed duration controls, reordering and related UI remain TODO.
- **Dependencies:** GAME-003, OFF-001, ZONE-001, UI-TIME-001, ACT-SWITCH-001, QUEUE-002, SWITCH-TIMING-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** chat (manual switching in merged PR #60; wagon queue not yet).


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
