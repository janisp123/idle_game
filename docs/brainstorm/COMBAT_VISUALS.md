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

## Combat is the centerpiece (owner clarification, 2026-11-21)

**Fantasy goal:** Not a tame training simulator. Combat should be the emotional climax of this grimdark RPG: real duels with severe, sometimes instantly decisive consequences. A perfectly landed blow against an unprotected target may result in a catastrophic wound, torn-off limb or fatal injury, and the opponent has the same potential against the player. Defense, position, armour, practice and real stat disparities decide *whether* such moments happen; not every strike should automatically be a dismemberment.

**Every meaningful fight moment deserves visual truth.** Distinct high-quality scene paintings can represent the confrontation, swings, evasion, blocked hits, clean hits, serious wounds, lethal finishes and aftermath. These are **not** GIFs, click events, or random gore slideshows. We should develop the event stream and its results first, then commission/attach appropriate image variants. The player can watch a striking sequence or leave the game running autonomously.

**Power fantasy with risk:** Weeks of training should make ordinary newcomers dramatically weaker. Uncapped skill/stats allow much older veterans to become fearsome; equally powerful opponents can still inflict terrible losses on each other. Avoid globally scaling every enemy to the player. When injury, defeat or character death are designed, do not silently impose permanent loss of years of progress; approve those rules separately.

**Noncombat as character-building pathways:** Mining, crafting, prayer, study, forbidden rituals and ordinary life can remain valid ways to train attributes and shape identity. Combat is their ultimate showcase rather than forcing everyone to grind the same five most-efficient tasks. Different mastered paths should offer distinct battle advantages (for example: gear, rites, abilities), but exact advantages are not yet approved or implemented.

**Status of current prototype:** The first Fighting card is a skill/attribute-progression activity only. It has no fake hit/block events, no opponent HP, and no risk of severed limbs. The art is one temporary battle tableau until real event-specific original illustrations are committed.
