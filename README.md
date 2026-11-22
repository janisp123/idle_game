# Idle Game — Browser Game Engineering Library

A public hobby project with **two parallel purposes**:

1. **Build an original idle fantasy browser RPG** with mobile portrait controls, atmospheric static illustrations, automated activities, cooperative play and unlimited offline progression.
2. **Maintain a public learning library** explaining practical browser-game mechanics and engineering techniques, including approaches we will never use ourselves.

The repository contains the public engineering research library **and a playable, browser-local alpha** with 41 activities, time-based attributes, autonomous Fighting duels, schedules and unlimited offline settlement. Combat art and clan battles are still incomplete; multiplayer accounts are not implemented.

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
| [Mechanics handbook — exact live formulas and balance settings](docs/mechanics/README.md) | Source-of-truth map for XP, drops, combat, scheduling, saves and how to tune values safely |
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

## Playable alpha controls and limits

Use **Activities** to select Fighting, gathering, crafting, training or leisure; configure a three-activity route with a final **Forever** task. Active **alpha testing timings** run full work cycles at 10 seconds each; normal activity durations and transitions are preserved in the engine. Every activity has an independent skill XP bar, capped until the player confirms Skill Master training. Five uncapped time-based attributes (STR/DEX/END/INT/WIL) grow through productive work.

**Fighting V1** automatically resolves named-foe duels with hit/block/dodge, HP, wound and 6–6–6 finisher outcomes. It currently has a **textual combat event panel and a generic arena backdrop**, not unique paintings for every hit, attack/defense skill checks, persistent injuries or clan warfare. The planned turn-based Combat V2 is explained separately from the actual V1 rules in the [combat mechanics page](docs/mechanics/COMBAT.md).

Progress is saved in **browser localStorage only** and settled in bounded batches after absence. There is no cross-device account sync or server anti-cheat. See the [mechanics handbook](docs/mechanics/README.md) for the actual formulas, every tunable value, save invariants and regression tests.

**Visual design:** see [Visual language](docs/VISUAL_LANGUAGE.md) for the shared grimdark artwork and UI rules. The approved activity paintings live in `site/play/assets/hunting.webp` and `site/play/assets/mining.webp`; the original flat vector placeholders have been removed.
