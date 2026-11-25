# Alpha Tools — local test switches and button (ALPHA-TOOLS-001)

The Owner requested a compact **Alpha Tools** block with two switches and one **24-hour test button**. It sits *collapsed* beneath the resources rail (including on phones), keeping normal play uncluttered. All controls act only on this browser's local prototype and never affect the real phone clock.

| Control | Behavior | Persistence |
| --- | --- | --- |
| **Reset all progress** | Ask for explicit confirmation, then replace ONLY the saved Idle Game character with `newGame(realNow)`, including reset activity levels/XP, attribute effort, item stocks, Glory Scrolls, enchant ranks, armor choices, queue, battle and preparation. Remove the separate alpha clock. `newGame` starts valid levels at **Lv 1** and attributes at **10**, not mathematically zero. Cancelling does **nothing**. | No — one-shot; automatically returns OFF |
| **Test 24 hours idle** — button | **Each click** advances the local *logical engine timestamp* by **exactly 86,400,000 ms**, settles the unchanged game through real `enterGame` in one batch, and shows actual inventory, available XP and route changes. Keeps the current XP-bar limit, manual Skill Master progression, frozen combat power and infinite offline rules. Each separate click simulates another day. | Stateless action button; no ON/OFF mode |
| **Activity speed ×10** | Toggle a persistent **10× virtual game clock** affecting the real engine's activity work, movement, preparation and Fighting steps together. Switching OFF returns to **1×** without moving time backwards or rewriting cycle lengths/RNG; closing and reopening the browser continues the selected speed, even for offline time while enabled. | Yes — remains checked until OFF |

## Architecture / safety

- `site/play/alpha-tools.mjs` is a pure, zero-dependency virtual-clock helper. It validates integer anchors `{version:1,realAnchorMs,gameAnchorMs,speed:1|10}` and stores it **separately** as `ALPHA_CLOCK_KEY="idle-game-alpha-clock-v1"`. The virtual clock is separate from the V11 game save. It resets with an incompatible old character.
- Instead of changing core timing constants, app actions that settle resources/XP call `gameNow()` using `alphaTime`, while autosave throttling uses **real time**. `setAlphaSpeed` anchors the new rate at the current virtual time. `advanceAlphaClock` jumps that virtual time forward exactly 24 hours. This prevents the common failure where a speed toggle puts `settledAtMs` into the future and disabling it freezes play for days.
- The reset is deliberately destructive but explicit, unlike a benign toggle: a confirmation spells out loss of local character, XP, stats, loot, gear, enchants and route. It does not clear unrelated website or project data. If localStorage is unavailable, speed/reset should report that rather than pretending progress will persist.
- 24h simulation and speed changes never give artificial stat points, Skill Master levels, magically favorable dice or fabricated loot; they run the same settlement / combat code as normal activity. New in-game cycle durations, gameplay XP probabilities and magic combat remain untouched.
- **Alpha-only**: These controls intentionally accelerate earned resources and can reset local progression. They must be removed or restricted before any authenticated multiplayer, production economy, achievements/competitive rankings or authoritative server launch. Browser local saves are already non-secure.
- Automated tests in `tools/test_game_engine.mjs` and `tools/test_game_ui.mjs` cover virtual-clock persistence, 1×↔10× continuity, exact simulated day, save reload, offline XP cap, reset cancellation, full reset and closed-panel UI.

**Known behavior:** This is a forward-only simulation, **not an undoable 24h preview**. A confirmed reset is not reversible. The reset remains a one-shot confirmation switch that returns OFF; the 24h test is a real clickable button with no checked state; only ×10 is a persistent switch. This button replaces the earlier 24h toggle at the Owner's request.


## A4 — six-month benchmark and arena coin controls (pending PR #154)

Two additional clearly marked local testing buttons in the folded panel:

- **Max Stats · six-month build:** choose one armour family (default Plate) and use the currently selected weapon. Set floors based on the A3 verified normal daily build, seed 20261125 at day 180: Fighting Lv 52, 4,167 productive hours of real Fighting attribute effort, 4,167 weapon practice hours, 4,145 chosen armour hours (rounded down from measured values). On a fresh character this produces STR/DEX/END 148/148/136. Both selected tracks exceed the 4,000h S mastery requirement. Existing higher values and other legitimate activity/expertise progress stay intact. Does not equip armour, buy gear, grant coins, increase other skills, or advance the logical clock. Repeating for the same build is idempotent at the same time; deliberately selecting another build and clicking can train it for testing. Settle previous earned progress first, restart only the unfinished snapshot if the fixture changes, and never rewrite old rewards.
- **+100,000 arena coins:** adds exactly 100,000 to the settled wallet per click; no mastery, gear, stats or special prize outcome. Reject integer overflow.

These are intentionally artificial local QA fixtures, **not earned progression**. All five controls are hidden and their event handlers not registered under the normal timing profile. New fixture functions additionally enforce the same source-defined profile internally. The existing clock offset may be preserved at 1× for a normal-profile current-build save; no accelerated rate. No new save fields, credentials, server endpoint or secret activation route. Before production, explicitly remove test code/assets and reset disposable alpha saves; this static browser prototype is not an authoritative anti-cheat boundary. Tests include exact benchmark stats, idempotence, higher-value preservation, independent credit, overflow, old combat settlement, normal-profile refusal and UI click persistence. See [ALPHA_GEAR_BASELINE.md](ALPHA_GEAR_BASELINE.md).

**A4 verification:** [f66cb2a](https://github.com/janisp123/idle_game/commit/f66cb2a5348074f8cf3c5f6d133ecb191bbd9093), [website CI](https://github.com/janisp123/idle_game/actions/runs/45561869761) 104/104, [systems lab](https://github.com/janisp123/idle_game/actions/runs/45561869757) 13/13 with actual normal-profile refusal and full unchanged six-month simulation. Automated UI coverage is not a real mobile-browser screenshot review. No live deployment in A4.


A7 supersedes the A4 unfinished-snapshot restart: Max Stats publishes its test fixture but the current fight and recovery are immutable. The new test build applies at the next bout boundary. A4's six-month fixture remains a representative floor, not a live-derived universal maximum.


A8 retest: the normal representative six-month daily build now reaches 149/149/137, Fighting 52, ~4,235.97h weapon and 4,213.28h Plate. A4 fixture remains its verified historical A3 minimum until A9 refresh; no claim that it is a universal maximum. Do not change other expertise tracks or coin-grant behaviour.


A9 candidate refreshes the floor from the verified A8 normal trajectory (265c7a8, seed 20261125): 4,235 productive and selected-weapon hours, 4,213 selected-armour hours, Fighting Lv52; expected STR/DEX/END 149/149/137. The older A3 values above are historical. Same one-build and immutable-bout semantics, same 100,000 coin grant.


A9 verified code head 2852c5f: exact 149/149/137 stats, two selected tracks, coin grants and preserved existing progress tested; actual Chrome tests checked coin grants/persistence and selected-family expertise at mobile and desktop widths. No live deployment.
