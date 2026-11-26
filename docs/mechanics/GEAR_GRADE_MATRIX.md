# GEAR-RESEARCH-001 — equipment grade matrix follow-up

Baseline `01362378d8aefcec3aa1fa4bb73116d9457237c3`. Candidate only, no runtime changes. Run `node tools/gear-progression-matrix.mjs` from repository root with the baseline commit available. Executed the same harness body using the pinned source in an isolated JS environment; Node entrypoint and repository CI not yet independently run.

Matched comparisons: same weapon and armour family, identical attributes and skill at higher-grade arena benchmark, five arenas, 16 LCG seeds starting 34959291, reversed sides. Common/full mastery and higher Poor vs lower Masterwork at shared lower-grade expertise. Cross-build stress: all 225 ordered weapon/armour pairs, 4 seeds starting 987654321, adjacent grades plus S vs non-grade, reversed sides. Draws are separate; zero losses observed is not a guarantee. All tests start with intact gear, not persistent wear or economy. Diagonal transition matrix is Poor vs Poor. Armour is uniform across four slots.

## commonFull — 86400 bouts

| Row vs column | NG | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| NG | 49.54% | 4.25% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% | 0.00% |
| F | 95.75% | 49.46% | 5.13% | 0.04% | 0.00% | 0.00% | 0.00% | 0.00% |
| E | 100.00% | 94.88% | 49.54% | 3.17% | 0.04% | 0.00% | 0.00% | 0.00% |
| D | 100.00% | 99.96% | 96.83% | 49.67% | 2.42% | 0.00% | 0.00% | 0.00% |
| C | 100.00% | 100.00% | 99.96% | 97.58% | 49.75% | 2.21% | 0.00% | 0.00% |
| B | 100.00% | 100.00% | 100.00% | 100.00% | 97.79% | 49.54% | 3.33% | 0.00% |
| A | 100.00% | 100.00% | 100.00% | 100.00% | 100.00% | 96.67% | 49.67% | 2.67% |
| S | 100.00% | 100.00% | 100.00% | 100.00% | 100.00% | 99.96% | 97.33% | 49.79% |

Adjacent and extreme details (win, draw, knockout win, any break, worst pair; all %):

```json
{
  "adjacent": [
    {
      "win": 95.75,
      "loss": 4.25,
      "draw": 0,
      "knockoutWin": 93.25,
      "anyBreak": 23.08,
      "min": 83.13,
      "minPair": "hammer/plate vs hammer/plate",
      "max": 100,
      "count": 2400
    },
    {
      "win": 94.88,
      "loss": 5.13,
      "draw": 0,
      "knockoutWin": 91.42,
      "anyBreak": 0.04,
      "min": 85,
      "minPair": "sword_shield/padded vs sword_shield/padded",
      "max": 100,
      "count": 2400
    },
    {
      "win": 96.83,
      "loss": 3.17,
      "draw": 0,
      "knockoutWin": 92.08,
      "anyBreak": 0,
      "min": 88.13,
      "minPair": "greatsword/padded vs greatsword/padded",
      "max": 100,
      "count": 2400
    },
    {
      "win": 97.58,
      "loss": 2.42,
      "draw": 0,
      "knockoutWin": 92.71,
      "anyBreak": 0,
      "min": 93.75,
      "minPair": "bow/padded vs bow/padded",
      "max": 100,
      "count": 2400
    },
    {
      "win": 97.79,
      "loss": 2.21,
      "draw": 0,
      "knockoutWin": 93.08,
      "anyBreak": 0,
      "min": 92.5,
      "minPair": "sword_shield/padded vs sword_shield/padded",
      "max": 100,
      "count": 2400
    },
    {
      "win": 96.67,
      "loss": 3.33,
      "draw": 0,
      "knockoutWin": 91.71,
      "anyBreak": 0,
      "min": 90.63,
      "minPair": "greatsword/padded vs greatsword/padded",
      "max": 100,
      "count": 2400
    },
    {
      "win": 97.33,
      "loss": 2.67,
      "draw": 0,
      "knockoutWin": 92.96,
      "anyBreak": 0,
      "min": 93.13,
      "minPair": "sword_shield/padded vs sword_shield/padded",
      "max": 100,
      "count": 2400
    }
  ],
  "extreme": {
    "win": 100,
    "loss": 0,
    "draw": 0,
    "knockoutWin": 100,
    "anyBreak": 0,
    "min": 100,
    "minPair": "greatsword/padded vs greatsword/padded",
    "max": 100,
    "count": 2400
  }
}
```

## transitionPrior — 86400 bouts

| Row vs column | NG | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| NG | 49.71% | 29.25% | 3.04% | 0.04% | 0.00% | 0.00% | 0.00% | 0.00% |
| F | 70.71% | 49.54% | 27.13% | 1.54% | 0.13% | 0.00% | 0.00% | 0.00% |
| E | 96.79% | 72.75% | 49.54% | 26.33% | 2.21% | 0.08% | 0.00% | 0.00% |
| D | 99.92% | 98.46% | 73.54% | 49.67% | 26.38% | 1.08% | 0.04% | 0.00% |
| C | 100.00% | 99.88% | 97.75% | 73.46% | 49.75% | 20.96% | 1.71% | 0.25% |
| B | 100.00% | 100.00% | 99.92% | 98.92% | 79.04% | 49.54% | 21.63% | 2.54% |
| A | 100.00% | 100.00% | 100.00% | 99.92% | 98.29% | 78.29% | 49.71% | 21.42% |
| S | 100.00% | 100.00% | 100.00% | 100.00% | 99.75% | 97.46% | 78.58% | 49.79% |

Adjacent and extreme details (win, draw, knockout win, any break, worst pair; all %):

```json
{
  "adjacent": [
    {
      "win": 70.71,
      "loss": 29.25,
      "draw": 0.04,
      "knockoutWin": 68.13,
      "anyBreak": 1.71,
      "min": 60,
      "minPair": "greatsword/leather vs greatsword/leather",
      "max": 84.38,
      "count": 2400
    },
    {
      "win": 72.75,
      "loss": 27.13,
      "draw": 0.13,
      "knockoutWin": 69.21,
      "anyBreak": 0,
      "min": 60,
      "minPair": "greatsword/padded vs greatsword/padded",
      "max": 88.75,
      "count": 2400
    },
    {
      "win": 73.54,
      "loss": 26.33,
      "draw": 0.13,
      "knockoutWin": 69.67,
      "anyBreak": 0,
      "min": 63.75,
      "minPair": "greatsword/leather vs greatsword/leather",
      "max": 83.13,
      "count": 2400
    },
    {
      "win": 73.46,
      "loss": 26.38,
      "draw": 0.17,
      "knockoutWin": 69.33,
      "anyBreak": 0,
      "min": 54.38,
      "minPair": "bow/padded vs bow/padded",
      "max": 90,
      "count": 2400
    },
    {
      "win": 79.04,
      "loss": 20.96,
      "draw": 0,
      "knockoutWin": 74.42,
      "anyBreak": 0,
      "min": 68.13,
      "minPair": "sword_shield/padded vs sword_shield/padded",
      "max": 88.75,
      "count": 2400
    },
    {
      "win": 78.29,
      "loss": 21.63,
      "draw": 0.08,
      "knockoutWin": 73.83,
      "anyBreak": 0,
      "min": 68.75,
      "minPair": "sword_shield/padded vs sword_shield/padded",
      "max": 90.63,
      "count": 2400
    },
    {
      "win": 78.58,
      "loss": 21.42,
      "draw": 0,
      "knockoutWin": 75.33,
      "anyBreak": 0,
      "min": 70.63,
      "minPair": "greatsword/plate vs greatsword/plate",
      "max": 90,
      "count": 2400
    }
  ],
  "extreme": {
    "win": 100,
    "loss": 0,
    "draw": 0,
    "knockoutWin": 99.88,
    "anyBreak": 0,
    "min": 100,
    "minPair": "greatsword/padded vs greatsword/padded",
    "max": 100,
    "count": 2400
  }
}
```

## crossTransitionPrior — 72000 bouts

| Row vs column | NG | F | E | D | C | B | A | S |
|---|---|---|---|---|---|---|---|---|
| NG | — | 35.92% | — | — | — | — | — | 0.63% |
| F | 63.90% | — | 33.68% | — | — | — | — | — |
| E | — | 66.26% | — | 30.31% | — | — | — | — |
| D | — | — | 69.60% | — | 33.00% | — | — | — |
| C | — | — | — | 66.92% | — | 33.88% | — | — |
| B | — | — | — | — | 65.98% | — | 34.62% | — |
| A | — | — | — | — | — | 65.36% | — | 34.16% |
| S | 99.37% | — | — | — | — | — | 65.73% | — |

Adjacent and extreme details (win, draw, knockout win, any break, worst pair; all %):

```json
{
  "adjacent": [
    {
      "win": 63.9,
      "loss": 35.92,
      "draw": 0.18,
      "knockoutWin": 61.19,
      "anyBreak": 1.27,
      "min": 17.5,
      "minPair": "sword_shield/leather vs hammer/plate",
      "max": 100,
      "count": 9000
    },
    {
      "win": 66.26,
      "loss": 33.68,
      "draw": 0.07,
      "knockoutWin": 62.78,
      "anyBreak": 0.11,
      "min": 5,
      "minPair": "sword_shield/plate vs hammer/plate",
      "max": 100,
      "count": 9000
    },
    {
      "win": 69.6,
      "loss": 30.31,
      "draw": 0.09,
      "knockoutWin": 66.01,
      "anyBreak": 0,
      "min": 20,
      "minPair": "greatsword/padded vs spear/plate",
      "max": 100,
      "count": 9000
    },
    {
      "win": 66.92,
      "loss": 33,
      "draw": 0.08,
      "knockoutWin": 62.81,
      "anyBreak": 0,
      "min": 10,
      "minPair": "hammer/plate vs hammer/padded",
      "max": 100,
      "count": 9000
    },
    {
      "win": 65.98,
      "loss": 33.88,
      "draw": 0.14,
      "knockoutWin": 61.74,
      "anyBreak": 0,
      "min": 12.5,
      "minPair": "sword_shield/plate vs hammer/leather",
      "max": 100,
      "count": 9000
    },
    {
      "win": 65.36,
      "loss": 34.62,
      "draw": 0.02,
      "knockoutWin": 61,
      "anyBreak": 0,
      "min": 10,
      "minPair": "sword_shield/plate vs hammer/plate",
      "max": 100,
      "count": 9000
    },
    {
      "win": 65.73,
      "loss": 34.16,
      "draw": 0.11,
      "knockoutWin": 61,
      "anyBreak": 0,
      "min": 0,
      "minPair": "sword_shield/plate vs hammer/plate",
      "max": 100,
      "count": 9000
    }
  ],
  "extreme": {
    "win": 99.37,
    "loss": 0.63,
    "draw": 0,
    "knockoutWin": 98.7,
    "anyBreak": 0,
    "min": 75,
    "minPair": "sword_shield/plate vs spear/padded",
    "max": 100,
    "count": 9000
  }
}
```

## Limits

Candidate remains unapproved. Cross-build samples per pair are small, not reliable estimates for single tactical matchups. No economy, mixed pieces, persistent wear, full NPC progression or CI checks in this follow-up. Review whether fully mastered adjacent grade dominance is too strong before gameplay changes.
