# Fighting and raiding visual events — owner direction (2026-11-21)

**Status:** Approved visual direction; event-driven combat/raid playback is **not implemented**. The first Fighting activity is a distinct progression path; today's alpha has no hit/block/damage outcome simulation.

## Distinguish visual systems

- **Ordinary work** (mining, cooking, study, etc.): a single original high-quality 16:9 painted tableau per activity, generally fixed after artwork is commissioned.
- **Fighting**: a sequence of distinct high-quality static paintings matched to **actual combat event results**, not an animation or a random slideshow. Examples: opponent confrontation, wind-up, strike, blocked strike, parry, dodge, counterattack, injury, victory, defeat, wounded retreat.
- **Raids**: also event-driven with multiple illustrations, but raids are **not** the Fighting activity. Raid phases could include approach, scouting, breach, confrontation, taking spoils, escape, defeat. Existing outlaw raid skills remain unchanged until raid events are implemented.
- **Hunting** remains a resource activity; even if it later gains animal encounters, it is not the same as matched-opponent Fighting.

## Integrity and implementation boundaries

1. The **simulation emits a typed combat/raid event** (with outcome, actor, target and optional scene context). Only afterward does the presentation select a scene with the corresponding event type and content. A successful hit must not show a successful block.
2. Keep the visual selection in an independent mapping from event type to available artwork variants. When new images are commissioned, add them to the registry without changing combat math, XP, inventory, or save logic. Repeated events may use multiple paintings but only **correct-type** paintings.
3. Events progress autonomously; the user remains a spectator and can close the game. No clicks per strike, no mana/stamina/energy requirements. Events must not change gameplay timing simply because an image takes longer to show.
4. A long offline absence cannot replay millions of individual scenes. The simulator resolves the activity efficiently and displays a bounded retrospective/report when the player returns, while the online view can present the currently relevant event art.
5. Author and optimize original paintings for the existing iron-and-parchment grimdark art style: 16:9, good mobile readability, local compressed assets, descriptive alt text. The commissioned face-off illustration can be the **opening** frame; event-specific paintings are future content.
6. No fake event-stream implementation: until combat rules exist, Fighting is transparently labelled a progression prototype and shows a **temporary existing battle illustration**. The generated high-resolution two-warriors face-off image is currently delivered in the chat, **not** bundled into GitHub Pages. It needs an actual verified repo asset before the site may claim to display it.

**Open for later approval:** opponent-power matching, actual hit/block logic, which ability determines a pictured event, recovery/death, raid state machine, rewards, and art/intensity options. Do not infer them from graphics alone.
