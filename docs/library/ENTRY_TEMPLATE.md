# [Technical pattern] — Engineering guide

> Template for original, standalone technical explanations under `docs/library/`. Cite relevant external primary sources transparently; never copy or run third-party code or artwork.

**Category:** Engine / offline / combat / loot / multiplayer / server / UI / performance / operations / other  
**General-purpose benefit:** Who would find this useful and why?  
**Our-game fit:** `[OUR-GAME: FIT | ADAPT | NOT-FIT | UNDECIDED]` and explanation  
**Evidence:** `[EVIDENCE: DESIGN-NOTE | PROTOTYPED | TESTED | BENCHMARKED]`  
**Reviewed:** YYYY-MM-DD

## Problem and intended use

Define the problem without implying this is the only solution.

## How it works

Explain data models, algorithms, event ordering, authoritative state, failure handling and timing. Use **independently written, original** pseudocode if needed. Distinguish facts, estimates and hypotheses.

## Implementation sketch

Give a concise, reusable interface or example. Do not paste or adapt copyrighted third-party source code.

## Tradeoffs and alternatives

- CPU/memory/network/database costs and how they scale
- Strengths and weaknesses
- Race conditions, cheat prevention, security and correctness
- When another design is preferable

## Test or performance evidence

Include a reproducible command and results **only if actually executed on our own code or prototype**. Otherwise provide a test plan and mark the entry `DESIGN-NOTE`.

## Our-game assessment

Describe fit against the [current approved decisions](../DECISIONS.md). A `NOT-FIT` entry can still be valuable to other developers.

## Open questions

List uncertainties honestly. This article is not an authorized development task.

## Sources and evidence

List precise external references supporting technical claims (official docs, versioned code or tests). Identify what was inspected and what remains inferred. If no external sources were used, say so; never invent citations.

## Rights and originality

Explain concepts independently; never copy or execute third-party code or assets. A citation does not grant reuse rights. Honor all applicable licenses and mandatory notices if separately approved for actual integration.
