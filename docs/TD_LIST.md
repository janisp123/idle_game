# Active project tasks

**Canonical location:** `docs/TD_LIST.md` on remote `main`.

Only explicitly owner-approved tasks are included below. Discussion and brainstorm notes alone never authorize implementation.

For each task, use a stable ID, clear goal, acceptance criteria, status (TODO/PARTIAL/BLOCKED/IN_REVIEW/DONE), dependencies, **Added by: chat/cw/codex/Owner**, and **Implemented by: Not yet** until verified. Preserve task attribution when another agent edits it. Completed work belongs in `docs/CHANGELOG.md`, not indefinitely here.

## GAME-001 — First playable hunting/mining prototype
- **Goal:** Publish one browser-playable local prototype from the landing page's **Play Now** control. The character can select **Hunting (wolves)** or **Mining (stone)**; the selected task repeats automatically and is represented by an original static grimdark scene.
- **Acceptance criteria:** `site/play/` opens on phone or desktop after merge/deploy; two activity buttons work; XP, wolf hides and stone increase; local save survives reload; absence settlement has no time cap, never recalculates levels mid-absence and activates level-ups on return; switching tasks does not duplicate rewards; a one-day simulation shortcut provides immediate offline testing; essential assets and engine tests pass CI.
- **Explicitly excluded:** Real wolf combat/hit probabilities, HP/death, multiplayer, equipment, accounts, server save, trading, crafting and skill tree. Prototype rates are placeholders to be balanced later. Static original illustrations are first-pass vector artwork.
- **Status:** IN_REVIEW (implementation branch; awaiting full PR verification and owner merge approval).
- **Dependencies:** OFF-001 frozen-build progression; SITE-001 Play Now deployment.
- **Added by:** chat
- **Requested by:** Owner (2026-11-20).
- **Implemented by:** Not yet (branch work pending full verification and integration).

## SITE-003 — Painted 6–6–6 gate on landing page
- **Goal:** Replace the flat CSS-drawn hero with the owner-selected grimdark gate painting, retaining all website/game navigation.
- **Acceptance criteria:** Original approved image is included as a self-hosted asset, shown uncropped on desktop and phone, with meaningful alt text reflecting skulls and three sixes; no broken links; GitHub Pages validation passes; preserve the working Play Now and new-tab GitHub/Discord links.
- **Status:** IN_REVIEW (PR pending; not yet deployed).
- **Dependencies:** SITE-001, SITE-002, DICE-001.
- **Added by:** chat
- **Requested by:** Owner (2026-11-21).
- **Implemented by:** Not yet (pending verified integration into main).
