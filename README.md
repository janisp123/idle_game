# The Long Vigil · Idle Game

*An independent grimdark idle gladiator RPG and open browser-game engineering project.*

The Long Vigil is the playable game in the Idle Game hobby project. Fight automatically in the arena, earn equipment, train a specialist and support your character through survival work. Choose a path, let time pass and return when it suits you.

**This project is actively evolving.** Mechanics, content, visuals and long-term plans may change as ideas are tested. The current build is an experiment, not a promise of a fixed final feature set.

![Gladiator striking a shield with a two-handed sword](site/assets/gladiator-shield-clash.png)

## Play the current alpha

- **[Play in your browser](https://janisp123.github.io/idle_game/play/)**
- **[Visit the project website](https://janisp123.github.io/idle_game/)**

The playable alpha is an experimental, accelerated test build. Expect changes, rough edges and ongoing balancing. Progress is stored **locally in your browser** and alpha saves may be reset; there are no online accounts, multiplayer or cross-device save synchronization. This is not a production-ready game.

## What you can play now

- Automatic physical combat in five arenas, with bow, spear, sword & shield, greatsword or war hammer.
- Arena coins and equipment from Non-grade through S, with Poor, Common, Fine and unbreakable Masterwork quality, four armour slots and material/handling trade-offs.
- Separate retained weapon and armour expertise; equipment purchase gates use activated Fighting level and coins, not character class. All arena difficulties can be attempted.
- Strength, dexterity and endurance; eleven activities: Fighting, Hunting, Fishing, Foraging, Woodcutting, Mining, Smithing, Construction, Cooking, Farming and Training.
- Unlimited offline elapsed time, queued work and explicit Skill Master claims. Effective stats and gear are frozen during absence; skill XP is capped at one unclaimed level bar.
- Expandable live character statistics with actual source breakdowns, and developer-only production-linked combat and systems simulations.

The long-term balance target is one specialized endgame build after approximately six months of sustained normal-profile progression, not a calendar lock or guaranteed outcome. Current alpha timing is deliberately accelerated.

## Guiding ideas

- **Progress at your own pace.** The game is designed for players who may step away for long periods rather than check in every day.
- **A world worth returning to.** Different activities, character development and encounters should create lasting choices without demanding constant attention.
- **Atmosphere over noise.** Original dark-fantasy artwork and a readable, mobile-friendly interface matter as much as the underlying rules.
- **Build carefully, change when needed.** Gameplay decisions are tested and revised; ideas are not guaranteed features.

These are design goals, not a final roadmap. For current implementation details, use the mechanics documentation and repository history rather than this overview.

## A Hobby, Not a Business

The Long Vigil is my first gaming project, built out of curiosity, passion and a desire to create something enjoyable.

**It will always be 100% free.**

- No advertisements.
- No microtransactions.
- No subscriptions.
- No pay-to-win mechanics.
- No donations or financial contributions.

Not even a button to buy me a coffee.

There is, however, a catch. This is an independent hobby project, not a commercial product. Development may be slow or irregular. Bugs, balance issues, unfinished features and loss of progress are possible.

By choosing to play, you acknowledge and accept these risks. I cannot guarantee uninterrupted availability, preservation of progress or regular updates.

Constructive feedback is always welcome, but please respect that this project is developed in my free time.

Enjoy the game for what it is — something made for the joy of creating.

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
