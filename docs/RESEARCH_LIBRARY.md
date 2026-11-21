# Public Browser Game Engineering Library

**Owner-approved purpose:** This repository has two parallel goals: develop our original browser-based idle RPG, and maintain a broadly useful, publicly readable collection of browser-game engineering knowledge. The library must include techniques that **we may never implement ourselves**.

## What belongs here

Original, self-contained technical explanations of mechanics and implementation patterns: algorithms, data models, architectural tradeoffs, pseudocode, testing approaches, scalability, browser performance, security and practical failure cases.

The public repository should **not identify or link to games used for inspiration, outside projects consulted while researching, or places information was gathered from.** Never imply that a concept was invented here merely because its background research is not listed. Research is synthesis and analysis, not proof of originality.

**No third-party code or artwork is copied into the library.** If future actual code integration requires retaining license notices or third-party attributions, the legal requirement takes priority; either comply transparently or use independently implemented code instead. Never present copied third-party code as original.

## How Codex should consume this library

This is a **reference library, not a design specification or a to-do list**. Reading more entries does not grant authority to implement their ideas.

- **Mandatory governance first:** fetch current remote `main:docs/TD_LIST.md`, then read `AGENTS.md`, `docs/WORK_CHECKPOINT.md`, `docs/DECISIONS.md`, and the protocol/relevant project instructions.
- **For combat/offline development:** read the **short handoff** at [Architecture and balancing](brainstorm/ARCHITECTURE_AND_BALANCING.md#combatoffline-handoff--concise-context-for-codex-2026-11-20). Look up latest applicable parts of [Solo combat](brainstorm/SOLO_COMBAT.md), [Automation and offline](brainstorm/AUTOMATION_AND_OFFLINE.md), and [Open questions](brainstorm/OPEN_QUESTIONS.md) only as needed.
- **Consult on demand:** the [Useful Examples index](USEFUL_EXAMPLES.md#quick-index) points to small, specific research entries. Start with **P17** for combat module boundaries or **P18** for offline estimation; don't load P01–P18 as one giant input. Research marked `[OUR-GAME: FIT]` is still **not** an approved design decision.
- **External source provenance:** names, source URLs, commit revisions and licence notes are held separately in the owner's private source index, not this public repository. Codex must ask for that index if it needs to examine original external code; it is **not automatically present** in the GitHub checkout.

**Stop researching when there is a plausible method and a testable next step.** Resume investigation on a specific failure, accuracy gap, security issue or owner-approved question, not to accumulate examples. Preserve alternatives in the library for other developers without making Codex weigh them all each task.

## Reading order

- [Useful Examples](USEFUL_EXAMPLES.md): short, generic, independent implementation patterns and tradeoffs.
- [Time-safe offline simulation](library/offline-time-units-and-boundaries.md): consistent time units, exact resource-depletion boundaries, aggregate processing and proposed equivalence tests. `[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`.
- [Idempotent reward settlement](library/idempotent-reward-settlement.md): atomic progress cursors, retry-safe grants, concurrency control and crash recovery. `[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`.
- [Coherent browser game releases](library/coherent-browser-game-releases.md): content-versioned assets, safe PWA updates, stale-cache recovery and save-schema compatibility. `[OUR-GAME: FIT]` `[EVIDENCE: DESIGN-NOTE]`.
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

## How this library grows

A research pass can explore several approaches and consolidate the useful lessons into a self-contained article. The public result should be **original commentary**, not copied code, quoted instructions or a hidden third-party dependency. Important claims should be presented as principles or as explicitly unverified hypotheses unless independently verified in this repository.

Research never automatically authorizes gameplay code, licensing choices or a development task. The owner approves scope before implementation.

## Our game's separate design boundaries

Our own game prioritizes mobile portrait play, static original grimdark illustrations, a very small initial mining/hunting loop, fully automatic offline progress without a cap, a simple task queue, server-efficient long-term simulation and asynchronous cooperative groups. The [brainstorm](BRAINSTORM.md) contains more detail.

These constraints govern **our product**, not what the broader public library is allowed to teach.

## Public repository hygiene

Do not publish personal conversations, secrets, credentials, personal data, identifiable names of reference games, external research destinations, copied code or unlicensed artwork. Keep any mandatory attribution associated with licensed third-party contributions if such contributions are ever allowed; the simplest way to avoid conflicting requirements is to use our own explanations and implementations.

**Purpose: make a genuinely useful library of how-to knowledge, while keeping our actual game's requirements and development backlog separate.**
