# GEAR-RESEARCH-001 — six-month equipment economy (2026-11-25, chat)

Research only. Pinned production baseline `01362378d8aefcec3aa1fa4bb73116d9457237c3` (APPRENTICE-A2). Uses candidate grade/quality combat from [GEAR_PROGRESSION_STUDY.md](GEAR_PROGRESSION_STUDY.md) and recommended durability 24+3g+12q from [GEAR_DURABILITY_STUDY.md](GEAR_DURABILITY_STUDY.md). No live gameplay or save changes. Existing CAP-001 baseline reached full S MW in 8/15 builds; this is a comparison with changed combat, durability and purchase policy together, not isolated attribution.

## Method

Reused production-engine trajectory logic from tools/simulation/build-progression.mjs. Loaded pinned real modules in an isolated JS environment with normal timing profile, in-memory candidate smith/duel changes only; no fake wallet, alpha grants, or manually awarded XP. Engine enterGame, Master claims, buyEquipment, arena prize settlement, expertise and attributes run on actual code. At each visit, claim ready Master then buy sequential stages in ascending stage order, weapon/head/torso/arms/legs; no skips. This is a synthetic manual-shop policy, NOT proposed Apprentice auto-grade buying. Fight difficulty chosen by whole-build minimum grade and average stat >=90% of arena benchmark and Fighting skill gate. One deterministic seed 20261201. Daily claims every 24h, weekly every 168h; mixed alternates 5 fighting days and 2 mining days, daily claims. Report checkpoints at 0/30/90/150/180 days. Wallet conservation and outcome conservation asserted each iteration, quote vs actual debit checked. The source-linked harness is [tools/gear-economy-study.mjs](../../tools/gear-economy-study.mjs); a monolithic 38-trajectory invocation exceeded the execution limit, so completed batches were executed separately and each pushed. Standalone Node entrypoint/CI not independently run. The unused legacy firstAnyS/affordability fields in output are null, not measured; firstSWeapon and firstSSet are measured. Total 22 completed 180-day trajectories representing 1,400,580 settled arena bouts (engine uses bounded repeated 256-bout schedule; not all independent duel executions). Full-credit daily matrix covers all 15 weapon/family combinations; no-credit sampled five combinations; cadence sampled greatsword/plate only. No rapid/hourly or income-optimized test in this follow-up.

## Sequential purchase policy and pricing

Current production smithQuote requires nondecreasing quality and rejects all next-Poor-after-Masterwork transitions. Candidate requires exactly next stage, including next grade Poor only after current grade Masterwork. First unowned armour is NG Poor (24 coins). Five weapons are initially owned at NG Poor. No auto-grade purchase or new equipment by Apprentice. Test uses strict quality stepping (three purchases within each grade), a research interpretation of the open question about allowing direct same-grade quality skips; cumulative credit means any approved same-grade shortcut would have identical total cost. Gear IDs, Fighting unlocks [1,5,10,17,25,33,40,50], current price table and prizes preserved. Audit tests 17 known IDs × 33 current states (including absent) × 32 target stages per model = 17,952 per model / 35,904 total, plus insufficient-funds and level-gate checks for legal transitions. All passed. Absent weapon is a synthetic quote case, not normal new-game state. Engine separately checks known ID. No negative/zero legal debit, downgrade, skip or refund. Existing save policy and UI not implemented.

| Model | Weapon total | Four armour + weapon | Result |
| --- | --- | --- | --- |
| Full credit: target price − current price | 600,245 | 3,001,321 | 15/15 daily full S MW |
| No credit for spent lower-grade quality: new Poor − previous Poor; quality upgrades normal | 888,285 | 4,441,521 | 0/5 tested daily full S MW |

Full-credit grade transition price per item: NG MW→F Poor 1,880; F→E 3,655; E→D 6,655; D→C 14,755; C→B 11,755; B→A 11,005; A→S 2,255. The last is intentionally cheap because A Masterwork costs 337,745 and S Poor 340,000. Prior quality expense is credited, not refunded; 260,245 coins still required for S Poor→S MW. Full credit telescopes to the existing final price, preserving cumulative cost. No negative transitions at current prices. If price table changes, reassert strict positive debits, safe-integer prices and wallet conservation. [All price/gate checks](GEAR_ECONOMY_PRICES.json).

## Daily full-credit results (15 builds)

| Build | Full S MW day | Lv | Lifetime coins | Wallet | Weapon hours | Armour hours | Win rate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bow/leather | 172 | 51 | 3,744,484 | 743,163 | 3,589 | 3,585 | 70.73% |
| bow/padded | 172 | 51 | 3,705,710 | 704,389 | 3,590 | 3,585 | 70.18% |
| bow/plate | 172 | 51 | 3,452,582 | 451,261 | 3,590 | 3,585 | 66.34% |
| greatsword/leather | 172 | 51 | 3,635,766 | 634,445 | 3,590 | 3,585 | 69.11% |
| greatsword/padded | 172 | 51 | 3,532,878 | 531,557 | 3,589 | 3,584 | 67.9% |
| greatsword/plate | 172 | 51 | 3,462,534 | 461,213 | 3,589 | 3,584 | 67.26% |
| hammer/leather | 171 | 51 | 4,151,698 | 1,150,377 | 3,615 | 3,611 | 77.18% |
| hammer/padded | 170 | 52 | 4,256,136 | 1,254,815 | 3,637 | 3,632 | 78.75% |
| hammer/plate | 172 | 51 | 3,706,980 | 705,659 | 3,590 | 3,585 | 69.9% |
| spear/leather | 173 | 51 | 3,712,876 | 711,555 | 3,563 | 3,558 | 70.36% |
| spear/padded | 172 | 51 | 3,743,918 | 742,597 | 3,590 | 3,585 | 70.74% |
| spear/plate | 174 | 51 | 3,474,852 | 473,531 | 3,542 | 3,537 | 67.17% |
| sword_shield/leather | 171 | 51 | 3,714,376 | 713,055 | 3,613 | 3,609 | 69.77% |
| sword_shield/padded | 170 | 52 | 3,905,740 | 904,419 | 3,637 | 3,632 | 73.07% |
| sword_shield/plate | 176 | 51 | 3,071,814 | 70,493 | 3,541 | 3,536 | 60.75% |

| Day | Fighting level range | Minimum equipped grade range | Lifetime coins range | Weapon expertise hours range |
| --- | --- | --- | --- | --- |
| 30 | 16–17 | E–D | 161,812–207,960 | 478–510 |
| 90 | 32–33 | C–B | 1,047,216–1,298,540 | 1,678–1,720 |
| 150 | 45–46 | A–A | 2,169,978–3,060,744 | 2,894–2,984 |
| 180 | 51–52 | S–S | 3,071,814–4,256,136 | 3,541–3,637 |

All 15 reach S Masterwork on days 170–176. All end Lv 51–52, weapon expertise 3,541–3,637 hours; armour 3,536–3,632 hours. None meets the existing 4,000-hour S mastery threshold by day 180. Consider a 3,500-hour S threshold as a separate candidate, not an approved change; rerun progression and counters before deciding. No change to other thresholds proposed here. Daily players can own S MW while still learning the grade.

## No-credit comparison (five builds)

| Build | Full S MW day | Lv | Lifetime coins | Wallet | Ending equipment (weapon/head/torso/arms/legs) |
| --- | --- | --- | --- | --- | --- |
| greatsword/plate | Not reached | 51 | 3,304,636 | 44,250 | S common, S common, S poor, S poor, S poor |
| hammer/padded | Not reached | 52 | 4,227,244 | 25,973 | S masterwork, S masterwork, S masterwork, S fine, S fine |
| bow/leather | Not reached | 51 | 3,633,998 | 33,327 | S fine, S fine, S common, S common, S common |
| sword_shield/plate | Not reached | 51 | 3,188,844 | 48,548 | S poor, S poor, S poor, S poor, S poor |
| spear/padded | Not reached | 51 | 3,597,610 | 77,014 | S fine, S common, S common, S common, S common |

## Cadence stress — full-credit greatsword/plate

| Cadence | Fighting level | Gear at day 180 | Lifetime coins | Weapon hours |
| --- | --- | --- | --- | --- |
| weekly | 26 | C masterwork, C masterwork, C masterwork, C masterwork, C masterwork | 640,872 | 1,183 |
| mixed | 42 | A masterwork, A masterwork, A masterwork, A masterwork, A masterwork | 2,481,284 | 2,606 |

Weekly claims hit reward cap and stop productive gains long before next login. Mixed route invests time in other skills. These are expected effects of current owner-approved CAP-001, not evidence that weekly should equal daily. Auto-Master at login reduces clicks but cannot claim repeatedly while offline; synthetic manual claims here exercise same skill advancement, not browser consent/lock flow. No automatic new-grade buying proposed.

## Durable outputs

- [GREATSWORD_PLATE](GEAR_ECONOMY_GREATSWORD_PLATE.json)
- [HAMMER_PADDED](GEAR_ECONOMY_HAMMER_PADDED.json)
- [BOW_LEATHER](GEAR_ECONOMY_BOW_LEATHER.json)
- [SHIELD_PLATE](GEAR_ECONOMY_SHIELD_PLATE.json)
- [SPEAR_PADDED](GEAR_ECONOMY_SPEAR_PADDED.json)
- [GREATSWORD_CADENCE](GEAR_ECONOMY_GREATSWORD_CADENCE.json)
- [CREDIT_BATCH_1](GEAR_ECONOMY_CREDIT_BATCH_1.json)
- [CREDIT_BATCH_2](GEAR_ECONOMY_CREDIT_BATCH_2.json)
- [CREDIT_BATCH_3](GEAR_ECONOMY_CREDIT_BATCH_3.json)

## Recommendation / next steps

Keep cumulative full-credit pricing and current prices/gates as next candidate; exact positive sequential upgrade requirement. No-credit model misses six-month goal in all five sampled builds. Do not silently adopt 3,500h mastery threshold or quality-skip rule; both require owner decision and additional checks. Normal daily combat-only goal supported across all 15 builds for *ownership*, not mastery. Need difficulty-vs-gear and final counter tests, more seeds, rapid/weekly/mixed variants if desired, per-transaction tests with real UI/engine and final standalone harness/CI verification before implementation. Keep live site untouched.
