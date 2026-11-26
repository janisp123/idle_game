# Equipment and the smith

## APPRENTICE-A4 — automatic equipped-item upgrades (release candidate)

At ten combined earned activity levels, the assistant automatically upgrades the chosen owned weapon and non-None equipped armour on coordinated page entry, after ordinary offline settlement and any optional Master claim. No off switch, reserve or configurable purchase priority. Lowest nominal stage first; ties weapon then armour slot order. Save toward the next eligible legal upgrade. Exact existing smith prices and Fighting gates apply, no skips or refunds. Manual upgrades of owned items are blocked after unlock; initial armour acquisition and free equipment selection remain strategic player actions. No purchases on ordinary offline settlement, visibility return or ticks. Commit before displaying success; unsafe storage/unsupported coordination reports unavailable. The active bout retains its old equipment until the next boundary. See [mandatory economy validation](APPRENTICE_A4_MANDATORY_VALIDATION.md).

Head, Torso, Arms and Legs each equip None, Padded, Leather or Plate. The four slots cover 12%, 33%, 31% and 24% of the fighter respectively. A full Padded suit provides 12% physical reduction, Leather provides 22%, and Plate provides 50%. Mixed suits contribute in proportion to each slot's coverage. Heavier gear reduces mobility and can reduce initiative. The smith's equipment panel shows the equipped build's total weight, mobility, armour, attack and guard.

A fresh character can select any of the five Non-grade Poor weapons. Bow includes a backup dagger in its equipment profile, and Sword & Shield includes a heater shield. The bow switches to its dagger when arrows run out or the bow breaks. Armour is initially empty. Buy a family for a specific slot, then equip or unequip the owned piece for free. Select a weapon or armour slot to edit one item.

## APPRENTICE-A3 — equipment rules (PR #181)

Each item has 32 ordered stages (eight grades × Poor, Common, Fine, Masterwork). Buy exactly the next stage; next grade starts Poor only after current Masterwork. New armour starts Non-grade Poor (24 coins); five starter weapons are already owned. Existing ownership is retained. Full-credit cost = target cumulative price minus current cumulative price; no refund or skip. Fighting gates 1/5/10/17/25/33/40/50. Price tables unchanged: full S Masterwork weapon 600,245; complete five-item set 3,001,321.

Grade index g, quality index q (0..3): nominal flat power = 4g+q. Let P(t) be existing proficiency for grade t at current practice. Effective flat = sum(4P(t), t=1..g)+qP(g); weapon rounds to integer, each armour piece guard = ceil(effective flat/4). Effective multiplier M = 1 + sum((1.35^t−1.35^(t−1))P(t), t=1..g) + 1.35^g × (qualityFactor−1)P(g); quality factors 1/1.04/1.09/1.15. Prior mastered grade increments remain fully effective. Resistance = coverage × (M−1) × material coefficient (.95 padded, 1 leather, 1.15 plate). Existing style accuracy/penetration and armour mobility/dodge factors also use incremental proficiency. Additional weapon recovery skip = 2 percentage points/grade, accuracy = 1 pp/grade after F, critical chance = .5 pp/grade after E, critical multiplier bonus = .03/grade after D. Armour additional dodge = .5 pp/grade after F times family factor 1/.65/.15 and coverage; critical avoidance/reduction use the same crit curves weighted by coverage. All effective bonuses are accumulated per grade with P(t). Existing proficiency thresholds including 4000h for S remain.

Condition HP = 24+3g+12q. Masterwork unbreakable; condition resets per bout. Broken gear loses its relevant bonuses; worn weight stays. No automatic purchases in A3. Shop shows only the next stage and actual quote. Within the same rules version existing equipment/stats freeze for the current bout. Old alpha snapshots spanning a software release are interpreted by the updated resolver, not replayed under a retained historical ruleset. Existing paid balances are not reset.

Victory payouts NG through S: 12/20/32/48/68/92/122/185 coins. Defeat/double death pay zero. Saved prize cursor prevents duplicate payments. See [combined validation](GEAR_COMBINED_VALIDATION.md) for research evidence. All sections below are historical development notes where superseded by these rules.

## ALPHA-GEAR-001 A1 — provisional access and prices

All Fighting difficulties are selectable at any level. Displayed target skill is guidance, not a lock. Noncombat activities retain their existing level gate. Gear purchases require activated Fighting level and coins; owned gear can still be equipped freely.

The candidate level array (Non-grade through S) is 1, 5, 10, 17, 25, 33, 40, 50. Common grade cost components are 0, 2,500, 9,000, 24,000, 60,000, 120,000, 225,000, 400,000. Quality factors are 0.85/1/1.2/1.5 plus 0/45/120/245 quality base; first-time armour adds 24. The smith charges cumulative differences, exposes the lock reason and never consumes coins for a refused purchase. S Masterwork weapon costs 600,245; full one-weapon/four-armour build costs 3,001,321. Candidate only: actual income and prices must be retested after gear scaling and expertise.

Fighting XP is independent of selected difficulty; productive combat time and general skill efficiency drive it, so selecting an impossible opponent does not accelerate skill leveling. Higher-grade wins still pay the larger prize. Noncombat work multipliers are unchanged. Old alpha ownership is not revoked by this draft; final release should clearly announce a reset if needed. See [measured A0 baseline](ALPHA_GEAR_BASELINE.md).
## A2 — candidate physical scaling (draft)

Weapon damage uses the old flat power contribution plus a multiplier `1.35^grade × qualityFactor` (Poor/Common/Fine/Masterwork 1/1.04/1.09/1.15). S Common is approximately 8.5× Non-grade Poor on the weapon contribution. Each intact armour piece adds grade resistance `coverage × (gearFactor−1) × materialFactor` (Padded .70, Leather .85, Plate 1.15). Damage after material protection divides by `1 + totalResistance × (1−penetration)`; intact per-piece flat guard is subtracted afterward. Gear bonuses vanish when their relevant piece breaks. Masterwork remains unbreakable. Grade adds weapon-style accuracy and penetration, and armour-family mobility and dodge; bonuses are bounded and shown in the equipment summary. Base protection, terrain and weapon recovery remain distinct. See named GEAR_BALANCE in smith.mjs. This is a candidate, not final tuning.

## A3 — equipment expertise (draft)

Nine independent, permanent practice counters: five weapon styles, None/Padded/Leather/Plate. Integer units are quarter-milliseconds: each completed bout credits 4 × productive milliseconds to its frozen weapon and one × to each of four frozen armour slots. Thus total weapon and armour effort each equal one complete time budget, no rounding loss. Defeat resurrection is excluded; partial bouts credit on completion, abandoned bouts cannot farm expertise. Noncombat/travel/preparation grant none. Bow/dagger is one track. Counters retain all safe-integer accumulated practice beyond mastery.

Grade thresholds are 0/160/320/660/1320/2000/2800/4000 productive hours (approximately six months of sustained fighting at S). Grade zero requires no expertise. For higher grade g, minimum proficiency = 1−0.60 × (g/7)^0.7, increasing linearly to 1 by its threshold. Proficiency scales the equipment-derived extra damage multiplier above 1, flat attack/guard (rounded), resistance, accuracy, penetration, mobility and dodge bonuses; shield block and greatsword parry chance use the relevant weapon proficiency. Natural material protection and Masterwork durability remain unchanged. Unarmoured practice is tracked but has no grade penalty or additional dodge bonus in this candidate. Purchase access remains independent.

Earned expertise is published automatically on visible ticks and return, no Master visit. A saved active map freezes through absence. The current bout and its prize settle unchanged; at the next full bout boundary refresh only the frozen kit's effective expertise effects, preserving its other stats/seed/prize cursor. Any settlement handles at most one extra boundary, not per-level replay. V13 alpha save contains both maps and the frozen training kit. Old alpha saves reset with existing notice at eventual deployment. UI selected-item bonus percentage describes the fraction of its grade-derived benefits retained, not total damage.


A7: selecting a weapon, armour, difficulty or claiming Master levels changes the character's chosen build immediately; the arena applies it only at the next complete bout boundary, after the original fight and recovery. Expertise and newly earned active attributes follow the same rule. The old kit earns the old bout's practice, and old-grade prize settlement is unchanged. Earlier immediate-restart descriptions are superseded. See SCHEDULING.md.


## A8 — measured physical tradeoffs

Current material resistance coefficients Padded .95, Leather 1.00, Plate 1.05 supersede A2 .70/.85/1.15; base protection unchanged (12/22/50 for full set). Actual dodge chance = min(.40, max(0, mobility−65) × .0045 + intact graded dodge). Per-grade graded dodge factors Padded .035, Leather .025, Plate .001, weighted by coverage and expertise. The resolver rolls dodge after initial accuracy, emitting a zero-damage defense event; broken pieces lose graded dodge, guard and resistance, worn weight remains. UI reports total chance conditional on an accurate attack, not guaranteed damage avoidance. Unarmoured has natural mobility evasion only, not imaginary graded armour. Masterwork stays unbreakable; gear prices and expertise thresholds unchanged. See A8 audit for measured results.

## BAL-002 — material-specific protection and mobility (candidate)

For intact pieces, keep original coverage-weighted raw material score (full Padded 12, Leather 22, Plate 50). Multiply by the material/damage-type factor before penetration and 80% material cap. With all four intact pieces, pre-penetration protection values:

| Material | Piercing | Slashing | Blunt |
| --- | ---: | ---: | ---: |
| Padded | 10.8% | 13.8% | 36% |
| Leather | 26.4% | 29.7% | 22% |
| Plate | 40% | 50% | 9% |

Mixed armour sums actual intact piece contributions. Legacy synthetic profiles without material ID use prior generic damage-type factors; actual snapshots carry itemId from the smith. Broken pieces contribute zero typed protection and zero graded resistance/dodge; worn weight remains. Material protection is separate from grade resistance and flat guard. Grade resistance coefficients, quality multipliers, costs and proficiency unchanged. Natural dodge slope .0045→.0075 per mobility percentage point above 65, combined cap remains .40. Per-grade mobility factors Padded/Leather/Plate 1.0/.7/.2, graded dodge .028/.018/.001, weighted by coverage and proficiency. Mobility now affects closing speed and retreat as well as initiative/dodge. Unarmoured gets natural mobility dodge only, no imaginary grade equipment; owner has not approved guaranteed endgame viability without armour. Masterwork remains unbreakable.

The character sheet retains raw material coverage for comparison and shows real pre-penetration typed totals underneath; it must not describe raw coverage as universal damage reduction. BAL-002 is game-specific provisional abstraction, not a historical armour simulation.
