# Agent instructions — Idle Game and public research library

## Project protocol v1.0 — read before any project action

**Before every project-specific action**, identify the repository and fetch **current remote `main:docs/TD_LIST.md` first**. Then read this file, `docs/WORK_CHECKPOINT.md`, `docs/DECISIONS.md` and relevant instructions; inspect main, open PRs and the actual files. Do not assume old chat context is current.

Names: **Owner** is the final approver; **chat** is regular ChatGPT; **cw** is ChatGPT Work; **codex** is Codex. “I'll ask chat to do it” means regular ChatGPT, not CW or Codex. Do not infer cross-agent handoffs from conversations. Follow `docs/AGENT_PROTOCOL.md`.

A task list entry is not authorization to implement it. For approved changes use small branches and checked PRs; do not merge or publish without owner authorization. Record actual evidence and a durable next step. If files or tools are unavailable, say so rather than guessing.

## Owner command convention — "continue" (2026-11-18)

This applies to project work by **chat**, **cw** and **codex**, including after a tool or usage-limit interruption. The phrase is not automatic authorization to code:

- **"Continue" (alone): READ-ONLY preflight.** Fetch current remote `main:docs/TD_LIST.md` first, read this file, checkpoint, decisions, relevant evidence and open PRs; identify the last verified state and any conflicts. Reply with the specific task/ID, what was completed, what remains, the smallest next change, tests/risks and **"Should I proceed?"** Do **not** modify files, create branches/PRs, commit, merge, publish or perform external actions until the Owner answers.
- **"Continue and implement":** The Owner explicitly authorizes execution of an already-approved, clearly identified scope. Still do the full preflight, check conflicts and proceed only with previously approved decisions; stop to request approval for new choices, changed scope, ambiguous repository/task, destructive actions, merges or releases requiring separate approval.
- **"Check status":** Read-only status report; no implementation and no approval question required unless an ambiguity prevents a meaningful answer.
- If the project or task is ambiguous, ask which one; do not invent a handoff. Usage limits resetting never trigger automatic work.

## Project-specific rules

**Dual purpose (approved by Owner, 2026-11-19):** The public repository is both our original idle browser-game project and a broadly useful engineering library about browser games, including techniques we will not use ourselves.

**Public research privacy and independence:** Before research work, read `docs/RESEARCH_LIBRARY.md` and the short index and **only relevant sections** of `docs/USEFUL_EXAMPLES.md` after the mandatory TD preflight; read `docs/library/` pages only for the task at hand. **Do not publish the names of reference games, external research destinations, or URLs identifying repositories or sites consulted.** Present accurate, independently authored descriptions of general engineering techniques, alternatives, costs and risks; use original pseudocode rather than copied third-party code. Never claim the internals of any outside game are verified from gameplay alone, and never invent results or provenance.

**Codex/research reading discipline (2026-11-20):** After the mandatory project preflight, for combat/offline work read the short **"Combat/offline handoff"** at the top of `docs/brainstorm/ARCHITECTURE_AND_BALANCING.md`. Then open `docs/brainstorm/SOLO_COMBAT.md`, `docs/brainstorm/AUTOMATION_AND_OFFLINE.md` or `docs/brainstorm/OPEN_QUESTIONS.md` **only as the specific task requires**. The research catalogue `docs/USEFUL_EXAMPLES.md` is an **on-demand reference**, not a second specification or required whole-file read: P17 = basic combat functions, P18 = offline estimator options, P01/P02/P03/P15/P16 = selected supporting patterns. `[OUR-GAME: FIT]` describes suitability, **not approval**. Never select features or formulas solely because they appear in a code example, and never implement from a brainstorm entry without approved scope in `docs/TD_LIST.md`. For deeper source inspection, ask for the owner's separate private source index rather than inventing source provenance or publishing research URLs here.

**Copyright boundary:** No third-party source code or artwork may be copied into this repo merely to avoid attribution. If actual third-party components are ever incorporated, the project must follow applicable licenses and retain all legally required notices. Either attribute as required for incorporated material or avoid incorporating it; never misrepresent copied work as independently created.

**Public library tags:** The general educational usefulness of an approach is **independent** of its fit for our own design. Use `[OUR-GAME: FIT]`, `[OUR-GAME: ADAPT]`, `[OUR-GAME: NOT-FIT]` or `[OUR-GAME: UNDECIDED]`; mark design-only versus prototyped/tested/benchmarked claims accurately. Preserve valuable patterns even when `NOT-FIT` for us.

**Owner-approved offline advancement rule (OFF-001; 2026-11-20):** The character's effective stats, skill levels and combat equipment are **frozen for the entire absence** at their last saved online snapshot. Offline actions earn XP and rewards, but **level-ups, stat increases, perk unlocks and other progression-based effectiveness changes activate only when the player returns/logs in**, after offline progress is settled. **Never recalculate offline fighting efficiency due to earned XP thresholds.** Still handle real-world changes such as queued activity/resource depletion or group expiry where applicable. External examples discussing mid-offline level-ups are not our product rule. See `docs/DECISIONS.md` OFF-001.

**Game boundaries (design, not coding authorization):** Our planned game prioritizes original grimdark static artwork, mobile portrait UX, stone mining and bunny hunting initially, a small task queue, no offline time cap or daily-login pressure, low-cost dormant-account settlement, and optional asynchronous groups. `docs/BRAINSTORM.md` contains the living design notes.

**Scope and release:** Research and brainstorming do not authorize code. Keep actual authorized tasks only in `docs/TD_LIST.md`; use branches and pull requests, tests, owner review and approval for implementation and releases. Before gameplay launches, plan authentication, authoritative server state, data safety, anti-cheat, migration, long-term offline correctness, group settlement and mobile performance. Protect user data and secrets in this public repository.
