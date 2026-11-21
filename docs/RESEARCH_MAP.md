# Research map — fast topic lookup

**Optional reference, not a game specification or task list.** Codex can see the topic names in `AGENTS.md` without loading this file. For a technical design choice, skim this small map, then open only the relevant guide. Skip research for routine unrelated work. `docs/TD_LIST.md`, `AGENTS.md` and `docs/DECISIONS.md` take precedence.

| Need | Already researched options | Open only if relevant |
| --- | --- | --- |
| Game engine structure | Pure simulation (P01), configurable content (P04), domain events (P06) | [P01 overview](USEFUL_EXAMPLES.md#p01--pure-gameplay-simulation) |
| Years of offline progress | Event-boundary catch-up (P02), time units, resource depletion, fast-forward (P15) | [Time-safe offline simulation](library/offline-time-units-and-boundaries.md) |
| Combat design | Independent damage/timers/rewards (P17); sampling, rate estimation, replay (P18) | [Combat modules](library/combat-module-boundaries.md), [offline combat choices](library/offline-combat-estimation.md) |
| RNG and rare drops | Weighted tables and bulk statistical sampling (P03) | [P03 overview](USEFUL_EXAMPLES.md#p03--randomness-loot-and-bulk-sampling) |
| Saves and reward safety | Save migration (P05), inventory accounting (P13), atomic settlement/idempotency (P16) | [Reward settlement](library/idempotent-reward-settlement.md), [P05 overview](USEFUL_EXAMPLES.md#p05--save-versions-and-migrations) |
| Multiplayer/group systems | Server authority (P07), cooperative reward allocation (P08), live transport tradeoffs (P10) | [P08 overview](USEFUL_EXAMPLES.md#p08--shared-group-rewards-and-membership-windows) |
| Mobile UI and updates | Responsive layout (P09), cache versioning, PWA lifecycle, save compatibility | [Browser release guide](library/coherent-browser-game-releases.md), [P09 overview](USEFUL_EXAMPLES.md#p09--mobile-first-illustrated-interface) |
| Testing and operations | Test structure, observability, cost measurement (P14) | [P14 overview](USEFUL_EXAMPLES.md#p14--project-structure-testing-and-performance) |
| Alternatives that may not fit | Offline caps (P11), daily streaks (P12) | [P11](USEFUL_EXAMPLES.md#p11--offline-time-caps), [P12](USEFUL_EXAMPLES.md#p12--daily-rewards-and-streaks) |

For additional detail, use the [full research catalogue](USEFUL_EXAMPLES.md#quick-index) or [library index](RESEARCH_LIBRARY.md#reading-order), but **never load the entire collection automatically**. Fit tags mean potential suitability, not owner approval. These entries are design notes unless independently proven and tagged otherwise.

**Maintenance:** Update a row only when a substantive new topic or better guide changes the lookup path. Keep this file short (under 3.5 KB); do not duplicate article explanations or add unapproved tasks.
