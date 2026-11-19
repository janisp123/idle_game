# [Technical pattern] — Engineering guide

> Template for original, standalone technical explanations under `docs/library/`. Do not include names or URLs of games or outside repositories consulted. Do not copy third-party code or artwork.

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

Keep general educational value distinct from our design. Explain what fits our low-cost, mobile-first, uncapped idle game and what doesn't. A `NOT-FIT` entry can still be valuable to other developers.

## Open questions

List uncertainties honestly. This article is not an authorized development task.

## Rights and originality

Do not include identifiable outside project names, source destinations, copied code, or borrowed artwork. Explain concepts independently. If integrating third-party software into the actual game, honor all applicable licenses and mandatory notices rather than concealing them.
