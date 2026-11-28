# Game mechanics source map — The Long Vigil

The public [landing page](../../site/index.html) links to [Play Now](../../site/play/index.html). The play document loads [manager-app.mjs](../../site/play/manager-app.mjs) and the app delegates settlement to [arena-manager.mjs](../../site/play/arena-manager.mjs). The source determines implemented behavior. Use [approved decisions](../DECISIONS.md) for intended scope and the [active backlog](../TD_LIST.md) for pending acceptance.

## Current implementation

| System | Primary source | Evidence |
| --- | --- | --- |
| Public manager, saves and frozen offline settlement | [arena-manager](../../site/play/arena-manager.mjs), [manager lanes](../../site/play/manager-lanes.mjs), [engine](../../site/play/engine.mjs) | [Manager integration](../../tools/test_manager_integration.mjs), [arena-only contract](../../tools/test_arena_only.mjs), [stabilization audit](STABILIZATION_AUDIT_20261128.md) |
| Recruitment, class stages, stances and active-only choice progress | [Battle Group](../../site/play/battle-group.mjs), [class registry](../../site/play/battle-group-classes.mjs), [editor](../../site/play/battle-group-editor.mjs) | [Roster and progression tests](../../tools/test_battle_group.mjs), [manager integration](../../tools/test_group_manager.mjs) |
| Six individual attributes and automatic coin equipment upgrades | [Character attributes](../../site/play/character-attributes.mjs), [group equipment and upgrades](../../site/play/battle-group.mjs), [smith quotes](../../site/play/smith.mjs) | [Individual stats design and provenance](INDIVIDUAL_STATS_PLAN.md), [automatic group upgrade tests](../../tools/test_battle_group.mjs) |
| Ten-second arena, terrain, favorites, clone rank and analytics | [Battle timeline](../../site/play/battle-group-timeline.mjs), [terrain](../../site/play/arenas.mjs), [preferences](../../site/play/arena-preferences.mjs), [rank](../../site/play/battle-group-rank.mjs), [group analytics](../../site/play/battle-group-analytics.mjs) | [Timeline tests](../../tools/test_group_timeline.mjs), [terrain tests](../../tools/test_eight_arenas_v8.mjs), [preferences tests](../../tools/test_arena_preferences.mjs) |
| Real group combat, main class skills and specialization kits | [Team resolver](../../site/play/team-combat.mjs), [abilities](../../site/play/class-ability-policy.mjs), [class kits](../../site/play/class-kits.mjs), [versioned counter rules](../../site/play/group-counter-rules.mjs) | [Group combat tests](../../tools/test_group_combat.mjs), [class identity guide](CLASS_TACTICAL_GUIDE.md), [endgame checks](../../tools/test_group_endgame.mjs) |
| Tower and personal raid qualification | [Endless Tower](../../site/play/endless-tower.mjs), [raid session](../../site/play/raid-session.mjs), [raid rules](../../site/play/raid-rules.mjs) | [Tower tests](../../tools/test_endless_tower.mjs), [raid design and provenance](RAIDS_PLAN.md). New personal raids use combat rule 5. Frozen older rules remain relevant. |
| Local clan membership, treasury, buildings and weekly raids | [Alpha clan](../../site/play/alpha-clan.mjs), [clan raid](../../site/play/clan-raid.mjs) | [Clan tests](../../tools/test_alpha_clan.mjs), [progression tests](../../tools/test_clan_progression.mjs), [buildings plan](../CLAN_BUILDINGS_PLAN.md) |

## Validation and calibration

- Use the [stabilization test sequence](STABILIZATION_EXECUTION_PLAN.md) and [S00 results](STABILIZATION_BASELINE_RESULTS.md) for save, offline and browser verification. [Browser smoke](../../tools/browser-smoke.mjs) serves the Pages entry locally and checks mobile and desktop behavior. Document exact baselines and preserve deterministic frozen outcomes when editing formulas.
- Keep playable changes and their mechanics documentation in the same PR. [System lab](SYSTEM_LAB.md) and [combat simulator](COMBAT_SIMULATOR.md) are developer references. Their scenarios span multiple historical engine generations. The [simulation evidence inventory](SIMULATION_EVIDENCE_INDEX.md) links raw runs, compact aggregates and executable consumers.
- Numerical endgame calibration and open functional follow-ups are tracked in the [active backlog](../TD_LIST.md). Treat design plans and prior combat screens as evidence at their recorded revision.

## Historical specifications and research

The [previous handbook](https://github.com/janisp123/idle_game/blob/8053f7890154e5fcf728f3a242b14355e9fb1132/docs/mechanics/README.md) preserves its candidate notes, links and numerical examples. [Resource and crafting](RESOURCES.md), [queued activities](SCHEDULING.md), [prototype progression](PROGRESSION.md), [old combat](COMBAT.md), [manager redesign](MANAGER_IMPLEMENTATION_PLAN.md) and the [two-fighter plan](TEAM_IMPLEMENTATION_PLAN.md) describe prior implementations and supply fixture context. The [research map](../RESEARCH_MAP.md) leads to optional engineering research.
