# Game mechanics handbook — The Long Vigil

**Purpose:** the human-readable, maintained reference for **what the playable game actually calculates**, where to tune it, what tests prevent regressions, and which mechanics are not implemented. Read this before editing progression, balance, drops, combat, scheduling or offline settlement. This handbook is **our game specification**, separate from `docs/library/`'s general engineering research.

## ARENA-ONLY-001 candidate (PR #199)

Public arena entry points in `arena-manager.mjs` settle Fighting only; allocate 100% productive combat effort using existing Fighting weights, and auto-claim Fighting XP only. Coins buy automatic equipment. Noncombat work/loot/crafting are retired from public play; historical descriptions and developer fixtures below remain for regression. Old material counts clear without conversion, historical noncombat skill levels and already earned stats stay frozen. Offline XP cap, 10-second arena, class progression and analytics remain. No new clan feature. Pending CI and release.

## Manager-only redesign (draft PR #192)

[Implementation plan](MANAGER_IMPLEMENTATION_PLAN.md) · [Max-only tactic screen](MANAGER_TACTICS_SCREEN.md). Candidate runtime `manager-lanes.mjs`, `activity-rotation.mjs`, `manager-equipment.mjs`, `manager-tactics.mjs`, `manager-app.mjs`; old shipped mechanics remain below until release. Phase 7 candidate tests and endgame sensitivity pending; no public deployment.

## Read the mechanic you are changing

| Mechanic | Exact formula and invariants | Executable source / tuning |
| --- | --- | --- |
| Skill XP, automatic mastery stats, STR/DEX/END | [Progression](PROGRESSION.md) | `site/play/engine.mjs` → `SKILL_BALANCE`, `ACTIVITIES`, `MASTER_RESOURCE_MINIMUM`; `site/play/attributes.mjs` → `ATTRIBUTE_BALANCE`, `ACTIVITY_STAT_WEIGHTS` |
| Skill-gated drops, rarity, crafting | [Resources](RESOURCES.md) | `site/play/loot.mjs` → `LOOT_TABLES`; `site/play/production.mjs` → `PRODUCTION_RECIPES`; engine `SKILL_BALANCE.batchVariation` |
| [Compact action results](RESULTS.md) — fighting and all work | [Results](RESULTS.md) | `site/play/result-readout.mjs`, `site/play/app.mjs` |
| [Equipment and the smith](ARMOUR.md) — grade, quality, weight and physical counters | [Armour](ARMOUR.md) | `site/play/armour.mjs`; `engine.mjs:setArmourChoice` |
| Playable two-skill turn-based Fighting V2 alpha | [Combat](COMBAT.md) | `site/play/combat.mjs` → `COMBAT_BALANCE`, `OPPONENTS`; `site/play/combat-skills.mjs` → `COMBAT_SKILLS`, `COMBAT_LOADOUTS`; `site/play/combat-art.mjs` → `COMBAT_ART` |
| [Developer-only modular systems lab](SYSTEM_LAB.md) — real offline work, loot, crafting, attributes, mastery, equipment, arena coins, queue and saves | [Scenarios and parity](SYSTEM_LAB.md) | `tools/system-lab.mjs`, `tools/simulation/*.mjs`; imports actual engine and resource functions, outside public site |
| [Developer-only combat simulator](COMBAT_SIMULATOR.md) — 10,000+ real, zero-delay duels with physical events, terrain and the smith build | [Simulation and parity](COMBAT_SIMULATOR.md) | `tools/combat-simulator.mjs` imports production `combatAtTime`, `armourStats`, `equipmentBonuses`, `arenaReward`; runs outside the published site |
| Alpha-only testing switches — reset, 24h idle, ×10 clock | [Alpha Tools](ALPHA_TOOLS.md) | `site/play/alpha-tools.mjs`, `app.mjs` |
| Work cycles, switches, schedule, offline and saves | [Scheduling & offline](SCHEDULING.md) | `site/play/engine.mjs` → `TIMING_PROFILE`, `TIMING_PROFILES`, `SCHEDULE_BALANCE`, `MAX_WAGONS` |
| How to edit formulas without regressing saves | [Change checklist & tests](CHANGING_BALANCE.md) | `tools/test_game_engine.mjs`, `tools/test_combat.mjs`, `tools/test_game_ui.mjs` |

## Two-gladiator release candidate (PR #188)

[Team implementation](TEAM_IMPLEMENTATION_PLAN.md), [balance and reward sensitivity](TEAM_004_SENSITIVITY.md), [combined verified trajectories](TEAM_004_COMBINED.json). The draft uses `team-combat.mjs` centered width 8–10, `team-timeline.mjs` team-only reward Math.round(arenaReward(grade) × 1.4), independent selected gear/effort in `team.mjs`, shared Teamwork capped/login activation in `teamwork.mjs`, and V17 local save. The existing solo prize table is unchanged. See checkpoint for deployment status; candidate is not yet live.

## Authority and freshness

1. **Owner decisions and safety constraints:** `docs/DECISIONS.md`, `AGENTS.md`, `docs/TD_LIST.md` (current remote `main`). Design ideas are not an implementation permit.
2. **Actual playable behavior:** the referenced `site/play/*.mjs` source and verified tests. **Code is the runtime source of truth.** This handbook explains it, never silently overrides it.
3. **Future mechanics:** mark **PLANNED / NOT IMPLEMENTED** explicitly. Never describe approved design as shipped behavior. The current combat resolver implements V2's two-ability attack/defense turns; clan combat, ability mastery and a complete per-opponent art library remain unimplemented (the first 12 event images now ship).
4. **Tune data, not formulas:** change named balance objects and content tables, rather than finding and replacing numeric literals in algorithms. Some changes alter save interpretation; use [change checklist](CHANGING_BALANCE.md).
5. **Keep docs in the same PR as formula changes.** Update numerical examples, relevant tests, and `docs/CHANGELOG.md` when a new mechanic ships. No independent duplicate copies of “official” values in other documentation.

**Latest audit:** 2026-11-24; baseline: deterministic physical solo Fighting alpha, three-wagon alpha schedule, skill XP capped until Skill Master, time-based three attributes, weighted loot/crafting, V11 local saves. This is a browser-local prototype; no server-authoritative multiplayer or clan battle settlement.

### Battle analytics (candidate BATTLE-ANALYTICS-001)

`battle-analytics.mjs` consumes the same resolved, weighted team schedule as arena settlement, not replayed UI previews. The manager persists totals with its existing save; old saves start with empty analytics. Gross coins per completed arena hour excludes wallet credits and paused time, includes scheduled recovery. Weapon rows overlap when enemies use different weapons; team-pair and terrain counts partition the total. Latest setup is the latest consecutive fought selection (weapon, armour family, tactic); automatic grade/mastery changes do not reset it. No per-bout history or combat tuning. Candidate validation pending.

### Progression-matched rivals (NPC-PARITY-001 candidate)

See [design and validation](NPC_PARITY_PLAN.md). V4 manager timeline uses real derived shared attributes, earned skill, per-fighter gear and practice budgets, identical player snapshot construction and Teamwork, independent seeded equipment/tactic decisions, and unchanged terrain/combat resolver. Win prize tier follows existing Fighting-level smith grade gates. Previous v3 in-flight bout is paid once before conversion. Legacy routes remain unchanged. Validation pending.
