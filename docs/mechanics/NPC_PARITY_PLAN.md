# NPC-PARITY-001 — Opponent progression parity

Status: approved direction; implementation design candidate, not runtime. Baseline 6f2649443e82a5bdfd402cbdd1a0bbc246288b91.

## Source audit

- `combat.mjs:makeOpponent` currently uses `difficulty.mjs:arenaBenchmark`, random small STR/DEX/END variation, encounter-restricted weapon/armour families, grade-dependent fixed quality (S is Common), and `equippedCondition` defaults to full expertise. No tactic or tacticLevel supplied.
- `team-timeline.mjs:boutAt` sets enemy Teamwork to 1; player uses actual frozen snapshots. `team-combat.mjs` already applies the same action resolver to both sides and supports tactic snapshots on either side.
- `team.mjs:teamSnapshots` derives real kit, armour stats, condition, gear attack and defence using actual active expertise. `smith.mjs`, `expertise.mjs`, `attributes.mjs` and `manager-tactics.mjs` define shared legal progression. `auto-fight.mjs` advances on 3 wins, retreats after a defeat/draw, retries after 10 wins; grade currently controls both NPC stats and prize.
- `battle-analytics.mjs` records real frozen terrain and enemy weapon presence/pairs; add enemy armour/tactic presence or composition with separate coverage counts for earlier analytics that did not record those dimensions. Do not invent prior opponents' tactics.

## Candidate design (not yet tuned)

1. Capture a bounded progression envelope from actual earned player activity levels, activated attribute effort and Fighting level, earned equipment investment, accumulated expertise and tactic training, Teamwork. Use existing production formulas, not a second set of NPC stat multipliers.
2. Draw independent opponent loadouts from all legal weapon/armour/tactic combinations using seeded randomness independent of the player's selected loadout. Allocate comparable training and legal equipment investment budgets; no new free mastery or unearned gear, no automatic counter-picking. Do not punish switching by adjusting enemy strength from the newly equipped item or recent win/loss alone. Account for inactive investment; do not duplicate expertise across every choice. Verify total budgets and item grade gates against smith costs. Exact budget estimator and variation are open candidate choices, not approved numerical policy.
3. Freeze both progression envelope and deterministic generation version for each in-flight bout and offline settlement. No re-roll after reload, no retroactive prize changes. Maintain bounded 256-bout schedule and exact weighted analytics; avoid persistent NPC histories and per-bout logs.
4. Use the same team snapshot construction, real mastery, condition, mobility, damage, terrain choice and teamwork for both sides. Same grade and mastery do not mean identical weapons or armour. No extra NPC-only advantages.
5. Resolve reward grade coupling: current win/loss ladder changes enemy strength and coin reward. For equal-progression opponents, proposed separate payout/progression grade from short-term win/loss (e.g. earned investment band). Exact mapping and economy consequences remain undecided. Preserve prices and XP caps until reviewed. Do not make progression meaningless or allow easy coin farming.
6. Expose actual enemy tactics in arena and analytics; add coverage-aware breakdown, sample counts and retain existing stats. Verify browser-local save and offline cap behavior.

## Validation order

First use max-only profile from `tools/manager-endgame-validation.mjs`: STR 141, DEX 141, END 129, Fighting 52, S Masterwork, full relevant expertise, tactic and Teamwork 50. Reuse production resolver; test identical mirror configurations with side swaps; diverse equal-progress combinations across all five arenas, paired seeds and independent holdouts. Screen all 2025 ordered two-fighter selections against diverse references; examine winning and losing matchups, terrain, tactics, weapon/armour usage, counterexamples and uncertainty. Avoid forcing every matchup to 50%; mirror sides should have equal expected score, strong tactical counters should exist and no universal dominant build. Evaluate economy at equal progress with actual results; do not tune early grades until Owner approves endgame.

Functional tests: deterministic generation independent of player active weapon/tactic, legal equipment and expertise budgets, no hidden bonuses, symmetry, no changes inside frozen bouts, save/reload, exact split/offline weighted settlement, actual tactic UI and analytics with historic coverage, no alpha wallet credits as earned investment. Test normal save functionality across grades without lower-grade balance sweeps.

No simulations performed yet for NPC-PARITY-001. No runtime code changed. Next: implement a pure candidate generator and run max-only controlled simulations. Only integrate after progression/reward policy and endgame evidence are acceptable.

## Owner confirmation and runtime candidate

Owner confirmed 2026-11-27: remove adaptive artificial enemy difficulties from public manager arena; always fight simulated player clones with equivalent progression, independently chosen builds, increasingly competent but diverse choices toward endgame; opponents cannot know terrain before choosing. Gear/attribute improvement remains visible, wins reward strategy; same combat rules prepare for future PvP. Candidate payout: existing prize table indexed by earned Fighting skill's existing smith unlock thresholds (not win streaks); retains 20-second fractional carry. Candidate rivals inherit derived shared attributes, Fighting and Teamwork, and specialize a bounded per-fighter budget of owned equipment investment and activated mastery across independent loadout choices. This is a synthetic specialist approximation, not fully persistent rival histories. Heuristic build preferences unproven; max-only simulation evidence required before release.

V4 clone timeline preserves old v3 in-flight result, paid cursor, seed and fractional carries, then switches at a committed boundary. Legacy solo/team routes keep prior logic. Public arena shows reward tier, not adaptive difficulty. Tactics and armour analytics explicitly cover clone-era fights only, preserving prior totals. Test harness tools/test_clone_opponents.mjs; no results yet. Economy and preference quality remain provisional.
