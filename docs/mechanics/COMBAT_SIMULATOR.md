# SIM-001 — Developer combat simulator (10,000+ real duels)

For the **other implemented game systems**, use [SIM-002 modular systems lab](SYSTEM_LAB.md). It reuses this combat harness rather than cloning its rules.

**Status:** Developer QA, not player-facing. **Canonical CLI:** [tools/combat-simulator.mjs](../../tools/combat-simulator.mjs). **Parity tests:** [tools/test_combat_simulator.mjs](../../tools/test_combat_simulator.mjs).

## What this does

Run the **exact current playable Fighting resolver** on the same frozen fighter snapshot, without waiting for scene changes, recovery screens, browser timeouts or real-time travel. The harness calls production `startCombatSession()` and `combatAtTime()` for every bout and never reimplements initiative, attack/defense, opponent selection, RNG, terrain, gear, hit/guard, finisher, HP, condition wear or verdict formulas. Every duel starts with full HP and equipment condition, as in the playable game. A separate simulated duel does not increment player stats, earn Skill Master levels or spend real resources.

Files under `tools/` **are not included in the deployed `site/` directory**. This is **not** a hidden privileged browser/admin route, secret backdoor or invisible developer account. The repository is public, so its source is openly inspectable, but public players cannot activate it through the website. Run it locally in Node 22+ after cloning the repository; future chat/CW/Codex agents should reuse this module instead of manually re-deriving combat rules.

## Run from repository root

```sh
node tools/combat-simulator.mjs --battles 10000
node tools/combat-simulator.mjs --battles 10000 --seed 7241 --grade F --loadout greatsword --armour leather --skill 10 --str 14 --dex 14 --end 14
node tools/combat-simulator.mjs --snapshot ./frozen-session.json --battles 10000 --trace 2
node tools/combat-simulator.mjs --config scenario.json > combat-report.json
node tools/combat-simulator.mjs --help
```

## Run it remotely in GitHub Actions (no local setup)

Open [Developer Combat Simulator](https://github.com/janisp123/idle_game/actions/workflows/combat-simulator.yml), select **Run workflow** and enter a scenario JSON object such as:

```json
{
  "battles": 10000,
  "seed": 20261124,
  "grade": "F",
  "loadout": "greatsword",
  "armour": "leather",
  "skill": 10,
  "str": 14,
  "dex": 14,
  "end": 14,
  "itemGrade": 1,
  "quality": "fine",
  "trace": 2
}
```

The run uses Node 22 and the same `--config` JSON entrypoint. It prints the headline numbers into the run log and uploads `combat-report.json` as a **7-day Actions artifact**. The developer workflow is not a route inside the game and **does not deploy**. It is triggered automatically on relevant development PRs to verify it still works. You can also run the JSON locally via `--config scenario.json`.

**Privacy:** GitHub Actions runs and reports are visible in this public repository. Enter only fictional/test stats there; the cloud workflow explicitly rejects `snapshot` data. For personal/saved player state, use the local `--snapshot` mode only.

The **default** is 10,000 non-grade, level-1 greatsword duels, no armour, Non-grade Poor equipment and reproducible seed `20261124`. Each grade uses the **actual** `benchmark()` values for skill and STR/DEX/END, and the actual level unlock; this is a **synthetic reference build** and does not claim real players automatically earn these stats. Override the three stats and Fighting skill to assess realistic progression.

- `--grade Non-grade|F|E|D|C|B|A|S`: selected Fighting activity difficulty; enemies draw from the **real** five encounter profiles and their randomly assigned equipment.
- `--loadout greatsword|sword_shield|hammer|bow|spear`: player weapon and automatic attack/defense skills.
- `--armour none|padded|leather|plate`: base for all **four slots**; override individually using `--armour-slots head:plate,arms:leather`.
- `--seed N`, `--start-bout N`: original 32-bit combat session seed and **zero-based** bout index. Selecting the same seed, frozen fighter, grade and bout yields exactly the same enemy, terrain and outcomes as the game.
- `--config scenario.json`: reuse a locally stored JSON object with the same keys as programmatic `simulateBatch()` options; no other flags may be combined with `--config`.
- `--snapshot path.json`: read a **local** JSON frozen `combatSession`, a `{player, seed}` session or a bare frozen fighter object. If the session has an elapsed clock and seed, both are reused by default. Do not combine with synthetic equipment/stats/grade flags. File input and reports remain local unless you choose to share them. Never commit a player's personal save.
- `--trace N`: attach the actual physical events, HP, condition, and verdict for up to 100 sampled bouts.
- `--battles N` supports 1 to 1,000,000; the program uses bounded per-bout work and stores only aggregate metrics plus optional trace samples. No `setTimeout`, animations, network or modifications to browser saves.

The JSON report includes victories, defeats and double deaths, grouped by terrain, enemy role and style, with event counts, HP and condition changes, and exact victory coins.

## Validity and maintenance

1. **Parity source:** `site/play/combat.mjs:combatAtTime`, which internally calls `makeOpponent`, seeded positioning and `resolvePhysicalDuel`. Equipment comes from `armourStats`, `equipmentBonuses`, and `equippedCondition`. Victory coins use `arenaReward`. **Never clone formulas into the simulator**.
2. **Regression check:** `node --test tools/test_combat_simulator.mjs`. Required CI also runs a full 10,000-bout simulation and compares sample event traces byte-for-byte against production. Never tune game combat solely to force a target win rate without an Owner decision.
3. **Interpretation:** A 10,000-bout sample is a deterministic scenario, **not a global probability proof**. Compare several seeds, weapons, armours and grades before recommending a balance adjustment. Changes in the actual game automatically change simulator outcomes; there is no independent combat calibration file to update.
4. **Scope:** This measures one-on-one duels and their real effects, **not** real-time UI behavior, skills earned during a session, full economic loot/crafting, raids, team tactics, the offline aggregate or the browser UI. Those require separate mechanics and tests.

When starting later balance research: read current remote `main:docs/TD_LIST.md` first, then project instructions, this page, and use the CLI. Store only useful reviewed benchmark findings, never unverified win-rate claims.

Use `--item-grade 2 --quality fine` to set the generated fighter’s item grade and quality. The report counts actual victory coins.

## A3 expertise fixtures

Synthetic generated snapshots default to fully trained gear so prior gear-only comparisons remain comparable; this is not a real new character's default. An explicit `expertiseHours` JSON object overrides individual tracks, e.g. `{"bow":4000,"greatsword":0,"plate":4000}` for a veteran archer trying an unfamiliar greatsword while retaining Plate experience. Unspecified tracks stay fully trained in synthetic fixtures. Use valid weapon/family IDs and nonnegative hours representable as safe integer quarter-ms units. `node tools/gladiator-benchmark.mjs` adds a 14,400-duel matched expertise matrix; real progression uses the separate `tools/simulation/build-progression.mjs` engine harness with earned counters starting at zero. See [COMBAT.md](COMBAT.md).
