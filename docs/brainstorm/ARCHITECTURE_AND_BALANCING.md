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