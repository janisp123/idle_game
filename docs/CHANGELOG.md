# Changelog — verified completed work

## 2026-11-20 — First playable prototype and public site (chat)

- **Merged:** [PR #20](https://github.com/janisp123/idle_game/pull/20), commit `5ddebb0aaa35a8c30d61970240e95d1b7140f899`.
- **Implemented:** browser-accessible `site/play/` with one character, automatic Hunting (wolves) and Mining (stone), localStorage state, O(1) offline catch-up, return-only character level-ups, original prototype SVG action scenes, basic game UI and a one-day simulation button.
- **Verification:** Pull-request protocol and static-site/Node tests passed. Following merge, main checks and GitHub Pages deployment succeeded. Gameplay has not had exhaustive cross-device, balance or security testing; no real wolf combat, accounts or server state yet.
- **Limitation:** GAME-001 remains an early prototype, not a finished RPG.


This is a record of **merged repository work**, not a promise that game mechanics are implemented. The actual playable game has **not** been built. Current approved tasks remain exclusively in [TD_LIST.md](TD_LIST.md).

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
