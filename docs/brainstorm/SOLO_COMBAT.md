# Solo combat, skills and skull dice

**Status:** Living brainstorm — no implementation approved. Updated 2026-11-20.

## Newer direction: decisive, timed combat
- **Solo first:** one player character versus one monster, automatically fighting.
- Ordinary encounters should generally resolve in **two to five decisive landed hits**, rather than twenty tiny damage ticks. A giant axe or wolf bite that lands cleanly may cripple or kill. Don't enforce an arbitrary five-turn limit; misses and dodges extend combat naturally.
- Each skill/weapon has a **wind-up or casting period, an action/impact and a recovery period**. A hammer is devastating with slow recovery; daggers are faster. Combatants act according to their timelines rather than forced equal-speed turns.
- A mage casting Fireball with wand or staff is vulnerable; if casting is interrupted the spell **restarts from zero**. Fire magic penetrates armour and unlocks improved burning, including heating metal armour, as the skill improves.
- Combat text must be based on actual mechanical results: attack, dodge, block, critical hit, bleed, maiming, interrupt and defeat.
- Counterplay should be natural: mobile melee threatens vulnerable casters; fire threatens heavy armour; armour and shields mitigate suitable physical hits. Environment is equally important; see [Environmental combat](ENVIRONMENTAL_COMBAT.md).

## Newer direction: simple skills, no permanent build mistakes
- Characters have **two equipped combat skills**, not a class tree or manually allocated passive/active upgrades.
- A new skill may be learned from a book and starts at **level 0**; repeated automated usage earns skill-specific XP. Harder enemies yield more relevant XP than trivial ones.
- Each skill's active and passive perks unlock automatically as it levels. Unequipping a skill **preserves its earned level**.
- Selected skills determine valid **weapon categories** and compatible second skill choices: Fireball → wand/staff; Throat Cut → dagger; Frozen Arrow → bow; Heavy Crush → hammer.
- Matching skill categories (two damage, two support, etc.) could offer an efficiency bonus, while mixed roles remain viable. Balance values need testing.
- Players pick what to practice, **not the stat or perk outcomes**; if a style is weak, rebalance the game, not punish a player.

## Newer direction: three skull dice
- Current combat presentation: **three six-sided skull dice (3d6)** roll each combat turn, adding unpredictability and rare results for matching dice.
- Triple six (**6-6-6**, 1 in 216 for fair dice) triggers a special signature event. A 5-5-5 could trigger a brutal maiming move such as a bloody axe attack with severe bleeding. The combat engine must actually apply injury effects before the text announces them.
- **Historical conflict:** the earlier notes preserved below propose *3d7 rolled once per completed encounter*. This older proposal is superseded as a current brainstorm direction by *3d6 per turn*; exact dice weighting and bonus tables remain open.
- Dice playback cannot accelerate actual combat or create an advantage over offline players.

## Earlier brainstorming (retained for history; conflicting dice proposals noted above)

## 5. Encounters, mining, skills and recovery

**Direction**
- **One mining encounter contains multiple pickaxe swings.** One swing is not one successful mining result.
- Adequate tool/skill requirements make a material *possible* to mine, not instantaneous. Inadequate equipment cannot mine better material. Better skills/gear improve mining efficiency, speed and yield; even elite equipment still requires time.
- Hunting/combat similarly resolves as encounters followed by rewards and automatic repetition.
- Each character has **two active combat skill slots**.
- Skills trigger automatically, have **long cooldowns**, can fail, and improve through actual use. Skill levels improve success chance and effect/damage.
- **No mana** or equivalent skill-spending pool; powerful skills are primarily balanced with cooldowns and failure rates.
- **No potions anywhere in the game.**
- No natural healing **during a battle**.
- Between battles, everyone can recover health naturally. **Recovery** is a universal passive skill that improves through use and speeds post-battle healing. It does not use either combat slot.
- A stronger Recovery skill should improve how quickly the character returns to activity, **not** make an unwinnable fight winnable by healing inside combat.

**Open**
- Exact skill XP rules for failed attempts, cooldown durations, combat defeat/retry behavior, injury, and the threshold for resting.
- Whether each skill triggers on every available cooldown or has additional encounter conditions.

---

## 6. Fate dice, excitement and rarity

**Direction**
- Use **three seven-sided fate dice (3d7)** in the underlying mechanic. The dice can be represented as stylized fantasy dice; a regular physical cube cannot literally have seven faces.
- Each completed encounter/activity gets a roll. Results may influence yield, outcome quality or special events.
- **7-7-7** is an exciting recognizable roll; its probability is **1 / 343**. It is **not** itself a guaranteed legendary item.
- Truly rare rewards require additional independent chance checks or other carefully balanced requirements.
- Dice remain meaningful while offline and are resolved fairly via efficient mathematical sampling instead of millions of visual rolls.
- **One shared 3d7 roll per group encounter**; do not perform separate synchronized lucky-dice rolls for every party member. Distribute shared rewards afterward.
- Skill progression remains per character.

**Open / balancing**
- The exact chance and contents of 7-7-7 reward tables.
- The frequency of lucky moments must remain satisfying for someone who plays briefly without making legendary items commonplace after decades of automated farming.
- Group bonuses should reward cooperation without multiplying rare-drop opportunities by member count.
- Long-run rarity may need one-time unlocks, special sinks or non-repeatable collectibles; avoid inventing complex economy systems just to solve hypothetical issues.