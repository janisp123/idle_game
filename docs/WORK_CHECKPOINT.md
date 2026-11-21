# Current working checkpoint

## Current work — skill-weighted raw resource rewards, GAME-006A (2026-11-21)

- Owner-approved AUTO-MERGE-001 merged via PR #42; agreed, passing, non-conflicting gameplay PRs may merge automatically.
- This in-review branch adds `site/play/loot.mjs`: level-gated weighted tables for five raw-gathering activities, rare resources as separate unlimited inventory stacks, and bounded-cost stochastic allocation over large offline intervals. High-tier drops replace (do not add to) the settled batch. Skill levels remain frozen throughout each interval under OFF-001.
- Hunting loot represents **placeholder spoils only**, not implemented combat. Rare encounters, HP, injury, protective ingredient settings and input-consuming smelting/crafting are still pending GAME-006 follow-ups.
- New resource labels in the UI show only tiers unlocked at the currently effective skill level. Uncollected inventory stacks stay hidden. No activity timers or return-time metrics return.
- New and legacy game saves remain under V2 format and the same localStorage key; missing new rare resource keys default to 0.
- **Next:** confirm PR CI (engine+browser smoke+site checks), auto-merge if all gates pass, verify main and Pages deployment, then continue with inventory-respecting production as a separate small PR.


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

**Rules:** Owner-approved AUTO-MERGE-001 allows checked automatic PR merge only after already-agreed work is ready and no owner decision remains; see `AGENTS.md` and `docs/AGENT_PROTOCOL.md`. Every repository action starts by reading remote `main:docs/TD_LIST.md`. Follow `AGENTS.md`, `docs/AGENT_PROTOCOL.md` and `docs/DECISIONS.md`; new gameplay merges still require owner approval. Keep player-visible timers hidden by UI-TIME-001.
