# GEAR-RESEARCH-001 — durability follow-up (2026-11-25, chat)

Research only. Baseline main `01362378d8aefcec3aa1fa4bb73116d9457237c3`; uses the proposed cumulative expertise and grade bonuses from [GEAR_PROGRESSION_STUDY.md](GEAR_PROGRESSION_STUDY.md), not currently deployed rules. No changes to production gameplay, prices, repair, saves, or Apprentice.

## Method / reproducibility

Run from repo root: `node tools/gear-durability-study.mjs > durability.json`. [Complete structured output](GEAR_DURABILITY_RESULTS.json) saved. The same harness body was executed in an isolated JS environment with the actual pinned combat and smith modules; standalone Node entrypoint/CI not independently run. In-memory candidate changes and capacity override only. Source-linked equipment starts intact every fight; production fighter() reinitializes HP, documented in COMBAT.md; no persistent wear or repair cost is modeled or proposed.

Per variant: 144,000 regular duels = 8 grades × 4 qualities × 15 subject builds × 15 same-grade Common opponents × 5 arenas × 2 LCG seeds (start 20261126) × 2 sides. Both fighters fully trained; STR/DEX/END and skill set to target grade arenaBenchmark. 23,040 shield stress duels = 32 grade/quality combinations × 3 shield armour families × 3 hammer armour families × 5 arenas × 8 seeds (17711882) × 2 sides. Both fighters' END doubled; same STR/DEX/skill; synthetic stress not a predicted ordinary encounter. 31,500 cross-build transitions = 7 adjacent grades × 225 ordered build pairs × 5 arenas × 2 seeds (8093123) × 2 sides, higher Poor vs prior Masterwork at shared previous-grade expertise threshold. Total 198,540 per variant, 794,160 duel executions across four variants. Common random numbers aid comparisons but are not independent statistical samples. Small per-pair seed sample; aggregate rates, not universal per-build guarantees.

Each variant sets maxHP=24+gradeCoefficient*g+qualityCoefficient*q for weapon, shield and each of four armour pieces; q=0,1,2,3 for Poor/Common/Fine/Masterwork. Masterwork always unbreakable. Existing damage/guard/crit and wear costs unchanged. Break events attributed to tested fighter: attack weapon to actor, guard weapon/shield/armour to target; shield rate denominator shield users only. Any-break rate includes weapon, shield or at least one armour piece. Win rates include draws in denominator. Masterwork wear/any-break invariant asserted across ordinary and stress sweeps. No assertion that the same quality has higher win rate against every particular opponent.

## Results

| Variant (grade,quality coefficient) | Poor break | Common break | Fine break | MW break | Poor win vs Common | MW win vs Common |
| --- | --- | --- | --- | --- | --- | --- |
| candidate24g3q | 3.14% | 2.84% | 1.68% | 0.00% | 40.64% | 63.34% |
| moderate6g12q | 7.08% | 1.93% | 0.49% | 0.00% | 40.63% | 63.28% |
| flat0g12q | 41.75% | 16.01% | 4.10% | 0.00% | 38.38% | 63.48% |
| moderate3g12q | 16.79% | 4.18% | 0.64% | 0.00% | 40.49% | 63.29% |

The previous candidate (24g+3q; algebraically equivalent to 24+3*newItemPower+12g) makes all D–S qualities effectively unbreakable in regular encounters. The grade-neutral alternative makes Poor break in 41.75% of regular bouts and 35.24–55.51% of upgrade tests; excessive for a mandatory upgrade path. Recommend the intermediate 3g+12q option as the next candidate, not approved for implementation: appreciable Poor break risk persists at every grade, quality differentiates durability, and aggregate combat outcomes are close to the previous candidate.

### Preferred durability model: capacities and regular break rates

| Grade | Poor HP | Common HP | Fine HP | MW | Poor any | Common any | Fine any |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Non-grade | 24 | 36 | 48 | Unbreakable | 24.18% | 6.96% | 1.69% |
| F | 27 | 39 | 51 | Unbreakable | 23.36% | 5.84% | 1.40% |
| E | 30 | 42 | 54 | Unbreakable | 19.87% | 3.82% | 0.24% |
| D | 33 | 45 | 57 | Unbreakable | 19.73% | 8.42% | 0.47% |
| C | 36 | 48 | 60 | Unbreakable | 18.04% | 4.38% | 0.42% |
| B | 39 | 51 | 63 | Unbreakable | 11.60% | 1.84% | 0.51% |
| A | 42 | 54 | 66 | Unbreakable | 9.44% | 1.67% | 0.24% |
| S | 45 | 57 | 69 | Unbreakable | 8.07% | 0.53% | 0.18% |

Masterwork still receives numerical maxHP for engine/UI but never wears. Across all grades in this candidate, Poor weapon breaks 1.14%, shield 8.79% conditional on shield build, armour 14.35%; Common 0.08%, 3.86%, 3.36%; Fine 0%, 0.92%, 0.46%. Shield/armour contributions overlap; not summed. No Masterwork wear detected. Normal Fine breakage very rare; Masterwork benefit in longer fights is stronger than aggregate normal numbers suggest.

### Long fight / hammer shield stress

| Variant | Poor any | Common any | Fine any | MW any |
| --- | --- | --- | --- | --- |
| candidate24g3q | 35.94% | 24.86% | 23.54% | 0.00% |
| moderate6g12q | 79.84% | 66.89% | 53.35% | 0.00% |
| flat0g12q | 99.65% | 90.45% | 80.47% | 0.00% |
| moderate3g12q | 93.49% | 76.61% | 61.79% | 0.00% |

Preferred candidate stress S Poor any-break 97.36%, S Fine 68.06%; shield 93.61% / 68.06% respectively. These are intentionally extreme high-END anti-shield fights. Existing 24-HP blunt shield wear drives the effect; no new weapon class or wear changes proposed. Masterwork remains useful against this counter.

### Next-grade Poor vs previous Masterwork

| Upgrade | Preferred win | Preferred any-break | Previous candidate win |
| --- | --- | --- | --- |
| Non-grade→F | 63.58% | 20.33% | 64.84% |
| F→E | 68.22% | 24.78% | 69.00% |
| E→D | 62.27% | 21.69% | 62.42% |
| D→C | 61.40% | 16.91% | 61.89% |
| C→B | 64.93% | 14.67% | 65.27% |
| B→A | 65.69% | 12.64% | 66.02% |
| A→S | 64.62% | 12.47% | 64.84% |

All aggregate transitions still favor the higher grade (61.40–68.22%). This is not a guarantee against individual tactical counters. New Poor can break while old Masterwork cannot; show the tradeoff in purchase preview.

## Recommendation and remaining work

Candidate: `maxHP=24+3*g+12*q`, keep Masterwork unbreakable and complete condition restoration each bout. This decouples durability progression from itemPower. Choice prioritizes visible durability progression and rewarding quality over nearly eliminating breakage at high grades; acceptance target not formally set by Owner. Do not alter runtime until approved. Before implementation, cross-check grade/quality economy with current reward caps, normal player schedules, expertise training, and the mandatory Poor transition path; no skip/refund exploit. Also test NPC difficulty separation and final tactical counters. Further targeted durability scenarios may be needed for mixed armour, unequal attributes/expertise and per-slot outcomes. No long-term repair or persistent wear exists. 
