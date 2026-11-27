# Current working checkpoint

## CLASS-KITS-001 — APPROVED PLAN

CLASS-KITS-001 — owner approved direction: one passive and two automatic abilities per specialization, no mana or manual skills. [Implementation plan](mechanics/CLASS_KITS_IMPLEMENTATION_PLAN.md) defines all 31 proposed kits, shared scheduler/effects, explicit versioned save compatibility, pilot 10-class family, max-only validation and UI/release gates. Plan only; no runtime changes or new tests run. Existing #200 terrain candidate 04f3acf all seven checks/163 tests passed; dagger/tank counter defect still open. Next: shared registry and scheduler plus old-rule dispatch. Exact candidate effects and numbers require validation, no release approval inferred.

## GROUP-COUNTERS-001 — STARTED

BATTLE-GROUP-001 / GROUP-COUNTERS-001 STARTED (owner approval 2026-11-27): natural tactical class counters, shielded tanks resist arrows and protect nearby allies, melee pressure/closing, magic vs heavy armour, healing/support/summoning distinct, terrain and stance matter. No class quotas, forced balanced roster, artificial enemy-only modifiers or material economy. Test maximum stats, S Masterwork and full mastery exclusively. Prior max-only screen 5040 bouts: 7 archers 115W/5L, default 71W/48L/1D, tanks 1W/119L; raw PR #198 comment 7215109236. Candidate coefficients not final. Preserve old frozen bout rules via saved rule version; old offline intervals use old rules, switch after live boundary. No reward/gear price/timing changes. Baseline 1c9e7f5. Branch feature/group-tactical-counters.

ARENA-ONLY-001 #199 merged 1c9e7f5, final head cffe1be all seven checks and 158 tests. Pages 45981143856 success.


GROUP-COUNTERS-001 candidate v2: centered frontline/backline formations, tank shield arrow interception within two tiles up to twice per round, stronger actual arrow blocks and guarded arrow damage reduction, magic bypasses shield/parry and pressures tanks, mobile melee closes faster/pressures casters, no free recovery kiting, healer/support attack tradeoff and 2-round recipient heal window. All candidate coefficients centralized in group-counter-rules.mjs. New group sessions v2; old sessions explicitly resolve v1, transition only at completed foreground boundary, no paid cursor loss. Legacy nonclass duels unchanged. 5040 comparable max-only screen plus 840 direct paired role/terrain battles; functional checks for arrow intercept, block, magic bypass and healer access. Pending CI; no claim of balance or release.


First candidate 0ff3206 verified website 45982905013 (161 tests, real Chromium 390/1440), raw PR comment 7216036032; reproducible [report](mechanics/GROUP_COUNTER_SCREEN_20261127.md). 5040 clone bouts + 840 direct role battles. Archer stack 35/120 vs old 115/120, tanks 40/40 vs archers, mages 40/40 vs tanks; summoner stack 86W/33L/1D, mage 78/120, default49/120. First pass not balanced/merged. Follow-up candidate: slight relief for shielded-arrow unblocked hits, summoner hybrid damage cost, close-range spell aim penalty, preference for reachable counter-targets instead of unreachable focus, central three-lane bridge movement choke (not forced composition), role help in class editor, preview key includes rule version, frozen v1 513-bout golden test. Re-run same max-only cohort/matrix; no lower-tier tuning. Candidate v2 still unreleased.


CLASS-TERRAIN-001 owner extension: terrain should create pronounced situational advantages, not flat equal performance. All 31 class guides now have independent 44px info buttons, registry-derived weapon/armour/cooldown, actual signature action, strengths/weaknesses and terrain preferences. Read-only dialog, no selection or spend. Browser tests browse all 31. Guide is tactical intent, not guaranteed outcome; terrain tuning follows. Prior a7c78c5 website passed 162 tests + browser, results saved PR #200 comment 7216385585; ranged 14/24 open, 2/24 gatehouse; summoner 43/120. Separate sensitivity failed outdated function-signature assertion; fix follows. Pending checks.


Terrain candidate: explicit bow impact/aim penalties in ruins and especially gatehouse; straight narrow bridge remains favorable to clear-line bow shots; dagger close-terrain bonus and padded/leather versus plate matchup, symmetric and applied only to new tactical rules. Added 1080 paired max-only direct dagger-versus-bow/mage/tank battles across five arenas. Fixed legacy symmetry audit's stale source signature match; no test acceptance weakened. 5880 existing max-only matches rerun as well. All class guides and effects are intended tactical identities pending validation, not guaranteed outcomes. No merge yet.


## 2026-11-27 — Interlude class identity research

Owner requested research of all original Interlude classes. [31-class identity report](mechanics/INTERLUDE_CLASS_IDENTITIES_20261127.md) maps all original classes to our specializations, records individual skill evidence, our fixed kit, proposed identity, matchups, preferred and adverse terrain, implementation gaps and test plan. Research-only; proposals not implemented. Candidate 04f3acf all seven CI passed (163 tests, all info dialogs on mobile/desktop), 6960 max-only matches; raw PR #200 comment 7216640854. Archers 14/24 open, 0/24 gatehouse; Trickblade 2/24 vs Longshot open, 24/24 gatehouse, but 24/24 vs Oathkeeper both. Need genuine tank counter and differentiated class mechanics before balance approval; no merge yet.
