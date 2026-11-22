# Game mechanics handbook — The Long Vigil

**Purpose:** the human-readable, maintained reference for **what the playable game actually calculates**, where to tune it, what tests prevent regressions, and which mechanics are not implemented. Read this before editing progression, balance, drops, combat, scheduling or offline settlement. This handbook is **our game specification**, separate from `docs/library/`'s general engineering research.

## Read the mechanic you are changing

| Mechanic | Exact formula and invariants | Executable source / tuning |
| --- | --- | --- |
| Skill XP, mastery, STR/DEX/END/INT/WIL | [Progression](PROGRESSION.md) | `site/play/engine.mjs` → `SKILL_BALANCE`, `ACTIVITIES`, `MASTER_RESOURCE_MINIMUM`; `site/play/attributes.mjs` → `ATTRIBUTE_BALANCE`, `ACTIVITY_STAT_WEIGHTS` |
| Skill-gated drops, rarity, crafting | [Resources](RESOURCES.md) | `site/play/loot.mjs` → `LOOT_TABLES`; `site/play/production.mjs` → `PRODUCTION_RECIPES`; engine `SKILL_BALANCE.batchVariation` |
| Playable two-skill turn-based Fighting V2 alpha | [Combat](COMBAT.md) | `site/play/combat.mjs` → `COMBAT_BALANCE`, `OPPONENTS`, `COMBAT_ART`; `site/play/combat-skills.mjs` → `COMBAT_SKILLS`, `COMBAT_LOADOUTS` |
| Work cycles, switches, schedule, offline and saves | [Scheduling & offline](SCHEDULING.md) | `site/play/engine.mjs` → `TIMING_PROFILE`, `TIMING_PROFILES`, `SCHEDULE_BALANCE`, `MAX_WAGONS` |
| How to edit formulas without regressing saves | [Change checklist & tests](CHANGING_BALANCE.md) | `tools/test_game_engine.mjs`, `tools/test_combat.mjs`, `tools/test_game_ui.mjs` |

## Authority and freshness

1. **Owner decisions and safety constraints:** `docs/DECISIONS.md`, `AGENTS.md`, `docs/TD_LIST.md` (current remote `main`). Design ideas are not an implementation permit.
2. **Actual playable behavior:** the referenced `site/play/*.mjs` source and verified tests. **Code is the runtime source of truth.** This handbook explains it, never silently overrides it.
3. **Future mechanics:** mark **PLANNED / NOT IMPLEMENTED** explicitly. Never describe approved design as shipped behavior. The current combat resolver implements V2's two-ability attack/defense turns; clan combat, ability mastery and matching event art remain unimplemented.
4. **Tune data, not formulas:** change named balance objects and content tables, rather than finding and replacing numeric literals in algorithms. Some changes alter save interpretation; use [change checklist](CHANGING_BALANCE.md).
5. **Keep docs in the same PR as formula changes.** Update numerical examples, relevant tests, and `docs/CHANGELOG.md` when a new mechanic ships. No independent duplicate copies of “official” values in other documentation.

**Latest audit:** 2026-11-22; baseline: deterministic two-skill solo Fighting V2 alpha, three-wagon alpha schedule, skill XP capped until Skill Master, time-based five attributes, weighted loot/crafting, V7 local saves. This is a browser-local prototype; no server-authoritative multiplayer or clan battle settlement.
