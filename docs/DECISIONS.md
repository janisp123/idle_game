# Durable owner-approved decisions

| ID | Date | Approved by | Decision | Status |
| --- | --- | --- | --- | --- |
| PRO-001 | 2026-11-18 | Owner | Common path `docs/TD_LIST.md` and shared project files across repositories. | Active |
| PRO-002 | 2026-11-18 | Owner | `chat`, `cw`, `codex` name distinct agent workflows. | Active |
| PRO-003 | 2026-11-18 | Owner | Read current remote TD before action; verify PRs, checks and handoffs. | Active |
| PRO-004 | 2026-11-18 | Owner | Bare “continue” is read-only: inspect/resume-plan/ask approval; “continue and implement” proceeds only within an already approved scope; “check status” stays read-only. | Active |
| LIB-001 | 2026-11-19 | Owner | The public `idle_game` repository serves both as our game project and a broadly useful browser-game implementation library, including techniques we will not use. Mark our game's relevance separately from general educational value. | Active |
| LIC-001 | 2026-11-20 | Owner | Original repository software remains publicly viewable and available for private noncommercial hobby use; **all public playable games using copied or derivative original code require written permission**, including free browser games, mobile apps and storefront games. General commercial use also requires permission. | Superseded by LIC-002 |
| LIC-002 | 2026-11-20 | Owner | Replace the custom noncommercial/public game restrictions with the standard MIT License for this repository. Allow reuse of original source code, including commercial use, subject to MIT attribution/notice requirements. | Active |

| OFF-001 | 2026-11-20 | Owner | **Levels, stat increases and skill improvements apply only when the player enters the game.** During any offline interval, combat and activity efficiency use the exact character skill levels, stats and effective equipment at the last logout/saved snapshot. XP, loot and activity results accumulate but earned XP does **not** increase combat effectiveness until the player returns and the settlement is applied. Never recompute offline combat rates at XP/level thresholds. If an automated offline equipment action exists later, its combat-effect activation must wait until return; do not secretly upgrade frozen combat stats. | Active |

| SITE-001 | 2026-11-20 | Owner | **Every playable build must be accessible directly from the project's GitHub Pages landing page through a prominent `Play Now` button.** After the owner approves and merges a playable build, its HTML/JS/CSS must be deployed with `site/` and be testable immediately in-browser without downloading or opening HTML files locally. The button must lead to the actual deployed game. Before any playable build exists, it must remain visibly disabled and clearly labelled not yet playable; never ship a dead or misleading Play Now link. | Active |

| MVP-001 | 2026-11-20 | Owner | First playable test uses **one character, two selectable automatic activities (hunting wolves and mining stone)** and original static grimdark scenes instead of animations. Browser-playable under the landing page's Play Now button, with local saves and offline catch-up. This is a narrow prototype: no accounts, multiplayer, full hit/damage/HP/death combat or equipment yet. Exact reward rates and artwork can be improved after testing; OFF-001 and SITE-001 remain binding. | Active |

| SITE-002 | 2026-11-20 | Owner | All **GitHub and Discord links** on the landing and playable game pages open in a **new browser tab** with `target="_blank"` and `rel="noopener noreferrer"`; internal navigation such as Home, Play Now, and page sections stays in the current tab. Apply this convention to future website and game UI revisions. | Active |
| VIS-001 | 2026-11-20 | Owner | Use a **consistent, detailed, original painted grimdark visual direction** for all action scenes and the actual gameplay UI: dark distressed iron/stone, oxblood cloth, worn parchment, grounded armour, harsh cinematic lighting, atmospheric environments, and matching character identity. The approved interface mockup is a **reference**, not a substitute for responsive HTML/CSS or functional controls. Avoid simplistic vector placeholder images as the finished visual direction. | Active |

| DICE-001 | 2026-11-21 | Owner | The three skull dice have a **maximum face value of 6 each**, making **6–6–6** the maximum combination and the visual motif. Earlier 7–7–7 / 3d7 concepts are superseded. Exact timing, reward mechanics and probabilities remain undecided until separately approved. | Active |

Add project-specific decisions only when explicitly approved; date and link superseding decisions. Avoid copying private conversations.
