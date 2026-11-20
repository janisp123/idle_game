# Automation, battle clocks and unlimited offline play

**Status:** Living brainstorm — not approved implementation tasks. Updated 2026-11-20.

## Newer directions (2026-11-20)
- Character development and activities proceed without manual fighting or frequent logins.
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