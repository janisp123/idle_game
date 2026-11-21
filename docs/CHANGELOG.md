# Changelog — verified completed work

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
