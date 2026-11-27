# RAID-001 — Five raid encounters and blessings

Approved by owner 2026-11-27. Baseline 6050f9a9147f4bb6dbd8b5ab220cd9e5f62d8ebf (#206; 181 tests, all seven checks passed). Existing arena and class/attribute rules retained. No extra currencies, mana, manual combat or extra player slots.

## Confirmed requirements
Raids levels 10, 20, 30, 40, 50, named boss plus six fixed named minions using visible weapon icons, different physical/magic/melee/ranged resistances; no total immunity. Target approximately five minutes for a well-prepared appropriate team. Each victory grants coins and +10% Fighting XP for 24 hours; higher tiers add damage and defence up to 10%. Only one active blessing; same level refreshes, higher replaces, lower cannot replace or refresh a higher active blessing. Defeat does not award coins or blessings. Manually initiate, automatically fight, automatically resume arena.

## Staged implementation
1. Catalog and actual group resolver extension; fixed 120-round raid limit at 2.5 seconds/round (300s maximum), no timeout victories. Boss/crew tuning values provisional, real kit abilities and individual stat profiles. Normal arena unchanged; no UI or live rewards yet. Run max build initial diagnostic; save actual raw results and adjust boss HP/damage and minion strength from appropriately geared same-level teams, not just max team.
2. Frozen persisted raid attempt, seed, player snapshots, rules version, start/end and one-time payout. Settle preceding arena before raid; pause arena clock during encounter, finish on reload even if offline, resume arena once. No double rewards, no XP farm while raiding. Preserve existing paid arena cursor and rank. Class changes affect subsequent fights only; no free reroll. Use same save lock and single storage commit. No new save key.
3. Integrate 24h blessing into actual arena XP before cap probes; split offline interval at expiry without auto-claiming intermediate levels, and freeze damage/defence at existing completed-bout boundaries. Avoid duplicate rounding or bonuses. Show current buff, expiry, coins in progress reports. Test expiry while absent, lower/same/higher wins, failed raids and reload. Existing v1-v4 historical settlements unchanged unless opt-in bonus is present.
4. Mobile-first arena-like raid screen with boss larger, six minion cards, weapon icons/names/HP, team cards, timer, accessible launch buttons and visible resistances/rewards; no dropdowns. Disable repeat start during encounter. Validate real browser at mobile and desktop.
5. Calibrate with appropriate-grade mixed and counter teams across fixed seeds; report actual durations and success rates, use independent holdouts. Alpha merge tested increments, no final balance promises.

Candidate decisions: coins 200/500/1000/2000/4000; fixed 7 monsters; duration determined by actual rounds, not fake progress. Exact grades, encounter HP/damage/resistance and coin amounts are provisional. Raid rewards are coins and temporary blessing only; no extra attribute or class XP from raid itself in this first design. Keep one compact rules module and one encounter module, reusing existing combat and save architecture.

## Playable candidate

RAID-001 stage 3 candidate — launch buttons for all five raids, saved deterministic encounter, automatic arena pause/resume, strict knockout and one-time coins/blessing, 24h XP and combat bonus, expiry split, larger boss and six minion cards with actual health and weapon icons; mobile smoke and reward/reload tests. Candidate 2.5-second rounds, 120-round limit. Initial balance screen pending; approximate five-minute appropriate-level wins unverified. CI pending; do not claim deployed.

[Initial max-only raw screen](RAID_INITIAL_SCREEN_20261127.md) — lower raids fast as overlevelled, level 50 timeout. Candidate fix limits incoming boss healing base to unscaled HP, same-grade mixed/counter screen added.
