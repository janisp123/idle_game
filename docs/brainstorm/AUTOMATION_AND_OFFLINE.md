# Automation, battle clocks and unlimited offline play

**Status:** Living brainstorm — not approved implementation tasks. Updated 2026-11-20.

## Superseding owner decision — finite queue, perpetual final activity (QUEUE-001; 2026-11-21)

The previously brainstormed **repeating five-task loop** below is **superseded**. The new linear queue allows up to five activities; each nonfinal activity may run a configured 1–8 hours or 1–8 days, and the final activity **always runs forever**. No repeating loop and no daily-login requirement. Settling 20 years offline means processing the few finite activities, their transitions and then batching the unlimited remainder of the final activity. See [the activity queue specification](../ACTIVITY_QUEUE_SPEC.md) for the algorithm and unfinished design choices. No playable queue has been implemented yet.

## Owner-approved correction: advancement happens only on return (OFF-001; 2026-11-20)

- **At logout, freeze the effective combat/activity build:** stats, character level, skill levels, unlocked perks and equipped gear. Offline fights use that exact effectiveness for the **entire** absence, whether one hour or 20 years.
- Offline play **accumulates XP and resources** and counts combat wins/deaths and downtime, but it does **not** trigger level-ups, new skill levels, perk unlocks or stat changes in the background.
- **On return/login:** first settle all elapsed offline activity using the frozen logout build; then grant accumulated XP/rewards and apply resulting level-ups, skill/stat growth and unlocks for **future** activity. Do not retroactively improve the accumulated period because the character has now levelled.
- Consequently **no XP threshold stepping or combat-rate recalculation caused by gaining XP while offline** is required. The rate can still depend on non-advancement boundaries such as changing activity, resource depletion, time-varying rules or expiring group participation.
- If an optional automatic forge/equipment system is later retained, it must not silently alter the frozen build's combat effectiveness before return; its exact activation sequence is a separate design detail.
- **This correction overrides earlier brainstorming and example pseudocode** wherever it assumed skill growth or improved combat efficiency during the offline interval. See `docs/DECISIONS.md` OFF-001.

## Latest offline-combat settlement clarification (2026-11-20)

- An offline character is **not** an always-running server actor. On logout, save selected zone, skills, equipment, character state and timestamp; on return, calculate the elapsed farming outcome.
- **Never change the selected farming zone while the player is offline.** The character keeps trying that zone, even if frequent deaths make its rewards poor. The player changes zones when online.
- Factor into offline rates: expected battle wins and losses, resurrection and return-to-zone downtime, and actual farming time. Death is a **time-efficiency penalty**, not a reason to stop offline farming.
- Use the combat module's statistical model and aggregate rates **at the frozen logout stats and skill levels** for the whole offline interval; never recalculate at XP/skill-level thresholds. Handle only genuine non-advancement boundaries (activity changes, stock depletion, group expiry or rule changes). Do not loop through millions of individual battle ticks.
- Standard XP/resources should reflect time and survival. Show **one three-skull-dice roll when the player returns** for an additional normal/better/awesome reward grade; don't require a dice animation for each offline fight. Exact scaling and fairness across different absence durations are still open.
- The game and combat module must share consistent rules; **offline calculation, UI display and persistence are separate modules**. A statistically calibrated aggregate is not guaranteed to be the identical sequence of random events as fully simulated combat.

## Newer directions (2026-11-20)
- XP and rewards accumulate from activities without manual fighting or frequent logins; character/skill levelling and related stat increases are **applied only when the player enters the game** (OFF-001).
- A battle's duration is determined by its real attack, casting, dodge and recovery timeline. **Instantly viewing the result never starts the next battle early.**
- Action queues, recovery, resource accumulation and continued combat must remain consistent while the browser is closed.
- No arbitrary offline cap; settle elapsed progress efficiently with timestamps and batched/event-based mathematics.
- Players guide through skill and location choices; they do not click repeatedly to make progress.

## Earlier brainstorming (retained for history)

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

---

## 8. Server costs and offline mathematics

**Direction — essential architectural constraint**
- **Do not maintain a running server simulation for every offline player.** Save enough character state, configuration and timestamps to calculate elapsed progress lazily.
- On return, calculate offline gains by elapsed time and the frozen logout build, handling encounter frequency, task queues, limited resources, rewards and health recovery. Apply accumulated XP and any skill/stat level increases **only after** settling the absence.
- After approximately **24 hours**, consider bulk calculation rather than simulating encounters individually. Use larger event-based intervals where accurate.
- **Do not round tiny rare-drop expectations upward**: that would guarantee rare rewards. Efficient bulk sampling must preserve intended probabilities.
- A group member only needs group-history data for their at-most-seven-day offline participation window. Afterward calculate solo progression, which is much cheaper.
- When group membership, efficiency, loot rules, or activity change, record relevant timestamps/periods instead of continuously ticking absent characters.
- Server should remain authoritative for player inventory, verified rewards, timestamps and shared groups. Client computes/render estimates and artwork; do not trust client-reported loot.
- Aim for zero recurring character-specific work for characters absent for years, aside from storage and any necessary shared event bookkeeping.
- Efficiency, low database write volume, idempotence, correct recovery, and anti-duplication matter more than complicated simulation realism.

**Open / technical risks**
- Bulk calculations must correctly cross resource exhaustion, task boundaries, cooldowns, group departures and changing rules. **Do not cross XP/skill-level thresholds during offline settlement**, because level-ups only activate on return (OFF-001).
- Exact rare probability simulation with large numbers, overflow-safe quantities, and reproducible/auditable reward records.
- Should old group event histories be compacted at fixed checkpoints?
- Game version changes must not corrupt or arbitrarily rewrite years of offline gains.
- Never claim offline rewards are mathematically identical to a per-action simulation until tested.