# Current working checkpoint

**Verified status (2026-11-20):** Repository hosts a static public project landing page and a browser-game engineering research library. **There is no playable game, running combat engine, calibrated offline estimator, account backend or game database.** Nothing in the library should be represented as implemented gameplay.

**Canonical source:** Always fetch current remote `main:docs/TD_LIST.md` first. Then read `AGENTS.md`, this checkpoint, `docs/DECISIONS.md`, the protocol, current main and open PRs; this page is a snapshot, not authority.

## Confirmed repository infrastructure

- **GitHub Pages:** `site/` builds and deploys from the `main` branch through `.github/workflows/pages.yml`. [PR #15](https://github.com/janisp123/idle_game/pull/15) merged; the [main deployment succeeded](https://github.com/janisp123/idle_game/actions/runs/44787499595). Public entry: https://janisp123.github.io/idle_game/.
- **Branch governance:** GitHub ruleset `Protect main` is active on the default branch, requiring a PR and passing `protocol` status check; deletion and force-push restrictions are active. Zero approving reviews are required for the owner's solo workflow. The ruleset does not require branches to be up to date before merging.
- **Validation reality:** `protocol` checks only mandatory agent/project file structure. Site workflow checks basic static-page structure and local links; **neither verifies gameplay mechanics or full application security**.
- **Project and licensing:** public MIT-licensed code and docs; the library may cover useful techniques not selected for our game. Public research documents must not identify outside reference games/repositories. `docs/CHANGELOG.md` records completed merged milestones.

## Approved versus unresolved game design

- **Approved decision OFF-001:** The exact effective level, skill, stats and equipment snapshot at logout remains frozen through the absence. Offline activity earns XP/rewards; resulting progression is applied **only upon return**, never during settlement. No XP-level threshold stepping in the offline estimator.
- **Living, not approved for coding:** small isolated combat rules, online timing, possible statistical offline estimators, idempotent claim models, static illustrated narration and future systems. See the topical brainstorm documents.
- **Explicit conflicts awaiting owner choice:** first prototype scope (stone mining + bunny hunting vs solo human/monster combat), and dice timing/type (older 3d7 proposals vs newer combat-turn skull dice vs one offline-return bonus roll). Do not reconcile these by guessing.
- **Unselected technical details:** combat formulas, skill priorities, casting interruption, death/return duration, loot and offline bonus fairness. These questions do not authorize new tasks.

## Research handoff — selective reading

For future combat/offline work, start with the concise **Combat/offline handoff** in `docs/brainstorm/ARCHITECTURE_AND_BALANCING.md`. Read only the relevant parts of `docs/brainstorm/SOLO_COMBAT.md`, `docs/brainstorm/AUTOMATION_AND_OFFLINE.md` and `docs/brainstorm/OPEN_QUESTIONS.md` as needed. Use library indices P17/P18 and supporting articles on demand. The research compares separated combat functions, seeded tests, aggregate estimators, time units and idempotent reward settlement; **none has been validated in our own game**.

## Immediate next steps

- **Current owner-approved activity:** lightweight repository, website and documentation improvements; do not begin gameplay coding or expand the engine merely because research is ready.
- **No approved gameplay task is recorded** in `main:docs/TD_LIST.md` at this snapshot. A specific prototype will need separate explicit owner approval later.
- **Manual GitHub settings opportunity:** consider setting the repository homepage to the Pages URL and enabling deletion of merged source branches. Both are optional; never delete unmerged work or change owner settings by assumption.
- **Security boundary:** the website is static. Read `SECURITY.md` before adding accounts, third-party dependencies or new API workflows.

**One next development action when the owner wants it:** propose a narrowly scoped first prototype, identify its unresolved design choices, and define tests; ask the owner before adding any implementation task. Do not use this checkpoint to pressure immediate gameplay development.
