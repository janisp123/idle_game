# SIM-001 — Developer combat simulator (10,000+ real duels)

For the **other implemented game systems**, use [SIM-002 modular systems lab](SYSTEM_LAB.md). It reuses this combat harness rather than cloning its rules.

**Status:** Developer QA, not player-facing. **Canonical CLI:** [tools/combat-simulator.mjs](../../tools/combat-simulator.mjs). **Parity tests:** [tools/test_combat_simulator.mjs](../../tools/test_combat_simulator.mjs).

## What this does

Run the **exact current playable Fighting resolver** on the same frozen fighter snapshot, without waiting for dice animations, scene changes, recovery screens, browser timeouts or real-time travel. The harness calls production `startCombatSession()` and `combatAtTime()` for every bout and never reimplements initiative, attack/defense, opponent selection, RNG, terrain, gear, hit/guard, finisher, HP, condition wear or verdict formulas. Every duel starts with full HP and equipment condition, as in the playable game. A separate simulated duel does not increment player stats, earn Skill Master levels or spend real resources.

Files under `tools/` **are not included in the deployed `site/` directory**. This is **not** a hidden privileged browser/admin route, secret backdoor or invisible developer account. The repository is public, so its source is openly inspectable, but public players cannot activate it through the website. Run it locally in Node 22+ after cloning the repository; future chat/CW/Codex agents should reuse this module instead of manually re-deriving combat rules.

## Run from repository root

```sh
node tools/combat-simulator.mjs --battles 10000
node tools/combat-simulator.mjs --battles 10000 --seed 7241 --grade F --loadout greatsword --armour leather --skill 10 --str 14 --dex 14 --end 14
node tools/combat-simulator.mjs --battles 10000 --grade D --loadout sword_shield --armour leather --armour-slots head:plate,chest:plate --str 22 --dex 22 --end 22 --wil 22 --enchant weapon:3,shield:2,head:4,chest:2 --mastery weapon:1,head:3,shield:1
node tools/combat-simulator.mjs --battles 10000 --grade S --armour plate --enchant weapon:7 --trace 2 > combat-report.json
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
  "wil": 14,
  "enchantments": {"weapon": 2, "head": 1},
  "mastery": {"weapon": 1},
  "trace": 2
}
```

The run uses Node 22 and the same `--config` JSON entrypoint. It prints the headline numbers into the run log and uploads `combat-report.json` as a **7-day Actions artifact**. The developer workflow is not a route inside the game and **does not deploy**. It is triggered automatically on relevant development PRs to verify it still works. You can also run the JSON locally via `--config scenario.json`.

**Privacy:** GitHub Actions runs and reports are visible in this public repository. Enter only fictional/test stats there; the cloud workflow explicitly rejects `snapshot` data. For personal/saved player state, use the local `--snapshot` mode only.

The **default** is 10,000 non-grade, level-1 greatsword duels, no armour, no enchants/mastery and reproducible seed `20261124`. Each grade uses the **actual** `benchmark()` values for skill and STR/DEX/END, and the actual level unlock; this is a **synthetic reference build** and does not claim real players automatically earn these stats. Override the three stats and Fighting skill to assess realistic progression. Generated gear honors actual stat unlock requirements, so an illegal build (e.g. full Plate with STR 10) is rejected instead of being silently treated as equippable.

- `--grade Non-grade|F|E|D|C|B|A|S`: selected Fighting activity difficulty; enemies draw from the **real** six encounter profiles and their randomly assigned equipment.
- `--loadout greatsword|sword_shield|hammer|bow|staff|twin_blades`: player weapon and automatic attack/defense skills.
- `--armour none|leather|plate`: base for all **11 slots**; override individually using `--armour-slots head:plate,left_glove:leather`.
- `--enchant weapon:2,head:1,shield:3` and `--mastery weapon:1,head:2`: real saved per-slot bonuses, including weapon attack, body/shield defense, maximum durability and normal condition wear. Enchants are **fixed** for each frozen combat snapshot; the simulator never fabricates scrolls or auto-enchants gear between fights.
- `--seed N`, `--start-bout N`: original 32-bit combat session seed and **zero-based** bout index. Selecting the same seed, frozen fighter, grade and bout yields exactly the same enemy, terrain and dice as the game.
- `--config scenario.json`: reuse a locally stored JSON object with the same keys as programmatic `simulateBatch()` options; no other flags may be combined with `--config`.
- `--snapshot path.json`: read a **local** JSON frozen `combatSession`, a `{player, seed}` session or a bare frozen fighter object. If the session has an elapsed clock and seed, both are reused by default. Do not combine with synthetic equipment/stats/grade flags. File input and reports remain local unless you choose to share them. Never commit a player's personal save.
- `--trace N`: attach the original production initiative and attack/defense events (with **individual dice faces**, scores, zone D6, damage, HP/armour/weapon condition after each exchange and outcome) for the first N sampled bouts; up to 100 to avoid a giant report. All other bouts contribute complete dice/attack aggregates.
- `--glory-eligible-bouts N`: **optional** original production 50% Glory Scroll drop resolver for the first N complete eligible duels in this batch, using `tallyGloryVictories` and its independent reward RNG. Supply N only for a real XP-eligible window; **this does not simulate XP gain or predict eligibility automatically**.
- `--battles N` supports 1 to 1,000,000; the program uses bounded per-bout work and stores only aggregate metrics plus optional trace samples. No `setTimeout`, animations, network or modifications to browser saves.

The JSON report includes win/loss/draw rates, defeat versus knockout/judge decisions, distributions **by terrain, enemy role and enemy loadout**, initiative order/rerolls, action types (miss/dodge/block/parry/strike/wound/collapse/finisher), exact **3d6 face and sum histograms for both sides**, average HP and condition losses, and optional fully traceable duels. Dice for tied initiative rerolls are not individually exposed by production events; the report counts reroll rounds, and captures the actual **final initiative dice**, without guessing hidden earlier faces.

## Validity and maintenance

1. **Parity source:** `site/play/combat.mjs:combatAtTime`, which internally calls `makeOpponent`, seeded RNG, `simulateDuel`, the grade and terrain module. Equipment comes from `armourStats`; saved enchant totals from `enchantBonus`; condition upgrades from `conditionBonuses`. Optional Glory uses `tallyGloryVictories`. **Never clone formulas into the simulator**.
2. **Regression check:** `node --test tools/test_combat_simulator.mjs`. Required CI also runs a full 10,000-bout simulation and compares sample event traces byte-for-byte against production. Never tune game combat solely to force a target win rate without an Owner decision.
3. **Interpretation:** A 10,000-bout sample is a deterministic scenario, **not a global probability proof**. Compare several seeds, weapons, armours and grades before recommending a balance adjustment. Changes in the actual game automatically change simulator outcomes; there is no independent combat calibration file to update.
4. **Scope:** This measures one-on-one duels and their real effects, **not** real-time UI behavior, skills earned during a session, full economic loot/crafting, raids, team tactics, future magic systems, or an accurate 20-year roll-free offline aggregate. Those require separate mechanics and tests.

When starting later balance research: read current remote `main:docs/TD_LIST.md` first, then project instructions, this page, and use the CLI. Store only useful reviewed benchmark findings, never unverified win-rate claims.
