# INDIVIDUAL-STATS-001 — six individual attributes

Owner approved on 2026-11-27. Baseline af27cfd6986a70fb46886d9d61f438bf04841906, PR #202 class guide already merged. See [Interlude research](CHARACTER_ATTRIBUTE_RESEARCH_20261127.md).

## Direction
Account holds coins and manages group; no account-wide combat attributes. Existing seven slots already retain separate class progression records; use each slot/specialization as the independently trained build, so duplicate classes are independent and returning to a trained specialization retains its history. New specialization starts at its profile's base. Inactive builds receive no effort. No mana or mana regeneration.

STR physical damage; DEX physical rate/accuracy/evasion/critical/movement; CON HP and physical resistance; INT magic damage/healing; WIT casting rate/magic critical; MEN magical defence and debuff resistance. Attack type determines physical vs magical scaling. Do not make one stat a universal multiplier.

## Practical modularity
One pure character-attributes module owns six-stat metadata, 31 base/growth profiles, progression tuning and effort math. Each initial row totals 100, growth weights total 100%; 100 XP per productive hour and increasing point costs carried from old curve as initial candidates. Equal XP budget does not guarantee equal integer point counts under a nonlinear curve. Weighted accumulated effort retains past training distributions when future weights change. No inheritance hierarchy, event bus, plug-in framework, or one module per stat/class. Next add one pure derived-combat mapping module after reviewing all actual consumers, with named tuning constants and bounded functions; avoid distributing numeric magic across action handlers. Use small existing interfaces, not speculative layers.

## Integration stages
1. Foundation: pure registry and deterministic test coverage, no live changes. Candidate bases and growth values can be tuned independently.
2. Extend existing sparse class records with earned/active six-stat effort. Award only using actual frozen member/class productiveMs, including productive defeat practice; no award during recovery. Never credit newly selected classes for previous elapsed work. Keep duplicate members independent. Activate only at existing online/login boundaries. Migration: inventory existing saves and choose explicit versioned mapping of legacy earned progress without duplicating it across inactive/new classes; preserve paid cursors, coins, equipment, mastery and pending rewards. Legacy account effort may remain internal compatibility ledger; must not influence new combat.
3. Add combat rules v4 and six-stat snapshot validation. Preserve exact v1/v2/v3 golden payouts. Older frozen intervals settle under original rules, switch at existing completed live boundary. Normalize NPC clones and previews to identical v4 input semantics. Centralize physical/magical derived formulas, soft caps and resistance mappings. No new mana, manual abilities, loot/reward/gear price changes. Test monotonicity, boundedness, physical/magic separation, symmetry, freeze and offline/live equivalence.
4. Remove account stats display, show individual six stats and growth in selected fighter panel, show base/growth on final class info, adapt alpha max stats to six-month candidate profiles. Browser tests all classes/mobile/desktop, save compatibility. Existing shared attributes remain only for old settlements.
5. Save and compare max-only class matrix, terrain and mixed-team simulations under new stats; tune through centralized configuration. Do not claim balance until independent holdouts. Alpha merge completed functional increments after CI; unfinished numerical balance not a release blocker.

Foundation numbers are design candidates, not final balancing. No new live formula enabled in stage 1.

## Stage 2 candidate

INDIVIDUAL-STATS-001 stage 2 — stage 1 merged #204 (447a0288), 177 tests and seven workflows passed. Added six-stat earned/active effort to each slot/specialization; award only frozen productive member time; old records migrate once using exact class weapon practice quarter-ms, not shared account ledger. Preserve inactive pending effort, activate selected builds only; alpha floor applies selected profiles. No v4 combat changes yet. Migration retains historical account ledger; no arbitrary duplication of shared stats. Pending CI. Next: v4 derived effects, clone parity and frozen snapshot dispatch, individual UI. Candidate 3700h alpha floor inherited from prior team benchmark; recalculate later.

## Stage 3 candidate

INDIVIDUAL-STATS-001 stage 3 — candidate public arena v4 uses independent STR/DEX/CON/INT/WIT/MEN and class mastery, freezes old account effort (historical compatibility only), preserves old session rule versions until live boundary, clone profiles use same class growth and grade practice, removes account stats panel, shows six selected fighter stats and class base/growth. Named derived stat tuning in stat-combat.mjs. WIT affects magical action recovery, not fixed signature cooldowns. No mana. Shared Fighting progression remains internal reward cap/rank and equipment gate, not a combat attribute. Existing v1-v3 fixture defaults retained. CI pending; numerical balance and six-month benchmark provisional.
