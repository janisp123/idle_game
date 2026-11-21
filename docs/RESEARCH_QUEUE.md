# Research queue — unanswered engineering questions

**For scheduled research only. Not game tasks, Codex instructions, or approved implementation.** The [research map](RESEARCH_MAP.md) is Codex's short lookup; Codex should **not** read this queue during ordinary development. All entries below are questions, not promises or design decisions.

## How to choose the next investigation

1. Before searching, check [existing coverage](RESEARCH_LIBRARY.md), [the catalogue](USEFUL_EXAMPLES.md), relevant articles and open research PRs. Avoid duplicate explanations.
2. Prefer **high practical value + clear knowledge gap + source/test inspectability + low implementation cost**. Rotate among different areas instead of repeatedly choosing the same subject. A strong new lead from a forum or issue may outrank the queue; explain why in the private daily report.
3. Investigate **one** question per run. If it produces no substantive verified insight, publish no filler article. Record private source links and rejected leads in the daily report, never here.
4. When genuinely covered, link the resulting article from the normal index and **remove** the row from this active queue. Improve an existing article rather than duplicate it. Add at most 1–2 genuinely distinct questions from new findings; cap the active queue at 12.
5. Update this queue **only when research changes**, never merely to refresh dates, mark a daily visit, or manufacture GitHub activity.

**Status:** OPEN = ready to investigate; IN_RESEARCH = an open research PR is actively addressing it; BLOCKED = clear evidence/access obstacle (describe in row). Never leave stale IN_RESEARCH entries after merge. Priority H/M denotes *research value*, not game development authorization. Next available ID: **RQ-010** (never reuse retired IDs).

## Active questions

| ID | Priority | Area | Unanswered question / useful evidence to seek | Existing coverage | Status |
| --- | --- | --- | --- | --- | --- |
| RQ-001 | M | Randomness | How should **stateful** pity, chained drops and other dependent rare outcomes be aggregated without losing ordering or changing the distribution? Independent and exclusive fixed odds are covered. | [Bulk loot guide](library/bulk-random-loot-sampling.md) | OPEN |
| RQ-002 | H | Scheduling | When can repeating multi-task queues be fast-forwarded without iterating over years of cycles, especially with depletion and remainders? | [Time-safe offline simulation](library/offline-time-units-and-boundaries.md) | OPEN |
| RQ-003 | H | Combat | How can sampled combat rates capture rare losses, recovery time and mixed encounter lengths without creating biased offline rewards? | [Offline combat estimators](library/offline-combat-estimation.md) | OPEN |
| RQ-004 | H | Persistence | How should very old saves and historically changing rules be migrated or replayed without granting incorrect retroactive outcomes? | [P05](USEFUL_EXAMPLES.md#p05--save-versions-and-migrations) | OPEN |
| RQ-005 | M | Multiplayer | How can timestamped group membership changes and shared reward claims be resolved cheaply without duplicate entitlements? | [P08](USEFUL_EXAMPLES.md#p08--shared-group-rewards-and-membership-windows), [settlement](library/idempotent-reward-settlement.md) | OPEN |
| RQ-007 | M | Mobile performance | What measurable art, cache and UI choices keep static illustrated games responsive on low-end Android hardware? | [P09](USEFUL_EXAMPLES.md#p09--mobile-first-illustrated-interface) | OPEN |
| RQ-008 | M | Security | What is the simplest migration from local estimates to server-authoritative rewards, including replay and forged-intent defenses? | [P07](USEFUL_EXAMPLES.md#p07--authoritative-server-and-inexpensive-browser-client) | OPEN |
| RQ-009 | M | Testing/cost | How can extreme offline settlement be benchmarked and fault-injected cheaply with reproducible latency, CPU and DB-write measurements? | [P14](USEFUL_EXAMPLES.md#p14--project-structure-testing-and-performance), [settlement](library/idempotent-reward-settlement.md) | OPEN |

**Scope:** Preserve alternative techniques even if not suitable for our game. The queue coordinates independent knowledge research only; it does not modify `docs/TD_LIST.md`, approved decisions or gameplay.
