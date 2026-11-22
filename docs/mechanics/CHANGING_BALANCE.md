# Change a game formula safely — maintenance contract

**Goal:** change a few numbers in one clearly named source location without rediscovering or secretly replacing a mechanic.

## Procedure for chat / CW / Codex

1. **Mandatory project preflight:** fetch remote `main:docs/TD_LIST.md` **first**, then `AGENTS.md`, `docs/WORK_CHECKPOINT.md`, `docs/DECISIONS.md`, `docs/AGENT_PROTOCOL.md`, current files and open PRs. A task list item or handbook idea is not permission for an unapproved change.
2. **Read** [mechanics index](README.md) and only the relevant mechanic page, before editing its formula.
3. **State before and after:** exact parameter name, old/new values, expected gameplay impact, offline-save / balance implications, affected tests, and whether this is an owner-approved rule or a provisional alpha tweak.
4. **Change the single source of truth** listed below; avoid copying constants into another formula, UI component or Markdown. Add a new named setting **before** changing an unknown hard-coded coefficient. Preserve existing stable IDs and saved item keys.
5. **Test behavior**, not only syntax; compare worked examples at level 1, midgame and high levels, rare-tail probabilities and large offline intervals. Use deterministic seeds when randomness is involved.
6. **Migration check:** if the meaning of stored XP, attribute effort, inventory, partial time, elapsed combat, or a saved queue duration changes, write the needed migration/compatibility policy before merging. Do not make a save unreadable to simplify balancing.
7. **Update this handbook in the same PR**, and the changelog when shipped. Follow branch protection, tested PR, main readback, Pages deploy verification and project task/checkpoint updates. A docs-only tweak does not prove a gameplay release.

## One-stop edit locations

| Want to tune | File / named object | Do not rewrite |
| --- | --- | --- |
| Skill XP required per level, Mastered +2%, 2× efficiency cap, ±10% batch variance | `site/play/engine.mjs` → `SKILL_BALANCE` | `xpToNextLevel`, `xpForLevel`, `levelFromXP`, `settleWork`, `variedTotal` |
| Skill-specific base XP, resource output, speed/zone | `site/play/engine.mjs` → `ACTIVITIES` | Queue work settlement loops |
| Skill Master min resource | `site/play/engine.mjs` → `MASTER_DEFAULT_ITEM_MINIMUM`, `MASTER_ITEM_MINIMUM_OVERRIDES` | Master and queue's duplicated eligibility logic |
| Attribute XP/hour and escalating per-stat point costs | `site/play/attributes.mjs` → `ATTRIBUTE_BALANCE` | Attribute effort and quadratic inverse |
| Different stat emphasis for an activity | `site/play/attributes.mjs` → `ACTIVITY_STAT_WEIGHTS[id]` (sum 100) | Overall attribute XP/hour |
| Rare drop unlocks, weights, growth, caps | `site/play/loot.mjs` → `LOOT_TABLES` | `lootChances` and `allocateLoot` |
| Recipes and relative choice weights | `site/play/production.mjs` → `PRODUCTION_RECIPES` | `produce` material-conservation algorithm |
| Current solo combat timing, damage, hit/defense probabilities, 6–6–6 window | `site/play/combat.mjs` → `COMBAT_BALANCE` | `simulateDuel` event ordering and random source |
| Two-skill combat styles, greatsword charge/damage, parry and shield block | `site/play/combat-skills.mjs` → `COMBAT_SKILLS`, `COMBAT_LOADOUTS` | `simulateDuel` turn rules; do not add duplicate skill flags |\n| Named enemy stats and opponent rotation | `site/play/combat.mjs` → `OPPONENTS` | Fight renderer |
| Matching scene assets | `site/play/combat.mjs` → `COMBAT_ART` | Simulation math; never use wrong art |
| Alpha/normal cycle, same/cross-zone travel, preparation | `site/play/engine.mjs` → `TIMING_PROFILE`, `TIMING_PROFILES` | Offline settle and migration |
| Planner 1..8 amount range | `site/play/engine.mjs` → `SCHEDULE_BALANCE` (UI derives options) | `validPlannedDuration` and two UI editors |
| Queue slot cap | `site/play/engine.mjs` → `MAX_WAGONS` **plus structural QA** | Do not assume layout/loop boundaries auto-adjust |

## Tests that must stay green

From repo root:

```sh
node --check site/play/engine.mjs
node --check site/play/combat.mjs\nnode --check site/play/combat-skills.mjs
node --check site/play/loot.mjs
node --check site/play/production.mjs
node --check site/play/attributes.mjs
node --test tools/test_game_engine.mjs tools/test_game_ui.mjs tools/test_combat.mjs
python tools/check_pages_site.py
python tools/check_project_protocol.py
```

The protected-branch GitHub Actions checks are required in addition to any local runs.

### Regression scenarios

- **Progression:** XP threshold L=1, 2, 10; inverse from cumulative XP; one-level XP cap; Master sacrifice once; stat total 100 XP/hour across every activity; point cost increases and no offline power upgrade.
- **Resources:** rarity sums to one; tier locked before required rank; higher tiers replace lower; scarcity / missing ingredients never fabricate output; exact integer conservation after 20 years.
- **Combat:** stable seeded outcomes; greatsword wind-up vs instant thrust; exactly one attack plus one defense skill; shield block chance above blade parry above untrained fallback; separate attack and defense rolls; miss/block/parry/dodge deal zero damage; 6–6–6 only on valid vulnerable-hit windows; inactive activities have no combat skull dice; V6 save migration.
- **Queue:** 1…8 amounts, minutes/hours/days and `untilLevelUp`; first-ready full cycle; correct transition order and productive time; no offline cap; no double rewards; no lost materials on old saves.
- **UI/release:** browser tests for schedule editor amount parity and combat-only dice, correct asset version/paths, then live deployed page. If new original illustrations are added, verify the actual binaries, formats and meaningful event-image matching.

## Prohibited shortcuts

- No hard-coded value changed in a test **instead of** updating the tested rule.
- No silent rewrite of existing save schema, input/output keys or zeroing old progress.
- No fake data (kills, clan contribution, hit artwork, offline recap) to make a prototype appear finished.
- No treating provisional Combat V2 alpha percentages as permanent Owner-approved balance values; change the explicit skill registry, update examples, and run regression tests.
