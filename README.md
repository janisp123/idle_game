# Idle Game

*An evolving dark-fantasy idle RPG and open browser-game engineering project.*

Idle Game is an independent hobby project exploring a slower-paced fantasy RPG built around meaningful progression and respect for the player's time. Choose a path, let the world move, and return when it suits you.

**This project is actively evolving.** Mechanics, content, visuals and long-term plans may change as ideas are tested. The current build is an experiment, not a promise of a fixed final feature set.

## Play the current alpha

- **[Play in your browser](https://janisp123.github.io/idle_game/play/)**
- **[Visit the project website](https://janisp123.github.io/idle_game/)**

The playable alpha lets you explore an early version of the world and its systems. Expect changes, rough edges and ongoing balancing. Progress is currently stored **locally in your browser**; there are no online accounts or cross-device save synchronization. This is not yet a finished or production-ready game.

## Guiding ideas

- **Progress at your own pace.** The game is designed for players who may step away for long periods rather than check in every day.
- **A world worth returning to.** Different activities, character development and encounters should create lasting choices without demanding constant attention.
- **Atmosphere over noise.** Original dark-fantasy artwork and a readable, mobile-friendly interface matter as much as the underlying rules.
- **Build carefully, change when needed.** Gameplay decisions are tested and revised; ideas are not guaranteed features.

These are design goals, not a final roadmap. For current implementation details, use the mechanics documentation and repository history rather than this overview.

## Open engineering library

The repository also hosts a public collection of research, examples and practical lessons from building browser games. Some techniques are useful as general references even when they are not chosen for Idle Game.

| Resource | What it covers |
| --- | --- |
| [Engineering research](docs/RESEARCH_LIBRARY.md) | Topics and evidence for browser-game development |
| [Implementation examples](docs/USEFUL_EXAMPLES.md) | Algorithms, trade-offs and reusable patterns |
| [Mechanics handbook](docs/mechanics/README.md) | Current implemented rules and tuning references |
| [Design notes](docs/BRAINSTORM.md) | Explorations and possibilities, not commitments |
| [Owner decisions](docs/DECISIONS.md) | Agreed project direction and boundaries |
| [Active tasks](docs/TD_LIST.md) | Work currently tracked for development |
| [Working checkpoint](docs/WORK_CHECKPOINT.md) | Verified progress, limitations and handoffs |
| [Changelog](docs/CHANGELOG.md) | Completed changes and supporting evidence |

## Development and contributions

The source for the public website and browser alpha lives in `site/`. Changes are developed through reviewed pull requests with automated checks; the public site is deployed with GitHub Pages.

For project procedures, see [AGENTS.md](AGENTS.md) and the [agent protocol](docs/AGENT_PROTOCOL.md). Research notes are not authorization to implement features. The game is an ongoing hobby project, not a commercial launch announcement.

## License

The project's original code is released under the [MIT License](LICENSE.md). Any third-party materials, if incorporated, remain subject to their applicable terms.
