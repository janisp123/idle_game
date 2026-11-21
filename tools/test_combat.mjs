import test from "node:test";
import assert from "node:assert/strict";
import {
  COMBAT_BALANCE, BOUT_MS, COMBAT_ART, rollSkullDice, seededCombatRandom,
  makeOpponent, startCombatSession, advanceCombatSession,
  simulateDuel, combatAtTime, validCombatSession
} from "../site/play/combat.mjs";
import {
  newGame, chooseActivity, settle, enterGame, readSave,
  GAME_VERSION, ACTIVITIES, allAttributeProgress
} from "../site/play/engine.mjs";

const warrior = { name: "The Wanderer", weapon: "hammer", str: 10, dex: 10, end: 10, skill: 1 };
const raider = { name: "Varrik", weapon: "axe", str: 10, dex: 9, end: 10, skill: 1 };
const HOUR = 3_600_000;
const YEAR = 365 * 24 * HOUR;
const seeded = seed => seededCombatRandom(seed);

test("the three skull dice are fair six-sided values and 6-6-6 is possible", () => {
  assert.deepEqual(rollSkullDice(() => 0), [1,1,1]);
  assert.deepEqual(rollSkullDice(() => 0.999999), [6,6,6]);
  assert.throws(() => rollSkullDice(() => 1), RangeError);
  assert.throws(() => rollSkullDice(() => -0.01), RangeError);
  assert.throws(() => rollSkullDice(() => NaN), RangeError);
});

test("a fight is repeatable with its seed, and every event is a real simulation outcome", () => {
  const first = simulateDuel(warrior, raider, seeded(1234));
  const again = simulateDuel(warrior, raider, seeded(1234));
  assert.deepEqual(first, again);
  assert.equal(first.events[0].type, "engage");
  assert.ok(["victory", "defeat", "stalemate"].includes(first.outcome));
  assert.equal(first.events.at(-1).type, first.outcome);
  assert.ok(first.events.length <= COMBAT_BALANCE.slotsPerBout);
  const types = new Set(["engage","miss","block","dodge","strike","wound",
    "collapse","finisher","victory","defeat","stalemate"]);
  for (const event of first.events) {
    assert.ok(types.has(event.type), event.type);
    if (["block","dodge","miss"].includes(event.type)) assert.equal(event.damage, 0);
    if (event.type === "finisher") assert.deepEqual(event.dice, [6,6,6]);
    if (event.dice) assert.equal(event.dice.length, 3);
  }
});

test("a 6-6-6 roll triggers a true vulnerable-target finisher, not a random picture", () => {
  const heavy = { ...warrior, str: 32 };
  const weak = { ...raider, end: 0, str: 0, dex: 0, skill: 0 };
  // Player strike -> enemy near half HP; enemy miss -> player follows through
  // with another clean strike, which is the only time the three dice roll.
  let n = 0;
  const sequence = [0, 0.99, 0.999, 0, 0.99, 0.999, 0.999, 0.999];
  const r = () => sequence[n++] ?? 0.5;
  const out = simulateDuel(heavy, weak, r);
  const finisher = out.events.find(e => e.type === "finisher");
  assert.ok(finisher, JSON.stringify(out.events));
  assert.equal(finisher.actor, "player");
  assert.deepEqual(finisher.dice, [6,6,6]);
  assert.match(finisher.text, /6–6–6/);
  assert.equal(out.outcome, "victory");
  assert.equal(out.enemyHP, 0);
});

test("a healthy blocked/missed duel never rolls the finisher dice", () => {
  const sequence = [0, 0, 0, 0, 0, 0, 0, 0];
  let i=0;
  const r = () => sequence[i++ % sequence.length];
  const out = simulateDuel(warrior, raider, r);
  assert.ok(out.events.slice(1,-1).every(e => e.type === "dodge"));
  assert.ok(out.events.every(e => !e.dice));
  assert.equal(out.outcome,"stalemate");
});

test("combat session persists integer time, uses fixed opponent bands and is O(1) over decades", () => {
  const s = startCombatSession(warrior, 12345);
  assert.equal(validCombatSession(s), true);
  assert.equal(validCombatSession({ ...s, elapsedMs: -1 }), false);
  assert.equal(validCombatSession({ ...s, seed: 0x100000000 }), false);
  const near = advanceCombatSession(s, BOUT_MS + 3 * COMBAT_BALANCE.eventMs);
  const at = combatAtTime(near);
  assert.equal(at.bout, 2);
  assert.equal(at.step, Math.min(3, at.events.length - 1));
  assert.equal(at.enemy, makeOpponent(1).name);
  assert.deepEqual(at, combatAtTime(near));
  const years = advanceCombatSession(s, 20 * YEAR);
  assert.ok(combatAtTime(years).event);
  assert.ok(combatAtTime(years).bout > 1_000_000);
  assert.equal(COMBAT_ART.engage, "fighting");
  assert.equal(COMBAT_ART.finisher, undefined, "never show generic art as actual finisher artwork");
  assert.throws(() => advanceCombatSession(s, -1), RangeError);
});

test("Fighting earns the same attributes and Skill Master XP while duels advance independently", () => {
  const first = chooseActivity(newGame(0), "fighting", 0, () => 0.5).state;
  assert.equal(first.combatSession, null);
  const half = settle(first, COMBAT_BALANCE.eventMs / 2, () => 0.5).state;
  assert.ok(half.combatSession);
  assert.equal(half.combatSession.elapsedMs, COMBAT_BALANCE.eventMs / 2);
  const full = settle(half, COMBAT_BALANCE.eventMs, () => 0.5).state;
  assert.equal(full.combatSession.elapsedMs, COMBAT_BALANCE.eventMs);
  assert.equal(full.skills.fighting.level, 1);
  assert.ok(full.skills.fighting.xp > 0);
  assert.equal(full.combatSession.player.str, 10);
  assert.deepEqual(readSave(JSON.stringify(full)), full);
});

test("offline combat uses frozen stats, bounded work, and never deletes character progress", () => {
  const old = chooseActivity(newGame(0), "fighting", 0, () => 0.5).state;
  old.items.stone = 14;
  old.skills.fighting.level = 11;
  const last = enterGame(old, 20 * YEAR, () => 0.5);
  assert.equal(last.state.combatSession.player.skill, 11);
  assert.equal(last.state.combatSession.elapsedMs, 20 * YEAR);
  assert.equal(last.state.items.stone, 14);
  assert.equal(last.state.skills.fighting.level, 11);
  assert.ok(allAttributeProgress(last.state.attributeEffort).STR.value > 10);
  assert.equal(last.state.combatSession.player.str, 10,
    "earned offline attributes never strengthen that interval");
  assert.deepEqual(readSave(JSON.stringify(last.state)), last.state);
});

test("older V5 saves preserve earned attributes, items, skill levels and queues", () => {
  const older = newGame(123);
  older.version = 5;
  delete older.combatSession;
  older.name = "An Older Warrior";
  older.items.stone = 421;
  older.skills.fighting.level = 19;
  older.attributeEffort.STR = 100_000_000;
  const migrated = readSave(JSON.stringify(older));
  assert.ok(migrated);
  assert.equal(migrated.version, GAME_VERSION);
  assert.equal(migrated.name, older.name);
  assert.equal(migrated.items.stone, older.items.stone);
  assert.equal(migrated.skills.fighting.level, 19);
  assert.equal(migrated.attributeEffort.STR, older.attributeEffort.STR);
  assert.equal(migrated.combatSession, null);
  assert.deepEqual(readSave(JSON.stringify(migrated)), migrated);
});
