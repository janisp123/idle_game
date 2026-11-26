# APPRENTICE-A4 — automatic equipment research and implementation contract

2026-11-26. Owner approved automatic quality **and** grade progression of selected equipment and stated the long-term goal: automate every repetitive chore; leave strategic decisions to the player. Baseline main 4413077e2ca2d26c8fb2cc853f9945ee23840481 (AUTO-FIGHT-001 deployed). Draft PR #184, branch feature/apprentice-a4. No live changes in this research batch.

## Direction
- Player chooses weapon and each of four armour families (including None). Assistant purchases the next legal quality or grade stage of the currently chosen/equipped gear; never switches weapons or armour, never spends on unused gear, never fills a deliberate None slot. An unowned armour selection still requires a player choice through the current shop. Stop at S Masterwork. Existing prices, activated Fighting gates, expertise and 32 sequential stages remain unchanged.
- Default candidate: lowest nominal equipment stage first; ties stable weapon, head, torso, arms, legs order. If the selected next step is unaffordable, save rather than splurge on later items. Skip terminal items and choose among level-eligible items; when all remaining steps are level-locked, show required Fighting level. Preview and actual purchases use shared smithQuote/nextEquipmentUpgrade; show planned item, current/target stage, actual debit, available coins/progress and blocked reason. No mandatory player-managed per-item allowlist/priority settings. Explicit opt-in/disable remains prudent for spending; no forced reserve proposed (zero reserve for research; optional reserve policy remains open).
- Initially login-only (settle offline first, then existing Master and purchases; no retroactive reward boost), using coordinated saved transaction and bounded at most 155 owned-item transitions (5 × 31). Do not fake purchases after storage failure or advance arena offline. Future live auto-upgrades may be considered separately if needed; no background server claim loops. Existing manual choice and purchases remain.
- Future chores: clan contribution and clan upgrades under actual authority, player-selected contribution strategy/limits and existing daily allowance; never fake shared clan, invent inventory, or make discretionary leadership decisions for player. Rotation/resource management and other chores remain separately designed. This is direction, not blanket authorization for unscoped future systems.

## Method
Executable `node tools/apprentice-a4-economy.mjs`, [raw 12 trajectories](APPRENTICE_A4_ECONOMY.json). Same normal-profile isolated production engine and automatic Fighting policy as AUTO_FIGHT_ECONOMY; seed 20261126; 180 days, daily five-minute foreground sessions, real Master claims and legal sequential shop quotes/debits. Three specialist combinations (greatsword/plate, bow/padded, spear/leather) and greatsword/plate mixed 5 Fighting days/2 mining days; compare weakest stage, weapon-first (then armour), cheapest next legal step. Each policy buys at visits from day 0 (a proxy for the exact same purchases done manually until a candidate unlock, automated thereafter); buying the initial chosen armour is a research fixture representing player intent, not permission to fill None automatically. Count upgrades made at/after each proposed earned-level threshold, using actual activated levels, to estimate avoided purchase clicks. No extra coins or level boosts, no reserve. All 12 trajectories ran in connector JS from fetched production module text with an import/export adapter; native CLI not yet run. Boundary acceleration as previous validated economy harness, not every browser tick. 742,759 settled bouts (bounded offline batch counts, not independent resolved battles), 2,160 offline policy equality checks, 1,848 legal sequential purchases, wallet and debit checks all passed. One seed; not a population estimate.

## Results
| Priority | Specialist full S MW days (3 builds) | Mean specialist earned coins | Mixed earned coins |
|---|---|---:|---:|
| Weakest |166,168,167|4,522,215|2,647,454|
| Weapon-first |166,167,168|4,537,032|2,517,421|
| Cheapest |168,168,169|4,450,298|2,557,932|

All nine specialists completed S MW, all three mixed builds reached A; no economy blocker for weakest policy. Weapon-first earned 0.33% more specialist coins on average in this single seed but less mixed income; weakest keeps upgrades balanced and is understandable, so recommend it. Do not alter reward tables.

| Earned-level threshold | Daily specialist unlock day range | Specialist remaining purchase clicks saved (each) | Mixed unlock day range | Mixed saved (each) |
|---|---|---:|---|---:|
|20|41–42|80 of 159|32|80 of 139|
|30|78–79|60|58|60|
|40|121–124|20|90–94|40|
|50|171–174|0|127–128|20|
|75|Not reached|0|Not reached|0|

**Important:** prior suggested level75 effectively blocks this feature within six months for tested specialists and mixed play. Even level50 arrives after the specialist's last upgrade. Level20 is the earliest tested candidate and removes 80 manual purchases per specialist; investigate an earlier level5/10 unlock if owner wants this chore removed in the first days/weeks. Recommend level20 over 75 if choosing from tested thresholds. Exact unlock remains a decision to confirm rather than silently setting a new gate. Keep existing level50 auto-Master unchanged in this scope.

## Next
A4-02: implement pure deterministic selected-loadout preview/next purchase planner, exhaustive synthetic stage and wallet tests; wire opt-in/unlock and shared coordinated login transaction only after choosing threshold. Include locked/unavailable/maxed/None/mixed armour, switching chosen loadout, exact debit, post-Master Fighting gate, save failure/reload/concurrent login, no purchases on ordinary offline settlement, no retroactive equipment effects, normal and alpha profiles. A4-03 UI and browser test; A4-04 economy parity and final CI/merge/Pages. No code release yet. A5 unified login report later; A6 real clan donations blocked by authoritative accounts/clan server.
