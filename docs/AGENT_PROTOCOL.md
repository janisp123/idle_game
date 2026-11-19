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
4. For approved writes, use a fresh main-based branch, a small testable scope and checked PR. Never bypass protection or merge/publish without authorization.
5. After verification, record exact files, branch, commit/PR, checks (PASS/FAIL/NOT RUN), blockers and one next action. Change TD completion state only after integration and main readback. Keep local, PR, merged and deployed states distinct.

Read-only queries do not need a new branch. Never claim an unavailable action happened or another agent is working in the background.

## Agent names and task attribution

**Owner** = human final approver. **chat** = regular ChatGPT. **cw** = ChatGPT Work. **codex** = Codex. “I'll ask chat” refers to chat only.

For new tasks, `Added by` means who **actually saved the task** (chat/cw/codex/Owner); optional `Requested by` records the owner. `Implemented by` requires verified code and commit evidence; do not guess or rewrite historic attribution. No automatic agent-to-agent communication exists without a durable file, PR or connector action.

Use stable task IDs and precise handoffs: repo, task ID, revision, status, files, real tests, blockers and one next action. Keep public repositories free of private conversations, personal data and credentials. Product-specific rules remain in each project and override generic suggestions on safety/release scope.

## Enforcement

Run `python tools/check_project_protocol.py` locally and through GitHub Actions. It checks the file structure, **not whether an AI understood it**. Use the pull request checklist. New projects must start with a GitHub repository template, not a blank repository that lacks these rules.
