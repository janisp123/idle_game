# Useful Examples — Browser Game Implementation Reference

**Project:** `janisp123/idle_game`  
**Research date:** 2026-11-19  
**Type:** Broad, public browser-game implementation reference — **NOT** a to-do list, approved dependencies, or an instruction to copy code.  
**Review status:** GitHub READMEs, licenses (where found), and selected implementation files inspected remotely; **no repositories cloned, built, executed or benchmarked yet.**

## Why this file exists

**For everyone:** This is a practical index of existing implementations, even when their mechanics or architecture do not fit our game. Each example should teach reusable ideas, tradeoffs, source paths and what still needs testing. Developers building a different kind of browser game may reasonably choose techniques we reject for ours.

**For our project:** Save time for future Chat / CW / Codex research. Before choosing an implementation for idle activities, content modules, saves, combat, dice, server state or mobile UI, check these verified references and pitfalls instead of searching from zero. For the growing library charter, topic index, and tagging rules, see [RESEARCH_LIBRARY.md](RESEARCH_LIBRARY.md). Detailed independent how-to articles belong under [`docs/library/`](library/ENTRY_TEMPLATE.md).

**Project constraints to protect:** two-activity MVP (stone mining, bunny hunting); beautiful static illustrations; portrait, one-hand mobile UI; 5-task queue; 3d7 encounter dice and one shared group roll; no mana or potions; healing only between battles; 20-member groups with at-most-7-day offline membership; **unlimited solo offline progression even after decades**; no continuous server simulation per dormant account; simple, inexpensive, testable code.

## Relevance and evidence tags

These ratings concern **separate techniques**, not whether the repository is “good” or “bad.” We retain *all* useful examples for public learning, including features irrelevant or inappropriate for our particular idle game.

| Example | Generally useful to learn | Our game — reusable parts | Our game — incompatible parts | Evidence of documented claims |
| --- | --- | --- | --- | --- |
| EX-01 Idle Game Template | Engine boundaries, deterministic RNG, versioned saves, systems and events | `[OUR-GAME: FIT]` pure engine / validated data; `[OUR-GAME: ADAPT]` event-driven simulation | `[OUR-GAME: NOT-FIT]` 8h offline cap, offline combat freeze, desktop floating windows | `[EVIDENCE: CODE-READ]` |
| EX-02 Melvor Clone | Compact idle action, XP, inventory and combat types | `[OUR-GAME: ADAPT]` XP/action definition | `[OUR-GAME: NOT-FIT]` 24h offline cap, per-action 20-year loop, paused offline combat | `[EVIDENCE: CODE-READ]`; license `UNVERIFIED` |
| EX-03 iMMO | Separating server, web client, content and events | `[OUR-GAME: ADAPT]` data and backend boundaries | `[OUR-GAME: UNDECIDED]` C++/Angular implementation | `[EVIDENCE: DOCS]` |
| EX-04 Skill Issue Chronicles | Feature folders, component conventions, equipment UI | `[OUR-GAME: ADAPT]` frontend organization | `[OUR-GAME: NOT-FIT]` heavy 3D/animation stack and daily-login rewards | `[EVIDENCE: DOCS]` plus package script inspection |
| EX-05 IdleLands | Client/server operation, ticks, persistence, deployment tradeoffs | `[OUR-GAME: ADAPT]` operational lessons only | `[OUR-GAME: NOT-FIT]` perpetual dormant-player ticks and legacy stack | `[EVIDENCE: DOCS]`; GPL-3.0 |

For every future reference, give the **general** benefit first and tag our-game fit **per component**; a technique incompatible with our low-pressure design can still be valuable for other games.

## Quick lookup — where to look first

| Need | Start with | What is actually reusable | Avoid |
| --- | --- | --- | --- |
| Modular game engine | [ciefa/idle-game-template](https://github.com/ciefa/idle-game-template) | Pure time-driven systems and event types; engine/UI separation | Its 8-hour offline cap, offline combat freeze, desktop window system |
| Accurate, testable dice | [ciefa RNG](https://github.com/ciefa/idle-game-template/blob/main/src/game/engine/rng.ts) | Explicit seed + counter + deterministic tests | Trusting a browser to award its own multiplayer loot |
| Modular resources/zones | [ciefa data schemas](https://github.com/ciefa/idle-game-template/blob/main/src/game/data/schemas.ts) and [iMMO action definitions](https://github.com/luizantoniona/idle-mmorpg/blob/main/idle-mmorpg-data/idle-mmorpg-action/README.md) | IDs, JSON definitions, schema validation | Hardcoding every mine/enemy/zone separately |
| Minimal mining and XP | [alperiox/skills.ts](https://github.com/alperiox/melvor-clone/blob/main/src/game/skills.ts) | Simple action rules, requirements, XP, input/output handling | Unbounded per-action loops, 24-hour cap, combat paused offline |
| Save format evolution | [ciefa migrations](https://github.com/ciefa/idle-game-template/blob/main/src/save/migrations/index.ts) | Schema versions and migration concept | Assuming save schemas never change |
| Multiplayer server boundaries | [iMMO overview](https://github.com/luizantoniona/idle-mmorpg/blob/main/README.md) | Server owns state; client renders; game content separated | Copying a C++/Angular stack just because it exists |
| Quests / future activity logs | [iMMO event bus](https://github.com/luizantoniona/idle-mmorpg/blob/main/documentation/CharacterEventBus.md) | Publish `item_gained` / `skill_leveled` once, subscribe in other modules | Unvalidated, unbounded event history |
| Feature-based UI folders | [Skill Issue Chronicles development guide](https://github.com/GylanSalih/Skill-Issue-Chronicles/blob/main/docs/showcase/DEVELOPMENT_GUIDE.md) | Separation of features, shared components and style modules | Heavy 3D/animation stack and daily-login features |

**Important:** There is **no verified, ready-made source here** that solves our combination of unlimited 20-year offline calculation **and** synchronized shared multiplayer group rewards. That architecture must be designed and tested specifically for this project.

---

## EX-01 — Idle Game Template (highest-priority architecture example)

**Repository:** https://github.com/ciefa/idle-game-template  
**License checked:** [MIT LICENSE](https://github.com/ciefa/idle-game-template/blob/main/LICENSE) (copyright 2026 ciefa); preserve notices if reusing code. Verify any third-party art separately.  
**Stack:** TypeScript, React, Vite, Vitest, Zod, Zustand, Tauri/Rust desktop shell.  
**Confidence:** HIGH for the cited implementation files, NOT for claims of production readiness.

### Relevant inspected source

- [`src/game/engine/tick.ts`](https://github.com/ciefa/idle-game-template/blob/main/src/game/engine/tick.ts): time (`currentTime`, `deltaMs`) is passed in; ordered systems; player action phase; event emission.
- [`src/game/engine/rng.ts`](https://github.com/ciefa/idle-game-template/blob/main/src/game/engine/rng.ts): seeded random values and a saved counter for reproducibility.
- [`src/game/engine/offline.ts`](https://github.com/ciefa/idle-game-template/blob/main/src/game/engine/offline.ts): adaptive chunking at nearest meaningful event; **hard cap of 8h**, 60% offline efficiency, and most combat disabled.
- [`src/game/systems/mining.ts`](https://github.com/ciefa/idle-game-template/blob/main/src/game/systems/mining.ts): compute cycle time/yield separately; start/advance/stop mining; emit completion events.
- [`src/game/events/types.ts`](https://github.com/ciefa/idle-game-template/blob/main/src/game/events/types.ts): typed event union, including mining completed and XP changes.
- [`src/game/data/schemas.ts`](https://github.com/ciefa/idle-game-template/blob/main/src/game/data/schemas.ts): structured Zod schemas for ore, locations, modules, NPCs, recipes.
- [`src/save/schema.ts`](https://github.com/ciefa/idle-game-template/blob/main/src/save/schema.ts) + [`src/save/migrations/index.ts`](https://github.com/ciefa/idle-game-template/blob/main/src/save/migrations/index.ts): save version declaration and version-to-version migration registry.
- [`CLAUDE.md`](https://github.com/ciefa/idle-game-template/blob/main/CLAUDE.md): developer layout, testing commands and architectural rules.

### What we could adapt

1. **Pure gameplay core:** pass clock and RNG in as explicit inputs, independent of React or any UI.
2. **Plug-in systems:** add `mining` and `hunting` modules to one ordered engine, not separate incompatible loops.
3. **Data-driven content:** create Stone Mine / Bunny Hunting Area as JSON with validated IDs, requirements, reward tables and image IDs.
4. **Typed events:** an encounter can publish `mining_completed`, `bunny_defeated`, `skill_used`, `loot_awarded`; future quests/stats can listen.
5. **Versioned, validated state:** save migrations before real players accumulate years of progress.
6. **Determinism:** replay the same inputs/seed in tests and compare exact results, including dice probability.

### What we must NOT copy

- An 8-hour offline cap, reduced offline efficiency, or pausing combat: all contradict our core promise.
- `simulateOffline` loops up to each event and uses chunks of at most 60 seconds: **cannot simply run that for decades**; requires aggregate math / jumping across state changes.
- Its cargo capacity, ship mechanics, desktop floating windows, and Tauri save-to-local-file authority.
- Generated events for every one of millions of historical actions: keep compact aggregates and a bounded recent event log.
- RNG code **as-is** for server security: deterministic tests are helpful, but server-controlled outcomes must also be protected from prediction/forgery.

**Fit:** learn core structure and patterns; **not** a drop-in online multiplayer backend.

---

## EX-02 — Melvor Clone (small idle skill implementation)

**Repository:** https://github.com/alperiox/melvor-clone  
**License status:** README says **MIT**, but `LICENSE`, `LICENSE.md`, and `COPYING` were **not found at the paths checked**. **Do not directly copy code until the actual licensing terms are confirmed** (or author grants permission).
**Stack:** Vanilla TypeScript, Vite, Vitest, Tauri for desktop.

### Inspected source

- [`src/game/types.ts`](https://github.com/alperiox/melvor-clone/blob/main/src/game/types.ts): compact action, monster, loot, inventory, equipment and game-state interfaces.
- [`src/game/skills.ts`](https://github.com/alperiox/melvor-clone/blob/main/src/game/skills.ts): requirements, timers, input consumption, reward/XP updates.
- [`src/game/engine.ts`](https://github.com/alperiox/melvor-clone/blob/main/src/game/engine.ts): active action dispatch, skill/combat tick.
- [`src/game/offline.ts`](https://github.com/alperiox/melvor-clone/blob/main/src/game/offline.ts): elapsed-time catch-up, rewards and input exhaustion.

### Useful patterns

- A tiny MVP can use clear TypeScript domain types for `SkillActionDef`, `MonsterDef`, `LootDrop`, `GameState`.
- Separate activity **definitions** from activity **execution**.
- Make minimum skill/tool requirements explicit and rewards/XP easy to audit.
- The `bank` is a mapping of item ID to item count — close to our unlimited stack concept.
- Its README states 45 tests; **we have not run them**.

### Cautions

- Offline is capped at **86,400 seconds = 24 hours**.
- Offline calculation loops **once for every action**, so a 20-year absence could be expensive.
- **Combat does not progress offline**.
- Live engine uses `requestAnimationFrame`; our static mobile UI should not need a frame-rate-driven gameplay engine.
- Includes food auto-healing, equipment food slot, selling and town systems: not our design.
- Its simple local-state save model does not solve anti-cheat or synchronized 20-player groups.

**Fit:** an understandable learning example for our first mining encounter and XP, not the server/offline engine.

---

## EX-03 — iMMO / idle-mmorpg (multiplayer separation and JSON content)

**Repository:** https://github.com/luizantoniona/idle-mmorpg  
**License checked:** [MIT LICENSE](https://github.com/luizantoniona/idle-mmorpg/blob/main/LICENSE); preserve copyright notice if reusing software code.  
**Stack:** C++ backend, Angular/TypeScript web client, JSON content files.

### Inspected source and documentation

- [Architecture README](https://github.com/luizantoniona/idle-mmorpg/blob/main/README.md): separate `idle-mmorpg-server/`, `idle-mmorpg-client/`, `idle-mmorpg-data/`.
- [Data README](https://github.com/luizantoniona/idle-mmorpg/blob/main/idle-mmorpg-data/README.md): creature, item, action, skill, spell and world modules.
- [Action README](https://github.com/luizantoniona/idle-mmorpg/blob/main/idle-mmorpg-data/idle-mmorpg-action/README.md): `duration`, `skill`, `experience`, `item`, required world `stage` defined in JSON.
- [Character Event Bus](https://github.com/luizantoniona/idle-mmorpg/blob/main/documentation/CharacterEventBus.md): controllers send internal events when experience, equipment, health or inventory changes.

### Useful patterns

- **Server authority / client presentation split**: server validates and updates actual rewards; phone renders artwork and estimates.
- World/zone/resource/skill definitions are data rather than hardcoded UI behaviors.
- Internal events decouple core activity calculations from later feature modules.
- Its folder boundaries are valuable even if we choose a different implementation language.

### Cautions

- The documented server setup process is unfinished; not verified runnable.
- JSON validation is described as minimal; our implementation should validate references/types robustly and fail loudly.
- Using C++ plus Angular would add build complexity; **study the architectural boundaries, not necessarily the stack**.
- No evidence that it handles dormant group participation or decades of lazy offline reward settlement.

**Fit:** multiplayer/server organizational reference.

---

## EX-04 — Skill Issue Chronicles (frontend feature organization)

**Repository:** https://github.com/GylanSalih/Skill-Issue-Chronicles  
**License checked:** [MIT LICENSE](https://github.com/GylanSalih/Skill-Issue-Chronicles/blob/main/LICENSE) (copyright 2025 Gylan Salih).  
**Stack:** React, TypeScript, Vite, SCSS Modules, Three.js/React Three Fiber, GSAP, React Spring.

### Inspected sources

- [README](https://github.com/GylanSalih/Skill-Issue-Chronicles/blob/main/README.md): activity manager, saves, stats, equipment and UI scope; labeled alpha.
- [Development guide](https://github.com/GylanSalih/Skill-Issue-Chronicles/blob/main/docs/showcase/DEVELOPMENT_GUIDE.md): shows `src/core/`, `src/features/pages/`, `src/shared/`, local components and styles.
- [`package.json`](https://github.com/GylanSalih/Skill-Issue-Chronicles/blob/main/package.json): `test` script merely echoes “No tests specified”, then exits 0.

### What to learn

- Feature-based screen folders; shared UI components; gameplay code separate from page components.
- Consistent type/style/testing conventions and concise developer documentation.

### Reasons **not** to adopt wholesale

- Heavy visual/animation dependencies are unnecessary for our static illustrated portrait UI.
- The development guide says actual unit/E2E test setups are planned; package script confirms there is no real automated test suite configured.
- Some paths stated in the README (`src/contexts/ActivityManager.tsx`, `src/lib/saveManager.ts`) could not be fetched; guide lists different `src/core/` paths. **Docs and live file layout may diverge**.
- Daily reward mechanics and wide class trees conflict with our low-pressure small MVP.

**Fit:** frontend folder layout ideas only; verify exact paths before looking for source implementations.

---

## EX-05 — IdleLands (older online idle server; cautionary reference)

**Repository:** https://github.com/IdleLands/IdleLands  
**License checked:** [GPL-3.0 LICENSE](https://github.com/IdleLands/IdleLands/blob/master/LICENSE). **Do not incorporate code without explicitly reviewing GPL obligations and our project's licensing plan.**  
**Inspected:** [README](https://github.com/IdleLands/IdleLands/blob/master/README.md) and [package.json](https://github.com/IdleLands/IdleLands/blob/master/package.json).

### Potential lessons

- An actual client/server idle MMO structure and operational concerns (database, player sessions, server tick interval, save interval, optional Redis).
- Its README documents environment variables such as `GAME_DELAY` and `SAVE_DELAY`, which demonstrate what server loops and write frequency can cost.
- Can use as a **design comparison** to think critically about servers, connections, and database load.

### Why this is not our foundation

- The README targets Node 10 and older Angular/MongoDB tooling; not a good modern stack to adopt uncritically.
- It describes a repeating server loop; we want **zero continuous per-character simulation for years-dormant accounts**.
- GPL-3.0 has materially different reuse obligations from MIT.

**Fit:** learning and cautionary comparison, not code candidate.

---

## Recommended architecture ideas for OUR game (derived from examples, not yet owner-approved)

A possible minimal repository layout. **Do not create these folders without implementation authorization.**

```text
src/
  core/          # Pure time/RNG/encounter/XP/reward/queue logic; no UI or DB
  content/       # Validated zone, activity, item, enemy, skill, art-ID definitions
  server/        # Authoritative accounts, groups, timestamps, claims, persistence
  ui/            # Portrait pages, static artwork, text logs, thumb navigation
  assets/        # Optimized original illustrations, not third-party game art
  tests/         # Engine, offline equivalence, probability, group invariants
docs/
  BRAINSTORM.md
  USEFUL_EXAMPLES.md
  DECISIONS.md
  TD_LIST.md
```

What all these examples *suggest*, not what they prove:
- Make simulation deterministic and independent of rendering.
- Content and game logic should be separated.
- Track rules/state versions; never rely on rewriting history from volatile current definitions.
- Emit meaningful **bounded** events; do not store millions of rendered logs per offline player.
- Design an **event-driven, server-authoritative, lazy settlement** mechanism for group membership, with a 7-day cutoff and solo fallback.
- Need mathematically efficient catch-up (bulk success/dice/rare-drop sampling) at skill and queue boundaries, **not a 20-year per-tick or per-encounter loop**.
- Do not use JavaScript `Number` for unbounded item totals without safe-integer limits or a deliberate BigInt/large-number strategy.
- Cache mobile image assets, but avoid relying on permanent browser cache persistence.
- License code, libraries and artwork independently.

## Method for expanding the public library (research plan)

1. **Choose one problem or feature per research article.** There is **no requirement** that it serve our own game: study daily-reward systems, crafting, trading, PvP, multiplayer synchronization, offline batching, group loot transactions, RNG, data schemas, responsive UI, server persistence or any other useful browser-game mechanic.
2. **Find 2–4 repositories** with public code and a usable license; prefer maintained projects with tests and clear boundaries.
3. **Inspect real source files, not just README claims**; save repo URL, exact relevant file URL, tech stack, license link, actual behavior, and date checked.
4. **Write a short catalog summary per repository** here, then a **useful how-it-works article** using [ENTRY_TEMPLATE.md](library/ENTRY_TEMPLATE.md) for substantial techniques. Cover algorithms, state flow, tests, performance, and security in original explanations. Include general usefulness plus separate our-game fit/evidence tags.
5. **Check legal compatibility first** before reusing code or assets. No LICENSE file is **not** permission to copy. Preserve applicable notices.
6. **When implementation is approved, run the candidate locally** and its real tests; compare complexity, correctness, mobile rendering and resource usage. Record results separately.
7. **Test our difficult edge cases**, not just simple hourly idle:
   - Online vs offline-equivalent outcomes with identical state and random inputs.
   - 24h, 7-day group cutoff, 1-year, and 20-year absences.
   - 5-task loops, impossible activities, depletion, skill level boundaries and cooldowns.
   - 3d7 rare-drop probabilities; identical seed deterministic verification; statistically correct large-run behavior.
   - 1–20 player groups, fair shared loot splits, leader departure, kicking, and exactly-once claims.
   - Mobile portrait touch usability and memory/bandwidth on a modest Android phone.
8. **Expand the public index**, even for approaches unsuitable for our design; clearly distinguish their general merits from our-game fit. Promote only validated patterns into our gameplay implementation. Actual implementation tasks belong in `docs/TD_LIST.md` only with owner approval.

### Provenance and honesty

All links above are to **public GitHub sources inspected on 2026-11-19**. Some descriptions are derived from README or development documentation and are marked accordingly. Selected code files were read remotely, but there has been **no runtime testing, no security audit, no license counsel, and no performance benchmarking** in this research pass. Repository contents may change. The references are meant to accelerate future research **for anyone**, not substitute for testing.

**For our game only:** use the *smallest* reusable concept that solves the current problem, keep the game visually beautiful and mechanically simple, and avoid unnecessary dependencies, background server loops or processing costs. **For the public library:** document other valid engineering choices too.
