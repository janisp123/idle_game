# Shared AI project protocol — v1.0

**Owner-approved 2026-11-18.** This convention governs coordination; project-specific privacy, product and release rules in `AGENTS.md` still apply.

## Fixed paths and single source of truth

- `AGENTS.md`: mandatory project rules.
- `docs/TD_LIST.md`: **only active backlog**; the version on remote `main` is authoritative.
- `docs/WORK_CHECKPOINT.md`: current verified state, revision, blockers and next action.
- `docs/CHANGELOG.md`: task journal and verified release history.
- `docs/DECISIONS.md`: approved durable owner decisions, including superseding history.
- `docs/PROJECT_PLAYBOOK.md`: reusable lessons, not tasks.
- `docs/AGENT_PROTOCOL.md`: shared convention.

## Required preflight for every project-specific request

1. Identify repository/branch and **fetch current remote `main:docs/TD_LIST.md` first**, including before task edits, status checks, implementation, publication or delegation. If unavailable, report this; do not act from a stale backlog.
2. Read `AGENTS.md`, checkpoint, decisions, relevant project rules, latest main revision, implementation and overlapping PRs. Unmerged work is **PENDING PR**, not a completed task on main.
3. Confirm task ID, authorization, dependencies and conflicts. A listed task or discussion does not authorize implementation; the Owner decides direction and approvals.
4. For approved writes, use a fresh main-based branch, a small testable scope and checked PR. Owner authorization may be either explicit per-PR approval **or** standing AUTO-MERGE-001 approval for already-agreed scope once all readiness gates pass. Do not bypass branch protection or treat a task list item as authorization; the separate unattended research auto-merge allowlist remains narrow.
5. After verification, record exact files, branch, commit/PR, checks (PASS/FAIL/NOT RUN), blockers and one next action. Change TD completion state only after integration and main readback. Keep local, PR, merged and deployed states distinct.

Read-only queries do not need a new branch. Never claim an unavailable action happened or another agent is working in the background.

## Resuming approved work (HANDOFF-001)

When the Owner asks to keep working in ordinary language, recover the latest pushed milestone and take the next unfinished action within the approved scope. No special wording or repeat approval is needed. A status question, plan-only request, “RO” or “read only” means inspect and report without writing. If no approved unfinished task is identifiable, say so. Ask only when a real ambiguity or a decision requiring the Owner remains.

1. **Start.** After read-only preflight, use a task ID and a named branch. Before implementation, commit and push a `STARTED` entry at the top of `docs/CHANGELOG.md` with the date, approved goal, branch, last verified result, remaining work or blocker, and one concrete next action. Open a draft PR naming the ID immediately. Link it from the next checkpoint. If a push fails, identify the last confirmed remote state.
2. **Save.** At each meaningful milestone, push the work and update the same entry together. Record what actually passed or failed. Include the next command or decision when known. The remote branch and PR identify the revision. Only pushed work is recoverable from another workspace.
3. **Recover.** After the remote task-list read, inspect the checkpoint on main and open PRs including drafts. Read the matching task entry at the PR head. If interrupted between push and PR creation, check recent remote task branches for a STARTED entry. Match the scope to the request, check commits, changed files and checks, then resume at the first unfinished action. If the PR has merged, inspect the merge and any required deployment before treating old pending text as current. Backlog candidates alone do not identify a task in progress.
4. **Close.** Link the PR from the changelog and reconcile the checkpoint and backlog before merge. Record MERGED with the actual SHA in the linked PR after merge and DEPLOYED with the verified run for playable changes. If interrupted here, the next agent verifies the outstanding release. Carry confirmed outcomes into the main changelog on the next journal update. A documentation-only change ends at verified merge. Keep significant historical entries.

Read-only requests create no journal entries. The separate unattended research allowlist retains its own scope.

## AUTO-MERGE-001 — agreed work may merge when verified

The Owner granted standing approval on 2026-11-21: if the specific work was agreed, fully completed and tested, the PR is ready on the final head, and there is no conflict or decision requiring the Owner, merge without asking again. Read the full five-gate checklist in `AGENTS.md` first. If any gate fails, stop and request the needed decision. Confirm merged source on `main` and live deployment separately.

## Agent names and task attribution

**Owner** = human final approver. **chat** = regular ChatGPT. **cw** = ChatGPT Work. **codex** = Codex. “I'll ask chat” refers to chat only.

For new tasks, `Added by` means who **actually saved the task** (chat/cw/codex/Owner); optional `Requested by` records the owner. `Implemented by` requires verified code and commit evidence; do not guess or rewrite historic attribution. No automatic agent-to-agent communication exists without a durable file, PR or connector action.

Use stable task IDs and precise handoffs: repo, task ID, revision, status, files, real tests, blockers and one next action. Keep public repositories free of private conversations, personal data and credentials. Product-specific rules remain in each project and override generic suggestions on safety/release scope.

## Enforcement

Run `python tools/check_project_protocol.py` locally and through GitHub Actions. It checks the file structure, **not whether an AI understood it**. Use the pull request checklist. New projects must start with a GitHub repository template, not a blank repository that lacks these rules.
