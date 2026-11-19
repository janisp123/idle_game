# Agent instructions — customize for this project

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

**Owner: replace this paragraph before beginning implementation.** Write project purpose, core constraints, user privacy and safety rules, platform/release gates, and how to test real behavior. These project-specific rules remain binding and must never be overwritten by a generic template upgrade.
