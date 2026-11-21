import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITIES, ITEM_KEYS, SKILL_IDS, GAME_VERSION, SAVE_KEY, BASE_CYCLE_MS,
  ZONE_TRAVEL_MS, activityDuration, newGame, readSave, settle, chooseActivity,
  enterGame, testOfflineDay, xpForLevel, levelFromXP
} from "../site/play/engine.mjs";

const midpoint = () => 0.5;
const YEAR = 365 * 24 * 60 * 60 * 1000;
const choose = (s, a, now) => chooseActivity(s, a, now, midpoint);
const finish = (s, now) => settle(s, now, midpoint);
const enter = (s, now) => enterGame(s, now, midpoint);

test("only individual activities have levels; character has a name but no level", () => {
  const state = newGame(0);
  assert.equal(state.version, GAME_VERSION);
  assert.equal(state.name, "Wanderer");
  assert.equal(SAVE_KEY, "idle-game-prototype-v1", "keep existing local save key for migration");
  assert.equal(Object.hasOwn(state, "level"), false);
  assert.equal(Object.hasOwn(state, "totalXP"), false);
  assert.ok(SKILL_IDS.length >= 10);
  assert.equal(ITEM_KEYS.length, SKILL_IDS.length);
  for (const id of SKILL_IDS) assert.deepEqual(state.skills[id], { level: 1, xp: 0 });
});

test("ten activities retain independently configurable full work-cycle times", () => {
  assert.ok(Object.keys(ACTIVITIES).length >= 10);
  for (const activity of Object.values(ACTIVITIES)) {
    assert.ok(activity.durationMs >= 8 * BASE_CYCLE_MS);
    assert.equal(activity.durationMs, activity.baseMinutes * BASE_CYCLE_MS / activity.speed);
  }
  assert.equal(ZONE_TRAVEL_MS, 300_000);
  assert.equal(activityDuration("mining", 20), ACTIVITIES.mining.durationMs / 20);
  assert.throws(() => activityDuration("mining", 0), RangeError);
});

test("every activity earns its own skill XP and own resource", () => {
  for (const [id, activity] of Object.entries(ACTIVITIES)) {
    const chosen = choose(newGame(0), id, 0).state;
    assert.equal(finish(chosen, activity.durationMs - 1000).report.completed, 0);
    const result = finish(chosen, activity.durationMs);
    assert.equal(result.report.completed, 1);
    assert.equal(result.state.items[activity.item], 1);
    assert.equal(result.state.skills[id].xp, activity.xp);
    assert.equal(result.state.skills[id].level, 1);
    for (const other of SKILL_IDS.filter(other => other !== id)) {
      assert.equal(result.state.skills[other].xp, 0);
    }
  }
});

test("skill threshold earns XP but DOES NOT activate a level during settlement", () => {
  const chosen = choose(newGame(0), "mining", 0).state;
  const amount = Math.ceil(xpForLevel(2) / ACTIVITIES.mining.xp) + 2;
  const result = finish(chosen, amount * ACTIVITIES.mining.durationMs);
  assert.ok(result.state.skills.mining.xp >= xpForLevel(2));
  assert.equal(result.state.skills.mining.level, 1);
  assert.equal(result.state.skills.hunting.level, 1);
  const returned = enter(chosen, amount * ACTIVITIES.mining.durationMs);
  assert.equal(returned.state.skills.mining.level, levelFromXP(returned.state.skills.mining.xp));
  assert.equal(returned.levelsGained.mining, returned.state.skills.mining.level - 1);
  assert.equal(returned.state.skills.hunting.level, 1);
});

test("switching activities accumulates XP independently without applying levels", () => {
  let state = choose(newGame(0), "mining", 0).state;
  const miningCount = 30;
  const switched = choose(state, "hunting", miningCount * ACTIVITIES.mining.durationMs + 1000);
  state = switched.state;
  assert.equal(state.progressMs, 0);
  assert.equal(state.items.stone, miningCount);
  assert.equal(state.skills.mining.xp, miningCount * ACTIVITIES.mining.xp);
  assert.equal(state.skills.mining.level, 1);
  const huntingCount = 30;
  state = finish(state, state.settledAtMs + huntingCount * ACTIVITIES.hunting.durationMs).state;
  assert.equal(state.skills.hunting.xp, huntingCount * ACTIVITIES.hunting.xp);
  assert.equal(state.skills.hunting.level, 1);
  const returned = enter(state, state.settledAtMs);
  assert.equal(returned.state.skills.mining.level, levelFromXP(state.skills.mining.xp));
  assert.equal(returned.state.skills.hunting.level, levelFromXP(state.skills.hunting.xp));
  assert.ok(returned.levelsGained.mining);
  assert.ok(returned.levelsGained.hunting);
});

test("offline time remains unlimited and skill levels remain frozen for 50 years", () => {
  const start = 1_600_000_000_000;
  const elapsed = YEAR * 50;
  const away = choose(newGame(start), "hunting", start).state;
  const out = finish(away, start + elapsed);
  const actions = Math.floor(elapsed / ACTIVITIES.hunting.durationMs);
  assert.equal(out.report.completed, actions);
  assert.equal(out.state.skills.hunting.xp, actions * ACTIVITIES.hunting.xp);
  assert.equal(out.state.skills.hunting.level, 1);
  assert.equal(out.state.skills.mining.level, 1);
  assert.equal(out.state.items.hide, actions);
  const home = enter(away, start + elapsed);
  assert.equal(home.state.skills.hunting.level, levelFromXP(actions * ACTIVITIES.hunting.xp));
  assert.equal(home.state.skills.mining.level, 1);
  assert.ok(home.levelsGained.hunting > 100);
});

test("no duplicate reward for same timestamp or clock moving backwards", () => {
  assert.equal(finish(newGame(0), YEAR * 20).report.completed, 0);
  const start = 10_000, duration = ACTIVITIES.mining.durationMs;
  const chosen = choose(newGame(start), "mining", start).state;
  const first = finish(chosen, start + duration).state;
  assert.equal(first.items.stone, 1);
  assert.equal(finish(first, start + duration).report.completed, 0);
  assert.equal(finish(first, start).state.skills.mining.xp, first.skills.mining.xp);
});

test("old V1 saves retain their name, items, activity and partial progress", () => {
  const source = {
    version: 1, name: "Marauder", level: 7, totalXP: xpForLevel(7) + 10,
    items: { hide: 11, stone: 77 }, activity: "mining",
    progressMs: 3000, settledAtMs: 1711000000000
  };
  const migrated = readSave(JSON.stringify(source));
  assert.ok(migrated);
  assert.equal(migrated.version, GAME_VERSION);
  assert.equal(migrated.name, "Marauder");
  assert.equal(migrated.items.hide, 11);
  assert.equal(migrated.items.stone, 77);
  assert.equal(migrated.items.herb, 0);
  assert.equal(migrated.activity, "mining");
  assert.equal(migrated.progressMs, 3000);
  assert.equal(migrated.settledAtMs, source.settledAtMs);
  assert.equal(migrated.unattributedXP, source.totalXP, "do not invent assignment of historical global XP to a skill");
  assert.equal(migrated.skills.mining.xp, 0);
  assert.equal(migrated.skills.mining.level, 1);
  assert.equal(Object.hasOwn(migrated, "level"), false);
  assert.equal(Object.hasOwn(migrated, "totalXP"), false);
  assert.deepEqual(readSave(JSON.stringify(migrated)), migrated);
});

test("V2 missing newly introduced skill/resource keys defaults safely", () => {
  const saved = newGame(0);
  delete saved.skills.carpentry;
  delete saved.items.plank;
  saved.skills.mining = { xp: 115, level: 2 };
  const load = readSave(saved);
  assert.deepEqual(load.skills.carpentry, { xp: 0, level: 1 });
  assert.equal(load.items.plank, 0);
  assert.deepEqual(load.skills.mining, { xp: 115, level: 2 });
});

test("corrupted, incompatible or forged skill levels are rejected", () => {
  const original = newGame(0);
  assert.equal(readSave("not json"), null);
  assert.equal(readSave({ ...original, version: 99 }), null);
  assert.equal(readSave({ ...original, items: { stone: -1 } }), null);
  assert.equal(readSave({ ...original, activity: "unknown" }), null);
  assert.equal(readSave({ ...original, skills: { mining: { xp: 0, level: 99 } } }), null);
  assert.equal(readSave({ ...original, skills: { mining: { xp: -1, level: 1 } } }), null);
  assert.equal(readSave({ ...original, unattributedXP: -2 }), null);
  assert.equal(readSave({ version: 1, name: "Old", level: 8, totalXP: 0, items: {},
    activity: null, progressMs: 0, settledAtMs: 0 }), null);
});

test("reward total variance stays independent and within +/-10%", () => {
  const chosen = choose(newGame(0), "mining", 0).state;
  const time = 100 * ACTIVITIES.mining.durationMs;
  const low = settle(chosen, time, () => 0);
  const rolls = [0.999999, 0, 0.999999, 0];
  const high = settle(chosen, time, () => rolls.shift());
  assert.equal(low.report.gainedItems, 90);
  assert.equal(high.report.gainedItems, 110);
  assert.equal(low.state.skills.mining.xp, 180);
  assert.equal(high.state.skills.mining.xp, 220);
  assert.equal(low.state.skills.mining.level, 1);
  assert.equal(high.state.skills.mining.level, 1);
});

test("20 years settle with constant number of random rolls", () => {
  const start = 1_600_000_000_000;
  const chosen = choose(newGame(start), "gathering", start).state;
  let rolls = 0;
  const out = enterGame(chosen, start + YEAR * 20, () => { rolls++; return 0.5; });
  assert.equal(rolls, 2);
  assert.ok(out.state.skills.gathering.level > 1);
  assert.equal(out.state.skills.mining.level, 1);
});

test("one-day testing shortcut internally respects frozen skill levels", () => {
  const start = 1_000_000;
  const chosen = choose(newGame(start), "gathering", start).state;
  const out = testOfflineDay(chosen, start, midpoint);
  assert.equal(out.report.completed, Math.floor(86400000 / ACTIVITIES.gathering.durationMs));
  assert.equal(out.state.skills.gathering.level, levelFromXP(out.state.skills.gathering.xp));
  assert.deepEqual(readSave(JSON.stringify(out.state)), out.state);
});
