# GROUP-COUNTERS-001 — first max-only tactical screen

Candidate head `0ff3206526522318c2bee2e145cb4d523e797c56`, [website run 45982905013](https://github.com/janisp123/idle_game/actions/runs/45982905013), [raw PR evidence](https://github.com/janisp123/idle_game/pull/200#issuecomment-7216036032). Actual shared resolver, commands `node --test tools/test_group_endgame.mjs tools/test_group_combat.mjs tools/test_group_timeline.mjs`. STR141 DEX141 END129, Fighting52, S Masterwork all five equipment slots, fully trained selected mastery, expertise, stance and Teamwork50. No lower-grade balance sweep. Same independent 60-clone cohort and paired orientations as baseline, 5040 bouts, plus 840 paired direct-role contests. Seeds and terrain cells in JSON below. 161 tests and mobile/desktop Chromium passed; at recording the remaining Manager endgame workflow was pending.

## Interpretation

Seven archers: 35/120 (29.2%) versus 115/120 (95.8%) baseline. Tanks 40/40 vs pure ranged, mages 40/40 vs tanks, archers 34/40 vs mages and 40/40 vs healers, melee 35/40 vs healers. Pure tank/support stacks 0/120 and 2/120 vs mixed clones, not necessarily a defect for specialized protectors, but mixed-team utility needs more evidence. Summoners 86W/33L/1D (71.7%), mages 78/120 (65%), default 49/120 (40.8%). Many bouts reach the 32-round limit. Single-slot substitution screen does not establish global composition optima; pure stacks are stress fixtures, not required equally viable strategies. Existing terrain rolls, costs, cap and rank unchanged. Next revision moderates shielded arrow impact and hybrid summoner damage; adds reachable-target priority, actual bridge movement choke, exact old frozen-rule payout regression and class guidance. Candidate not accepted or deployed.

## Raw structured results

```json
{
  "screen": {
    "seeds": [
      20261127,
      20261219
    ],
    "shared": {
      "difficulty": 7,
      "str": 141,
      "dex": 141,
      "end": 129,
      "skill": 52
    },
    "fixtures": 60,
    "configs": 42,
    "bouts": 5040,
    "results": [
      {
        "name": "default",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          49,
          71,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1903.6499999999999
      },
      {
        "name": "sub:blademaster",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          49,
          71,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1903.6499999999999
      },
      {
        "name": "sub:linebreaker",
        "ids": [
          "oathkeeper",
          "linebreaker",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            33,
            27,
            0
          ],
          [
            32,
            28,
            0
          ]
        ],
        "zones": {
          "open_field": [
            13,
            11,
            0
          ],
          "narrow_bridge": [
            18,
            6,
            0
          ],
          "ruined_streets": [
            14,
            10,
            0
          ],
          "walled_courtyard": [
            8,
            16,
            0
          ],
          "gatehouse_chamber": [
            12,
            12,
            0
          ]
        },
        "totals": [
          65,
          55,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.95,
        "grossCoinsPerHour": 2525.25
      },
      {
        "name": "sub:oathkeeper",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          49,
          71,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1903.6499999999999
      },
      {
        "name": "sub:grimwarden",
        "ids": [
          "grimwarden",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            26,
            34,
            0
          ],
          [
            29,
            31,
            0
          ]
        ],
        "zones": {
          "open_field": [
            12,
            12,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            11,
            13,
            0
          ],
          "walled_courtyard": [
            10,
            14,
            0
          ],
          "gatehouse_chamber": [
            7,
            17,
            0
          ]
        },
        "totals": [
          55,
          65,
          0
        ],
        "bouts": 120,
        "avgRounds": 32,
        "grossCoinsPerHour": 2136.75
      },
      {
        "name": "sub:trickblade",
        "ids": [
          "oathkeeper",
          "trickblade",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            19,
            41,
            0
          ],
          [
            23,
            37,
            0
          ]
        ],
        "zones": {
          "open_field": [
            7,
            17,
            0
          ],
          "narrow_bridge": [
            12,
            12,
            0
          ],
          "ruined_streets": [
            5,
            19,
            0
          ],
          "walled_courtyard": [
            9,
            15,
            0
          ],
          "gatehouse_chamber": [
            9,
            15,
            0
          ]
        },
        "totals": [
          42,
          78,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.95,
        "grossCoinsPerHour": 1631.6999999999998
      },
      {
        "name": "sub:longshot",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          49,
          71,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1903.6499999999999
      },
      {
        "name": "sub:flameweaver",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          49,
          71,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1903.6499999999999
      },
      {
        "name": "sub:gravebinder",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "gravebinder",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            27,
            33,
            0
          ],
          [
            24,
            35,
            1
          ]
        ],
        "zones": {
          "open_field": [
            11,
            13,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            10,
            14,
            0
          ],
          "walled_courtyard": [
            8,
            16,
            0
          ],
          "gatehouse_chamber": [
            7,
            16,
            1
          ]
        },
        "totals": [
          51,
          68,
          1
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1981.3500000000001
      },
      {
        "name": "sub:beastcaller",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "beastcaller"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            39,
            21,
            0
          ],
          [
            34,
            26,
            0
          ]
        ],
        "zones": {
          "open_field": [
            12,
            12,
            0
          ],
          "narrow_bridge": [
            18,
            6,
            0
          ],
          "ruined_streets": [
            12,
            12,
            0
          ],
          "walled_courtyard": [
            14,
            10,
            0
          ],
          "gatehouse_chamber": [
            17,
            7,
            0
          ]
        },
        "totals": [
          73,
          47,
          0
        ],
        "bouts": 120,
        "avgRounds": 32,
        "grossCoinsPerHour": 2836.0499999999997
      },
      {
        "name": "sub:lifekeeper",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          49,
          71,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1903.6499999999999
      },
      {
        "name": "sub:runesage",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "runesage",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            27,
            33,
            0
          ],
          [
            28,
            32,
            0
          ]
        ],
        "zones": {
          "open_field": [
            13,
            11,
            0
          ],
          "narrow_bridge": [
            16,
            8,
            0
          ],
          "ruined_streets": [
            8,
            16,
            0
          ],
          "walled_courtyard": [
            10,
            14,
            0
          ],
          "gatehouse_chamber": [
            8,
            16,
            0
          ]
        },
        "totals": [
          55,
          65,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.925,
        "grossCoinsPerHour": 2136.75
      },
      {
        "name": "sub:grovewarden",
        "ids": [
          "grovewarden",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          49,
          71,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1903.6499999999999
      },
      {
        "name": "sub:wardchanter",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            15,
            9,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          49,
          71,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 1903.6499999999999
      },
      {
        "name": "sub:swiftblade",
        "ids": [
          "oathkeeper",
          "swiftblade",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            21,
            39,
            0
          ],
          [
            21,
            39,
            0
          ]
        ],
        "zones": {
          "open_field": [
            5,
            19,
            0
          ],
          "narrow_bridge": [
            13,
            11,
            0
          ],
          "ruined_streets": [
            8,
            16,
            0
          ],
          "walled_courtyard": [
            11,
            13,
            0
          ],
          "gatehouse_chamber": [
            5,
            19,
            0
          ]
        },
        "totals": [
          42,
          78,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.925,
        "grossCoinsPerHour": 1631.6999999999998
      },
      {
        "name": "sub:windbow",
        "ids": [
          "oathkeeper",
          "blademaster",
          "windbow",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            21,
            39,
            0
          ],
          [
            27,
            33,
            0
          ]
        ],
        "zones": {
          "open_field": [
            11,
            13,
            0
          ],
          "narrow_bridge": [
            13,
            11,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            7,
            17,
            0
          ],
          "gatehouse_chamber": [
            8,
            16,
            0
          ]
        },
        "totals": [
          48,
          72,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.975,
        "grossCoinsPerHour": 1864.8000000000002
      },
      {
        "name": "sub:frostweaver",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "frostweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            17,
            43,
            0
          ],
          [
            24,
            36,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            16,
            8,
            0
          ],
          "ruined_streets": [
            6,
            18,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            4,
            20,
            0
          ]
        },
        "totals": [
          41,
          79,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.975,
        "grossCoinsPerHour": 1592.8500000000001
      },
      {
        "name": "sub:spiritcaller",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "spiritcaller"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            43,
            17,
            0
          ],
          [
            32,
            28,
            0
          ]
        ],
        "zones": {
          "open_field": [
            16,
            8,
            0
          ],
          "narrow_bridge": [
            18,
            6,
            0
          ],
          "ruined_streets": [
            12,
            12,
            0
          ],
          "walled_courtyard": [
            15,
            9,
            0
          ],
          "gatehouse_chamber": [
            14,
            10,
            0
          ]
        },
        "totals": [
          75,
          45,
          0
        ],
        "bouts": 120,
        "avgRounds": 32,
        "grossCoinsPerHour": 2913.75
      },
      {
        "name": "sub:wellspring",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "wellspring",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            22,
            38,
            0
          ],
          [
            21,
            39,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            12,
            12,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            5,
            19,
            0
          ],
          "gatehouse_chamber": [
            8,
            16,
            0
          ]
        },
        "totals": [
          43,
          77,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.975,
        "grossCoinsPerHour": 1670.5500000000002
      },
      {
        "name": "sub:dreadguard",
        "ids": [
          "dreadguard",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            32,
            28,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            17,
            7,
            0
          ],
          "ruined_streets": [
            14,
            10,
            0
          ],
          "walled_courtyard": [
            9,
            15,
            0
          ],
          "gatehouse_chamber": [
            8,
            16,
            0
          ]
        },
        "totals": [
          57,
          63,
          0
        ],
        "bouts": 120,
        "avgRounds": 32,
        "grossCoinsPerHour": 2214.45
      },
      {
        "name": "sub:war_dancer",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "war_dancer",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            22,
            38,
            0
          ],
          [
            30,
            30,
            0
          ]
        ],
        "zones": {
          "open_field": [
            11,
            13,
            0
          ],
          "narrow_bridge": [
            14,
            10,
            0
          ],
          "ruined_streets": [
            8,
            16,
            0
          ],
          "walled_courtyard": [
            10,
            14,
            0
          ],
          "gatehouse_chamber": [
            9,
            15,
            0
          ]
        },
        "totals": [
          52,
          68,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.95,
        "grossCoinsPerHour": 2020.2
      },
      {
        "name": "sub:nightblade",
        "ids": [
          "oathkeeper",
          "nightblade",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            18,
            42,
            0
          ],
          [
            23,
            37,
            0
          ]
        ],
        "zones": {
          "open_field": [
            6,
            18,
            0
          ],
          "narrow_bridge": [
            12,
            12,
            0
          ],
          "ruined_streets": [
            5,
            19,
            0
          ],
          "walled_courtyard": [
            9,
            15,
            0
          ],
          "gatehouse_chamber": [
            9,
            15,
            0
          ]
        },
        "totals": [
          41,
          79,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.933333333333334,
        "grossCoinsPerHour": 1592.8500000000001
      },
      {
        "name": "sub:blackbow",
        "ids": [
          "oathkeeper",
          "blademaster",
          "blackbow",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            23,
            37,
            0
          ],
          [
            28,
            32,
            0
          ]
        ],
        "zones": {
          "open_field": [
            8,
            16,
            0
          ],
          "narrow_bridge": [
            16,
            8,
            0
          ],
          "ruined_streets": [
            8,
            16,
            0
          ],
          "walled_courtyard": [
            8,
            16,
            0
          ],
          "gatehouse_chamber": [
            11,
            13,
            0
          ]
        },
        "totals": [
          51,
          69,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.975,
        "grossCoinsPerHour": 1981.3500000000001
      },
      {
        "name": "sub:galescourge",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "galescourge",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            24,
            35,
            1
          ],
          [
            29,
            31,
            0
          ]
        ],
        "zones": {
          "open_field": [
            10,
            14,
            0
          ],
          "narrow_bridge": [
            14,
            10,
            0
          ],
          "ruined_streets": [
            8,
            15,
            1
          ],
          "walled_courtyard": [
            13,
            11,
            0
          ],
          "gatehouse_chamber": [
            8,
            16,
            0
          ]
        },
        "totals": [
          53,
          66,
          1
        ],
        "bouts": 120,
        "avgRounds": 31.958333333333332,
        "grossCoinsPerHour": 2059.05
      },
      {
        "name": "sub:shadebinder",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "shadebinder"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            39,
            21,
            0
          ],
          [
            34,
            26,
            0
          ]
        ],
        "zones": {
          "open_field": [
            14,
            10,
            0
          ],
          "narrow_bridge": [
            17,
            7,
            0
          ],
          "ruined_streets": [
            14,
            10,
            0
          ],
          "walled_courtyard": [
            11,
            13,
            0
          ],
          "gatehouse_chamber": [
            17,
            7,
            0
          ]
        },
        "totals": [
          73,
          47,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.95,
        "grossCoinsPerHour": 2836.0499999999997
      },
      {
        "name": "sub:bloodsage",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "bloodsage",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            19,
            41,
            0
          ],
          [
            17,
            43,
            0
          ]
        ],
        "zones": {
          "open_field": [
            8,
            16,
            0
          ],
          "narrow_bridge": [
            13,
            11,
            0
          ],
          "ruined_streets": [
            6,
            18,
            0
          ],
          "walled_courtyard": [
            4,
            20,
            0
          ],
          "gatehouse_chamber": [
            5,
            19,
            0
          ]
        },
        "totals": [
          36,
          84,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.991666666666667,
        "grossCoinsPerHour": 1398.6000000000001
      },
      {
        "name": "sub:ragebreaker",
        "ids": [
          "oathkeeper",
          "ragebreaker",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            20,
            40,
            0
          ],
          [
            21,
            39,
            0
          ]
        ],
        "zones": {
          "open_field": [
            7,
            17,
            0
          ],
          "narrow_bridge": [
            13,
            11,
            0
          ],
          "ruined_streets": [
            5,
            19,
            0
          ],
          "walled_courtyard": [
            6,
            18,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          41,
          79,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.975,
        "grossCoinsPerHour": 1592.8500000000001
      },
      {
        "name": "sub:ironfist",
        "ids": [
          "oathkeeper",
          "ironfist",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            24,
            36,
            0
          ],
          [
            31,
            29,
            0
          ]
        ],
        "zones": {
          "open_field": [
            7,
            17,
            0
          ],
          "narrow_bridge": [
            14,
            10,
            0
          ],
          "ruined_streets": [
            8,
            16,
            0
          ],
          "walled_courtyard": [
            10,
            14,
            0
          ],
          "gatehouse_chamber": [
            16,
            8,
            0
          ]
        },
        "totals": [
          55,
          65,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.925,
        "grossCoinsPerHour": 2136.75
      },
      {
        "name": "sub:hexchief",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "hexchief",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            35,
            25,
            0
          ],
          [
            29,
            31,
            0
          ]
        ],
        "zones": {
          "open_field": [
            16,
            8,
            0
          ],
          "narrow_bridge": [
            14,
            10,
            0
          ],
          "ruined_streets": [
            12,
            12,
            0
          ],
          "walled_courtyard": [
            13,
            11,
            0
          ],
          "gatehouse_chamber": [
            9,
            15,
            0
          ]
        },
        "totals": [
          64,
          56,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.983333333333334,
        "grossCoinsPerHour": 2486.3999999999996
      },
      {
        "name": "sub:warcaller",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "warcaller",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            27,
            33,
            0
          ],
          [
            33,
            27,
            0
          ]
        ],
        "zones": {
          "open_field": [
            15,
            9,
            0
          ],
          "narrow_bridge": [
            14,
            10,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            13,
            11,
            0
          ],
          "gatehouse_chamber": [
            9,
            15,
            0
          ]
        },
        "totals": [
          60,
          60,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.966666666666665,
        "grossCoinsPerHour": 2331
      },
      {
        "name": "sub:scrapbreaker",
        "ids": [
          "oathkeeper",
          "scrapbreaker",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            29,
            31,
            0
          ],
          [
            29,
            31,
            0
          ]
        ],
        "zones": {
          "open_field": [
            13,
            11,
            0
          ],
          "narrow_bridge": [
            16,
            8,
            0
          ],
          "ruined_streets": [
            7,
            17,
            0
          ],
          "walled_courtyard": [
            9,
            15,
            0
          ],
          "gatehouse_chamber": [
            13,
            11,
            0
          ]
        },
        "totals": [
          58,
          62,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.991666666666667,
        "grossCoinsPerHour": 2253.3
      },
      {
        "name": "sub:forgecaller",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "forgecaller"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            21,
            39,
            0
          ],
          [
            33,
            27,
            0
          ]
        ],
        "zones": {
          "open_field": [
            11,
            13,
            0
          ],
          "narrow_bridge": [
            16,
            8,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            8,
            16,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          54,
          66,
          0
        ],
        "bouts": 120,
        "avgRounds": 32,
        "grossCoinsPerHour": 2097.9
      },
      {
        "name": "stack:tank",
        "ids": [
          "oathkeeper",
          "grimwarden",
          "grovewarden",
          "dreadguard",
          "oathkeeper",
          "grimwarden",
          "grovewarden"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            0,
            60,
            0
          ],
          [
            0,
            60,
            0
          ]
        ],
        "zones": {
          "open_field": [
            0,
            24,
            0
          ],
          "narrow_bridge": [
            0,
            24,
            0
          ],
          "ruined_streets": [
            0,
            24,
            0
          ],
          "walled_courtyard": [
            0,
            24,
            0
          ],
          "gatehouse_chamber": [
            0,
            24,
            0
          ]
        },
        "totals": [
          0,
          120,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.341666666666665,
        "grossCoinsPerHour": 0
      },
      {
        "name": "stack:melee",
        "ids": [
          "blademaster",
          "linebreaker",
          "trickblade",
          "swiftblade",
          "nightblade",
          "ragebreaker",
          "ironfist"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            21,
            39,
            0
          ],
          [
            20,
            40,
            0
          ]
        ],
        "zones": {
          "open_field": [
            2,
            22,
            0
          ],
          "narrow_bridge": [
            8,
            16,
            0
          ],
          "ruined_streets": [
            15,
            9,
            0
          ],
          "walled_courtyard": [
            8,
            16,
            0
          ],
          "gatehouse_chamber": [
            8,
            16,
            0
          ]
        },
        "totals": [
          41,
          79,
          0
        ],
        "bouts": 120,
        "avgRounds": 30.641666666666666,
        "grossCoinsPerHour": 1592.8500000000001
      },
      {
        "name": "stack:ranged",
        "ids": [
          "longshot",
          "windbow",
          "blackbow",
          "longshot",
          "windbow",
          "blackbow",
          "longshot"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            17,
            43,
            0
          ],
          [
            18,
            42,
            0
          ]
        ],
        "zones": {
          "open_field": [
            13,
            11,
            0
          ],
          "narrow_bridge": [
            13,
            11,
            0
          ],
          "ruined_streets": [
            6,
            18,
            0
          ],
          "walled_courtyard": [
            3,
            21,
            0
          ],
          "gatehouse_chamber": [
            0,
            24,
            0
          ]
        },
        "totals": [
          35,
          85,
          0
        ],
        "bouts": 120,
        "avgRounds": 30.3,
        "grossCoinsPerHour": 1359.75
      },
      {
        "name": "stack:mage",
        "ids": [
          "flameweaver",
          "gravebinder",
          "frostweaver",
          "galescourge",
          "flameweaver",
          "gravebinder",
          "frostweaver"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            41,
            19,
            0
          ],
          [
            37,
            23,
            0
          ]
        ],
        "zones": {
          "open_field": [
            22,
            2,
            0
          ],
          "narrow_bridge": [
            20,
            4,
            0
          ],
          "ruined_streets": [
            10,
            14,
            0
          ],
          "walled_courtyard": [
            12,
            12,
            0
          ],
          "gatehouse_chamber": [
            14,
            10,
            0
          ]
        },
        "totals": [
          78,
          42,
          0
        ],
        "bouts": 120,
        "avgRounds": 28.716666666666665,
        "grossCoinsPerHour": 3030.2999999999997
      },
      {
        "name": "stack:healer",
        "ids": [
          "lifekeeper",
          "wellspring",
          "bloodsage",
          "lifekeeper",
          "wellspring",
          "bloodsage",
          "lifekeeper"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            24,
            36,
            0
          ],
          [
            19,
            41,
            0
          ]
        ],
        "zones": {
          "open_field": [
            13,
            11,
            0
          ],
          "narrow_bridge": [
            14,
            10,
            0
          ],
          "ruined_streets": [
            2,
            22,
            0
          ],
          "walled_courtyard": [
            7,
            17,
            0
          ],
          "gatehouse_chamber": [
            7,
            17,
            0
          ]
        },
        "totals": [
          43,
          77,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.991666666666667,
        "grossCoinsPerHour": 1670.5500000000002
      },
      {
        "name": "stack:support",
        "ids": [
          "runesage",
          "wardchanter",
          "war_dancer",
          "hexchief",
          "warcaller",
          "runesage",
          "wardchanter"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            2,
            58,
            0
          ],
          [
            0,
            60,
            0
          ]
        ],
        "zones": {
          "open_field": [
            0,
            24,
            0
          ],
          "narrow_bridge": [
            1,
            23,
            0
          ],
          "ruined_streets": [
            1,
            23,
            0
          ],
          "walled_courtyard": [
            0,
            24,
            0
          ],
          "gatehouse_chamber": [
            0,
            24,
            0
          ]
        },
        "totals": [
          2,
          118,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.766666666666666,
        "grossCoinsPerHour": 77.69999999999999
      },
      {
        "name": "stack:summoner",
        "ids": [
          "beastcaller",
          "spiritcaller",
          "shadebinder",
          "forgecaller",
          "beastcaller",
          "spiritcaller",
          "shadebinder"
        ],
        "stances": [
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced",
          "balanced"
        ],
        "sets": [
          [
            42,
            18,
            0
          ],
          [
            44,
            15,
            1
          ]
        ],
        "zones": {
          "open_field": [
            19,
            5,
            0
          ],
          "narrow_bridge": [
            22,
            2,
            0
          ],
          "ruined_streets": [
            10,
            14,
            0
          ],
          "walled_courtyard": [
            19,
            5,
            0
          ],
          "gatehouse_chamber": [
            16,
            7,
            1
          ]
        },
        "totals": [
          86,
          33,
          1
        ],
        "bouts": 120,
        "avgRounds": 30.308333333333334,
        "grossCoinsPerHour": 3341.1000000000004
      },
      {
        "name": "all aggressive",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "aggressive",
          "aggressive",
          "aggressive",
          "aggressive",
          "aggressive",
          "aggressive",
          "aggressive"
        ],
        "sets": [
          [
            21,
            39,
            0
          ],
          [
            22,
            38,
            0
          ]
        ],
        "zones": {
          "open_field": [
            8,
            16,
            0
          ],
          "narrow_bridge": [
            11,
            13,
            0
          ],
          "ruined_streets": [
            10,
            14,
            0
          ],
          "walled_courtyard": [
            7,
            17,
            0
          ],
          "gatehouse_chamber": [
            7,
            17,
            0
          ]
        },
        "totals": [
          43,
          77,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.916666666666668,
        "grossCoinsPerHour": 1670.5500000000002
      },
      {
        "name": "all defensive",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "defensive",
          "defensive",
          "defensive",
          "defensive",
          "defensive",
          "defensive",
          "defensive"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            23,
            37,
            0
          ]
        ],
        "zones": {
          "open_field": [
            8,
            16,
            0
          ],
          "narrow_bridge": [
            11,
            13,
            0
          ],
          "ruined_streets": [
            11,
            13,
            0
          ],
          "walled_courtyard": [
            8,
            16,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          48,
          72,
          0
        ],
        "bouts": 120,
        "avgRounds": 32,
        "grossCoinsPerHour": 1864.8000000000002
      },
      {
        "name": "role stances",
        "ids": [
          "oathkeeper",
          "blademaster",
          "longshot",
          "flameweaver",
          "lifekeeper",
          "wardchanter",
          "war_dancer"
        ],
        "stances": [
          "defensive",
          "aggressive",
          "aggressive",
          "balanced",
          "defensive",
          "defensive",
          "balanced"
        ],
        "sets": [
          [
            25,
            35,
            0
          ],
          [
            31,
            29,
            0
          ]
        ],
        "zones": {
          "open_field": [
            9,
            15,
            0
          ],
          "narrow_bridge": [
            14,
            10,
            0
          ],
          "ruined_streets": [
            9,
            15,
            0
          ],
          "walled_courtyard": [
            14,
            10,
            0
          ],
          "gatehouse_chamber": [
            10,
            14,
            0
          ]
        },
        "totals": [
          56,
          64,
          0
        ],
        "bouts": 120,
        "avgRounds": 31.991666666666667,
        "grossCoinsPerHour": 2175.6000000000004
      }
    ]
  },
  "counterMatrix": {
    "bouts": 840,
    "matrix": [
      {
        "a": "tank",
        "b": "melee",
        "zones": {
          "open_field": [
            0,
            8,
            0
          ],
          "narrow_bridge": [
            0,
            8,
            0
          ],
          "ruined_streets": [
            0,
            8,
            0
          ],
          "walled_courtyard": [
            0,
            8,
            0
          ],
          "gatehouse_chamber": [
            0,
            8,
            0
          ]
        },
        "totals": [
          0,
          40,
          0
        ]
      },
      {
        "a": "tank",
        "b": "ranged",
        "zones": {
          "open_field": [
            8,
            0,
            0
          ],
          "narrow_bridge": [
            8,
            0,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            8,
            0,
            0
          ],
          "gatehouse_chamber": [
            8,
            0,
            0
          ]
        },
        "totals": [
          40,
          0,
          0
        ]
      },
      {
        "a": "tank",
        "b": "mage",
        "zones": {
          "open_field": [
            0,
            8,
            0
          ],
          "narrow_bridge": [
            0,
            8,
            0
          ],
          "ruined_streets": [
            0,
            8,
            0
          ],
          "walled_courtyard": [
            0,
            8,
            0
          ],
          "gatehouse_chamber": [
            0,
            8,
            0
          ]
        },
        "totals": [
          0,
          40,
          0
        ]
      },
      {
        "a": "tank",
        "b": "healer",
        "zones": {
          "open_field": [
            0,
            8,
            0
          ],
          "narrow_bridge": [
            0,
            8,
            0
          ],
          "ruined_streets": [
            0,
            8,
            0
          ],
          "walled_courtyard": [
            0,
            8,
            0
          ],
          "gatehouse_chamber": [
            0,
            8,
            0
          ]
        },
        "totals": [
          0,
          40,
          0
        ]
      },
      {
        "a": "tank",
        "b": "support",
        "zones": {
          "open_field": [
            0,
            8,
            0
          ],
          "narrow_bridge": [
            0,
            8,
            0
          ],
          "ruined_streets": [
            2,
            6,
            0
          ],
          "walled_courtyard": [
            0,
            8,
            0
          ],
          "gatehouse_chamber": [
            0,
            8,
            0
          ]
        },
        "totals": [
          2,
          38,
          0
        ]
      },
      {
        "a": "tank",
        "b": "summoner",
        "zones": {
          "open_field": [
            0,
            8,
            0
          ],
          "narrow_bridge": [
            0,
            8,
            0
          ],
          "ruined_streets": [
            0,
            8,
            0
          ],
          "walled_courtyard": [
            0,
            8,
            0
          ],
          "gatehouse_chamber": [
            0,
            8,
            0
          ]
        },
        "totals": [
          0,
          40,
          0
        ]
      },
      {
        "a": "melee",
        "b": "ranged",
        "zones": {
          "open_field": [
            1,
            7,
            0
          ],
          "narrow_bridge": [
            1,
            7,
            0
          ],
          "ruined_streets": [
            7,
            1,
            0
          ],
          "walled_courtyard": [
            3,
            5,
            0
          ],
          "gatehouse_chamber": [
            7,
            1,
            0
          ]
        },
        "totals": [
          19,
          21,
          0
        ]
      },
      {
        "a": "melee",
        "b": "mage",
        "zones": {
          "open_field": [
            1,
            7,
            0
          ],
          "narrow_bridge": [
            0,
            8,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            4,
            4,
            0
          ],
          "gatehouse_chamber": [
            6,
            2,
            0
          ]
        },
        "totals": [
          19,
          21,
          0
        ]
      },
      {
        "a": "melee",
        "b": "healer",
        "zones": {
          "open_field": [
            5,
            3,
            0
          ],
          "narrow_bridge": [
            6,
            2,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            8,
            0,
            0
          ],
          "gatehouse_chamber": [
            8,
            0,
            0
          ]
        },
        "totals": [
          35,
          5,
          0
        ]
      },
      {
        "a": "melee",
        "b": "support",
        "zones": {
          "open_field": [
            6,
            2,
            0
          ],
          "narrow_bridge": [
            5,
            3,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            7,
            1,
            0
          ],
          "gatehouse_chamber": [
            6,
            2,
            0
          ]
        },
        "totals": [
          32,
          8,
          0
        ]
      },
      {
        "a": "melee",
        "b": "summoner",
        "zones": {
          "open_field": [
            1,
            7,
            0
          ],
          "narrow_bridge": [
            1,
            7,
            0
          ],
          "ruined_streets": [
            6,
            2,
            0
          ],
          "walled_courtyard": [
            3,
            5,
            0
          ],
          "gatehouse_chamber": [
            5,
            3,
            0
          ]
        },
        "totals": [
          16,
          24,
          0
        ]
      },
      {
        "a": "ranged",
        "b": "mage",
        "zones": {
          "open_field": [
            8,
            0,
            0
          ],
          "narrow_bridge": [
            8,
            0,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            7,
            1,
            0
          ],
          "gatehouse_chamber": [
            3,
            5,
            0
          ]
        },
        "totals": [
          34,
          6,
          0
        ]
      },
      {
        "a": "ranged",
        "b": "healer",
        "zones": {
          "open_field": [
            8,
            0,
            0
          ],
          "narrow_bridge": [
            8,
            0,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            8,
            0,
            0
          ],
          "gatehouse_chamber": [
            8,
            0,
            0
          ]
        },
        "totals": [
          40,
          0,
          0
        ]
      },
      {
        "a": "ranged",
        "b": "support",
        "zones": {
          "open_field": [
            8,
            0,
            0
          ],
          "narrow_bridge": [
            8,
            0,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            8,
            0,
            0
          ],
          "gatehouse_chamber": [
            8,
            0,
            0
          ]
        },
        "totals": [
          40,
          0,
          0
        ]
      },
      {
        "a": "ranged",
        "b": "summoner",
        "zones": {
          "open_field": [
            8,
            0,
            0
          ],
          "narrow_bridge": [
            8,
            0,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            8,
            0,
            0
          ],
          "gatehouse_chamber": [
            5,
            3,
            0
          ]
        },
        "totals": [
          37,
          3,
          0
        ]
      },
      {
        "a": "mage",
        "b": "healer",
        "zones": {
          "open_field": [
            8,
            0,
            0
          ],
          "narrow_bridge": [
            7,
            1,
            0
          ],
          "ruined_streets": [
            4,
            4,
            0
          ],
          "walled_courtyard": [
            6,
            2,
            0
          ],
          "gatehouse_chamber": [
            5,
            3,
            0
          ]
        },
        "totals": [
          30,
          10,
          0
        ]
      },
      {
        "a": "mage",
        "b": "support",
        "zones": {
          "open_field": [
            8,
            0,
            0
          ],
          "narrow_bridge": [
            8,
            0,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            8,
            0,
            0
          ],
          "gatehouse_chamber": [
            8,
            0,
            0
          ]
        },
        "totals": [
          40,
          0,
          0
        ]
      },
      {
        "a": "mage",
        "b": "summoner",
        "zones": {
          "open_field": [
            4,
            4,
            0
          ],
          "narrow_bridge": [
            3,
            5,
            0
          ],
          "ruined_streets": [
            6,
            2,
            0
          ],
          "walled_courtyard": [
            2,
            6,
            0
          ],
          "gatehouse_chamber": [
            6,
            2,
            0
          ]
        },
        "totals": [
          21,
          19,
          0
        ]
      },
      {
        "a": "healer",
        "b": "support",
        "zones": {
          "open_field": [
            8,
            0,
            0
          ],
          "narrow_bridge": [
            8,
            0,
            0
          ],
          "ruined_streets": [
            8,
            0,
            0
          ],
          "walled_courtyard": [
            8,
            0,
            0
          ],
          "gatehouse_chamber": [
            8,
            0,
            0
          ]
        },
        "totals": [
          40,
          0,
          0
        ]
      },
      {
        "a": "healer",
        "b": "summoner",
        "zones": {
          "open_field": [
            0,
            8,
            0
          ],
          "narrow_bridge": [
            2,
            6,
            0
          ],
          "ruined_streets": [
            6,
            2,
            0
          ],
          "walled_courtyard": [
            2,
            6,
            0
          ],
          "gatehouse_chamber": [
            2,
            6,
            0
          ]
        },
        "totals": [
          12,
          28,
          0
        ]
      },
      {
        "a": "support",
        "b": "summoner",
        "zones": {
          "open_field": [
            0,
            8,
            0
          ],
          "narrow_bridge": [
            0,
            8,
            0
          ],
          "ruined_streets": [
            0,
            8,
            0
          ],
          "walled_courtyard": [
            0,
            8,
            0
          ],
          "gatehouse_chamber": [
            0,
            8,
            0
          ]
        },
        "totals": [
          0,
          40,
          0
        ]
      }
    ]
  }
}
```
