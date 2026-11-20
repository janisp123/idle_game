# Parties, NPC companions, cooperation and clans

**Status:** Future brainstorming only; **solo combat is the current focus**. Updated 2026-11-20.

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