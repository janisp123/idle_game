import test from "node:test";
import assert from "node:assert/strict";
import { ACTIVITIES, ITEM_KEYS, BASE_CYCLE_MS, ZONE_TRAVEL_MS, activityDuration,
  newGame, readSave, settle, chooseActivity, enterGame, testOfflineDay, levelFromXP
} from "../site/play/engine.mjs";

const midpoint = () => 0.5;
const YEAR = 365 * 24 * 60 * 60 * 1000;
const choose = (state, activity, now) => chooseActivity(state, activity, now, midpoint);
const finish = (state, now) => settle(state, now, midpoint);
const enter = (state, now) => enterGame(state, now, midpoint);

test("twenty basic and outlaw tasks have independent full-cycle times and outputs", () => {
  assert.equal(Object.keys(ACTIVITIES).length, 20);
  assert.equal(ITEM_KEYS.length, 20);
  for (const task of Object.values(ACTIVITIES)) {
    assert.ok(task.durationMs >= 8 * BASE_CYCLE_MS);
    assert.equal(task.durationMs, task.baseMinutes * BASE_CYCLE_MS / task.speed);
  }
  assert.equal(ZONE_TRAVEL_MS, 300_000);
  assert.equal(activityDuration("mining", 20), ACTIVITIES.mining.durationMs / 20);
  assert.throws(() => activityDuration("mining", 0), RangeError);
});

test("hunting and mining require complete work cycles", () => {
  const hunting = choose(newGame(0), "hunting", 0).state;
  assert.equal(finish(hunting, 7000).report.completed, 0);
  const hunted = finish(hunting, ACTIVITIES.hunting.durationMs);
  assert.equal(hunted.report.completed, 1);
  assert.equal(hunted.state.items.hide, 1);
  assert.equal(hunted.state.totalXP, 3);
  const mining = choose(newGame(0), "mining", 0).state;
  assert.equal(finish(mining, 5000).report.completed, 0);
  assert.equal(finish(mining, ACTIVITIES.mining.durationMs).state.items.stone, 1);
});

test("every activity earns its own output and preserves partial work", () => {
  for (const [id, activity] of Object.entries(ACTIVITIES)) {
    const state = choose(newGame(0), id, 0).state;
    const partial = finish(state, activity.durationMs - 1000);
    assert.equal(partial.report.completed, 0);
    const result = finish(partial.state, activity.durationMs);
    assert.equal(result.state.items[activity.item], 1);
    assert.equal(result.state.totalXP, activity.xp);
  }
});

test("switching activities settles old work and drops partial cycle", () => {
  const hunt = choose(newGame(0), "hunting", 0).state;
  const changed = choose(hunt, "mining", ACTIVITIES.hunting.durationMs + 1000);
  assert.equal(changed.state.items.hide, 1);
  assert.equal(changed.state.progressMs, 0);
  const mined = finish(changed.state, ACTIVITIES.hunting.durationMs + 1000 + ACTIVITIES.mining.durationMs);
  assert.equal(mined.state.items.stone, 1);
});

test("old browser saves gain new resource slots without losing progress", () => {
  const old = newGame(0);
  old.items = { hide: 3, stone: 4 };
  const loaded = readSave(JSON.stringify(old));
  assert.equal(loaded.items.hide, 3);
  assert.equal(loaded.items.stone, 4);
  assert.equal(loaded.items.log, 0);
  assert.equal(Object.keys(loaded.items).length, 20);
  assert.equal(readSave({ ...old, items: { hide: -1, stone: 4 } }), null);
  assert.equal(readSave({ ...old, activity: "unknown" }), null);
});

test("offline remains uncapped and frozen for 50 years", () => {
  const start = 1_600_000_000_000;
  const duration = 50 * YEAR;
  const state = choose(newGame(start), "mining", start).state;
  const result = finish(state, start + duration);
  const count = Math.floor(duration / ACTIVITIES.mining.durationMs);
  assert.equal(result.report.completed, count);
  assert.equal(result.state.items.stone, count);
  assert.equal(result.state.level, 1);
  const returned = enter(state, start + duration);
  assert.equal(returned.state.level, levelFromXP(returned.state.totalXP));
  assert.equal(returned.state.items.stone, count);
  assert.ok(returned.levelsGained > 0);
});

test("no rewards for idle, backward time, or duplicate settlement", () => {
  assert.equal(finish(newGame(0), 20 * YEAR).report.completed, 0);
  const s = choose(newGame(10_000), "hunting", 10_000).state;
  const earned = finish(s, 10_000 + ACTIVITIES.hunting.durationMs).state;
  assert.equal(finish(earned, 10_000 + ACTIVITIES.hunting.durationMs).report.completed, 0);
  assert.equal(finish(earned, 0).report.completed, 0);
});

test("independent +/-10% batch rewards still apply to long offline spans", () => {
  const s = choose(newGame(0), "mining", 0).state;
  const count = 100;
  const low = settle(s, count * ACTIVITIES.mining.durationMs, () => 0);
  const draws = [0.999999, 0, 0.999999, 0];
  const high = settle(s, count * ACTIVITIES.mining.durationMs, () => draws.shift());
  assert.equal(low.report.gainedItems, 90);
  assert.equal(high.report.gainedItems, 110);
  assert.equal(low.report.gainedXP, 180);
  assert.equal(high.report.gainedXP, 220);
});

test("one-day test shortcut and save validation remain functional", () => {
  const state = choose(newGame(1_000_000), "gathering", 1_000_000).state;
  const result = testOfflineDay(state, 1_000_000, midpoint);
  assert.equal(result.report.completed, Math.floor(86400000 / ACTIVITIES.gathering.durationMs));
  assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
  assert.equal(readSave("not json"), null);
});

test("outlaw actions have separate loot and remain uncapped while offline", () => {
  const outlaws = Object.entries(ACTIVITIES).filter(([, task]) => task.category === "outlaw");
  assert.equal(outlaws.length, 10);
  for (const [id, task] of outlaws) {
    assert.ok(task.durationMs >= 25 * BASE_CYCLE_MS);
    const initial = choose(newGame(0), id, 0).state;
    const result = finish(initial, task.durationMs);
    assert.equal(result.state.items[task.item], 1);
    assert.equal(result.state.totalXP, task.xp);
    assert.equal(result.state.level, 1);
  }
  const start = choose(newGame(0), "highway_robbery", 0).state;
  const result = finish(start, 20 * YEAR);
  assert.equal(result.report.completed, Math.floor(20 * YEAR / ACTIVITIES.highway_robbery.durationMs));
  assert.equal(result.state.level, 1);
});

test("existing ten-task save migrates with new outlaw inventory keys", () => {
  const old = newGame(0);
  for (const [id, task] of Object.entries(ACTIVITIES)) {
    if (task.category === "outlaw") delete old.items[task.item];
  }
  old.items.stone = 123;
  const loaded = readSave(old);
  assert.equal(loaded.items.stone, 123);
  assert.equal(loaded.items.stolen_purse, 0);
  assert.equal(Object.keys(loaded.items).length, 20);
});
