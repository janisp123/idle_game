# Combat calculations — PLAYABLE V1; TURN-BASED V2 PLANNED

**Executable source/tuning:** [combat.mjs](../../site/play/combat.mjs) → `COMBAT_BALANCE`, `OPPONENTS`, `COMBAT_WEAPONS`, `COMBAT_ART`. [engine.mjs](../../site/play/engine.mjs) saves the `combatSession`; [app.mjs](../../site/play/app.mjs) renders live outcomes.

## What V1 actually runs today

The current alpha uses a **bounded, deterministic solo duel**, turns alternating attacker `player → opponent → player...`. Each step produces one typed event and text. V1 is **not yet** the proposed attack-skill vs defense-skill contest. It uses stats and Fighting rank, **but not** `weapons_training`, `shield_drills` or character-equipped abilities in hit/defense math. Player currently fights with an assigned **hammer**. Opponents are a small fixed-name list; the opponent does **not** scale to the player's current power.

Configuration defaults in `COMBAT_BALANCE`: one event every **20 seconds**, 16 timeline slots per bout (320 sec), at most 14 exchanges, base HP 24, +2 HP per END. The current scene mapping only has an accurate `engage` painting; other event types use the generic arena background, labelled honestly.

### Per attack exchange (V1)

Let `A` be attacker, `D` defender; `clamp(x, lo, hi)` limits the value to that range.

1. Each actor starts with `HP = max(1, round(startingHP + hpPerEndurance × END))`. The fight starts with an `engage` event.
2. **Attack accuracy:**
   `hitChance = clamp(baseHitChance + (DEX_A−DEX_D) × 0.012 + (Skill_A−Skill_D) × 0.015 + (opening_A ? 0.10 : 0), minHitChance, maxHitChance)`.
   Defaults: `baseHitChance=.72`, `minHitChance=.15`, `maxHitChance=.96`.
3. Draw one `U ∈ [0,1)`. If `U >= hitChance`, attack **misses**; the **defender** earns an opening for their counter, no damage.
4. Otherwise draw an **independent defense roll** `V`. First, `dodgeChance = clamp(.18 + (DEX_D−DEX_A) × .006, .03, .42)`. If `V < dodgeChance`, defender dodges and earns an opening. Else, if `V < dodgeChance + blockChance` (`blockChance=.18`) they block. Otherwise hit lands clean.
5. If the clean hit occurs when defender's **pre-hit HP <= 50% maximum**, a separate `3d6` skull-dice roll occurs. Each die is uniformly 1..6. **Exactly 6–6–6** immediately wins the exchange as a weapon-specific devastating finisher (the conditional chance is `(1/6)^3 = 1/216` per *eligible* roll). Other triples do not execute. Roll result is visibly shown only during Fighting.
6. If no finisher: `damage = max(1, round(baseDamage + STR_A × damagePerStrength + Skill_A × damagePerSkill))`; defaults `6 + 0.5×STR + 1.4×Skill`. Apply `HP_D = max(0, HP_D − damage)`. Emit `strike`, `wound` when at/below half HP, or `collapse` on HP=0. End with `victory`/`defeat` or `stalemate` after the exchange limit.
7. The next exchange swaps attacker and defender; all events are **actual resolved outcomes**, not randomly chosen captions.

**Exact control of odds:** all V1 accuracy, dodge, opening bonus, HP, damage and timing coefficients above live in **one `COMBAT_BALANCE` object**, including `accuracyPerDex=.012`, `accuracyPerSkill=.015`, `openingAccuracyBonus=.10`, `dodgePerDex=.006`, `minDodgeChance=.03` and `maxDodgeChance=.42`. To tune these numbers, change that object, not the duel algorithm. Any change to random draw order can change replayed deterministic duel outcomes.

### Playback, offline and consequences

- A saved `combatSession` tracks productive Fighting milliseconds, a seed, and an **initial snapshot** of name, weapon, STR/DEX/END and Fighting rank. Offline accumulation increments time only; the client reconstructs **only the currently observable bout** using a deterministic seeded random generator. It does not simulate/report every historical offline encounter or fabricate kill counts.
- The bout index picks a named opponent from `OPPONENTS`; fights are deterministic for the same seed/bout/time. A defeated hero is recovered automatically **in the duel narrative**; no permanent death, XP loss or inventory loss, but **no separately modeled resurrection downtime** yet.
- Combat is spectator-only, no clicks per turn. Visible three skull dice are **Fighting-only**. The leisure skill named “Playing dice with friends” is a distinct background skill without the combat dice UI.
- **Image honesty:** `COMBAT_ART` maps by event type, never arbitrary slideshow rotation. Only `engage` has an actual appropriate image. New event images require independent original asset commits and visual QA.

## Owner's newly specified V2 rules — APPROVED DIRECTION, NOT IMPLEMENTED

> **Player turn:** attacker **rolls to attack** and may activate an **offensive skill**; defender **rolls to defend** and may activate a **defensive skill**. When the defender lacks such a skill, they still roll a **much weaker stat-based dodge/parry/block**.
>
> **Enemy turn:** roles reverse. Enemy rolls attack and offensive skill; player's defense roll uses their skill if available or weaker raw stats if none. Result determines the precise illustrated scene. No player click required; the alternating turns run automatically.
>
> **6–6–6** remains a rare, visible Fighting finisher event, not the default animation on every ordinary activity.

**Unchosen V2 formulas (do NOT invent in implementation):** number of dice per base attack/defense, roll comparisons/ties, which existing trained skills unlock offensive or defensive abilities, skill priorities/cooldowns, specific advantage to trained defense over untrained fallback, armor, weapon loadouts, wound persistence, exact finisher trigger, injuries/revival delays, clan raid integration and image set. These require a focused V2 design and explicit implementation scope. The V1 equations above describe only current code, not final balance.

## Change checklist

Touch `COMBAT_BALANCE` for current main rates/timings, `OPPONENTS` for names and fixed opponent stats, and `COMBAT_ART` only after real matching original art is committed. Test `tools/test_combat.mjs`: deterministic seeded outcomes, missed/blocked/dodged damage=0, HP and death, six-sided dice, 6–6–6, twenty-year replay bounds, V5→V6 migration. See [changing balance](CHANGING_BALANCE.md).
