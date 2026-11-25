# Equipment and the smith

Head, Torso, Arms and Legs each equip None, Padded, Leather or Plate. The four slots cover 12%, 33%, 31% and 24% of the fighter respectively. A full Padded suit provides 12% physical reduction, Leather provides 22%, and Plate provides 50%. Mixed suits contribute in proportion to each slot's coverage. Heavier gear reduces mobility and can reduce initiative. The smith's equipment panel shows the equipped build's total weight, mobility, armour, attack and guard.

A fresh character can select any of the five Non-grade Poor weapons. Bow includes a backup dagger in its equipment profile, and Sword & Shield includes a heater shield. The bow switches to its dagger when arrows run out or the bow breaks. Armour is initially empty. Buy a family for a specific slot, then equip or unequip the owned piece for free. Select a weapon or armour slot to edit one item.

## Item grades and quality

Item grade runs from Non-grade to S, independently of arena difficulty. Quality runs from Poor to Common, Fine and Masterwork. In `smith.mjs`, item power is three times the grade index plus a quality bonus of 0, 2, 5 or 9. Weapon power adds raw damage. Each equipped armour piece adds flat guard equal to its power divided by four and rounded up, alongside the family's base protection. A purchase charges the difference between the old and new cumulative prices, and first-time armour adds a 24-coin purchase cost. Neither grade nor quality can go down in an improvement.

Purchases settle prior work at the old frozen build, deduct coins once and start a new duel snapshot. The condition profile defines maximum HP as 24 plus three times power and marks Masterwork unbreakable. Each battle uses these values to initialize its equipment condition. The shop has no condition controls.

## Arena prizes and saves

Completed victories pay 12, 20, 32, 48, 68, 92, 122 or 158 coins from Non-grade through S. A saved cursor tracks the last paid bout, and double deaths and defeats pay zero. The interim resolver repeats 256 seeded bouts per frozen build. Settlement resolves at most a single period, counts repeats arithmetically, and uses the same outcomes in live and offline play. V11 saves record coins, owned gear, equipped armour, and the frozen combat snapshot. Earlier alpha saves reset once with a clear notice.

Source: `site/play/armour.mjs`, `smith.mjs`, `arena-wallet.mjs` and `engine.mjs`.

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
