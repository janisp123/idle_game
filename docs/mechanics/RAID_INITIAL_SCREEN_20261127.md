# RAID-001 initial encounter screen (2026-11-27)

Candidate commit eb43704cfb681066c2de73cf9dc1e315193709b3, PR #207. Website run 46003359410, job 140520330274: 183/183 Node tests and Chromium mobile/desktop passed. This was foundation-only, not the later playable candidate. Test: tools/test_group_timeline.mjs. Seeds 20261127, 20261144, 20261158. Maximum S Masterwork group, 3700h individual attributes, full class/stance/teamwork mastery. No blessing. 15 actual encounters.

```json
{
  "build": "max S masterwork, 3700h individual stats",
  "results": [
    {
      "level": 10,
      "seed": 20261127,
      "outcome": "victory",
      "rounds": 9,
      "durationMs": 22500,
      "reason": "knockout",
      "bossHP": 670,
      "bossRemaining": 0
    },
    {
      "level": 10,
      "seed": 20261144,
      "outcome": "victory",
      "rounds": 11,
      "durationMs": 27500,
      "reason": "knockout",
      "bossHP": 670,
      "bossRemaining": 0
    },
    {
      "level": 10,
      "seed": 20261158,
      "outcome": "victory",
      "rounds": 8,
      "durationMs": 20000,
      "reason": "knockout",
      "bossHP": 670,
      "bossRemaining": 0
    },
    {
      "level": 20,
      "seed": 20261127,
      "outcome": "victory",
      "rounds": 11,
      "durationMs": 27500,
      "reason": "knockout",
      "bossHP": 600,
      "bossRemaining": 0
    },
    {
      "level": 20,
      "seed": 20261144,
      "outcome": "victory",
      "rounds": 11,
      "durationMs": 27500,
      "reason": "knockout",
      "bossHP": 600,
      "bossRemaining": 0
    },
    {
      "level": 20,
      "seed": 20261158,
      "outcome": "victory",
      "rounds": 10,
      "durationMs": 25000,
      "reason": "knockout",
      "bossHP": 600,
      "bossRemaining": 0
    },
    {
      "level": 30,
      "seed": 20261127,
      "outcome": "victory",
      "rounds": 21,
      "durationMs": 52500,
      "reason": "knockout",
      "bossHP": 770,
      "bossRemaining": 0
    },
    {
      "level": 30,
      "seed": 20261144,
      "outcome": "victory",
      "rounds": 17,
      "durationMs": 42500,
      "reason": "knockout",
      "bossHP": 770,
      "bossRemaining": 0
    },
    {
      "level": 30,
      "seed": 20261158,
      "outcome": "victory",
      "rounds": 15,
      "durationMs": 37500,
      "reason": "knockout",
      "bossHP": 770,
      "bossRemaining": 0
    },
    {
      "level": 40,
      "seed": 20261127,
      "outcome": "victory",
      "rounds": 30,
      "durationMs": 75000,
      "reason": "knockout",
      "bossHP": 1840,
      "bossRemaining": 0
    },
    {
      "level": 40,
      "seed": 20261144,
      "outcome": "victory",
      "rounds": 29,
      "durationMs": 72500,
      "reason": "knockout",
      "bossHP": 1840,
      "bossRemaining": 0
    },
    {
      "level": 40,
      "seed": 20261158,
      "outcome": "victory",
      "rounds": 31,
      "durationMs": 77500,
      "reason": "knockout",
      "bossHP": 1840,
      "bossRemaining": 0
    },
    {
      "level": 50,
      "seed": 20261127,
      "outcome": "defeat",
      "rounds": 120,
      "durationMs": 300000,
      "reason": "timeout",
      "bossHP": 1953,
      "bossRemaining": 1761
    },
    {
      "level": 50,
      "seed": 20261144,
      "outcome": "defeat",
      "rounds": 120,
      "durationMs": 300000,
      "reason": "timeout",
      "bossHP": 1953,
      "bossRemaining": 1832
    },
    {
      "level": 50,
      "seed": 20261158,
      "outcome": "defeat",
      "rounds": 120,
      "durationMs": 300000,
      "reason": "timeout",
      "bossHP": 1953,
      "bossRemaining": 1680
    }
  ]
}
```

Level 10-40: 12/12 victories, 20-77.5s. Level 50: 0/3 wins, all 300s timeouts, boss retains 1680-1832 of 1953 HP. Not a same-grade test; fast lower levels are expected from an overleveled group. Does not establish five-minute appropriate-level balance. Huge boss HP also inflated percentage healing; candidate follow-up limits boss incoming healing base to ordinary unscaled HP without modifying arena or player healing. Added same-grade mixed vs counter screen (30 bouts); pending CI, record actual outcomes before further tuning.
