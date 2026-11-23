# Active project tasks

## Activity difficulty and terrain — 2026-11-23

Activity grades and terrain — each activity has its own saved difficulty. Fighting rolls initiative and then arena terrain.

## Completed: combat durability and slot mastery — 2026-11-23

Health and armour readouts, hammer combat, automatic recovery, derived character level, material-funded F–S slot mastery and per-rank enchant tuning. Consumable repairs or reinforcement remain future work.


**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## GAME-006 — Skill-gated probabilistic encounters and resources
- **Goal:** Progress hunting, mining, gathering and processing outcomes within a single activity; players never manually choose creature, vein or ore quality.
- **Acceptance criteria:** Data-driven level thresholds and probability weights; low-tier results remain available; higher tiers grow more likely with relevant skill levels; crafting automatically consumes available real inventory ingredients without resource-lock toggles or fabricated stock; encounter difficulty respects combat ability; offline resolution uses frozen skill levels and scales over long absences; deterministic balance and rarity tests.
- **Status:** PARTIAL (PR #43 merged skill-weighted raw loot; PR #44 merged Smelting (its former protection mechanic was removed in PR #82); PR #54 merged ingredient-consuming Alchemy, Carpentry, Masonry and Cooking. Actual combat, encounter difficulty/risk and calibrated probability balancing are still not implemented).
- **Dependencies:** GAME-005, OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** chat (partial work merged in PRs #43, #44 and #54; combat and balance work remain).

## GAME-009 — Reversible race transformation design and implementation
- **Goal:** Eventually support one character beginning Human, able to become Undead and return to Human via resource-consuming rituals; no permanent race lock.
- **Acceptance criteria:** Race is distinct from class/profession and independent skills; ritual requires resources and roughly six cumulative days of actual ritual work (provisional), split freely across sessions; progress is saved indefinitely through breaks and unrelated activities; repeat transformations are possible, including reversal; no alts or permanently inaccessible skills; account/change-limit implications, exact costs, race effects, and offline ritual progression must be designed and approved before implementation.
- **Status:** BLOCKED (design agreed; implementation details and dependencies not yet decided).
- **Dependencies:** CHAR-001, OFF-001, future account/character persistence.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.
## GAME-010 — Higher-tier materials substitute lower quest requirements
- **Goal:** When quests are implemented, let players satisfy a lower-tier resource requirement using qualifying higher-tier inventory materials directly, without any material exchange or trading screen (e.g. Copper ore may satisfy a Stone requirement).
- **Acceptance criteria:** Explicit, validated tiers/eligibility map (not an arbitrary all-materials swap); quest acceptance and reward settlement preserve exact inventory balances, save correctness and idempotency; mixed lower/higher inventory, shortage, rollback and long-offline behaviour are tested; no extra conversion inventory or economy exploit. Specify substitution ratio, resource-use priority, confirmation UI and exact mapping with Owner before coding.
- **Status:** BLOCKED (owner-approved direction, but quests and exact material hierarchy/conversion rates are not specified or implemented; no quest substitution code authorized yet).
- **Dependencies:** Future quest system, resource tier ordering, INV-PROTECT-REMOVE-001 and OFF-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet.

## GAME-011 — True Fighting and Raiding combat events with matched illustrations
- **Goal:** Make combat the game's central power fantasy: build real autonomous, consequential and potentially brutal event-driven Fighting, distinct from hunting and from raid activities. Each actual strike, block, dodge, counterattack, hit, defeat or victory can display a corresponding original static illustration. Raids use their own multi-phase event system, rather than becoming Fighting.
- **Acceptance criteria:** Opponents of similar character power; independently testable hit/block/HP/outcome rules to be defined with Owner; event type and outcome select only matching images (never fake/random events); cooldown abilities without mana/stamina; equal time-based attribute XP principles; OFF-001 frozen offline effectiveness and unlimited time; a bounded retrospective instead of replaying every offline combat event; no forced clicks.
- **Status:** PARTIAL ([PR #103](https://github.com/janisp123/idle_game/pull/103) delivered the new **3d6 vs 3d6 initiative roll and separate opposed attack/defense 3d6 per automatic turn**, with the actual image and resolved outcome withheld until animated dice finish; duels are limited to six half-turns, three attacks per fighter, and the old Fighting work-cycle bar is replaced with six turn pips. The Heavy Swing wind-up now belongs inside its attack rather than wasting an entire turn. PR #102 cleaned unnecessary mobile explanations, hid the one-activity route, and dimmed the unavailable Skill Master. [PR #105](https://github.com/janisp123/idle_game/pull/105) added a truthful five-step progress bar directly below the arena painting, with attack/defense dice shown separately on every automatic strike, accurate current action and next-battle preparation. [PR #107](https://github.com/janisp123/idle_game/pull/107) added an **actual saved 11-slot armour equipment selector** with level-locked fixed presets (UI-only; no gear combat modifiers yet). [PR #109](https://github.com/janisp123/idle_game/pull/109) replaced the large Chronicle for **all activities** with compact real XP/resources/consumption and correctly sided damage/defense results; failed mining and healing remain future mechanics. [PR #111](https://github.com/janisp123/idle_game/pull/111) standardized 11 slots to **None/Robe/Leather/Plate**, with kg per piece and weapon, physical reduction, 3d6 evasion/dodge and encumbrance-penalized initiative plus old-save migration. [PR #113](https://github.com/janisp123/idle_game/pull/113) **superseded the Fighting-level equipment gates** with per-piece character **STR Plate / DEX Leather / WIL Mage Robe**, preserving previously worn gear and existing combat/offline snapshots; [PR #114](https://github.com/janisp123/idle_game/pull/114) fixed browser module caching. [PR #116](https://github.com/janisp123/idle_game/pull/116) now also lets every **confirmed activity-level advancement award one automatic STR/DEX/END/INT/WIL point** under existing activity weight splits, with new effective stats feeding those gear requirements and future combat snapshots. No change to opposed dice luck calculations or stat-hourly XP. Basic slot enchanting was implemented in [PR #118](https://github.com/janisp123/idle_game/pull/118), and [PR #125](https://github.com/janisp123/idle_game/pull/125) fixed the presentation of saved enchant +1 ranks and changed the two weapon styles to the same engraved card selection as armour, and [PR #129](https://github.com/janisp123/idle_game/pull/129) replaced the dual weapon/armour edit target with exactly **one selected slot** and one Enchant action plus clickable actual 50% chance/failure breakdown; advanced enchant-specific stat requirements remain PARTIAL/BLOCKED under GAME-013. **Magic resistance is future-only** and does not yet implement a spell counter; real travel speed and complete RPS balance remain separate. [PR #120](https://github.com/janisp123/idle_game/pull/120) now permits weapon-specific physical impact through successful blocks/parries (Heavy Swing 25%/35%, Thrust 10%/15%) and raises new-gear dodge thresholds while preserving the 3d6 bonuses; existing snapshots remain frozen. Earlier PR #100 contributed 12 original combat paintings; #98 added the two skill pairs. Remaining: exact opponent-power balancing, more unique art, true roll-free offline aggregate outcome summaries, further equipment effects/advanced balance, ability leveling, raid/clan battles and recovery.)
- **Dependencies:** GAME-006, OFF-001, [visual direction](brainstorm/COMBAT_VISUALS.md).
- **Added by:** chat.
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** chat (partial merged PRs #94, #98, #100, #103, #105, #107, #109, #111, #113, #114, #116 and #120; further combat effects/art/raid/clan/aggregate offline pending).

## GAME-012 — Slower work/switching and aggregate offline Fighting without per-battle rolls
- **Goal:** Separate cinematic live combat from efficiently settled offline combat. Owner requests no per-battle roll loops while away; the inactive fighter's frozen stats, combat style and opponent bands determine a bounded, simple result estimate. Slow the early-alpha default work cycle from 10 seconds to **1 minute per activity**, and make switching/travel/preparation meaningfully slower as well.
- **Acceptance criteria:** Centralize timing profiles and migrate unfinished saved progress without losing XP, resources, tasks or effective equipment; do not expose numeric countdowns in UI (UI-TIME-001); keep unlimited offline activity and Skill Master rules (OFF-001). Live Fighting retains actual turn-by-turn attack and defense dice, art and 6–6–6; offline Fighting performs **no individual attack/defense/finisher rolls for absent battles** and runs in bounded time even for decades. Do not fabricate victories, losses, kill totals or clan contribution; define and test an accurate aggregate formula before reporting such results.
- **Status:** BLOCKED (direction explicitly requested by Owner on 2026-11-22, but exact slower movement/preparation durations, offline result/penalty formula and compatibility approach remain undecided. Not implemented by PR #100 (art), #102 (mobile cleanup), or #103 (short live 3d6 duels); define offline aggregate formula and test the 1-minute timing-profile migration separately).
- **Dependencies:** GAME-011, OFF-001, ALPHA-TIME-001, SWITCH-TIMING-001, UI-TIME-001.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-22).
- **Implemented by:** Not yet.

## GAME-013 — Slot enchantments with escalating attribute requirements
- **Goal:** Later let a player enchant individually chosen equipment slots, while keeping the current four fixed armour families and their independent left/right selections. Enhanced Mage Robe parts should demand more Willpower; other enchanted pieces use their appropriate character attributes rather than a Fighting or activity skill-level gate.
- **Acceptance criteria:** Define and obtain Owner approval for enchantment ranks, any per-piece STR/DEX/WIL or other attribute increments, enchantment benefits/downsides, power caps, whether enhancements need resources or work time, persistence/unequipping rules, and interaction with combat, older V7 gear, offline snapshots and equipment limits. Do not silently implement a loot generator, enchantment database, extra global character levels, spells, crafting or PvP rules as part of this future task. Keep all eleven slots and the existing four families.
- **Status:** PARTIAL (Owner approved and implemented basic [GLORY-001](mechanics/ENCHANTMENTS.md) in [PR #118](https://github.com/janisp123/idle_game/pull/118): the current implementation adds one fixed slot rank per successful Glory Scroll; weapon +physical attack, armour +flat physical defense, 50% success/50% full rank reset, preserved V7 saves and XP-eligible actual victory drops. Future enchant stat requirements, enhanced effects/costs, spell types, hand-specific weapon slots and PvP balance remain BLOCKED.)
- **Dependencies:** GAME-011, OFF-001, EQUIP-STAT-001, later magic-system and balance decisions.
- **Added by:** chat.
- **Requested by:** Owner (2026-11-22).
- **Implemented by:** chat (basic fixed-slot Glory/enchantment alpha; remaining features not yet).
