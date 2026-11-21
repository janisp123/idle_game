# Shared AI project protocol — v1.0

**Owner-approved 2026-11-18.** This convention governs coordination; project-specific privacy, product and release rules in `AGENTS.md` still apply.

## Fixed paths and single source of truth

- `AGENTS.md`: mandatory project rules.
- `docs/TD_LIST.md`: **only active backlog**; the version on remote `main` is authoritative.
- `docs/WORK_CHECKPOINT.md`: current verified state, revision, blockers and next action.
- `docs/CHANGELOG.md`: verified completed work.
- `docs/DECISIONS.md`: approved durable owner decisions, including superseding history.
- `docs/PROJECT_PLAYBOOK.md`: reusable lessons, not tasks.
- `docs/AGENT_PROTOCOL.md`: shared convention.

## Required preflight for every project-specific request

1. Identify repository/branch and **fetch current remote `main:docs/TD_LIST.md` first**, including before task edits, status checks, implementation, publication or delegation. If unavailable, report this; do not act from a stale backlog.
2. Read `AGENTS.md`, checkpoint, decisions, relevant project rules, latest main revision, implementation and overlapping PRs. Unmerged work is **PENDING PR**, not a completed task on main.
3. Confirm task ID, authorization, dependencies and conflicts. A listed task or discussion does not authorize implementation; the Owner decides direction and approvals.
4. For approved writes, use a fresh main-based branch, a small testable scope and checked PR. Never bypass protection or merge/publish without authorization; the narrowly scoped standing research-docs approval in `AGENTS.md` counts only for its explicit paths and gates.
5. After verification, record exact files, branch, commit/PR, checks (PASS/FAIL/NOT RUN), blockers and one next action. Change TD completion state only after integration and main readback. Keep local, PR, merged and deployed states distinct.

Read-only queries do not need a new branch. Never claim an unavailable action happened or another agent is working in the background.

## Owner command semantics — "continue" (approved 2026-11-18)

These commands apply to project work across **chat**, **cw** and **codex**. A lone "continue" does not override preflight, approvals, or product/release safeguards.

| Owner message | Required behavior |
| --- | --- |
| **Continue** | **READ ONLY.** Fetch current remote `main:docs/TD_LIST.md` first; read `AGENTS.md`, checkpoint, decisions, latest code/commits and relevant open PRs. State the exact last verified task/ID, completed versus pending work, planned smallest next change, tests, risks and blockers. Ask **"Should I proceed?"**. Do not edit any files, create branches/PRs, commit, push, merge, deploy, publish or take external actions before a reply. |
| **Continue and implement** | After the same preflight, proceed within the owner's **previously approved scope** only; stop for new decisions, uncertainty, scope changes, risky/destructive action, merges or releases that separately require permission. |
| **Check status** | Read-only facts; do not implement or prompt for execution approval unless clarification is needed to identify the project. |

If multiple repositories/tasks could match, identify the ambiguity instead of guessing. A usage-limit reset does not create a background job or authorize an agent to resume automatically. These meanings apply to project coordination; ordinary requests to continue writing non-project text are unaffected.

## Agent names and task attribution

**Owner** = human final approver. **chat** = regular ChatGPT. **cw** = ChatGPT Work. **codex** = Codex. “I'll ask chat” refers to chat only.

For new tasks, `Added by` means who **actually saved the task** (chat/cw/codex/Owner); optional `Requested by` records the owner. `Implemented by` requires verified code and commit evidence; do not guess or rewrite historic attribution. No automatic agent-to-agent communication exists without a durable file, PR or connector action.

Use stable task IDs and precise handoffs: repo, task ID, revision, status, files, real tests, blockers and one next action. Keep public repositories free of private conversations, personal data and credentials. Product-specific rules remain in each project and override generic suggestions on safety/release scope.

## Enforcement

Run `python tools/check_project_protocol.py` locally and through GitHub Actions. It checks the file structure, **not whether an AI understood it**. Use the pull request checklist. New projects must start with a GitHub repository template, not a blank repository that lacks these rules.
