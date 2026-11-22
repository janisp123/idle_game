# Fighting and raiding visual events — owner direction (2026-11-21)

**Status:** Fighting already simulates real alternating attack/defense turns with two weapon styles. This feature branch adds **12 real original static WebP paintings** in `site/play/assets/combat/` and an action/actor/outcome selector in `site/play/combat-art.mjs`, including separate greatsword and sword-and-shield victories and defeats. Offline raid/clan battle simulations and a comprehensive per-opponent/event art library remain **unimplemented**.

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
5. Use original grimdark 16:9 WebP paintings stored locally, with descriptive alt text. The first 12 images now implement the duel opening, wind-up, matching attack/miss, trained guards and both weapon-style win/loss results. Some images are concept-sheet crops and can later be replaced with more detailed originals without touching combat math.
6. In Fighting, **show the event image in the main scene**. The Chronicle contains **event text, numeric attack/defense rolls and damage only**, never copied pictures or a repeated story paragraph above it. The duel strip may show a short action label and special skull dice, but not duplicate narration. Unillustrated new skills get the neutral arena tableau, not a false block/hit.

**Remaining work:** matching opponent power dynamically, persistent wounds/recovery, meaningful raid/clan mechanics, encounter rewards, player-selectable art intensity, and more distinct event variants. Existing hit/guard/damage and ability-art mappings are playable alpha mechanics; all balance remains provisional.

## Combat is the centerpiece (owner clarification, 2026-11-21)

**Fantasy goal:** Not a tame training simulator. Combat should be the emotional climax of this grimdark RPG: real duels with severe, sometimes instantly decisive consequences. A perfectly landed blow against an unprotected target may result in a catastrophic wound, torn-off limb or fatal injury, and the opponent has the same potential against the player. Defense, position, armour, practice and real stat disparities decide *whether* such moments happen; not every strike should automatically be a dismemberment.

**Every meaningful fight moment deserves visual truth.** Distinct high-quality scene paintings can represent the confrontation, swings, evasion, blocked hits, clean hits, serious wounds, lethal finishes and aftermath. These are **not** GIFs, click events, or random gore slideshows. We should develop the event stream and its results first, then commission/attach appropriate image variants. The player can watch a striking sequence or leave the game running autonomously.

**Power fantasy with risk:** Weeks of training should make ordinary newcomers dramatically weaker. Uncapped skill/stats allow much older veterans to become fearsome; equally powerful opponents can still inflict terrible losses on each other. Avoid globally scaling every enemy to the player. When injury, defeat or character death are designed, do not silently impose permanent loss of years of progress; approve those rules separately.

**Noncombat as character-building pathways:** Mining, crafting, prayer, study, forbidden rituals and ordinary life can remain valid ways to train attributes and shape identity. Combat is their ultimate showcase rather than forcing everyone to grind the same five most-efficient tasks. Different mastered paths should offer distinct battle advantages (for example: gear, rites, abilities), but exact advantages are not yet approved or implemented.

**Status after PR #94:** Fighting has deterministic HP, strikes, dodges, blocks, actual dice results, and named opponents. These outcomes currently affect its on-screen duel transcript, not persistent wounds, deaths or special loot. Its image is still one *arena backdrop*, and the exact-event art registry only maps engagement until original paintings are added. Offline progression uses frozen combat stats, derives only the current bout in bounded work, and does not invent retrospective kill counts. All numerical combat balance is provisional.
