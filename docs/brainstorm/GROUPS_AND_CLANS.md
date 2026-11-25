# Parties, NPC companions, cooperation and clans

**Status:** Future brainstorming only; **solo combat is the current focus**. Updated 2026-11-20.

## 2026-11-25 — Owner's castle and building proposals (not implementation approval)

The Owner proposed five distinct, independently upgradeable clan buildings:
- **Clan Hospital:** percentage improvement to recovery between fights. Recommend reducing the recovery interval, not combat action duration, damage or death risk. Current production reserves a 20-second recovery window in a 200-second bout (`site/play/combat.mjs`); measure actual productive time and reward effects before deciding the formula. Show the exact recovery modifier in the character stat/source view. A positive minimum recovery time is recommended.
- **Clan Barracks:** increases maximum membership slots with each upgrade. Starting capacity, slots per level and maximum remain open. Admission must enforce capacity atomically.
- **Clan Academy:** increases effectiveness of individual member activities by percentage, with independent research for every activity. Building upgrades unlock research progression; each activity must be researched separately to receive its own bonus. Research for Mining does not improve Fishing or any other activity. Exact meaning of effectiveness (resource output, work rate, skill XP, fighting/training-specific effects), research levels, costs, durations and caps are undecided. Preserve current XP reward-stop and frozen-effectiveness rules; do not silently grant bonuses earned while a character is offline retroactively.
- **Castle Walls:** increases castle defence.
- **Castle Archer Turrets:** increases castle attack power.
- Candidate material costs (not approved): Hospital — plank, leather, herb; Barracks — log, plank, straw, ration; Academy — plank, block, mortar, leather; Walls — block, mortar, stone; Turrets — log, plank, iron_ingot. Actual costs must be calibrated against current resource production.

### Optional daily castle defence — PvE

Owner proposal: each day the clan leader can enable one event in which savage NPC raiders from nearby woods attack the clan castle. The leader selects difficulty. Successful defence awards Castle Warfare XP; defeat deducts Castle Warfare XP. XP is floored at zero, never negative. Castle Warfare is independent of member Fighting skill and levels up separately. This is an NPC challenge, not a clan-versus-clan raid.

Recommendations for review:
- Do not automatically attack on skipped days or punish clans for declining the event. One event per clan per server day, not one per member; no banking or retrying a failed result.
- Resolve from a frozen castle snapshot and selected difficulty with a shared deterministic combat model. Walls contribute defence; turrets contribute attack. Include meaningful progression, difficulty tiers, clear win/loss criteria and a pre-event risk/reward preview. No simultaneous member logins required for the proposed automated challenge.
- `newXp = max(0, oldXp + signedXpChange)`. The floor is an Owner requirement; whether to lose already activated Warfare levels or only current-level XP on defeat remains undecided. Recommend protecting activated levels and applying loss to current progress, subject to Owner approval. XP curve, automatic versus explicit level activation, warfare-level benefits, tie handling, attack duration, difficulty scale, win reward and loss amount remain open. Do not invent permanent building destruction, resource theft, paid retries, mandatory repair/upkeep or member penalties.
- Make higher difficulty a genuine choice rather than a guaranteed optimal daily button. Simulate many runs over weak/balanced/strong wall and turret combinations; compare win rates, expected XP change, progression time and optimal difficulty by build. Test no negative XP, one settlement per daily event and no duplicate gain/loss under retries, concurrent leader requests or server restarts.

### Proposed placement and logical functions

| Clan screen | Display | Proposed operations |
| --- | --- | --- |
| Buildings > Hospital | level, recovery modifier, next upgrade cost | existing building preview/upgrade, read active recovery bonus |
| Buildings > Barracks | level, current/max members, next slot increase | existing building preview/upgrade, validate membership capacity |
| Buildings > Academy > Research | one row per activity, unlocked level, effectiveness %, exact research cost/progress | listResearch, previewResearch, startResearch, getResearchStatus |
| Buildings > Castle Walls / Archer Turrets | defence/attack contribution, level, next cost | existing building preview/upgrade, getCastleStats |
| Castle Warfare | castle attack/defence, Warfare level and XP, last result, daily availability, difficulty preview | getCastleWarfare, previewRaid, startRaid, getRaidResult |
| Character stats | active hospital/academy contribution and source breakdown | read authoritative effective modifiers; freeze at applicable settlement boundary |

Leader alone triggers the proposed daily event. Research/upgrade permissions are still undecided. State proposed: per-clan Warfare progress and immutable raid record (day key, unique event ID, initiating leader, frozen difficulty and castle stats, result, XP delta); per-clan/per-activity research state. All real mutations require server authority and idempotent transactions. Pure combat/XP/research rules, configuration, local fixtures and economy simulations can be developed before rented hosting once scoped and approved.

**Scope:** These are brainstorming proposals. No changes to the live game, ranks, donation rates, Skill Master, castle economy or server. The [approved clan design](../CLAN_DESIGN.md) and [pre-server roadmap](../CLAN_IMPLEMENTATION_PLAN.md) remain authoritative for implemented/approved scope. Further review and separate approval needed.

## More recent party ideas (not for first prototype)
- Automated NPC mercenaries fill party roles when there aren't enough real players. Offline real players may stay assigned; no synchronized logins needed.
- Proposed future combat party: **about seven members** (one tank, one healer, one boon/buff support, several damage dealers). The final party size is not decided.
- Real player teammates could give a bonus such as **+10% XP per real teammate**, but this needs a cap/stacking review before larger parties.
- Support must earn its party slot. Compare a buff specialist with another DPS using realistic win rates, survival and XP/hour rather than arbitrary feel.
- No player trades, gifts, markets or clan resource withdrawals that enable indirect player trading.
- Distinguish future **combat party size** from the older idea of a **20-player mining/hunting activity group** documented below.
- Future group mechanics must remain fully automated. **Do not implement these until solo combat works and is fun.**

## Earlier brainstorming (retained for history)

## 7. Cooperative mining and hunting

**Direction**
- Either activity can be done solo or in a **group of up to 20 players**.
- Group activity has its own cooperative illustration.
- Group encounters finish faster, but loot comes from a **shared reward pool**. Grouping should be beneficial overall, while rewards remain balanced.
- Group creator/leader sets:
  - **Equal loot sharing**, or
  - **Efficiency-based loot sharing**: a miner's basic efficiency = mining skill level + mining gear bonus. For hunting, use corresponding hunting efficiency factors.
  - **Minimum efficiency requirement** for joining.
- Loot rule is visible before joining. Do not silently change it on existing members.
- Group membership never requires real-time coordination. Members may remain and contribute offline.
- **Joining a group requires the player to be online.** No offline automatic matchmaking, no automatic joining an available group, and no offline invitation handling.
- An offline member may stay in their existing group for **up to 7 days after their last real login**.
- After 7 days offline, participation automatically expires and the character continues **solo indefinitely**, following their offline/default activity automation.
- A leader can kick a member earlier; that player reverts to their solo/default offline rules. Changing groups never resets the seven-day clock.
- No continuous per-player expiration timer is required; timestamps can govern the transition.

**Group location rule — Direction**
- Ordinary groups are tied to an activity/location. A leader cannot simply move the public group to another activity; they must leave/re-create or join a different group.

**Guild-follow exception — Idea needing reconciliation**
- Earlier discussion proposed an optional checkbox for guildmates to **follow a guild-member leader's activity change** as a special exception.
- If a guildmate cannot follow, remove them from that group and apply their normal offline rules.
- **Open:** reconcile that exception with the later and simpler rule that nobody can join another group while offline. Potentially defer guild-follow entirely until guilds exist.

**Open**
- What happens if the group leader leaves or becomes inactive? How does the remaining group behave?
- Whether equal split/efficiency split achieves “grouping always beneficial” at 1–20 members.
- How fractional resource shares are handled without creating duplication or lost items.
- How strict min-efficiency requirements behave if existing members change equipment after joining.
- Does a player remain assigned to a group if their own five-task queue switches activities? Define later.