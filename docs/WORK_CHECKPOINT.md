# Current working checkpoint

**Verified after merge on 2026-11-21.** Source of truth is remote `main:docs/TD_LIST.md`; read it first. Latest combined game commit: `058bef74b5397b405bbe7f7dfff8ef22b8893972`, from merged [PR #40](https://github.com/janisp123/idle_game/pull/40). Both PR validation workflows **passed** on its final head `a231c95fd413dd273b8024ef320ee3db10cd4607`.

## Current playable code in main

- `site/play/` defines **20 independent activities** (10 honest and 10 outlaw), each with original self-hosted WebP artwork. `site/play/engine.mjs` uses separate skill XP/levels per activity and a name-only player identity; there is no global character level.
- Activity selection is automatic and persistent. Full work cycles are adjustable in configuration; activity progress is visible as a bar, with no duration, countdown, work-rate or time-worked UI. Return reports summarize gathered resources only.
- The original browser localStorage key is preserved. V1 saves migrate to skill-based V2 while retaining inventory, name, partial work, and unattributed previous global XP. Offline settlement has **no time cap**; skill effectiveness remains frozen during absence and earned levels activate when returning (OFF-001).
- `tools/test_game_engine.mjs` covers 20 activity cycles, skill independence, migration, reward variance and 20–50 year absences. `tools/test_game_ui.mjs` checks browser-facing skill and time-free controls. `tools/check_pages_site.py` validates all activity paintings, Play Now, and UI markers.
- The owner's approved code/art merged via PR #40; previous overlapping PR #38 (time UI) and #39 (outlaw scenes) were closed **superseded**, not merged independently.
- **Deployment:** GitHub Pages publication after the final merge was not independently verified when recording this checkpoint. Source is on `main`; do not claim live availability without checking the deployment and page.

## Next approved development scope

- **GAME-006:** Weighted skill-gated encounters, rare ores, and crafting/production requiring real inventory; avoid selecting targets manually. Respect frozen offline skill levels and test long absences.
- **GAME-004:** Future 5-minute zone travel and up-to-five-task repeating queue; not yet implemented.

**Rules:** Every repository action starts by reading remote `main:docs/TD_LIST.md`. Follow `AGENTS.md`, `docs/AGENT_PROTOCOL.md` and `docs/DECISIONS.md`; new gameplay merges still require owner approval. Keep player-visible timers hidden by UI-TIME-001.
