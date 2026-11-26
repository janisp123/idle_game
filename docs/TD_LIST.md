# Active project tasks

Current work is identified by the task ID and changelog entry on its remote branch or draft PR. Use the checkpoint for verified releases.

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## TEAM-001 — Two-gladiator combat team

- **Goal:** Two player gladiators from first entry, shared base attributes, separate selected equipment and expertise, automatic upgrades, real deterministic 2v2 combat; no pets or tactics now.
- **Acceptance:** Independent selection/progression and exact treasury; meaningful matchup balance; six-month team economy; frozen offline/live/simulator parity; exact team rewards and report; validated save, mobile/desktop UI, final checks and deployment.
- **Status:** PARTIAL — [PR #188](https://github.com/janisp123/idle_game/pull/188); pure foundation and 67 source-adapter checks complete, native CI pending. [Plan and evidence](mechanics/TEAM_IMPLEMENTATION_PLAN.md). No playable integration.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## APPRENTICE-A5 — Full-screen analytical login report

- **Goal:** On returning entry, show an unmistakable full-screen report of actual offline progress and committed automation. Dismiss manually or after ten real seconds; reopen for review in same session.
- **Acceptance:** Exact aggregate encounter/win/loss and coin ledger, XP and level changes, resource gained/used/tribute, attributes and expertise, grouped actual upgrade stages and costs, capped/route status, no fabricated reward or success on failed save; full mobile/desktop modal and timer verification. No changes to mechanics.
- **Status:** DONE — [PR #185](https://github.com/janisp123/idle_game/pull/185) merged e8d6dbd0; final four checks PASS, Pages 45812960184 SUCCESS.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## APPRENTICE-A4 — Automatic equipped equipment progression

- **Goal:** Once unlocked at ten earned activity levels, assistant handles quality and grade upgrades for selected weapon and equipped armour, never changes loadout. Show planned upgrade and cost/progress; player decides strategy, not individual purchase clicks.
- **Acceptance:** Mandatory at 10 earned activity levels (no toggle), weakest-first, shared exact smith quote and sequential grade gates, deterministic bounded purchase loop, no off-loadout purchases/forced armour, settle offline first, safe save/reload, committed report, UI and economy regressions. Clan donations separately server-gated.
- **Status:** DONE — [PR #184](https://github.com/janisp123/idle_game/pull/184) merged 9cdc3364; final CI 45810515851/45810515837/45810515788/45810515860 PASS, Pages 45810631099 SUCCESS. [Validation](mechanics/APPRENTICE_A4_MANDATORY_VALIDATION.md).
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #184).

## AUTO-FIGHT-001 — Automatic Fighting difficulty progression

- **Goal:** Automatically climb and retreat through eight existing arena grades; no active combat controls or manual Fighting difficulty selection. Offline remains fixed at the committed stage.
- **Acceptance:** Tested 3/1/10 policy, saved stage/streak/history, committed live bout boundary, frozen offline payout, cap/queue/save parity, mobile/desktop progression readout, six-month economy validation, final CI and Pages.
- **Status:** DONE — [PR #183](https://github.com/janisp123/idle_game/pull/183) merged 4413077e; final CI 45800661391/45800661359/45800661411/45800661340 PASS, Pages 45800800431 SUCCESS. [Economy evidence](mechanics/AUTO_FIGHT_ECONOMY.md).
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #183).

## APPRENTICE-A3 — Sequential equipment progression and tested combat balance

- **Goal:** Implement the owner-approved combined research candidate from PR #179; 32 stages, cumulative expertise, perks, durability, NPC and tactical balance.
- **Acceptance:** Legal next-stage purchase only, positive full-credit debits, Fighting gates, actual shared effects, safe snapshots and stat sources, production simulator parity, complete CI and browser verification. Preserve open arena access, S mastery 4000h and five weapon classes; no auto-purchases yet.
- **Status:** DONE — PR #181 merged db64da33, final four workflows passed, Pages 45762976976 passed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #181).


## APPRENTICE-A2 — Automatic Skill Master on login

- **Goal:** At 50 earned activity levels, permit optional automatic Master claims on game entry.
- **Acceptance:** Explicit versioned consent; shared exact manual tribute and one claim per ready skill, settle first with no retroactive gains, locked UI below threshold, report after saved commit, reload/visibility/stale-save tests, no other automation.
- **Status:** DONE — PR #178 merged 0136237; website 45663329577, systems 45663329342, combat 45663329312, protocol 45663329349 and Pages 45663460990 passed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #178).

## APPRENTICE-A1 — Earned scheduling and Personal Assistant

- **Goal:** One starting slot; unlock a new slot each ten earned activity levels up to five. Personal Assistant menu shows progress and future chores.
- **Acceptance:** Activated levels only, both queue add operations enforce derived capacity; preserve valid existing routes; five-slot bounded settlement, browser menu and locked future automation, regression tests. No auto-spending.
- **Status:** DONE — PR #177 merged 5b996be; website 45662042280, systems 45662042373, combat 45662042289 and protocol 45662042247 passed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #177).

## START-FIGHT-001 — Automatic first-entry arena

- **Goal:** Fresh character immediately begins Fighting with starter equipment and lowest difficulty.
- **Acceptance:** One Fighting Forever route, no initial menu/preparation gate; offline continuation under current XP cap; existing saves untouched, explicit alpha reset same start; real mobile/desktop fresh-entry regression.
- **Status:** DONE — PR #175 merged 29d7bee; website 45660928790, systems 45660928724 and protocol 45660928741 passed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## UI-COMPACT-001 — Compact skill and resources panels

- **Goal:** Combine Skill Progress and Skill Master; fold Resources by default.
- **Acceptance:** XP and Master controls in one panel; native collapsible Resources retains exact inventory and updates; browser/mobile checks; no mechanics/save changes.
- **Status:** DONE — PR #175 merged 29d7bee; website 45660928790, systems 45660928724 and protocol 45660928741 passed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet.

## CLAN-TEST-001 — Developer-only fake clan members

- **Goal:** Generate synthetic players and clans to test membership, roles, cooldown, contributions and warehouse accounting before hosting.
- **Acceptance:** Repeatable scenarios with explicit test policy, actual item IDs, synthetic test IDs, 100-member/30-day test, negative-path tests; integrated into developer lab and CI; no live player data, public admin tool or production rule changes.
- **Status:** DONE — PR #174 merged 152c54e; systems 45638587639 and protocol 45638587580 passed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #174).

## CLAN-PLAN-001 — Pre-server clan development and implementation handoff

- **Goal:** Prepare useful design and implementation specifications before the Owner rents a server; clearly map features to screens, functions and data ownership.
- **Acceptance:** [CLAN_IMPLEMENTATION_PLAN.md](CLAN_IMPLEMENTATION_PLAN.md) records the source-backed resource map, proposed domain/API contracts, ordered offline design/testing and later deployment gates, unresolved decisions and security boundaries. Documentation only, no hosting commitment or gameplay change.
- **Status:** DONE — PR #171 merged dcc76b6; protocol 45632295716 and systems 45632295464 passed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #171, documentation only).

## CLAN-001 — Clan entry, membership and shared development

- **Goal:** Separate Clan category with current clan, search and creation; enforce durable membership, leadership, donation and warehouse rules in [CLAN_DESIGN.md](CLAN_DESIGN.md).
- **Acceptance:** Current alpha shows truthful availability; online implementation must authenticate identity, validate seven-day founding and rejoin eligibility, enforce one leader/one vice/five generals/fifteen officers, transactional daily contributions and building-only warehouse spending, no player withdrawals, real search and multi-account tests.
- **Status:** PARTIAL/BLOCKED — [PR #170](https://github.com/janisp123/idle_game/pull/170) adds alpha navigation and design contract; real shared functionality requires owner-approved account/server architecture, permission and economy decisions. PR #170 merged cd4e93d; Pages 45631544350 passed. Server-independent design, pure rules, fixtures, simulations, UI and local service testing can proceed in approved batches; see [implementation roadmap](CLAN_IMPLEMENTATION_PLAN.md).
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** Not yet (shared multiplayer).
- **Dependencies:** CHAR-001, server authority, authentication, persistence and tested economy; no browser-local simulated clan presented as real.

## UI-CATEGORY-001 — Shared Combat menu

- **Goal:** Put Fighting and Training in the same activity category.
- **Acceptance:** Combat lists both distinct activities; Survival Work retains nine activities; no engine, progression or save changes. UI regression and browser checks pass.
- **Status:** DONE — PR #169 merged `5dab306`; final website 45627081574, systems 45627081668, protocol 45627081603 and Pages 45627186530 passed.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #169).

## CAP-001 — Reward stop at skill XP cap and evergreen public overview

- **Goal:** Pause all rewards at one full skill XP bar, auto-advance queued activities, keep explicit Master claims; generic public overview.
- **Acceptance:** XP, loot, crafting, coins, attributes and expertise stop at the first cap; no phantom rewards during pauses/travel; timed and until-level-up wagons skip capped skills; no resource-proof deadlock; current V16 saves retained; bounded offline settlement and UI/browser checks. Rebenchmark economy, no silent numerical retuning. Preserve artwork and permanent FREE-001.
- **Status:** DONE — PR #167 merged `427a8cc`; final four workflows and Pages 45625750762 passed. [Audit](mechanics/CAP_001_AUDIT.md).
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #167).

## BAL-002 — Physical weapon counters, armour tradeoffs and terrain

- **Goal:** Implement owner-approved physical counter system with distinct weapon/armour strengths and arena specialization.
- **Acceptance:** Every weapon has meaningful favourable/unfavourable matchups; intended home/away effects; no universal build; strong gear grade separation; test all 15 armoured combinations and normal progression against six-month target. Typical counters 60–70% proposed, not guaranteed. Preserve prices/XP/expertise; no scripted wins, class locks, or artificial unarmoured bonuses. Verify frozen-outcome save compatibility and communicate any necessary alpha reset before deployment.
- **Status:** DONE — PR #165 merged `634b56c`, final four workflows passed, Pages 45619113871 succeeded. [Verification report](mechanics/BAL_002_VERIFICATION.md); V16 alpha reset, remaining tuning provisional.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #165).

## BAL-AUDIT-001 — Playability, weapon counters, armour and terrain

- **Goal:** Audit the current production-linked combat and progression; identify tactical strengths and weaknesses.
- **Acceptance:** Full current-source audit, paired weapon and armour matrices, terrain contrasts, progression trajectories and evidence. No gameplay or save changes.
- **Status:** DONE — audit evidence from PR #164 head `d3be32b`, systems run 45614599116 passed; [report](mechanics/BALANCE_COUNTERS_AUDIT_20261125.md). Playable alpha, tactical balance not yet satisfactory. Further tuning requires Owner approval.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (audit only).

## SITE-004 — Gladiator artwork and gameplay-first public presentation

- **Goal:** Integrate the exact generated gladiator art and foreground actual gameplay/progression while retaining the permanent free-game policy.
- **Acceptance:** Artwork byte parity, matching README and landing priorities, accurate previous status, static and real-browser checks at 390/1440px, verified Pages. No game or save changes.
- **Status:** DONE — [PR #162](https://github.com/janisp123/idle_game/pull/162) merged `c7f2b8c`; final website, systems and protocol checks passed; [Pages 45608310757](https://github.com/janisp123/idle_game/actions/runs/45608310757) succeeded.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #162).

## FREE-001 — Permanent free-game commitment

- **Goal:** Publish the owner-approved A Hobby, Not a Business statement on landing page and README, and establish permanent zero monetization in the project decision and agent rules.
- **Acceptance:** Identical approved wording, no ads or financial contribution options, clear hobby risks, no game/save/license changes, static and actual mobile/desktop checks, Pages verification.
- **Status:** DONE — PR #161 merged `4f752fc`, final website/protocol/systems checks passed, Pages 45595434419 succeeded and public text verified.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #161).

## SITE-003 — Current alpha website and repository overview

- **Goal:** Refresh the public landing page, README and stale current-status documentation without changing game mechanics or saves.
- **Acceptance:** Current feature descriptions, clear alpha warning, original artwork and Play Now preserved; static checks and actual 390/1440px browser checks; verify Pages separately after merge.
- **Status:** DONE — PR #160 merged `ce46729`; final website, protocol and systems checks passed; Pages 45593799089 succeeded.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #160).

## SIM-003 — Production parity and automatic simulation triggers

- **Goal:** Keep simulation tools synchronized with actual gameplay source and run relevant simulation checks automatically.
- **Acceptance:** Actual game snapshot and settled payout/event parity, novice/trained distinction, source path coverage, optional full balance, no site or save changes.
- **Status:** DONE — PR #159 merged 67f62e0; no site changes. Independent final-head CI run listing unavailable during SITE-003; full audit remains separate.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #159).

## CHAR-STATS-002 — Compact character power and activity overview

- **Goal:** Simplify the existing stat sheet into compact expandable actual equipment/attribute/activity modifiers; retain source breakdowns and open state on equipment changes.
- **Acceptance:** Real same-move grade/quality attack power, accuracy/dodge modifiers, material, mobility and conditional defense, all eleven activities with actual direct gear effect, level and difficulty factors. Distinguish crafting, recovery and conditional results; no save or balance change. Actual mobile/desktop browser tests.
- **Status:** DONE — PR #158 merged 3002fb1, Pages 45589039287 succeeded.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #158).

## CHAR-STATS-001 — Transparent live character statistics

- **Goal:** Independent collapsible character statistics panel, selected gear changes update the open sheet immediately; show total and source bonuses/penalties from real resolver, no fictitious DPS.
- **Acceptance:** Attributes, damage by actual move, HP, weight, mobility, dodge, material protection, resistance, guard, accuracy, penetration, initiative, block/parry, condition and ammo. Distinguish selected intact next-bout build from ongoing bout, opponent/terrain and breakage. Preserve V15 saves and combat balance; actual browser tests.
- **Status:** DONE — PR #157 merged ca689467, Pages 45585083404 succeeded.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #157).

## ALPHA-GEAR-001 — Six-month build progression, gear economy and expertise

**Owner-approved direction (2026-11-25).** Implemented in [PR #154](https://github.com/janisp123/idle_game/pull/154); retain the following approved scope as historical acceptance evidence. This newer scope supersedes conflicting gear/fight difficulty requirements in the historical GLAD roadmap. Six months of sustained play should develop **one** endgame build (one weapon style and one armour family), not universal mastery. Do not hard-lock arena opponents; do gate purchases by Fighting level and coins. Exact tuning is provisional until measured.

### A — Source-backed benchmark and economy design
- Inspect the production progression, difficulty, shop, combat and offline modules. Use the existing developer-only combat simulator and systems lab; never copy their mechanics into an independent gameplay implementation.
- Report fresh, 30, 90, 150 and 180-day trajectories: STR/DEX/END, activated Fighting level, expertise, time actually fighting, win/loss/double-death rates, cumulative coins earned/spent, current equipment and affordability. Include a predominantly Fighting single-build player, mixed survival-work player, weekly returner, and earliest legitimate rapid-Master-claim / low-tier-farming strategy. State assumed play hours, claim cadence and productive downtime. Normal timing is the long-term balance basis; separately report actual accelerated alpha behavior. Do not claim illustrative formulas are simulated outcomes or make daily login mandatory.
- Current source baseline: 100 total attribute XP/productive hour, 35/35/30 Fighting split, starting stat 10, increasing point costs, one stat point per activated activity level; Fighting skill XP capped at one bar until an explicit Master claim. Normal work cycle is 20 min versus current alpha 10 sec; arena bouts presently 200 sec. A no-downtime normal-profile estimate at one daily Master claim is Fighting level 46 with STR/DEX/END about 137/137/126 at day 150, and level 52 with 150/150/138 at day 180; validate these assumptions and report realistic variation, not a guaranteed cap.
- Centralize purchase thresholds, cumulative upgrade costs, quality multipliers and payouts. F/E/D/C/B/A/S equipment requires sufficient **activated Fighting level plus coins**. Show price, level requirement and lock reason; enforce in engine, not only UI. No expertise purchase/equip lock once the global Fighting requirement is met. A qualified archer may buy/equip an S greatsword but lacks its mastery. No forced intermediate purchases or payment twice for the same cumulative upgrade.
- Tune prices, income, thresholds and actual win rates together: even efficient legitimate players must not afford S-grade gear in their first month of normal progression. Target a fully S-grade Masterwork one-weapon, four-piece same-family build around six months of sustained play, with reasonable intermediate upgrades; no calendar-based account-age gate, daily-login punishment or real-money shortcut. Show earliest single S item and complete set separately. Test low-tier farming and rapid claims; do not simply price from unlimited theoretical winnings at 100% win rate. Provisional grade purchase targets: F first week, E second week, D month 1, C month 2, B month 3, A month 4, S month 5–6. Revise numerical thresholds after measuring the model.
- Gear damage/protection must scale with character stats using a combination of flat contributions and proportional multipliers. Add modest type-appropriate secondary bonuses (e.g. weapon accuracy/penetration/handling; armour mobility/encumbrance/guard/dodge). Do not grant all bonuses indiscriminately or introduce unused stamina systems. Ensure broken pieces cease providing their relevant bonuses; Masterwork remains unbreakable. Grade is the dominant equipment tier, quality improves within it; preserve real tactical counters among comparable builds. Verify S vs Non-grade overwhelming superiority at equal stats/appropriate expertise even at long-term stats, and that low stats or mismatched gear generally fail at high difficulty without scripted defeats.
- Fighting opponents at **every grade selectable from day one**, even S. Remove existing Fighting difficulty-level gate in UI, engine and save validation; preserve separately approved noncombat activity difficulty requirements. Gear purchase lock is independent of enemy difficulty selection. No artificially forced defeat: outcomes derive from combat.

### B — Equipment expertise (independent persistent progression)
- Five weapon expertise tracks: Bow, Spear, Sword & Shield, Greatsword, War Hammer. Four armour tracks: Unarmoured (None), Padded, Leather, Plate. No permanent class lock. Expertise is retained when switching; not interchangeable between weapon styles or armour families. No added global character level or extra Skill Master visit for expertise.
- Award expertise automatically from productive Fighting time actually spent using the frozen equipped style and armour; exclude travel, preparation, resurrection and noncombat work. Weapon and armour progress simultaneously; one full weapon budget and one full armour budget per productive hour. Divide armour XP by four worn slots (including None); one full homogeneous armour set gets 100%, two pieces of each family get 50% each. Never grant full XP to multiple armour families. Bow dagger fallback does not create a sixth track or double awards. Losses can train expertise for actual productive combat time, but no XP from idle waiting or manufactured restart loops.
- Separate general Fighting purchase access from expertise effectiveness. New expertise can handle starter equipment but cannot use high-grade gear as efficiently as a specialist. Use a smooth, bounded grade-dependent proficiency curve; higher grades demand more relevant expertise for full effectiveness. Show current expertise, next threshold and actual penalties in the equipment UI. The previously illustrated 40–100% effectiveness is a provisional starting point, not a fixed or universal multiplier. Avoid multiplying unrelated base stats or applying armour penalties twice. Weapon expertise affects handling/effective damage/accuracy/defence as supported by real resolver; armour expertise affects protection and mobility/encumbrance/dodge as appropriate. Unarmoured expertise must not invent armour protection. Preserve gear durability properties irrespective of expertise.
- Target about 180 days of sustained productive use for S-grade mastery of a single weapon and a single full armour family; tune in productive hours, not account age. Intermediate proficiency targets can follow the grade timeline above; higher proficiency never makes a piece worse. Switching a mastered bow/plate veteran to an untrained greatsword retains attributes and Fighting level, and plate expertise if plate stays equipped; greatsword effectiveness is reduced until trained. A player can eventually master all weapons (roughly 30 months of comparable total focused Fighting if trained sequentially) with armour progress occurring in parallel. These are design targets, not time locks or a claim that the final build is mechanically verified.
- Respect OFF-001: snapshot effective expertise together with attributes/gear/skill for an absence. Earn unlimited bounded arithmetic expertise XP while offline, apply effective expertise only on return; never retroactively improve absent fights. Automatic expertise advancement is separate from MASTER-001 activity-level claims. Validate save shape/ranges, frozen attribution, exact-once settlement, mixed slots, transitions, reload/split intervals, no duplicate XP from changing gear or difficulty; preserve indefinite offline processing. Alpha test saves may reset only if necessary and clearly disclosed.
- Alpha controls: Max Stats should reproduce the documented six-month representative build benchmark (including appropriate Fighting level and selected weapon/armour expertise; do not silently max every expertise track), plus explicitly labeled +100,000 arena coins. Keep these visibly testing-only, no hidden admin/backdoor, no production availability; document release removal/gating. Do not pretend these shortcuts are earned progression.

### C — Motivational combat outcome feedback
- Add Impressive Victory and Humiliation result art/labels alongside ordinary Victory/Defeat, purely presentation. Determine dominance from actual resolved fight (winner's remaining HP fraction, damage received and decisive outcome; optional duration/condition evidence). Use symmetric criteria for both sides, grounded in simulation; no fake scenes, no special category for double death, no reward, XP, expertise, penalty or coin change. Do not reclassify the underlying payout result. Art already generated in the discussion: integrate the two owner-approved original illustrations only if actual assets are available; otherwise record missing asset blocker, never substitute unrelated art or claim integration. Optimize matching local WebP assets and verify mobile.

### Implementation and acceptance
- First produce the benchmark and publish evidence; then implement coherent slices: (1) grade/price/stat scaling and open arena difficulty with economy tests, (2) expertise persistence, effective combat and UI/alpha tools, (3) outcome visuals and final combined validation. Coordinate existing #154, avoid duplicate work or needless micro-PRs; use a fresh dependent PR when a slice is independently ready, keep the handoff accurate. Numeric balance choices must be inspectable and documented as provisional.
- Seeded production duels across fresh/mid/late stats, all five styles, representative armour/terrain and grades; compare high-stat poor gear, low-stat premium gear, comparable grade, S vs Non-grade, and veteran-versus-novice same-grade expertise at fixed stats. Include full economy trajectories and exploit tests, mixed armour allocation, all-day/week/20-year offline parity, current-build saves, no award on visual reclassification, real UI lock reason and mobile/desktop smoke. Run focused tests after a coherent slice, full required CI on final head; do not rerun identical suites unnecessarily. Update mechanic handbook in each gameplay PR and verify Pages after merge.
- **Status:** DONE — merged and deployed gameplay scope in PR #154; A0 verified baseline archived; A1 challenge access/coin prices/purchase gates implemented provisionally, code head fbc3b1d passed all four CI runs; measured normal daily S Masterwork set day 168. A2 physical scaling/opponents implemented provisionally, code head 7774d93 passed all four checks; normal daily S Masterwork day 170, S vs Non-grade all 6,000 sampled wins. A3 expertise implemented provisionally, code head ff17713 passed all four checks; normal daily both selected tracks mastered within 180d, S Masterwork day 170. A4 alpha controls implemented and verified at f66cb2a (all four CI passed; 104 game/UI and 13 systems tests; normal-profile refusal and unchanged representative progression). A5 verdict labels/classifier verified at 7f12888 (all four workflows, 107 game/UI and 13 systems tests; 8,000 extra duels and unchanged trajectory); exact approved WebP upload/activation remains blocked by binary-transfer capability. A6 combined audit verified at c4bfee9 (all four workflows, 191,520 additional duels, multi-build/rapid trajectories); found significant style/material imbalance and state issues. A7 engine corrections verified at 81d0c5c (109 game/UI and 13 systems tests, all four workflows); immutable bout, next-boundary activation, saved Fighting remainder, normal daily S MW day 170 and first-month rush still blocked. A8 physical tuning verified at 265c7a8 (111 game/UI, 13 systems tests, all four workflows, 214,320 audit duels; seven tested normal daily strategies full S MW days 168–172; strong grade/expertise separation retained). A9 release prep verified at 2852c5f (all four workflows, 111 game/UI, 13 systems and actual Chrome at 390/1440px). Owner explicitly approved release with existing fallback art; original custom artwork deferred to ALPHA-ART-001 below. Final head 76b7203 passed all four workflows; merge d13f8b2 verified on main; Pages run 45570157207 succeeded. Residual balance tradeoffs documented; original custom artwork remains separate ALPHA-ART-001. Independent public HTTP fetch unavailable; Owner device QA recommended.
- **Dependencies:** GLAD-005, SIM-001, SIM-002, OFF-001, MASTER-001, ALPHA-FOCUS-001, SITE-001.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-25).
- **Implemented by:** chat (PR #154, merge d13f8b2, Pages 45570157207).

## ALPHA-ART-001 — Approved combat verdict illustrations

- **Goal:** Integrate the two exact owner-approved Impressive Victory and Humiliation WebPs, without changing combat, rewards, or saves.
- **Acceptance:** Use the paths, SHA-256 values and activation steps in [OUTCOME_ART_HANDOFF.md](mechanics/OUTCOME_ART_HANDOFF.md). Upload exact WebP bytes; verify checksums, enable registry and update cache revisions. Run existing art tests, real Chrome at 390/1440px, full relevant final-head checks and Pages verification. Do not regenerate or substitute images. Keep existing fallback until integration is verified.
- **Status:** DONE — PR #156 merged ff063078, exact image hashes and browser checks passed; Pages 45575028297 succeeded.
- **Dependencies:** ALPHA-GEAR-001.
- **Added by:** chat.
- **Requested by:** Owner.
- **Implemented by:** chat (PR #156).

## GLADIATOR REWORK — owner-directed Codex implementation sequence (2026-11-24)

**GLAD-001 through GLAD-005 are complete. Await Owner selection of a new scope.** This section is the implementation handoff for the owner's agreed redesign of **The Long Vigil** into a grounded, automatic **gladiator fighting game supported by survival work**. GLAD-PLAN-001 recorded the roadmap. GLAD-001 through GLAD-005 shipped through PRs #144, #146, #148, #150, and #152. The owner will ask Codex to implement it. Once asked, Codex should execute **only the first unfinished GLAD batch**, not all five at once, then resume the next task by reading remote main `docs/TD_LIST.md` and the pushed checkpoint. Follow HANDOFF-001; record STARTED on a fresh branch before coding, use a draft PR, verify and merge each batch before starting the dependent next batch if its final-head gates are satisfied.

**Precedence:** This is the newer target design and supersedes contradictory *future* plans in GAME-006/011/012/013, old combat/armour/enchants brainstorming, and obsolete snapshots. Their references to five stats, 41 activities, 11 individual armour pieces, mage staff/robe, dual swords, enchant +N, Glory Scrolls, six dice-based half-turns, or old save-migration promises describe **current/historical alpha**, not the target. Keep historical implemented evidence intact. If any conflict arises, honour current owner decisions, including ALPHA-FOCUS-001, COMBAT-SIMPLE-001, OFF-001, MASTER-001, QUEUE-002 and SITE-001, except where the owner explicitly replaces the old mechanism below. Do not implement unapproved clan or multiplayer features.

**Player-facing design contract (agreed direction, no implied numerical balance):**
- **Attributes:** exactly STR (strength), DEX (dexterity), END (endurance). Remove INT and WIL, their UI, progression weights, old mage/robe gates and orphaned tests. All three grow through productive work and Master level claims; **Training** earns all three (initial agreed split STR 35%, DEX 35%, END 30%) but no material items. Each activity's stat weights sum to 100, and total stat XP/hour is not artificially higher for training.
- **Exactly 11 core activities:** Fighting; Hunting; Fishing; Foraging (formerly Gathering); Woodcutting; Mining; Smithing (includes smelting); Construction (includes carpentry/masonry); Cooking; Farming; Training. Cut the former ten stand-alone outlaw activities, ten leisure activities and redundant research/training activities. Raids may be FUTURE separate game events, not ten replacement skills. No magic, alchemy, lore-reading or social leisure stat farms.
- **Survival/long-term construction resources:** timber; stone; iron (mined as ore, processed at smith); mortar (from mined limestone and fuel via construction); food/rations (hunting/fishing/farming/foraging then cooking); hides/leather; straw (farming). These are **conceptual donation groups**, not an obligation to add redundant inventory item IDs. Farming should provide grain plus straw; hunting meat/hides; Fishing fish; Foraging useful plants; Woodcutting timber/fuel; Mining stone/ores/limestone; Smithing iron and equipment work; Construction structural processing; Cooking useful rations. All recipe output must consume actual inputs; do not invent materials or duplicate items. Food has a purpose, but **NO hunger/login/upkeep meter**. Future clan castles may use pooled donations for barracks, walls, palisades, forge, watchtowers, storehouse and garrison supply. **Do not build clans, clan accounts, donations, raids or player trading in this rework.**
- **Five primary weapon styles only:** Bow, Spear, Sword & Shield (**one-handed arming sword plus medium heater shield**), Greatsword, War Hammer. No mage staff, crossbow, dual swords or primary dagger style. Bow has **finite arrows per battle** and switches **automatically to a dagger** after ammunition runs out; no free replenishment *during* a battle. Five styles must each have useful matchups and liabilities. No permanent player class lock.
- **Armour:** four meaningful equip slots **Head, Torso, Arms (both arms together), Legs (both legs together)**; each takes None, Padded, Leather or Plate. No individual left/right gloves/boots/shoulders. The shield is weapon-style gear, **not** a fifth armour slot. Armour coverage, encumbrance and movement must matter, without absurd plate-mobility penalties.
- **Two independent equipment dimensions:** item **grade** (Non-grade, F, E, D, C, B, A, S) and craftsmanship **quality** (Poor, Common, Fine, Masterwork). Grades for enemies/activity difficulty already exist; item grade is an equipment characteristic and should not automatically equal opponent grade. Do not replace named qualities with +1/+2 text. Make **both** grade and quality consequential against correspondingly stronger enemies, without assuming arbitrary unbounded +N scaling.
- **Equipment condition:** weapons, shields and each armour piece have equipment HP during a battle. A non-Masterwork piece reaching zero becomes broken/nonfunctional **for that fight**, causing a major practical disadvantage; Masterwork **cannot break**. A broken shield stops effective blocking, broken weapon loses effectiveness, broken armour loses protection. Masterwork still permits injury to its wearer. For the first playable rework, condition is **per-bout** with automatic between-bout arena maintenance (no additional manual repair chore or permanent loss of owned gear). Longer-term repair fees/persistent wear are NOT approved; record them as an optional later discussion. Avoid a save migration or a never-ending unattended repair UI.
- **Physical injury:** slashing, piercing, blunt. Real impact and protection matter: cuts/punctures can bleed if sufficiently effective, blunt impacts can stagger even through guard, vitals are a rare critical outcome for penetrating or decisive hits; arm wounds aren't categorically harmless. **No body-part hit-location simulation, extra anatomy stats or independent dice roll per status.** Shield Bash is an offensive **blunt** attack with low raw damage, possible stagger/opening after blocks, and costs/risks of its own. A hammer is the strong guard/plate threat; a spear controls reach; a bow skirmishes; a greatsword is strong direct offense and parry; Sword & Shield is a protected counterattacker.
- **Abstract tactics, no grid:** small distance/range states (e.g. Far / Reach / Close) and generic visibility, cover, pursuit, reach control, swing clearance, retreat room. No 20×20 map, per-tile pathfinding, infinite flee loop or hard-coded weapon-versus-weapon percentage bonus. Retreating to shoot is legitimate tactics, not an automatic penalty; passive fleeing with zero damaging offence cannot win.
- **Five arena environments:** Open Field (bow generally favoured), Narrow Bridge (spear reach), Ruined Streets (shielded approach), Walled Courtyard (greatsword room with bounded retreat), Gatehouse Chamber (potential short-hafted hammer advantage). These are natural **conditional** counters, not automatic wins. Use shared environment descriptors rather than a special damage bonus keyed to a weapon. The chamber/hammer advantage is provisional and must survive testing.
- **Dice rework:** preserve recognizable **three six-sided skull dice** (6-6-6 remains possible) but stop using the 3d6 scores to add direct hit/defence/attribute bonuses per exchange. Before a duel, both fighters roll 3d6; the higher result has a **meaningfully higher probability**, not a guarantee, of fighting in an environment that favours their style. The environment is then fixed for that bout. Do not interpret 6-6-6 as a magical finisher or a compulsory win. Combat still has calibrated seeded uncertainty without rolling skull dice for every hit; no need to show millions of rolls offline.
- **Verdicts:** 0 fighter HP means death; keep automatic resurrection/return and time-only defeat penalty from DEATH-001. A bounded time limit prevents endless pursuit. At timeout compare **actual remaining HP, not percentages**; the higher-HP fighter wins *only if they inflicted positive opponent-HP damage*, including through legitimate hit-and-run. Equal remaining HP, or no qualifying damage winner, means arena guards execute **both**, two defeats. A losing fighter's preexisting prize/coins/resources are not confiscated. Timer length, starting HP scaling and numerical thresholds are tuning inputs, not approved literals.
- **Economy:** remove magical enchant attempts and Glory Scroll drops/spend; arena **victories award coins**, with stronger-difficulty fights paying more. Coins fund clear **buy/improve equipment** choices at the smith/shop. No hidden money-printing from draws, guard executions, lost bouts or resurrections. Appearance fees, repairs priced in coins, open marketplace, PvP and clan treasury are not in this scope. Keep wallet, purchases and prize settlement consistent active/offline.
- **Meaningful progress:** compare an equal-stat Poor versus Masterwork build (at the **same item grade**) and demonstrate a clear power/survival difference. A well-geared player should move into F→S difficulty rather than remain farming the easiest foe. Make grade escalation, mastery, money and weapon/terrain counters all matter. Exact damage, arrow capacity, win-rate, coin cost, condition and timeout constants are **provisional alpha tuning**, to be centralized and tested, not magic numbers dictated by this plan.

**Known future design conflict (not a hidden task):** the present Skill Master takes **all currently owned outputs** when claiming a producing activity's level. That may be incompatible with players saving stone/timber/food for clan projects. Do not silently weaken MASTER-001 in GLAD-001; record it for owner review **before a future clan-donation implementation**. Do not invent clan or hunger upkeep now.

**Shared build and quality rules for ALL GLAD batches:**
1. **No overengineering:** ALPHA-FOCUS-001 permits an explicit reset of disposable test progress. Do **not** write old-V7 conversion layers for deleted stat IDs, activities, 11-slot enchantments, scrolls or gear. Current-build local save/load and OFF-001 snapshots must still work, and reset notice should be clear when necessary. Do not do destructive resets in this docs-only task.
2. **Keep each milestone coherent and playable.** Complete the needed engine, UI, mechanic handbook and dedicated test changes together in ONE PR per milestone. Do not create a PR per enum, stat, file, button or renamed field. Temporary gaps are allowed only when clearly marked and nondeceptive; retain existing working features until their planned replacement can ship.
3. **Bounded idle resolution:** offline work of days or years MUST NOT replay every battle, arrow, turn or resource-unit RNG. Snapshot the effective build at departure; earn XP/coins/resources in a bounded approximation that does not fabricate precise individual outcomes. Returning applies earned progress only according to OFF-001 and MASTER-001. Any old offlining rules incompatible with this redesign are updated in the relevant batch.
4. **Centralized decisions:** put stats, recipes, weapon traits, item grade/quality, arena variables, payouts and odds in inspectable configs/constants. A Codex task may choose **clearly-labelled provisional numeric alpha values** and benchmark them; it must not silently decide a new game mode, irreversible character-build gate, persistent gear loss, permanent hunger, paid purchase, PvP or clan economy.
5. **Testing cadence (intentional efficiency):** implement a COMPLETE functional slice, run focused local tests of the affected functions **after coherent edits**, not after each line/file/commit. Run the required full repo checks **once per final PR head**, plus targeted regression and developer simulation for that milestone; repeat only the relevant failing tests after fixing a bug and rerun required full CI if final-head code changes. Do not manually rerun the entire suite if GitHub Actions already ran that exact SHA successfully. Follow mandatory branch protection; **never skip failing checks** or assert readiness before checks finish.
6. **Small number of meaningful checkpoints:** five milestone PRs below, rather than many tiny PRs. Push a STARTED entry and draft PR first (HANDOFF-001); push the next verified meaningful milestone before usage ends so another Codex session resumes from the exact state. Minimize needless PR-head pushes that retrigger complete CI, but durability/recovery takes priority if interrupted.
7. **Measure real QA overhead, don't invent a test budget:** each PR records which focused commands ran, required final-head workflow IDs/results, approximate number of code changes since the last full run, and the next action. At the first batch measure actual full-suite runtime; adjust later milestone breadth only if repeated checks dominate coding effort. Normally one targeted test phase + one full final-head pass per PR; more checks are justified for combat randomness, economy integrity, offline errors and security.
8. **Existing harness only:** `node tools/system-lab.mjs --config tools/simulation/example-scenarios.json`; `node tools/combat-simulator.mjs --battles 10000`; `node --test tools/test_system_lab.mjs`; run `python tools/check_project_protocol.py` and **all actual mandatory website/Pages checks** at final head. Update simulator adapters whenever source APIs change. Simulator must import **the production engine**, never maintain duplicate math; it must remain under `tools/`, not in public `site/`. Do not run large statistical sweeps for every small UI edit.
9. **Batch closeout:** compare actual changed files to scope; verify current remote main/open PRs, final-head checks, no secrets/backdoors/security/license issues; merge approved clear work through AUTO-MERGE-001 only if its gates are met. Verify the deployed Pages site **separately** for playable changes; update checkpoint, changelog and task status with real SHA and evidence. If a design choice or test failure is unresolved, leave the PR open with a concrete next step.

### GLAD-001 — Three attributes, eleven survival activities, useful resources
- **Goal:** Replace bloated alpha progression/work catalogue with the survival foundation; keep the idle activity queue and Skill Master usable.
- **Work in this ONE batch:** reduce `site/play/attributes.mjs` to STR/DEX/END; adapt effective-progress/mastery and Fighting snapshots. Replace `engine.mjs:ACTIVITIES` + `ACTIVITY_STAT_WEIGHTS` with **exactly** Fighting/Hunting/Fishing/Foraging/Woodcutting/Mining/Smithing/Construction/Cooking/Farming/Training. Adapt `loot.mjs`, `production.mjs`, inventory labels and grades with minimum genuinely connected ingredient recipes and the seven donation resource categories above. Remove old leisure/outlaw/research activities from selection, queue and Master; no phantom skills, orphan resources, free ingredient conversion or hidden INT/WIL requirement. Keep training an all-stat activity without item output; preserve total productive-hour stat-XP fairness, difficulty gating and current-build offline progress. This is *not* the clan feature.
- **Acceptance:** 11 selectable working activities and 3 visible effective stats; example harvest/grain/straw → rations and ore → iron routes consume actual stocks; a fresh character can mine, train, queue and Master; existing save version may reset once with clear alpha notice; no stale skill/queue keys crash new-save reload; resource-only and training/offline XP behave correctly at low and high grades. Stage a mobile Play Now check.
- **Focused QA:** progression/engine, activity/loot/production, Master, queue/save, long-offline resource settlement; system-lab activity/crafting/attribute/queue scenarios; final required CI.
- **Status:** DONE — [PR #144](https://github.com/janisp123/idle_game/pull/144) merged at `75edea2`; [Pages deployment](https://github.com/janisp123/idle_game/actions/runs/45422209235) and live mobile Play Now verified.
- **Dependencies:** GLAD-PLAN-001; ALPHA-FOCUS-001, OFF-001, MASTER-001, QUEUE-002.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-24).
- **Implemented by:** Codex (PR #144).

### GLAD-002 — Equipment, meaningful grades/quality and arena coin economy
- **Goal:** Build a tangible equipment/shop loop instead of magical scroll gambling, while keeping the already playable duel path functional.
- **Work in this ONE batch:** replace 11 body slots with four (Head/Torso/Arms/Legs); change families to None/Padded/Leather/Plate and remove robe/WIL/magic constraints. Offer exactly five selectable weapon styles Bow/Spear/Sword & Shield/Greatsword/War Hammer; shield is tied to its style and archer carries an implicit dagger backup. Replace Glory Scroll inventory, '+N' enchanting and success/failure UI/engine with a **coin wallet, arena winnings after genuine victory and smith/shop purchase or improvement**. Separate item **grade** Non-grade..S from **quality** Poor/Common/Fine/Masterwork; both influence real configurable gear effectiveness, with meaningful step sizes and costs. Preserve just one item-editing target at a time. Introduce an explicit equipment-condition profile/quality contract for the later combat resolver, but do NOT show inert durability UI or pretend combat breakage already shipped. Keep no random junk-loot sorting, trades or player market. During this batch, the existing duel resolver may remain temporarily in use so purchasing is immediately testable; next batch replaces its mechanics.
- **Acceptance:** victory reliably credits the correct grade-dependent coin payout exactly once; losses/draws credit no full prize; coins cannot go negative, double-award on reload or be duplicated offline; upgrades spend currency once and improve actual current-combat effectiveness, not just labels; all 4 body slots and 5 styles selectable; mage/staff/dual blades/old enchant/scroll buttons disappear; current-build save/reset works without old-save migration.
- **Focused QA:** wallet/reward idempotence, purchases, grade & quality ordering, equipment validity/slot selection, item ability assignment, fresh-save/reload and offline wallet snapshot; staged mobile UI; full final-head CI.
- **Status:** DONE — [PR #146](https://github.com/janisp123/idle_game/pull/146) merged at `7df47cc`; [Pages deployment](https://github.com/janisp123/idle_game/actions/runs/45429384799) and live mobile purchase/reload verified.
- **Dependencies:** GLAD-001; GLORY-001 supersession, ALPHA-FOCUS-001, OFF-001.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-24).
- **Implemented by:** Codex (PR #146).

### GLAD-003 — Physical autonomous combat, injury, condition, real weapon counters
- **Goal:** Replace the old dice-stat/bonus duel core with one cohesive, source-of-truth **physical** tactical resolver. This is intentionally the largest code batch rather than separate PRs for each weapon or status.
- **Work in this ONE batch:** pure bounded seeded battle engine using abstract Far/Reach/Close or equally small distance bands, approach/pursuit/retreat, attack/recovery windows and mobility/encumbrance without grid coordinates. All five weapons have distinct attack/defence logic, strong and weak matchups: Bow shoots, kites when possible, carries a limited ammo count then **automatically uses dagger**; Spear controls reach, loses advantage when approached; Sword & Shield blocks, counters and may **Shield Bash** for blunt stagger at a tactical cost; Greatsword makes powerful slashing attacks and parries, with better recovery than heavy hammer; War Hammer damages guards/plate with high-impact blunt attacks but has a reach/speed weakness. Make piercing/slashing/blunt interact with armour, bleed and stagger, with credible critical/vital outcomes from decisive hits. Implement equipment-HP wear, break-at-zero disadvantage for non-Masterwork, Masterwork never-breaks, and per-bout auto maintenance/reset between bouts; no in-bout regeneration or after-death gear confiscation. Remove direct per-exchange skull-dice bonuses. Reuse existing terrain provisionally until GLAD-004's complete environmental selection ships. Make deaths at 0 HP, bounded fight duration, **remaining raw HP at timeout**, guard execution on exact HP ties or no qualifying damage; allow tactical hit-and-run, reject win-by-zero-damage pure fleeing. Preserve time-only resurrection downtime and actual illustrated event→result mapping.
- **Acceptance:** fixed-seed fights repeat identically; bow cannot fire infinite arrows or re-equip a fresh quiver midfight; dagger remains dangerous but less effective than proper melee weapon; broken shield/weapon/armour visibly changes subsequent outcomes in the **same fight**; Masterwork never breaks but fighter may die from trauma; bleed/stagger have no double-counted free damage or status-roll explosions; no fight can continue indefinitely; a retreating archer can still win by damaging opponents. At timeout higher remaining HP only wins if they inflicted HP damage; otherwise guards kill both, and payout/win logs reflect actual deaths. All five show both a relative strength and exploitable weakness under comparable stats.
- **Focused QA:** seed repeatability, 5-style move/guard transitions, ammunition exhaustion, distance pursuit, status effects, damage/armour/condition, death and timeout edge cases, repeated pay prevention; source-reusing combat simulator for representative equal-stat pairs; full final-head CI.
- **Status:** DONE — [PR #148](https://github.com/janisp123/idle_game/pull/148) merged at `e999517`; [Pages deployment](https://github.com/janisp123/idle_game/actions/runs/45432751889) and live mobile combat verified.
- **Dependencies:** GLAD-002, COMBAT-SIMPLE-001, DEATH-001, OFF-001.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-24).
- **Implemented by:** Codex (PR #148).

### GLAD-004 — Five physical environments and once-per-battle 3d6 positioning rolls
- **Goal:** Make the recognizable skull dice influence **where** the bout takes place, instead of directly changing combat hit/defence stats.
- **Work in this ONE batch:** define data-driven Open Field, Narrow Bridge, Ruined Streets, Walled Courtyard and Gatehouse Chamber. Shared physical descriptors set starting distance, line of sight, cover, retreat space, reach approach and swing clearance; no special hard-coded weapon damage bonus. Before each bout, both combatants roll 3d6 once; higher result biases (but does not guarantee) the selected arena toward its own mechanically favoured conditions. Include fair resolution for equal dice totals and tied or ambiguous preferences. Fix terrain for the bout and show outcome honestly in the readable visual story. **6-6-6 remains a possible visual maximum**, not an auto-kill or magical critical. Do not turn this into a 20×20 simulation or ask players to click decisions each battle; seeded headless selection must be reproducible. Keep grade difficulty relevant.
- **Acceptance:** thousands of seeded selections show a statistically meaningful favouring of the high roller, but not 100% certainty; result is plausible and transparent to players; Bow performs materially better where retreat/vision are open than where blocked; Spear reach matters at bridge; shields benefit from cover; Greatsword needs swing room; verify Hammer's proposed chamber advantage rather than fabricating one. All five environments have distinct visual/text identities and at least one tactical disadvantage for their preferred style elsewhere. No per-exchange 3d6 stats remain; active/offline use the same underlying arena/outcome distribution.
- **Focused QA:** dice distribution and tie/6-6-6 probabilities, deterministic environment sampling, properties-only terrain behaviour, seeded contrasts for all five styles, mobile arena display, mandatory full final-head checks.
- **Status:** DONE — [PR #150](https://github.com/janisp123/idle_game/pull/150) merged at `7ea38da`; [Pages deployment](https://github.com/janisp123/idle_game/actions/runs/45434804788) and live mobile positioning verified.
- **Dependencies:** GLAD-003, DICE-001, COMBAT-SIMPLE-001, OFF-001.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-24).
- **Implemented by:** Codex (PR #150).

### GLAD-005 — Offline parity, meaningful balance, final UI cleanup and verification
- **Goal:** Finish the coherent game loop and prevent the redesign from silently turning long-term idle play into a million individual fight simulations.
- **Work in this ONE batch:** implement/recalibrate bounded **aggregate** offline Fighting against the actual new combat resolver, fixed logout equipment/stats/grade/arena distribution, finite arrows and condition-related expected survival. Time cost of combat deaths/resurrection, honest approximate outcomes and coins awarded for predicted wins must remain consistent; do not claim an exact log of millions of unseen hits. Preserve three-wagon routes and ingredient-limited productive work for 20-year absences; no background stat activation or new gear upgrades while away. Update developer simulator/system-lab modules for 3 stats, 11 activities, 5 weapons, 4 slots, quality, grades, terrain, coins and remove stale magic/enchant assumptions. Calibrate equal-stat 5×5 weapon matchups across 5 arenas, 3 representative armour loads, multiple grades and the full quality ladder (sample representative combinations; don't brute-force pointless exhaustive grids). Measure win/loss/double-death, breaks, arrow exhaustion, bleed/stagger, victory prizes per useful active hour, and upgrade value. Tune centrally so **Poor→Common→Fine→Masterwork** and increasing item grade give obvious benefits against appropriate enemies without making a single all-purpose weapon dominant. Finish compact equipment/coin/arena UI and accurate handbook; delete or clearly supersede outdated scroll/11-slot/magic/dice instructions and obsolete simulator cases. No clan implementation.
- **Acceptance:** 20 years' idle calculation remains bounded with fixed effective stats and coherent resources/currency; cannot mint money by reload/splitting offline claims or count guard-executed draws as wins; payout tracks battle result; increasing gear quality improves meaningful combat outcomes at fixed grade; higher opponent grade remains challenging; every weapon has demonstrable good/bad matchup or terrain conditions; actual deployed mobile and desktop UI show only 3 stats, 11 activities, 4 armour slots, 5 weapons, coins and grade/quality, never old enchanting/magic controls. Publish honest benchmark findings, not made-up win rates.
- **Focused QA:** changed live-source simulator parity, seeded 10,000+ duel **representative** batches, long-offline and split-session/economic invariants, fresh-save/Skill Master/queue/grade sanity, mobile browser smoke, security and full final-head CI; verify deployed Pages after merge.
- **Status:** DONE — [PR #152](https://github.com/janisp123/idle_game/pull/152) merged at `7b7c48f`; [Pages](https://github.com/janisp123/idle_game/actions/runs/45469642917) and live mobile and desktop verified.
- **Dependencies:** GLAD-004, GAME-012 aggregate direction, SIM-001, SIM-002, OFF-001.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-24).
- **Implemented by:** Codex (PR #152).

**Resume after usage limit:** `Read main:docs/TD_LIST.md → inspect current open GLAD PR & branch docs/CHANGELOG.md STARTED/last milestone → finish its first incomplete item → run proportionate focused tests and final-head mandatory CI → merge and verify deployment → update statuses → only then take next GLAD-N task.` The phrase **"continue"** means resume this saved checkpoint, not invent a new project scope. The original discussion is *not* required to recover this plan.

## GAME-006 — Skill-gated probabilistic encounters and resources
- **Redesign note (2026-11-24):** GLAD-001 replaces the old 41-activity economy; only surviving activity/resource families require future calibration. Do not extend removed activities while GLAD work is active.
- **Goal:** Progress hunting, mining, gathering and processing outcomes within a single activity; players never manually choose creature, vein or ore quality.
- **Acceptance criteria:** Data-driven level thresholds and probability weights; low-tier results remain available; higher tiers grow more likely with relevant skill levels; crafting automatically consumes available real inventory ingredients without resource-lock toggles or fabricated stock; encounter difficulty respects combat ability; offline resolution uses frozen skill levels and scales over long absences; deterministic balance and rarity tests.
- **Status:** PARTIAL (PR #43 merged skill-weighted raw loot; PR #44 merged Smelting (its former protection mechanic was removed in PR #82); PR #54 merged ingredient-consuming Alchemy, Carpentry, Masonry and Cooking. Fighting and per-activity difficulty gates shipped through PR #134. Enemy benchmarks remain provisional and probability calibration remains open).
- **Dependencies:** GAME-005, OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** chat (partial work merged in PRs #43, #44 and #54; PR #134 added graded combat, with balance calibration still open).

## GAME-009 — Reversible race transformation design and implementation
- **Goal:** Eventually support one character beginning Human, able to become Undead and return to Human via resource-consuming rituals; no permanent race lock.
- **Acceptance criteria:** Race is distinct from class/profession and independent skills; ritual requires resources and roughly six cumulative days of actual ritual work (provisional), split freely across sessions; progress is saved indefinitely through breaks and unrelated activities; repeat transformations are possible, including reversal; no alts or permanently inaccessible skills; account/change-limit implications, exact costs, race effects, and offline ritual progression must be designed and approved before implementation.
- **Status:** BLOCKED (design agreed; implementation details and dependencies not yet decided).
- **Dependencies:** CHAR-001, OFF-001, future account/character persistence.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.
## GAME-010 — Higher-tier materials substitute lower quest requirements
- **Goal:** When quests are implemented, let players satisfy a lower-tier resource requirement using qualifying higher-tier inventory materials directly, without any material exchange or trading screen (e.g. Copper ore may satisfy a Stone requirement).
- **Acceptance criteria:** Explicit, validated tiers/eligibility map (not an arbitrary all-materials swap); quest acceptance and reward settlement preserve exact inventory balances, save correctness and idempotency; mixed lower/higher inventory, shortage, rollback and long-offline behaviour are tested; no extra conversion inventory or economy exploit. Specify substitution ratio, resource-use priority, confirmation UI and exact mapping with Owner before coding.
- **Status:** BLOCKED (owner-approved direction, but quests and exact material hierarchy/conversion rates are not specified or implemented; no quest substitution code authorized yet).
- **Dependencies:** Future quest system, resource tier ordering, INV-PROTECT-REMOVE-001 and OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.

## GAME-011 — True Fighting and Raiding combat events with matched illustrations
- **Redesign note (2026-11-24):** This section's PR history describes the CURRENT OLD alpha. GLAD-002/003/004 replace the future combat/gear target with five physical weapons, four armour slots, equipment quality/grade, arena dice, physical injury and money. No magic/old enchant continuation. Raids/clans deferred separately.
- **Goal:** Make combat the game's central power fantasy: build real autonomous, consequential and potentially brutal event-driven Fighting, distinct from hunting and from raid activities. Each actual strike, block, dodge, counterattack, hit, defeat or victory can display a corresponding original static illustration. Raids use their own multi-phase event system, rather than becoming Fighting.
- **Acceptance criteria:** Opponents of similar character power; independently testable hit/block/HP/outcome rules to be defined with Owner; event type and outcome select only matching images (never fake/random events); cooldown abilities without mana/stamina; equal time-based attribute XP principles; OFF-001 frozen offline effectiveness and unlimited time; a bounded retrospective instead of replaying every offline combat event; no forced clicks.
- **Status:** PARTIAL ([PR #103](https://github.com/janisp123/idle_game/pull/103) delivered the new **3d6 vs 3d6 initiative roll and separate opposed attack/defense 3d6 per automatic turn**, with the actual image and resolved outcome withheld until animated dice finish; duels are limited to six half-turns, three attacks per fighter, and the old Fighting work-cycle bar is replaced with six turn pips. The Heavy Swing wind-up now belongs inside its attack rather than wasting an entire turn. PR #102 cleaned unnecessary mobile explanations, hid the one-activity route, and dimmed the unavailable Skill Master. [PR #105](https://github.com/janisp123/idle_game/pull/105) added a truthful five-step progress bar directly below the arena painting, with attack/defense dice shown separately on every automatic strike, accurate current action and next-battle preparation. [PR #107](https://github.com/janisp123/idle_game/pull/107) added an **actual saved 11-slot armour equipment selector** with level-locked fixed presets (UI-only; no gear combat modifiers yet). [PR #109](https://github.com/janisp123/idle_game/pull/109) replaced the large Chronicle for **all activities** with compact real XP/resources/consumption and correctly sided damage/defense results; failed mining and healing remain future mechanics. [PR #111](https://github.com/janisp123/idle_game/pull/111) standardized 11 slots to **None/Robe/Leather/Plate**, with kg per piece and weapon, physical reduction, 3d6 evasion/dodge and encumbrance-penalized initiative plus old-save migration. [PR #113](https://github.com/janisp123/idle_game/pull/113) **superseded the Fighting-level equipment gates** with per-piece character **STR Plate / DEX Leather / WIL Mage Robe**, preserving previously worn gear and existing combat/offline snapshots; [PR #114](https://github.com/janisp123/idle_game/pull/114) fixed browser module caching. [PR #116](https://github.com/janisp123/idle_game/pull/116) now also lets every **confirmed activity-level advancement award one automatic STR/DEX/END/INT/WIL point** under existing activity weight splits, with new effective stats feeding those gear requirements and future combat snapshots. No change to opposed dice luck calculations or stat-hourly XP. Basic slot enchanting was implemented in [PR #118](https://github.com/janisp123/idle_game/pull/118), and [PR #125](https://github.com/janisp123/idle_game/pull/125) fixed the presentation of saved enchant +1 ranks and changed the two weapon styles to the same engraved card selection as armour, and [PR #129](https://github.com/janisp123/idle_game/pull/129) replaced the dual weapon/armour edit target with exactly **one selected slot** and one Enchant action plus clickable actual 50% chance/failure breakdown; advanced enchant-specific stat requirements remain PARTIAL/BLOCKED under GAME-013. **Magic resistance is future-only** and does not yet implement a spell counter; real travel speed and complete RPS balance remain separate. [PR #120](https://github.com/janisp123/idle_game/pull/120) now permits weapon-specific physical impact through successful blocks/parries (Heavy Swing 25%/35%, Thrust 10%/15%) and raises new-gear dodge thresholds while preserving the 3d6 bonuses; existing snapshots remain frozen. Earlier PR #100 contributed 12 original combat paintings; #98 added the two skill pairs. Remaining: exact opponent-power balancing, more unique art, true roll-free offline aggregate outcome summaries, further equipment effects/advanced balance, ability leveling, raid/clan battles and recovery.)
- **Dependencies:** GAME-006, OFF-001, [visual direction](brainstorm/COMBAT_VISUALS.md).
- **Added by:** chat.
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** chat (partial merged PRs #94, #98, #100, #103, #105, #107, #109, #111, #113, #114, #116 and #120; further combat effects/art/raid/clan/aggregate offline pending).

## GAME-012 — Slower work/switching and aggregate offline Fighting without per-battle rolls
- **Redesign note (2026-11-24):** GLAD-005 owns new-combat bounded offline parity. GLAD-004 replaces per-strike visible skull dice with pre-bout arena rolls; previous 'retain attack dice' clause is historical, NOT a requirement for redesigned Fighting. Alpha save migrations are no longer required under ALPHA-FOCUS-001; normal work/switch timing remains a separate unresolved decision. Avoid duplicating the GLAD-005 aggregate task.
- **Goal:** Separate cinematic live combat from efficiently settled offline combat. Owner requests no per-battle roll loops while away; the inactive fighter's frozen stats, combat style and opponent bands determine a bounded, simple result estimate. Slow the early-alpha default work cycle from 10 seconds to **1 minute per activity**, and make switching/travel/preparation meaningfully slower as well.
- **Acceptance criteria:** Centralize timing profiles and migrate unfinished saved progress without losing XP, resources, tasks or effective equipment; do not expose numeric countdowns in UI (UI-TIME-001); keep unlimited offline activity and Skill Master rules (OFF-001). Live Fighting retains actual turn-by-turn attack and defense dice, art and 6–6–6; offline Fighting performs **no individual attack/defense/finisher rolls for absent battles** and runs in bounded time even for decades. Do not fabricate victories, losses, kill totals or clan contribution; define and test an accurate aggregate formula before reporting such results.
- **Status:** BLOCKED (direction explicitly requested by Owner on 2026-11-22, but exact slower movement/preparation durations, offline result/penalty formula and compatibility approach remain undecided. Not implemented by PR #100 (art), #102 (mobile cleanup), or #103 (short live 3d6 duels); define offline aggregate formula and test the 1-minute timing-profile migration separately).
- **Dependencies:** GAME-011, OFF-001, ALPHA-TIME-001, SWITCH-TIMING-001, UI-TIME-001.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-22).
- **Implemented by:** Not yet.

## GAME-013 — Slot enchantments with escalating attribute requirements (superseded)

- **Goal:** Historical: the old 11-slot Glory Scroll/+N enchant expansion is canceled by GLAD-002's coins, quality and grade equipment redesign. The already merged alpha implementation remains historical evidence in the changelog and current code until replacement ships.
- **Status:** BLOCKED — intentionally superseded, **DO NOT IMPLEMENT**; delete this backlog entry after GLAD-002 has deployed and historical cancellation is recorded in the changelog.
- **Dependencies:** GLAD-002.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-22; replaced 2026-11-24).
- **Implemented by:** chat (historical basic alpha only); no future enchant feature authorized.
