# Current working checkpoint

## Latest in-review change — GAME-005 / PR #40 (2026-11-21)

- **Branch:** `feat/independent-skill-levels-20261121`, opened against `main` in PR #40; **NOT MERGED OR LIVE**. Latest verified pre-checkpoint revision: `7e7f5e5e5bc069b71e7147b5c7eb45db84776fdb`.
- **Implementation:** `site/play/engine.mjs` now gives each configured activity its own `{xp, level}` and removes character-wide level and active global XP. V1 saves under the same `SAVE_KEY` migrate without wiping resources, partial work or name. Unassignable previous global XP is held as invisible `unattributedXP`. Each task earns its own XP; only `enterGame()` activates earned levels, after full uncapped offline settlement (OFF-001).
- **Player-facing:** `site/play/index.html`, `app.mjs`, `iron-ui.css` display the character's editable name, skill levels next to activity choices and active-skill XP progress; no time readouts, no detailed return metrics. Images remain in use. Activity UI also supports grouping once outlaw tasks are added.
- **Validation:** The latest `Idle Game website` and `Project Protocol Preflight` checks both **PASS** at the pre-checkpoint SHA above. `tools/test_game_engine.mjs` covers V1 migration, skill isolation, frozen levels and 50-year absence. Added `tools/test_game_ui.mjs` fake-DOM browser smoke tests; Pages CI runs both plus module syntax checks.
- **Dependencies/conflicts:** PR #38 separately contains the no-visible-time UI that was included here to prevent regression; PR #39 contains pending outlaw activities and shares the same engine/UI files. **Do not merge the overlapping PRs in arbitrary order**: reconcile the branches and rerun all checks first. New tier probabilities, harder encounters and ingredient-consuming processing remain **GAME-006 TODO**, not implemented.
- **Next action:** Owner reviews PR #40; once merge sequencing with #38 and #39 is resolved and CI passes on the final head, request explicit owner merge approval. Separately validate live GitHub Pages after merge.


**Gameplay checkpoint (last verified 2026-11-20; recheck current main and PRs):** GAME-001 was merged as PR #20 and deployed on GitHub Pages: a **playable but simple** automatic Hunting/Mining browser prototype with local saves, no offline cap and login-only level increases. No true wolf combat engine, server-authoritative settlement, account backend or game database. **Branch work GAME-002** replaces the interface HTML/CSS and both static activity paintings with approved 960×540 WebP imagery; it is **not live until separately approved, merged and deployed**.

**Canonical source:** Always fetch current remote `main:docs/TD_LIST.md` first. Then read `AGENTS.md`, this checkpoint, `docs/DECISIONS.md`, the protocol, current main and open PRs; this page is a snapshot, not authority.

## Confirmed repository infrastructure

- **GitHub Pages:** `site/` builds and deploys from the `main` branch through `.github/workflows/pages.yml`. [PR #15](https://github.com/janisp123/idle_game/pull/15) merged; the [main deployment succeeded](https://github.com/janisp123/idle_game/actions/runs/44787499595). Public entry: https://janisp123.github.io/idle_game/.
- **Branch governance:** GitHub ruleset `Protect main` is active on the default branch, requiring a PR and passing `protocol` status check; deletion and force-push restrictions are active. Zero approving reviews are required for the owner's solo workflow. The ruleset does not require branches to be up to date before merging.
- **Play Now contract (SITE-001):** The landing page includes an enabled `Play Now` button leading to `site/play/`. Every subsequent **playable** build must provide `site/play/index.html` and an enabled `./play/` link in the **same PR**, so the game can be tested in-browser on GitHub Pages after merge/deployment; no local HTML download workflow. The Pages checker rejects a missing game entrypoint, dead Play Now links and an incorrectly enabled/disabled button. See `docs/DECISIONS.md` and `AGENTS.md`.
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
- **Task tracking:** GAME-001 was merged and deployed; on this branch `docs/TD_LIST.md` tracks GAME-002 as IN_REVIEW. Do not call the new styling merged/deployed until separately verified.
- **Manual GitHub settings opportunity:** consider setting the repository homepage to the Pages URL and enabling deletion of merged source branches. Both are optional; never delete unmerged work or change owner settings by assumption.
- **Security boundary:** the website is static. Read `SECURITY.md` before adding accounts, third-party dependencies or new API workflows.

**Next step:** verify GAME-002 HTML/CSS, painted WebP assets, game behaviour and PR CI; obtain owner approval before merging, then verify live GitHub Pages deployment and visual quality. The binary artwork is already present on the branch.

## First browser prototype handoff (GAME-001)

- Public game route **after merge**: `https://janisp123.github.io/idle_game/play/`, entered from the landing page's `Play Now` button.
- Files on `main`: `site/play/index.html`, `game.css`, `engine.mjs`, `app.mjs`, original initial SVGs. GAME-002 branch adds `iron-ui.css` and replaces the two SVG scenes with `assets/hunting.webp` and `assets/mining.webp`. Offline model tests: `tools/test_game_engine.mjs`.
- Currently simulated wolf hunting grants 1 hide and 3 XP per 7s, mining 1 stone and 2 XP per 5s; the numbers are prototypes, **not approved final balance**.
- A returning player settles the full elapsed interval first with unchanged action rules (no XP-threshold stepping), then activates level-ups. No internet sync or true combat; do not imply either exists.
