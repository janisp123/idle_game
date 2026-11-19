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

**Dual purpose (approved by Owner, 2026-11-19):** This public repository is both the development home of an original browser-based idle RPG **and** an educational reference library on browser-game engineering, including systems not intended for our game.

**Before research/library work:** After the mandatory remote `main:docs/TD_LIST.md` preflight, read `docs/RESEARCH_LIBRARY.md`, `docs/USEFUL_EXAMPLES.md`, and any relevant `docs/library/` articles. Label each documented technique's fit for **our game** independently from its general educational value; keep `[OUR-GAME: NOT-FIT]` examples available to other developers.

**Research integrity:** Link exact external GitHub sources and checked dates; distinguish actual source-code inspection, documentation claims, observed gameplay, own hypotheses, and reproducible tests. Do not assert that the internal workings of proprietary games such as Idle Clans or Legends of IdleOn are known from gameplay alone. Verify licenses and third-party assets independently; do not copy code or artwork with unclear rights. Avoid fake tests, unsupported performance claims, secrets, private conversations and personal data in this public repository.

**Project-specific design boundaries:** Mobile-first portrait UI, original grimdark static illustration, small initial stone-mining and bunny-hunting activities, simple repeatable activity automation, uncapped long-term offline progression, cheap dormant-account calculations, and optional asynchronous 20-player groups as recorded in `docs/BRAINSTORM.md`. Do not let reference implementations' short offline caps, real-time server loops or daily-login pressure silently override the owner's goals.

**Scope & release:** The library can freely study systems we may never implement. Neither brainstorming nor research implies owner approval to code. Keep project tasks only in `docs/TD_LIST.md`; follow branch/PR approval rules before modifications, merging, deployment or release. Before building a feature, require owner-approved scope, tests for correct offline/group/reward handling, server authority and mobile behavior, and a documented privacy/security plan. These project-specific rules supersede generic template advice when they conflict.
