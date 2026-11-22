# Combat formulas — PLAYABLE two-skill V2 alpha

**Live gameplay and tuning:** [combat.mjs](../../site/play/combat.mjs) → `COMBAT_BALANCE`, `OPPONENTS`, `COMBAT_ART`; [combat-skills.mjs](../../site/play/combat-skills.mjs) → `COMBAT_SKILLS` and `COMBAT_LOADOUTS`. [engine.mjs](../../site/play/engine.mjs) handles save V7, frozen stats, and switching a combat style. [app.mjs](../../site/play/app.mjs) displays the chosen skill pair and actual rolls.

## Two skills per fighter (first two presets)

There are exactly two **equipped combat ability slots**: **one automatic offensive skill** and **one automatic defensive skill**. The player can switch between the two presets in the character panel. Enemies use the same rules and two-skill presets; named opponents can equip a different style. There is no per-turn player input.

| Loadout | Offensive ability | Defensive ability | Playstyle |
| --- | --- | --- | --- |
| Two-handed Greatsword | **Heavy Swing**: one **charge turn** before the next attack; ×1.9 damage, −6 percentage-point accuracy | **Blade Guard**: 24% additional chance to parry | Huge dangerous blows but fewer swings and weaker defense |
| Sword & Shield | **Thrust**: attacks without a charge turn; ×1.0 damage, +8 percentage-point accuracy | **Shield Block**: 56% additional chance to block | Faster ordinary damage with much stronger guarding |

**All numbers are provisional alpha settings**, not locked-in balance. Edit one row in `COMBAT_SKILLS` to change a skill; add a new skill and associate its ID with a `COMBAT_LOADOUTS` pair to introduce another style later. Slot types are validated at module load. The existing independent activity skills `weapons_training` and `shield_drills` do **not yet** grant separate levels or modify these automatic combat abilities.

## Strict alternating turns

```text
Engage
Player attack turn: if Heavy Swing needs charging, emit CHARGE instead
  otherwise attack roll, then (if attack passes) enemy defense roll
  → miss / dodge / parry / block / actual hit / wound / finisher
Enemy attack turn: same rules, roles reversed
Repeat automatically while both remain standing (max 14 turns)
Victory / defeat / stalemate
```

One combat event is displayed each `eventMs=20,000` milliseconds; `maxExchanges=14` plus engage and final outcome fit in `slotsPerBout=16`. Wind-up takes a full combat turn and requires **no extra random draw**. The next time the greatsword fighter gets a turn, Heavy Swing executes; thereafter it needs another wind-up. Sword & Shield can Thrust immediately on each turn. This is **not** the 10-second work cycle used for time-based skill XP.

## Attack roll and defender roll

For attacker `A`, defender `D`:

1. Calculate the attacker chance using their **offensive skill's accuracy**:
   ```text
   hitChance = clamp(
     baseHitChance
     + (DEX_A − DEX_D) × accuracyPerDex
     + (FightingLevel_A − FightingLevel_D) × accuracyPerSkill
     + (opening_A ? openingAccuracyBonus : 0)
     + COMBAT_SKILLS[attackSkill].accuracyBonus,
     minHitChance, maxHitChance)
   ```
   Defaults: `baseHitChance=.72`, `accuracyPerDex=.012`, `accuracyPerSkill=.015`, `openingAccuracyBonus=.10`, `minHitChance=.15`, `maxHitChance=.96`.
2. Draw the **attacker's own** uniform `attackRoll ∈ [0,1)`. If it is `>= hitChance`, miss: zero damage, the defender earns a counter opening. The opponent **does not** roll to defend a miss.
3. On a successful attack check, draw a **separate defender roll** `defenseRoll ∈ [0,1)`. First compare:
   ```text
   dodgeChance = clamp(
     dodgeChanceBase + (DEX_D − DEX_A) × dodgePerDex,
     minDodgeChance, maxDodgeChance)
   ```
   Defaults: `dodgeChanceBase=.10` (`COMBAT_BALANCE.dodgeChance`), `dodgePerDex=.006`, `minDodgeChance=.02`, `maxDodgeChance=.28`.
4. `defenseRoll < dodgeChance` means DODGE (no damage, counter opening). Otherwise compare against `dodgeChance + guardChance`, where `guardChance` is taken from **the defender's equipped defensive skill**: Shield Block `.56`; Blade Guard `.24`. A guard success becomes a skill-specific BLOCK or PARRY (zero damage). The same roll is used for dodge and guard; they are mutually exclusive outcomes.
5. **If the defender has no defensive skill**, fallback guard chance is only `COMBAT_BALANCE.untrainedGuardChance=.035`, alongside the weak **DEX-based dodge chance**. This is much worse than learned Shield Block, but not mathematically zero.
6. If neither defense succeeds, the attacker lands one clean blow. The chosen attack skill changes damage:
   ```text
   damage = max(1, round(
      (baseDamage + STR_A × damagePerStrength
       + FightingLevel_A × damagePerSkill)
      × COMBAT_SKILLS[attackSkill].damageMultiplier))
   ```
   Defaults: `baseDamage=6`, `damagePerStrength=.5`, `damagePerSkill=1.4`. Defender's HP starts at `max(1, round(24 + 2 × END))`; the hit reduces HP and emits STRIKE / WOUND / COLLAPSE depending on remaining HP. No permanent injury/gear breakage is added by this alpha.
7. On a clean hit when the defender's **pre-hit HP <= 50% max**, roll three independently fair six-sided **skull dice**. Only **6–6–6** ends the duel as a devastating weapon-specific finisher (conditional chance **1/216 per eligible successful hit**). The visible roll is Fighting-only; attack/defense numbers are also shown in Fighting's event panel, not in ordinary resource activities.

### Example at equal attributes and activated Fighting level 1

Two characters each have STR=10, DEX=10 and Fighting skill level 1. An unprepared greatsword character must first **charge**. On its attack, `hitChance=.72 − .06=.66`, then a shield defender has `dodgeChance=.10` and `guardChance=.56`: a defender roll from `.10` up to `.66` blocks. On a successful clean hit the greatsword deals `round((6+5+1.4)×1.9)=24` damage. The shield user's immediate Thrust has `hitChance=.72+.08=.80`, the greatsword defender dodges at `.10` and parries in the next `.24` roll interval; its clean thrust deals `round(12.4)=12` damage. Without a defensive skill only `.035` additional guard remains.

This produces the owner's desired trade-off: **huge but slow swings versus quick sword attacks and a reliable shield**. Player and enemy receive the same formulas.

## Data and persistence guarantees

- The `combatLoadout` choice is stored in **V7 local save data**, along with the combat-session seed, elapsed Fighting time and original frozen fighter stats. V6 hammer/axe/sword prototype sessions migrate to the default **Greatsword** skill pair without losing elapsed time, RNG seed, attributes, items or skill levels. Existing local save key remains the same.
- Changing combat style during a duel settles elapsed productive time first, then starts a **fresh duel** with the new selected skill pair (no XP/resource reset). Away time never silently upgrades effective skills or attributes (OFF-001).
- Long offline stretches update the Fighting observation clock in bounded work and reconstruct **only the currently observable bout** from its seed. There is **no fabricated historical kill report**.
- Defeat ends the current illustrated/narrated bout; it does not delete XP, items, stats, account, gear or character. Full resurrection downtime and equipment systems are NOT implemented.
- The scene illustration is still an **arena background**. `COMBAT_ART` maps only `engage` to an accurate currently available image. **No event-specific hit, block, parry, gore or finisher paintings** are yet in the repository, and none may be falsely substituted.

## Change and expansion map

- Edit offensive damage, charge turns, accuracy: `COMBAT_SKILLS.heavy_swing` or `COMBAT_SKILLS.thrust`.
- Edit trained guard strength and type: `COMBAT_SKILLS.blade_guard` or `COMBAT_SKILLS.shield_block`.
- Edit untrained fallbacks, stat scaling, HP, timing, skull finisher threshold: `COMBAT_BALANCE`.
- Add new skill: define it in `COMBAT_SKILLS` with a role and corresponding attributes, then add or modify `COMBAT_LOADOUTS`. For a new animation event type, update event parsing, UI and original art registry.
- Tests: [test_combat.mjs](../../tools/test_combat.mjs) for independent rolls, charge, shield/parry/fallback probabilities, rare finishers, V6→V7 migration and multi-decade offline safety; [test_game_ui.mjs](../../tools/test_game_ui.mjs) for choice, screen, persistence and no duplicate retroactive gains.

**Not yet implemented:** individual combat ability XP/leveling, skill cooldowns beyond wind-up, physical equipment inventory, raid and clan actions, ally rescues/revives, permanent wounds and exact painting per blow. Those require subsequent owner-approved mechanics; the alpha values are intentionally simple and editable.
