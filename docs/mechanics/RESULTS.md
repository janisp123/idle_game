# Compact action results — implemented presentation

The owner replaced the entire large Chronicle in all activities with one small results strip beneath the action scene. This is **not a running log**. Each new resolved action replaces the last visible outcome; status messages have one restrained line rather than accumulating.

## Fighting
- Left column is **YOU**, right is **ENEMY**. The existing deterministic combat simulator decides who attacks and whose HP changes; the UI never assumes player-first initiative.
- Successful nonfatal hits show a **red `-N HP`** on the side whose HP was actually lost, using the real positive `event.damage`. Successful block, parry or dodge shows **BLOCKED / PARRIED / DODGED** on the defending side, without pretending damage happened. A miss shows **MISSED** on the attacking side.
- The 6–6–6 finisher carries `hpAfter:0` but the current event has no numeric `damage`. Display **FINISHED**, not an invented negative HP value. Initiative uses FIRST STRIKE on the winner's side; victory/defeat/stalemate are short status words.
- Explicit real `event.heals.player` or `event.heals.enemy` values, if a future approved ability emits them, can display green `+N HP` alongside a red hit. **The current simulator never emits heals.** No healing mechanics are added.
- The previous resolved result remains onscreen while initiative/attack/defense dice animate. Show the new result **only after** the existing reveal threshold; never leak precomputed future damage, painting, or win/loss early. The six-pip duel history and the five-step dice/action timeline remain.

## All other activities
- Read actual `settle` report objects rather than making up a per-action rate: positive `report.items` display green `+N material`; positive `report.gainedXP` displays green `+N XP`; actual consumed ingredients display red `-N material`.
- A report from multiple offline work cycles is one truthful **aggregate** summary, not a fabricated single-cycle yield. The existing capped skill XP means a full XP bar will not show extra `+XP` until the Master advances that skill.
- Pure XP training/leisure activities show earned XP without fictitious resources. When a completed work interval yields neither materials nor XP, show neutral **NO NEW GAINS**; it is **not** classified as `FAILED TO MINE`.
- Mining failures, healing skills, and their actual outcomes need separate approved game mechanics. The panel's colors and mapping are ready but do not invent either feature.

## Source of truth and persistence
- Mapping is pure `site/play/result-readout.mjs`; `app.mjs` renders its tokens. The visual results/notice are transient UI state, **not saved data**. No changes to `GAME_VERSION`, localStorage key, XP/loot formulas, combat RNG, opponent balance, offline settlement, actual XP or equipment.
- No new timers, counts, rates, narration history or server calls. Existing inventory and skill progress are unchanged.
- Tests: `tools/test_game_ui.mjs`, `tools/check_pages_site.py`; automated website validation plus manual phone visual check after deployment.
