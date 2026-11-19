# Idle Game + Browser Game Engineering Library

A public hobby project with **two parallel goals**:

1. **Build an original grimdark fantasy idle browser RPG**, prioritizing mobile portrait usability, atmospheric static artwork, automated mining/hunting, fair cooperative play and unlimited offline progress.
2. **Create a freely readable, growing research library** on how browser/idle games are implemented — including techniques we may never choose for our own game. Study systems in games such as Idle Clans, Legends of IdleOn, Melvor Idle and open-source implementations without pretending their internal code is public.

This repository is currently primarily **planning and technical research**. The game itself is not yet implemented.

## Start here

| Resource | Purpose |
| --- | --- |
| [Public research library](docs/RESEARCH_LIBRARY.md) | Mission, topic catalog, evidence standards, relevance labels and contribution format |
| [Useful GitHub examples](docs/USEFUL_EXAMPLES.md) | Source-linked examples, real implementation patterns, risks and licensing |
| [Technical article template](docs/library/ENTRY_TEMPLATE.md) | How to contribute a reusable technical explanation |
| [Our game's brainstorm](docs/BRAINSTORM.md) | Gameplay possibilities, design direction and open questions; **not a task list** |
| [Approved decisions](docs/DECISIONS.md) | Durable, owner-approved choices |
| [Development tasks](docs/TD_LIST.md) | Only actual authorized implementation work |

### How we label research

A technique gets a separate **fit-for-our-game** label (`FIT`, `ADAPT`, `NOT-FIT`, `UNDECIDED`) and an **evidence** label (`CODE-READ`, `DOCS`, `OBSERVED`, `TESTED`, `HYPOTHESIS`). Even `NOT-FIT` examples stay in the library because other developers may benefit.

Research describes outside projects in our own words with exact source links and license checks; a link or open source claim does not mean code or artwork has been incorporated into this project.

## For Chat / ChatGPT Work / Codex

Before project actions, follow [AGENTS.md](AGENTS.md) and the [agent protocol](docs/AGENT_PROTOCOL.md), starting with the current remote `main:docs/TD_LIST.md`. The human owner approves changes, and research does **not** authorize implementation. Preserve the common project template workflow and PR review policy.

**License note:** Referenced repositories keep their own licenses. This repository does not automatically grant permission to reuse third-party code or assets.
