# Independent combat rules, scheduling and rewards

**Category:** Combat / game engine  
**General-purpose benefit:** Isolate combat mathematics, attack scheduling and rewards so each can be tested and optimized independently.  
**Our-game fit:** `[OUR-GAME: FIT]` — adapt module boundaries, not unverified external formulas.  
**Evidence:** `[EVIDENCE: DESIGN-NOTE]` — research synthesis; no independent test or benchmark.  
**Reviewed:** 2026-11-21

## Problem and intended use

Combat rules become difficult to test when damage, timers, rewards and rendering all mutate the same state. Separate deterministic calculations from encounter sequencing and reward settlement.

## Implementation pattern and pitfalls

**Evidence examined:** publicly readable code from a classic MMORPG-style server recreation, plus a larger modular server framework. We inspected actual combat damage calculations, player/NPC fighting loops and a separate loot-roll function in the former, and the latter's high-level engine/content separation. These are **readable implementations**, not verified formulas from the proprietary original games. Source names and URLs are not published under this repository's standing rule.

**Observed boundaries and reusable lessons:**

1. **Combat maths module:** receive player/enemy attributes and equipment bonuses; calculate accuracy, defensive protection, potential maximum damage and sampled damage. The inspected example separates calculations from world/character entities.
2. **Combat scheduler:** player and enemy models independently call the damage calculation at eligible attack stages/timers. Apply resulting damage to HP and resolve victory/defeat. Keeping this outside the maths function makes formulas replaceable.
3. **Loot roller:** use configured weighted drop tables, independent of the damage formula. Victory processing grants resources/XP through a separate state update. This makes drop rates editable without rewriting combat.
4. **Modular game architecture:** prefer separate engine, content definitions and UI/presentation; do not bind combat logic to scene drawing, network handling or persistence.
5. **Our extra requirement:** adapt the same rules for an **offline estimator**. The examined servers run live game loops; they **do not provide a verified unlimited-offline combat solution**. Do not copy their real-time ticking into a server actor for dormant players.

**Original illustrative pseudocode (not extracted from other projects or intended as our final formula):**

```text
resolveHit(attacker, defender, random):
    attackScore = computeAttackScore(attacker.stats, attacker.equipment)
    defenseScore = computeDefenseScore(defender.stats, defender.equipment)
    chanceToHit = bounded(attackScore / (attackScore + defenseScore), 0, 1)
    if random.draw() >= chanceToHit:
        return { hit: false, damage: 0 }
    damage = sampleDamage(attacker.damageRange, random)
    return { hit: true, damage: max(0, damage) }

advanceCombat(state, elapsed, random):
    advanceAttackTimers(state, elapsed)
    for every attack becoming ready, in a defined order:
        result = resolveHit(currentAttacker, currentDefender, random)
        applyDamageAndCombatEffects(state, result)
        if either combatant has zero HP: finishEncounter(state); stop
    return summaryOfResultAndTime(state)

finishEncounter(state):
    if won:
        return { outcome: "win", xpEarned: xpRule(state),
                 dropChances: lootTableForDefeatedEnemy(state) }
    return { outcome: "loss", downtime: revivalAndReturnTime(state) }

estimateOffline(segment, combatModel):
    rates = estimateVictoryDeathAndDurationRates(combatModel, segment.startStats)
    applyStatisticallySampledRewardsAndTimeCosts(segment, rates)
    // OUR GAME: do NOT change skill/level/effective-equipment stats during absence.
    // Recompute only at non-advancement boundaries, e.g. activity or rule changes.
```

**Important boundaries:** The probability formula above is just one simple candidate—not an endorsement of any game's exact algorithm. The offline function is a *placeholder for a future validated statistical model*, not an implementation or guarantee of equivalence. Don't use per-battle simulation for multi-year catch-up. Preserve separate fixed-zone and resurrection downtime rules. **For our game specifically, use the frozen logout build throughout; earned XP is applied to levels only on return (OFF-001).**

**Practical tests before adopting any formula:** compare average win rate, damage, fight duration, deaths/hour and rewards/hour from seeded encounter sampling against the aggregate estimator; test extremes (zero attack/defense, near-certain hit/miss, long absences and **separate fixed builds at different skill levels**, without levelling during the absence), and verify the UI/animation cannot change progression.

**Use/rights note:** Reading source is not permission to paste it into our MIT project. At least one examined recreation declares a strong copyleft license; preserve legally required attribution for any approved integration, or write independent code. Nothing above is copied from an outside repository.

## Complexity and alternatives

A single hit calculation uses constant work for fixed-size attributes; scheduling work grows with **actual attacks and state changes**, not the number of UI frames. A live encounter runner may use a short tick, an event queue or direct next-attack scheduling; an unlimited-offline estimator needs separate aggregation. Watch for tie-order ambiguity, impossible damage, RNG correlations and recovery time.

## Our-game assessment

The module boundaries are useful, but none of the example probabilities, damage formulas or offline estimators is an approved game rule. Apply the frozen logout build during offline settlement under OFF-001.

## Open questions

Which combat statuses, interrupts and recovery states must be modeled before an aggregate estimator can be validated?

## Rights and originality

Independent educational synthesis and pseudocode only. Do not import third-party implementation without separate approval and license review.
