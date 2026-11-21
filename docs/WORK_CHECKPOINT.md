# Current working checkpoint

## In review — UI-002 mobile activity categories (2026-11-21)

- Owner requested a short three-step picker: Activities → Honest Work / Outlaw Path / Clan Activities / Other Activities → matching activity. Back is always available at both nested levels.
- Implemented in feature branch `feat/mobile-activity-category-navigation-20261121`: one compact entrypoint, 4 categories, 10 honest and 10 outlaw buttons, empty future categories explicitly labeled rather than inventing activities. Selecting an activity closes the picker; navigating Back does not alter current work, inventory, XP or save.
- CSS enforces hidden screens, mobile-friendly full-width buttons and touch targets; smoke tests cover categories, empty states, navigation and uninterrupted work.
- Pending PR CI, owner-approved AUTO-MERGE-001 readiness and main Pages verification.


**Latest verified game deployment — 2026-11-21.** Main commit `7f2c2efa1cb505f076831d0df708560c2844ad74` merged PR #44 after successful final-head checks. Main GitHub Pages workflow run `44885082719` completed **successfully**, including Validate static site and Publish to GitHub Pages jobs. Public game: https://janisp123.github.io/idle_game/play/

## Merged game functionality

- **Player:** editable name, no overall character level; 20 activity-specific skill XP/levels. New skill levels activate on return only, never in the middle of an absence (OFF-001).
- **Activities:** 10 honest and 10 outlaw activities, each with an original dark-fantasy WebP illustration and adjustable complete work-cycle duration. No visible timers, rates, elapsed reports or time-worked stats.
- **Raw resources:** Hunting, Mining, Gathering, Woodcutting and Fishing use level-gated weighted loot tables in `site/play/loot.mjs`, with rare resources stored separately and potential rewards shown when the skill unlocks them. Bounded-cost offline settlement supports decades-long absences without per-action replay; effective skill remains frozen.
- **Smelting:** `site/play/production.mjs` automatically selects unlocked copper/iron/silver recipes using real ore inventory, consuming one ore per finished ingot. Optional "Protected" controls exclude reserved raw ores. No materials grants no output or skill XP. Remaining production professions still have placeholder material-free output and must be corrected before a full crafting economy.
- **Save migration:** Browser-local storage key remains the same and V1→V2 migration retains resources, character name, partial progress and unattributed historical global XP. New resource/protection fields default safely when missing.
- **Validation:** `tools/test_game_engine.mjs`, `tools/test_game_ui.mjs` and `tools/check_pages_site.py` run in the website workflow alongside module syntax checks. PR #43/#44 checks passed; both features are merged and latest main Pages deployment passed. Tests are not full gameplay/security validation.

## Next approved tasks

- **GAME-006 (partial):** Extend real ingredient-consuming recipes to Alchemy, Carpentry, Masonry and Cooking; then develop actual combat and difficulty gating before portraying higher-tier hunting spoils as simulated dangerous fights. Provisional loot weights need balance calibration.
- **GAME-004:** Later implement five-minute zone travel and five-task looping queue with no offline time cap.
- **AUTO-MERGE-001:** Already-agreed, passing, reviewed and non-conflicting PRs may merge without a separate "M"; stop for significant risks, design choices or failed checks. Bare "Continue" alone is still read-only.

**Project preflight:** Fetch current remote `main:docs/TD_LIST.md` first, then `AGENTS.md`, `docs/AGENT_PROTOCOL.md` and `docs/DECISIONS.md`; never trust this checkpoint over remote state.
