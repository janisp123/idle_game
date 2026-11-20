# Current working checkpoint

**Branch checkpoint (2026-11-20):** The public `main` repository is a landing page and research library. **The GAME-001 implementation branch adds an early playable Hunting Wolves / Mining Stone prototype** (local-only saves, simple timed actions, uncapped timestamp catch-up); it is **not yet on `main` or deployed until owner-approved PR merge**. No actual combat engine, server-authoritative settlement, account backend or game database exists. Do not present the research library as tested gameplay.

**Canonical source:** Always fetch current remote `main:docs/TD_LIST.md` first. Then read `AGENTS.md`, this checkpoint, `docs/DECISIONS.md`, the protocol, current main and open PRs; this page is a snapshot, not authority.

## Confirmed repository infrastructure

- **GitHub Pages:** `site/` builds and deploys from the `main` branch through `.github/workflows/pages.yml`. [PR #15](https://github.com/janisp123/idle_game/pull/15) merged; the [main deployment succeeded](https://github.com/janisp123/idle_game/actions/runs/44787499595). Public entry: https://janisp123.github.io/idle_game/.
- **Branch governance:** GitHub ruleset `Protect main` is active on the default branch, requiring a PR and passing `protocol` status check; deletion and force-push restrictions are active. Zero approving reviews are required for the owner's solo workflow. The ruleset does not require branches to be up to date before merging.
- **Play Now contract (SITE-001):** The landing page includes a clearly disabled `Play Now` button while no playable prototype exists. Every subsequent **playable** build must provide `site/play/index.html` and an enabled `./play/` link in the **same PR**, so the game can be tested in-browser on GitHub Pages after merge/deployment; no local HTML download workflow. The Pages checker rejects a missing game entrypoint, dead Play Now links and an incorrectly enabled/disabled button. See `docs/DECISIONS.md` and `AGENTS.md`.
- **Validation reality:** `protocol` checks only mandatory agent/project file structure. Site workflow checks basic static-page structure and local links; **neither verifies gameplay mechanics or full application security**.
- **Project and licensing:** public MIT-licensed code and docs; the library may cover useful techniques not selected for our game. Public research documents must not identify outside reference games/repositories. `docs/CHANGELOG.md` records completed merged milestones.

## Approved versus unresolved game design

- **Approved decision OFF-001:** The exact effective level, skill, stats and equipment snapshot at logout remains frozen through the absence. Offline activity earns XP/rewards; resulting progression is applied **only upon return**, never during settlement. No XP-level threshold stepping in the offline estimator.
- **Owner-approved MVP-001 / GAME-001:** One locally saved character; automatic wolf hunting and stone mining; two original static SVG action scenes; offline timestamp catch-up; return-only level-ups; a one-day test shortcut. Placeholder reward rates, not real combat. Further rules and features remain brainstorms only.
- **Later conflicts awaiting owner choice:** Full combat and dice timing/type (older 3d7 proposals vs newer combat-turn skull dice vs one offline-return bonus roll). The first prototype scope is now explicitly decided as **wolves + stone**. Do not infer an implementation choice for later mechanics.
- **Unselected technical details:** combat formulas, skill priorities, casting interruption, death/return duration, loot and offline bonus fairness. These questions do not authorize new tasks.

## Research handoff — selective reading

For future combat/offline work, start with the concise **Combat/offline handoff** in `docs/brainstorm/ARCHITECTURE_AND_BALANCING.md`. Read only the relevant parts of `docs/brainstorm/SOLO_COMBAT.md`, `docs/brainstorm/AUTOMATION_AND_OFFLINE.md` and `docs/brainstorm/OPEN_QUESTIONS.md` as needed. Use library indices P17/P18 and supporting articles on demand. The research compares separated combat functions, seeded tests, aggregate estimators, time units and idempotent reward settlement; **none has been validated in our own game**.

## Immediate next steps

- **Current owner-approved task:** GAME-001 first playable wolf hunting/stone mining prototype. Implement in a small PR, run site validation and Node offline-engine tests, request owner review/merge. Do not expand into advanced combat or multiplayer without approval.
- **Task tracking:** `docs/TD_LIST.md` on this branch records GAME-001 as IN_REVIEW. Do not call it merged/deployed until the PR and public Pages deployment are verified.
- **Manual GitHub settings opportunity:** consider setting the repository homepage to the Pages URL and enabling deletion of merged source branches. Both are optional; never delete unmerged work or change owner settings by assumption.
- **Security boundary:** the website is static. Read `SECURITY.md` before adding accounts, third-party dependencies or new API workflows.

**Next step:** finish source+CI verification, open the GAME-001 PR, then request the owner's explicit merge approval. After merge, verify the deployed Play Now route and update the changelog/task completion. No gameplay additions beyond MVP-001 without new approval.

## First browser prototype handoff (GAME-001)

- Public game route **after merge**: `https://janisp123.github.io/idle_game/play/`, entered from the landing page's `Play Now` button.
- Files: `site/play/index.html`, `game.css`, `engine.mjs`, `app.mjs`, `assets/hunting.svg` and `assets/mining.svg`. Offline model tests: `tools/test_game_engine.mjs`.
- Currently simulated wolf hunting grants 1 hide and 3 XP per 7s, mining 1 stone and 2 XP per 5s; the numbers are prototypes, **not approved final balance**.
- A returning player settles the full elapsed interval first with unchanged action rules (no XP-threshold stepping), then activates level-ups. No internet sync or true combat; do not imply either exists.
