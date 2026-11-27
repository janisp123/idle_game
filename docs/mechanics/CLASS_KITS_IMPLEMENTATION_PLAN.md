# CLASS-KITS-001 — Automatic class abilities implementation plan

**2026-11-27 owner update:** ALPHA-MERGE-001 supersedes this plan's alpha balance-release gates. PR #200 merged all 31 kits after functional CI; remaining UI and balance stages continue in fresh incremental PRs. Beta requires balance acceptance. Historical baseline and proposed plan below retained.

**Owner-approved direction, 2026-11-27. Planning milestone only.** Scope: one passive trait and two automatic class abilities for each of the 31 specializations. No manual skill selection, mana, skill points, new spendable currency, cooldown management UI, separate ability XP tracks, or additional party slots. Fixed equipment and existing active-class progression remain. Specific kit effects, coefficients and priorities below are candidates for iterative endgame testing, not promises of final balance. Use [Interlude identity research](INTERLUDE_CLASS_IDENTITIES_20261127.md) as source for class identity, not copied retail formulas.

## 0. Establish the baseline and isolate the work

- Current live main: 1c9e7f57139e2c5939b8259ff2241c5e535c54f4, PR #199, Pages 45981143856 passed. Coin-only progression is live.
- Unmerged prerequisite: PR #200, terrain candidate 04f3acfe978f3136805c98d6ee6d1136fafc6827, all seven workflows passed, website 45986130801: 163 tests and Chromium 390/1440. Research head d6513a589e702dc8b676c8ac6c911df2527488f3. Keep implementation staged on this PR/branch rather than duplicating its changes; do not merge unfinished balance. Recheck main and overlapping work first.
- Existing 6960 max-only matches are baseline evidence: ranged stack wins 14/24 open field and 0/24 gatehouse; Trickblade vs Longshot 2/24 open field and 24/24 gatehouse, but Trickblade vs Oathkeeper 24/24 in both, a real counter failure. [Raw results](https://github.com/janisp123/idle_game/pull/200#issuecomment-7216640854). Fix dagger-vs-shield interaction through actual guard/armour/reach mechanics; inspect why tanks lose before assigning arbitrary role damage reductions.
- Read actual resolver, movement, armour and group timeline before each batch. Keep all prices, rewards, class XP, 10-second battle duration, rank rules and offline cap unchanged until a distinct economy task. Retain legacy nonclass duel regression. No new lower-grade balance sweep.

## 1. Shared architecture (first implementation milestone)

Reuse production `team-combat.mjs`, `physical-actions.mjs`, `battle-group-actions.mjs`, `battle-group-classes.mjs`, `group-counter-rules.mjs`. Candidate modular additions: `class-kits.mjs` (immutable registry), `class-ability-policy.mjs` (legal action selection), `class-effects.mjs` (bounded effect lifecycle). Do not make 31 separate engines or duplicate the strike formula.

Each registry entry contains stable class ID, one passive ID and its conditions/tradeoff, primary and secondary ability IDs, effect type, target selector, reach/geometry, cooldown rounds, recovery/action cost, prerequisites, magnitude/duration caps, and display labels. All 31 IDs must be covered exactly; validate schema and unknown effects, no arbitrary callbacks in saved data. Every ability uses existing actor snapshots, seeded RNG and real damage/defence logic. Primary is the class's core action: for healers it is healing, for support it can be support/attack, not compulsory damage.

Round policy:
1. Expire timed effects; process ordinary ongoing damage, defeat and control in existing deterministic turn order.
2. Compute legal targets, real distance/cover, current HP, recovery, ready cooldowns, and active stance. No enemy-only modifiers or knowing future RNG.
3. If actor can act, choose one eligible action using deterministic scored priorities: primary, secondary, ordinary attack, or move. If neither ability is useful, use ordinary attack/movement. Utility is not an extra free action. A failed hit still consumes the action and cooldown; unavailable target cannot consume an ability.
4. Apply effects through common strike, healing, guard, control and movement primitives; consume action/recovery; set that ability's independent cooldown. Emit real event with actor, target, ability ID, round, effect, actual damage/healing and state change. Other ability cannot fire in same turn.
5. State and event memory bounded by roster, active effect categories and existing 32-round limit; no extra actors for familiars/constructs. All actor-local state reset at start of bout.

Candidate shared effect primitives: conditional strike/penetration, bounded splash, periodic bleed, guard/ward, weakness, heal/cleanse, temporary offence/recovery modifier, legal movement/dash, slow, short control, focus disruption, self-sacrifice and capped damage-linked healing. Separate defence/magic from physical shield blocking; explicit stacking categories, source, expiry, maximum magnitude, nonrecursive triggers. Existing armour/grade/condition still matters, shield benefits require intact appropriate shield. Plate and guard resist daggers; no automatic kills. Control immunity and heal recipient window prevent stun or heal loops; no revive. Buffs and same-type debuffs use strongest bounded active effect, not multiplicative stacking. Movement obeys occupancy, pathfinding, terrain and recovery; no teleport. Summoner-themed actions share the same one-action budget.

Stance priorities: Aggressive prioritizes legal pressure and pursuit; Balanced weighs useful effect and survival; Defensive prioritizes rescue, protection or disengagement. Stance mastery affects consistency of the appropriate behavior, not an unconditional damage multiplier. Candidate thresholds and cooldowns live in one tuning module, not magic constants in UI. Ability strength uses existing active class mastery and actual equipment (current level curve is starting point); all three features available from class level 1, no independent unlock tree or new XP. Inactive classes gain no XP or upgrades.

## 2. Preserve saved combat and offline determinism

Before any new behavior, make resolver dispatch explicit by saved ruleset. Historical absent rule field is v1. Retain v1 golden 513-bout result (272/239/2, 3522 coins) and v2 candidate semantics for fixtures. New kits use v3 or a dedicated next version; do not change the old equality predicate to silently make v2 actors v1. Separate immutable version configs/handlers and use explicit version selection. New sessions use latest rules. Old saved offline intervals use exactly their stored rules; on foreground return finish the old partial bout under old rules, then switch at the next committed boundary. Persist only version + existing frozen class/gear/stance/mastery inputs; transient per-bout cooldowns/effects reconstructed deterministically from seed. Preserve cursor, fractional rewards, analytics, rank, cap and earned mastery. Include version in outcome cache and preview key; verify exact split/whole settlement, reload and offline repeatability. Keep historical rules readable for alpha saves; do not reset user progress for this feature.

## 3. Pilot families: daggers, archers, tanks (10 classes)

Implement all three daggers, all three bows, all four tanks as first candidate family, using shared primitives. Keep other classes' existing one signature until their family is converted; don't expose pilot as a finished live system. Correct daggers vs intact shields before increasing assassin power. Close-quarter dagger performance comes from contact, light armour vulnerability and legal approach paths, not global bonus against caster role. Longshot must sacrifice movement for range, Windbow wins mobility not maximum damage, Blackbow wins impact not cadence. Tanks must have different reasons to be selected (ally protection, offensive pressure, anti-magic protection, debuff). Add exact deterministic effect tests, real trace tests, side-swap and all five terrain tests at maximum stats. Compare full stacks and mixed protected backlines.

## 4. Complete the class registry in bounded batches

A. Other melee (Blademaster, Linebreaker, Ragebreaker, Ironfist, Scrapbreaker) — reach, recovery, control, heavy armour and low-HP risk.
B. Mages (Flameweaver, Gravebinder, Frostweaver, Galescourge) — separate area damage, curse, control and single-target burst.
C. Dedicated healers (Lifekeeper, Wellspring, Bloodsage) — strong rescue, cleanse and bounded melee sustain.
D. Support (Runesage, Wardchanter, War Dancer, Hexchief, Warcaller) — single ally, defence, attack tempo, debuff, broad buffs.
E. Summoners (Beastcaller, Spiritcaller, Shadebinder, Forgecaller) — offensive, healing, disruption, durable construct utility. No companion actor or extra attack per turn.

Every batch: registry entries, common effect handling, actual trace tests, max-only tactical screen, recorded results and open defects. Do not tune lower tiers before the owner accepts endgame. Roll back bad tuning rather than merging a new meta.

## 5. All 31 candidate kits

These are proposed concrete adaptations of the approved identity system. Effects may be simplified or retuned based on evidence; not final implemented abilities. Fixed equipment and terrain profiles are sourced from the existing class registry and linked research.

| Class | Passive trait | Primary ability | Secondary ability |
| --- | --- | --- | --- |
| Blademaster | Disciplined edge — partial guard penetration on charged strikes only. | Sonic Cleave — high-impact dual-sword burst. | Brace — brief control resistance, uses a turn. |
| Linebreaker | Long reach — stronger interception at reach, weaker at contact. | Sweeping Thrust — bounded adjacent splash. | Pinning Sweep — short movement disruption of nearby foes. |
| Oathkeeper | Guardian — stronger adjacent physical interception. | Shield Strike — modest damage and brief guard opening. | Sacrifice — heals wounded ally at capped own-HP cost. |
| Grimwarden | Shadow bond — defensive reserve with lower pure mitigation than Oathkeeper. | Panther Strike — limited companion-themed offensive attack. | Dark Bulwark — temporary personal ward. |
| Trickblade | Opportunist — close-range pressure on exposed light armour, not intact shields. | Feint — opens guard on a valid hit. | Misdirection — bounded loss of enemy focus, not teleport or stun. |
| Longshot | Marksman — accuracy/impact after remaining stationary, poor close shooting. | Aimed Shot — powerful long-range shot. | Sniper's Focus — temporary aim gain at movement cost. |
| Flameweaver | Fire spread — effective adjacent splash, weaker isolated-target burst. | Flame Burst — limited area spell. | Fire Ring — short-range defensive area strike, takes action. |
| Gravebinder | Curse affinity — sustained pressure against already weakened foes. | Withering Curse — damages and weakens one target. | Grave Ward — temporary mitigation with explicit expiry. |
| Beastcaller | Familiar bond — steady companion-themed output, lower direct spell power. | Familiar Strike — bounded separate strike action, not extra unit. | Familiar Aid — temporary offensive protection or buff to caster. |
| Lifekeeper | Mercy — highest dedicated direct healing, lower damage. | Greater Mend — strong rescue of one wounded living ally. | Group Mend — limited weaker heals on up to three allies. |
| Runesage | Focused blessings — concentrated single-target buffs, no stacking. | Light Bolt — modest ranged attack. | Blessing — chooses offensive or protective single-target buff according to stance. |
| Grovewarden | Spell ward — greater magic resistance, less physical protection than Oathkeeper. | Ward Strike — modest shield-bearing attack. | Nature's Renewal — small self-heal or anti-magic ward. |
| Wardchanter | Protective songs — strong group defence, lower direct pressure. | Sword Cut — modest close attack. | Sheltering Song — temporary wards for up to three allies. |
| Swiftblade | Agility — better legal movement and evasion, lower burst than Nightblade. | Hamstring — damages and briefly slows approach/retreat. | Dash — advances through legal tiles, consumes action. |
| Windbow | Skirmisher — easier repositioning but lower single-hit power. | Rapid Shot — quick shot with shortened reach. | Evade — bounded legal retreat at action cost. |
| Frostweaver | Quick casting — reduced spell recovery, lower impact than Galescourge. | Frost Bolt — brief slow on a hit. | Ice Bind — short control, respects immunity. |
| Spiritcaller | Supportive familiar — utility-oriented hybrid, weaker direct damage. | Spirit Bolt — modest familiar-themed strike. | Spirit Aid — bounded nearby ally recovery. |
| Wellspring | Resilience — resistance to disabling effects, less raw healing than Lifekeeper. | Cleansing Mend — heal and remove specified harmful effects. | Sanctuary — short anti-control protection for one ally. |
| Dreadguard | Disruptive shield — protects allies while weakening attackers. | Dread Strike — physical hit with weakness effect. | Dark Bind — short control of an important attacker. |
| War Dancer | Battle rhythm — offensive tempo support, less pure defence than Wardchanter. | Twin Cut — close pressure. | War Dance — bounded offensive recovery/attack buff for nearby allies. |
| Nightblade | Lethality — stronger critical burst against exposed light armour, lower sustain. | Execution Strike — heavy close hit, never an automatic kill. | Deep Wound — bounded bleed on a valid hit. |
| Blackbow | Dead eye — greater shot impact with slower recovery. | Piercing Shot — strong shot opening guard on hit. | Last Shot — capped wounded-only burst at recovery cost. |
| Galescourge | Heavy casting — strongest isolated spell impact with longer recovery. | Gale Strike — single-target magical burst. | Life Siphon — capped self-heal from actual damage dealt. |
| Shadebinder | Disruptive familiar — utility against enemy carries, weaker direct damage. | Shade Strike — modest familiar attack. | Shadow Hex — targeted debuff with expiry. |
| Bloodsage | Blood rite — modest healing, strongest offensive melee sustain utility. | Battle Mend — direct heal and small offensive boon. | Blood Pact — capped melee-only damage-to-heal effect, no recursion. |
| Ragebreaker | Fury — bounded low-HP burst window, weak pursuit. | Rage Strike — powerful axe blow. | Last Stand — low-HP survival window, no invulnerability. |
| Ironfist | Totem discipline — stance trades mobility, damage or guard, never all three. | Disrupting Fist — close hit and brief control. | Totem Surge — bounded stance-specific temporary effect. |
| Hexchief | Seal affinity — effective disruption against clustered ability users. | Hex Bolt — modest magical attack with weaken. | Sealing Circle — limited area cooldown delay, no permanent silence. |
| Warcaller | Chant endurance — broad steady buffs, low personal offense. | War Bolt — modest ranged magic. | Battle Chant — stance chooses group offense or ward, up to three allies. |
| Scrapbreaker | Blunt expertise — effective against intact heavy protection, slow recovery. | Guard Break — hammer attack opens guard on hit. | Staggering Blow — bounded control, especially at close range. |
| Forgecaller | Construct bond — durable hybrid, slow approach and modest direct damage. | Construct Strike — hammer/mechanical themed attack. | Siege Pulse — delayed bounded area impact, never a separate extra actor. |

## 6. Max-only balance validation (release gate)

Use actual production resolver. STR141, DEX141, END129, Fighting52, all equipped S Masterwork, selected mastery/expertise/stance/Teamwork maxed. Same opponents and paired side orientations with fixed tuning seeds and independent holdout seeds. Existing 42-config clone screen (5040), 21 role-pair terrain screen (840), 9 dagger matchup screen (1080) for comparable baseline. Persist exact seeds, arena, roster, stance, ruleset, config, counts and results, including failed runs under docs/mechanics or research/mechanics. Retain all historic CI/PR evidence.

- Stage screen: 31 same-specialization team mirrors, 465 unordered specialization-pair matchups across 5 terrains, 4 seeds x paired orientations (18,600 nonmirror bouts), split into manageable CI batches; add more seeds only for promising or ambiguous cells. Pure stacks are stress fixtures, not required equally viable. No lower-tier balance work.
- Mixed teams: several distinct legal maxed templates (frontline, mobile, magic, sustain, pressure), substitute each class into a comparable-role slot rather than comparing mismatched role slots. Include double/three-class synergies and repeated-role stacks; evaluate marginal value of tanks/support/healers. Compare aggressive/balanced/defensive with independent holdouts and sample sizes, no forced roles, no opponent-aware terrain selection. Test all abilities in traces; record use rate, missed/blocked damage, effective healing, overheal prevention, successful movement, target changes, downtime, survivorship, timeout frequency and win rate by environment.
- Design gates (candidate directional checks, not rigid identical percentages): archers highly dangerous in open lanes but fail in confined spaces, daggers threaten light armour at contact and have clear shield/plate counters; mages threaten heavy armour but cannot ignore close melee pressure; each archetype has at least one plausible favorable and unfavorable matchup, same-family variants have meaningful differing tradeoffs, no universal best composition across holdouts. Strong terrain-specific superiority is desired, not 50% per cell. Investigate timeouts and normalized HP verdict bias instead of simply boosting damage or lowering round limit. Distinguish direct matchup from general mixed-clone performance. Do not claim exhaustive global optimum from finite samples.
- Freeze candidate configuration before holdout; do not reuse holdout to tune and claim independent evidence. Owner reviews numerical tradeoffs and remaining imbalance before release. All functional checks must pass regardless of balance results.

## 7. Player information and release

Keep main arena UI minimal. Existing info dialog (44px separate button, no class change/spend) displays actual class passive, both ability names and short effects, cooldowns in combat rounds, equipment, role, best and worst environments, strengths/weaknesses. Read-only; no extra skill menus or skill buttons. Generate actual ability labels/effects from registry, only tactical recommendation text authored separately. Never advertise a candidate ability as live. Expand developer trace/analytics for ability use only as needed; no per-round spam in arena. Test all 31 dialogs at mobile/desktop sizes, 7-member controls, no dropdowns, no resources, save compatibility, no unintended class selection, and exact committed rewards. Validate complete final head with all relevant CI workflows, main/open PR status and owner-approved balance gate before protected merge. Verify main and GitHub Pages separately. Mark completed tasks only after verification, preserve research report and checkpoints.

## Immediate next action

Implement stage 1 shared registry/effect/scheduler skeleton and explicit old-rule dispatch on the existing candidate branch, with tests for one action per turn, independent cooldowns, expiry, no illegal targets and golden v1/v2 trace/settlement. Then pilot ten-class family and evaluate the known dagger/tank defect. No gameplay source changed by this plan commit.
