# Current working checkpoint

**Status:** Documentation/research project with an organized browser-game reference library and brainstorm. **No gameplay engine or running prototype is verified.**

**Current source:** Always inspect the current remote `main` revision and open PRs; this checkpoint is not a substitute for the canonical `main:docs/TD_LIST.md`.

**In progress:** No approved product implementation task. Research notes are **reference material only**, not selected equations or implementation requirements.

**Owner-approved rule (OFF-001):** **Offline earns XP/rewards with a frozen logout build; levels, skills and stats only increase when the player returns to the game.** Do not add XP-level boundary stepping to the offline estimator. See `docs/DECISIONS.md` and the architecture handoff; this rule overrides older research assumptions.

**Verified research scope:** Small separated RPG combat functions; online attack timing; comparative offline approaches (short seeded headless tests, direct statistical rates, slow full tick replay); reward/loot boundaries, long-duration settlement and idempotence concerns. Each approach has limitations and is **not proven in our own game**.

**Fast next reading step for combat/offline:** Follow `AGENTS.md` preflight, then the concise **Combat/offline handoff** in `docs/brainstorm/ARCHITECTURE_AND_BALANCING.md`. Consult the P17/P18 entries in `docs/USEFUL_EXAMPLES.md` selectively; do not reread or implement the full library. Exact external code locations are **not** in this public repository and must be supplied from the owner's separate private research index if needed.

**Blockers before coding:** Owner approval of a narrow first prototype and unresolved choices such as initial content scope, hit/damage formulas and skill rules. No task has been approved for execution in `docs/TD_LIST.md` as of the latest checked preflight; re-check rather than relying on this snapshot.

**One next action:** Propose the smallest self-contained combat prototype and its verification criteria to the owner; if approved, record a precise task in the canonical TD list and follow the branch/PR/test protocol. Do not start coding on the strength of research alone.
