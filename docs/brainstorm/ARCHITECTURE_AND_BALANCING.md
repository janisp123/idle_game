# Modular architecture, simulation and balancing

**Status:** Brainstorming, not approved implementation tasks. Updated 2026-11-20.

## Current direction
- Keep the prototype tiny, but make the engine **modular and data-driven** so adding new skills, monsters, equipment slots, races or terrains doesn't require rewriting the game.
- **One shared combat engine** powers live gameplay and the **headless combat simulator**. Never maintain separate combat formulas.
- Use the simulator to run thousands of reproducible encounters; measure win rate, survival, damage and time to kill, skill XP/hour, interruptions, rewards, and environment-specific matchups.
- Content definitions use stable IDs: skills, allowed weapons, combat timelines, damage types, active/passive effects, environment properties and narrative event templates.
- Support deterministic/seeded tests for combat effects and story consistency; don't narrate an injury or dodge that the engine didn't resolve.
- Client playback and server-authoritative progression are separate concerns. Watching, speeding up, skipping and offline settlement must lead to the **same game progress**.
- Initially test locally without accounts or a multiplayer server. Add persistence/authoritative calculations when multiplayer actually exists.
- Prioritize a simple modular monolith and low operating costs over elaborate abstractions.
- The game is currently a **documentation project**, not working gameplay. Code requires an explicitly approved task in `docs/TD_LIST.md`.

## Research findings to reuse without repeating the investigation (2026-11-20)

**Evidence:** Review of visible gameplay conventions and publicly readable implementation examples. This is research and a proposed direction, **not tested or implemented code in our repository**. External game/project names and source URLs are intentionally omitted under our repository's research-publication rule.

### What established approaches show

- **Automated gladiator-style fights:** players set up equipment, skills and sometimes predefined tactics **before** combat; the game resolves the fight and displays a written battle account. The actual proprietary combat formulas were **not** available to verify. Borrow the idea of automatic resolution and rich narration, **not** purported internal code.
- **Simple timer-based idle fighting:** both combatants fill independent attack timers; an attack checks accuracy against defence, then a damage range and sometimes a critical chance; HP decides victory or death. No complex decision-making AI is required for basic encounters.
- **Stats-based AFK progress:** estimate farming output from damage, accuracy, attack rate, enemy durability, survivability and time instead of replaying every sword swing. Public explanations do **not** establish exact proprietary death/AFK formulas; don't present guesses as verified.
- **Publicly readable simple idle-combat code:** an actual implementation used independent player/monster attack-progress counters, hit-chance functions, random damage and crit checks, HP/death and XP/loot on victory. Its separate offline calculation covered mainly noncombat activities and **capped elapsed time at 24 hours**. That offline implementation **does not meet our requirements**.
- **MIT-licensed modular idle-game example:** combat and death are separate systems inside a UI-independent game core; game time and random outcomes can be passed into the engine rather than read directly from UI/browser globals. However, its combat explicitly **does not progress offline**. Reuse the architectural idea, not its offline policy.
- **More advanced readable combat simulator:** demonstrates deterministic expected-value resolution and optional random testing, action priorities and separated combat maths. It is much more complicated than our initial solo combat needs, and the inspected example is **not licensed for reuse**. Do not copy its source.

### Practical implication for our own design — candidate, not implementation approval

1. **One isolated combat-rules module** accepts a character/stat snapshot, two pre-equipped skills, enemy and environment data, and explicit time/randomness inputs. It returns outcome information (win/loss probabilities or sampled outcomes, fight duration, damage, effects), without importing UI, artwork, inventory persistence, accounts or server code.
2. **Online playback** depicts individual fights through static art and narrative, but cannot modify the result or speed up the next real farming interval.
3. **Offline settlement** obtains farming rate, expected deaths and death/return downtime from the **same combat model**, then aggregates elapsed time instead of running the combat tick loop millions of times. Recalculate when progression materially changes stats. Do **not** switch hunting zones for an absent character.
4. Treat source examples as **patterns only**. No third-party code or formulas have been approved for integration; independent original code and license checks are required.
5. Use a fast seeded test harness to compare aggregated offline statistics with many live-style encounters: win rate, deaths/hour, rewards/hour, combat duration and how those change as skills grow. Aim for statistically consistent outcomes, **not a claim that one bulk settlement reproduces the identical sequence of random battles**.

**Open for later:** precise hit/defence/damage formulas, how the two skills' timings interact, interrupted casts/injuries and their influence on statistical rates, thresholds for recomputing offline efficiency, and how rare loot remains fair across different login intervals. Avoid adding tactical complexity without proving it benefits play.

## Earlier brainstorming (retained for history)

## 9. Modular LEGO-style structure

**Direction**
- A small modular system that can grow without major rewrites.
- Separate the **core activity engine** from **content data** and from **art/UI**.
- New zones, skills, items, enemies and future quests/stats should mostly be additions to structured content rather than rewrites of engine logic.
- Shared event types should allow future features such as quests to react to mining/hunting without modifying the activity calculation.
- Prefer a **modular monolith**, not a fleet of microservices, unless actual scaling needs justify it.

**Idea — prospective module boundaries**
- Time/offline calculation; activity queue; encounter rules; 3d7 and reward tables; mining; hunting/combat; equipment/inventory; skills/recovery; groups; content definitions; events/quests/stats; illustration selection; mobile interface; persistence.
- Stable IDs, save versioning and testable boundaries are important, but detailed schemas can wait until development begins.
- Consider inspecting MIT-licensed idle-game projects for reusable patterns; check the real license, maintenance, quality and tests before adopting any code. No particular repository has been approved as a dependency.