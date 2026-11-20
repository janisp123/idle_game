# Visual language — The Long Vigil

**Owner-approved direction (2026-11-20):** A grimdark illustrated fantasy game, with the action painting and the UI belonging to **one coherent art world**. This is not a brief for a modern flat dashboard, a colourful idle app or a simple vector-cartoon scene. Owner approved the concept images for wolf hunting, stone mining and the ornate interface; the exact physical implementation is iterative.

## The shared visual identity

- **Materials:** chipped black stone, dark forged iron, worn leather, scratched copper, charred timber, torn dark-crimson cloth and smoke-stained parchment.
- **Colour palette:** near-black `#090807`; dark umber `#201813`; worn copper `#70533c`; oxblood `#822b22`; aged gold `#bb925d`; parchment letters `#efdec4`. Add ash-grey and dirty brown in art, with warm torch highlights. No neon gradients or bright gamey colours.
- **Typography:** strong ornamental serif headings with practical highly readable labels and body copy. Keep critical values large enough on phones; do not bake informational text into image backgrounds.
- **Frames:** carved/stressed iron and stone, double borders, restrained rivets, sword or crest symbolism, narrow crimson banners for active state, visible pressed/focus states.
- **Painting direction:** original **high-detail dark-fantasy painted illustrations**, cinematic side-lighting, weathered believable gear, dirty textiles, smoke, fog, hard rim-light, grain/brush texture, cold backgrounds and warm accents. **No flat vector activity artwork**, no cartoon sprites, no animation and no copying outside media assets.
- **Character continuity:** use the same battle-worn bearded adult wanderer across activities where the character is visible. Shoulder-length dark hair, battered iron and leather, muted deep-red travelling cloak; heavy weathering and deliberate silhouettes. He carries a spear on the wolf road and a realistic pick when mining. The actions and environments change; the world and character language do not.
- **Format:** all main scene artworks should be **16:9 landscape**, matching camera height, contrast, and painterly finish. Frame focal actors towards opposing thirds so UI labels can remain legible. Do not crowd entire image with HUD text; HTML overlays own interactive labels and status.
- **Narrative honesty:** the prototype currently has simple timed wolf hunting, **not** real combat outcomes or HP/damage; keep presentation cinematic without claiming those features have been simulated.

## Standard activity tableau

**Hunting · The Wolf Road:** a cloaked, scarred hunter in ruined winter woodland faces a large threatening wolf or two; twisted boughs, distant collapsed stronghold, mist, cold moonlight, grime and worn armour. Tense confrontation, no need for graphic gore.

**Mining · The Hollow Mountain:** the same wanderer, cloak and rugged gear in a timber-braced, smoky stone mine. Physical pickaxe contact with rock, heavy dust, glowing iron lantern, iron cart and dangerous shaft depth. Orange torch rim light against cool dirty stone.

These tableaux are **static**; activity timing/progress stays in accessible HTML/JS outside the artwork.

## UI contract

- Desktop: character + choices at left, large artwork in centre, spoils/progress at right, chronicle below. Tablet/phone: readable stacking; artwork stays the dominant element.
- Two contrasting selectable activities, each with a clear state and keyboard `aria-pressed` value. The active state uses a restrained warm metal/red glow.
- The game is the player's project, not a marketing page. Use authentic descriptions and live stats; **do not fake HP, kill/death statistics, equipment or multiplayer features** in the first prototype.
- Never hide a necessary function behind an illustration. **Play Now** must continue to work from the landing page.
- Keep theme code easy to adjust: `site/play/game.css` holds baseline layout, and `site/play/iron-ui.css` holds the visual skin. Two action images are under `site/play/assets/`.
- Treat generated artwork and design prototypes as **assets to implement**, not screenshots to embed as the whole interactive UI. A generated mockup cannot replace real HTML buttons, responsive layout or accessibility.

## Next visual QA before integration

Compare both action paintings side by side at phone and desktop sizes; ensure the same character, rendering detail, lighting vocabulary and muted palette. Test readability, cropping, button states, accessibility, image loading and slow connection. Reject a generated painting that drifts into a cheerful or cartoonish style, however attractive alone.

**External reference boundary:** use the aesthetic qualities above, never copy identifiable characters, game UI artwork or licensed assets from another title.
