# APPRENTICE-A4-04 — mandatory equipment economy and release verification
2026-11-26. Baseline main 4413077e2ca2d26c8fb2cc853f9945ee23840481; draft PR #184. Mandatory auto-equipment unlock at ten earned activity levels, weakest equipped item first; player chooses weapon and armour, no disable switch.

## Method and evidence
Executable `node tools/apprentice-a4-mandatory-economy.mjs`; raw [15 daily builds](APPRENTICE_A4_MANDATORY_DAILY.json) and [15 cadence comparisons](APPRENTICE_A4_MANDATORY_CADENCES.json). Seed 20261126, 180 days each, isolated normal-profile production modules, only timing profile switched; no bypass of mandatory manual-purchase gate. Actual prior offline settlement, manual Master claim once at visit (equivalent pre-purchase order; does not model optional auto-Master consent uptake), initial chosen armour acquisition, manual weakest-first prior to unlock, then actual engine enterGameWithApprentice purchasing path. At most 155 owned-item steps; no forced armour selection. Before/after exact coins and shared smith quote checked, no off-kit purchases, selected loadout and offline arena policy preserved, no eligible affordable purchase left at end of batch. Boundary acceleration follows prior validated auto-fight economy harness; no invented income or alpha stats. All 30 runs completed in connector JS source adapter; native pilot reproduction gate added 0a42231f, PASS, exact JSON reproduction at systems run 45809013724 (unlock day15, 113 auto purchases, full S MW day166). Daily results first computation hit tool-call limit before persistence; identical deterministic rerun saved successfully at 35873a6f. Cadence raw results saved 5d0ec222.

Total 30 trajectories, 1,672,886 settled bouts (bounded schedule batch counts, not independent duel resolutions), 4,476 offline equality checks, 2,822 automatic and 1,399 manual purchases; every wallet and purchase check passed. Includes 4 initial armour choices per full kit where affordable, not all manual transactions are pure upgrade chores.

| Cadence | Builds | Earned level10 unlock day | Auto purchases per build | Final gear | Full S MW day |
|---|---:|---|---|---|---|
| Daily 5 min |15|15|108–113|S Masterwork|166–169|
| Daily 60 min |3|15|105–110|S Masterwork|167–169|
| Weekly 5 min |3|70|53–56|C|Not reached|
| Weekly 30 min |3|70|53–56|C|Not reached|
| Daily mixed 5 min |3|13|100|A|Not reached|
| Daily zero foreground |3|15|69–70|B|Not reached|

Daily 5-minute specialists: 1,664 automatic of 2,385 total transactions (69.77%); 721 manual across 15. Full S set days166–169; income range 4,105,748–4,722,841. Level10 is much earlier than previously proposed 75 and removes most upgrade clicks without changing the tested progression horizon. Three daily zero-foreground profiles remained at NG arena (no fabricated advancement); weakest-first spends evenly so they end with B across five pieces rather than the old manual comparison's mixed ranks. Weekly progression still limited by actual one-level cap and Master claim cadence. No economy retune proposed. One seed per scenario, selected builds for alternative cadences; no population guarantee.

## Browser and native verification
Head d1207f59: 117 native website regressions PASS; systems 45806458496, combat 45806458514, protocol 45806458619 PASS; Chromium 45806458567 failed disabled-button fixture selecting initial armour rather than an owned weapon. Fixed 5526d291; all four checks PASS at 35873a6f (website 45808446557, systems 45808446320, combat 45808446332, protocol 45808446366). Actual automatic A Poor bow purchase for 191,250 coins, 8,750 remaining, untouched greatsword, read-only report/no controls, disabled manual upgrade, repeat login no duplicate; both browser widths. Added simulated storage write failure/recovery and missing Web Locks cases at 0aecaf71 and native economy reproduction at 0a42231f; all four workflows PASS at code head 0a42231f (website 45809013740, systems 45809013724, combat 45809013761, protocol 45809013774); Chromium storage failure/recovery and no-Web-Locks assertions passed at both widths, 117 regressions passed, native pilot exact JSON match. No server-authoritative multi-tab guarantee or true concurrent-tab stress test. Normal profile isolated engine, alpha real browser. Login-only purchases remain at next coordinated entry; ordinary offline, ticks and visibility do not buy. No forced reset.

## Next
Native pilot and browser failure-path checks verified; finish final-head CI and release review, review diff and open PRs, protected merge and verify Pages separately. A4 still draft; no live deployment in this batch. Existing optional Master consent unchanged; future clan automation remains dependent on real shared service.
