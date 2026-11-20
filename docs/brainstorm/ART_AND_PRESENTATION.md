# Artwork, interface and combat narration

**Status:** Living brainstorm — not approved implementation tasks. Updated 2026-11-20.

## Newer directions (2026-11-20)
- Original **grimdark fantasy** paintings: detailed, brutal, bloody, scarred, dark-metal and low-lit, inspired by the *mood* of classic fantasy combat art without copying protected artwork.
- Desktop combat shows **two large static illustrations facing one another**, with three skull dice between them and text beneath; mobile adapts to portrait format.
- **Let imagination supply movement.** No animated characters, sword swings or monsters. Rolling dice and very subtle UI state changes are enough.
- Wounds, dodges, critical hits, casting interruptions and effects must be **real engine states** before the text describes them.
- AI can help write a large curated library of descriptions during development, but no live language model is needed for each swing.
- Ordinary turns have concise descriptions; rare maiming or signature attacks get evocative detailed prose.
- Watching slowly, using faster playback or skipping to results only changes **presentation**, never battle completion time or rewards.

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