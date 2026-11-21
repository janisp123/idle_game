# Current working checkpoint

**Verified 2026-11-21 after PR #60.** The playable game is deployed at https://janisp123.github.io/idle_game/play/ . This is a browser-local prototype, not a released server-backed RPG.

## Last confirmed merge, CI and deployment

- **Repository:** `janisp123/idle_game`, default branch `main`. Last verified playable main revision: `102d7e895afcc0ba88834b7be00dcfc0f1b6c932` ([PR #60](https://github.com/janisp123/idle_game/pull/60)).
- **Live release:** main Pages [run 44901535752](https://github.com/janisp123/idle_game/actions/runs/44901535752) concluded successfully on 2026-11-21. Validation, artifact upload, indexing grace period and website deployment succeeded.
- **Public readback:** the live `/play/` returned HTTP 200, script `20261121-activity-switch1` and the distinct `transitionProgress` progressbar markup. This verifies the deployed HTML and referenced asset version, **not** a manual cross-device gameplay test.
- **Deployment incident:** [PR #52](https://github.com/janisp123/idle_game/pull/52) mitigated a zero-artifact lookup after a successful upload by inserting a short delay. The new run passed; the underlying intermittent GitHub service cause remains unproven. Do not rerun a failed upload/deploy in the same workflow run if the original artifact exists; create a fresh run instead.

## Verified merged features

- **UI-002:** [PR #46](https://github.com/janisp123/idle_game/pull/46) merged a nested Activities picker with Honest Work, Outlaw Path, Clan Activities and Other Activities, Back navigation and truthful empty states. [PR #48](https://github.com/janisp123/idle_game/pull/48) added Training & Knowledge and Tavern & Leisure categories.
- **Return reporting:** [PR #47](https://github.com/janisp123/idle_game/pull/47) removed the redundant Welcome back popup; offline loot appears in the Chronicle.
- **GAME-008:** [PR #48](https://github.com/janisp123/idle_game/pull/48) merged 20 extra XP-only activities and the skull crest. There are now **40 independently leveled skills** with no global character level. The 20 new training/leisure activities temporarily reuse earlier paintings; 20 distinct new artworks have **not** been delivered.
- **GAME-006 partial:** [PR #43](https://github.com/janisp123/idle_game/pull/43) added probabilistic skill-gated raw loot; [PR #44](https://github.com/janisp123/idle_game/pull/44) added inventory-limited protected-ore smelting; [PR #54](https://github.com/janisp123/idle_game/pull/54) completed initial inventory-consuming recipes for Alchemy (herb), Carpentry (log), Masonry (stone) and Cooking (fish). Existing save format and protection controls were preserved, with new recipe labels and engine/UI tests. Higher-tier hunting spoils remain **loot, not simulated combat**.
- **GAME-004 manual-switch partial:** [PR #60](https://github.com/janisp123/idle_game/pull/60) added separate Start buttons, saved finishing/moving/preparing phases, 1-minute same-zone / 5-minute cross-zone movement, 2-minute preparation and a separate accessible transition bar. Engine/UI regression checks passed, including long-absence catch-up and retargeting. The three-wagon queue and its planned durations are **not yet implemented**.
- **Save/offline boundary:** Browser-local saves only; inventory persists locally; old save skill fields migrate. Activity and transition settlement are uncapped by absence duration and honor OFF-001: levels earned offline affect work only after return. No accounts, server state, actual combat, health/death or multiplayer.

## Next approved work and boundaries

1. **GAME-006 remains PARTIAL:** Initial ingredient-consuming crafting is merged and deployed. Next unfinished scope: actual combat/encounter risk and difficulty gating, plus balance calibration. Follow the combat/offline handoff and get owner decisions before selecting unapproved combat mechanics. Preserve protected inventory, frozen effective levels and uncapped time jumps.
2. **GAME-004 PARTIAL (manual switching deployed):** The Start buttons, real three-phase switch, transition meter, fixed travel/preparation time and save-safe offline catch-up are live in PR #60. **Remaining:** QUEUE-002 three compact reorderable wagons above the active task, finite 1–8 Hour/Day work durations and final Forever activity, plus bounded chronological offline queue settlement and wagon-reorder UI. Follow `docs/ACTIVITY_QUEUE_SPEC.md`; preserve PR #60 switching, saved data and return-only levels. Design is approved; queue code/tests/UI not done.
3. **GAME-009 BLOCKED:** Human/Undead reversible cumulative ritual is design-only pending exact costs, effects, persistence and other choices.
4. Keep documentation, user-facing UI and release notes consistent with actual features. Do not equate a merged PR or a passing CI run with a verified public deployment.

**Project preflight:** Always fetch current remote `main:docs/TD_LIST.md` first, then `AGENTS.md`, `docs/AGENT_PROTOCOL.md`, `docs/DECISIONS.md`, recent main and open PRs. This checkpoint is a historical verified snapshot, not a substitute.
