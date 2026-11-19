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

**Public research privacy and independence:** Before research work, read `docs/RESEARCH_LIBRARY.md`, `docs/USEFUL_EXAMPLES.md` and relevant `docs/library/` pages after the mandatory TD preflight. **Do not publish the names of reference games, external research destinations, or URLs identifying repositories or sites consulted.** Present accurate, independently authored descriptions of general engineering techniques, alternatives, costs and risks; use original pseudocode rather than copied third-party code. Never claim the internals of any outside game are verified from gameplay alone, and never invent results or provenance.

**Copyright boundary:** No third-party source code or artwork may be copied into this repo merely to avoid attribution. If actual third-party components are ever incorporated, the project must follow applicable licenses and retain all legally required notices. Either attribute as required for incorporated material or avoid incorporating it; never misrepresent copied work as independently created.

**Public library tags:** The general educational usefulness of an approach is **independent** of its fit for our own design. Use `[OUR-GAME: FIT]`, `[OUR-GAME: ADAPT]`, `[OUR-GAME: NOT-FIT]` or `[OUR-GAME: UNDECIDED]`; mark design-only versus prototyped/tested/benchmarked claims accurately. Preserve valuable patterns even when `NOT-FIT` for us.

**Game boundaries (design, not coding authorization):** Our planned game prioritizes original grimdark static artwork, mobile portrait UX, stone mining and bunny hunting initially, a small task queue, no offline time cap or daily-login pressure, low-cost dormant-account settlement, and optional asynchronous groups. `docs/BRAINSTORM.md` contains the living design notes.

**Scope and release:** Research and brainstorming do not authorize code. Keep actual authorized tasks only in `docs/TD_LIST.md`; use branches and pull requests, tests, owner review and approval for implementation and releases. Before gameplay launches, plan authentication, authoritative server state, data safety, anti-cheat, migration, long-term offline correctness, group settlement and mobile performance. Protect user data and secrets in this public repository.
