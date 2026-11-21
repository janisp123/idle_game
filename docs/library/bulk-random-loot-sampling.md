# Bulk random loot without per-encounter rolls

**Category:** Probability / offline systems / performance  
**General-purpose benefit:** Sample item counts for very long idle periods without iterating through every eligible encounter.  
**Our-game fit:** `[OUR-GAME: ADAPT]` — promising for future uncapped offline loot, but random-reward rules and authority are not yet approved.  
**Evidence:** `[EVIDENCE: DESIGN-NOTE]` — source-informed comparison and independently written design; no sampler executed or benchmarked here.  
**Reviewed:** 2026-11-21

## Problem and intended use

After a long absence, a character may have completed millions of identical encounters. Simulating one random drop roll per encounter consumes CPU proportional to the time away. Replacing all rolls with `round(n × p)` is cheaper but **changes the game**: it removes variance and can guarantee a rare item that should often not appear.

The first decision is not which RNG library to use. It is **what kind of reward rule exists**:

- **Independent chance per eligible encounter:** the number of successes follows `Binomial(n, p)`.
- **Exactly one outcome from a weighted table:** category counts jointly follow a multinomial distribution; separate independent counts could incorrectly award more than one exclusive item per encounter.
- **Multiple independent procs:** individual counts may be sampled separately if overlap has no downstream consequence.
- **Stateful or correlated rewards:** pity meters, shared roll limits, conditional chains, changing odds and rewards that alter future encounters require a different state model. Do not aggregate them as unchanged independent trials.

## Three implementation approaches

| Approach | Work | Appropriate when | Main limitation |
| --- | --- | --- | --- |
| Roll every encounter | `O(n)` RNG draws and updates | Short intervals; an exact reference simulator | Too expensive for unlimited offline catch-up |
| Skip directly between successes using geometric waiting times | Expected `O(1 + n × p)` draws | Very rare independent events; success positions matter | For common drops, still loops many times; extreme probabilities need careful numerics |
| Draw an aggregate binomial count | Work depends on sampler and parameter regime, **not necessarily n** | Independent fixed-probability count totals | A robust validated sampler is nontrivial; outputs do not reproduce each original roll |

A practical sampler may use inversion for small expected success counts and a transformed rejection method for larger counts. These techniques have different numerical edge cases; simply computing `n × p` and rounding, or substituting a Poisson/normal approximation without error analysis, is **not** exact binomial sampling. Using a trusted distribution implementation is preferable to inventing a new one merely to save a dependency; any later dependency import needs separate approval and license review.

## Algorithm and data flow

For each time segment, count **eligible trials first**, under one immutable rewards/ruleset fingerprint. Separate segments at genuine changes of encounter type, drop rules or eligibility. Only aggregate outcome types whose ordering does not affect future game state.

Original illustrative pseudocode (the `drawBinomial` operation is an abstract, **not implemented**, validated primitive):

```text
settleFixedLoot(segment, savedState, authoritativeRng):
    require segment.trials is a nonnegative exact integer
    require segment.rulesId matches savedState.expectedRulesId

    for each independentReward in segment.independentRewards:
        k = drawBinomialExactCounts(segment.trials,
                                    independentReward.probability,
                                    authoritativeRng)
        savedState.itemCount[independentReward.id] += k

    for each exclusiveTable in segment.exclusiveTables:
        remainingTrials = segment.trials
        remainingMass = 1
        for each outcome in exclusiveTable.outcomesInStableOrder:
            conditionalP = outcome.probability / remainingMass
            k = drawBinomialExactCounts(remainingTrials,
                                        conditionalP, authoritativeRng)
            savedState.itemCount[outcome.id] += k
            remainingTrials -= k
            remainingMass -= outcome.probability
        # remainingTrials received the "no drop" result

    saveExactCountersAndRngVersion(savedState)
    return compactRewardSummary(savedState)
```

For the exclusive table, each outcome consumes some of the **remaining trials**. The next conditional probability divides its original probability by the remaining probability mass; this preserves the joint categorical-count distribution when the original weights are valid and the sampler is correct. Handle `p = 0`, `p = 1`, zero remaining trials and floating-point mass near zero explicitly; reject negative weights or total weight above one. If outcomes depend on each other *within* an encounter, model that dependency before using the table.

**Very large integers:** Browser numbers are not exact for arbitrary integers beyond `2^53 - 1`. Store huge trial and inventory counts as integers/validated decimal strings and process bounded exact-size batches if a sampler cannot accept the full count. The sum of independent binomial batch counts has the correct distribution for fixed `p`, but **a different batching schedule usually consumes a different RNG sequence**. Distributional fairness is not identical seeded replay.

**Numerical checkpoint:** For `n = 10,000` and `p = 1/25,000`, expected drops are `0.4`, but the chance of **at least one** is `1 - (1 - p)^n ≈ 32.97%`, not 40%. About 6.15% of such sessions should receive **at least two**. A boosted single roll at `n × p` loses both properties.

## Persistence, security and failure modes

Store the version of the distribution algorithm, RNG policy/seed state (or other authoritative reproducibility contract), loot ruleset ID, partial activity phase, eligible-trial cursor and reward totals. **Commit the cursor, aggregate results and RNG state together.** Retried settlement must not award the interval twice. For multiplayer, the server chooses and commits randomness; client-supplied counts, seeds or durations are not trusted.

An algorithm update can change the random output for the *same seed*, even if both versions produce valid binomial samples. Decide explicitly whether the contract is **statistical equivalence** or **bit-for-bit replay**. Maintain versioned historical behavior if exact replay matters. Do not assume an open tab, an old save and a new server release share compatible RNG semantics.

Do not use these techniques unmodified when rare drops alter combat power during the interval, a global cap exists, pity counters change probabilities, the table depends on a shared roll, or an event must appear in its exact historical order. Those require boundary-aware state transitions or a separately validated stateful sampler. For our game, earned offline progression does not improve effective combat stats until return (OFF-001), but other changing reward rules still matter.

## Cost and alternatives

For `K` independently sampled item types in a stable segment, inventory output is `O(K)` counters, and simulation CPU is about `O(K × samplerCost)`, independent of the number of historical encounters **only if the chosen sampler has bounded/low expected work**. Geometric skipping has expected work proportional to actual successes. A large number of drop tables, version changes or rule boundaries increases cost. Avoid storing millions of item-grant rows or per-roll logs; store compact aggregate outcomes and only special events that the game genuinely needs.

A small local-only game can use browser-side sampling, whereas public multiplayer must eventually use authoritative settlement. These are architecture choices, not approvals to add a server or third-party package.

## Test or performance evidence

**No tests have been run for this article.** Proposed independent checks:

1. Tiny `n` (0 through 20): compare exact count frequencies against the binomial probability mass function and a trusted per-roll reference; include `p = 0` and `p = 1`.
2. Rare-drop tails: verify empirical `P(X=0)`, `P(X≥1)`, `P(X≥2)`, mean and variance with confidence intervals; avoid relying on average count alone.
3. Exclusive table: counts sum to at most `n`, conditional probabilities remain valid, and category covariance matches mutually exclusive outcomes; independent proc counts may overlap.
4. Large `n`: test one million, one billion, safe-integer boundaries and multi-batch sums; reject overflow/precision loss and impossible counts.
5. Partial settlement: repeated login, duplicate requests, crashed transaction, changing batch sizes and rule-version upgrades; define whether to assert exact results or statistical equivalence.
6. Compare CPU time, peak memory and random draws on representative low-end phones/server hardware across per-roll, geometric-skip and aggregate-binomial methods. Record measurements before making speed claims.

## Our-game assessment

`[OUR-GAME: ADAPT]` — a compact aggregate sampler is a strong candidate for decades-long hunting loot **once eligibility, drop exclusivity and RNG guarantees are specified**. It should integrate with time-safe offline boundaries and atomic reward settlement, not replace those systems. Do not infer that any bonus dice mechanic or rarity table has already been approved.

## Open questions

- How should stateful pity, dependent drops or rewards that modify future rules be aggregated without changing outcomes?
- Does the product require deterministic replay across partial logins and software upgrades, or only matched statistical distributions?
- Which sampler gives acceptable extreme-tail accuracy and latency at the target probabilities and count sizes?

## Rights and originality

This is original educational synthesis and pseudocode describing established probability techniques, **not an original invention of those techniques**. No outside code, assets, names or source locations are included. Integrating an outside implementation later requires owner approval and applicable license notices.
