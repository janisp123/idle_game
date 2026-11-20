# Artwork, interface and combat narration

**Status:** Living brainstorm — not approved implementation tasks. Updated 2026-11-20.

## Owner-approved visual update (2026-11-21)

- The landing page's former flat, CSS-drawn gateway is superseded by the **original painted Gate of the Long Absent**: brutal architecture, weathered iron, crimson cloth, skulls, distant ruins and three skull dice showing **6–6–6**. Keep the full image visible at mobile and desktop sizes.
- **DICE-001:** The maximum on each of the three skull dice is now **6**, not **7**. Historical 3d7/7–7–7 brainstorming below is superseded for our own game; when/how dice influence combat or offline bonuses remains undecided.
- Future illustrations should use consistent painterly detail and physical materials rather than low-budget vector scene art. This is an art direction, not authorization to add mechanics.

## Newer directions (2026-11-20)
- Original **grimdark fantasy** paintings: detailed, brutal, bloody, scarred, dark-metal and low-lit, inspired by the *mood* of classic fantasy combat art without copying protected artwork.
- Desktop combat shows **two large static illustrations facing one another**, with three skull dice between them and text beneath; mobile adapts to portrait format.
- **Let imagination supply movement.** No animated characters, sword swings or monsters. Rolling dice and very subtle UI state changes are enough.
- Wounds, dodges, critical hits, casting interruptions and effects must be **real engine states** before the text describes them.
- AI can help write a large curated library of descriptions during development, but no live language model is needed for each swing.
- Ordinary turns have concise descriptions; rare maiming or signature attacks get evocative detailed prose.
- Watching slowly, using faster playback or skipping to results only changes **presentation**, never battle completion time or rewards.

## Personalized illustrated combat stories and optional narration (Direction — 2026-11-20)

**Player fantasy:** Battles should feel like chapters in a brutal illustrated fantasy novel **with the player's character as the protagonist**. We deliberately compensate for the absence of character animations through excellent static artwork, slow meaningful attacks, suspense and evocative, personal writing. A first encounter with a wolf should be enjoyable to read, even though the text is pre-authored and reused.

### A scene that responds to how the character actually fights
- Every story is **prewritten and curated**, not uniquely AI-generated for each encounter. It may be assembled from coherent, authored sections selected by factual tags such as **enemy type, location/terrain, player's equipped two skills, chosen compatible weapon, skill mastery level, encounter history and actual action outcome**.
- **Every supported two-skill combination should feel narratively represented**: the story must describe both skills in plausible interaction. We should *not* author an entirely separate full novel for every possible pair. Use a small number of carefully written encounter openings, combination-aware transitions, skill-specific action passages and endings.
- **First encounter** with a monster may open with a longer, atmospheric introduction or special narrative. Subsequent encounters use concise alternate passages; genuinely new skills, rare dice events, boss fights, critical injuries, deaths or milestones unlock different moments. Avoid forcing the same long introduction on every repeated idle fight.
- **Stateful consistency is mandatory**: no describing a sword when the equipped weapon is a staff; no clean hit if the opponent dodged; no monster charging after being crippled; no victory narration on defeat. The simulator emits events and the narration layer selects *only compatible* passages.
- Battles are generally **short but slow and consequential**. Narrative timing and optional reading speed do not control the underlying attack clock; skipping the text must never accelerate combat or future rewards.
- The game should offer enough prose to create attachment, but never require players to read repetitive paragraphs to keep earning XP, materials or enchantment scrolls.

### Speaker button: listen instead of read
- Provide an accessible **speaker/play button** near the story that lets the player hear the same current narrative instead of reading it, with pause/stop and clear text feedback. Listening is optional.
- **Initial low-cost implementation idea:** use available **browser/device text-to-speech** (TTS) voices for pre-authored passages, avoiding prerecorded audio for every combination and avoiding a paid narration API per battle.
- Voice availability, pronunciation, quality, privacy implications and support for different languages/devices must be checked on target browsers. A silent text fallback is required. More polished narration can be investigated later without making it essential.
- User interaction can start speech where browsers require it; **never play audio automatically by default**. Narration can be skipped or stopped at any time.
- Audio should be synchronized to the **displayed narration events**, not secretly change simulation time. Do not create an incentive to listen faster or remain online.

### Smallest viable story test (design, not coding authorization)
- One human player, one giant wolf, two contrasting skill pairings (e.g. staff-based fire magic vs heavy hammer skill pairs), one environment, and a small curated set of scene/action/outcome texts.
- Demonstrate that each build produces a **noticeably different**, internally consistent personal encounter story using the same encounter engine, and that repeated fights do not become unbearable.
- Verify the speaker can read the displayed narrative aloud on mobile and desktop with a graceful unsupported-browser fallback.

**Open:** how many authored variants are enough, how the encounter/story history is saved, whether the narrator speaks in second or third person, how to handle events occurring while audio is still reading, and which supported languages/voices are feasible.

## Earlier brainstorming (retained for history)

## 3. Action scenes and mobile interface

**Direction**
- **Static, high-quality illustrations** are the primary activity presentation. One prominent image can represent the activity, plus optional distinct images for special events or skills.
- A skill such as **Crushing Blow** gets one dramatic, reusable impact illustration. We do **not** need an illustration for every class, weapon, item or gear combination.
- A short live activity log describes swings, discoveries, impacts, failures and completed encounters; rewards appear clearly, then the next encounter starts automatically.
- No character animations or continuously animated health/progress bars. The **three fate dice may be the one animation** if it adds enjoyment.
- Images need not change for every strike; change with activity, special skill or meaningful event.
- **Mobile portrait mode first**, comfortable with one hand, thumb-friendly actions and primary controls in reach, readable text, no crowded screens. Desktop can adapt without becoming the design target.
- Optimize artwork for normal phone resolutions rather than 4K. Use efficient formats (e.g. WebP/AVIF), local browser caching, and avoid downloading unnecessary images.

**Idea / caveat**
- A PWA could cache images on the device or optionally preload artwork. Browser caches may be evicted, so missing assets need a graceful reload path.
- A generated dark-mine/miner illustration from the 2026-11-19 chat is the visual-quality benchmark; it has **not** yet been committed to this repository.