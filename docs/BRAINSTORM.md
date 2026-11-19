# Idle Game — Brainstorm & Design Notebook

**Last updated:** 2026-11-19  
**Status:** Living brainstorming document, **not** a to-do list, implementation plan, or finalized specification.  
**Project:** `janisp123/idle_game`

## How to use this file

This is the long-term home for *all kinds* of design thinking: ideas we like, ideas we are unsure about, alternatives, experiments, rejected ideas, and unanswered questions. **An idea appearing here does not mean it will be built.**

Use these labels:
- **Direction** — something the owner explicitly likes or has stated as a rule in discussion. Still subject to change.
- **Idea** — possibility worth exploring, **not approved for implementation**.
- **Open** — requires further thought or a decision.
- **Superseded** — earlier idea replaced by a newer one; retained briefly so we do not repeat the discussion.

For actual owner-approved permanent decisions, consult `docs/DECISIONS.md`. For authorized work items, consult `docs/TD_LIST.md`. **Never automatically copy brainstorming bullets into the task list.** Chat, CW, and Codex should read this notebook when discussing game design, but must follow `AGENTS.md` and the repository protocol before taking project actions.

When new ideas emerge, append or revise the relevant section with a date and clarify when a new direction replaces an old one. Keep documentation concise and make disagreements/uncertainties visible instead of silently choosing.

---

## 1. Creative vision

**Direction — the heart of the game**
- A small, atmospheric, truly idle fantasy RPG. It is not intended to compete with games that have hundreds of skills, classes, and activities.
- The player can open the game at any time, leave it on screen as a pleasant thing to watch, or close it for years. Their character keeps making progress.
- **No arbitrary offline cap or daily-login pressure.** Even returning after 10–20 years should produce a meaningful account of accumulated progress.
- A few proven idle mechanics, presented with **beautiful static illustrated scenes** rather than cheap sprites, animated combat, or constant progress bars.
- Simple, readable, mobile-first UI; performance and reliability are priorities.
- Core engineering design rule: **always look first for the easier, cheaper-to-calculate, lower-lag, lower-bug approach**. Challenge complexity that doesn't improve the player's experience.

**Inspiration (not material to copy)**
- Gameplay reference points: Idle Clans, Melvor Idle, Legends of IdleOn, Milky Way Idle.
- Presentation reference: Pit of War's large dramatic action illustrations, narration and reward screens.
- Desired atmosphere: brutal grimdark gothic/industrial fantasy with the oppressive scale and mood associated with grimdark sci-fi.
- **Original IP only**: do not reproduce Warhammer-specific symbols, factions, iconic armor/weapon silhouettes, names, lore or copyrighted artwork. The mood is inspiration, not permission to copy identifiable features. Any real legal clearance remains a separate issue.

## 2. Smallest playable experience

**Direction**
- Initially only **two activities** and **two locations**:
  1. **Stone Mine** — mine **stone**.
  2. **Bunny Hunting Area** — hunt **bunnies**.
- Test the core loop and the feeling of the artwork before inventing a vast content system.
- Art should depict what is happening. Example: a powerful, rugged miner swinging a pick in a gloomy mine; during group mining, several workers cooperating (digging, pushing carts, loading stone).
- Hunting is the minimal way to test battles, skills, health and post-battle recovery.
- No need for additional classes, hundreds of materials, crafting chains or quests at launch.

**Idea**
- Later, add new zones, enemies, materials, activities and image sets primarily through configuration/content data.

## 3. Action scenes and mobile interface

**Direction**
- **Static, high-quality illustrations** are the primary activity presentation. One prominent image can represent the activity, plus optional distinct images for special events or skills.
- A skill such as **Crushing Blow** gets one dramatic, reusable impact illustration. We do **not** need an illustration for every class, weapon, item or gear combination.
- A short live activity log describes swings, discoveries, impacts, failures and completed encounters; rewards appear clearly, then the next encounter starts automatically.
- No character animations or continuously animated health/progress bars. The **three fate dice may be the one animation** if it adds enjoyment.
- Images need not change for every strike; change with activity, special skill or meaningful event.
- **Mobile portrait mode first**, comfortable with one hand, thumb-friendly actions and primary controls in reach, readable text, no crowded screens. Desktop can adapt without becoming the design target.
- Optimize artwork for normal phone resolutions rather than 4K. Use efficient formats (e.g. WebP/AVIF), local browser caching, and avoid downloading unnecessary images.

**Idea / caveat**
- A PWA could cache images on the device or optionally preload artwork. Browser caches may be evicted, so missing assets need a graceful reload path.
- A generated dark-mine/miner illustration from the 2026-11-19 chat is the visual-quality benchmark; it has **not** yet been committed to this repository.

## 4. Activity automation and infinite offline progress

**Direction**
- Up to **five scheduled activities** in a repeating queue.
- Each task may end after **N completed encounters/actions**, after **N minutes**, or when **required resources run out**.
- At the end, the player can loop to task 1 or stay in a selected ongoing zone/activity.
- Automation must not silently stop permanently when a task is impossible.
- Inventory concept: stackable resource/item types, effectively unlimited item quantities; a type occupies one inventory slot regardless of stack count. Long-term quantities need safe numerical representation.

**Idea / open**
- If a task cannot be performed, should the queue skip it, retry it later, or invoke a user-chosen safe solo fallback?
- Avoid an infinite loop of impossible tasks. Define deterministic, low-cost fallback rules.
- Previous anti-bot/economy idea: no player trading, item selling, or item dropping. Revisit separately before implementing.

## 5. Encounters, mining, skills and recovery

**Direction**
- **One mining encounter contains multiple pickaxe swings.** One swing is not one successful mining result.
- Adequate tool/skill requirements make a material *possible* to mine, not instantaneous. Inadequate equipment cannot mine better material. Better skills/gear improve mining efficiency, speed and yield; even elite equipment still requires time.
- Hunting/combat similarly resolves as encounters followed by rewards and automatic repetition.
- Each character has **two active combat skill slots**.
- Skills trigger automatically, have **long cooldowns**, can fail, and improve through actual use. Skill levels improve success chance and effect/damage.
- **No mana** or equivalent skill-spending pool; powerful skills are primarily balanced with cooldowns and failure rates.
- **No potions anywhere in the game.**
- No natural healing **during a battle**.
- Between battles, everyone can recover health naturally. **Recovery** is a universal passive skill that improves through use and speeds post-battle healing. It does not use either combat slot.
- A stronger Recovery skill should improve how quickly the character returns to activity, **not** make an unwinnable fight winnable by healing inside combat.

**Open**
- Exact skill XP rules for failed attempts, cooldown durations, combat defeat/retry behavior, injury, and the threshold for resting.
- Whether each skill triggers on every available cooldown or has additional encounter conditions.

## 6. Fate dice, excitement and rarity

**Direction**
- Use **three seven-sided fate dice (3d7)** in the underlying mechanic. The dice can be represented as stylized fantasy dice; a regular physical cube cannot literally have seven faces.
- Each completed encounter/activity gets a roll. Results may influence yield, outcome quality or special events.
- **7-7-7** is an exciting recognizable roll; its probability is **1 / 343**. It is **not** itself a guaranteed legendary item.
- Truly rare rewards require additional independent chance checks or other carefully balanced requirements.
- Dice remain meaningful while offline and are resolved fairly via efficient mathematical sampling instead of millions of visual rolls.
- **One shared 3d7 roll per group encounter**; do not perform separate synchronized lucky-dice rolls for every party member. Distribute shared rewards afterward.
- Skill progression remains per character.

**Open / balancing**
- The exact chance and contents of 7-7-7 reward tables.
- The frequency of lucky moments must remain satisfying for someone who plays briefly without making legendary items commonplace after decades of automated farming.
- Group bonuses should reward cooperation without multiplying rare-drop opportunities by member count.
- Long-run rarity may need one-time unlocks, special sinks or non-repeatable collectibles; avoid inventing complex economy systems just to solve hypothetical issues.

## 7. Cooperative mining and hunting

**Direction**
- Either activity can be done solo or in a **group of up to 20 players**.
- Group activity has its own cooperative illustration.
- Group encounters finish faster, but loot comes from a **shared reward pool**. Grouping should be beneficial overall, while rewards remain balanced.
- Group creator/leader sets:
  - **Equal loot sharing**, or
  - **Efficiency-based loot sharing**: a miner's basic efficiency = mining skill level + mining gear bonus. For hunting, use corresponding hunting efficiency factors.
  - **Minimum efficiency requirement** for joining.
- Loot rule is visible before joining. Do not silently change it on existing members.
- Group membership never requires real-time coordination. Members may remain and contribute offline.
- **Joining a group requires the player to be online.** No offline automatic matchmaking, no automatic joining an available group, and no offline invitation handling.
- An offline member may stay in their existing group for **up to 7 days after their last real login**.
- After 7 days offline, participation automatically expires and the character continues **solo indefinitely**, following their offline/default activity automation.
- A leader can kick a member earlier; that player reverts to their solo/default offline rules. Changing groups never resets the seven-day clock.
- No continuous per-player expiration timer is required; timestamps can govern the transition.

**Group location rule — Direction**
- Ordinary groups are tied to an activity/location. A leader cannot simply move the public group to another activity; they must leave/re-create or join a different group.

**Guild-follow exception — Idea needing reconciliation**
- Earlier discussion proposed an optional checkbox for guildmates to **follow a guild-member leader's activity change** as a special exception.
- If a guildmate cannot follow, remove them from that group and apply their normal offline rules.
- **Open:** reconcile that exception with the later and simpler rule that nobody can join another group while offline. Potentially defer guild-follow entirely until guilds exist.

**Open**
- What happens if the group leader leaves or becomes inactive? How does the remaining group behave?
- Whether equal split/efficiency split achieves “grouping always beneficial” at 1–20 members.
- How fractional resource shares are handled without creating duplication or lost items.
- How strict min-efficiency requirements behave if existing members change equipment after joining.
- Does a player remain assigned to a group if their own five-task queue switches activities? Define later.

## 8. Server costs and offline mathematics

**Direction — essential architectural constraint**
- **Do not maintain a running server simulation for every offline player.** Save enough character state, configuration and timestamps to calculate elapsed progress lazily.
- On return, calculate offline gains by elapsed time, handling skill growth, encounter frequency, task queues, limited resources, rewards and health recovery.
- After approximately **24 hours**, consider bulk calculation rather than simulating encounters individually. Use larger event-based intervals where accurate.
- **Do not round tiny rare-drop expectations upward**: that would guarantee rare rewards. Efficient bulk sampling must preserve intended probabilities.
- A group member only needs group-history data for their at-most-seven-day offline participation window. Afterward calculate solo progression, which is much cheaper.
- When group membership, efficiency, loot rules, or activity change, record relevant timestamps/periods instead of continuously ticking absent characters.
- Server should remain authoritative for player inventory, verified rewards, timestamps and shared groups. Client computes/render estimates and artwork; do not trust client-reported loot.
- Aim for zero recurring character-specific work for characters absent for years, aside from storage and any necessary shared event bookkeeping.
- Efficiency, low database write volume, idempotence, correct recovery, and anti-duplication matter more than complicated simulation realism.

**Open / technical risks**
- Bulk calculations must correctly cross skill-level thresholds, resource exhaustion, task boundaries, cooldowns, group departures and changing rules.
- Exact rare probability simulation with large numbers, overflow-safe quantities, and reproducible/auditable reward records.
- Should old group event histories be compacted at fixed checkpoints?
- Game version changes must not corrupt or arbitrarily rewrite years of offline gains.
- Never claim offline rewards are mathematically identical to a per-action simulation until tested.

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

## 10. Things deliberately not in the first version

**Direction**
- No sprawling skill tree or class roster.
- No dozens of locations, crafting chains, deep quest system, or highly detailed economy at the start.
- No character animation system, live sprite combat, or per-equipment artwork variations.
- No mana and no potions.
- No required online attention, manual repetitive clicks, or daily-login deadlines.

**Superseded / clarified**
- Earlier idea: offline auto-join the next eligible mining group. **Replaced:** online-only group joining, then up to seven days of continued participation offline.
- Earlier idea: all players roll separately and several need to hit 7-7-7 simultaneously. **Replaced:** one shared group roll.
- Earlier idea: always simulate every pickaxe stroke throughout offline periods. **Replaced as an architectural preference:** accurate, efficient event-based/bulk offline calculations.
- Earlier idea: use a conventional 3d6. **Replaced:** 3d7.

---

## Parking lot for future discussions

These are **questions, not tasks**:
- Should a mine or hunting zone have procedural events beyond its core resource/enemy?
- What exactly changes a player from “too weak to hunt” to “ready to hunt”?
- Are rare discoveries mostly materials, unique cosmetic artwork/events, permanent unlocks or gear?
- How should multi-year returns be summarized without showing millions of log entries?
- How do we prove that solo/group outcomes and online/offline outcomes are balanced?
- What minimal device/server test would demonstrate the game is lightweight on budget Android phones?
- What should happen if a group dissolves while members are offline?
- Would guilds meaningfully improve the game, or should they wait until later?

## Notes on governance

This document can grow freely. **No item here, including one labeled Direction, is a coding instruction.** Owner approval is required before moving an idea into the durable decision log or an approved implementation task. Keep speculative future features out of `docs/TD_LIST.md` until chosen.

**Working philosophy:** Start with beautiful stone mining and bunny hunting. Make that work reliably, offline forever, on a phone, with the simplest possible calculations. Expand only when the result is fun.
