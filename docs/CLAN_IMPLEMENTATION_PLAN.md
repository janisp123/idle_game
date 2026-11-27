# Clan development — pre-server work and server handoff

**Superseding owner decision (ARENA-ONLY-001, 2026-11-27):** future clans receive coin donations and spend coins exclusively on all upgrades. Material warehouse, resource donations, material prerequisites, and Activities navigation in this historical design are retired. No clan runtime or new prices are authorized here. Rework the historical plan against the coin-only game before implementation.

**2026-11-25 · CLAN-PLAN-001.** The Owner intends to rent a server later and wants everything useful prepared beforehand. This is the function map and staged implementation specification. [CLAN_DESIGN.md](CLAN_DESIGN.md) is authoritative for the approved gameplay direction; [DECISIONS.md](DECISIONS.md) records binding decisions; [TD_LIST.md](TD_LIST.md) tracks authorization and implementation status. Proposed names, permissions, costs and schemas below are recommendations, not deployed features or new owner decisions. Do not start renting, selecting a paid provider, or importing alpha player data on the strength of this file.

## 1. Current state and development boundary

- The static browser alpha has an expandable Clan section beside Activities in `site/play/index.html`, with a truthful unavailable message and disabled search/create. PR #170 merged cd4e93d; Pages 45631544350 validation and publish passed.
- `site/play/engine.mjs` settles normal and offline activity rewards and CAP-001. `loot.mjs` and `production.mjs` own real item outputs and input-limited recipes. The browser currently stores mutable local data. None of that storage is an authoritative account, inventory or clan database.
- A future server is not needed to design screens, create fixtures, implement/test pure clan rules, write API contracts, develop a local database-backed test service on a development computer, or simulate building costs and member participation. It IS needed for publicly shared, persistent, trustworthy membership, player balances and transactions. Local test service work must not imply that shared live clans exist.
- Do not connect local test balances to production clans. Do not introduce a hidden admin endpoint, public test identity, client credential, fake public roster or client-authoritative clan mutation. Developer simulations stay outside `site/`. Public UI should retain the unavailable state until the actual service passes integration and release gates.

## 2. Screen and function map

Clan is a **top-level expandable section**, not a work activity, skill, or wagon. Proposed navigation should match existing mobile portrait UI; each screen returns to Clan without interrupting the character's current activity.

| Screen / location | What the player sees | Actions / logical functions | Eligibility |
| --- | --- | --- | --- |
| Clan root | Current membership, clan name or no membership; availability, relevant cooldown | `getClanHome`, open appropriate screens | Everyone; offline alpha explicitly unavailable |
| No clan > Search | Real clan list, name search, details, membership status | `searchClans`, `getPublicClan`, `requestMembership` | Browse even during cooldown; actual joining restricted |
| No clan > Create | Name, founding eligibility, rules, cooldown and confirmation | `getFoundingEligibility`, `createClan` | No clan, >=7 days of play and cooldown expired |
| Current clan > Overview | Clan identity, leader, roster count, resource priorities, building summary | `getClanOverview`, open subpages | Member |
| Current clan > Members | Members and assigned ranks, contribution history if authorized | `listMembers`, `getMemberDetails` | Member; privacy fields limited |
| Current clan > Donations | Personal eligible stock, clan needs, daily allowance used/remaining and exact preview | `getDonationEligibility`, `previewDonation`, `donateResources` | Online member, once per day, positive valid quantity, within daily cap |
| Current clan > Warehouse | Exact stock by actual item ID, incoming contribution and building-spend history | `getWarehouse`, `listWarehouseLedger` | Member with read authorization; no withdrawal action exists |
| Current clan > Buildings | Many separate buildings, current level, next level requirements, stock coverage, status and possible benefits | `listBuildings`, `previewUpgrade`, `startUpgrade`, `getUpgradeStatus` | Member reads; authorized rank writes, pending permission decision |
| Current clan > Priorities | Leader's requested materials and suggested producing activities | `getPriorities`, `setPriorities` | All members read; leader writes, delegation undecided |
| Current clan > Management | Pending join requests, rank slots, permitted moderation actions | `listApplications`, `resolveApplication`, `assignRank`, `removeRank`, `removeMember` | Leader and explicitly delegated roles only; precise powers pending |
| Current clan > Leadership | Current leader, eligible successor, explicit transfer confirmation | `previewLeadershipTransfer`, `transferLeadership` | Leader only; no automatic inactivity succession |
| Current clan > Leave | Clear loss of clan access, irreversible old donations, seven-day rejoin/founding lock | `previewLeave`, `leaveClan` | Member; leader must resolve leadership first |

Names in backticks are logical operation names, not existing exports or HTTP endpoints. Exact join application vs open membership flow, search filters, clan naming/capacity, identity fields, rank powers and moderation rules require owner confirmation. A draft frontend adapter can use these operations independently of the eventual transport. For previews use explicit developer fixtures, never public pretend data.

## 3. Proposed separation of code and data

| Location / responsibility | Proposed placement | Can prepare before renting? |
| --- | --- | --- |
| Existing live game progression | Reuse `site/play/engine.mjs`, `loot.mjs`, `production.mjs` through audited shared imports | Yes; preserve production formulas and CAP-001 |
| Pure clan domain (policy, validation, eligibility, role limits, ledger deltas, upgrade requirements) | New `shared/clan/` or equivalent server-compatible ES modules; no DOM, network, localStorage, provider SDK or implicit clock | Yes; choose layout in approved coding task |
| Browser clan display and adapter | New `site/play/clan-ui.mjs` and clan service adapter; existing Clan entry in HTML, reuse game styles | Yes; unavailable default, mock adapter in tests only |
| Building definitions and donation policy | Versioned data/config owned by domain; import actual item IDs from game catalogue | Yes after numeric design is approved; provisional scenario configs only in simulator |
| Test fixtures and economy simulations | `tools/simulation/` and dedicated clan regression tests outside public site | Yes |
| Server endpoint handlers and persistence | Future `server/` or equivalent, invoking shared domain and real transaction layer; never publish privileged code in Pages | Yes for local implementation and testing after architecture approval; public deployment later |
| Runtime deployment configuration | Server-private environment, database, TLS, health checks, backups and restoration | Plan now; actual hosting requires rented service |

Use a single source of truth for gameplay formulas and policy. If a shared module cannot be served by GitHub Pages at its source location, use a reviewed packaging step or suitable public pure module path; do not duplicate domain logic. Pass clock and randomness explicitly for deterministic tests. The client renders authoritative results rather than deciding state transitions. A pure function may return proposed inventory deltas and validation errors; only the authoritative transaction commits them.

## 4. Data ownership and invariants

Conceptual records (not finalized database schema):

| Entity | Essential fields / invariants |
| --- | --- |
| Account/character | Server-generated immutable IDs, authenticated owner, one character/account, first play evidence, verified active-play record, progress version, current clan ID or null, cooldown-until |
| Clan | ID, validated name, leader member ID, created time, state/version; at most one clan per character |
| Membership | Clan ID + character ID, join time, rank; one Leader, max one Vice, five Generals, fifteen Officers, ordinary member; leader/roster integrity |
| Application | Applicant, target, status, created/resolved time; membership and cooldown rechecked on acceptance |
| Resource priority | Clan, real item ID, priority/rank, updated by/time |
| Personal inventory | Authoritative nonnegative integer quantities of known item IDs; reuse real game settlement |
| Warehouse | Clan ID + item ID, nonnegative integer quantity; no owner withdrawal or trading mechanism |
| Daily donation record | Player ID + server-defined day key, clan ID, accepted quantities and rule version; unique daily contribution guard per player, not per clan |
| Immutable ledger | Operation ID, actor, clan, time, item deltas, operation type, linked donation or upgrade; append-only for accounting |
| Building | Clan ID + building ID, completed level, state/version; all levels monotonic except explicitly approved repair rules |
| Upgrade | Building ID, target level, frozen recipe/rule version, consumed quantities, start/completion times and status; one approved completion per operation |
| Idempotency record | Actor, operation type, request ID, request hash and authoritative result; duplicate retries cannot create additional effects |

Store UTC timestamps. Server chooses daily boundary and eligibility policy; do not use client timezone, alpha clock or client-reported active dates. Preserve seven-day *elapsed* cooldown separately from the not-yet-finalized meaning of seven days played for founding. Validate roles, membership and eligibility on every mutation, including concurrent operations. Leadership stays permanent until an explicit authorized transfer; no inactivity succession. The leader must not silently orphan a clan by leaving.

### Proposed mutation contract

Every mutation authenticates identity from the session, validates operation and version, rejects unauthorized/rate-limited/replayed or malformed requests, settles authoritative player progress if necessary, rechecks current state under transaction, commits all related changes atomically and returns the updated authoritative view or a safe error. A timeout/retry with the same request key returns the original result, not a second donation. Reject a reused request ID with different data. Do not trust supplied player IDs, clan roles, stock, level, timestamps or donation eligibility.

- `createClan`: enforce founding eligibility, no membership and cooldown; create clan and leader membership in one transaction.
- `requestMembership` / `resolveApplication`: require actual clan, valid membership transition and cooldown; simultaneous acceptances cannot create dual membership.
- `leaveClan` / `removeMember`: atomically sever membership and applicable permissions, retain warehouse and history, enforce approved cooldown policy. Kicks/disbandment behavior is still open.
- `assignRank`: enforce leader authorization and slot caps atomically; no self-promotion or rank escalation. Exact removal and delegation authority remains to be specified.
- `transferLeadership`: explicit leader confirmation and same-clan successor; preserve exactly one leader in a single transaction. Old leader's resulting rank and consent are open.
- `donateResources`: one confirmed online contribution per player/day; validate quantities and approved allowance, settle owned resources, debit personal inventory and credit warehouse equally, record contribution and ledger together. Reject empty/negative/fractional/overflow/unknown item quantities and repeated daily claims.
- `startUpgrade`: enforce building requirements/permission, debit only clan warehouse, persist the upgrade with exact cost; competing requests cannot overspend. Completion uses server time and is idempotent. Do not authorize cancellation/refunds or construction concurrency policy until approved.
- There is deliberately **no** warehouse-to-player withdrawal operation, no paid advantage, and no clan tax or automatic transfer of player stock.

## 5. Existing material supply and building design

Source audit of main cd4e93d, `ACTIVITIES`, `LOOT_TABLES` and `PRODUCTION_RECIPES`. These are real current inventory IDs, not newly proposed currencies.

| Activity | Actual possible outputs | Potential construction relevance (proposal) |
| --- | --- | --- |
| Mining | stone, limestone, iron_ore | Foundations, walls, smelting, mortar |
| Woodcutting | log, fuel | Timber structures, workshop and processing |
| Hunting | hide, meat | Leather, supplies |
| Fishing | fish | Rations |
| Foraging | herb | Rations; infirmary ingredient only if designed |
| Farming | grain, straw | Rations, roofing/bedding |
| Smithing | iron_ingot (consumes iron_ore) | Metal reinforcements, forge, armoury |
| Construction | mortar (limestone + fuel), plank (log), block (stone), leather (hide) | Processed construction materials |
| Cooking | ration (grain, meat, fish or herb) | Kitchen, barracks supply |
| Fighting / Training | No material output; Fighting earns arena coins | No material donations generated by these skills |

Loot tiers replace rather than add outputs, and crafting requires actual inputs. Avoid assuming every cycle yields every material. Each skill stops rewards at a full XP bar until Master advance (CAP-001). The live Master still takes all owned outputs of the advancing skill; 30% tribute was proposed, **not implemented or finalized**. Compare both tribute models in offline simulation before recommending changed mechanics. Never add duplicate items to represent donation groups. Arena coins are not clan building materials under the agreed direction.

Candidate catalogue from CLAN_DESIGN: Clan Hall, Warehouse, Barracks, Training Grounds, Forge, Armoury, Watchtower, Fortress Walls, Infirmary, Kitchen, Granary, Hunting Lodge, Workshop and Library. Give each a separate design row with ID, purpose, level range, prerequisites, material cost by level, build duration, exact benefit and affected gameplay modifier, upgrade permissions and tests. Prefer a broad catalogue of useful buildings over decorative copies of the same bonus. Multiple levels per building are required; actual names/costs/effects/capacity/limits remain open. Building bonuses must not erase weapon/terrain counterplay, circumvent CAP-001, create personal withdrawals, introduce upkeep or make solo progression nonviable.

**New owner brainstorming (2026-11-25):** [Castle and activity research proposals](brainstorm/GROUPS_AND_CLANS.md#2026-11-25--owners-castle-and-building-proposals-not-implementation-approval) define Hospital recovery, Barracks capacity, independent Academy research, Walls defence, Archer Turrets attack, and optional daily leader-triggered NPC castle defence with signed Warfare XP and a zero floor. CLAN-WARFARE-001 additionally requires earned levels to remain permanent: defeat subtracts only from current-level XP and discards excess at zero. Tests must verify repeated defeats never lower the level. The linked screen/function map and test scenarios extend P1/P2 design work only. Exact effects and PvE mechanics require approval before adding to P3 or server integration; no PvP authorization.

**CLAN-TEST-001:** the developer-only scenario lab in `tools/simulation/clan-fixtures.mjs` supports synthetic player creation, admission, departure/cooldown, ranks/transfer, online status and donation/warehouse tests. Run the example via `node tools/system-lab.mjs --config tools/simulation/clan-example.json`. This is explicitly a fixture, not production clan logic; capacity, donation cap and unresolved policies are test inputs/choices. No server, player saves or live UI needed. Extend with real engine settlement and approved building rules later.

## 6. Order of work before renting a server

| Stage | Deliverable and acceptance | Status |
| --- | --- | --- |
| P0 | Approved clan requirements, screen/function map, source-backed resource catalogue and outstanding decision list | This document; no runtime change |
| P1 | Review exact roles/permissions, founding metric, cooldown edge cases, joining flow and capacity; lock rules in DECISIONS | Next design discussion |
| P2 | Design donation policy and building catalogue with level-by-level candidate costs and benefits; run economy scenarios based on actual engine output | Prepare offline; approval needed before applying numeric rules |
| P3 | Pure domain rules and unit tests: founding, cooldown, ranks, membership, donations, ledger and building upgrades; injected clock and policy | Can code/test without rented server once scoped and approved |
| P4 | Mobile UI screen flows with isolated fixtures, accessibility, disabled/empty/error states, exact previews and confirmations; real public UI remains truthful | Can code/test offline once scoped |
| P5 | Provider-neutral API contract and data schema, local account/persistence service, migration/transaction and concurrent-client integration tests | Can develop locally after architecture approval; not dependent on rental |
| P6 | Security, resource usage and reliability review: server authority, data privacy, request limits, test suite, deployment checklist, backup/restore rehearsal | Local rehearsal before deployment |

For economy testing use production imports, normal timing not alpha speed, representative clan sizes (scenario inputs, not membership limits), mixed activities, newbie/veteran stock, participation rates, daily vs weekly claims, idle cap and both tribute variants. Test single-resource bottlenecks and processed input competition, compare building upgrade pace across member counts, no stock bypass, and sustainable maintenance-free play. Report time-to-upgrade distributions, daily supplies/demand, unused allowance, shortages, individual contribution share, and actual test seeds. Never infer exact donation cap or upgrade costs from the test alone; propose options for Owner approval. No requirement for every member to log in every day.

## 7. When the server is available

| Stage | Concrete implementation/release gate |
| --- | --- |
| S1 | Confirm provider, budget, OS/runtime, DB and backup plan; select minimal deployment topology suited to this noncommercial hobby. No cost or provider assumed. |
| S2 | Deploy authenticated account/character persistence in a private staging environment. Verify session lifecycle, server time and authoritative settlement against the actual game engine. Decide separate alpha/production inventory policy. |
| S3 | Connect clan endpoints to authoritative identity, transaction layer and shared storage. Run two or more independent clients through create/search/join/leave/transfer and role restrictions. No client-provided balances. |
| S4 | Enable warehouse and donation integration, building transactions and upgrade settlement under approved configurations. Verify concurrency, duplicate request rejection, exact ledger conservation, role checks, cooldown, server restart and reconnect. |
| S5 | Connect frontend service adapter, test mobile/desktop actual accounts, inspect network errors and permissions. Keep availability gate closed until staging tests pass. |
| S6 | Rehearse backups, restore and rollback; configure TLS, secret storage, rate limits, minimal logging/monitoring and resource limits. Review costs and security. Owner authorizes release. Publish feature availability only after live multi-account verification. |

Do not run continuous ticks for dormant accounts; prefer bounded settlement on demand, in line with OFF-001/CAP-001, and measure load. Exact host size, stack, database, account sign-in mechanism and migration are not decided. Free game commitment FREE-001 remains permanent. Real data retention, account deletion and privacy policies require explicit decisions before public accounts.

## 8. Decisions that must not be silently filled in

| Topic | Owner decision needed |
| --- | --- |
| Founding eligibility | Seven distinct verified active days or seven elapsed days after actual first play; what counts as playing |
| Membership | Clan member limit, unique name rules, open/invite/application flow, kick/disband cooldown, leader departure and inactive leader handling |
| Rank matrix | Exact Vice/General/Officer permissions; who can invite, approve, remove, assign roles, set priorities and start upgrades |
| Leadership transfer | Successor consent, old leader rank, confirmation and recovery procedure |
| Contribution | Exact daily cap, aggregate vs per-resource allowance, server day boundary, single submission vs partial allowance use (approved direction is once daily), old stock vs newly earned resource eligibility |
| Building catalogue | Effects, levels, costs, prerequisites, timers, construction concurrency, cancellation and warehouse capacity |
| Economy | Skill Master tribute proposal (30% vs current 100%); whether clan bonuses influence skills and how offline frozen effectiveness applies |
| Infrastructure | Authentication, authority boundary, stack/database, migration/reset policy, server capacity, privacy/deletion, backup/restore/release approval |

**Next action:** discuss and approve P1 and P2 design decisions incrementally. Start building offline pure rules, fixtures and UI prototypes in separately approved batches; no need to wait for rented hosting. Server deployment is a separate later task, not an assumed blocker to all development.
