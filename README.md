# Idle Game — Browser Game Engineering Library

A public hobby project with **two parallel purposes**:

1. **Build an original idle fantasy browser RPG** with mobile portrait controls, atmospheric static illustrations, automated activities, cooperative play and unlimited offline progression.
2. **Maintain a public learning library** explaining practical browser-game mechanics and engineering techniques, including approaches we will never use ourselves.

This repository is currently primarily design documentation and engineering research. **The game is not yet implemented.**

## Project website

The [Idle Game landing page](https://janisp123.github.io/idle_game/) introduces the game concept and public engineering library. It is **not a playable game** yet.

The source lives in `site/`. The [Pages workflow](.github/workflows/pages.yml) validates it on pull requests and publishes that folder after approved changes are merged into `main` (when GitHub Pages is configured to use GitHub Actions). No external site generator or paid hosting is required.

## Test every playable build in the browser

The public landing page will always have a prominent **Play Now** control. **It stays disabled until a real playable build exists.** When the owner approves and merges the first playable prototype, the game must be served at `site/play/index.html` (public route: [Play Now](https://janisp123.github.io/idle_game/play/)), and the landing page must link to `./play/` in the same PR. Future playable changes must also update this served game rather than asking testers to download and open HTML files.

The GitHub Pages workflow deploys all of `site/` after approved merges to `main`, and the site checker enforces that the button points to a real local entrypoint when present. The owner should be told that deployment can take a short time after merge, and the live link should be verified before claiming it works. No game has been implemented yet. This is a **delivery requirement**, not authorization to start gameplay development (see `docs/DECISIONS.md` SITE-001).

## License

This project is **open-source software** under the [MIT License](LICENSE.md). Feel free to read, use, modify, and share the code, including in commercial projects, as long as you keep the required copyright and license notice.

Original third-party materials, if added later, remain subject to their own licenses.

## Explore

| Resource | Purpose |
| --- | --- |
| [Research library](docs/RESEARCH_LIBRARY.md) | Purpose, topic index, article standards and relevance labels |
| [Useful implementation examples](docs/USEFUL_EXAMPLES.md) | Standalone algorithms, tradeoffs and implementation sketches |
| [Technical article template](docs/library/ENTRY_TEMPLATE.md) | Consistent format for future educational guides |
| [Game brainstorm](docs/BRAINSTORM.md) | Design possibilities, directions, rejected ideas and open questions |
| [Durable decisions](docs/DECISIONS.md) | Owner-approved project decisions |
| [Development tasks](docs/TD_LIST.md) | Actual authorized implementation tasks |
| [Working checkpoint](docs/WORK_CHECKPOINT.md) | Verified current status, limits and handoff for chat/CW/Codex |
| [Completed milestones](docs/CHANGELOG.md) | Merged repository work, with PRs and evidence |
| [Security policy](SECURITY.md) | Public site security boundary and responsible reporting guidance |

## Two different kinds of relevance

A technique can be valuable to browser-game developers **even when it doesn't suit our own game**. Entries use `FIT`, `ADAPT`, `NOT-FIT` and `UNDECIDED` tags **only to assess our game**. Evidence labels distinguish untested design notes, prototypes, executed tests and benchmarks.

## Documentation principles

The public guides are independently written explanations and original illustrative examples. They do not name particular games consulted while researching, link to outside research repositories, or reproduce third-party code/artwork. No claims of testing are made without real test results. If third-party software is ever integrated into the game, applicable copyright licenses and mandatory notices must be respected.

## Chat / CW / Codex coordination

Read [AGENTS.md](AGENTS.md) and the [agent protocol](docs/AGENT_PROTOCOL.md) before taking project actions, beginning with current remote `main:docs/TD_LIST.md`. The owner approves changes. Brainstorming and library materials **do not** authorize gameplay implementation.
