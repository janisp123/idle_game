# Vision and prototype scope

**Status:** Living brainstorm — not approved implementation tasks. Updated 2026-11-20.

## Newer directions (2026-11-20)
- A truly idle **fantasy** RPG, rich in character identity and narrative—not merely a spreadsheet with levelling.
- **Focus on solo gameplay first:** human character, small enemy roster, no groups or accounts for the prototype.
- Fewer choices, no irreversible build errors; learning and practising skills shape the character.
- Initial character customization should be minimal: race/gender and a choice among original finished illustrations, not face sliders.
- Avoid pay-to-win and core automation as a paid upgrade.
- Future quest-driven personality traits (acquired through actions) are deliberately deferred until much later.
- **Open scope conflict:** earlier ideas below start with stone mining and bunny hunting; newer discussion proposes testing a human versus several increasingly dangerous monsters. Choose explicitly before implementation.

## Earlier brainstorming (retained for history)

## 1. Creative vision

**Direction — the heart of the game**
- A small, atmospheric, truly idle fantasy RPG. It is not intended to compete with games that have hundreds of skills, classes, and activities.
- The player can open the game at any time, leave it on screen as a pleasant thing to watch, or close it for years. Their character keeps making progress.
- **No arbitrary offline cap or daily-login pressure.** Even returning after 10–20 years should produce a meaningful account of accumulated progress.
- A few proven idle mechanics, presented with **beautiful static illustrated scenes** rather than cheap sprites, animated combat, or constant progress bars.
- Simple, readable, mobile-first UI; performance and reliability are priorities.
- Core engineering design rule: **always look first for the easier, cheaper-to-calculate, lower-lag, lower-bug approach**. Challenge complexity that doesn't improve the player's experience.

**Visual and gameplay principles**
- Use familiar, approachable idle-RPG loops but remove arbitrary offline limits and forced daily attention.
- Present activities using large dramatic illustrations, compact narration, and clear reward screens.
- Desired atmosphere: brutal grimdark gothic/industrial fantasy with an oppressive, mysterious mood.
- **Original IP only**: create our own visual designs, factions, equipment silhouettes, names, lore, interfaces and artwork; avoid reproducing identifiable copyrighted elements of other entertainment properties.

---

## 2. Smallest playable experience

**Direction**
- Initially only **two activities** and **two locations**:
  1. **Stone Mine** — mine **stone**.
  2. **Bunny Hunting Area** — hunt **bunnies**.
- Test the core loop and the feeling of the artwork before inventing a vast content system.
- Art should depict what is happening. Example: a powerful, rugged miner swinging a pick in a gloomy mine; during group mining, several workers cooperating (digging, pushing carts, loading stone).
- Hunting is the minimal way to test battles, skills, health and post-battle recovery.
- No need for additional classes, hundreds of materials, crafting chains or quests at launch.

**Idea**
- Later, add new zones, enemies, materials, activities and image sets primarily through configuration/content data.

---

## 10. Things deliberately not in the first version

**Direction**
- No sprawling skill tree or class roster.
- No dozens of locations, crafting chains, deep quest system, or highly detailed economy at the start.
- No character animation system, live sprite combat, or per-equipment artwork variations.
- No mana and no potions.
- No required online attention, manual repetitive clicks, or daily-login deadlines.

**Superseded / clarified**
- Earlier idea: offline auto-join the next eligible mining group. **Replaced:** online-only group joining, then up to seven days of continued participation offline.
- Earlier idea: all players roll separately and several need to hit 7-7-7 simultaneously. **Replaced:** one shared group roll.
- Earlier idea: always simulate every pickaxe stroke throughout offline periods. **Replaced as an architectural preference:** accurate, efficient event-based/bulk offline calculations.
- Earlier idea: use a conventional 3d6. **Replaced:** 3d7.

---