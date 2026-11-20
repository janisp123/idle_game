# Idle Game — Browser Game Engineering Library

A public hobby project with **two parallel purposes**:

1. **Build an original idle fantasy browser RPG** with mobile portrait controls, atmospheric static illustrations, automated activities, cooperative play and unlimited offline progression.
2. **Maintain a public learning library** explaining practical browser-game mechanics and engineering techniques, including approaches we will never use ourselves.

This repository is currently primarily design documentation and engineering research. **The game is not yet implemented.**

## Software license and reuse

**The original software code in this repository** (including future original game code and original code examples), unless an individual file says otherwise, is offered under a **[custom noncommercial software license with an additional Steam distribution restriction](LICENSE.md)**. It incorporates PolyForm Noncommercial License 1.0.0, but is **not the unmodified standard license**.

- **Allowed (subject to the full license):** personal learning, private hobby games, experimentation, and noncommercial use, modifications, and noncommercial distribution outside Steam.
- **Not allowed without prior written permission:** commercial exploitation of the licensed code **or releasing/distributing a game made from this code on Steam, even if the Steam game is completely free and has no monetization**.
- **Seeking permission:** contact the repository owner through a GitHub issue to request a separate commercial license or Steam release permission.
- **Scope:** this covers only software code the licensor owns the rights to license. Original art, stories, names and branding may have separate restrictions; third-party dependencies retain their own licenses. Independent code that doesn't copy or derive from this project's code is not controlled by these terms.

**Publicly viewable does not mean commercially reusable.** This is a *source-available* arrangement, **not an OSI-approved open-source license**. The Steam restriction makes it more restrictive than standard PolyForm Noncommercial.

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
