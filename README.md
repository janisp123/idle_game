# Idle Game — Browser Game Engineering Library

A public hobby project with **two parallel purposes**:

1. **Build an original idle fantasy browser RPG** with mobile portrait controls, atmospheric static illustrations, automated activities, cooperative play and unlimited offline progression.
2. **Maintain a public learning library** explaining practical browser-game mechanics and engineering techniques, including approaches we will never use ourselves.

The repository contains the public engineering research library **and a first playable local browser prototype** with automatic wolf hunting, stone mining and offline catch-up. This is not yet a full combat RPG.

## Project website

The [Idle Game landing page](https://janisp123.github.io/idle_game/) introduces the game concept and engineering library; **Play Now** leads to the [first playable prototype](https://janisp123.github.io/idle_game/play/) after its branch is approved, merged and deployed.

The source lives in `site/`. The [Pages workflow](.github/workflows/pages.yml) validates it on pull requests and publishes that folder after approved changes are merged into `main` (when GitHub Pages is configured to use GitHub Actions). No external site generator or paid hosting is required.

## Test every playable build in the browser

The landing page has an enabled **Play Now** link to `site/play/index.html` (public route after merge: `https://janisp123.github.io/idle_game/play/`). Future playable changes must update this served browser game. No download-and-open workflow.

The GitHub Pages workflow deploys all of `site/` after approved merges to `main`, and the site checker enforces that the button points to a real local entrypoint when present. The owner should be told that deployment can take a short time after merge, and the live link should be verified before claiming it works. A first playable **prototype only** has been implemented; full combat, multiplayer, equipment and persistent online accounts are not yet present. Owner approval is still required for new gameplay scope and merges (see `docs/DECISIONS.md` SITE-001 and MVP-001).

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

## First prototype controls and limits

Select **Hunting** (wolves: 1 hide and 3 XP every 7 seconds) or **Mining** (1 stone and 2 XP every 5 seconds). Actions loop automatically. Reopening the browser settles the elapsed time in bulk and applies earned level-ups **only on returning** (OFF-001). A clearly marked **Test 1 day away** control enables quick local testing. Progress is stored in browser localStorage only, not synchronized between devices or backed up. Clearing browser data erases the character; it is not cheat-resistant. Both activity scenes are original, first-pass static SVG illustrations. Combat outcomes, health/death, equipment and more elaborate art are future work.

Core algorithm: `site/play/engine.mjs`; browser UI: `site/play/app.mjs`; deterministic regression tests: `tools/test_game_engine.mjs` run by the GitHub Pages validation job.
