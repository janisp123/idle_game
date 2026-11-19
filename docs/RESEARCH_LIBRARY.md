# Browser Game Engineering Library

**Mission (owner direction, 2026-11-19):** This public repository has **two equal purposes**:

1. Build our original mobile-first idle fantasy browser RPG.
2. Build an **independent, openly readable technical knowledge library** about designing and implementing browser games — especially idle/incremental RPGs and systems seen in games such as Idle Clans and Legends of IdleOn.

**The library is not limited to features we plan to use.** Record valuable implementations even if they conflict with our game's design. An example can be useful to a developer making a different game and still be unsuitable for us.

## Navigation

- [Useful Examples](USEFUL_EXAMPLES.md) — curated, source-linked GitHub game projects and reusable patterns, with warnings and fit tags.
- [Library Entry Template](library/ENTRY_TEMPLATE.md) — consistent format for detailed reusable technical guides.
- [Our Game Brainstorm](BRAINSTORM.md) — ideas, possibilities, rejected/superseded concepts, **not** automatic coding work.
- [Decisions](DECISIONS.md) — owner-approved decisions.
- [Active Tasks](TD_LIST.md) — **only** authorized development work; library references never enter this automatically.

As the collection expands, create **topic-focused documents under `docs/library/`** and link them here. Keep `docs/USEFUL_EXAMPLES.md` a compact discovery index / source catalog rather than an unreadable multi-thousand-line file. Do not move/delete the existing detailed findings without retaining their links.

## Topics to collect

This is a classification map, **not a commitment to implement or research every topic immediately**:

| Topic | Questions useful to browser-game developers |
| --- | --- |
| Simulation and scheduling | Tick loops vs timestamp-driven actions; deterministic systems; action queues; job schedulers |
| Long-term idle progress | Offline catch-up, event-time math, bulk probability, 1-year/20-year gaps, caps vs uncapped design |
| Combat and skills | Hit chance, cooldowns, automation, XP curves, skill requirements, damage resolution |
| Loot, probability and economy | RNG, drop tables, rare items, luck mechanics, stack counts, inflation, currency sinks |
| Groups and social play | Parties, guilds, group loot, fairness, invites, chat, moderation, asynchronous multiplayer |
| Backend and persistence | Server-authoritative state, transactions, idempotence, databases, migrations, anti-cheat |
| Performance and scalability | CPU/memory, database reads/writes, caching, bandwidth, queues, load testing |
| Client and presentation | Mobile-first layouts, touch controls, static art, animation tradeoffs, PWA, accessibility |
| Game design and retention | Progression pacing, rewards, return experience, monetization, daily mechanics (including approaches we reject) |
| Operations and security | Authentication, abuse prevention, patching, deployment, monitoring, rate limiting |
| Code quality and Git | Repository structure, test strategy, CI, releases, documentation, licensing |

Study both **open-source implementation details** and **publicly observable game mechanics**, but distinguish them. A feature described by players or seen in the UI is **not evidence of how its backend is coded**.

## Tags: two separate judgments

Do not conflate **generally useful engineering knowledge** with **fit for our game**. Tag a *specific technique or subsystem*, not just a whole repository.

**Fit for our game** (choose one per technique):
- `[OUR-GAME: FIT]` — a strong candidate for our architecture or gameplay, subject to testing and owner approval.
- `[OUR-GAME: ADAPT]` — useful concept but requires important changes.
- `[OUR-GAME: NOT-FIT]` — valuable to document, but conflicts with an existing project goal or would add unjustified complexity.
- `[OUR-GAME: UNDECIDED]` — no decision yet; don't claim compatibility.

**Evidence level** (choose one):
- `[EVIDENCE: CODE-READ]` — identified behavior confirmed by reading exact source files.
- `[EVIDENCE: DOCS]` — a project's own documentation claims it; not yet verified in code.
- `[EVIDENCE: OBSERVED]` — observable behavior reported/seen; not a claim about internals.
- `[EVIDENCE: TESTED]` — actually built/run/benchmarked; include reproducible instructions and results.
- `[EVIDENCE: HYPOTHESIS]` — our idea, estimate or inference; clearly not a verified implementation.

**Reuse permission** (always record): `MIT`, `Apache-2.0`, `GPL-3.0`, `UNVERIFIED`, etc.; link to the **actual license file**, note copyright notices, check each third-party asset separately. An absent license normally means **no permission to copy the code**. Writing an explanation of a design is different from redistributing another project's code. No wholesale copied code/assets in our public knowledge base without appropriate permission.

A category such as `[OUR-GAME: NOT-FIT]` must **never** be treated as `[NOT-VALUABLE]`: someone making another kind of browser game may find it extremely useful.

## Standard for each substantial reference

Use [ENTRY_TEMPLATE.md](library/ENTRY_TEMPLATE.md) and include:

1. Problem it solves and where it is useful **generally**.
2. Named project, GitHub URL, language/framework, date inspected, and license URL/status.
3. Exact code paths and permalinks where feasible; source of each claim.
4. **How it works**, enough to teach someone — diagram, pseudocode, data flow or concise algorithm explanation in our own words.
5. Benefits, disadvantages, resource costs, scalability, correctness and security tradeoffs.
6. A concrete adaptation example or test strategy; exact behavior that remains unverified.
7. Separate **our-game fit tags** and justification, without hiding features irrelevant to us.
8. Relevant alternative approaches, when known.

Avoid a wall of shallow links or “best practices” unsupported by source inspection. Quality and accurate provenance are more important than repository count.

## Research workflow

1. Pick a technical topic (e.g. loot distribution). Find several implementations rather than assuming one project is correct.
2. Read **real code, tests, configuration and licensing**, not just the README. Record findings, sources and uncertainties.
3. Explain the implementation and tradeoffs for a general audience; tag fit for our particular idle game separately.
4. Cross-check the behavior against other projects or documentation, and reproduce in a small test where appropriate and authorized.
5. Link the new topic page here and add an entry to the Useful Examples catalog. Preserve historical notes when a source changes.
6. Keep research files distinct from `TD_LIST.md`; research never approves gameplay changes or dependencies.

## Our game remains independent

Our game currently emphasizes **uncapped offline progression**, very low server load for dormant accounts, mobile portrait UI, static grimdark illustrations, a small mining/hunting MVP, and simple multiplayer. See [BRAINSTORM.md](BRAINSTORM.md) for the full discussion. These are design filters for **our implementation**, not editorial limits on the public library.

## Public contribution quality

Keep personal/private chats, credentials, private screenshots and user data out of the repository. Cite authors and license notices accurately; explain rather than plagiarize. Contributions must distinguish inspected source, gameplay observation, independent testing, and speculation. The owner retains approval of repository changes.

**This is a research archive and educational resource, not a guarantee that referenced code is secure, maintained, production-ready or license-compatible with every project.**
