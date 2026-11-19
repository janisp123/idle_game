# Agent instructions — customize for this project

## Project protocol v1.0 — read before any project action

**Before every project-specific action**, identify the repository and fetch **current remote `main:docs/TD_LIST.md` first**. Then read this file, `docs/WORK_CHECKPOINT.md`, `docs/DECISIONS.md` and relevant instructions; inspect main, open PRs and the actual files. Do not assume old chat context is current.

Names: **Owner** is the final approver; **chat** is regular ChatGPT; **cw** is ChatGPT Work; **codex** is Codex. “I'll ask chat to do it” means regular ChatGPT, not CW or Codex. Do not infer cross-agent handoffs from conversations. Follow `docs/AGENT_PROTOCOL.md`.

A task list entry is not authorization to implement it. For approved changes use small branches and checked PRs; do not merge or publish without owner authorization. Record actual evidence and a durable next step. If files or tools are unavailable, say so rather than guessing.

## Project-specific rules

**Owner: replace this paragraph before beginning implementation.** Write project purpose, core constraints, user privacy and safety rules, platform/release gates, and how to test real behavior. These project-specific rules remain binding and must never be overwritten by a generic template upgrade.
