# Progression and equipment slots

**Status:** Living brainstorm — no implementation approved. Updated 2026-11-20.

## Current direction
- **No loot sorting, no weapon/armour drops, no crafting.** Defeated monsters and activities supply XP, **upgrade materials and stackable enchantment scrolls**, not hundreds of replaceable equipment items.
- Use resources to **permanently improve equipment slots**. Avoid inventories filled with junk, vendor selling, rarity comparisons, weight or equipment replacement churn.
- Stats rise automatically **when the player is in the game and earned XP is applied**, not during their absence. Offline activity accumulates XP using the frozen level, stats, skills and effective gear saved at logout; no advancement influences offline outcomes. On return, settle first, then apply accrued XP and level/stat changes (OFF-001). Notifications explain practical improvements rather than ask users to spend stat points.
- **Two equipped skills** earn XP by use, including while offline, but their levels, effects and passive/active perks **do not improve or unlock until the player returns to the game** (OFF-001); no selectable skill tree or manual perk distribution.
- Switching skills is always reversible: previously earned levels remain, newly learned skills start at zero, and there are no irreversible “wrong builds”.
- Skills define compatible weapons. For example, Fireball needs staff/wand and a dagger-only skill cannot be paired with it unless a future compatible weapon explicitly exists.
- A matching pair of skill categories could grant efficiency; balance should reward specialization without invalidating hybrid role choices.
- Future race differences can be modest and designed for balance; first prototype uses just **Human**.

## Monster rewards: enchantment scrolls and the automated forge (Direction — 2026-11-20)

**Why hunt different monsters and bosses if equipment never drops?** Monsters and raids supply valuable **stackable enchantment scrolls** for permanently owned equipment slots. No gear-drop comparison, crafting, selling junk or sorting loot. Scrolls are consumables, not randomly rolled equipment. Different zones should offer meaningful farming incentives through scroll availability/grade, enemy difficulty, time, and natural terrain advantages.

### Slot enchantment rules

Example: the **left glove equipment slot** currently has **enchantment +5**. Applying a scroll attempts +6.

| Scroll | On success | On failure | Minimum time per attempt |
| --- | --- | --- | --- |
| **Normal** | +6 | +4 (lose one enchant level) | **5 minutes** |
| **Special** | +6 | stays +5 (no level loss) | **10 minutes** |
| **Blessed** | **+6 guaranteed** (100% success) | Cannot fail | **Undecided** |

- **Blessed scrolls drop from bosses**; bosses therefore have meaningful aspirational rewards.
- Normal and special scrolls may come from regular monster/zone farming; exact drop tables, rates and level restrictions are undecided.
- The slot is enchanted, **not a replacement glove item**. The interface should display slot enchantment clearly (e.g., `Left Glove +5`).
- Enchanting is deliberately slow: players cannot instantly burn through 100 scrolls or gain an advantage through faster clicking.
- The **forge may automatically queue repeated attempts**, including while the player is offline (older brainstorming). Each scroll consumes elapsed forge time. **OFF-001 takes precedence:** any resulting equipment enhancement must not alter the frozen combat stats during that absence; when and how pending upgrades activate on login remains to be specified.
- Server-authoritative timestamps and deterministic outcome recording must prevent speed-up, skipped animations, reloads, or clients from shortening the wait; a local prototype can model the same rules.
- The intention is **strategic destination choice and anticipation without manual chores**. The player farms a preferred area and watches gradual slot improvement, not piles of unwanted weapons.

### Fairness and safety to design

- Earlier brainstorming called equipment-slot upgrades *permanent*. **Open:** distinguish a persistent base slot upgrade from a *risk-bearing enchantment bonus*, or decide explicitly which level can decrease. Do not silently erase previous permanent investment.
- **Open:** normal/special success chances by enchantment level; whether a scroll is consumed on failure; scroll level bands; any enchant cap; blessed-scroll forge time; which monster/raid drops which tier; and how long-term offline settlement handles thousands of attempts.
- **Open:** a simple stop threshold/auto-forge protection rule so leaving normal scrolls running overnight cannot unexpectedly destroy a valuable enchantment level.
- Balance scroll success rates, time cost, and boss rewards with the **same combat/progression simulator**, checking expected slot progression per hour and value of each zone. Prevent one universal best farming zone.
- No pay-to-win scrolls or paid removal of forge wait times.

## Open balance questions
- What are equipment-slot upgrade costs, milestones and visual changes?
- How are materials obtained, spent and represented without an equipment loot economy?
- Does the engine use passive defenses that aren't one of the two skill slots?
- How do learning prerequisites and skill XP scale with dangerous enemies?
- Which exact skill pairs are supported in the first prototype?

See also [Solo combat](SOLO_COMBAT.md), [Automation](AUTOMATION_AND_OFFLINE.md) and [Environmental combat](ENVIRONMENTAL_COMBAT.md).