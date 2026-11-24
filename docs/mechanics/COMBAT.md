# Combat formulas — PLAYABLE two-skill V2 alpha

## Armour and condition in the current arena

Both fighters start at full health and condition. A landed blow wears body armour. A block wears the shield and a parry wears the defending weapon. All three also wear the attacking weapon. Misses and dodges cause zero wear. At equal strength the hammer applies the most guard wear, followed by the greatsword and sword. A shield that survives a block grants a counter opening on the next attack.

The Armour bar totals remaining body and shield condition. Its remaining fraction scales physical mitigation and flat enchant protection. Guard condition also scales guard bonuses and penetration. At zero weapon condition, attacks retain 55% power. A duel's condition snapshots drive both the opposed rolls and the visible bars. Recovery shows the exact gain back to maximum health and condition. No repair materials are consumed between bouts.


**Live gameplay and tuning:** [combat.mjs](../../site/play/combat.mjs) → `COMBAT_BALANCE`, `OPPONENTS`, `COMBAT_ART`; [combat-skills.mjs](../../site/play/combat-skills.mjs) → `COMBAT_SKILLS` and `COMBAT_LOADOUTS`. [engine.mjs](../../site/play/engine.mjs) handles save V7, frozen stats, and switching a combat style. [app.mjs](../../site/play/app.mjs) shows the matched cinematic scene; **the compact result strip** shows only truthful red HP damage, green healing when it actually exists, or short defense words on the correct side. There is no Chronicle/history. Exact dice/scores remain visible on the existing animated dice tray; see [Results](RESULTS.md).

## Two automatic abilities per fighter — unchanged loadouts, new 3d6 rolls

Each fighter automatically equips **one attack** and **one defense** skill. All score adjustments and timing values are editable in `COMBAT_BALANCE` and `COMBAT_SKILLS`.

| Loadout | Attack | Defense | Initiative |
| --- | --- | --- | --- |
| **Greatsword** | Heavy Swing, **+3 attack score**, 1.9× damage; **1.8 s wind-up within the attack turn** | Blade Guard, **+2 defense score** (parry) | −2 |
| **Sword & Shield** | Thrust, **+2 attack score**, 1× damage; no extra wind-up | Shield Block, **+5 defense score** (block) | +1 |
| **No defense skill** (future NPC) | Own equipped attack applies | **−2 defense score** from untrained fallback; may still dodge using stats and dice | Depends on style |

The old `chargeTurns` event is **removed**: the greatsword's charge is a brief preparation stage **inside an attack turn**, not a wasted attack and not a preemptive illustration.

## Order of a duel — implementation

1. Finish normal movement and preparation into the Fighting arena (the existing activity transition; no teleport).
2. **Initiative:** each fighter rolls **three real six-sided skull dice**, independently. Higher `3d6 + initiative modifiers` attacks first. On an exact score tie reroll (maximum 3 rounds); if still tied, DEX and then a deterministic player fallback decide. Both dice groups visibly animate before the true scores and result are revealed.
3. **First attack:** the initiative winner rolls their own 3d6, **opponent separately rolls 3d6 for defense**. On-screen dice animate; the prior resolved illustration stays in place. Only after the dice finish does the actual missed/dodged/blocked/parried/wounding result appear in the painting and the compact player/enemy result strip.
4. **Second attack:** roles reverse. Alternate until a fighter falls or at most **six half-turns total** (at most **three attacks per fighter**).
5. **Aftermath:** a knockout immediately decides the victor; if six turns expire with both standing, the fighter with a higher fraction of HP remaining wins a nonfatal judges' decision, or both draw if the fractions tie. No fabricated fatal wound is added at the horn. The scene uses the actual player victory/defeat/stalemate painting.

A completed duel lasts **at most eight displayed stages**: initiative + six attacks + aftermath. Current `eventMs=25,000` → a maximum of 200 seconds per bout; phase timing is internal only and does not appear as countdowns. Initial rolling animation is 3.5 seconds; Heavy Swing adds 1.8 seconds of internal wind-up. Those values are presentation defaults and do **not** change event outcomes, work-cycle XP or offline progression. The long-lived duel is reconstructed from a seed in constant bounded work even after years away.

## Exact initiative and attack / defense formulas

All `3d6` are **three independent fair six-sided rolls**. Define:

```text
dexBonus(X)     = floor((DEX_X − startingStat) / dexPerScorePoint)
endBonus(X)     = floor((END_X − startingStat) / endurancePerDefensePoint)
skillBonus(X)   = floor((FightingLevel_X − 1) / levelsPerScorePoint)

initiativeTotal_X = sum(3d6_X) + dexBonus(X) +
                    COMBAT_LOADOUTS[style_X].initiativeBonus

attackTotal_A = sum(3d6_attack) + dexBonus(A) + skillBonus(A)
              + COMBAT_SKILLS[attackSkill].attackBonus
              + (counterOpening ? counterOpeningBonus : 0)

defenseTotal_D = sum(3d6_defense) + dexBonus(D) + endBonus(D)
               + (trainedDefense ? COMBAT_SKILLS[defenseSkill].defenseBonus
                                 : −untrainedDefensePenalty)
```

Current `COMBAT_BALANCE` uses `startingStat=10`, `dexPerScorePoint=6`, `endurancePerDefensePoint=8`, `levelsPerScorePoint=6`, `counterOpeningBonus=2`, `untrainedDefensePenalty=2`. These are provisional alpha balance numbers, **not final PvP rules**.

### Equipment additions to the opposed roll (new alpha)

The original 3d6 RNG, attack modifiers, turn count and 6–6–6 finisher checks are unchanged; the following are added to the **effective frozen fighter snapshot**:

```text
initiativeTotal_X = previousInitiativeTotal_X − gear_X.initiativePenalty
defenseTotal_D = previousDefenseTotal_D + gear_D.evasionScore
dodgeThreshold_D = gear_D.dodgeMargin (otherwise old default: 7)
landedDamage_D = max(1, round(rawPhysicalDamage × (100 − gear_D.physicalReductionPct)/100))
```

These are derived from an eleven-slot body-coverage weighted set, not eleven full-suit bonuses. A Plate suit means 50% landed-hit damage reduction but a −3 evasion dice modifier and extremely high dodge margin; Leather 22% reduction and +2 evasion; Mage Robe 4% reduction and no extra evasion; None 0% reduction and +3 evasion. Weight additionally penalizes initiative. Magic resistance is future-facing and not used by the current duel resolver; there are no magic-based opponents or attacks yet. See [ARMOUR.md](ARMOUR.md) for piece-by-piece kg, movement and migration.

### Resolve the attack (always one attack 3d6 and one defense 3d6)

1. If the **raw attack dice sum ≤ 5**, a genuine miss/overreach occurs even with high skill. The defender still rolls; no damage is dealt, and the defender earns an opening for their next attack.
2. Otherwise, if `attackTotal ≤ defenseTotal`, the attack's **direct hit is prevented**. Trained Shield Block **blocks** (+5 defense score) and Blade Guard **parries** (+2), but the weapon's impact can still cause **partial HP damage**. An untrained successful defender **dodges**, taking zero damage. Trained defenders only dodge when the defense score exceeds attack by at least their gear's larger dodge margin; dodging gives a counter-opening, blocking/parrying does not.
3. If `attackTotal > defenseTotal`, the attack **lands**. If the attacker rolled **6–6–6** and the score margin is at least `criticalFinisherMargin=1`, the blow is an immediate devastating weapon-specific **finisher**. A superior defender can still survive a triple-six if they genuinely beat the attacker. A fair attacker-side triple-six occurs with probability 1/216 **per attack**, but actual finisher probability also depends on overcoming defense.
4. Otherwise calculate `damage = max(1, round((baseDamage + STR_A × damagePerStrength + FightingLevel_A × damagePerSkill) × attackSkill.damageMultiplier))`. Defaults are `6 + STR×0.5 + FightingLevel×1.4`. Defender HP begins at `max(1, round(baseHP + END×hpPerEndurance))`, currently `baseHP=16`, `hpPerEndurance=1.4`. Apply damage, then emit **strike**, **wound** (remaining HP ≤ 50%), or **collapse** (HP=0). These are actual health results, not random paintings.

At equal STR=DEX=END=10 and Fighting level 1, the greatsword has **24 raw physical damage** and sword thrust **12 raw damage**, against a 30-HP fighter, **before the defender’s normal armour reduction**. Example: a full Plate defender takes **12** from the greatsword hit; a full Mage Robe defender takes **23**. Greatsword remains slower to reveal and has different initiative/defense than Sword & Shield. Real numbers come from the actual chosen per-slot armour in [ARMOUR.md](ARMOUR.md).

### Damage through a successful shield block or weapon parry (alpha)

**No separate block chance, no extra die, no reduction of the original Shield Block +5 / Blade Guard +2 bonuses.** A trained defense still occurs when its existing opposed 3d6 defense score wins, except that exceptionally high margins produce a real dodge. The attack skill defines two percentages of its ordinary raw physical damage that pass through a successful guard:

| Attack skill | Full raw damage at starting stats | Through shield block | Through weapon parry |
| --- | ---: | ---: | ---: |
| Heavy Swing | 24 | 25% (6 HP before protection) | 35% (8 HP before protection) |
| Thrust | 12 | 10% (1 HP before protection) | 15% (2 HP before protection) |

Exact formulas for **successful, non-dodged trained guards**:

```text
rawAttack = max(1, round((baseDamage + STR×0.5 + FightingLevel×1.4
             + weaponEnchantBonus) × weaponDamageMultiplier))
through = attackSkill.blockDamagePct or attackSkill.parryDamagePct
impact = round(rawAttack × through / 100)
protectedImpact = max(0, round(impact × (100 − armourPhysicalReductionPct)/100)
                         − defenderArmourEnchantDefense)
actualHPDamage = min(defenderCurrentHP, protectedImpact)
```

**Zero impact is possible:** armor/enchantment can absorb the entire glancing shock, and a successful true dodge or attacker miss always deals **zero**. A shield remains significantly better at protecting against a heavy impact than a weapon parry; a successful defense is not automatically invulnerable. Guarded impact can reduce a defender to 0 HP and end the duel as usual; no invented secondary attack or special 'guard break' RNG.

**Dodge rarity** changed only for **new** equipment profiles: None requires a defense margin of **6** instead of 2, Mage Robe **9** instead of 5, Leather **8** instead of 3, Plate remains **99**. The base evasion score and both trained defense bonuses are untouched. Even a strong parry or shield block is more commonly displayed as itself, with its partial damage, rather than relabeled DODGED. Older already-frozen combat sessions keep their saved dodge margin and fighter attributes (OFF-001). New sessions pick the current balance. This is deliberately provisional; future weapons need their own two penetration percentages.

## What the player sees — strictly after rolls

- **Live Fighting only:** initiative has **two animated groups of three skull dice**. Every later attacking turn displays both attacker's and defender's three dice, identified as YOU/ENEMY and ATTACK/DEFEND. The dice values shown after animation are the actual predetermined simulation results; cosmetic preview face changes **never reroll the game**.
- During the roll, the **previous result image** stays visible. No attack picture or result-strip damage is leaked early. At revelation, update to the exact relevant original art and replace the compact two-sided result display with measured **post-armour** damage. Successful BLOCKED / PARRIED can now show **both the guard label and red `-N HP` on the defending side**, while DODGED and MISSED remain damage-free. The existing dice tray owns the real dice faces/scores; no scrolling narration remains. Main scene has only short duel/turn indicators and optional special 6–6–6 celebration.
- For Fighting, **hide the old work-cycle progress bar** (it falsely looked like a strike timer). Place a responsive combat action timeline **immediately beneath the artwork**, with a highlighted active stage, completed and upcoming segments, and a small progress fill. Initiative, each opposed attack, the actual revealed move and recovery all have grounded labels. Each attack visually rolls the attacker's 3d6 first, then the defender's 3d6; both dice were already calculated by the unchanged deterministic engine. After both phases the matching art and compact numerical result are revealed. The bar adapts to whichever fighter attacks first, and to early duel endings; it does not imply a fixed alternation or a mandatory six turns. Six small completed-turn markers remain for duel history. Other activities retain their ordinary work progress bar. No extra XP, save fields, combat RNG, or offline replay is added.
- Respect `prefers-reduced-motion` for the cosmetic dice wobble. The game's rolls still work without CSS animation or a constantly open tab.

## Glory Scroll and equipment enchant combat effects

[GLORY-001](ENCHANTMENTS.md) extends actual Fighting victories with an independent 50% Glory Scroll check when the current *Fighting XP bar* was still earnable as that bout began. Scroll awards require genuine reconstructed completed victories; losses/draws and XP-ineligible bouts yield none. This is not a fabricated offline kill-count estimate. Existing 3d6 attack/defense and victory rules stay intact.

Each earned weapon enchant rank adds +1 to raw physical attack (before weapon-skill multiplier). Each armour-slot rank adds +1 to a flat physical protection total deducted **after** a landed hit's ordinary armour reduction, with minimum 1 HP inflicted. These bonuses do not alter dice values, defense roll odds, initiative, the 6–6–6 finisher, or magic resistance. Active combat freezes the effective ranks; equipping or enchanting a slot first settles previous rewards and starts a fresh duel only when effective gear changes.

## Data and persistence guarantees

- The `combatLoadout` choice is stored in **V7 local save data**, along with the combat-session seed, elapsed Fighting time and original frozen fighter stats. V6 hammer/axe/sword prototype sessions migrate to the default **Greatsword** skill pair without losing elapsed time, RNG seed, attributes, items or skill levels. Existing local save key remains the same.
- Changing combat style during a duel settles elapsed productive time first, then starts a **fresh duel** with the new selected skill pair (no XP/resource reset). Away time never silently upgrades effective skills or attributes (OFF-001).
- Long offline stretches update the Fighting observation clock in bounded work and reconstruct **only the currently observable bout** from its seed. There is **no fabricated historical kill report**.
- Defeat ends the current illustrated/narrated bout; it does not delete XP, items, stats, account, gear or character. Full resurrection downtime and equipment systems are NOT implemented.
- **Original event paintings are implemented for the two active loadouts:** 12 960×540 WebP files in `site/play/assets/combat/`. The pure `site/play/combat-art.mjs` registry (`COMBAT_ART`, `combatArtworkForEvent`) picks scenes by **real event type, actor, attacker weapon, defender's trained guard ability, and final player victory/defeat**. Four distinct outcome images exist: Greatsword victory/defeat and Sword & Shield victory/defeat. For an unillustrated defense/ability, it returns an honest neutral arena tableau (`exact:false`), never a picture showing the wrong skill. Some defeat/miss crops from original concept art are lower-detail and can be improved individually later.

## Fast, exact developer battle simulation

For reproducible 10,000+ zero-delay duels with the **actual production combat resolver**, dice, locations, equipment, per-slot enchants, HP and condition wear, see [SIM-001](COMBAT_SIMULATOR.md) and `tools/combat-simulator.mjs`. It is a Node-only QA tool outside the published site; no combat numbers are copied into it.

## Change and expansion map

- Edit offensive damage, within-turn wind-up, attack score: `COMBAT_SKILLS.heavy_swing` or `COMBAT_SKILLS.thrust`.
- Edit trained guard dice-score bonus and type: `COMBAT_SKILLS.blade_guard` or `COMBAT_SKILLS.shield_block`.
- Edit untrained fallback penalty, dice-score scaling, initiative tie handling, HP, timing and triple-six margin: `COMBAT_BALANCE`.
- Add new skill: define it in `COMBAT_SKILLS` with a role and corresponding attributes, then add or modify `COMBAT_LOADOUTS`. For a new animation event type, update event parsing, UI and original art registry.
- Tests: [test_combat.mjs](../../tools/test_combat.mjs) for independent rolls, charge, shield/parry/fallback probabilities, rare finishers, V6→V7 migration and multi-decade offline safety; [test_game_ui.mjs](../../tools/test_game_ui.mjs) for choice, screen, persistence and no duplicate retroactive gains.

**Functional armour balance (implemented, provisional):** [Armour and weapon weight](ARMOUR.md) gives each of 11 independently equipped parts one of four standardized types (None/Mage Robe/Leather/Plate), using exact per-piece weights and coverage. Physical mitigation is applied **once** to landed hits. The defended opposed 3d6 total gains a small armor-based evasion modifier, and successful dodges use an armor-adjusted margin; Plate almost never dodges. Weight subtracts an encumbrance penalty from the initiative total. New equipment selections require actual **STR** (Plate), **DEX** (Leather) or **WIL** (Mage Robe) per-piece instead of Fighting level; existing saved gear remains equipped if a new requirement would otherwise remove it. Player equipment becomes effective on a **new frozen combat session** (old session time always settles first); old gearless sessions are reconstructed under their original rules. The current engine has **no magic attacks**: magic resistance is recorded as a planned counter only, not an effective resistance. These are alpha values to playtest, not final PvP balance.

**Not yet implemented:** an exact aggregate roll-free offline combat victory report, individual combat ability XP/leveling, skill cooldowns beyond wind-up, physical equipment inventory, raid and clan actions, ally rescues/revives, permanent wounds and an exhaustive per-outcome/per-opponent art library. Those require subsequent owner-approved mechanics; the alpha values are intentionally simple and editable.

### Activity difficulty and terrain

Every duel draws one of six equipment profiles. Tanks wear full plate, mages wear a full robe, archers wear leather, and dual swords, hammers and greatswords may draw leather or plate. The selected Fighting grade sets enemy skill to its unlock level, enchant bonus to its tier index, and primary stats to the target stat with independent variation of up to two points. These are provisional reference builds. Player upgrades never raise the enemy benchmark.

After initiative, a separate D6 teleports both fighters. In an open field (1–2), bows and staves gain 3 attack score, melee loses 1, and melee below 80% mobility loses another 2. A ruined courtyard (3–4) is neutral. In a dungeon passage (5–6), melee gains 2 and ranged loses 3. Both sides use the same rules. Staff spells use magic resistance. The terrain roll fits inside the opening beat. Reloading reproduces the same encounter.
