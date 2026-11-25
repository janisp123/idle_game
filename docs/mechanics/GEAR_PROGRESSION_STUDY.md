# GEAR-RESEARCH-001 — grade progression study

2026-11-25, chat. Owner requested numerical options for progressively unlocked weapon and armour bonuses, making next-grade Poor equipment preferable to previous-grade Masterwork. **Research only; candidate not approved for production.** Pinned baseline main `01362378d8aefcec3aa1fa4bb73116d9457237c3`. Keep five weapon classes; no economy, shop, Apprentice or save changes in this study.

## Method and limitations

Executed the actual pinned `smith.mjs`, `physical-duel.mjs`, `armour.mjs`, `expertise.mjs`, `difficulty.mjs`, `combat-skills.mjs` and `arenas.mjs` exports in an isolated JavaScript environment, using in-memory transformations of smith and duel source for candidates only. No public runtime override, external data or player saves. Constructed real equippedCondition and armourStats for the five weapon styles × three uniform armour families, all five terrain definitions, same character attributes, skill and absolute expertise hours in each pair, reversing player/enemy positions for every seed. Outcomes count victories divided by all bouts including draws. Compared weapon-only, four-piece armour-only and complete equipment-set upgrades. The stat/skill values are the target next-grade arenaBenchmark; prior-grade mastery hours are the default comparison. No claim that these synthetic battles measure actual player satisfaction.

Sweep 1: 12 LCG seeds (initial 20261125, then state = (imul(state,1664525)+1013904223) >>> 0). 37,800 duels each for baseline and each of three durability candidates (+12/+24/+40 HP per grade), 151,200 total. Durability candidates gave identical aggregate outcomes in this particular sample; choose +12 as the smallest tested candidate, NOT evidence that higher durability can never matter.

Sweep 2: 32 seeds from initial 123456789, same LCG. Candidate +12: 100,800 transition duels (7 transitions × 15 builds × 3 upgrade types × 5 arenas × 32 seeds × 2 positions). Quality sweep: 76,800 duels (grades 0,1,3,7; Common/Poor, Fine/Common, Masterwork/Fine, Masterwork/Poor complete sets). S-Common equal-grade 5×5 matrix, baseline and candidate: 48,000 duels. Sweep 2 total 225,600; both sweeps total **376,800**. Additional exact intact-stat comparisons at 0, previous-grade threshold and 4000 expertise hours (not additional full novice duels). No sampling claims for every individual opponent or mixed armour piece, no endurance economy/progression model, no pricing audit. Need reproducible permanent test harness before implementation; the reported runs used isolated in-memory source transforms, not a committed runtime branch or CI.

## Candidate formula (exact tested model)

Retain 1.35 full grade multiplier, quality multipliers [1,1.04,1.09,1.15], material protection, armour weight, original style-specific accuracy and penetration coefficients, original expertise thresholds and all weapon/terrain styles. Change flat itemPower from 3*g+[0,2,5,9] to 4*g+[0,1,2,3] (Poor/Common/Fine/Masterwork). This reduces early Masterwork flat bonus; benefits shift toward grade and multipliers.

Define P(t) = existing proficiency(effort,t). Define C(g,V) = sum for t=1..g of (V[t]-V[t-1])*P(t). This applies expertise to the incremental benefit at each grade instead of penalizing all previous grade benefits again. Retain P(g) for shield block and weapon parry (possible temporary decline in those specific stats; evaluate separately). Effective flat = C(g,[0,4,8,12,16,20,24,28])+qualityFlat*P(g); weapon flatAttack rounds this. Effective damage multiplier = 1+C(g,[1.35^t])+1.35^g*(qualityMultiplier-1)*P(g). Armour guard per piece = ceil(effectiveFlat/4); armour resistance = coverage*(effective multiplier-1)*existing family resistance. Coverage is fractional. This is a substantive redesign of expertise effects, not a small additive perk patch.

Weapon bonuses at full expertise (cumulative extra beyond the existing style-specific accuracy/penetration):
| Grade | Chance to remove one recovery turn | Added accuracy pp | Added critical chance pp | Added critical damage multiplier |
| --- | ---: | ---: | ---: | ---: |
| Non-grade | 0% | 0 | 0 | 0 |
| F | 2% | 0 | 0 | 0 |
| E | 4% | 1 | 0 | 0 |
| D | 6% | 2 | 0.5 | 0 |
| C | 8% | 3 | 1 | 0.03 |
| B | 10% | 4 | 1.5 | 0.06 |
| A | 12% | 5 | 2 | 0.09 |
| S | 14% | 6 | 2.5 | 0.12 |

Implement speed with a separate deterministic RNG seeded (seed XOR 0x85ebca6b) >>> 0; roll when weapon intact after setting recovery, reduce recovery by one on success, floor zero. It is NOT a literal percentage attack-rate increase. Accuracy retains existing clamp and handling for dagger. Critical uses guardRoll > 1-max(0,0.04+intact activePiece.crit-armour critResist) and existing no-block/no-parry gate. Critical damage multiplier = 1+max(0,0.65+intact activePiece.critDamage-armour critReduction). This changes existing vital/finisher effect, not a second critical mechanism. The base conditional crit chance is 4%, base multiplier 1.65; S before target defence is 6.5% and 1.77x. Actual crit rate also depends on accuracy, dodge, guard and armour. All bonuses via C(g,V), not saved flags.

Armour cumulative full expertise, complete uniform set; mobility is the existing graded mobility benefit retained and made incremental; dodge is extra over existing graded dodge:
| Grade | Padded mobility points | Extra padded dodge pp | Crit avoidance pp | Crit bonus damage removed |
| --- | ---: | ---: | ---: | ---: |
| Non-grade | 0 | 0 | 0 | 0 |
| F | 1 | 0 | 0 | 0 |
| E | 2 | 0.5 | 0 | 0 |
| D | 3 | 1 | 0.5 | 0 |
| C | 4 | 1.5 | 1 | 0.03 |
| B | 5 | 2 | 1.5 | 0.06 |
| A | 6 | 2.5 | 2 | 0.09 |
| S | 7 | 3 | 2.5 | 0.12 |

Scale mobility by existing family factors padded 1/leather .7/plate .2. Scale extra dodge by padded 1/leather .65/plate .15, retain original family graded dodge increments using C. Crit avoidance and bonus damage reduction coverage-weighted, only intact pieces, no all-or-nothing set bonus. Existing 40% total dodge cap and mobility 100% cap remain. Crit reduction removes part of the bonus above normal hit (not a percentage of all damage). Base material weaknesses remain. No crit evasion from unequipped armour.

Durability candidate: maxHP = 24 + 3*new itemPower + 12*g; keep Masterwork unbreakable. F Poor 48 HP vs old Non-grade MW unbreakable. This was the smallest of +12/+24/+40 tested; needs durability-specific stress tests, no maintenance system. Equipment quality and grade purchase prices NOT changed in this study. Rework smithQuote ordering/eligibility rather than using itemPower alone. A3 must model cumulative costs, positive debits and no skip/refund exploit.

## Results

Sweep 1 win % higher-grade Poor versus prior Masterwork, matched builds:
| Transition | Baseline weapon | Candidate weapon | Baseline armour | Candidate armour | Baseline full set | Candidate full set |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0→F |44.2|65.0|40.7|60.3|37.9|72.3|
| F→E |44.7|65.4|54.1|64.1|49.3|76.6|
| E→D |40.6|69.7|40.1|60.8|34.7|77.3|
| D→C |39.0|69.1|34.6|61.9|26.6|77.4|
| C→B |42.6|69.3|39.6|62.4|35.2|80.9|
| B→A |42.6|72.2|43.4|67.6|37.4|83.9|
| A→S |38.2|70.4|41.3|64.2|30.9|79.7|

Sweep 2 independent seeds, candidate only:
| Transition | Weapon win % | Armour win % | Full win % | Minimum intact weapon base damage ratio (all attacks including backup dagger/bash) | Worst weapon build win % | Worst armour build win % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0→F |63.6|61.9|73.7|1.0950|51.9|52.2|
| F→E |63.6|65.6|77.9|1.1375|55.3|55.9|
| E→D |63.2|63.6|74.8|1.1028|50.6|50.3|
| D→C |63.3|63.0|75.2|1.0986|52.8|52.2|
| C→B |64.0|66.7|78.9|1.1133|55.9|55.3|
| B→A |64.1|63.4|76.1|1.1182|57.2|51.3|
| A→S |65.2|64.6|77.7|1.1128|50.6|51.9|

Each row uses 4800 duels per category, 320 per style/family. Worst full-set build 61.9% (A→S sword/shield padded). Near-50% cases are not robust proof every individual build is advantaged. Exact minimum intact damage ratio at zero expertise across seven transitions: 1.0906; at previous-grade hours: 1.0950; fully trained: 1.1681. Sweep 1 min resistance-factor ratio (1+new resistance)/(1+old resistance) 1.110 to 1.131; no full-set guard decrease in any tested grade or practice condition. Baseline min weapon damage ratios 0.880–0.926, guard loss up to 12, last grade resistance factor ratio 0.988. Resistance factor improvement is not the same percentage of damage reduction.

Same-grade quality (complete set, fully trained, higher quality victories):
| Grade | Common vs Poor | Fine vs Common | Masterwork vs Fine | Masterwork vs Poor |
| --- | ---: | ---: | ---: | ---: |
| 0 |71.2|62.0|63.5|87.6|
| F |70.4|63.3|66.1|84.4|
| D |66.8|63.8|65.1|84.6|
| S |63.5|62.3|63.9|78.0|

Some individual style/family quality pairs were effectively 50%; these are average effects, not guaranteed wins.

Equal S Common, 150 STR/DEX/END, skill 50, fully trained, all arenas and three families. Row wins % vs columns (order greatsword, sword_shield, hammer, bow, spear):
Baseline:
- greatsword: 49.8,43.9,51.0,47.0,36.8
- sword_shield: 55.8,49.5,39.6,74.9,62.9
- hammer: 49.0,60.4,49.3,65.8,45.8
- bow: 53.0,25.1,34.2,50.0,59.4
- spear: 63.1,37.1,54.2,40.5,50.0
Candidate:
- greatsword: 49.9,50.4,47.1,57.5,39.6
- sword_shield: 49.6,49.8,41.1,74.2,61.8
- hammer: 52.8,58.9,46.8,65.7,50.8
- bow: 42.3,25.7,34.3,49.9,57.3
- spear: 60.4,38.2,49.2,42.6,49.9

Broad counters remain but some matchups shift, especially greatsword vs bow (47→57.5%). Candidate needs approval and counter-balance checks at early/middle grades, individual arenas/materials, durability stress, mixed and partial gear, realistic low expertise / NPCs, tier separation, economy and six-month progression. No claim of globally optimal numbers. A3 grade changes must improve intact attack/protection, preserve expertise as meaningful training and avoid surprise downgrade; expose exact new bonuses and effective values in character stats, and clarify Masterwork→breakable tradeoff in purchase preview. Candidate is a starting point only.
