# Changelog — verified completed work

## 2026-11-21 — Phone-tested hourglass queue UX repairs (chat; PR #69)

- **Evidence:** The Owner supplied Android browser screenshots showing the sandglass image overlapping the task title, inaccessible **Start now** on a populated route, and a four-hour duration selected for a new task instead being assigned to the previous task.
- **Game correction:** [PR #69](https://github.com/janisp123/idle_game/pull/69) merged on main as `a800c3b3880e42623eacd2c1079f54fee2c528f4`. Each activity has two distinct actions: **Start now** immediately requests the approved finish-cycle/travel/prepare transition (with explicit confirmation if it would discard unfinished future plans), and **Schedule** inserts the **chosen timed task before the existing Forever fallback**. With one previous Forever activity, the new timed task starts now and the previous job resumes Forever afterward; with two slots, the new finite activity becomes the future second task and does not alter the current finite duration. Max three and Forever last still hold. Previously earned resources/XP and old local saves persist.
- **Visual/accessibility:** The hourglass art is clipped within its own fixed-height image box separated from the label; the first **active finite** hourglass shows a small percentage progress bar based on actual saved productive work. Future timed hourglasses retain their configured duration label only, and Forever has no meter. No live countdown or runtime displayed in the interface; the grey movement progressbar is unchanged.
- **Validation:** PR-head [Idle Game website run 44911608492](https://github.com/janisp123/idle_game/actions/runs/44911608492) and [Project Protocol Preflight 44911608455](https://github.com/janisp123/idle_game/actions/runs/44911608455) passed, including 4-hour selected-task/fallback tests, cancellation of a route override and the current-only progressbar. Main Pages [run 44911680858](https://github.com/janisp123/idle_game/actions/runs/44911680858) passed site validation/deployment. Public `/play/` HTTP 200 readback confirmed `20261121-hourglass-fixes1` and `queuePlannerHint`. No fresh hands-on screenshot of the deployed fix has yet been observed.
- **Release boundary:** This corrects previously implemented queue semantics; no server, account, asset replacement, progress reset or changes to temporary alpha work-cycle durations.

## 2026-11-21 — Grimdark hourglass UI and minute-long alpha queue (chat; PR #67)

- **Owner-requested visual replacement:** [PR #67](https://github.com/janisp123/idle_game/pull/67) merged on main as `42318502e659dcc0983e684de1d1fcb3b4110f78`. The old drawn wooden carts were replaced with the generated grimdark amber sandglass image (optimized transparent 3.3 KB WebP) and compact fantasy cards **in a fixed three-across grid, not a horizontal scroller**. Internal queue/save property names remain `wagons` for compatibility; this changes imagery, layout and wording only.
- **Short testing periods:** New **1–8 Minutes** alpha selections appear in the queue planner and existing finite-slot editors alongside 1–8 Hours and Days. The first offered alpha duration is 1 Minute. Productive work time excludes finishing, moving and preparing; 10-second work cycles and the 5+5-second grey transition remain unchanged. Earlier saved queues are preserved, and minute-duration saved queues remain loadable after restoring normal mode.
- **Checks:** Final PR-head [Idle Game website run 44909370441](https://github.com/janisp123/idle_game/actions/runs/44909370441) and [Project Protocol Preflight 44909370394](https://github.com/janisp123/idle_game/actions/runs/44909370394) passed. Main GitHub Pages [run 44909454743](https://github.com/janisp123/idle_game/actions/runs/44909454743) succeeded. Independent public `/play/` HTTP 200 readback confirmed `20261121-hourglasses1`, Minutes option, new CSS and hourglass heading. No physical-phone visual check was performed.
- **Boundary:** Temporary minute queue configuration is for alpha testing, not a permanent rebalance of the original Hours/Days queue. GAME-004 still completed; follow-up screen-level aesthetics are determined by owner testing.

## 2026-11-21 — GAME-004 three-wagon automatic activity queue deployed (chat; PRs #64/#65)

- **Engine:** [PR #64](https://github.com/janisp123/idle_game/pull/64) merged as `56eff629c0e75c44f997ebe391b777280550337f`: a 1–3-wagon persistent FIFO with at most two explicitly configured finite 1–8-hour/day work windows, a final **Forever** wagon, 3-phase activity changes, duration editing from edit time, safe reordering/retargeting and removal of a future final wagon. Offline catch-up is bounded by wagon count, even after decades; finite segments are resolved chronologically so earlier mined resources may be consumed in later crafting. Old V1–V3 character saves are migrated without deleting their name/inventory/XP/protection. No accounts or server needed.
- **Interface:** [PR #65](https://github.com/janisp123/idle_game/pull/65) merged as `80f766e8d31b5db146a4a751ef6e32563cb14e30`: CSS-drawn connected wooden wagons **above the activity panel**; separate Start, visible duration planner, accessible swap arrows, current/next/Forever labels, and a Remove control restricted to a future last wagon. The transition bar remains grey. The three-wagon limit prevents a fourth task; switching the first wagon retains earned rewards and restarts travel/readiness.
- **Alpha vs normal:** The active ALPHA-TIME-001 preset keeps **10-second complete work cycles** and **5+5-second switching**, with the first Start taking 10 seconds of preparation. **Scheduled wagon durations are still 1–8 hours/days**, not automatically shortened; normal 1/5-minute travel and 2-minute preparation remain in code for restoration later.
- **Verification:** Final PR-head **Idle Game website** + **Project Protocol Preflight** succeeded on each PR; main GitHub Pages [run 44905877943](https://github.com/janisp123/idle_game/actions/runs/44905877943) validated and deployed. Public `/play/` HTTP 200 readback verified `20261121-three-wagons1`, `wagonQueue` and `queuePlanner`. Engine/browser tests cover multi-wagon material dependencies, 20-year offline processing, save migration, queue edits, swapping and removal. This does **not** claim hands-on physical phone testing or full multi-tab conflict resolution.
- **Backlog:** GAME-004 completed for this approved scope and archived from `docs/TD_LIST.md`. Further UI polish or concurrency hardening needs a separate tracked task.

## 2026-11-21 — Temporary 10-second alpha cycles and grey transition bar deployed (chat; PR #62)

- **Implementation:** [PR #62](https://github.com/janisp123/idle_game/pull/62) merged into main as `87fcfb24780e297958e18126f03118c684de2466`. All activity work cycles now take **10 seconds** while alpha mode is selected. Changing activities finishes the old cycle, then has **5 seconds movement + 5 seconds preparation**, while the first-ever Start has 10 seconds preparation. The switching progressbar changed from warm browns to steel grey, visibly distinct from work.
- **Reversibility and compatibility:** `site/play/engine.mjs` retains original per-activity balance data, 1-minute same-zone / 5-minute cross-zone movement and 2-minute preparation as the `normal` profile, with a single `TIMING_PROFILE` selection. Version 3 browser saves record `timingProfile` and proportionally migrate work and transition partial progress from earlier V1/V2 saves or between alpha/normal; inventory, XP and name remain. Restore normal mode with a code change and cache-busting asset version, not by deleting saves.
- **Validation:** Final PR-head [game engine/browser tests](https://github.com/janisp123/idle_game/actions/runs/44903124781) and [Project Protocol Preflight](https://github.com/janisp123/idle_game/actions/runs/44903124674) passed. Main [Pages deployment 44903191879](https://github.com/janisp123/idle_game/actions/runs/44903191879) succeeded. Independent public `/play/` readback returned HTTP 200 with `20261121-alpha-timings1` script and `transitionProgress` markup. No actual user-device visual walkthrough was performed.
- **Remaining:** Three-wagon queue mechanics still not implemented; this is a temporary alpha testing override (ALPHA-TIME-001).

## 2026-11-21 — Manual activity switching and progressbar deployed (chat; PR #60)

- **Implementation:** [PR #60](https://github.com/janisp123/idle_game/pull/60) merged into main as `102d7e895afcc0ba88834b7be00dcfc0f1b6c932`. Player activity rows now have distinct **Start** buttons rather than clicking the whole row; switching resolves the current full work cycle, then shows the dedicated transition progress bar with **Finishing current activity → Moving to new location → Getting ready to start new activity**. Same-zone travel is 1 minute, cross-zone travel 5 minutes, preparation 2 minutes (also for initial Start); these are internal game times, not player-visible clocks.
- **Offline/save safety:** Transition phase, target and progress are saved alongside existing character data; old local saves migrate. Even 20-year absences are batch-settled, accumulating old and new activity rewards at frozen skill effectiveness. Changing destination mid-switch restarts travel/preparation without duplicating earned goods; existing ingredient protection and inventory remain intact.
- **Validation:** PR-head **Idle Game website #80** ([run 44901479602](https://github.com/janisp123/idle_game/actions/runs/44901479602)) and **Project Protocol Preflight #139** ([run 44901479610](https://github.com/janisp123/idle_game/actions/runs/44901479610)) passed. Main Pages **Idle Game website #81** ([run 44901535752](https://github.com/janisp123/idle_game/actions/runs/44901535752)) passed validation and deployment. Independent public readback of `/play/` returned HTTP 200 and the new `20261121-activity-switch1` script and `transitionProgress` element. This proves published HTML, **not hands-on testing on user devices**.
- **Remaining:** The three-wagon queue, finite task scheduling, reorder controls and automatic multi-activity catch-up remain unimplemented; GAME-004 is **PARTIAL**, not DONE.

## 2026-11-21 — Three-wagon queue and switching timings approved (chat; design only)

- **Owner-approved QUEUE-002:** Replaces QUEUE-001's five-slot queue with **1–3 small connected old wagons above the activity panel**. Wagon 1 is current/immediate destination, the final wagon always runs Forever. Wagons can swap positions; future-only swaps are free, changing wagon 1 restarts movement/preparation, even during a transition, without deleting completed work rewards.
- **Owner-approved SWITCH-TIMING-001:** Same-zone travel **1 minute**, cross-zone travel **5 minutes total**, equipment/readiness preparation **2 minutes** including first Start. Configured 1–8-hour/day slots measure productive work, not travel/preparation; a running activity's newly set duration begins at the edit.
- **Documentation:** [ACTIVITY_QUEUE_SPEC.md](ACTIVITY_QUEUE_SPEC.md), [ACTIVITY_SWITCH_SPEC.md](ACTIVITY_SWITCH_SPEC.md), [TD_LIST.md](TD_LIST.md), [WORK_CHECKPOINT.md](WORK_CHECKPOINT.md) and [DECISIONS.md](DECISIONS.md) updated. Three-wagon UI is described, **not rendered or deployed**.
- **Remaining engineering:** Save-state migration, bounded offline transition/queue math, wagon UI/reorder behavior and tests. No production code changes in this entry.

## 2026-11-21 — Forever-last activity queue specification (chat; documentation only)

- **QUEUE-001:** Owner approved a linear queue of up to five activities: each nonfinal activity is configured for 1–8 hours or 1–8 days, and the final activity continues **forever**. This replaces earlier loop-to-first brainstorming and removes the earlier general deferral for queue design.
- **Efficiency:** [ACTIVITY_QUEUE_SPEC.md](ACTIVITY_QUEUE_SPEC.md) documents segment-by-segment chronological offline catch-up: process finite activity windows and three-phase switches, then batch-resolve the remaining (potentially 20-year) time in the final activity. Frozen offline skill effectiveness (OFF-001), chronological inventory dependencies and idempotency are required; processing cost is bounded by five tasks, not elapsed days. Numerical travel/readiness parameters remain open.
- **Scope:** No queue gameplay or new UI was implemented or deployed; GAME-004 remains TODO until coded, tested and published.

## 2026-11-21 — Manual activity-change design/specification (chat; documentation only)

- **Owner-approved UX:** An individual **Start** button after each activity name triggers three visible stages before work changes: **Finishing current activity**, **Moving to new location**, **Getting ready to start new activity**. Activity switching takes real time and displays a dedicated transition progress bar instead of instantly switching.
- **Specification:** [ACTIVITY_SWITCH_SPEC.md](ACTIVITY_SWITCH_SPEC.md) includes a small patch sequence, phase/save contract, offline boundaries, preservation of old-cycle rewards, migration and test cases. [GAME-004](TD_LIST.md) is still **TODO**, with the future five-task queue deferred.
- **Unresolved parameters:** Same-zone movement, preparation duration, initial start and pending-target change/cancel policy. The existing five-minute zone change is retained.
- **Scope:** **Documentation only; no live gameplay/UI behavior changed.** Changes must not be presented as a playable feature until implemented, tested and deployed.

## 2026-11-21 — Inventory-consuming basic crafts for all production professions (chat)

- **Merged:** [PR #54](https://github.com/janisp123/idle_game/pull/54), main commit `d2bc350794ef0eb6b1c460b71d6268fb2012e170`.
- **GAME-006 crafting subset:** Alchemy now consumes one herb per potion, Carpentry one log per plank, Masonry one stone per block and Cooking one fish per meal. This extends the pre-existing protected-input and no-material/no-output/no-XP behavior of Smelting. Activity menu labels show input requirements. Only basic prototype recipes were added, not advanced tiers or arbitrary ingredient formulas.
- **Compatibility:** No new save schema or inventory key. `PRODUCTION_INPUTS` also exposes ingredient protection for herbs, logs, stone and fish. The unchanged bounded production settlement handles 20-year absences without replaying each action; effective skills remain frozen until return per OFF-001. Previously earned items are retained.
- **Tests and release:** Final PR-head [Project Protocol Preflight #128](https://github.com/janisp123/idle_game/actions/runs/44895472261) and [website #78](https://github.com/janisp123/idle_game/actions/runs/44895472306) passed after an initial outdated regression assertion was corrected. Main [Pages workflow #79](https://github.com/janisp123/idle_game/actions/runs/44895513098) passed validation and publishing. Public `/play/` returned HTTP 200 and served `20261121-ingredient-crafting1`; this verifies deployed HTML, not exhaustive playtesting.
- **Still incomplete:** No actual combat, encounter wounds/risks, combat-stat gating or calibrated rarity balance. GAME-006 stays PARTIAL. GAME-004 and GAME-009 remain deferred/blocked.

## 2026-11-21 — Forty-skill UI, chronicle-only returns and Pages recovery (chat)

- **UI-002:** [PR #46](https://github.com/janisp123/idle_game/pull/46) merged mobile-first nested activity navigation with category Back controls and empty Clan/Other placeholders.
- **Offline return UI:** [PR #47](https://github.com/janisp123/idle_game/pull/47) removed the duplicated welcome-back popup; loot appears in Chronicle instead.
- **GAME-008:** [PR #48](https://github.com/janisp123/idle_game/pull/48), main commit `d4344a602e17ee1a78ae9806bbf59a9052cd42db`, merged 20 training/tavern XP-only actions, 40 independent skill tracks and a skull crest. New training/leisure art is **not** complete; those actions reuse existing paintings.
- **Design only:** [PRs #49–#51](https://github.com/janisp123/idle_game/pulls?q=is%3Apr+is%3Aclosed+49+50+51) recorded one-character unlimited mastery and reversible cumulative Human/Undead ritual decisions; no race mechanics were implemented.
- **Pages incident:** [PR #52](https://github.com/janisp123/idle_game/pull/52), main `e09a30b84ae77104832f298e953ae0c503db3e32`, added a 20-second artifact-indexing delay and documented the first-run zero-artifact / same-run retry duplicate-artifact failures. This delay is mitigation, not proven root-cause repair.
- **Verified live:** [main website workflow #76](https://github.com/janisp123/idle_game/actions/runs/44894015921) passed both validation and deployment. Public `/play/` HTML returned HTTP 200 with the forty-activity version, category markup and skull crest. Actual browser gameplay and save safety were not exhaustively retested.
- **Still partial:** Alchemy, Carpentry, Masonry and Cooking fabricate prototype goods without ingredients; actual encounter combat/risk is absent. GAME-006 remains active. UI-002 and GAME-008 were removed from the active task backlog.

## 2026-11-21 — Owner-approved auto-merge, skill-weighted loot and inventory-limited smelting (chat)

- **Governance:** [PR #42](https://github.com/janisp123/idle_game/pull/42), commit `5a6b1fcd246d166b80a6eb4141f97fd185c85dc5`, recorded AUTO-MERGE-001. Already-agreed PR work may merge automatically after final-head tests, review for conflicts/risk and no remaining owner decisions; the old bare `Continue` remains read-only.
- **GAME-006A:** [PR #43](https://github.com/janisp123/idle_game/pull/43), main commit `4e98d7488795e47ef5b3ea901dc7603f21ab22c6`, added configurable weighted loot to Hunting, Mining, Gathering, Woodcutting and Fishing. Higher skill unlocks additional resource types without separate activity buttons; their shares remain probabilistic. Batch allocation is bounded for decades-long absences, with offline skill levels frozen. Rare goods use new saved inventory keys, with old V2 local saves read safely.
- **GAME-006B:** [PR #44](https://github.com/janisp123/idle_game/pull/44), main commit `7f2c2efa1cb505f076831d0df708560c2844ad74`, added ingredient-consuming Smelting: copper, iron and silver ingots chosen automatically among currently unlocked recipes and real available ores; one ore is consumed per ingot. Optional Protected toggles prevent automatic consumption. No ingredient means no crafted resource or XP. No timers or cycle rates reintroduced.
- **Validation:** Both PR-head website and protocol CI checks **passed** for #43 and #44. Main workflow for `7f2c2efa1cb505f076831d0df708560c2844ad74` completed successfully, including **GitHub Pages publication** (run `44885082719`). Engine regressions test tier thresholds, 100-year offline batch, protection, smelting depletion and saved-state compatibility. UI smoke tests exercise inventory resource protection and time-free displays.
- **Remaining limitations:** Rarity calculations use a bounded binomial approximation on large offline batches; these are provisional balance weights, not calibrated drop rates. Loot from harder hunting encounters is placeholder spoils only; no actual combat, wounds or guards. Alchemy, carpentry, masonry and cooking still use prototype outputs without input consumption; this is tracked by GAME-006. Zone travel and task queue remain GAME-004.


## 2026-11-21 — Twenty activities, skill progression, artwork and timer-free play (chat)

- **Merged:** [PR #40](https://github.com/janisp123/idle_game/pull/40), main commit `058bef74b5397b405bbe7f7dfff8ef22b8893972`. The older overlapping [PR #38](https://github.com/janisp123/idle_game/pull/38) and [PR #39](https://github.com/janisp123/idle_game/pull/39) were **closed as superseded, not individually merged**; their functionality and all ten outlaw scenes were integrated into #40 before merging.
- **Implemented (GAME-005, GAME-007, UI-001):** Ten honest and ten outlaw activities, each with an original self-hosted WebP scene and its own skill XP/level. Player has an editable name and no character-wide level. Former V1 saves migrate without losing inventory, active work, or historical XP (unattributed XP retained invisibly). Uncapped offline rewards still settle under frozen effective skill levels; skill level-ups activate on return.
- **Interface:** Activity menus show obtainable resources and skill levels but **no durations**. The active task uses an unlabeled visual progress bar; no countdown, per-action rate, time-worked record, testing time controls or elapsed-time return report. Return reports only display the gathered resources.
- **Verification:** On the final PR #40 head `a231c95fd413dd273b8024ef320ee3db10cd4607`, **Project Protocol Preflight** and **Idle Game website** both passed. The website workflow ran `node --check`, 20-activity engine regression tests and a browser-UI smoke test; the site validator checked all 20 WebP assets. Main readback confirmed 20 activity declarations, independent skills and no time-related UI references.
- **Remaining:** Loot and encounter rarity probability tables, ingredient-consuming smelting/crafting, guard/risk simulation and five-minute zone travel/5-task queue are **not implemented**. Live GitHub Pages publication had not been independently verified at the time of this record.

## 2026-11-21 — Earlier game and visual work already in main

- **Verified source:** Original grimdark interface, static scene paintings, landing-page hero and 10 foundational long work cycles were present on `main` before PR #40. PR #35 introduced the full work cycles and 10 base activities; PR #37 integrated the first 10 approved WebP scenes. SITE-003's existing painted landing-page gate is validated by the website checker. Earlier active task entries GAME-002, SITE-003 and GAME-003 have therefore been moved out of the active task list.
- **Boundary:** This repository remains an early local-save prototype, not a complete combat, crafting or multiplayer game.


## 2026-11-20 — First playable prototype and public site (chat)

- **Merged:** [PR #20](https://github.com/janisp123/idle_game/pull/20), commit `5ddebb0aaa35a8c30d61970240e95d1b7140f899`.
- **Implemented:** browser-accessible `site/play/` with one character, automatic Hunting (wolves) and Mining (stone), localStorage state, O(1) offline catch-up, return-only character level-ups, original prototype SVG action scenes, basic game UI and a one-day simulation button.
- **Verification:** Pull-request protocol and static-site/Node tests passed. Following merge, main checks and GitHub Pages deployment succeeded. Gameplay has not had exhaustive cross-device, balance or security testing; no real wolf combat, accounts or server state yet.
- **Limitation:** GAME-001 remains an early prototype, not a finished RPG.


This is a record of **merged repository work**, not a promise that game mechanics are implemented. The playable browser prototype exists, but the complete planned game has **not** been built. Current approved tasks remain exclusively in [TD_LIST.md](TD_LIST.md).

## 2026-11-20 — Public landing page and automatic deployment (chat)

- **Merged:** [PR #15](https://github.com/janisp123/idle_game/pull/15), main commit `6e03f0dd939063ddb021dd86a5fc57f2058b223a`.
- **Files:** `site/index.html`, `site/styles.css`, `site/favicon.svg`, `tools/check_pages_site.py`, `.github/workflows/pages.yml`, `README.md`.
- **Verification:** PR website and project-protocol checks both passed; main GitHub Pages deployment [completed successfully](https://github.com/janisp123/idle_game/actions/runs/44787499595). Website: https://janisp123.github.io/idle_game/.
- **Scope:** presentation of the project's vision and library only; not a running game.

## 2026-11-20 — Offline design correction and research handoff (documentation)

- **Merged:** [PR #14](https://github.com/janisp123/idle_game/pull/14), commit `754a82fa45d3a639cac5fdc29c936d782950c929`. Recorded owner decision OFF-001: offline XP/rewards accumulate using the **frozen logout build**; level, skill and equipment effectiveness changes apply on return.
- **Merged:** [PR #13](https://github.com/janisp123/idle_game/pull/13), commit `9d1106fd0630115fda7d4d5594795f4a009a84db`. Narrowed the reading path for future combat/offline work to concise handoffs and relevant library entries.
- **Merged:** [PR #10](https://github.com/janisp123/idle_game/pull/10), [PR #11](https://github.com/janisp123/idle_game/pull/11) and [PR #12](https://github.com/janisp123/idle_game/pull/12). Consolidated implementation research for isolated combat rules, timing, offline-combat estimation alternatives and verification plans.
- **Evidence boundary:** research and design notes only; no game simulator, engine, performance benchmark or calibrated offline estimator was delivered.

## 2026-11-20 — Library, licensing and brainstorm organization (documentation)

- **Merged:** [PR #5](https://github.com/janisp123/idle_game/pull/5), commit `310e25355410975246df4bbdc842784606225c3c`: independently authored idempotent reward settlement guide.
- **Merged:** [PR #6](https://github.com/janisp123/idle_game/pull/6), commit `3634dea3e8c9b222d0d4dce020620f712818a553`: reorganized the brainstorm by topic, with environmental combat notes.
- **License history:** [PR #7](https://github.com/janisp123/idle_game/pull/7) and [PR #8](https://github.com/janisp123/idle_game/pull/8) experimented with restrictive license terms. **Those decisions were superseded** by [PR #9](https://github.com/janisp123/idle_game/pull/9), commit `d26cc4194480499a84cb8ed8cc90a1d98440d4b1`. Current license: standard **MIT**; see [DECISIONS.md](DECISIONS.md) LIC-002 and [LICENSE.md](../LICENSE.md).

## 2026-11-19 — Project and engineering library established (documentation)

- **Merged:** [PR #1](https://github.com/janisp123/idle_game/pull/1) and [PR #2](https://github.com/janisp123/idle_game/pull/2): initial game brainstorming and engineering research notes.
- **Merged:** [PR #3](https://github.com/janisp123/idle_game/pull/3), commit `6b3648b6d9bc12ae6c8463869cfb292781b33d89`: set up the repository's two purposes—an original game concept and an independently written public engineering library.
- **Merged:** [PR #4](https://github.com/janisp123/idle_game/pull/4), commit `1fbfc90ffb02bf338462557f743dd982a6be4441`: time-safe offline simulation and resource-boundary research article.
- **Scope:** documentation/research, not tested gameplay implementation.

## 2026-11-18 — Owner command convention for cross-agent resumes (chat; documentation only)

Added **continue** (read/plan/ask approval), **continue and implement** (resume only within previously approved scope) and **check status** (read-only), and recorded PRO-004. New projects inherit the same rule. No application code or release work is included.

---

When future work is **actually merged and verified**, append its PR/commit, exact files, check results (PASS/FAIL/NOT RUN), scope and any unresolved limitation. Do not label documentation research as tested gameplay.
