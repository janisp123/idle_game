# Interlude control v7

INTERLUDE-CONTROL-001 — Owner approved trying skill-identity changes and tests. Main 938ffc8: v6 geometry merged #211, 194/194 and seven CI checks. V7 public arena candidate, two active skills retained, v1–v6 frozen rules preserved; raids stay v5 until separate calibration. New action-consuming non-damaging tactical utility may target threats other than tank (direct damaging attacks still tank-first). Distinct root/slow/stun/paralysis/sleep/silence, Gloom magic vulnerability, antiheal, physical vulnerability, dispel and cleanse; shared hard/movement immunity, no refresh while active, CON/MEN resistance, sleep breaks on damage. Three archers receive Stunning Shot (control-only abstraction); Gravebinder Gloom + antiheal and Anchor; Bloodsage root and melee lifesteal through heal; Runesage root, Wellspring cleanse, others selective revised abilities. Not literal retail skill costs/rates, no mana, no extra actors. All 31 retain two abilities, several existing kits unchanged; class UI shows candidate names; raid legacy kit differences remain. 1200 matched v6/v7 and 2700 v7 broad bouts plus existing 3900 geometry comparison; diagnostic coverage, not universal balance guarantee. Pending CI.

Research: [PR #212](https://github.com/janisp123/idle_game/pull/212). Exact provisional kit registry CONTROL_CLASS_KITS and CONTROL_BALANCE. Log markers INTERLUDE_CONTROL_MATCHED, INTERLUDE_CONTROL_MATRIX. No automatic approval of final balance.


### First verified simulation screen

Candidate `dc54c9c`, website run 46018394468, job 140571365060: 197/197 Node tests passed and 3900 new simulations completed. Original matched ranged vs melee v6→v7 (60 per terrain): open 40→29, bridge 31→14, ruins 0→1, courtyard 4→5, gatehouse 3→4. Control-oriented ranged vs control-oriented melee: open 57→41, bridge 58→42, ruins 1→0, courtyard 9→4, gatehouse 1→0. Stronger class/terrain dependence but deterioration from v6 in open/bridge even for control-oriented team; not a final balance acceptance. Most long-range bouts reach round limit. V7 status use confirmed in real traces including sleep, silence, root, stun, paralysis, cleanse, dispel, antiheal. Browser smoke failed because assertions still read legacy CLASS_KITS rather than CONTROL_CLASS_KITS; update expected registry only, retain every UI assertion. All final-head checks required before merge. Future tuning: inspect control action/recovery opportunity cost and status resistance/target value; do not flatten class identities. No gameplay changes in this follow-up.

```json
{
  "INTERLUDE_CONTROL_MATCHED": {
    "hours": 3700,
    "rows": [
      {
        "name": "original",
        "zone": "open_field",
        "rules": 6,
        "wins": [
          40,
          20,
          0
        ],
        "timeouts": 60,
        "firstDpsRoundSum": [
          60,
          403
        ],
        "events": {
          "slow": 166,
          "resist": 63
        }
      },
      {
        "name": "original",
        "zone": "open_field",
        "rules": 7,
        "wins": [
          29,
          31,
          0
        ],
        "timeouts": 60,
        "firstDpsRoundSum": [
          180,
          368
        ],
        "events": {
          "stun": 550,
          "disabled": 697,
          "root": 229,
          "resist": 326,
          "dispel": 210,
          "physical_vulnerability": 49,
          "silence": 159,
          "silenced": 125
        }
      },
      {
        "name": "original",
        "zone": "narrow_bridge",
        "rules": 6,
        "wins": [
          31,
          29,
          0
        ],
        "timeouts": 58,
        "firstDpsRoundSum": [
          60,
          300
        ],
        "events": {
          "slow": 189,
          "resist": 5
        }
      },
      {
        "name": "original",
        "zone": "narrow_bridge",
        "rules": 7,
        "wins": [
          14,
          46,
          0
        ],
        "timeouts": 60,
        "firstDpsRoundSum": [
          180,
          388
        ],
        "events": {
          "stun": 537,
          "resist": 288,
          "disabled": 854,
          "root": 281,
          "dispel": 230,
          "silence": 174,
          "silenced": 167,
          "physical_vulnerability": 10
        }
      },
      {
        "name": "original",
        "zone": "ruined_streets",
        "rules": 6,
        "wins": [
          0,
          60,
          0
        ],
        "timeouts": 49,
        "firstDpsRoundSum": [
          120,
          120
        ],
        "events": {
          "slow": 268,
          "resist": 23
        }
      },
      {
        "name": "original",
        "zone": "ruined_streets",
        "rules": 7,
        "wins": [
          1,
          59,
          0
        ],
        "timeouts": 51,
        "firstDpsRoundSum": [
          198,
          120
        ],
        "events": {
          "stun": 535,
          "disabled": 769,
          "root": 210,
          "resist": 282,
          "dispel": 139,
          "silence": 150,
          "silenced": 246,
          "physical_vulnerability": 30
        }
      },
      {
        "name": "original",
        "zone": "walled_courtyard",
        "rules": 6,
        "wins": [
          4,
          56,
          0
        ],
        "timeouts": 47,
        "firstDpsRoundSum": [
          120,
          120
        ],
        "events": {
          "slow": 228,
          "resist": 28
        }
      },
      {
        "name": "original",
        "zone": "walled_courtyard",
        "rules": 7,
        "wins": [
          5,
          55,
          0
        ],
        "timeouts": 44,
        "firstDpsRoundSum": [
          198,
          120
        ],
        "events": {
          "stun": 543,
          "disabled": 777,
          "root": 177,
          "resist": 280,
          "dispel": 139,
          "silence": 145,
          "silenced": 238,
          "physical_vulnerability": 51
        }
      },
      {
        "name": "original",
        "zone": "gatehouse_chamber",
        "rules": 6,
        "wins": [
          3,
          57,
          0
        ],
        "timeouts": 39,
        "firstDpsRoundSum": [
          60,
          60
        ],
        "events": {
          "slow": 278,
          "resist": 31
        }
      },
      {
        "name": "original",
        "zone": "gatehouse_chamber",
        "rules": 7,
        "wins": [
          4,
          56,
          0
        ],
        "timeouts": 45,
        "firstDpsRoundSum": [
          182,
          60
        ],
        "events": {
          "stun": 581,
          "disabled": 774,
          "root": 230,
          "silence": 170,
          "silenced": 238,
          "dispel": 179,
          "resist": 291,
          "physical_vulnerability": 47
        }
      },
      {
        "name": "control_synergy",
        "zone": "open_field",
        "rules": 6,
        "wins": [
          57,
          3,
          0
        ],
        "timeouts": 44,
        "firstDpsRoundSum": [
          60,
          453
        ],
        "events": {
          "slow": 269,
          "cleanse": 191,
          "resist": 38
        }
      },
      {
        "name": "control_synergy",
        "zone": "open_field",
        "rules": 7,
        "wins": [
          41,
          19,
          0
        ],
        "timeouts": 60,
        "firstDpsRoundSum": [
          180,
          550
        ],
        "events": {
          "stun": 528,
          "resist": 456,
          "cleanse": 510,
          "paralysis": 307,
          "disabled": 1437,
          "root": 535,
          "gloom": 217,
          "antiheal": 217,
          "slow": 137,
          "physical_vulnerability": 34
        }
      },
      {
        "name": "control_synergy",
        "zone": "narrow_bridge",
        "rules": 6,
        "wins": [
          58,
          2,
          0
        ],
        "timeouts": 46,
        "firstDpsRoundSum": [
          60,
          520
        ],
        "events": {
          "cleanse": 199,
          "slow": 256,
          "resist": 24
        }
      },
      {
        "name": "control_synergy",
        "zone": "narrow_bridge",
        "rules": 7,
        "wins": [
          42,
          18,
          0
        ],
        "timeouts": 60,
        "firstDpsRoundSum": [
          180,
          406
        ],
        "events": {
          "stun": 522,
          "resist": 423,
          "cleanse": 606,
          "root": 573,
          "paralysis": 293,
          "disabled": 1409,
          "gloom": 221,
          "antiheal": 221,
          "slow": 141,
          "physical_vulnerability": 2
        }
      },
      {
        "name": "control_synergy",
        "zone": "ruined_streets",
        "rules": 6,
        "wins": [
          1,
          59,
          0
        ],
        "timeouts": 47,
        "firstDpsRoundSum": [
          120,
          180
        ],
        "events": {
          "cleanse": 107,
          "slow": 230,
          "resist": 37
        }
      },
      {
        "name": "control_synergy",
        "zone": "ruined_streets",
        "rules": 7,
        "wins": [
          0,
          60,
          0
        ],
        "timeouts": 49,
        "firstDpsRoundSum": [
          302,
          164
        ],
        "events": {
          "stun": 529,
          "resist": 424,
          "cleanse": 464,
          "root": 458,
          "disabled": 1419,
          "paralysis": 327,
          "gloom": 156,
          "antiheal": 156,
          "slow": 54,
          "physical_vulnerability": 25
        }
      },
      {
        "name": "control_synergy",
        "zone": "walled_courtyard",
        "rules": 6,
        "wins": [
          9,
          51,
          0
        ],
        "timeouts": 51,
        "firstDpsRoundSum": [
          120,
          180
        ],
        "events": {
          "slow": 250,
          "cleanse": 146,
          "resist": 42
        }
      },
      {
        "name": "control_synergy",
        "zone": "walled_courtyard",
        "rules": 7,
        "wins": [
          4,
          56,
          0
        ],
        "timeouts": 57,
        "firstDpsRoundSum": [
          302,
          164
        ],
        "events": {
          "stun": 552,
          "resist": 434,
          "cleanse": 502,
          "root": 458,
          "disabled": 1385,
          "paralysis": 300,
          "gloom": 174,
          "antiheal": 174,
          "physical_vulnerability": 30,
          "slow": 103
        }
      },
      {
        "name": "control_synergy",
        "zone": "gatehouse_chamber",
        "rules": 6,
        "wins": [
          1,
          59,
          0
        ],
        "timeouts": 47,
        "firstDpsRoundSum": [
          60,
          120
        ],
        "events": {
          "slow": 267,
          "cleanse": 153,
          "resist": 28
        }
      },
      {
        "name": "control_synergy",
        "zone": "gatehouse_chamber",
        "rules": 7,
        "wins": [
          0,
          60,
          0
        ],
        "timeouts": 45,
        "firstDpsRoundSum": [
          184,
          111
        ],
        "events": {
          "stun": 512,
          "resist": 387,
          "cleanse": 432,
          "paralysis": 319,
          "disabled": 1380,
          "gloom": 143,
          "antiheal": 143,
          "root": 436,
          "slow": 86,
          "physical_vulnerability": 27
        }
      }
    ],
    "allEvents": {
      "stun": 5389,
      "disabled": 10901,
      "root": 3587,
      "resist": 3591,
      "dispel": 897,
      "physical_vulnerability": 305,
      "silence": 798,
      "silenced": 1014,
      "cleanse": 2514,
      "paralysis": 1546,
      "gloom": 911,
      "antiheal": 911,
      "slow": 521
    }
  },
  "INTERLUDE_CONTROL_MATRIX": {
    "bouts": 2700,
    "summary": {
      "open_field": {
        "balanced": [
          102,
          6,
          0
        ],
        "fortified": [
          95,
          13,
          0
        ],
        "archers": [
          81,
          27,
          0
        ],
        "daggers": [
          37,
          71,
          0
        ],
        "mages": [
          63,
          45,
          0
        ],
        "heavy_melee": [
          63,
          45,
          0
        ],
        "tanks": [
          27,
          81,
          0
        ],
        "healers": [
          11,
          97,
          0
        ],
        "summoners": [
          36,
          72,
          0
        ],
        "support": [
          25,
          83,
          0
        ]
      },
      "narrow_bridge": {
        "balanced": [
          103,
          5,
          0
        ],
        "fortified": [
          98,
          10,
          0
        ],
        "archers": [
          82,
          26,
          0
        ],
        "daggers": [
          10,
          98,
          0
        ],
        "mages": [
          75,
          33,
          0
        ],
        "heavy_melee": [
          56,
          52,
          0
        ],
        "tanks": [
          19,
          89,
          0
        ],
        "healers": [
          21,
          87,
          0
        ],
        "summoners": [
          47,
          61,
          0
        ],
        "support": [
          29,
          79,
          0
        ]
      },
      "ruined_streets": {
        "balanced": [
          95,
          13,
          0
        ],
        "fortified": [
          93,
          15,
          0
        ],
        "archers": [
          50,
          58,
          0
        ],
        "daggers": [
          68,
          40,
          0
        ],
        "mages": [
          20,
          88,
          0
        ],
        "heavy_melee": [
          86,
          22,
          0
        ],
        "tanks": [
          68,
          40,
          0
        ],
        "healers": [
          23,
          85,
          0
        ],
        "summoners": [
          3,
          105,
          0
        ],
        "support": [
          34,
          74,
          0
        ]
      },
      "walled_courtyard": {
        "balanced": [
          100,
          8,
          0
        ],
        "fortified": [
          93,
          15,
          0
        ],
        "archers": [
          58,
          50,
          0
        ],
        "daggers": [
          56,
          52,
          0
        ],
        "mages": [
          26,
          82,
          0
        ],
        "heavy_melee": [
          79,
          29,
          0
        ],
        "tanks": [
          60,
          48,
          0
        ],
        "healers": [
          20,
          88,
          0
        ],
        "summoners": [
          3,
          105,
          0
        ],
        "support": [
          45,
          63,
          0
        ]
      },
      "gatehouse_chamber": {
        "balanced": [
          100,
          8,
          0
        ],
        "fortified": [
          91,
          17,
          0
        ],
        "archers": [
          13,
          95,
          0
        ],
        "daggers": [
          68,
          40,
          0
        ],
        "mages": [
          32,
          76,
          0
        ],
        "heavy_melee": [
          85,
          23,
          0
        ],
        "tanks": [
          62,
          46,
          0
        ],
        "healers": [
          27,
          81,
          0
        ],
        "summoners": [
          2,
          106,
          0
        ],
        "support": [
          60,
          48,
          0
        ]
      }
    },
    "abilities": {
      "stunning_shot": 18218,
      "purifying_grace": 4331,
      "war_dance": 3306,
      "flame_burst": 11180,
      "greater_mend": 10640,
      "aimed_shot": 7889,
      "cleansing_mend": 5605,
      "sheltering_song": 7786,
      "hex_blade": 5444,
      "cancellation": 2720,
      "sonic_cleave": 7468,
      "arrest": 810,
      "group_mend": 1120,
      "execution_strike": 4686,
      "natures_renewal": 904,
      "twin_cut": 3353,
      "shield_stun": 6160,
      "sacrifice": 2484,
      "sword_cut": 5370,
      "last_shot": 444,
      "evade": 304,
      "dash": 1566,
      "entangle": 694,
      "misdirection": 4276,
      "feint": 3869,
      "ice_bind": 1186,
      "anchor": 2501,
      "frost_bolt": 4544,
      "silence": 820,
      "curse_gloom": 2739,
      "gale_strike": 1511,
      "brace": 759,
      "shock_sweep": 3135,
      "sweeping_thrust": 2934,
      "staggering_blow": 1124,
      "rage_strike": 2455,
      "last_stand": 347,
      "guard_break": 1083,
      "lightning_strike": 1719,
      "hamstring": 597,
      "panther_strike": 3676,
      "dread_strike": 1368,
      "dryad_root": 3413,
      "battle_mend": 2017,
      "seraphim_aid": 4644,
      "familiar_aid": 4777,
      "nightshade_curse": 3853,
      "familiar_strike": 4420,
      "spirit_bolt": 4326,
      "shade_strike": 3923,
      "siege_pulse": 844,
      "construct_strike": 560,
      "blessing": 3408,
      "madness": 2015,
      "battle_chant": 1566,
      "hex_bolt": 3160,
      "seal_of_silence": 727
    },
    "status": {
      "stun": 13244,
      "cleanse": 6303,
      "disabled": 31645,
      "dispel": 2114,
      "resist": 12100,
      "physical_vulnerability": 1679,
      "root": 4442,
      "slow": 2446,
      "paralysis": 3361,
      "silence": 1325,
      "gloom": 2180,
      "antiheal": 5252,
      "silenced": 1956,
      "sleep": 1596
    },
    "rows": [
      [
        "open_field",
        "balanced",
        "fortified",
        10,
        2,
        0
      ],
      [
        "open_field",
        "balanced",
        "archers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "balanced",
        "daggers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "balanced",
        "mages",
        9,
        3,
        0
      ],
      [
        "open_field",
        "balanced",
        "heavy_melee",
        11,
        1,
        0
      ],
      [
        "open_field",
        "balanced",
        "tanks",
        12,
        0,
        0
      ],
      [
        "open_field",
        "balanced",
        "healers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "balanced",
        "summoners",
        12,
        0,
        0
      ],
      [
        "open_field",
        "balanced",
        "support",
        12,
        0,
        0
      ],
      [
        "open_field",
        "fortified",
        "archers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "fortified",
        "daggers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "fortified",
        "mages",
        10,
        2,
        0
      ],
      [
        "open_field",
        "fortified",
        "heavy_melee",
        11,
        1,
        0
      ],
      [
        "open_field",
        "fortified",
        "tanks",
        12,
        0,
        0
      ],
      [
        "open_field",
        "fortified",
        "healers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "fortified",
        "summoners",
        12,
        0,
        0
      ],
      [
        "open_field",
        "fortified",
        "support",
        12,
        0,
        0
      ],
      [
        "open_field",
        "archers",
        "daggers",
        9,
        3,
        0
      ],
      [
        "open_field",
        "archers",
        "mages",
        12,
        0,
        0
      ],
      [
        "open_field",
        "archers",
        "heavy_melee",
        12,
        0,
        0
      ],
      [
        "open_field",
        "archers",
        "tanks",
        12,
        0,
        0
      ],
      [
        "open_field",
        "archers",
        "healers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "archers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "open_field",
        "archers",
        "support",
        12,
        0,
        0
      ],
      [
        "open_field",
        "daggers",
        "mages",
        9,
        3,
        0
      ],
      [
        "open_field",
        "daggers",
        "heavy_melee",
        4,
        8,
        0
      ],
      [
        "open_field",
        "daggers",
        "tanks",
        0,
        12,
        0
      ],
      [
        "open_field",
        "daggers",
        "healers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "daggers",
        "summoners",
        8,
        4,
        0
      ],
      [
        "open_field",
        "daggers",
        "support",
        1,
        11,
        0
      ],
      [
        "open_field",
        "mages",
        "heavy_melee",
        7,
        5,
        0
      ],
      [
        "open_field",
        "mages",
        "tanks",
        12,
        0,
        0
      ],
      [
        "open_field",
        "mages",
        "healers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "mages",
        "summoners",
        12,
        0,
        0
      ],
      [
        "open_field",
        "mages",
        "support",
        12,
        0,
        0
      ],
      [
        "open_field",
        "heavy_melee",
        "tanks",
        12,
        0,
        0
      ],
      [
        "open_field",
        "heavy_melee",
        "healers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "heavy_melee",
        "summoners",
        12,
        0,
        0
      ],
      [
        "open_field",
        "heavy_melee",
        "support",
        12,
        0,
        0
      ],
      [
        "open_field",
        "tanks",
        "healers",
        12,
        0,
        0
      ],
      [
        "open_field",
        "tanks",
        "summoners",
        1,
        11,
        0
      ],
      [
        "open_field",
        "tanks",
        "support",
        2,
        10,
        0
      ],
      [
        "open_field",
        "healers",
        "summoners",
        2,
        10,
        0
      ],
      [
        "open_field",
        "healers",
        "support",
        9,
        3,
        0
      ],
      [
        "open_field",
        "summoners",
        "support",
        11,
        1,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "fortified",
        10,
        2,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "archers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "daggers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "mages",
        9,
        3,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "heavy_melee",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "tanks",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "healers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "summoners",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "balanced",
        "support",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "fortified",
        "archers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "fortified",
        "daggers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "fortified",
        "mages",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "fortified",
        "heavy_melee",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "fortified",
        "tanks",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "fortified",
        "healers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "fortified",
        "summoners",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "fortified",
        "support",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "archers",
        "daggers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "archers",
        "mages",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "archers",
        "heavy_melee",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "archers",
        "tanks",
        10,
        2,
        0
      ],
      [
        "narrow_bridge",
        "archers",
        "healers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "archers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "archers",
        "support",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "daggers",
        "mages",
        0,
        12,
        0
      ],
      [
        "narrow_bridge",
        "daggers",
        "heavy_melee",
        0,
        12,
        0
      ],
      [
        "narrow_bridge",
        "daggers",
        "tanks",
        0,
        12,
        0
      ],
      [
        "narrow_bridge",
        "daggers",
        "healers",
        10,
        2,
        0
      ],
      [
        "narrow_bridge",
        "daggers",
        "summoners",
        0,
        12,
        0
      ],
      [
        "narrow_bridge",
        "daggers",
        "support",
        0,
        12,
        0
      ],
      [
        "narrow_bridge",
        "mages",
        "heavy_melee",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "mages",
        "tanks",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "mages",
        "healers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "mages",
        "summoners",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "mages",
        "support",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "heavy_melee",
        "tanks",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "heavy_melee",
        "healers",
        12,
        0,
        0
      ],
      [
        "narrow_bridge",
        "heavy_melee",
        "summoners",
        9,
        3,
        0
      ],
      [
        "narrow_bridge",
        "heavy_melee",
        "support",
        11,
        1,
        0
      ],
      [
        "narrow_bridge",
        "tanks",
        "healers",
        5,
        7,
        0
      ],
      [
        "narrow_bridge",
        "tanks",
        "summoners",
        0,
        12,
        0
      ],
      [
        "narrow_bridge",
        "tanks",
        "support",
        0,
        12,
        0
      ],
      [
        "narrow_bridge",
        "healers",
        "summoners",
        4,
        8,
        0
      ],
      [
        "narrow_bridge",
        "healers",
        "support",
        8,
        4,
        0
      ],
      [
        "narrow_bridge",
        "summoners",
        "support",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "fortified",
        4,
        8,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "archers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "daggers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "mages",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "heavy_melee",
        7,
        5,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "tanks",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "healers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "summoners",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "balanced",
        "support",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "fortified",
        "archers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "fortified",
        "daggers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "fortified",
        "mages",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "fortified",
        "heavy_melee",
        1,
        11,
        0
      ],
      [
        "ruined_streets",
        "fortified",
        "tanks",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "fortified",
        "healers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "fortified",
        "summoners",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "fortified",
        "support",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "archers",
        "daggers",
        0,
        12,
        0
      ],
      [
        "ruined_streets",
        "archers",
        "mages",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "archers",
        "heavy_melee",
        3,
        9,
        0
      ],
      [
        "ruined_streets",
        "archers",
        "tanks",
        0,
        12,
        0
      ],
      [
        "ruined_streets",
        "archers",
        "healers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "archers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "archers",
        "support",
        11,
        1,
        0
      ],
      [
        "ruined_streets",
        "daggers",
        "mages",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "daggers",
        "heavy_melee",
        11,
        1,
        0
      ],
      [
        "ruined_streets",
        "daggers",
        "tanks",
        0,
        12,
        0
      ],
      [
        "ruined_streets",
        "daggers",
        "healers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "daggers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "daggers",
        "support",
        9,
        3,
        0
      ],
      [
        "ruined_streets",
        "mages",
        "heavy_melee",
        0,
        12,
        0
      ],
      [
        "ruined_streets",
        "mages",
        "tanks",
        0,
        12,
        0
      ],
      [
        "ruined_streets",
        "mages",
        "healers",
        4,
        8,
        0
      ],
      [
        "ruined_streets",
        "mages",
        "summoners",
        11,
        1,
        0
      ],
      [
        "ruined_streets",
        "mages",
        "support",
        5,
        7,
        0
      ],
      [
        "ruined_streets",
        "heavy_melee",
        "tanks",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "heavy_melee",
        "healers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "heavy_melee",
        "summoners",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "heavy_melee",
        "support",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "tanks",
        "healers",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "tanks",
        "summoners",
        12,
        0,
        0
      ],
      [
        "ruined_streets",
        "tanks",
        "support",
        8,
        4,
        0
      ],
      [
        "ruined_streets",
        "healers",
        "summoners",
        11,
        1,
        0
      ],
      [
        "ruined_streets",
        "healers",
        "support",
        4,
        8,
        0
      ],
      [
        "ruined_streets",
        "summoners",
        "support",
        1,
        11,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "fortified",
        5,
        7,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "archers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "daggers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "mages",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "heavy_melee",
        11,
        1,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "tanks",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "healers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "summoners",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "balanced",
        "support",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "fortified",
        "archers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "fortified",
        "daggers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "fortified",
        "mages",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "fortified",
        "heavy_melee",
        2,
        10,
        0
      ],
      [
        "walled_courtyard",
        "fortified",
        "tanks",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "fortified",
        "healers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "fortified",
        "summoners",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "fortified",
        "support",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "archers",
        "daggers",
        0,
        12,
        0
      ],
      [
        "walled_courtyard",
        "archers",
        "mages",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "archers",
        "heavy_melee",
        10,
        2,
        0
      ],
      [
        "walled_courtyard",
        "archers",
        "tanks",
        0,
        12,
        0
      ],
      [
        "walled_courtyard",
        "archers",
        "healers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "archers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "archers",
        "support",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "daggers",
        "mages",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "daggers",
        "heavy_melee",
        6,
        6,
        0
      ],
      [
        "walled_courtyard",
        "daggers",
        "tanks",
        0,
        12,
        0
      ],
      [
        "walled_courtyard",
        "daggers",
        "healers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "daggers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "daggers",
        "support",
        2,
        10,
        0
      ],
      [
        "walled_courtyard",
        "mages",
        "heavy_melee",
        0,
        12,
        0
      ],
      [
        "walled_courtyard",
        "mages",
        "tanks",
        0,
        12,
        0
      ],
      [
        "walled_courtyard",
        "mages",
        "healers",
        8,
        4,
        0
      ],
      [
        "walled_courtyard",
        "mages",
        "summoners",
        11,
        1,
        0
      ],
      [
        "walled_courtyard",
        "mages",
        "support",
        7,
        5,
        0
      ],
      [
        "walled_courtyard",
        "heavy_melee",
        "tanks",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "heavy_melee",
        "healers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "heavy_melee",
        "summoners",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "heavy_melee",
        "support",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "tanks",
        "healers",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "tanks",
        "summoners",
        10,
        2,
        0
      ],
      [
        "walled_courtyard",
        "tanks",
        "support",
        2,
        10,
        0
      ],
      [
        "walled_courtyard",
        "healers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "walled_courtyard",
        "healers",
        "support",
        4,
        8,
        0
      ],
      [
        "walled_courtyard",
        "summoners",
        "support",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "fortified",
        11,
        1,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "archers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "daggers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "mages",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "heavy_melee",
        5,
        7,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "tanks",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "healers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "summoners",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "balanced",
        "support",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "fortified",
        "archers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "fortified",
        "daggers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "fortified",
        "mages",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "fortified",
        "heavy_melee",
        6,
        6,
        0
      ],
      [
        "gatehouse_chamber",
        "fortified",
        "tanks",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "fortified",
        "healers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "fortified",
        "summoners",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "fortified",
        "support",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "archers",
        "daggers",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "archers",
        "mages",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "archers",
        "heavy_melee",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "archers",
        "tanks",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "archers",
        "healers",
        1,
        11,
        0
      ],
      [
        "gatehouse_chamber",
        "archers",
        "summoners",
        11,
        1,
        0
      ],
      [
        "gatehouse_chamber",
        "archers",
        "support",
        1,
        11,
        0
      ],
      [
        "gatehouse_chamber",
        "daggers",
        "mages",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "daggers",
        "heavy_melee",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "daggers",
        "tanks",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "daggers",
        "healers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "daggers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "daggers",
        "support",
        8,
        4,
        0
      ],
      [
        "gatehouse_chamber",
        "mages",
        "heavy_melee",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "mages",
        "tanks",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "mages",
        "healers",
        9,
        3,
        0
      ],
      [
        "gatehouse_chamber",
        "mages",
        "summoners",
        11,
        1,
        0
      ],
      [
        "gatehouse_chamber",
        "mages",
        "support",
        0,
        12,
        0
      ],
      [
        "gatehouse_chamber",
        "heavy_melee",
        "tanks",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "heavy_melee",
        "healers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "heavy_melee",
        "summoners",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "heavy_melee",
        "support",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "tanks",
        "healers",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "tanks",
        "summoners",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "tanks",
        "support",
        2,
        10,
        0
      ],
      [
        "gatehouse_chamber",
        "healers",
        "summoners",
        12,
        0,
        0
      ],
      [
        "gatehouse_chamber",
        "healers",
        "support",
        1,
        11,
        0
      ],
      [
        "gatehouse_chamber",
        "summoners",
        "support",
        0,
        12,
        0
      ]
    ]
  }
}
```
