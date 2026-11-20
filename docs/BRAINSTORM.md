# Idle Game — Brainstorm Index

**Organized:** 2026-11-20  
**Status:** Living brainstorming and design notes — **not** an implementation plan.  
**Repository:** `janisp123/idle_game`

This page is intentionally short. **Write and update each idea in its topical note**, not in one enormous file. Historical ideas remain in the topic notes, and newer directions are recorded above them when an idea changed.

| Topic | Where to write |
| --- | --- |
| Goal, game identity, smallest solo prototype | [Vision and scope](brainstorm/VISION_AND_SCOPE.md) |
| Grimdark art, static scenes, written battle narration | [Art and presentation](brainstorm/ART_AND_PRESENTATION.md) |
| Solo combat, weapons, timing, skills, skull dice | [Solo combat](brainstorm/SOLO_COMBAT.md) |
| Automatic attributes, two-skill progression, no loot sorting | [Progression and equipment](brainstorm/PROGRESSION_AND_EQUIPMENT.md) |
| **Battlefield range, terrain, cover and natural combat counters** | **[Environmental combat](brainstorm/ENVIRONMENTAL_COMBAT.md)** |
| Automated activities, battle clocks, no offline limit | [Automation and offline](brainstorm/AUTOMATION_AND_OFFLINE.md) |
| NPCs, parties, shared activities, clans (future) | [Groups and clans](brainstorm/GROUPS_AND_CLANS.md) |
| Modularity, the headless combat simulator and testing | [Architecture and balancing](brainstorm/ARCHITECTURE_AND_BALANCING.md) |
| Unresolved decisions, deferred systems and old questions | [Open questions](brainstorm/OPEN_QUESTIONS.md) |

## How to keep this notebook useful

- **Direction:** the owner expressly favors this direction, but it may evolve.
- **Idea:** possibility worth exploring, **not authorization** to implement.
- **Open:** an unresolved question or design tradeoff.
- **Superseded:** old proposal replaced by a newer direction, retained for context.
- Add dated updates to the *relevant* file; don't silently erase earlier disagreements.
- **Start with solo combat.** Parties, NPCs, clans, and narrative personality development are future ideas.
- Some older notes conflict with newer discussion (for example, **3d7 per encounter versus 3d6 per combat turn**, and initial mining/hunting versus an initial solo duel). They are **clearly marked** in topic files so they can be reconciled before coding.
- Respect [AGENTS.md](../AGENTS.md), [agent protocol](AGENT_PROTOCOL.md), current [TD_LIST.md](TD_LIST.md), and [DECISIONS.md](DECISIONS.md). **Brainstorm ideas never automatically become implementation tasks or final technical decisions.**
- Keep our public repository independently authored and free of copied third-party code/artwork, identifying reference-game names, private chats and identifying research URLs.

**Design philosophy:** A deep, atmospheric dark-fantasy game where **character choices are few, combat is vivid, and activity is fully automated**. Let art and narrative spark the player's imagination; don't require repetitive clicking.
