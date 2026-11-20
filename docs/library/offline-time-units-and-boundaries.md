# Time-Safe Offline Simulation and Resource-Depletion Boundaries

**Category:** Simulation / offline progression / resource economy  
**General-purpose benefit:** Advance production and resource-consuming activities over a long offline interval without replaying every frame and without corrupting balances.  
**Our-game fit:** `[OUR-GAME: FIT]` — essential for reliable, uncapped mining/crafting activities and cost-effective server settlement; adapt the continuous-flow model only where the game's rules are genuinely continuous.  
**Evidence:** `[EVIDENCE: DESIGN-NOTE]` — independently written algorithm analysis and proposed tests; no prototype or benchmark has been run in this repository.  
**Reviewed:** 2026-11-19

## Problem and intended use

A browser game may produce and consume resources while the tab is closed. If a machine produces 3 units per second and another consumes 5 per second, production cannot remain unchanged after its input stock becomes empty.

The challenge is to jump across a long elapsed interval **accurately**, paying attention to the exact moment a resource is exhausted. A second danger is mixing units: a depletion time computed in **seconds** must not be fed to a clock or scheduler whose steps are in **milliseconds**.

This document covers:
- Continuous production and consumption, with resource exhaustion.
- Timed discrete actions (mining attempts, crafting jobs, combat encounters).
- Time-boundary processing and numerical invariants.
- Ways to test for bugs before trusting long offline calculations.

The pattern is useful for production/tycoon games, automation chains and many RPG activities, but should **not** be applied to random encounters as if they were continuous resource streams without a separate decision on randomness.

## 1. Specify units in every interface

Choose an authoritative time representation and make conversions explicit. One reasonable option for a browser/server game is:

| Quantity | Unit | Example |
| --- | --- | --- |
| `currentTimeMs` | milliseconds since a trusted epoch | `...000` |
| `elapsedMs` | milliseconds of simulated duration | 20,000 |
| `stock` | resource units | 10 stone |
| `productionRate` | units per second | 2 stone/s |
| `consumptionRate` | units per second | 3 stone/s |
| `cycleDurationMs` | milliseconds per discrete action | 40,000 |

Avoid ambiguous names such as `time`, `rate` or `delta` at boundaries between modules. Stronger type systems can use branded duration/rate types or dedicated wrappers so accidental mixing is rejected.

For one resource while rates remain constant:

$
\Delta stock = (P-C)\frac{\Delta t_{ms}}{1000}
$

If `C > P` and `stock > 0`, the resource reaches zero after:

$
t_{empty,ms}=\frac{1000\cdot stock}{C-P}
$

**Dimensional check:** stock is units, `C-P` is units/second; their quotient is **seconds**, so multiplication by 1,000 converts the result to milliseconds.

### Worked example

- Starting stock = **10 units**.
- Production = **0 units/second**.
- Consumption = **1 unit/second**.
- Offline period = **20,000 milliseconds (20 seconds)**.

The exhaustion boundary is **10,000 milliseconds**, not 10 milliseconds. The first ten seconds consume all ten units. For the remaining ten seconds, production that depends on this input must stop or run at an explicitly defined supply-limited rate.

Incorrectly treating ten seconds as ten milliseconds, or failing to re-evaluate rates after depletion, can produce impossible resources or incorrect rewards.

## 2. Move between meaningful boundaries, not frames

An event-boundary simulation advances directly to the earliest moment when the rules may change:

- Resource stock reaches zero.
- A timed action/crafting encounter completes.
- A production modifier begins or expires.
- In games that support automatic offline advancement, an upgrade/skill threshold is reached. **Not an offline boundary for our game:** see OFF-001; player/skill levels and effective combat stats stay frozen until login.
- An activity queue changes steps.
- An asynchronous group membership interval begins or ends.
- A stored ruleset changes effective version.

During an interval with **unchanged rules**, integrate in one operation. Recompute rates only at a boundary.

### Original illustrative pseudocode

```text
settleUntil(state, targetTimeMs):
    require finite(targetTimeMs) and targetTimeMs >= state.timeMs

    while state.timeMs < targetTimeMs:
        flow = determinePermittedRates(state)   // handle zero-stock throttling

        nextTimeMs = min(
            targetTimeMs,
            nextResourceExhaustionMs(state, flow),
            nextTimedActionBoundaryMs(state),
            nextRuleOrMembershipChangeMs(state)
        )

        if nextTimeMs == state.timeMs:
            changed = resolveImmediateBoundaries(state)
            if not changed:
                fail("non-advancing simulation: invalid or unsupported state")
            continue

        durationMs = nextTimeMs - state.timeMs

        for each resource:
            deltaUnits = flow.netPerSecond[resource] * durationMs / 1000
            state.stock[resource] += deltaUnits

        state.timeMs = nextTimeMs
        resolveReachedBoundaries(state)
        validateNoNegativeStock(state)

    return state
```

**Important:** This is a design outline, not complete software. In particular, `determinePermittedRates` and `resolveImmediateBoundaries` need deterministic policies when multiple consumers compete for the same depleted input. Do not copy the pseudocode into production without resolving those rules.

## 3. Starvation rules require an explicit policy

A system that starts at zero input stock and tries to consume more than is produced can generate a **zero-time boundary** repeatedly.

Define a supply-allocation rule for competing consumers. Common options include:

- **Priority:** first fund the highest-priority consumer, then the next.
- **Proportional sharing:** scale demand across consumers relative to requested input.
- **All-or-nothing machines:** a machine works only when it can complete a full discrete cycle with enough inputs.
- **Queue order:** process jobs in a stable order; useful for discrete crafting.

These choices produce different outcomes. None is universally correct. For coupled production chains, solving demand independently for each resource may be inconsistent: a machine throttled by one input also produces less of its output, which can starve another machine.

Check for a consistent allocation (or define strict processing order), avoid feedback oscillation, and record the intended rules in the game design.

**Progress guarantee:** After handling a zero-time boundary, the mode/state must actually change or the solver must report an error. A fixed “stop after 64 loops” guard may prevent a hang but must **not silently discard remaining offline time**.

## 4. Discrete encounters are a different problem

A mining attempt or combat encounter finishes as a whole event, not as infinitely divisible resource flow.

When encounter duration is constant and no intermediate rule changes occur:

```text
totalTime = savedPartialProgressMs + elapsedMs
completed = floor(totalTime / encounterDurationMs)
newPartialProgressMs = totalTime mod encounterDurationMs
```

But these counts must be clipped at the earliest relevant boundary: input-resource exhaustion, activity-queue rule, combat viability, cooldown or group expiration. A skill-level change can be a boundary **only for games where levelling is permitted during offline simulation**; our game freezes combat/activity levels until login (OFF-001).

For huge repeating schedules, repeatedly walking a five-task cycle could still require millions of iterations. Consider mathematically fast-forwarding identical full cycles, then processing the partial final cycle. This is valid only when none of the skipped cycles changes the parameters used to compute them.

**Random loot warning:** Aggregate the *number of eligible encounters* separately from their rewards. If per-encounter probability is `p` and conditions remain fixed, a binomial or multinomial sampler may represent bulk loot outcomes. Expected value `n*p` is not the same as a random sample, and rounding expectations upward guarantees items that should remain uncertain. Saved RNG semantics may require more care if offline and online outcomes must match exactly for the same seed.

## 5. Time and persistence rules

For long-running browser games, use a **trusted server timestamp** for authoritative online accounts rather than accepting client-provided duration as a fact.

- Save a `settledThroughMs` watermark with inventory/skills/queue configuration.
- When a settlement request arrives, compute from that watermark to a bounded authoritative `targetTimeMs`.
- Commit updated state and watermark **atomically**. Replayed requests must not grant rewards again.
- Treat negative elapsed time as an anomaly to reject or resolve under a documented policy; never silently process negative-duration reward math.
- Keep durable rule-version and migration strategies for players who may return after many game updates.
- Use units and number types able to represent decades of accumulated items without overflow or precision corruption.

For the design promising uncapped offline progress, a maximum processing budget should trigger **resumable settlement**, not reward truncation. Store a continuation state or split the computation into safe transactions while preserving exactly-once updates.

## 6. Tests that catch the dangerous mistakes

The following are **proposed checks**, not tests run as part of this article.

| Scenario | Expected property |
| --- | --- |
| 10 items, net consumption 1 item/sec, 20 sec | Depletion at **10,000 ms**, never negative |
| Unlimited source, 3 items/sec, 20 sec | Exactly 60 items before rounding policy |
| Start at zero with demand | No negative stock; defined throttling; solver makes progress |
| Two consumers, one exhausted input | Deterministic policy, total usage no greater than supply |
| Same resource depleted in two chains | Stable coupled-resource behavior; no oscillation |
| One 20-sec step vs twenty 1-sec steps | Equivalent state, within documented numeric tolerances |
| One 20-sec step vs 80 quarter-second steps | Equivalent state, within documented numeric tolerances |
| Two time intervals `a` then `b` | Consistent with settlement over `a+b` when no external commands intervene |
| 0, negative or non-finite durations | Explicitly handled/rejected; never infinite loop |
| Exact event at target timestamp | Process once according to documented boundary order |
| One-year or twenty-year idle interval | Completes within measured resource budget without reward cap |
| Retry same offline-settlement transaction | Exactly-once inventory, reward and watermark update |

Also use randomized **property-based tests**: generate nonnegative stock, production/consumption rates, and short time windows, then compare the optimized solver against a tiny-step reference simulator. Test starvation, near-equal rates, floating-point sensitivity, and simultaneous boundaries explicitly.

**Subtlety:** A small-step reference is an approximation, not ultimate truth. Check basic conservation equations independently and give the test a known tolerance. For discrete RNG outcomes, compare exact sequences only when the implementation explicitly promises deterministic replay; otherwise test statistical agreement.

## 7. Performance and alternatives

| Approach | Computational cost | Advantage | Limitation |
| --- | --- | --- | --- |
| Per-frame updates | Proportional to frames/time | Easy live rendering | Too costly for long absences |
| Per-encounter replay | Proportional to encounters | Exact sequence in simple games | May be millions/billions of actions |
| Event-boundary integration | Proportional mainly to meaningful rule changes | Accurate depletion timing | Competing resources complicate state transitions |
| Closed-form whole cycles | Approximately constant cost within a fixed regime | Extremely cheap for long identical loops | Invalid if effective rates or resources change inside the skipped interval; for our game XP does **not** change effective levels during absence |
| Aggregate probabilistic rewards | Depends on sampler rather than number of encounters | Preserves distributions without per-roll loops | Requires carefully defined RNG and outcome correlations |

The best approach is often **hybrid**: a small event-driven scheduler that uses closed-form arithmetic for stable intervals, discrete processing for genuine transitions, and statistically correct bulk reward sampling where exact per-action replay is unnecessary.

Avoid claims such as “20 years always settles instantly” until the implementation is benchmarked on representative datasets and hardware.

## 8. Our game's assessment

`[OUR-GAME: FIT]`

- Use consistent time units and explicit rules for every task's stop condition.
- Mine stone and hunt enemies as **discrete encounters**; don't pretend distinct events or combat-state changes are continuous. **Skill level and effective combat stats are frozen for the whole offline interval in our game**; accumulated XP can only level the player after login (OFF-001).
- Keep the five-task automation running without a forced offline cap, but compress repeated cycles only when mathematically valid.
- Respect the **seven-day offline group participation** boundary: after it, switch to solo settlement even if the player remains away for years.
- Compute 3d7 outcomes and rare rewards with correct probabilities, without issuing a separate serialized server event for every historical encounter.
- Build golden tests for the exact timestamp at which input stock, cooldowns and group membership expire.
- Optimize for **low server CPU, low database write volume, predictable memory and resumability**, not for ticking every character continuously.

**What does not fit:** Limiting rewards to an arbitrary offline window, stopping combat while absent, silently skipping a remainder when a solver's iteration guard is reached, or applying **XP-driven skill/stat gains during absence** despite the frozen-build rule OFF-001. This article also describes other game designs where mid-offline levelling is possible; those are general examples, not our requirements.

## Open questions

- Which production systems (if any) will be continuous rather than encounter-based?
- What is the exact choice of integer/fixed-point quantity representation?
- What probabilistic guarantees are required for rare drop bulk sampling across saved RNG states?
- Which state transitions require an auditable historical rule version?
- How should settlement resume if a request hits a time/CPU budget?

**Status:** Educational design note only. No external code copied; no implementation approved. This document must not be interpreted as evidence that an engine has already passed these tests.
