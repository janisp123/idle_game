# Idle Game — Browser Game Engineering Library

A public hobby project with **two parallel purposes**:

1. **Build an original idle fantasy browser RPG** with mobile portrait controls, atmospheric static illustrations, automated activities, cooperative play and unlimited offline progression.
2. **Maintain a public learning library** explaining practical browser-game mechanics and engineering techniques, including approaches we will never use ourselves.

This repository is currently primarily design documentation and engineering research. **The game is not yet implemented.**

## Software license and reuse

The **original software code** in this repository (including future original game code and original code examples), unless individual files state otherwise, is licensed under the **[custom Noncommercial Software License with Public Game Release Restriction](LICENSE.md)**. It incorporates PolyForm Noncommercial License 1.0.0 with an additional restriction; it is **not** the official unmodified PolyForm license.

- **Personal use is allowed:** study the source, learn from it, experiment, modify it, and run private noncommercial hobby projects.
- **Noncommercial source-only sharing is allowed** under the license's full terms, including required notices.
- **Public playable games require prior written permission:** no releasing, distributing, deploying, or publicly hosting a game incorporating or derived from our code—**even if completely free**—on **Google Play, Apple's App Store, Steam, Epic Games Store, itch.io, any other marketplace, or any public browser-game website/self-hosted website**.
- **Commercial uses require prior written permission** regardless of platform.
- **Permission requests:** contact the repository owner through a GitHub issue to discuss a separate license.

**Scope:** This license covers only original software the licensor has the right to license. Third-party dependencies retain their own terms; artwork, stories and branding may have separate terms. The license cannot restrict independently written games that only use similar ideas or mechanics and do not copy protected code.

This project is **publicly viewable and source-available**, but **not OSI-approved open-source software**.

## Explore

| Resource | Purpose |
| --- | --- |
| [Research library](docs/RESEARCH_LIBRARY.md) | Purpose, topic index, article standards and relevance labels |
| [Useful implementation examples](docs/USEFUL_EXAMPLES.md) | Standalone algorithms, tradeoffs and implementation sketches |
| [Technical article template](docs/library/ENTRY_TEMPLATE.md) | Consistent format for future educational guides |
| [Game brainstorm](docs/BRAINSTORM.md) | Design possibilities, directions, rejected ideas and open questions |
| [Durable decisions](docs/DECISIONS.md) | Owner-approved project decisions |
| [Development tasks](docs/TD_LIST.md) | Actual authorized implementation tasks |

## Two different kinds of relevance

A technique can be valuable to browser-game developers **even when it doesn't suit our own game**. Entries use `FIT`, `ADAPT`, `NOT-FIT` and `UNDECIDED` tags **only to assess our game**. Evidence labels distinguish untested design notes, prototypes, executed tests and benchmarks.

## Documentation principles

The public guides are independently written explanations and original illustrative examples. They do not name particular games consulted while researching, link to outside research repositories, or reproduce third-party code/artwork. No claims of testing are made without real test results. If third-party software is ever integrated into the game, applicable copyright licenses and mandatory notices must be respected.

## Chat / CW / Codex coordination

Read [AGENTS.md](AGENTS.md) and the [agent protocol](docs/AGENT_PROTOCOL.md) before taking project actions, beginning with current remote `main:docs/TD_LIST.md`. The owner approves changes. Brainstorming and library materials **do not** authorize gameplay implementation.
