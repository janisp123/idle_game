# Clan system — approved direction and implementation boundaries

**Alpha exception (Owner, 2026-11-27):** ALPHA-CLAN-001 authorizes a clearly labeled single local test clan, automatic enrollment on login, and functioning bonuses before server. Candidate Ashen Covenant, Academy level 1 +5% Fighting XP, levels 2–6 +1 percentage point per upgrade (max +10%), one voluntary 100-coin donation per rolling real 24h, next upgrade costs 100 × current level, local irreversible treasury only. Existing progress settled before enrollment or upgrades; bonus multiplies active raid XP factor and obeys XP cap. No shared membership roster, balances, roles or server. These numeric values are provisional alpha tests, not multiplayer balance approval. Existing historical shared-clan constraints remain.

**Superseding owner decision (ARENA-ONLY-001, 2026-11-27):** future clans receive coin donations and spend coins exclusively on all upgrades. Material warehouse, resource donations, material prerequisites, and Activities navigation in this historical design are retired. No clan runtime or new prices are authorized here. Rework the historical plan against the coin-only game before implementation.

**Status:** Owner-approved design, 2026-11-25. Real shared clans are not implemented. The current browser-only alpha exposes a Clan entry with an explicit availability notice. This document governs subsequent account-backed implementation, not a promise that the current UI works online.

**Implementation handoff:** [CLAN_IMPLEMENTATION_PLAN.md](CLAN_IMPLEMENTATION_PLAN.md) maps screens, functions, data boundaries, pre-server work and later server integration. Prepare and test independently of rented hosting; no live multiplayer claim until integration is verified.

## Navigation and membership

Clan is a standalone top-level category alongside Activities, not a combat/survival activity or queue slot. Opening it shows:
- **Member:** current clan, member roster/roles, warehouse, donation availability, leader priorities, buildings and upgrade progress, and appropriate management actions.
- **Not a member:** search for clans and create a clan. Show cooldown and founding eligibility, with reasons if unavailable. Search and applications must reference real clans; no invented members or mock results in the live game.
- A character belongs to at most one clan at a time. One character per account remains CHAR-001.
- Founding requires at least seven days of play; the server verifies eligibility. Exact measurement of played days (distinct active dates vs elapsed time from first real play) is open. Recommended anti-dead-clan interpretation: seven distinct server-verified play days, not seven consecutive login streaks.
- Leaving a clan imposes a seven-day real-time cooldown, including offline time, on joining another clan **or creating one**. Clan departure must show the consequence before confirmation; no clan benefits or contributions during cooldown. Past donations stay with the former clan. Treatment of kicks, disbandment and account deletion is open; do not silently create a bypass.
- Leadership does not expire because of inactivity, rank, elections or automatic succession. The leader remains leader until explicitly transferring leadership. The owner alone assigns up to one Vice Leader, five Generals and fifteen Officers. Ordinary members have no assigned administrative rank. One leadership transfer must be atomic; leader departure requires transfer or an explicitly designed dissolution rule. Inactive leader recovery and precise delegated powers are undecided; do not implement automatic takeover.

## Donations and warehouse

The owner wants consistency, not the ability of a veteran to instantly fund a clan. While a member and online, a player can contribute resources once per day, within a per-player daily limit. Donate real owned materials from work, never manufactured goods or negative amounts. No accumulation of unused daily allowances and no bypass by switching clans. Server calendar boundary, cap size, resource-specific weighting, whether the daily allowance is per resource or shared, and any requirement to use only newly earned stock remain to be confirmed. Old stock can fund a contribution within the same daily cap; it cannot bypass that cap. No forced daily-login punishment, no automatic offline donations.

A successful donation atomically deducts personal inventory and adds the identical amounts to the clan warehouse. Warehouse resources become permanently clan-owned: nobody, including leader, vice, general or officer, can withdraw them into personal inventory, trade them or reclaim them on leaving. They are spent only on clan buildings/upgrades. Leader can publish resource priorities (e.g. stone, timber) as requests, not mandatory assignments. Display warehouse amounts, donation history, daily remaining eligibility, building needs and priorities. Keep limits and amounts authoritative on the server.

## Buildings

Many independently upgradeable clan buildings are a core goal. Candidate catalogue for design and economy testing, not yet approved exact effects: Clan Hall, Warehouse, Barracks, Training Grounds, Forge, Armoury, Watchtower, Fortress Walls, Infirmary, Kitchen, Granary, Hunting Lodge, Workshop, Library. Consider additional buildings as useful resource sinks. Use existing real resource categories (stone, timber, processed iron, mortar, rations, hides/leather, straw, fuel and related inputs); each activity should have meaningful contribution paths. Do not add pointless activities or duplicate item IDs merely for a building. Costs, requirements, bonuses, levels, construction duration, concurrency and permission to start/cancel upgrades must be designed and simulated before deployment. No personal withdrawals disguised as building benefits or upgrade cancellation refunds. Clan wars, raids, taxes, marketplace, upkeep or hunger are not approved by this design.

## Permanent Castle Warfare levels

**CLAN-WARFARE-001 (Owner approved):** in the proposed optional daily NPC castle defence event, defeat may remove only current-level Warfare XP, floored at zero. Earned levels never decrease; excess XP loss is discarded. The broader event remains a design proposal pending mechanics and implementation approval; see [castle brainstorming](brainstorm/GROUPS_AND_CLANS.md).

## Economy relationship

CAP-001 stops all rewards when the current XP bar fills. The prior 30% Skill Master tribute suggestion is a separate proposed change; it was discussed but not explicitly approved for implementation. No tribute change in CLAN-001. Simulate building progression with varied activity mixes, daily participation, high-stock veterans and lower-level members; test that consistent contribution matters, bottlenecks are meaningful, and no single player can trivially rush upgrades. No exact contribution caps, costs or building bonuses are settled yet.

## Required architecture and acceptance

The browser alpha stores editable localStorage progression; it cannot authenticate identities or securely share clan state. Before real clans, choose and implement account identity, server-authoritative inventory/time/settlement, secure persistence, authorization and deployment with owner approval. Never trust browser-reported balances, timestamps, ranks, founding eligibility or contribution eligibility. Do not migrate test stock into authoritative multiplayer inventory without explicit policy. No client secrets or privileged service keys in published assets. Use transactional, idempotent contribution and upgrade requests, durable ledger and server time; reject duplicates and concurrent overspends. Validate all permission boundaries on server, not just button visibility. Test two or more independent accounts, duplicate requests, simultaneous donations/building purchases, cross-clan cooldown, role caps, transfer, persistence/reconnect, warehouse conservation, impossible withdrawals and unauthorized operations. Real search, creation, membership and building changes are blocked until prerequisites exist.


ALPHA-CLAN-001 update (owner 2026-11-27): automatic donation of every tenth positive whole-coin arena reward after enrollment. No manual donation or daily cap; replaces the candidate 100-coin donation. Zero payouts, defeats, raid prizes, prior wallet and developer grants excluded. Persist reward cursor; apply before equipment spending and keep gross combat analytics, net wallet, and contribution report. Academy costs/bonus remain provisional. Offline settlement uses the same bounded exact fractional payout calculation. First candidate passed 210 unit tests but browser script had duplicate clan variable; corrected. New CI pending.
