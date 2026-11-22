# Combat formulas — PLAYABLE two-skill V2 alpha

**Live gameplay and tuning:** [combat.mjs](../../site/play/combat.mjs) → `COMBAT_BALANCE`, `OPPONENTS`, `COMBAT_ART`; [combat-skills.mjs](../../site/play/combat-skills.mjs) → `COMBAT_SKILLS` and `COMBAT_LOADOUTS`. [engine.mjs](../../site/play/engine.mjs) handles save V7, frozen stats, and switching a combat style. [app.mjs](../../site/play/app.mjs) shows the matched cinematic scene; **the Chronicle alone** contains event narration, attack/defense rolls and damage figures, with no image attachments or duplicate story block.

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
2. **Engage:** neutral faceoff illustration, no attack outcome.
3. **Initiative:** each fighter rolls **three real six-sided skull dice**, independently. Higher `3d6 + initiative modifiers` attacks first. On an exact score tie reroll (maximum 3 rounds); if still tied, DEX and then a deterministic player fallback decide. Both dice groups visibly animate before the true scores and result are revealed.
4. **First attack:** the initiative winner rolls their own 3d6, **opponent separately rolls 3d6 for defense**. On-screen dice animate; the prior resolved illustration stays in place. Only after the dice finish does the actual missed/dodged/blocked/parried/wounding result appear in the painting and Chronicle.
5. **Second attack:** roles reverse. Alternate until a fighter falls or at most **six half-turns total** (at most **three attacks per fighter**).
6. **Aftermath:** a knockout immediately decides the victor; if six turns expire with both standing, the fighter with a higher fraction of HP remaining wins a nonfatal judges' decision, or both draw if the fractions tie. No fabricated fatal wound is added at the horn. The scene uses the actual player victory/defeat/stalemate painting.

A completed duel lasts **at most nine displayed stages**: engage + initiative + six attacks + aftermath. Current `eventMs=25,000` → a maximum of 225 seconds per bout; phase timing is internal only and does not appear as countdowns. Initial rolling animation is 3.5 seconds; Heavy Swing adds 1.8 seconds of internal wind-up. Those values are presentation defaults and do **not** change event outcomes, work-cycle XP or offline progression. The long-lived duel is reconstructed from a seed in constant bounded work even after years away.

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

### Resolve the attack (always one attack 3d6 and one defense 3d6)

1. If the **raw attack dice sum ≤ 5**, a genuine miss/overreach occurs even with high skill. The defender still rolls; no damage is dealt, and the defender earns an opening for their next attack.
2. Otherwise, if `attackTotal ≤ defenseTotal`, the attack is **stopped**. A defender with trained Shield Block **blocks**, with Blade Guard **parries**; an untrained defender **dodges**. A defense margin of at least `dodgeMargin=7` also gives a **dodge**. Successful dodging yields an opening; guard and miss deal zero damage.
3. If `attackTotal > defenseTotal`, the attack **lands**. If the attacker rolled **6–6–6** and the score margin is at least `criticalFinisherMargin=1`, the blow is an immediate devastating weapon-specific **finisher**. A superior defender can still survive a triple-six if they genuinely beat the attacker. A fair attacker-side triple-six occurs with probability 1/216 **per attack**, but actual finisher probability also depends on overcoming defense.
4. Otherwise calculate `damage = max(1, round((baseDamage + STR_A × damagePerStrength + FightingLevel_A × damagePerSkill) × attackSkill.damageMultiplier))`. Defaults are `6 + STR×0.5 + FightingLevel×1.4`. Defender HP begins at `max(1, round(baseHP + END×hpPerEndurance))`, currently `baseHP=16`, `hpPerEndurance=1.4`. Apply damage, then emit **strike**, **wound** (remaining HP ≤ 50%), or **collapse** (HP=0). These are actual health results, not random paintings.

At equal STR=DEX=END=10 and Fighting level 1, the greatsword deals **24** on a clean hit, while sword thrust deals **12**, against a 30-HP fighter. However the greatsword is slower to reveal and has weaker initiative and defense. Both players and NPCs use these same equations.

## What the player sees — strictly after rolls

- **Live Fighting only:** initiative has **two animated groups of three skull dice**. Every later attacking turn displays both attacker's and defender's three dice, identified as YOU/ENEMY and ATTACK/DEFEND. The dice values shown after animation are the actual predetermined simulation results; cosmetic preview face changes **never reroll the game**.
- During the roll, the **previous result image** stays visible. No attack picture, damage or Chronicle outcome is leaked early. At revelation, update to the exact relevant original art and append **one** Chronicle line with damage and both 3d6 groups/scores. Main scene has only short duel/turn indicators and optional special 6–6–6 celebration.
- For Fighting, **hide the old work-cycle progress bar** (it falsely looked like a strike timer). Place a responsive five-stage combat action timeline **immediately beneath the artwork**, with a highlighted active stage, completed and upcoming segments, and a small progress fill. Initiative, each opposed attack, the actual revealed move and next-duel preparation all have grounded labels. Each attack visually rolls the attacker's 3d6 first, then the defender's 3d6; both dice were already calculated by the unchanged deterministic engine. After both phases the matching art and Chronicle result are revealed. The bar adapts to whichever fighter attacks first, and to early duel endings; it does not imply a fixed alternation or a mandatory six turns. Six small completed-turn markers remain for duel history. Other activities retain their ordinary work progress bar. No extra XP, save fields, combat RNG, or offline replay is added.
- Respect `prefers-reduced-motion` for the cosmetic dice wobble. The game's rolls still work without CSS animation or a constantly open tab.

## Data and persistence guarantees

- The `combatLoadout` choice is stored in **V7 local save data**, along with the combat-session seed, elapsed Fighting time and original frozen fighter stats. V6 hammer/axe/sword prototype sessions migrate to the default **Greatsword** skill pair without losing elapsed time, RNG seed, attributes, items or skill levels. Existing local save key remains the same.
- Changing combat style during a duel settles elapsed productive time first, then starts a **fresh duel** with the new selected skill pair (no XP/resource reset). Away time never silently upgrades effective skills or attributes (OFF-001).
- Long offline stretches update the Fighting observation clock in bounded work and reconstruct **only the currently observable bout** from its seed. There is **no fabricated historical kill report**.
- Defeat ends the current illustrated/narrated bout; it does not delete XP, items, stats, account, gear or character. Full resurrection downtime and equipment systems are NOT implemented.
- **Original event paintings are implemented for the two active loadouts:** 12 960×540 WebP files in `site/play/assets/combat/`. The pure `site/play/combat-art.mjs` registry (`COMBAT_ART`, `combatArtworkForEvent`) picks scenes by **real event type, actor, attacker weapon, defender's trained guard ability, and final player victory/defeat**. Four distinct outcome images exist: Greatsword victory/defeat and Sword & Shield victory/defeat. For an unillustrated defense/ability, it returns an honest neutral arena tableau (`exact:false`), never a picture showing the wrong skill. Some defeat/miss crops from original concept art are lower-detail and can be improved individually later.

## Change and expansion map

- Edit offensive damage, within-turn wind-up, attack score: `COMBAT_SKILLS.heavy_swing` or `COMBAT_SKILLS.thrust`.
- Edit trained guard dice-score bonus and type: `COMBAT_SKILLS.blade_guard` or `COMBAT_SKILLS.shield_block`.
- Edit untrained fallback penalty, dice-score scaling, initiative tie handling, HP, timing and triple-six margin: `COMBAT_BALANCE`.
- Add new skill: define it in `COMBAT_SKILLS` with a role and corresponding attributes, then add or modify `COMBAT_LOADOUTS`. For a new animation event type, update event parsing, UI and original art registry.
- Tests: [test_combat.mjs](../../tools/test_combat.mjs) for independent rolls, charge, shield/parry/fallback probabilities, rare finishers, V6→V7 migration and multi-decade offline safety; [test_game_ui.mjs](../../tools/test_game_ui.mjs) for choice, screen, persistence and no duplicate retroactive gains.

**Armour selection (UI-only):** [Fixed armour wardrobe](ARMOUR.md) now saves a chosen preset for 11 independently selectable body slots; equipment grants no combat bonus yet, so the duel equations, fighting snapshot and offline balance above are unchanged. Future gear effects need separate owner-approved calibration and snapshot tests.

**Not yet implemented:** an exact aggregate roll-free offline combat victory report, individual combat ability XP/leveling, skill cooldowns beyond wind-up, physical equipment inventory, raid and clan actions, ally rescues/revives, permanent wounds and an exhaustive per-outcome/per-opponent art library. Those require subsequent owner-approved mechanics; the alpha values are intentionally simple and editable.
