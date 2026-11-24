# SIM-002 — Modular developer-only game systems lab

This is the permanent, **non-player-facing** way for chat, CW or Codex to test the game's **implemented rules**, repeatedly and reproducibly, without reading and reimplementing each formula. It extends the independent [SIM-001 combat harness](COMBAT_SIMULATOR.md).

**Entry point:** `tools/system-lab.mjs`  
**Modules:** `tools/simulation/*.mjs`  
**Regression tests:** `tools/test_system_lab.mjs`  
**Reusable batch:** `tools/simulation/example-scenarios.json`  
**Remote run:** [Developer Game Systems Lab GitHub Actions](https://github.com/janisp123/idle_game/actions/workflows/system-lab.yml).

This is **not** a hidden admin feature, secret route or debugging switch in the published game. GitHub Pages deploys only `site/`, while this testing code stays in `tools/`. **No production `site/play/**` source, save format, gameplay parameter, user inventory, deployment secret or account is changed by running a scenario.** Node executes pure functions and detached synthetic or locally validated save states.

## Run once, then reuse forever

From the repo root, with Node 22 or later:

```sh
node tools/system-lab.mjs --list
node tools/system-lab.mjs --config tools/simulation/example-scenarios.json > system-report.json
node tools/system-lab.mjs --scenario '{"module":"loot","activity":"mining","level":25,"units":100,"trials":10000}' > loot-report.json
node tools/system-lab.mjs --scenario '{"module":"activity","activity":"fighting","level":10,"difficulty":1,"elapsedMs":86400000,"trials":100}' > fighting-work.json
node tools/system-lab.mjs --scenario '{"module":"enchanting","slot":"weapon","attempts":7,"trials":10000}' > enchanting-report.json
node --test tools/test_system_lab.mjs
```

Every output is JSON. Each module identifies its **exact production source functions**. Multiple scenarios can be run together by passing a JSON object containing `"scenarios": [ ... ]` (up to 20). `"seed"` makes results reproducible; `"trials"` repeats independent synthetic trials (up to 10,000).

The separately installed `tools/combat-simulator.mjs` remains the canonical detailed combat CLI for 10,000+ battles and manual GitHub Actions reports. `"module":"combat"` in this lab calls **that exact simulator** without duplicating the combat algorithm, including 3d6, enemy archetypes, terrain, armour/enchant, HP, guard durability and optional Glory.

## Implemented modules and supported conditions

| Module | Directly imports live production functions | What it measures |
| --- | --- | --- |
| `combat` | `simulateBatch` → `combatAtTime`, `armourStats`, `enchantBonus`, `tallyGloryVictories` | Real duels, grade/stat matching, 3d6, all terrains, full armours/enchants and per-event condition loss; use `battles:10000` |
| `activity` | `chooseActivity`, `setDifficulty`, `settle`, `skillMasterReadiness`, `effectiveAttributeProgress` | Offline skill work, XP cap, materials, rarity via actual settlement, crafting inputs, Glory during Fighting, stat growth, grade effects. **Instant activity selection for focused analysis**; use `queue` to measure travel |
| `loot` | `lootChances`, `allocateLoot` | Rare-tier probabilities versus observed item shares, level gates, strict material conservation; supports 10,000 batches |
| `crafting` | `recipeOptions`, `produce` | Work capacity, unlocked recipes, exact consumed/created inventory, missing ingredients, weighted outputs, no fabricated materials |
| `attributes` | `awardAttributeTime`, `effectiveAttributeProgress` | Stat XP and value from **productive** hours, live activity weight percentages, actual mastery bonus |
| `master` | `skillMasterReadiness`, `skillMasterOffer`, `learnFromMaster` | Unclaimed XP bars, resource gate, exact tribute paid, explicit level claims, stat effects |
| `equipment` | `setCombatLoadout`, `setArmourChoice`, `armourUnlocked`, `armourStats`, `masteryOffer`, `trainEquipmentSlot` | Weapon styles, legal armour swaps, slot-by-slot weight/coverage, mastery unlock costs, durability upgrades |
| `enchanting` | `enchantEquipmentSlot`, `GLORY_RULES` | Real scroll success/failure chain, destroyed ranks, end-rank histograms and cost; simulated test scrolls never reach a player |
| `queue` | `queueStartActivity`, `settle`, `MAX_WAGONS` | Actual route planning, finite and Forever tasks, preparation/travel, sequential work, years-long offline batch settlement |
| `save` | `newGame`, `readSave` | Save schema/migration round-trip stability without writing into browser storage |

**Existing game systems not simulated here:** visual layout, art/audio, network/security (the game is browser-local), eventual raids/clans, real spell skill progression, quests and unimplemented multiplayer. Use the original UI/security tests for interfaces and trust boundaries, not this statistical lab. A test result cannot validate a feature that does not exist.

## Scenario JSON (real conditions, no rewritten formulas)

```json
{
  "scenarios": [
    {
      "module": "loot",
      "activity": "mining",
      "level": 25,
      "units": 100,
      "trials": 10000,
      "seed": 100
    },
    {
      "module": "crafting",
      "activity": "smelting",
      "level": 25,
      "inventory": {"copper_ore": 200, "iron_ore": 120, "silver_ore": 40},
      "workCycles": 100,
      "trials": 2000,
      "seed": 100
    },
    {
      "module": "queue",
      "route": [
        {"activity": "mining", "plannedMs": 60000},
        {"activity": "woodcutting", "plannedMs": null}
      ],
      "elapsedMs": 86400000,
      "trials": 100,
      "seed": 100
    }
  ]
}
```

The `activity` module accepts `activity`, `level`, `xp`, `inventory`, `difficulty` (numeric tier index 0..7), `elapsedMs`, `trials`, and `seed`. It constructs a **labelled synthetic state**, uses the same live batch settlement and enforces the game’s XP cap and level gate. Time must be interpreted using the currently active alpha/normal timing profile. `queue` instead uses the real switching/planning and travel process; each non-final route entry must have a valid `plannedMs` (or `untilLevelUp`) and the final entry runs Forever.

For equipment, pass `slot`, `gear`, `loadout`, optionally `masterySlot`, `train:true`, `inventory` and `levels` to test whether a change is legal at the **actual** current character attributes. To investigate higher stat values without forging levels, run a realistic productive-time session first and use a detached local validated state as the next input. Enchantment trials accept `slot`, `attempts`, `startingRank` and `trials` and expose success/reset counts. The simulator does not fabricate scroll drops for a real save.

### Compare a baseline against an alternative

```json
{
  "compare": {
    "metric": "winRatePct",
    "baseline": {
      "module": "combat", "battles": 10000, "seed": 200,
      "grade": "F", "loadout": "greatsword", "armour": "leather",
      "skill": 10, "str": 14, "dex": 14, "end": 14, "wil": 14
    },
    "variant": {
      "module": "combat", "battles": 10000, "seed": 200,
      "grade": "F", "loadout": "sword_shield", "armour": "leather",
      "skill": 10, "str": 14, "dex": 14, "end": 14, "wil": 14
    }
  }
}
```

This gives both full reports and the numerical `variant - baseline` difference. Other supported numeric paths include `average.earnedXP`, `averageCompletedPerBatch`, `successesPct`, etc., when they actually exist in the chosen module’s output. Compare **similar conditions, the same seed and many trials**; use multiple seeds before declaring balance. A difference is evidence, not an automatic permission to rebalance or a statistical proof.

## Run from GitHub Actions (no local setup)

Open [Developer Game Systems Lab](https://github.com/janisp123/idle_game/actions/workflows/system-lab.yml), choose **Run workflow**, and enter a safe synthetic scenario JSON. The workflow runs the parity/invariant test suite and downloads the requested report as a 7-day artifact. It never deploys gameplay or modifies the player's save. Runs of this **public repository** are public: **do not paste an exported real save, names, passwords, or private state into Actions.** The workflow rejects `state`, `snapshot`, `combatSession`, `player`, `token` and `secret` properties.

For a **local** inspection of an existing save, the `activity`, `master`, `equipment`, `queue`, and `save` adapters accept a validated `state` JSON object via a local config file. It is read using production `readSave` and detached from the original. It may contain personal game information, so keep the file and report on your own machine; never commit or upload them. The independent combat harness supports its original frozen `--snapshot` mode.

## Maintenance/quality contract

1. Future systems get a **new adapter** in `tools/simulation/` that imports the production functions. Register it in `tools/system-lab.mjs`, add deterministic tests in `tools/test_system_lab.mjs`, and update this reference. No duplicate formulas, hidden developer game route, new save keys, or rebalancing as part of a lab extension.
2. Test normal, edge-case and long offline conditions, including seed reproducibility, independent input state, conservation, level/gear gates, and a real production parity reference. Each report says exactly what it simulates, and what it cannot claim.
3. The playable `site/play/**` remains the **only source of truth** for actual gameplay. Existing formal tests of combat, UI, engine and saves remain mandatory. The lab is an additional instrument, not a replacement.
4. Handle findings as **candidate issues**: describe scenario, seed, commit, statistical uncertainty, game impact and potential fixes. Ask the Owner to approve any gameplay/balance change separately.

At every new chat/agent session, check the remote `main:docs/TD_LIST.md` first, then use this lab rather than re-deriving all rules or assuming historical balance values.
