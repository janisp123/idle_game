# Bad examples — failure patterns and better alternatives

**Purpose:** A compact catalogue of *situations to avoid*, backed by a clear failure mechanism and an alternative. It complements the [research map](RESEARCH_MAP.md); it is **not** an implementation task list, a substitute for testing, or required reading for Codex. Read it **only when a related technical decision is being made**.

**Classification:** **GENERAL FAILURE** means the described behavior is incorrect or unsafe *under the stated conditions*, not that every use of the underlying technique is bad. **OUR-GAME CONFLICT** means a design may be valid elsewhere but contradicts a decision for this game. Do not turn opinions, mere performance suspicions or unverified internet anecdotes into established failures.

| ID | Classification | Bad example and when it breaks | Safer approach / existing explanation |
| --- | --- | --- | --- |
| BAD-001 | GENERAL FAILURE | **Give `ceil(n × p)` rare items after offline time** even when each encounter only has independent chance `p`. One item becomes guaranteed for any positive `n × p`, unlike the real probability. | Sample the [appropriate binomial count](library/bulk-random-loot-sampling.md), including its zero-drop probability. |
| BAD-002 | GENERAL FAILURE | **Independently sample every entry in a mutually exclusive loot table.** The resulting category counts can total more than the number of encounters. | Sample a [joint categorical/multinomial outcome](library/bulk-random-loot-sampling.md) or sequential conditional binomials. |
| BAD-003 | GENERAL FAILURE | **Replay every second or encounter for decades of unchanged offline actions.** Cost scales with absence and can make dormant-player settlement prohibitively slow. | [Aggregate stable intervals and jump to meaningful boundaries](library/offline-time-units-and-boundaries.md); preserve any state-changing events. Tick replay remains legitimate for small online intervals. |
| BAD-004 | GENERAL FAILURE | **Award rewards, then update the progress cursor in a separate non-atomic operation.** A crash/retry between writes can award the same interval twice. | [Commit rewards, cursor and idempotency key atomically](library/idempotent-reward-settlement.md). |
| BAD-005 | GENERAL FAILURE | **Trust a client-supplied offline duration, reward total or random seed** in a competitive/shared economy. A modified browser can claim arbitrary items. | Use [authoritative server verification](USEFUL_EXAMPLES.md#p07--authoritative-server-and-inexpensive-browser-client) for shared rewards; local-only prototypes have a different trust model. |
| BAD-006 | GENERAL FAILURE | **Assume changing the RNG algorithm preserves exact seeded results** just because both implementations follow the same distribution. A resumed calculation can disagree with an earlier version. | [Version the RNG and reward rules](library/bulk-random-loot-sampling.md), and explicitly decide between bit-for-bit replay and statistical equivalence. |
| BAD-007 | GENERAL FAILURE | **Deploy incompatible cached scripts, content and save schemas as if the browser updates everything atomically.** Mixed versions may read or overwrite old state incorrectly. | Use [coherent asset versions, safe update activation and save migrations](library/coherent-browser-game-releases.md). |
| BAD-008 | OUR-GAME CONFLICT | **Apply earned XP or equipment improvements during an absence to boost the remaining offline combat rate.** That contradicts the approved frozen-efficiency rule, even if threshold stepping is valid in another game. | Follow [OFF-001](DECISIONS.md#durable-owner-approved-decisions): settle using the last online effective snapshot and activate gained progression only on return. |
| BAD-009 | OUR-GAME CONFLICT | **Treat a fixed absence window, a reward cap and a processing budget as interchangeable.** This can discard eligible rewards, produce excess rewards or stop settlement early. Daily login streaks are a separate product decision. | [OFF-001 and CAP-001](DECISIONS.md#current-gameplay-decisions) set frozen settlement and the current-level reward cap. See [offline limits](USEFUL_EXAMPLES.md#p11--offline-time-caps) and [daily rewards](USEFUL_EXAMPLES.md#p12--daily-rewards-and-streaks) for broader tradeoffs. |

## Admission and review rule

A bad example belongs here only when a researcher can state **the precise preconditions, the failure mechanism and an actionable safer alternative**. Prefer a link to a fuller existing guide over repeating its content. Distinguish:

- **Observed/verified failure:** reproduced in our own test or supported by inspectable evidence. Cite our own test file, issue or outcome where available.
- **Established mechanism:** follows from a clear invariant, arithmetic or state-transition argument (e.g., non-atomic grants can duplicate on retry), without claiming to have reproduced a specific external bug.
- **Conditional tradeoff or our-game conflict:** explain the relevant conditions; do not call other valid designs universally defective.
- **Unconfirmed claim:** keep in a private research report or queue until adequately supported, **not** in this catalogue.

**Do not publish outside project/source names, unlicensed code, credentials or source URLs.** The private run report may retain specific source provenance. The list can be updated on a research PR when a genuinely distinct, evidence-supported failure is discovered; **do not append entries for commit activity or duplicate old warnings**.
