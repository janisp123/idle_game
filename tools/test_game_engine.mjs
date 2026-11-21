import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITIES, ITEM_KEYS, ITEM_LABELS, LOOT_TABLES, lootChances, PRODUCTION_RECIPES, PRODUCTION_INPUTS, recipeOptions, SKILL_IDS, GAME_VERSION, SAVE_KEY, BASE_CYCLE_MS,
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
  assert.ok(ITEM_KEYS.length > 20, "rare resources have separate stack keys");
  for (const id of SKILL_IDS) assert.deepEqual(state.skills[id], { level: 1, xp: 0 });
});

test("forty activities retain independently configurable full work-cycle times", () => {
  assert.ok(Object.keys(ACTIVITIES).length >= 10);
  for (const activity of Object.values(ACTIVITIES)) {
    assert.ok(activity.durationMs >= 8 * BASE_CYCLE_MS);
    assert.equal(activity.durationMs, activity.baseMinutes * BASE_CYCLE_MS / activity.speed);
  }
  assert.equal(ZONE_TRAVEL_MS, 300_000);
  assert.equal(activityDuration("mining", 20), ACTIVITIES.mining.durationMs / 20);
  assert.throws(() => activityDuration("mining", 0), RangeError);
});

test("every activity independently earns XP and only produces material when allowed", () => {
  for (const [id, activity] of Object.entries(ACTIVITIES)) {
    const start = newGame(0);
    const ingredient = PRODUCTION_RECIPES[id]?.[0]?.input;
    if (ingredient) start.items[ingredient] = 1;
    const chosen = choose(start, id, 0).state;
    assert.equal(finish(chosen, activity.durationMs - 1000).report.completed, 0);
    const result = finish(chosen, activity.durationMs);
    assert.equal(result.report.completed, 1);
    if (activity.item === null) {
      assert.equal(result.report.gainedItems, 0);
      assert.deepEqual(result.report.items, {});
    } else assert.equal(result.state.items[activity.item], 1);
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

test("ten outlaw skills are independent, with their own spoils and long work cycles", () => {
  const outlaws = Object.entries(ACTIVITIES).filter(([, a]) => a.category === "outlaw");
  const honest = Object.entries(ACTIVITIES).filter(([, a]) => a.category === "craft");
  assert.equal(outlaws.length, 10);
  assert.equal(honest.length, 10);
  assert.equal(SKILL_IDS.length, 40);
  assert.ok(ITEM_KEYS.length > 20);
  for (const [id, task] of outlaws) {
    assert.ok(task.durationMs >= 25 * BASE_CYCLE_MS, id);
    const selected = choose(newGame(0), id, 0).state;
    const result = finish(selected, task.durationMs);
    assert.equal(result.state.items[task.item], 1, id);
    assert.equal(result.state.skills[id].xp, task.xp, id);
    assert.equal(result.state.skills[id].level, 1, "no offline/active auto-levels");
    assert.equal(result.state.skills.mining.xp, 0, "outlaw work does not increase mining skill");
  }
});

test("old 10-skill saves load all ten new outlaw skills and resources safely", () => {
  const old = newGame(0);
  for (const [id, task] of Object.entries(ACTIVITIES)) {
    if (task.category === "outlaw") {
      delete old.skills[id];
      delete old.items[task.item];
    }
  }
  old.name = "Thief";
  old.items.stone = 314;
  old.skills.mining = { xp: 55, level: 2 };
  const loaded = readSave(JSON.stringify(old));
  assert.ok(loaded);
  assert.equal(loaded.name, "Thief");
  assert.equal(loaded.items.stone, 314);
  assert.equal(loaded.skills.mining.xp, 55);
  assert.equal(loaded.skills.mining.level, 2);
  assert.equal(loaded.items.stolen_purse, 0);
  assert.deepEqual(loaded.skills.highway_robbery, { xp: 0, level: 1 });
  assert.equal(Object.keys(loaded.items).length, ITEM_KEYS.length);
  assert.equal(Object.keys(loaded.skills).length, 40);
});

test("outlaw offline work has no time cap and only activates skills on return", () => {
  const start = 1_600_000_000_000;
  const years = 20 * YEAR;
  const task = ACTIVITIES.highway_robbery;
  const away = choose(newGame(start), "highway_robbery", start).state;
  const result = finish(away, start + years);
  const amount = Math.floor(years / task.durationMs);
  assert.equal(result.report.completed, amount);
  assert.equal(result.state.items.stolen_purse, amount);
  assert.equal(result.state.skills.highway_robbery.xp, amount * task.xp);
  assert.equal(result.state.skills.highway_robbery.level, 1);
  const home = enter(away, start + years);
  assert.equal(home.state.skills.highway_robbery.level, levelFromXP(amount * task.xp));
  assert.equal(home.state.skills.mining.level, 1);
});

test("five basic activities have skill-gated loot tiers, other activities retain default resources", () => {
  assert.deepEqual(Object.keys(LOOT_TABLES).sort(),
    ["fishing", "gathering", "hunting", "mining", "woodcutting"].sort());
  assert.deepEqual(lootChances("mining", 1).map(t => t.item), ["stone"]);
  assert.deepEqual(lootChances("mining", 2).map(t => t.item), ["stone", "copper_ore"]);
  assert.deepEqual(lootChances("mining", 10).map(t => t.item),
    ["stone", "copper_ore", "iron_ore"]);
  assert.deepEqual(lootChances("mining", 25).map(t => t.item),
    ["stone", "copper_ore", "iron_ore", "silver_ore"]);
  assert.equal(ITEM_LABELS.shadowroot, "Shadowroot");
  for (const [id, table] of Object.entries(LOOT_TABLES)) {
    assert.equal(table[0].item, ACTIVITIES[id].item);
    for (const level of [1, 2, 7, 10, 25, 100]) {
      const chance = lootChances(id, level);
      assert.ok(chance.some(t => t.item === table[0].item));
      assert.ok(Math.abs(chance.reduce((s, t) => s + t.chance, 0) - 1) < 1e-10);
      assert.ok(chance.every(t => t.chance > 0 && t.minLevel <= level));
    }
  }
  assert.ok(lootChances("mining", 100).find(t => t.item === "silver_ore").chance
    > lootChances("mining", 25).find(t => t.item === "silver_ore").chance);
});

test("higher skill occasionally yields different ores without a second activity button", () => {
  const state = choose(newGame(0), "mining", 0).state;
  state.skills.mining = { level: 25, xp: xpForLevel(25) };
  const out = settle(state, ACTIVITIES.mining.durationMs, () => 0);
  assert.equal(out.report.gainedItems, 1);
  assert.equal(out.report.items.silver_ore, 1);
  assert.equal(out.state.items.silver_ore, 1);
  assert.equal(out.state.items.stone, 0);
  assert.equal(out.state.skills.mining.level, 25);
  assert.equal(out.state.skills.mining.xp, xpForLevel(25) + 2);
  assert.equal(Object.values(out.report.items).reduce((a, b) => a + b, 0), out.report.gainedItems);
});

test("offline skill upgrades never change ore chances mid-absence", () => {
  const state = choose(newGame(0), "mining", 0).state;
  const cycles = 90000;
  const out = settle(state, cycles * ACTIVITIES.mining.durationMs, () => 0.5);
  assert.equal(out.state.items.copper_ore, 0);
  assert.equal(out.state.items.iron_ore, 0);
  assert.equal(out.state.items.stone, out.report.gainedItems);
  assert.equal(out.state.skills.mining.level, 1);
  const home = enter(state, cycles * ACTIVITIES.mining.durationMs);
  assert.ok(home.state.skills.mining.level > 25);
  const after = settle(home.state, (cycles + 10000) * ACTIVITIES.mining.durationMs, () => 0.5);
  assert.ok(after.state.items.copper_ore > 0);
  assert.ok(after.state.items.silver_ore > 0);
});

test("century-scale tier allocation takes bounded RNG draws and keeps total exact", () => {
  const state = choose(newGame(0), "mining", 0).state;
  state.skills.mining = { level: 100, xp: xpForLevel(100) };
  const elapsed = 100 * YEAR;
  let calls = 0;
  const result = settle(state, elapsed, () => { calls++; return 0.5; });
  assert.ok(calls <= 10, "never replay individual actions or offline years");
  assert.equal(Object.values(result.report.items).reduce((a, b) => a + b, 0),
    result.report.gainedItems);
  assert.equal(result.state.skills.mining.level, 100);
  assert.ok(result.state.items.stone > 0);
  assert.ok(result.state.items.copper_ore > 0);
  assert.ok(result.state.items.iron_ore > 0);
  assert.ok(result.state.items.silver_ore > 0);
  assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
});

test("existing twenty-resource saves load with missing new rarities defaulted safely", () => {
  const old = newGame(0);
  delete old.items.copper_ore;
  delete old.items.silver_ore;
  old.items.stone = 87;
  const result = readSave(JSON.stringify(old));
  assert.ok(result);
  assert.equal(result.items.stone, 87);
  assert.equal(result.items.copper_ore, 0);
  assert.equal(result.items.silver_ore, 0);
});

test("processing consumes inventory: no copper ore means no ingots or XP", () => {
  assert.deepEqual(Object.keys(PRODUCTION_RECIPES), ["smelting", "alchemy", "carpentry", "masonry", "cooking"]);
  assert.deepEqual(PRODUCTION_INPUTS, ["copper_ore", "iron_ore", "silver_ore", "herb", "log", "stone", "fish"]);
  const s = choose(newGame(0), "smelting", 0).state;
  const result = finish(s, 100 * ACTIVITIES.smelting.durationMs);
  assert.equal(result.report.completed, 0);
  assert.equal(result.state.items.ingot, 0);
  assert.equal(result.state.items.iron_ingot, 0);
  assert.equal(result.state.skills.smelting.xp, 0);
  assert.equal(result.state.settledAtMs, 100 * ACTIVITIES.smelting.durationMs);
  assert.equal(result.state.progressMs, 0);
});

test("smelting chooses unlocked inputs from inventory, never fabricates resources", () => {
  const start = newGame(0);
  start.items.copper_ore = 5;
  start.items.iron_ore = 4;
  start.items.silver_ore = 3;
  const s = choose(start, "smelting", 0).state;
  const result = finish(s, 100 * ACTIVITIES.smelting.durationMs);
  assert.equal(result.report.completed, 5, "level one can only smelt copper");
  assert.equal(result.report.gainedItems, 5);
  assert.equal(result.state.items.ingot, 5);
  assert.equal(result.state.items.copper_ore, 0);
  assert.equal(result.state.items.iron_ore, 4);
  assert.equal(result.state.items.silver_ore, 3);
  assert.equal(result.state.skills.smelting.xp, 15);
  assert.equal(Object.values(result.report.items).reduce((n,x)=>n+x,0),5);
  assert.deepEqual(result.report.consumed,{copper_ore:5});
});

test("high-level smelting automatically uses higher ore if present", () => {
  const start = newGame(0);
  start.skills.smelting = { level: 25, xp: xpForLevel(25) };
  start.items.iron_ore = 4;
  start.items.silver_ore = 2;
  assert.deepEqual(recipeOptions("smelting",1).map(x=>x.output),["ingot"]);
  assert.deepEqual(recipeOptions("smelting",10).map(x=>x.output),["ingot","iron_ingot"]);
  assert.deepEqual(recipeOptions("smelting",25).map(x=>x.output),["ingot","iron_ingot","silver_ingot"]);
  const s = choose(start, "smelting", 0).state;
  const out = finish(s, 100 * ACTIVITIES.smelting.durationMs);
  assert.equal(out.report.completed, 6);
  assert.equal(out.state.items.iron_ingot,4);
  assert.equal(out.state.items.silver_ingot,2);
  assert.equal(out.state.items.iron_ore,0);
  assert.equal(out.state.items.silver_ore,0);
});

test("protected ore cannot be consumed, even during very long absences", () => {
  const start = newGame(0);
  start.skills.smelting = { level: 100, xp: xpForLevel(100) };
  start.items.copper_ore = 3;
  start.items.iron_ore = 500;
  start.items.silver_ore = 200;
  start.protectedItems = ["iron_ore", "silver_ore"];
  const s = choose(start, "smelting", 0).state;
  const result = finish(s, 100 * YEAR);
  assert.equal(result.report.completed,3);
  assert.equal(result.state.items.ingot,3);
  assert.equal(result.state.items.copper_ore,0);
  assert.equal(result.state.items.iron_ore,500);
  assert.equal(result.state.items.silver_ore,200);
  assert.deepEqual(result.state.protectedItems,["iron_ore","silver_ore"]);
  assert.equal(result.state.skills.smelting.level,100);
});

test("smelting remains frozen at logout level while gaining return-only XP", () => {
  const start = newGame(0);
  start.skills.smelting = { level: 1, xp: xpForLevel(10) - 1 };
  start.items.copper_ore = 1;
  start.items.iron_ore = 3;
  const s = choose(start, "smelting", 0).state;
  const out = finish(s, 10 * ACTIVITIES.smelting.durationMs);
  assert.equal(out.report.completed,1);
  assert.equal(out.state.items.iron_ore,3);
  assert.equal(out.state.skills.smelting.level,1);
  const home = enter(s, 10 * ACTIVITIES.smelting.durationMs);
  assert.equal(home.state.skills.smelting.level,10);
  const later = finish(home.state, 20 * ACTIVITIES.smelting.durationMs);
  assert.equal(later.state.items.iron_ore,0);
  assert.equal(later.state.items.iron_ingot,3);
});

test("old save without protection field migrates safely and invalid locks are rejected", () => {
  const old = newGame(0);
  delete old.protectedItems;
  old.items.iron_ore = 11;
  const loaded = readSave(JSON.stringify(old));
  assert.ok(loaded);
  assert.deepEqual(loaded.protectedItems,[]);
  assert.equal(loaded.items.iron_ore,11);
  const forged = { ...old, protectedItems:["made_up_ore"] };
  assert.equal(readSave(forged),null);
  const safeguarded = { ...old, protectedItems:["iron_ore"] };
  assert.deepEqual(readSave(safeguarded).protectedItems,["iron_ore"]);
});

test("all four basic crafting professions consume gathered stock and grant no free output", () => {
  const basic = [
    ["alchemy", "herb", "potion"],
    ["carpentry", "log", "plank"],
    ["masonry", "stone", "block"],
    ["cooking", "fish", "meal"]
  ];
  for (const [activity, input, output] of basic) {
    assert.deepEqual(recipeOptions(activity, 1).map(r => [r.input, r.output]), [[input, output]]);
    const start = newGame(0);
    start.items[input] = 4;
    const selected = choose(start, activity, 0).state;
    const at = 100 * ACTIVITIES[activity].durationMs;
    const crafted = finish(selected, at);
    assert.equal(crafted.report.completed, 4, activity);
    assert.equal(crafted.report.gainedItems, 4, activity);
    assert.deepEqual(crafted.report.items, { [output]: 4 }, activity);
    assert.deepEqual(crafted.report.consumed, { [input]: 4 }, activity);
    assert.equal(crafted.state.items[input], 0, activity);
    assert.equal(crafted.state.items[output], 4, activity);
    assert.equal(crafted.state.skills[activity].xp, 4 * ACTIVITIES[activity].xp, activity);
    const depleted = finish(crafted.state, at + ACTIVITIES[activity].durationMs);
    assert.equal(depleted.report.completed, 0, activity);
    assert.equal(depleted.report.gainedXP, 0, activity);
    assert.equal(depleted.state.items[output], 4, activity);
    assert.equal(depleted.state.skills[activity].xp, crafted.state.skills[activity].xp, activity);
  }
});

test("protecting non-ore ingredients works over 20 years and survives save reload", () => {
  const start = newGame(0);
  start.items.herb = 9;
  start.protectedItems = ["herb"];
  const saved = readSave(JSON.stringify(start));
  assert.ok(saved);
  assert.deepEqual(saved.protectedItems, ["herb"]);
  const selected = choose(saved, "alchemy", 0).state;
  let rolls = 0;
  const out = settle(selected, 20 * YEAR, () => { rolls++; return 0.5; });
  assert.ok(rolls < 10, "production cannot replay twenty years cycle by cycle");
  assert.equal(out.report.completed, 0);
  assert.deepEqual(out.report.items, {});
  assert.deepEqual(out.report.consumed, {});
  assert.equal(out.state.items.herb, 9);
  assert.equal(out.state.items.potion, 0);
  assert.equal(out.state.skills.alchemy.xp, 0);
  assert.deepEqual(out.state.protectedItems, ["herb"]);
});

test("long offline cooking uses only available fish; levels unlock after return", () => {
  const start = newGame(0);
  start.items.fish = 1000;
  const selected = choose(start, "cooking", 0).state;
  const out = finish(selected, 20 * YEAR);
  assert.equal(out.report.completed, 1000);
  assert.equal(out.state.items.fish, 0);
  assert.equal(out.state.items.meal, 1000);
  assert.equal(out.state.skills.cooking.level, 1, "OFF-001 freezes the effective level");
  const returnOut = enter(selected, 20 * YEAR);
  assert.ok(returnOut.state.skills.cooking.level > 1);
  assert.deepEqual(readSave(JSON.stringify(returnOut.state)), returnOut.state);
});

test("twenty new personal activities offer ten training and ten leisure skills without loot", () => {
  const training = Object.entries(ACTIVITIES).filter(([,a]) => a.category === "training");
  const leisure = Object.entries(ACTIVITIES).filter(([,a]) => a.category === "leisure");
  assert.equal(training.length, 10);
  assert.equal(leisure.length, 10);
  assert.equal(SKILL_IDS.length, 40);
  assert.equal(new Set(SKILL_IDS).size, 40);
  for (const [id, task] of [...training, ...leisure]) {
    assert.equal(task.item, null);
    const start = choose(newGame(0), id, 0).state;
    const out = finish(start, task.durationMs * 10);
    assert.equal(out.report.completed, 10);
    assert.equal(out.report.gainedItems, 0);
    assert.deepEqual(out.report.items, {});
    assert.deepEqual(out.state.items, newGame(0).items);
    assert.ok(out.state.skills[id].xp > 0);
    assert.equal(out.state.skills[id].level, 1);
    assert.ok(SKILL_IDS.filter(x => x !== id).every(x => out.state.skills[x].xp === 0));
  }
});

test("new XP-only skills remain offline-safe for decades and old saves migrate", () => {
  const old = newGame(0);
  for (const [id, a] of Object.entries(ACTIVITIES)) {
    if (a.item === null) delete old.skills[id];
  }
  const restored = readSave(JSON.stringify(old));
  assert.ok(restored);
  assert.deepEqual(restored.skills.meditation, {level: 1, xp: 0});
  const away = choose(restored, "ale_with_friends", 0).state;
  const result = finish(away, 20 * YEAR);
  assert.ok(result.state.skills.ale_with_friends.xp > 0);
  assert.equal(result.state.skills.ale_with_friends.level, 1);
  assert.deepEqual(result.report.items, {});
  assert.deepEqual(result.state.items, restored.items);
  const back = enter(away, 20 * YEAR);
  assert.ok(back.state.skills.ale_with_friends.level > 1);
  assert.equal(back.state.skills.meditation.level, 1);
  assert.deepEqual(readSave(JSON.stringify(back.state)), back.state);
});
