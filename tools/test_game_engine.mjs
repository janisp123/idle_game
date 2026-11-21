import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITIES, newGame, readSave, settle as engineSettle, chooseActivity as engineChooseActivity,
  enterGame as engineEnterGame, testOfflineDay as engineTestOfflineDay, xpForLevel, levelFromXP
} from "../site/play/engine.mjs";

// Existing deterministic tests use the center of the +/-10% range.
const midpoint = () => 0.5;
const settle = (state, now) => engineSettle(state, now, midpoint);
const chooseActivity = (state, activity, now) => engineChooseActivity(state, activity, now, midpoint);
const enterGame = (state, now) => engineEnterGame(state, now, midpoint);
const testOfflineDay = (state, now) => engineTestOfflineDay(state, now, midpoint);

const MINUTE = 60_000;
const YEAR = 365 * 24 * 60 * MINUTE;

test("new character waits for an activity choice", () => {
  const idle = newGame(1000);
  const { state, report } = settle(idle, 1000 + YEAR * 20);
  assert.equal(state.activity, null);
  assert.equal(state.totalXP, 0);
  assert.equal(state.items.hide, 0);
  assert.equal(report.completed, 0);
});
test("hunting wolves auto-repeats and collects hide and XP", () => {
  const chosen = chooseActivity(newGame(1000), "hunting", 1000).state;
  const { state, report } = settle(chosen, 22_000);
  assert.equal(report.completed, 3);
  assert.equal(report.gainedXP, 9);
  assert.equal(state.items.hide, 3);
  assert.equal(state.totalXP, 9);
  assert.equal(state.level, 1);
});
test("mining stone auto-repeats and retains unfinished action time", () => {
  const chosen = chooseActivity(newGame(1000), "mining", 1000).state;
  const partial = settle(chosen, 4000).state;
  assert.equal(partial.progressMs, 3000);
  const later = settle(partial, 11_000).state;
  assert.equal(later.items.stone, 2);
  assert.equal(later.totalXP, 4);
  assert.equal(later.progressMs, 0);
});
test("changing activity settles previous activity, discards its incomplete action", () => {
  const hunt = chooseActivity(newGame(0), "hunting", 0).state;
  const changed = chooseActivity(hunt, "mining", 10_000);
  assert.equal(changed.state.items.hide, 1);
  assert.equal(changed.state.progressMs, 0);
  assert.equal(changed.state.activity, "mining");
  const mined = settle(changed.state, 15_000).state;
  assert.equal(mined.items.stone, 1);
  assert.equal(mined.items.hide, 1);
});
test("levels remain frozen while offline even when millions of XP arrive", () => {
  const away = chooseActivity(newGame(1000), "hunting", 1000).state;
  const end = 1000 + 20 * YEAR;
  const settled = settle(away, end);
  const actions = Math.floor(20 * YEAR / ACTIVITIES.hunting.durationMs);
  assert.equal(settled.report.completed, actions);
  assert.equal(settled.state.items.hide, actions);
  assert.equal(settled.state.totalXP, actions * 3);
  assert.equal(settled.state.level, 1, "no mid-offline level-up");
  const returned = enterGame(away, end);
  assert.equal(returned.state.items.hide, actions);
  assert.equal(returned.state.level, levelFromXP(actions * 3));
  assert.ok(returned.levelsGained > 1000);
  assert.equal(returned.report.completed, actions);
});
test("a user already inside the game does not level up on ordinary ticks", () => {
  let s = chooseActivity(newGame(0), "mining", 0).state;
  s = settle(s, 500_000).state;
  assert.ok(s.totalXP > xpForLevel(2));
  assert.equal(s.level, 1);
  assert.equal(enterGame(s, 500_000).state.level, levelFromXP(s.totalXP));
});
test("same timestamp and clock moving backwards never duplicate a reward", () => {
  let s = chooseActivity(newGame(10_000), "hunting", 10_000).state;
  s = settle(s, 17_000).state;
  assert.equal(settle(s, 17_000).report.completed, 0);
  assert.equal(settle(s, 16_000).state.totalXP, s.totalXP);
  assert.equal(settle(s, 17_000).state.items.hide, 1);
});
test("saved state restores the same partial action", () => {
  let state = chooseActivity(newGame(0), "mining", 0).state;
  state = settle(state, 3000).state;
  const loaded = readSave(JSON.stringify(state));
  assert.deepEqual(loaded, state);
  assert.equal(settle(loaded, 5000).state.items.stone, 1);
});
test("corrupted, incompatible or hostile saves are rejected", () => {
  assert.equal(readSave("nope"), null);
  assert.equal(readSave('{"version":2}'), null);
  assert.equal(readSave({ ...newGame(0), totalXP: Number.POSITIVE_INFINITY }), null);
  assert.equal(readSave({ ...newGame(0), items: { hide: -5, stone: 0 } }), null);
  assert.equal(readSave({ ...newGame(0), activity: "wolf-lord" }), null);
  assert.equal(readSave({ ...newGame(0), level: 9000 }), null);
});
test("no 24h/7d/365d cap: 50 years accounted for in constant time", () => {
  const start = 1600000000000, duration = 50 * YEAR;
  const s = chooseActivity(newGame(start), "mining", start).state;
  const result = enterGame(s, start + duration);
  assert.equal(result.state.items.stone, duration / 5000);
  assert.equal(result.state.totalXP, 2 * duration / 5000);
  assert.equal(result.state.activity, "mining");
});
test("the optional one-day testing shortcut uses real settlement logic", () => {
  let s = chooseActivity(newGame(200000000), "hunting", 200000000).state;
  const result = testOfflineDay(s, 200000000);
  assert.equal(result.report.completed, Math.floor(86400000 / 7000));
  assert.equal(result.state.level, levelFromXP(result.state.totalXP));
});

test("reward totals vary independently within +/-10%, with integer stochastic rounding", () => {
  const base = engineChooseActivity(newGame(0), "hunting", 0, midpoint).state;
  const low = engineSettle(base, 700_000, () => 0);
  const high = engineSettle(base, 700_000, () => 0.999999);
  assert.equal(low.report.completed, 100);
  assert.equal(low.report.gainedItems, 90);
  assert.equal(low.report.gainedXP, 270);
  assert.equal(high.report.gainedItems, 110);
  assert.equal(high.report.gainedXP, 330);
  assert.equal(low.state.level, 1);
  assert.equal(high.state.level, 1);
});
test("one-action rewards remain integer and can vary rather than always rounding to baseline", () => {
  const base = engineChooseActivity(newGame(0), "mining", 0, midpoint).state;
  const lowRolls = [0, 0.999999, 0, 0.999999];
  const highRolls = [0.999999, 0, 0.999999, 0];
  const low = engineSettle(base, 5000, () => lowRolls.shift());
  const high = engineSettle(base, 5000, () => highRolls.shift());
  assert.equal(low.report.gainedItems, 0);
  assert.equal(low.report.gainedXP, 1);
  assert.equal(high.report.gainedItems, 2);
  assert.equal(high.report.gainedXP, 3);
});
test("20 years settle in constant work without exceeding safe reward ranges", () => {
  const start = 1_600_000_000_000;
  const base = engineChooseActivity(newGame(start), "mining", start, midpoint).state;
  let rolls = 0;
  const result = engineEnterGame(base, start + 20 * YEAR, () => { rolls++; return 0.5; });
  assert.equal(result.report.completed, 20 * YEAR / 5000);
  assert.equal(result.report.gainedItems, result.report.completed);
  assert.equal(result.report.gainedXP, result.report.completed * 2);
  assert.equal(rolls, 2);
});
test("invalid random values cannot corrupt rewards", () => {
  const base = engineChooseActivity(newGame(0), "hunting", 0, midpoint).state;
  assert.throws(() => engineSettle(base, 7000, () => NaN), RangeError);
  assert.throws(() => engineSettle(base, 7000, () => 1), RangeError);
});
