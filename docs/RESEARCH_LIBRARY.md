# Public Browser Game Engineering Library

**Owner-approved purpose:** This repository has two parallel goals: develop our original browser-based idle RPG, and maintain a broadly useful, publicly readable collection of browser-game engineering knowledge. The library must include techniques that **we may never implement ourselves**.

## What belongs here

Original, self-contained technical explanations of mechanics and implementation patterns: algorithms, data models, architectural tradeoffs, pseudocode, testing approaches, scalability, browser performance, security and practical failure cases.

The public repository should **not identify or link to games used for inspiration, outside projects consulted while researching, or places information was gathered from.** Never imply that a concept was invented here merely because its background research is not listed. Research is synthesis and analysis, not proof of originality.

**No third-party code or artwork is copied into the library.** If future actual code integration requires retaining license notices or third-party attributions, the legal requirement takes priority; either comply transparently or use independently implemented code instead. Never present copied third-party code as original.

## How Codex should consume this library

**Optional, task-specific reference only.** Approved work lives in `docs/TD_LIST.md`; `AGENTS.md` and `docs/DECISIONS.md` govern implementation. Never treat a fit tag as authorization or require Codex to read the whole library.

For technical design choices, start with the compact [Research map](RESEARCH_MAP.md); then open **only** a relevant guide. Skip library reading on unrelated tasks. For combat/offline tasks, first consult the [short project handoff](brainstorm/ARCHITECTURE_AND_BALANCING.md#combatoffline-handoff--concise-context-for-codex-2026-11-20). External source provenance belongs to the owner's separate private source index, not this public library.

## Reading order

- [Research map](RESEARCH_MAP.md): tiny topic overview for on-demand Codex discovery; not required on routine tasks.
- [Useful Examples](USEFUL_EXAMPLES.md): short, generic, independent implementation patterns and tradeoffs.
- [Time-safe offline simulation](library/offline-time-units-and-boundaries.md): consistent time units, exact resource-depletion boundaries, aggregate processing and proposed equivalence tests. `[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`.
- [Idempotent reward settlement](library/idempotent-reward-settlement.md): atomic progress cursors, retry-safe grants, concurrency control and crash recovery. `[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`.
- [Coherent browser game releases](library/coherent-browser-game-releases.md): content-versioned assets, safe PWA updates, stale-cache recovery and save-schema compatibility. `[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`.
- [Combat module boundaries](library/combat-module-boundaries.md): isolated math, scheduling, encounter outcomes and reward handling. `[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`.
- [Offline combat estimation](library/offline-combat-estimation.md): encounter sampling, mathematical rates, replay tradeoffs and validation. `[OUR-GAME: ADAPT]` `[EVIDENCE: DESIGN-NOTE]`.
- [Article Template](library/ENTRY_TEMPLATE.md): format for longer, original technical guides.
- [Our Game Brainstorm](BRAINSTORM.md): our ideas, design directions, alternative concepts and open questions. Not a task list.
- [Decisions](DECISIONS.md): actual owner-approved decisions.
- [Active Tasks](TD_LIST.md): the sole authorized development backlog.
- [Agent Rules](../AGENTS.md): project process, approvals and constraints.

When more topics are documented, put each substantial article under `docs/library/` and link to it from this index. Keep the index readable.

## Catalog topics

This is a reference map, not a development commitment.

| Area | Research questions |
| --- | --- |
| Simulation | Pure game engines, ticks, deterministic inputs, action queues, scheduling |
| Offline systems | Event-driven time jumps, bulk processing, decades of progress, boundaries |
| Combat | Combat resolution, skill cooldowns, stat scaling, automated encounters |
| Loot and probability | Weighted drop tables, RNG testing, dice, rare outcomes and large populations |
| Economies | Currency sinks, resource balancing, inventory, crafting, trading models |
| Multiplayer | Cooperative groups, guilds, chat, matchmaking, social permissions, leader roles |
| Servers | Accounts, authorization, persistence, transactions, idempotent updates |
| Scaling | Database writes, caching, long-term snapshots, load tests, monitoring |
| Browser interfaces | Mobile layout, accessibility, images, animation tradeoffs, PWA caching |
| Retention and monetization | Session systems, subscription models, cosmetic rewards, daily mechanics |
| Operations | Deployment, releases, migrations, monitoring, moderation, security |

**Do not exclude a technique solely because it is unsuitable for our idle game.** Describe its general value first; evaluate fit separately.

## Tags

For each article or technique, use both a fit assessment and an evidence status.

**Our game's fit**
- `[OUR-GAME: FIT]` — candidate for direct adaptation into our design.
- `[OUR-GAME: ADAPT]` — useful but needs changes.
- `[OUR-GAME: NOT-FIT]` — conflicts with our intended game, yet may be valuable to other developers.
- `[OUR-GAME: UNDECIDED]` — fit not decided.

**Evidence**
- `[EVIDENCE: DESIGN-NOTE]` — explanatory design analysis, not yet reproduced or tested.
- `[EVIDENCE: PROTOTYPED]` — a small, independently authored prototype exists; link to its own file/commit.
- `[EVIDENCE: TESTED]` — tests actually executed; include commands/results and conditions.
- `[EVIDENCE: BENCHMARKED]` — performance measurements actually recorded; include hardware and dataset.

This avoids conflating a plausible design with a proven implementation. Never label work “tested” when tests weren't run.

## Standard for useful technical articles

1. Explain the problem and when other browser-game developers would need the technique.
2. Provide the algorithm and the important state transitions in independently written words and original pseudocode.
3. Describe costs: time complexity, server CPU, database writes, memory, mobile bandwidth and maintenance.
4. Identify failure modes, exploits, race conditions, numerical precision and correctness issues.
5. Compare realistic alternative implementations and the circumstances in which each makes sense.
6. Include a practical test plan or reproducible results if available.
7. Tag **our-game fit**, independently of general merit.
8. Link to **our own** prototypes or verification results if they exist; avoid external names, attribution claims and source URLs in public research notes.

Good documentation should help a reader implement something correctly, not merely name a pattern.

## Research continuity (research runs only)

The short [Research queue](RESEARCH_QUEUE.md) tracks unanswered technical questions and topic rotation for scheduled research. It is **not a game backlog** and should not be read by Codex during ordinary tasks. Only new evidence changes the queue; completed questions leave the queue when their findings are indexed.

## How this library grows

A research pass can explore several approaches and consolidate the useful lessons into a self-contained article. The public result should be **original commentary**, not copied code, quoted instructions or a hidden third-party dependency. Important claims should be presented as principles or as explicitly unverified hypotheses unless independently verified in this repository.

Research never automatically authorizes gameplay code, licensing choices or a development task. The owner approves scope before implementation.

## Our game's separate design boundaries

Our own game prioritizes mobile portrait play, static original grimdark illustrations, a very small initial mining/hunting loop, fully automatic offline progress without a cap, a simple task queue, server-efficient long-term simulation and asynchronous cooperative groups. The [brainstorm](BRAINSTORM.md) contains more detail.

These constraints govern **our product**, not what the broader public library is allowed to teach.

## Public repository hygiene

Do not publish personal conversations, secrets, credentials, personal data, identifiable names of reference games, external research destinations, copied code or unlicensed artwork. Keep any mandatory attribution associated with licensed third-party contributions if such contributions are ever allowed; the simplest way to avoid conflicting requirements is to use our own explanations and implementations.

**Purpose: make a genuinely useful library of how-to knowledge, while keeping our actual game's requirements and development backlog separate.**
