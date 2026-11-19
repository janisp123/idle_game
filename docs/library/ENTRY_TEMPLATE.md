# [Technique / pattern] — technical reference

> Copy this template when creating a substantial entry under `docs/library/`. Remove fields that are truly inapplicable, but never omit provenance, evidence limits or license status.

**Category:** (engine / offline / combat / loot / multiplayer / backend / UI / performance / operations / other)  
**General purpose:** What problem does this solve for browser-game developers?  
**Our game:** `[OUR-GAME: FIT | ADAPT | NOT-FIT | UNDECIDED]` — one sentence explaining why  
**Evidence:** `[EVIDENCE: CODE-READ | DOCS | OBSERVED | TESTED | HYPOTHESIS]`  
**Checked:** YYYY-MM-DD

## What it does

Explain the actual behavior without assuming undocumented internals.

## Sources and permission

| Project | Relevant exact source link | License file or UNVERIFIED | Verified how/when |
| --- | --- | --- | --- |
| Name + URL | File URL, optionally pinned to commit | Link/status; check assets separately | Code/docs/test/observation |

## How it works

Explain the algorithm, data flow, authoritative state, events and boundaries in your own words. Use brief original pseudocode where useful; do not paste substantial third-party code.

## Why it works / tradeoffs

- Advantages
- Disadvantages and failure modes
- Performance and storage cost (measured vs estimated)
- Security, anti-cheat and correctness considerations
- Player experience consequences

## Alternative implementations

Describe competing solutions, including why another type of game might reasonably choose differently.

## Reusing the idea

Design sketch, interface, adaptation notes, tests and edge cases. No assumption that a GitHub README makes a pattern production-ready.

## Our-game assessment

- `[OUR-GAME: ...]` What fits, if anything?
- Which parts **do not** fit our uncapped offline / low-cost / mobile / minimal scope?
- Owner decision if approved, or explicitly **NOT APPROVED**.

## Unknowns and follow-up verification

List unknowns honestly. Distinguish plans from completed experiments.
