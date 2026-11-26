# The Apprentice — progressive automation implementation plan

**APPRENTICE-PLAN-001 — design and staged implementation, 2026-11-25.** Owner requested the plan, then approved starting implementation. A1 foundation merged 5b996be (PR #177); A2 auto-Master merged 0136237 (PR #178), Pages 45663460990 passed. A4 revised by owner 2026-11-26: automatic quality AND grade progression of chosen gear; see [A4 research plan](mechanics/APPRENTICE_A4_RESEARCH.md). Long-term goal is decision-maker-only gameplay. Other chore implementations remain staged. Scope: make experienced players need less attention, retain all five existing weapon classes, no separate apprentice grind, no paid automation or upkeep. Subsequent batches are scoped separately; do not assume provisional economy or feature thresholds approved.

## 1. Direction and unresolved policy

Owner direction: new players have one active activity and no scheduling; unlock a second slot after 10 combined activity levels, then continue in tens. At combined level 50, unlock automatic activity advancement on login; show the locked option and level requirement before then. Personal Assistant menu introduces an apprentice who learns from the character and takes care of chores. Unlock automatic sequential quality AND next-grade upgrading of currently chosen equipment; current-grade Masterwork still required before buying the next grade. No automatic changes to selected weapon or armour family. Unlock automatic clan donation. Retain existing weapons; do not add weapon classes. No automatic recurring obligations.

Recommended interpretation for approval: earnedLevels = sum over actual SKILL_IDS of (activated level - 1). Starting eleven level-1 skills contribute zero. Full XP alone is not an earned level; only activated levels count. No separate XP counter, login streak, calendar age or spendable points. Unlocks never expire; alpha reset starts a new character. Other resource-consuming features retain their specific consent policies. A4 equipment automation is mandatory at earned level 10, with advance notice and no toggle, per owner correction 2026-11-26.

| Earned levels | Unlock | Status |
| --- | --- | --- |
| 0 | One Forever activity, no queue scheduling | Owner direction |
| 10 | Second slot | Owner threshold |
| 20 | Third slot | extrapolation of Owner rule |
| 30 | Fourth slot | proposed extension beyond current engine capacity |
| 40 | Fifth slot (proposed maximum) | proposed extension |
| 50 | Automatic Skill Master on login | Owner threshold |
| 10 | Automatic equipment quality and grade upgrades | Owner-approved, mandatory; no off switch |
| 100 | Automatic clan contribution on login | proposed threshold, server dependency |
| 125 | Follow clan material priorities | optional later proposal |
| 150 | Repeat configured rotation | optional later proposal |

Validate timing in normal profile for daily, weekly, mixed and combat-only players. No compulsory skill diversity or mandatory clan participation. Initial A1 uses the proposed five-slot maximum and earned level definition; thresholds beyond stated owner numbers, gear transition cost and target quality, donation order and tribute policy need confirmation. Current Master takes 100% of owned outputs of all ready skills; proposed 30% is NOT approved. Do not silently change it.

## 2. Placement and controls

Add top-level foldable Personal Assistant alongside Activities and Clan. Show introduction ("I have watched your battles. Take me as your apprentice; as you teach me, I will take care of more of your chores."), combined earned levels, next unlock, activity slot count, all features with "Unlocks at LvL X", visible disabled locked toggles, and per-unlocked-feature controls. No modal onboarding requirement. Preserve first-entry arena behavior when START-FIGHT-001 is actually released.

| Screen | UI and logical functions |
| --- | --- |
| Personal Assistant > Progress | earnedActivityLevels(state), apprenticeUnlocks(state), nextUnlock(state), queueCapacity(state) |
| Activities | queueCapacity(state) everywhere, locked scheduling slots with thresholds, manual switch always accessible |
| Personal Assistant > Skill Master | autoMasterEnabled, explicit tribute explanation, previewMaster, runAutoMaster; optional per-skill exclusions proposed |
| Equipment / Smith | smithQuote grade/quality eligibility, reason text and required Masterwork; no automatic weapon/armour choice changes |
| Personal Assistant > Equipment | mandatory after 10 earned levels; chosen loadout only, automatic weakest-first priority, preview next upgrade/price, runAutoEquipment; no reserve or off switch |
| Personal Assistant > Clan | autoDonateEnabled, approved materials/quantities and reserve, manual daily allowance, server availability; previewDonation and donateResources shared with manual path |
| Personal Assistant > Report | offline XP/resources/fights, claimed levels, tribute, quality upgrades and actual coin spending, donations, skipped reasons and resumed queue; report values from committed state changes |

Proposed module `site/play/apprentice.mjs` (pure policy/planning and orchestration via existing engine functions), single balance config; no duplicate XP, gear or donation formulas. Save only versioned preferences in validated game state (booleans, known item IDs, safe integer reserve, stable ordering), not trusted derived levels or forged unlocks. Later move state mutations to authoritative service with same rule set. Existing settings missing default OFF. No live clan simulation in public UI.

## 3. Queue and offline semantics

Baseline before A1 `site/play/engine.mjs` had MAX_WAGONS=3, save validation, queueStartActivity/queueInsertTimedActivity, a bounded 10-step settle loop and a final Forever wagon. Change all capacity checks and app enablement together. Keep an absolute tested bound; derive allowed slots from activated levels. Existing valid routes longer than newly allowed capacity must not be silently discarded: propose grandfathering saved route until edited/completed, or communicate an explicit alpha reset if approved. No duplication of activities, negative durations, or reward at capped XP. Re-evaluate settlement loop bound for max slots/transitions, test long offline catch-up and capped/zero-work segments; never per-cycle replay or unbounded rotation.

Login chores must not automatically fill multiple levels retroactively. First settle exactly once at old state and effective bonuses; cap stops rewards as today. Run configured unlocked chores at that settlement boundary, preserve time already lost to cap, then resume existing Forever/queue under new levels. Ordinary ticks do NOT run login-only automation. A2 defines login as page entry, not visibility return, ordinary tick, storage event or browser focus. Repeated page entry cannot claim already-consumed XP. Web Locks serialize cooperating login attempts; observed stale save writes are rejected, but localStorage cannot provide authoritative cross-client transactions. Without Web Locks and working local storage, automated claims stay disabled. Alpha virtual day tests should invoke the same orchestration only when explicitly simulating a login.

## 4. Gear prerequisite and automation

Owner requires higher-grade Poor to be a genuine improvement over previous-grade Masterwork. See [GEAR-RESEARCH-001 numerical study](mechanics/GEAR_PROGRESSION_STUDY.md) for 376,800 source-linked duels and proposed cumulative grade perks. Owner approved the combined candidate and A3 implementation in PR #181; see [combined validation](mechanics/GEAR_COMBINED_VALIDATION.md).

Current smithQuote in `site/play/smith.mjs` accepts higher grades with nondecreasing quality and itemPower, uses cumulative price differences and Fighting-level gates. Engine buyEquipment settles first and auto-equips armour family on purchase. This conflicts with new sequential grade progression.

Proposed rules:
- Track by actual equipment ID (five weapon loadouts, slot:family armour IDs). For a new armour piece, buy Non-grade Poor first; current grade quality can improve. Higher grade requires current grade Masterwork and exactly next grade, normally starts Poor. No skipping multiple grades or purchasing high-grade first armour. S Masterwork terminal. Existing owned higher grades retained under any approved save policy; no forced downgrade.
- A3 implements strict sequential quality steps and full cumulative credit. Auto-quality chooses only existing, selected items in deterministic priority order and advances to highest affordable permitted quality within current grade, or sequentially one step at a time with equivalent cost. Preserve reserve, no zero/negative charges, no new grade, no new equipment, no re-equipping or switching families. Do not use buyEquipment unchanged for unequipped armour (currently auto-equips). Extract shared validated purchase path with explicit equip policy; preserve frozen combat boundaries and prior earned practice.
- Historical research question (resolved for A3: full cumulative credit, existing price table): compare current price differences against nonrefundable quality expenditure and grade base increment; prevent negative prices, rebate/skip exploits and excessively expensive progress. Simulate all 8 grades x 4 qualities x real IDs, Fighting gates, unowned and starter cases; verify wallet conservation and 180-day progression across five weapons and three armoured combinations. Do not rebalance silently.
- Auto upgrade is mandatory once 10 earned levels are reached; no opt-in or disable preference. Quote at settled state; check actual availability and reserve on every purchase; commit once and report exact changes. Use same manual eligibility rules, not a privileged shortcut.

## 5. Login transaction

Recommended order to review (donation-before-Master is a proposal, because current tribute destroys stock):
1. Load/validate saved preferences, capture time once, settle prior offline work using existing enterGame/settle; keep all offline reports.
2. Determine eligible automation from activated levels; take snapshot to prevent cascaded actions from newly reached thresholds within the same login (or explicitly approve immediate unlock behavior).
3. If enabled and real clan server available, preview/execute the configured donation within manual once-daily eligibility and stock/reserve, before tribute; if server unavailable skip honestly, do not fake success or block unrelated chores. Later server should settle authoritative inventory and donation atomically.
4. If unlocked/enabled and ready, perform exact Skill Master offer once, with previously accepted tribute policy, no fresh confirmation popup for consented routine. No partial levels, no negative resources, no extrapolation through lost capped time. Report what was surrendered, including zero. If policy changes, require fresh opt-in; possible selected-skill protection needs design.
5. Apply mandatory unlocked sequential quality and grade upgrades to chosen/equipped gear only, with deterministic budget, after Master. Use post-Master fighting level and actual inventory, preserve combat snapshots; report exact debits.
6. Resume existing queue; optional future rotation/priority rules never override manual changes unexpectedly. A2 commits the resulting local state before showing an exact transient claim report; A5 will add the bounded persistent latest-login report. Later save authoritative resulting state and report together; avoid double application across refreshes/tabs/retries. Read-only renders and visibility/storage callbacks must not duplicate chores. For browser alpha, re-read latest state, serialise via available cross-tab coordination and verify persistence before success; real server uses idempotency/transaction and server clock. No private save upload to CI.

Manual actions always remain possible, no offline automatic Master loop, no resource generation at cap, no daily allowance banking or offline donation accrual. Automatic donations are online login chores, not server running donations while absent. If manual contribution already used day allowance, auto skips. No clan leave/rejoin bypass or ability to withdraw donated materials. Server authority and actual clan feature remain blockers.

## 6. Implementation batches (approval required)

| Batch | Changes | Acceptance |
| --- | --- | --- |
| A0 | Resolve policies and benchmark normal timing; approve earned-level interpretation and unlock thresholds | Daily/weekly/mixed trajectories, identify first-week friction, 30/90/180-day progression; no new mandatory grind |
| A1 | Pure unlock helper, preferences validation, Personal Assistant menu, dynamic queue capacity and gate | 0/9/10/19/20/49/50 boundaries; 1..max slots, valid old save, no duplicate or capped rewards; mobile and desktop; all controls locked correctly |
| A2 | Shared manual Master transaction and login-only auto-Master | Opt-in, current exact tribute, one level per ready activity, no negative stock, refresh/visibility/tabs, save failure, no retroactive progress, accurate report |
| A3 | Sequential equipment grade eligibility and price audit (manual first) | All quality/grade transitions and costs, no skips, existing gear policy, Fighting gates, all five weapons unchanged; 180-day measured economy |
| A4 | Apprentice automatic equipment progression | Chosen loadout only; sequential quality and grade purchases, deterministic saving priority, existing gates, no equip changes, duplicate login/retry and failure tests |
| A5 | Login report and QoL polish | Offline report plus committed chores/skip reasons; no forced tutorial, clutter, fake success or player data exposure |
| A6 | Clan donation adapter/test fixtures | Extend existing synthetic clan lab; real execution gated on authoritative accounts, inventory, daily cap and warehouse transactions |
| A7 | Optional rotation/resource-priority automation | Define starvation/input handling, capped all activities, no infinite loops, manual override, server priority changes; separate approval |

A1–A5 can be developed before renting hosting; A6 fixture development possible now, real clan donations require server. A7 deliberately deferred until queue and login behavior are tested. No new weapon classes, prestige, fuel, mandatory upkeep, time-limited unlocks or monetization.

## 7. Verification and dependencies

Read latest main before implementation. PR #175 compact UI and auto-first-entry combat passed final website/system/protocol checks and merged 29d7bee; A1 is based on that merge. Verify Pages separately. Current engine is V16 alpha; source audit used main 152c54e. No actual simulation run in this design task. Use existing tools/system-lab and production-backed simulation, add dedicated apprentice tests and browser smoke at 390/1440. Report actual normal-profile unlock times, logins saved, coins/tribute spent and progression impact; compare fixed seeds with baseline, never claim human enjoyment from simulations. After each independently approved batch, verify final-head CI, main and Pages; update backlog, decisions and checkpoint. The goal is fewer interventions, not faster forced leveling.
