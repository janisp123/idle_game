import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITIES, ITEM_KEYS, ITEM_LABELS, LOOT_TABLES, lootChances, PRODUCTION_RECIPES, PRODUCTION_INPUTS, recipeOptions, SKILL_IDS, GAME_VERSION, SAVE_KEY, BASE_CYCLE_MS,
  ATTRIBUTES, ATTRIBUTE_IDS, ATTRIBUTE_BALANCE, ACTIVITY_STAT_WEIGHTS, attributeXP, attributeProgress, allAttributeProgress,
  ZONE_TRAVEL_MS, SAME_ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS, TIMING_PROFILE, MAX_WAGONS, SKILL_BALANCE, SCHEDULE_BALANCE, MINUTE_MS, HOUR_MS, DAY_MS, UNTIL_LEVEL_UP, MASTER_RESOURCE_MINIMUM, skillMasterReadiness, validQueuePlan, validPlannedDuration, queueStartActivity, queueInsertTimedActivity, queueSetDuration, queueSwap, queueRemoveLast, activityDuration, newGame, readSave, settle, chooseActivity, requestActivityChange,
  enterGame, testOfflineDay, xpForLevel, levelFromXP, xpToNextLevel, skillSpoils, skillMasterOffer, learnFromMaster, setArmourChoice
} from "../site/play/engine.mjs";
import { ARMOUR_SLOTS, ARMOUR_CHOICES, ARMOUR_LEVELS, initialArmour, armourOption, armourUnlocked } from "../site/play/armour.mjs";

const midpoint = () => 0.5;
const YEAR = 365 * 24 * 60 * 60 * 1000;
const choose = (s, a, now) => chooseActivity(s, a, now, midpoint);
const finish = (s, now) => settle(s, now, midpoint);
const enter = (s, now) => enterGame(s, now, midpoint);

test("documented skill costs and duration choices come from shared balance tables", () => {
  assert.ok(Number.isFinite(SKILL_BALANCE.xpPerNextLevel) && SKILL_BALANCE.xpPerNextLevel > 0);
  assert.ok(Number.isFinite(SKILL_BALANCE.efficiencyPerLevel) &&
    SKILL_BALANCE.efficiencyPerLevel >= 0);
  assert.ok(Number.isFinite(SKILL_BALANCE.maxEfficiency) &&
    SKILL_BALANCE.maxEfficiency >= 1);
  assert.ok(Number.isFinite(SKILL_BALANCE.batchVariation) &&
    SKILL_BALANCE.batchVariation >= 0 && SKILL_BALANCE.batchVariation < 1);
  assert.ok(Number.isSafeInteger(SCHEDULE_BALANCE.minDurationUnits) &&
    SCHEDULE_BALANCE.minDurationUnits >= 1);
  assert.ok(Number.isSafeInteger(SCHEDULE_BALANCE.maxDurationUnits) &&
    SCHEDULE_BALANCE.maxDurationUnits >= SCHEDULE_BALANCE.minDurationUnits);
  for (const L of [1, 2, 10, 25, 100]) {
    assert.equal(xpToNextLevel(L), SKILL_BALANCE.xpPerNextLevel * L);
    const total = SKILL_BALANCE.xpPerNextLevel * (L - 1) * L / 2;
    assert.equal(xpForLevel(L), total);
    assert.equal(levelFromXP(total), L, "inverse tracks the same tuned formula");
    if (L > 1) assert.equal(levelFromXP(total - 1), L - 1);
  }
  for (const unit of [MINUTE_MS, HOUR_MS, DAY_MS]) {
    for (let n = SCHEDULE_BALANCE.minDurationUnits;
      n <= SCHEDULE_BALANCE.maxDurationUnits; n++) {
      assert.equal(validPlannedDuration(n * unit), true);
    }
    // A full day multiplied beyond the configured max cannot also be a
    // valid shorter hour or minute amount, regardless of chosen UI range.
    assert.equal(validPlannedDuration((SCHEDULE_BALANCE.maxDurationUnits + 1) * DAY_MS),
      false, "days above the configured max are invalid");
  }
  assert.equal(validPlannedDuration(30_000), false);
});

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

test("eleven fixed armour slots equip independently without loot or hidden bonuses", () => {
  const base = newGame(0);
  assert.equal(ARMOUR_SLOTS.length, 11);
  assert.deepEqual(Object.keys(base.armour).sort(), ARMOUR_SLOTS.map(s => s.id).sort());
  assert.deepEqual(base.armour, initialArmour());
  assert.equal(ARMOUR_SLOTS.filter(s => s.group === "gloves").length, 2);
  assert.equal(ARMOUR_SLOTS.filter(s => s.group === "boots").length, 2);
  assert.equal(ARMOUR_SLOTS.filter(s => s.group === "armguards").length, 2);
  assert.equal(ARMOUR_SLOTS.filter(s => s.group === "shoulders").length, 2);
  for (const slot of ARMOUR_SLOTS) {
    assert.ok(armourOption(slot.id,base.armour[slot.id]));
    assert.equal(armourUnlocked(base.skills,slot.id,base.armour[slot.id]), true);
    assert.equal(ARMOUR_CHOICES[slot.group].length, 4);
  }
  assert.equal(armourUnlocked(base.skills,"head","iron"), false);
  assert.throws(() => setArmourChoice(base,"head","iron",0), RangeError);
  assert.throws(() => setArmourChoice(base,"fake_slot","hood",0), RangeError);
  assert.throws(() => setArmourChoice(base,"left_glove","unknown",0), RangeError);
  assert.equal(base.armour.head,"hood","a locked selection cannot alter state");
  const starter = setArmourChoice(base,"left_glove","none",0).state;
  assert.equal(starter.armour.left_glove,"none");
  assert.equal(starter.armour.right_glove,"cloth","right and left are separate");
  assert.equal(starter.combatLoadout,base.combatLoadout);
  assert.deepEqual(starter.items,base.items);
  assert.deepEqual(starter.skills,base.skills);
  assert.equal(starter.combatSession,base.combatSession);
  assert.deepEqual(readSave(JSON.stringify(starter)),starter);
  const skilled = {...starter, skills:{...starter.skills,
    fighting:{level:ARMOUR_LEVELS.leather,xp:0}}};
  const withLeather = setArmourChoice(skilled,"left_glove","leather",0).state;
  assert.equal(withLeather.armour.left_glove,"leather");
  assert.equal(withLeather.armour.right_glove,"cloth");
  assert.throws(()=>setArmourChoice(withLeather,"left_glove","iron",0),RangeError);
  const veteran={...withLeather,skills:{...withLeather.skills,
    fighting:{level:ARMOUR_LEVELS.iron,xp:0}}};
  const iron=setArmourChoice(veteran,"head","iron",0).state;
  assert.equal(iron.armour.head,"iron");
  assert.deepEqual(readSave(JSON.stringify(iron)),iron);
  const damaged={...iron,armour:{...iron.armour,head:"cheat",left_glove:"wrong_item"}};
  const repaired=readSave(damaged);
  assert.equal(repaired.armour.head,"hood","invalid gear is replaced, not the whole character");
  assert.equal(repaired.armour.left_glove,"cloth");
  assert.deepEqual(repaired.skills,iron.skills);
  const legacy={...iron}; delete legacy.armour;
  const migrated=readSave(legacy);
  assert.deepEqual(migrated.armour,initialArmour(),"old V7 saves get free starter gear");
  assert.deepEqual(migrated.items,iron.items);
  assert.deepEqual(migrated.skills,iron.skills);
  assert.deepEqual(migrated.wagons,iron.wagons);
});

test("mastery offers collect every possible skill spoil, including rare stock", () => {
  const start = newGame(0);
  start.skills.mining = {level:1,xp:xpToNextLevel(1)};
  start.skills.hunting = {level:1,xp:xpToNextLevel(1)};
  start.skills.meditation = {level:1,xp:xpToNextLevel(1)};
  start.items.stone = 1; // the smallest sacrifice is enough
  start.items.copper_ore = 31;
  start.items.iron_ore = 19;
  start.items.silver_ore = 5;
  start.items.log = 40; // unrelated resources must survive
  assert.deepEqual(skillSpoils("mining"), ["stone","copper_ore","iron_ore","silver_ore"]);
  assert.deepEqual(skillSpoils("meditation"), []);
  assert.deepEqual(skillSpoils("cooking"), ["meal"]);
  const offer = skillMasterOffer(start);
  assert.deepEqual(offer.ready, ["mining","meditation"],
    "no hunting spoils means that skill cannot be trained yet");
  assert.deepEqual(offer.blocked, ["hunting"]);
  assert.deepEqual(offer.tribute, {
    stone:1,copper_ore:31,iron_ore:19,silver_ore:5
  });
  const out = learnFromMaster(start, 0);
  for (const key of Object.keys(offer.tribute)) assert.equal(out.state.items[key], 0, key);
  assert.equal(out.state.items.log, 40);
  assert.equal(Object.hasOwn(out.state, "protectedItems"), false);
  assert.deepEqual(out.state.skills.mining, {level:2,xp:0});
  assert.deepEqual(out.state.skills.meditation, {level:2,xp:0});
  assert.deepEqual(out.state.skills.hunting, {level:1,xp:40});
  assert.deepEqual(readSave(JSON.stringify(out.state)), out.state);
  assert.throws(() => learnFromMaster(out.state, 0), RangeError,
    "one visit can never grant two levels for a single XP bar");
});

test("spending spoils before the Master is strategic, but at least one remains necessary", () => {
  const start = newGame(0);
  start.skills.mining.xp = xpToNextLevel(1);
  assert.deepEqual(skillMasterOffer(start).ready, []);
  assert.deepEqual(skillMasterOffer(start).blocked, ["mining"]);
  assert.throws(() => learnFromMaster(start, 0), RangeError);
  start.items.stone = 1;
  start.items.copper_ore = 0;
  assert.deepEqual(skillMasterOffer(start).ready, ["mining"]);
  const out = learnFromMaster(start, 0);
  assert.equal(out.state.items.stone, 0);
  assert.equal(out.state.skills.mining.level, 2);
  assert.equal(out.state.skills.mining.xp, 0);
  assert.deepEqual(skillMasterOffer(out.state).ready, []);
});

test("V3 lifetime XP migrates to a single current-level bar without inventory or queue loss", () => {
  const old = newGame(250000);
  old.version = 3;
  old.name = "The Ancient";
  old.activity = "mining";
  old.wagons = [{activity:"mining",plannedMs:null}];
  old.items.stone = 777;
  old.items.copper_ore = 10;
  old.protectedItems = ["stone"];
  old.skills.mining = {level:25,xp:xpForLevel(100)};
  old.skills.hunting = {level:4,xp:xpForLevel(4)+11};
  const migrated = readSave(JSON.stringify(old));
  assert.ok(migrated);
  assert.equal(migrated.version, GAME_VERSION);
  assert.equal(migrated.timingProfile, old.timingProfile);
  assert.equal(migrated.skills.mining.level, 25);
  assert.equal(migrated.skills.mining.xp, xpToNextLevel(25));
  assert.deepEqual(migrated.skills.hunting, {level:4,xp:11});
  assert.deepEqual(migrated.wagons, old.wagons);
  assert.equal(migrated.items.stone, 777);
  assert.equal(migrated.items.copper_ore, 10);
  assert.equal(Object.hasOwn(migrated, "protectedItems"), false, "old locks are discarded");
  assert.deepEqual(readSave(migrated), migrated);
});

test("Master's new level improves raw-resource yield and XP efficiency", () => {
  const start = newGame(0);
  start.skills.mining = {level:1,xp:40};
  start.items.stone = 1;
  const taught = learnFromMaster(start, 0).state;
  const before = finish(choose(newGame(0), "mining", 0).state,
    100 * ACTIVITIES.mining.durationMs);
  const after = finish(choose(taught, "mining", 0).state,
    100 * ACTIVITIES.mining.durationMs);
  assert.ok(after.report.gainedItems > before.report.gainedItems,
    "level 2 improves raw output over an equal number of actions");
  assert.equal(after.state.skills.mining.level, 2);
  assert.equal(after.state.skills.mining.xp, xpToNextLevel(2));
  assert.equal(before.state.skills.mining.xp, xpToNextLevel(1));
});

test("alpha profile gives every complete work cycle ten seconds without losing normal balance data", () => {
  assert.equal(TIMING_PROFILE, "alpha");
  assert.ok(Object.keys(ACTIVITIES).length >= 10);
  for (const activity of Object.values(ACTIVITIES)) {
    assert.equal(activity.durationMs, 10_000);
    assert.ok(activity.baseMinutes * BASE_CYCLE_MS / activity.speed >= 8 * BASE_CYCLE_MS);
  }
  assert.equal(SAME_ZONE_TRAVEL_MS, 5_000);
  assert.equal(ZONE_TRAVEL_MS, 5_000);
  assert.equal(PREPARATION_MS, 5_000);
  assert.equal(INITIAL_PREPARATION_MS, 10_000);
  assert.equal(activityDuration("mining", 20), 500);
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

test("one full skill XP bar never grants levels until the Master sacrifices all spoils", () => {
  const chosen = choose(newGame(0), "mining", 0).state;
  const amount = 200;
  const result = finish(chosen, amount * ACTIVITIES.mining.durationMs);
  assert.equal(result.state.skills.mining.xp, xpToNextLevel(1), "XP stops at one threshold");
  assert.equal(result.state.skills.mining.level, 1);
  assert.equal(result.state.items.stone, amount, "loot continues after the XP cap");
  const returned = enter(chosen, amount * ACTIVITIES.mining.durationMs);
  assert.equal(returned.state.skills.mining.level, 1, "return never auto-levels");
  assert.deepEqual(returned.levelsGained, {});
  const offer = skillMasterOffer(returned.state);
  assert.deepEqual(offer.ready, ["mining"]);
  assert.deepEqual(offer.tribute, { stone: amount });
  const trained = learnFromMaster(returned.state, returned.state.settledAtMs);
  assert.deepEqual(trained.state.skills.mining, { level: 2, xp: 0 });
  assert.equal(trained.state.items.stone, 0);
  assert.equal(trained.state.items.hide, 0);
  assert.equal(trained.mastery.ready[0], "mining");
  assert.deepEqual(readSave(trained.state), trained.state);
});
test("switching activities caps each level's XP separately and returns without leveling", () => {
  let state = choose(newGame(0), "mining", 0).state;
  const miningCount = 30;
  const switched = choose(state, "hunting", miningCount * ACTIVITIES.mining.durationMs + 1000);
  state = switched.state;
  assert.equal(state.progressMs, 0);
  assert.equal(state.items.stone, miningCount);
  assert.equal(state.skills.mining.xp, xpToNextLevel(1));
  assert.equal(state.skills.mining.level, 1);
  const huntingCount = 30;
  state = finish(state, state.settledAtMs + huntingCount * ACTIVITIES.hunting.durationMs).state;
  assert.equal(state.skills.hunting.xp, xpToNextLevel(1));
  assert.equal(state.skills.hunting.level, 1);
  const returned = enter(state, state.settledAtMs);
  assert.deepEqual(returned.levelsGained, {});
  assert.equal(returned.state.skills.mining.level, 1);
  assert.equal(returned.state.skills.hunting.level, 1);
  const trained = learnFromMaster(returned.state, returned.state.settledAtMs);
  assert.deepEqual(trained.mastery.ready.sort(), ["hunting", "mining"]);
  assert.deepEqual(trained.state.skills.hunting, {level:2,xp:0});
  assert.deepEqual(trained.state.skills.mining, {level:2,xp:0});
  assert.equal(trained.state.items.stone, 0);
  assert.equal(trained.state.items.hide, 0);
});
test("50 offline years still gather every resource but XP caps at one skill level", () => {
  const start = 1_600_000_000_000;
  const elapsed = YEAR * 50;
  const away = choose(newGame(start), "hunting", start).state;
  const out = finish(away, start + elapsed);
  const actions = Math.floor(elapsed / ACTIVITIES.hunting.durationMs);
  assert.equal(out.report.completed, actions);
  assert.equal(out.state.skills.hunting.xp, xpToNextLevel(1));
  assert.equal(out.state.skills.hunting.level, 1);
  assert.equal(out.state.skills.mining.level, 1);
  assert.equal(out.state.items.hide, actions);
  const home = enter(away, start + elapsed);
  assert.equal(home.state.skills.hunting.level, 1);
  assert.equal(home.state.items.hide, actions);
  const taught = learnFromMaster(home.state, start + elapsed);
  assert.equal(taught.state.skills.hunting.level, 2);
  assert.equal(taught.state.items.hide, 0);
  assert.equal(taught.state.skills.hunting.xp, 0);
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
  assert.equal(migrated.progressMs, Math.floor(3000 / (15 * BASE_CYCLE_MS) * 10_000));
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
  saved.version = 2;
  delete saved.timingProfile;
  delete saved.skills.carpentry;
  delete saved.items.plank;
  saved.skills.mining = { xp: 115, level: 2 };
  const load = readSave(saved);
  assert.deepEqual(load.skills.carpentry, { xp: 0, level: 1 });
  assert.equal(load.items.plank, 0);
  assert.deepEqual(load.skills.mining, { xp: 75, level: 2 }, "legacy lifetime XP becomes capped current-level progress");
});

test("corrupted, incompatible or forged skill levels are rejected", () => {
  const original = newGame(0);
  assert.equal(readSave("not json"), null);
  assert.equal(readSave({ ...original, version: 99 }), null);
  assert.equal(readSave({ ...original, items: { stone: -1 } }), null);
  assert.equal(readSave({ ...original, activity: "unknown" }), null);
  assert.equal(readSave({ ...original, skills: { mining: { xp: 41, level: 1 } } }), null);
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
  assert.equal(low.state.skills.mining.xp, 40);
  assert.equal(high.state.skills.mining.xp, 40);
  assert.equal(low.state.skills.mining.level, 1);
  assert.equal(high.state.skills.mining.level, 1);
});

test("20 years settle with constant number of random rolls", () => {
  const start = 1_600_000_000_000;
  const chosen = choose(newGame(start), "gathering", start).state;
  let rolls = 0;
  const out = enterGame(chosen, start + YEAR * 20, () => { rolls++; return 0.5; });
  assert.equal(rolls, 2);
  assert.equal(out.state.skills.gathering.level, 1);
  assert.equal(out.state.skills.gathering.xp, 40);
  assert.equal(out.state.skills.mining.level, 1);
});

test("one-day testing shortcut internally respects frozen skill levels", () => {
  const start = 1_000_000;
  const chosen = choose(newGame(start), "gathering", start).state;
  const out = testOfflineDay(chosen, start, midpoint);
  assert.equal(out.report.completed, Math.floor(86400000 / ACTIVITIES.gathering.durationMs));
  assert.equal(out.state.skills.gathering.level, 1);
  assert.equal(out.state.skills.gathering.xp, xpToNextLevel(1));
  assert.deepEqual(readSave(JSON.stringify(out.state)), out.state);
});

test("ten outlaw skills are independent, with their own spoils and long work cycles", () => {
  const outlaws = Object.entries(ACTIVITIES).filter(([, a]) => a.category === "outlaw");
  const honest = Object.entries(ACTIVITIES).filter(([, a]) => a.category === "craft");
  assert.equal(outlaws.length, 10);
  assert.equal(honest.length, 10);
  assert.equal(SKILL_IDS.length, 41);
  assert.ok(ITEM_KEYS.length > 20);
  for (const [id, task] of outlaws) {
    assert.ok(task.baseMinutes * BASE_CYCLE_MS / task.speed >= 25 * BASE_CYCLE_MS, id);
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
  assert.equal(Object.keys(loaded.skills).length, 41);
});

test("outlaw offline loot is unlimited but XP is capped and only the Master levels", () => {
  const start = 1_600_000_000_000;
  const years = 20 * YEAR;
  const task = ACTIVITIES.highway_robbery;
  const away = choose(newGame(start), "highway_robbery", start).state;
  const result = finish(away, start + years);
  const amount = Math.floor(years / task.durationMs);
  assert.equal(result.report.completed, amount);
  assert.equal(result.state.items.stolen_purse, amount);
  assert.equal(result.state.skills.highway_robbery.xp, 40);
  assert.equal(result.state.skills.highway_robbery.level, 1);
  const home = enter(away, start + years);
  assert.equal(home.state.skills.highway_robbery.level, 1);
  const taught = learnFromMaster(home.state, start + years);
  assert.equal(taught.state.items.stolen_purse, 0);
  assert.deepEqual(taught.state.skills.highway_robbery, {level:2,xp:0});
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
  state.skills.mining = { level: 25, xp: 0 };
  const out = settle(state, ACTIVITIES.mining.durationMs, () => 0);
  assert.ok(out.report.gainedItems >= 1, "trained miners yield more material");
  assert.equal(out.report.items.silver_ore, out.report.gainedItems);
  assert.equal(out.state.items.silver_ore, out.report.gainedItems);
  assert.equal(out.state.items.stone, 0);
  assert.equal(out.state.skills.mining.level, 25);
  assert.ok(out.state.skills.mining.xp > 0 && out.state.skills.mining.xp <= xpToNextLevel(25));
  assert.equal(Object.values(out.report.items).reduce((a, b) => a + b, 0), out.report.gainedItems);
});

test("no mining rarity upgrade happens offline or on return without a sacrifice", () => {
  const state = choose(newGame(0), "mining", 0).state;
  const cycles = 90000;
  const out = settle(state, cycles * ACTIVITIES.mining.durationMs, () => 0.5);
  assert.equal(out.state.items.copper_ore, 0);
  assert.equal(out.state.items.iron_ore, 0);
  assert.equal(out.state.items.stone, out.report.gainedItems);
  assert.equal(out.state.skills.mining.level, 1);
  const home = enter(state, cycles * ACTIVITIES.mining.durationMs);
  assert.equal(home.state.skills.mining.level, 1);
  assert.equal(home.state.skills.mining.xp, 40);
  const before = home.state.items.stone;
  const trained = learnFromMaster(home.state, home.state.settledAtMs);
  assert.equal(trained.state.skills.mining.level, 2);
  assert.equal(trained.state.items.stone, 0);
  const after = settle(trained.state, trained.state.settledAtMs +
    10000 * ACTIVITIES.mining.durationMs, () => 0.5);
  assert.ok(after.state.items.copper_ore > 0, "training unlocks copper");
  assert.ok(after.state.items.stone > 0);
  assert.ok(before > 0);
});
test("century-scale tier allocation takes bounded RNG draws and keeps total exact", () => {
  const state = choose(newGame(0), "mining", 0).state;
  state.skills.mining = { level: 100, xp: 0 };
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
  start.skills.smelting = { level: 25, xp: 0 };
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

test("legacy protected ores become available to crafting over long absences", () => {
  const old = newGame(0);
  old.skills.smelting = { level: 100, xp: 0 };
  old.items.copper_ore = 3;
  old.items.iron_ore = 500;
  old.items.silver_ore = 200;
  old.protectedItems = ["iron_ore", "silver_ore"]; // legacy browser save
  const loaded = readSave(JSON.stringify(old));
  assert.ok(loaded);
  assert.equal(Object.hasOwn(loaded, "protectedItems"), false);
  assert.equal(loaded.items.iron_ore, 500, "old material amounts survive load");
  const result = finish(choose(loaded, "smelting", 0).state, 100 * YEAR);
  assert.equal(result.report.completed, 703);
  assert.equal(result.state.items.copper_ore, 0);
  assert.equal(result.state.items.iron_ore, 0);
  assert.equal(result.state.items.silver_ore, 0);
  assert.equal(result.state.items.ingot +
    result.state.items.iron_ingot + result.state.items.silver_ingot, 703);
  assert.equal(result.state.skills.smelting.level, 100);
  assert.equal(Object.hasOwn(result.state, "protectedItems"), false);
});
test("the Master unlocks new smelting tiers only after forfeiting all old ingots", () => {
  const start = newGame(0);
  start.skills.smelting = { level: 9, xp: xpToNextLevel(9) };
  start.items.copper_ore = 1;
  start.items.iron_ore = 3;
  const s = choose(start, "smelting", 0).state;
  const out = finish(s, 10 * ACTIVITIES.smelting.durationMs);
  assert.equal(out.report.completed, 1);
  assert.equal(out.state.items.iron_ore, 3);
  assert.equal(out.state.skills.smelting.level, 9);
  const home = enter(s, 10 * ACTIVITIES.smelting.durationMs);
  assert.equal(home.state.skills.smelting.level, 9);
  const mastery = learnFromMaster(home.state, home.state.settledAtMs);
  assert.equal(mastery.state.skills.smelting.level, 10);
  assert.equal(mastery.state.skills.smelting.xp, 0);
  assert.equal(mastery.state.items.ingot, 0, "Master takes finished goods, not raw inputs");
  assert.equal(mastery.state.items.iron_ore, 3);
  const later = finish(mastery.state,
    mastery.state.settledAtMs + 10 * ACTIVITIES.smelting.durationMs);
  assert.equal(later.state.items.iron_ore, 0);
  assert.equal(later.state.items.iron_ingot, 3);
});
test("old saves with or without resource locks load safely and legacy locks are discarded", () => {
  const old = newGame(0);
  old.items.iron_ore = 11;
  const loaded = readSave(JSON.stringify(old));
  assert.ok(loaded);
  assert.equal(Object.hasOwn(loaded, "protectedItems"), false);
  assert.equal(loaded.items.iron_ore, 11);
  const forged = { ...old, protectedItems: ["made_up_ore"] };
  assert.equal(readSave(forged), null, "malformed old saves are still rejected");
  const safeguarded = { ...old, protectedItems: ["iron_ore"] };
  const migrated = readSave(safeguarded);
  assert.equal(Object.hasOwn(migrated, "protectedItems"), false);
  assert.equal(migrated.items.iron_ore, 11);
});
test("all old protected categories become ordinary inventory without losing quantities", () => {
  const stored = newGame(12345);
  const examples = ["hide", "stone", "herb", "meal", "stolen_purse", "valuables", "iron_ingot"];
  for (const key of examples) assert.ok(ITEM_KEYS.includes(key), key);
  for (const key of examples) stored.items[key] = 12;
  stored.protectedItems = [...examples, "hide"];
  const loaded = readSave(JSON.stringify(stored));
  assert.ok(loaded);
  assert.equal(Object.hasOwn(loaded, "protectedItems"), false);
  assert.deepEqual(loaded.items, stored.items, "every inventory stack survives migration");
  assert.deepEqual(readSave(JSON.stringify(loaded)), loaded, "new save stays clean");
  for (const bad of ["unknown_resource", 0, null, "__proto__"]) {
    assert.equal(readSave({ ...stored, protectedItems: [bad] }), null,
      "malformed legacy lists must still be rejected");
  }
  assert.equal(readSave({ ...stored, protectedItems: "hide" }), null);
});
test("unused loot remains in inventory while crafting auto-consumes eligible ingredients", () => {
  const state = newGame(0);
  state.items.hide = 7;
  state.items.stone = 5;
  const crafted = finish(choose(state, "masonry", 0).state, 20 * ACTIVITIES.masonry.durationMs);
  assert.equal(crafted.state.items.hide, 7);
  assert.equal(crafted.state.items.stone, 0);
  assert.equal(crafted.state.items.block, 5);
  assert.equal(Object.hasOwn(crafted.state, "protectedItems"), false);
  const hunting = finish(choose(crafted.state, "hunting", crafted.state.settledAtMs).state,
    crafted.state.settledAtMs + 2 * ACTIVITIES.hunting.durationMs);
  assert.ok(hunting.state.items.hide > 7, "gathering still accumulates loot");
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

test("old protected herbs are consumed automatically, without per-cycle replay, after 20 years", () => {
  const start = newGame(0);
  start.items.herb = 9;
  start.protectedItems = ["herb"];
  const saved = readSave(JSON.stringify(start));
  assert.ok(saved);
  assert.equal(Object.hasOwn(saved, "protectedItems"), false);
  const selected = choose(saved, "alchemy", 0).state;
  let rolls = 0;
  const out = settle(selected, 20 * YEAR, () => { rolls++; return 0.5; });
  assert.ok(rolls < 10, "production cannot replay twenty years cycle by cycle");
  assert.equal(out.report.completed, 9);
  assert.deepEqual(out.report.items, { potion: 9 });
  assert.deepEqual(out.report.consumed, { herb: 9 });
  assert.equal(out.state.items.herb, 0);
  assert.equal(out.state.items.potion, 9);
  assert.ok(out.state.skills.alchemy.xp > 0);
  assert.equal(Object.hasOwn(out.state, "protectedItems"), false);
});
test("long offline cooking consumes available fish, but Master takes meals to level", () => {
  const start = newGame(0);
  start.items.fish = 1000;
  const selected = choose(start, "cooking", 0).state;
  const out = finish(selected, 20 * YEAR);
  assert.equal(out.report.completed, 1000);
  assert.equal(out.state.items.fish, 0);
  assert.equal(out.state.items.meal, 1000);
  assert.equal(out.state.skills.cooking.level, 1);
  assert.equal(out.state.skills.cooking.xp, xpToNextLevel(1));
  const returned = enter(selected, 20 * YEAR);
  assert.equal(returned.state.skills.cooking.level, 1);
  const claimed = learnFromMaster(returned.state, returned.state.settledAtMs);
  assert.equal(claimed.state.skills.cooking.level, 2);
  assert.equal(claimed.state.items.meal, 0);
  assert.deepEqual(readSave(JSON.stringify(claimed.state)), claimed.state);
});
test("twenty new personal activities offer ten training and ten leisure skills without loot", () => {
  const training = Object.entries(ACTIVITIES).filter(([,a]) => a.category === "training");
  const leisure = Object.entries(ACTIVITIES).filter(([,a]) => a.category === "leisure");
  assert.equal(training.length, 10);
  assert.equal(leisure.length, 10);
  assert.equal(SKILL_IDS.length, 41);
  assert.equal(new Set(SKILL_IDS).size, 41);
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

test("XP-only skills remain offline-safe and advance with no material tribute", () => {
  const old = newGame(0);
  for (const [id, a] of Object.entries(ACTIVITIES)) {
    if (a.item === null) delete old.skills[id];
  }
  const restored = readSave(JSON.stringify(old));
  assert.ok(restored);
  assert.deepEqual(restored.skills.meditation, {level: 1, xp: 0});
  const away = choose(restored, "ale_with_friends", 0).state;
  const result = finish(away, 20 * YEAR);
  assert.equal(result.state.skills.ale_with_friends.xp, 40);
  assert.equal(result.state.skills.ale_with_friends.level, 1);
  assert.deepEqual(result.report.items, {});
  assert.deepEqual(result.state.items, restored.items);
  const back = enter(away, 20 * YEAR);
  assert.equal(back.state.skills.ale_with_friends.level, 1);
  const offer = skillMasterOffer(back.state);
  assert.deepEqual(offer.ready, ["ale_with_friends"]);
  assert.deepEqual(offer.tribute, {});
  const trained = learnFromMaster(back.state, 20 * YEAR);
  assert.deepEqual(trained.state.skills.ale_with_friends, {level:2,xp:0});
  assert.equal(trained.state.skills.meditation.level, 1);
  assert.deepEqual(readSave(JSON.stringify(trained.state)), trained.state);
});
const switchTo = (state, id, now) => requestActivityChange(state, id, now, midpoint);

test("initial Start requires preparation but no imagined origin travel", () => {
  const initial = newGame(0);
  const requested = switchTo(initial, "mining", 0).state;
  assert.equal(requested.activity, null);
  assert.deepEqual(requested.transition, {
    targetActivity: "mining", phase: "preparing", phaseProgressMs: 0
  });
  const partial = finish(requested, INITIAL_PREPARATION_MS / 2).state;
  assert.equal(partial.activity, null);
  assert.equal(partial.transition.phaseProgressMs, INITIAL_PREPARATION_MS / 2);
  assert.deepEqual(readSave(JSON.stringify(partial)), partial);
  const ready = finish(partial, INITIAL_PREPARATION_MS).state;
  assert.equal(ready.activity, "mining");
  assert.equal(ready.transition, null);
  assert.equal(ready.items.stone, 0);
  const mined = finish(ready, INITIAL_PREPARATION_MS + ACTIVITIES.mining.durationMs).state;
  assert.equal(mined.items.stone, 1);
});

test("changing zones finishes old work then spends five seconds moving and five preparing", () => {
  const mined = choose(newGame(0), "mining", 0).state;
  const when = ACTIVITIES.mining.durationMs / 2;
  const partial = finish(mined, when).state;
  const request = switchTo(partial, "hunting", when).state;
  assert.equal(request.activity, "mining", "target is not active until ready");
  assert.equal(request.progressMs, when);
  assert.equal(request.transition.phase, "finishing");
  const finished = finish(request, ACTIVITIES.mining.durationMs);
  assert.equal(finished.state.items.stone, 1);
  assert.equal(finished.state.skills.mining.xp, 2);
  assert.equal(finished.state.transition.phase, "moving");
  assert.equal(finished.state.progressMs, 0);
  const halfway = finish(finished.state, ACTIVITIES.mining.durationMs + ZONE_TRAVEL_MS / 2).state;
  assert.equal(halfway.transition.phase, "moving");
  assert.equal(halfway.transition.phaseProgressMs, ZONE_TRAVEL_MS / 2);
  const arrivedAt = ACTIVITIES.mining.durationMs + ZONE_TRAVEL_MS;
  const arrived = finish(halfway, arrivedAt).state;
  assert.equal(arrived.transition.phase, "preparing");
  const startedAt = arrivedAt + PREPARATION_MS;
  const ready = finish(arrived, startedAt).state;
  assert.equal(ready.activity, "hunting");
  assert.equal(ready.progressMs, 0);
  assert.equal(ready.transition, null);
  assert.equal(ready.items.hide, 0);
  assert.equal(finish(ready, startedAt + ACTIVITIES.hunting.durationMs).state.items.hide, 1);
  assert.equal(finish(ready, startedAt).report.completed, 0);
});

test("same-zone changes follow the same five-second alpha travel time", () => {
  const initial = choose(newGame(0), "hunting", 0).state;
  const request = switchTo(initial, "gathering", 0).state;
  const finishedAt = ACTIVITIES.hunting.durationMs;
  const moving = finish(request, finishedAt).state;
  assert.equal(moving.transition.phase, "moving");
  const preparing = finish(moving, finishedAt + SAME_ZONE_TRAVEL_MS).state;
  assert.equal(preparing.transition.phase, "preparing");
  const working = finish(preparing, finishedAt + SAME_ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.equal(working.activity, "gathering");
  assert.equal(working.items.hide, 1);
  assert.equal(working.items.herb, 0);
});

test("retarget in transit resets only movement and preparation, never old rewards", () => {
  let state = choose(newGame(0), "mining", 0).state;
  state = switchTo(state, "hunting", 0).state;
  const finishedAt = ACTIVITIES.mining.durationMs;
  state = finish(state, finishedAt + ZONE_TRAVEL_MS / 2).state;
  assert.equal(state.items.stone, 1);
  assert.equal(state.transition.phase, "moving");
  const retarget = switchTo(state, "carpentry", state.settledAtMs).state;
  assert.equal(retarget.transition.phase, "moving");
  assert.equal(retarget.transition.phaseProgressMs, 0);
  const noChange = switchTo(retarget, "carpentry", retarget.settledAtMs).state;
  assert.deepEqual(noChange, retarget, "same-target Start must not reset progress");
  const next = finish(retarget, retarget.settledAtMs + ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.equal(next.activity, "carpentry");
  assert.equal(next.items.stone, 1);
  assert.equal(next.items.hide, 0);
  assert.equal(next.skills.mining.xp, 2);
  const after = finish(next, next.settledAtMs + ACTIVITIES.carpentry.durationMs).state;
  assert.equal(after.items.plank, 0, "no free crafted output");
  assert.equal(after.skills.carpentry.xp, 0);
});

test("retarget while preparing restarts movement from the old zone", () => {
  const start = choose(newGame(0), "mining", 0).state;
  const requested = switchTo(start, "hunting", 0).state;
  const preparingAt = ACTIVITIES.mining.durationMs + ZONE_TRAVEL_MS;
  const preparing = finish(requested, preparingAt + PREPARATION_MS / 2).state;
  assert.equal(preparing.transition.phase, "preparing");
  const redirect = switchTo(preparing, "masonry", preparing.settledAtMs).state;
  assert.equal(redirect.transition.phase, "moving");
  assert.equal(redirect.transition.phaseProgressMs, 0);
  const newTargetAt = redirect.settledAtMs + ZONE_TRAVEL_MS + PREPARATION_MS;
  assert.equal(finish(redirect, newTargetAt).state.activity, "masonry");
  assert.equal(finish(redirect, newTargetAt).state.items.stone, 1);
});

test("offline twenty years spans both activities exactly once without advancing effective levels", () => {
  const start = choose(newGame(0), "mining", 0).state;
  start.skills.hunting = { level: 1, xp: xpToNextLevel(1) - 1 };
  const request = switchTo(start, "hunting", 0).state;
  let rolls = 0;
  const after = settle(request, 20 * YEAR, () => { rolls++; return 0.5; });
  assert.ok(rolls < 30, "do not replay individual offline activities");
  assert.equal(after.state.items.stone, 1);
  assert.ok(after.state.items.hide > 1000);
  assert.equal(after.state.skills.hunting.level, 1);
  assert.equal(after.state.transition, null);
  assert.equal(after.state.activity, "hunting");
  assert.equal(after.reports.length, 2, "report old and new batches separately");
  assert.equal(settle(after.state, 20 * YEAR, midpoint).report.completed, 0);
  assert.deepEqual(readSave(JSON.stringify(after.state)), after.state);
  const returned = enter(request, 20 * YEAR);
  assert.equal(returned.state.skills.hunting.level, 1);
  assert.equal(returned.state.skills.hunting.xp, 40);
});

test("malformed transition saves are rejected and old saves retain current work", () => {
  const initial = choose(newGame(0), "mining", 0).state;
  const legacy = { ...initial };
  delete legacy.transition;
  const recovered = readSave(legacy);
  assert.ok(recovered);
  assert.equal(recovered.activity, "mining");
  assert.equal(recovered.transition, null);
  for (const invalid of [
    { targetActivity: "__missing__", phase: "moving", phaseProgressMs: 0 },
    { targetActivity: "hunting", phase: "moving", phaseProgressMs: ZONE_TRAVEL_MS },
    { targetActivity: "hunting", phase: "preparing", phaseProgressMs: PREPARATION_MS },
    { targetActivity: "hunting", phase: "bogus", phaseProgressMs: 0 },
    { targetActivity: "hunting", phase: "moving", phaseProgressMs: -1 }
  ]) assert.equal(readSave({ ...initial, transition: invalid }), null);
});


test("V2 unfinished cycles migrate to alpha without resetting name, XP or inventory", () => {
  const old = newGame(1_000);
  old.version = 2;
  delete old.timingProfile;
  old.name = "Old Wanderer";
  old.activity = "mining";
  old.progressMs = 450_000; // halfway through the original fifteen-minute work cycle
  old.items.stone = 77;
  old.items.herb = 9;
  old.skills.mining = { level: 1, xp: 18 };
  const converted = readSave(JSON.stringify(old));
  assert.ok(converted);
  assert.equal(converted.version, GAME_VERSION);
  assert.equal(converted.timingProfile, "alpha");
  assert.equal(converted.progressMs, 5_000);
  assert.equal(converted.settledAtMs, 1_000);
  assert.equal(converted.name, "Old Wanderer");
  assert.equal(converted.items.stone, 77);
  assert.equal(converted.items.herb, 9);
  assert.deepEqual(converted.skills.mining, { level: 1, xp: 18 });
  assert.deepEqual(readSave(JSON.stringify(converted)), converted);
  const finished = finish(converted, 6_000);
  assert.equal(finished.state.items.stone, 78);
  assert.equal(finished.state.skills.mining.xp, 20);
});

test("V2 saved travel and preparation migrate proportionally without prematurely completing the switch", () => {
  const original = newGame(0);
  original.version = 2;
  delete original.timingProfile;
  original.activity = "mining";
  original.items.stone = 12;
  const moving = {
    ...original,
    transition: { targetActivity: "hunting", phase: "moving", phaseProgressMs: 150_000 }
  };
  const loadedMove = readSave(moving);
  assert.ok(loadedMove);
  assert.equal(loadedMove.transition.phaseProgressMs, 2_500);
  assert.equal(finish(loadedMove, 2_500).state.transition.phase, "preparing");
  assert.equal(finish(loadedMove, 2_500).state.items.stone, 12);
  const preparing = {
    ...original,
    transition: { targetActivity: "hunting", phase: "preparing", phaseProgressMs: 60_000 }
  };
  const loadedPrep = readSave(preparing);
  assert.equal(loadedPrep.transition.phaseProgressMs, 2_500);
  assert.equal(finish(loadedPrep, 2_500).state.activity, "hunting");

  const initial = { ...original, activity: null,
    transition: { targetActivity: "mining", phase: "preparing", phaseProgressMs: 60_000 } };
  assert.equal(readSave(initial).transition.phaseProgressMs, 5_000);
  assert.equal(finish(readSave(initial), 5_000).state.activity, "mining");
});

test("unmodified character save keeps its alpha profile and rejects invalid profile data", () => {
  const start = newGame(0);
  assert.deepEqual(readSave(JSON.stringify(start)), start);
  assert.equal(readSave({ ...start, timingProfile: "invalid" }), null);
  assert.equal(readSave({ ...start, timingProfile: undefined }), null);
});

const queueStart = (state, id, duration, now = state.settledAtMs) =>
  queueStartActivity(state, id, duration, now, midpoint);
const queueDuration = (state, index, duration, now = state.settledAtMs) =>
  queueSetDuration(state, index, duration, now, midpoint);
const queueReorder = (state, index, now = state.settledAtMs) =>
  queueSwap(state, index, now, midpoint);

const queueTimed = (state, id, duration, now = state.settledAtMs) =>
  queueInsertTimedActivity(state, id, duration, now, midpoint);

test("new selected task owns four-hour duration; original work remains Forever fallback", () => {
  let state = queueStart(newGame(0), "mining", null).state;
  state = finish(state, INITIAL_PREPARATION_MS + 4_000).state;
  const priorXP = state.skills.mining.xp;
  const previousItems = { ...state.items };
  const planned = queueTimed(state, "hunting", 4 * HOUR_MS).state;
  assert.deepEqual(planned.wagons, [
    { activity: "hunting", plannedMs: 4 * HOUR_MS },
    { activity: "mining", plannedMs: null }
  ], "four hours must belong to the activity selected, not mining");
  assert.equal(planned.activity, "mining");
  assert.equal(planned.progressMs, 4_000);
  assert.equal(planned.transition.phase, "finishing");
  assert.equal(planned.skills.mining.xp, priorXP);
  assert.deepEqual(planned.items, previousItems);
  const readyAt = planned.settledAtMs + 6_000 + ZONE_TRAVEL_MS + PREPARATION_MS;
  const working = finish(planned, readyAt).state;
  assert.equal(working.activity, "hunting");
  assert.equal(working.productiveElapsedMs, 0);
  assert.equal(working.items.stone, previousItems.stone + 1);
  const halfway = finish(working, readyAt + 2 * HOUR_MS).state;
  assert.equal(halfway.activity, "hunting");
  assert.equal(halfway.productiveElapsedMs, 2 * HOUR_MS);
  assert.equal(halfway.wagons[0].plannedMs, 4 * HOUR_MS);
  assert.equal(halfway.skills.mining.xp, priorXP + ACTIVITIES.mining.xp);
  const ended = finish(halfway, readyAt + 4 * HOUR_MS).state;
  assert.deepEqual(ended.wagons, [{ activity: "mining", plannedMs: null }]);
  const returned = finish(ended, readyAt + 4 * HOUR_MS +
    ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.equal(returned.activity, "mining");
  assert.equal(returned.transition, null);
  assert.deepEqual(readSave(JSON.stringify(returned)), returned);
});

test("selected second task is finite, while existing current duration and Forever are preserved", () => {
  let state = queueStart(newGame(0), "mining", null).state;
  state = queueStart(state, "masonry", 2 * HOUR_MS).state;
  state = finish(state, INITIAL_PREPARATION_MS + 5_000).state;
  const prior = { ...state, wagons: state.wagons.map(w => ({ ...w })) };
  const next = queueTimed(state, "hunting", 4 * HOUR_MS).state;
  assert.deepEqual(next.wagons, [
    { activity: "mining", plannedMs: 2 * HOUR_MS },
    { activity: "hunting", plannedMs: 4 * HOUR_MS },
    { activity: "masonry", plannedMs: null }
  ]);
  assert.equal(next.transition, null);
  assert.equal(next.progressMs, prior.progressMs);
  assert.equal(next.productiveElapsedMs, prior.productiveElapsedMs);
  assert.equal(next.skills.mining.xp, prior.skills.mining.xp);
  assert.throws(() => queueTimed(next, "cooking", HOUR_MS), RangeError);
  assert.throws(() => queueTimed(next, "hunting", HOUR_MS), RangeError);
  assert.throws(() => queueTimed(newGame(0), "hunting", HOUR_MS), RangeError);
  assert.equal(settle(next, next.settledAtMs, midpoint).report.completed, 0);
});

test("Start now explicitly replaces only unfinished plans, preserving completed rewards", () => {
  let state = queueStart(newGame(0), "mining", null).state;
  state = queueTimed(state, "hunting", MINUTE_MS).state;
  state = finish(state, INITIAL_PREPARATION_MS + 30_000).state;
  const earnedXP = state.skills.hunting.xp;
  const earnedItems = { ...state.items };
  const result = requestActivityChange(state, "masonry", state.settledAtMs, midpoint);
  assert.deepEqual(result.state.wagons, [{ activity: "masonry", plannedMs: null }]);
  assert.equal(result.state.transition.targetActivity, "masonry");
  assert.equal(result.state.skills.hunting.xp, earnedXP);
  assert.deepEqual(result.state.items, earnedItems);
  assert.equal(settle(result.state, result.state.settledAtMs, midpoint).report.completed, 0);
});

test("three wagon invariants: one Forever last, explicit previous slot duration, no fourth", () => {
  assert.equal(MAX_WAGONS, 3);
  for (let i = 1; i <= 8; i++) {
    assert.equal(validPlannedDuration(i * MINUTE_MS), true);
    assert.equal(validPlannedDuration(i * HOUR_MS), true);
    assert.equal(validPlannedDuration(i * DAY_MS), true);
  }
  for (const n of [0, 500, 9 * MINUTE_MS, 9 * HOUR_MS, 9 * DAY_MS, 10_000]) {
    assert.equal(validPlannedDuration(n), false);
  }
  const first = queueStart(newGame(0), "mining", null).state;
  assert.deepEqual(first.wagons, [{ activity: "mining", plannedMs: null }]);
  assert.equal(first.transition.phase, "preparing");
  assert.equal(first.activity, null);
  assert.throws(() => queueStart(first, "hunting", null), RangeError);
  const second = queueStart(first, "hunting", HOUR_MS).state;
  assert.deepEqual(second.wagons, [
    { activity: "mining", plannedMs: HOUR_MS },
    { activity: "hunting", plannedMs: null }
  ]);
  const third = queueStart(second, "masonry", DAY_MS).state;
  assert.deepEqual(third.wagons, [
    { activity: "mining", plannedMs: HOUR_MS },
    { activity: "hunting", plannedMs: DAY_MS },
    { activity: "masonry", plannedMs: null }
  ]);
  assert.throws(() => queueStart(third, "gathering", HOUR_MS), RangeError);
  assert.throws(() => queueStart(third, "mining", HOUR_MS), RangeError);
  assert.throws(() => queueDuration(third, 2, HOUR_MS), RangeError);
  assert.deepEqual(readSave(JSON.stringify(third)), third);
});

test("alpha minute slots complete in real productive minutes without losing old saves", () => {
  let first = queueStart(newGame(0), "mining", null).state;
  first = queueStart(first, "hunting", MINUTE_MS).state;
  assert.deepEqual(readSave(JSON.stringify(first)), first);
  const ready = finish(first, INITIAL_PREPARATION_MS).state;
  const halfway = finish(ready, INITIAL_PREPARATION_MS + 30_000).state;
  assert.equal(halfway.productiveElapsedMs, 30_000);
  assert.equal(halfway.activity, "mining");
  assert.equal(halfway.items.stone, 3);
  const end = finish(halfway, INITIAL_PREPARATION_MS + MINUTE_MS).state;
  assert.equal(end.items.stone, 6);
  assert.equal(end.transition.phase, "moving");
  assert.deepEqual(end.wagons, [{ activity: "hunting", plannedMs: null }]);
  const arrived = finish(end, end.settledAtMs + ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.equal(arrived.activity, "hunting");
  assert.equal(arrived.items.hide, 0);
  assert.deepEqual(readSave(arrived), arrived);
  assert.equal(finish(arrived, arrived.settledAtMs).report.completed, 0);
});

test("one and two wagon queue correctly settle a 20-year absence without daily checks", () => {
  const initial = queueStart(newGame(0), "mining", null).state;
  const queued = queueStart(initial, "hunting", HOUR_MS).state;
  let rolls = 0;
  const result = settle(queued, YEAR * 20, () => { rolls++; return 0.5; });
  assert.ok(rolls < 25, "no per-cycle or per-day loop");
  assert.deepEqual(result.state.wagons, [{ activity: "hunting", plannedMs: null }]);
  assert.equal(result.state.transition, null);
  assert.equal(result.state.productiveElapsedMs, 0);
  assert.equal(result.state.items.stone, HOUR_MS / ACTIVITIES.mining.durationMs);
  assert.ok(result.state.items.hide > 100_000);
  assert.equal(result.state.skills.hunting.level, 1);
  assert.equal(result.state.skills.mining.level, 1);
  assert.equal(result.reports.length, 2);
  assert.equal(settle(result.state, YEAR * 20, midpoint).report.completed, 0);
  assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
  const returned = enter(queued, YEAR * 20);
  assert.equal(returned.state.skills.hunting.level, 1);
  assert.equal(returned.state.skills.hunting.xp, 40);
});

test("three wagons consume prior gathering in chronological order and then work forever", () => {
  let state = queueStart(newGame(0), "mining", null).state;
  state = queueStart(state, "masonry", HOUR_MS).state;
  state = queueStart(state, "hunting", HOUR_MS).state;
  const result = finish(state, 20 * YEAR);
  assert.equal(result.state.items.stone, 0, "masonry uses previously mined stone");
  assert.equal(result.state.items.block, HOUR_MS / ACTIVITIES.masonry.durationMs);
  assert.ok(result.state.items.hide > 1_000);
  assert.equal(result.state.skills.mining.xp, xpToNextLevel(1));
  assert.equal(result.state.skills.masonry.xp, xpToNextLevel(1));
  assert.deepEqual(result.state.wagons, [{ activity: "hunting", plannedMs: null }]);
  assert.equal(result.reports.length, 3);
  assert.deepEqual(result.reports.map(r => r.activity), ["mining", "masonry", "hunting"]);
});

test("queue works with a partially finished last cycle, with no extra reward at a boundary", () => {
  let state = queueStart(newGame(0), "mining", null).state;
  state = queueStart(state, "hunting", HOUR_MS).state;
  const exact = finish(state, INITIAL_PREPARATION_MS + HOUR_MS).state;
  assert.equal(exact.items.stone, HOUR_MS / 10_000);
  assert.equal(exact.transition.phase, "moving");
  assert.equal(exact.progressMs, 0);
  const ready = finish(exact, exact.settledAtMs + ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.equal(ready.items.stone, HOUR_MS / 10_000, "no phantom extra finishing cycle");
  assert.equal(ready.activity, "hunting");
  assert.equal(ready.items.hide, 0);

  // An explicit running-duration edit starts its new window now, not back
  // at the first productive instant. The last cycle still finishes once.
  const started = queueStart(newGame(0), "mining", null).state;
  let second = queueStart(started, "hunting", HOUR_MS).state;
  second = finish(second, INITIAL_PREPARATION_MS + 3_000).state;
  const edited = queueDuration(second, 0, HOUR_MS, second.settledAtMs).state;
  assert.equal(edited.productiveElapsedMs, 0);
  assert.equal(edited.progressMs, 3_000);
  const expiry = finish(edited, edited.settledAtMs + HOUR_MS).state;
  assert.equal(expiry.transition.phase, "finishing");
  assert.equal(expiry.items.stone, HOUR_MS / 10_000);
  const boundary = finish(expiry, expiry.settledAtMs + 7_000).state;
  assert.equal(boundary.items.stone, HOUR_MS / 10_000 + 1);
  assert.equal(boundary.transition.phase, "moving");
});

test("future swap is free, current swap restarts travel without losing old cycle rewards", () => {
  let state = queueStart(newGame(0), "mining", null).state;
  state = queueStart(state, "hunting", HOUR_MS).state;
  state = queueStart(state, "masonry", HOUR_MS).state;
  const ready = finish(state, INITIAL_PREPARATION_MS + 4_000).state;
  const futureSwap = queueReorder(ready, 1).state;
  assert.equal(futureSwap.activity, "mining");
  assert.equal(futureSwap.transition, null);
  assert.equal(futureSwap.progressMs, 4_000);
  assert.deepEqual(futureSwap.wagons.map(w => w.activity), ["mining", "masonry", "hunting"]);
  const activeSwap = queueReorder(futureSwap, 0).state;
  assert.equal(activeSwap.wagons[0].activity, "masonry");
  assert.equal(activeSwap.transition.phase, "finishing");
  assert.equal(activeSwap.progressMs, 4_000);
  const finishing = finish(activeSwap, activeSwap.settledAtMs + 6_000).state;
  assert.equal(finishing.items.stone, 1);
  assert.equal(finishing.transition.phase, "moving");
  const halfway = finish(finishing, finishing.settledAtMs + ZONE_TRAVEL_MS / 2).state;
  const redirect = queueReorder(halfway, 0).state;
  assert.equal(redirect.transition.phase, "moving");
  assert.equal(redirect.transition.phaseProgressMs, 0);
  assert.equal(redirect.items.stone, 1);
  assert.equal(redirect.skills.mining.xp, ACTIVITIES.mining.xp);
  assert.deepEqual(redirect.wagons.map(w => w.activity), ["mining", "masonry", "hunting"]);
  assert.equal(settle(redirect, redirect.settledAtMs, midpoint).report.completed, 0);
});

test("future wagon can be removed without losing current progress; final becomes Forever", () => {
  let state = queueStart(newGame(0), "mining", null).state;
  state = queueStart(state, "hunting", HOUR_MS).state;
  state = queueStart(state, "masonry", HOUR_MS).state;
  state = finish(state, INITIAL_PREPARATION_MS + 5_000).state;
  const prior = state.items.stone;
  const reduced = queueRemoveLast(state, state.settledAtMs, midpoint).state;
  assert.equal(reduced.items.stone, prior);
  assert.equal(reduced.progressMs, 5_000);
  assert.deepEqual(reduced.wagons, [
    { activity: "mining", plannedMs: HOUR_MS },
    { activity: "hunting", plannedMs: null }
  ]);
  const solo = queueRemoveLast(reduced, reduced.settledAtMs, midpoint).state;
  assert.deepEqual(solo.wagons, [{ activity: "mining", plannedMs: null }]);
  assert.equal(solo.progressMs, 5_000);
  assert.throws(() => queueRemoveLast(solo, solo.settledAtMs, midpoint), RangeError);
});

test("old V3 saves without wagons become one Forever wagon, including a pending target", () => {
  const current = choose(newGame(0), "mining", 0).state;
  delete current.wagons;
  delete current.productiveElapsedMs;
  assert.deepEqual(readSave(current).wagons, [{ activity: "mining", plannedMs: null }]);
  const pending = switchTo(current, "hunting", 0).state;
  delete pending.wagons;
  delete pending.productiveElapsedMs;
  assert.deepEqual(readSave(pending).wagons, [{ activity: "hunting", plannedMs: null }]);
  for (const wrong of [
    { wagons: [{activity:"hunting",plannedMs:null}],productiveElapsedMs:0 },
    { wagons: [{activity:"mining",plannedMs:HOUR_MS}],productiveElapsedMs:0 },
    { wagons: [{activity:"mining",plannedMs:null},{activity:"hunting",plannedMs:null}],productiveElapsedMs:0 },
    { wagons: [{activity:"mining",plannedMs:HOUR_MS},{activity:"hunting",plannedMs:null}],productiveElapsedMs:HOUR_MS+1 }
  ]) assert.equal(readSave({...current,...wrong}),null);
});

test("Skill Master and queue share centrally configured material thresholds", () => {
  assert.equal(UNTIL_LEVEL_UP, "untilLevelUp");
  assert.equal(validQueuePlan(UNTIL_LEVEL_UP), true);
  assert.equal(validQueuePlan(MINUTE_MS), true);
  assert.equal(validQueuePlan("other"), false);
  assert.equal(MASTER_RESOURCE_MINIMUM.mining, 1);
  assert.equal(MASTER_RESOURCE_MINIMUM.smelting, 1);
  assert.equal(MASTER_RESOURCE_MINIMUM.meditation, 0);
  const s = newGame(0);
  s.skills.mining.xp = xpToNextLevel(1);
  let ready = skillMasterReadiness(s, "mining");
  assert.equal(ready.xpReady, true);
  assert.equal(ready.resourcesReady, false);
  assert.equal(ready.requiredItems, 1);
  assert.equal(ready.ready, false);
  assert.deepEqual(skillMasterOffer(s).blocked, ["mining"]);
  s.items.stone = 1;
  ready = skillMasterReadiness(s, "mining");
  assert.equal(ready.ready, true);
  assert.deepEqual(skillMasterOffer(s).ready, ["mining"]);
  s.items.stone = 0;
  s.items.copper_ore = 1;
  assert.equal(skillMasterReadiness(s, "mining").ready, true,
    "higher-tier spoils from the same skill also count toward its Master eligibility");
  s.skills.meditation.xp = xpToNextLevel(1);
  assert.equal(skillMasterReadiness(s, "meditation").ready, true,
    "XP-only skills have no material requirement");
});

test("Until LvL Up scheduled XP-only activity stops at mastery readiness without auto-leveling", () => {
  let state = queueStart(newGame(0), "hunting", null).state;
  state = queueTimed(state, "meditation", UNTIL_LEVEL_UP).state;
  assert.deepEqual(state.wagons, [
    {activity:"meditation", plannedMs:UNTIL_LEVEL_UP},
    {activity:"hunting", plannedMs:null}
  ]);
  assert.deepEqual(readSave(JSON.stringify(state)), state);
  let calls = 0;
  const result = settle(state, 20 * YEAR, () => { calls++; return 0.5; });
  assert.ok(calls < 30, "even decades of offline work do not run per-cycle loops");
  assert.deepEqual(result.state.wagons, [{activity:"hunting", plannedMs:null}]);
  assert.equal(result.state.transition, null);
  assert.equal(result.state.activity, "hunting");
  assert.equal(result.state.skills.meditation.level, 1);
  assert.equal(result.state.skills.meditation.xp, xpToNextLevel(1));
  assert.equal(skillMasterReadiness(result.state, "meditation").ready, true);
  assert.ok(result.state.items.hide > 0, "Forever job continues after readiness");
  assert.equal(settle(result.state, 20 * YEAR, midpoint).report.completed, 0,
    "repeated settlement never grants duplicate rewards");
  assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
});

test("Until LvL Up requires actual owned resources, not only a full XP bar", () => {
  let state = queueStart(newGame(0), "hunting", null).state;
  state.skills.mining.xp = xpToNextLevel(1);
  state = queueTimed(state, "mining", UNTIL_LEVEL_UP).state;
  // The initial character has never worked: switching its pending Start goes
  // straight to preparation, with no invented hunting cycle or travel.
  const arrivedAt = INITIAL_PREPARATION_MS;
  const arriving = finish(state, arrivedAt).state;
  assert.equal(arriving.activity, "mining");
  assert.equal(arriving.skills.mining.xp, xpToNextLevel(1));
  assert.equal(skillMasterReadiness(arriving, "mining").ready, false,
    "full XP but no material does not switch activities");
  const oneCycle = finish(arriving, arrivedAt + ACTIVITIES.mining.durationMs).state;
  if (oneCycle.wagons[0].activity === "mining") {
    assert.equal(skillMasterReadiness(oneCycle, "mining").ready, false);
  }
  const enoughCycles = finish(oneCycle, arrivedAt + 2 * ACTIVITIES.mining.durationMs).state;
  assert.deepEqual(enoughCycles.wagons, [{activity:"hunting", plannedMs:null}]);
  assert.equal(enoughCycles.skills.mining.level, 1, "the queue does not visit the Master");
  assert.equal(skillMasterReadiness(enoughCycles, "mining").ready, true);
  assert.ok(enoughCycles.items.stone + enoughCycles.items.copper_ore > 0);
});

test("blocked crafting with XP full cannot escape mastery schedule until actual inputs arrive", () => {
  let state = queueStart(newGame(0), "hunting", null).state;
  state.skills.alchemy.xp = xpToNextLevel(1);
  state = queueTimed(state, "alchemy", UNTIL_LEVEL_UP).state;
  const blocked = finish(state, 20 * YEAR).state;
  assert.equal(blocked.activity, "alchemy");
  assert.deepEqual(blocked.wagons, [
    {activity:"alchemy", plannedMs:UNTIL_LEVEL_UP},
    {activity:"hunting", plannedMs:null}
  ]);
  assert.equal(blocked.items.potion, 0);
  assert.equal(blocked.skills.alchemy.level, 1);
  assert.equal(skillMasterReadiness(blocked, "alchemy").ready, false);
  const supplied = {...blocked, items:{...blocked.items, herb:2}};
  const progressed = finish(supplied, blocked.settledAtMs + 2 * ACTIVITIES.alchemy.durationMs).state;
  assert.deepEqual(progressed.wagons, [{activity:"hunting",plannedMs:null}]);
  assert.ok(progressed.items.potion > 0);
  assert.equal(progressed.skills.alchemy.level, 1);
  assert.equal(skillMasterReadiness(progressed, "alchemy").ready, true);
  assert.equal(finish(progressed, progressed.settledAtMs).report.completed, 0);
});

test("editing and reordering Until LvL Up schedule preserve other jobs and saved progress", () => {
  let state = queueStart(newGame(0), "mining", null).state;
  state = queueTimed(state, "hunting", MINUTE_MS).state;
  state = queueTimed(state, "meditation", UNTIL_LEVEL_UP).state;
  assert.deepEqual(state.wagons.map(w=>w.plannedMs), [MINUTE_MS, UNTIL_LEVEL_UP, null]);
  assert.deepEqual(readSave(JSON.stringify(state)), state);
  const futureSwap = queueReorder(state, 1).state;
  assert.deepEqual(futureSwap.wagons.map(w=>w.plannedMs), [MINUTE_MS, UNTIL_LEVEL_UP, null],
    "swap exchanges activity names, not slot stop conditions");
  assert.deepEqual(futureSwap.wagons.map(w=>w.activity), ["hunting","mining","meditation"]);
  const edited = queueDuration(futureSwap, 0, UNTIL_LEVEL_UP).state;
  assert.equal(edited.wagons[0].plannedMs, UNTIL_LEVEL_UP);
  assert.equal(edited.productiveElapsedMs, 0);
  assert.deepEqual(readSave(JSON.stringify(edited)), edited);
  assert.equal(readSave({...edited, wagons: [
    {activity:"hunting",plannedMs:"bogus"},
    {activity:"mining",plannedMs:UNTIL_LEVEL_UP},
    {activity:"meditation",plannedMs:null}]}), null);
  assert.equal(readSave({...edited, wagons: [
    {activity:"hunting",plannedMs:UNTIL_LEVEL_UP},
    {activity:"mining",plannedMs:UNTIL_LEVEL_UP},
    {activity:"meditation",plannedMs:UNTIL_LEVEL_UP}]}), null,
    "last wagon must remain Forever");
});

test("every one of the forty activities splits the same hourly stat budget", () => {
  assert.equal(ATTRIBUTE_IDS.length, 5);
  assert.deepEqual(ATTRIBUTE_IDS, ["STR", "DEX", "END", "INT", "WIL"]);
  assert.equal(ATTRIBUTE_BALANCE.xpPerProductiveHour, 100);
  assert.deepEqual(Object.keys(ACTIVITY_STAT_WEIGHTS).sort(), [...SKILL_IDS].sort());
  for (const id of SKILL_IDS) {
    const weights = ACTIVITY_STAT_WEIGHTS[id];
    assert.equal(Object.values(weights).reduce((sum, x) => sum + x, 0), 100, id);
    assert.ok(Object.keys(weights).every(stat => ATTRIBUTE_IDS.includes(stat)), id);
  }
});

test("stat growth is based on productive time, even mid-cycle, never actions completed", () => {
  const start = choose(newGame(0), "mining", 0).state;
  const first = finish(start, HOUR_MS - 1);
  const second = finish(first.state, HOUR_MS);
  const continuous = finish(start, HOUR_MS);
  assert.deepEqual(second.state.attributeEffort, continuous.state.attributeEffort,
    "settling in small pieces must not lose fractional XP");
  assert.equal(continuous.state.attributeEffort.STR, HOUR_MS * 70);
  assert.equal(continuous.state.attributeEffort.END, HOUR_MS * 30);
  assert.equal(continuous.state.attributeEffort.INT, 0);
  assert.equal(attributeXP(continuous.state.attributeEffort.STR), 70);
  assert.equal(attributeXP(continuous.state.attributeEffort.END), 30);
  assert.equal(Object.values(continuous.state.attributeEffort)
    .reduce((sum, amount) => sum + attributeXP(amount), 0), 100);
  assert.deepEqual(start.attributeEffort, newGame(0).attributeEffort,
    "settling may not mutate the original state");
});

test("changing activities changes stat distribution but not total XP per hour", () => {
  const mining = finish(choose(newGame(0), "mining", 0).state, HOUR_MS).state;
  const study = finish(choose(newGame(0), "ancient_texts", 0).state, HOUR_MS).state;
  assert.equal(attributeXP(mining.attributeEffort.STR), 70);
  assert.equal(attributeXP(study.attributeEffort.INT), 80);
  for (const state of [mining, study]) {
    assert.equal(Object.values(state.attributeEffort)
      .reduce((sum, amount) => sum + attributeXP(amount), 0), 100);
  }
  assert.equal(Object.hasOwn(mining, "level"), false, "no global character level");
});

test("travel and preparation never grant attribute XP", () => {
  const start = newGame(0);
  const preparing = requestActivityChange(start, "mining", 0, midpoint).state;
  const mid = finish(preparing, INITIAL_PREPARATION_MS / 2).state;
  assert.deepEqual(mid.attributeEffort, start.attributeEffort);
  const ready = finish(mid, INITIAL_PREPARATION_MS).state;
  assert.deepEqual(ready.attributeEffort, start.attributeEffort);
  const mined = finish(ready, INITIAL_PREPARATION_MS + ACTIVITIES.mining.durationMs).state;
  assert.ok(mined.attributeEffort.STR > 0);
  const switching = requestActivityChange(mined, "meditation", mined.settledAtMs, midpoint).state;
  const oldDoneAt = mined.settledAtMs + ACTIVITIES.mining.durationMs;
  const finished = finish(switching, oldDoneAt).state;
  const afterTransition = finish(finished, oldDoneAt + ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.deepEqual(afterTransition.attributeEffort, finished.attributeEffort,
    "travel and preparation are not productive work");
});

test("uncapped attribute progress continues after skill XP caps over twenty years offline", () => {
  const start = choose(newGame(0), "meditation", 0).state;
  const firstYear = finish(start, YEAR);
  const twentyYears = finish(start, 20 * YEAR);
  assert.equal(twentyYears.state.skills.meditation.level, 1);
  assert.equal(twentyYears.state.skills.meditation.xp, xpToNextLevel(1),
    "the Skill Master rule still caps skill XP");
  assert.ok(attributeProgress(twentyYears.state.attributeEffort.WIL).value >
    attributeProgress(firstYear.state.attributeEffort.WIL).value);
  assert.ok(attributeProgress(twentyYears.state.attributeEffort.WIL).value > 10);
  assert.equal(Object.values(twentyYears.state.attributeEffort).reduce(
    (sum, effort) => sum + attributeXP(effort), 0),
    20 * 365 * 24 * ATTRIBUTE_BALANCE.xpPerProductiveHour);
  assert.deepEqual(readSave(JSON.stringify(twentyYears.state)), twentyYears.state);
});

test("V4 saves migrate without losing skills, resources or schedules; V5 validates stats", () => {
  const legacy = newGame(123);
  legacy.version = 4;
  delete legacy.attributeEffort;
  legacy.skills.mining = { level: 18, xp: 21 };
  legacy.items.stone = 37;
  const migrated = readSave(JSON.stringify(legacy));
  assert.ok(migrated);
  assert.equal(migrated.version, GAME_VERSION);
  assert.deepEqual(migrated.skills.mining, legacy.skills.mining);
  assert.equal(migrated.items.stone, 37);
  assert.deepEqual(migrated.attributeEffort,
    Object.fromEntries(ATTRIBUTE_IDS.map(id => [id, 0])));
  const progressed = finish(choose(migrated, "mining", 123).state, 123 + HOUR_MS).state;
  assert.ok(allAttributeProgress(progressed.attributeEffort).STR.value > 10);
  assert.deepEqual(readSave(JSON.stringify(progressed)), progressed);
  for (const corrupt of [
    null, {}, { ...progressed.attributeEffort, STR: -1 },
    { ...progressed.attributeEffort, WIL: 1.25 },
    { ...progressed.attributeEffort, UNKNOWN: 0 }
  ]) assert.equal(readSave({ ...progressed, attributeEffort: corrupt }), null);
});

test("Fighting is a distinct first activity and does not manufacture simulated combat", () => {
  assert.equal(SKILL_IDS[0], "fighting");
  assert.equal(ACTIVITIES.fighting.category, "combat");
  assert.equal(ACTIVITIES.fighting.item, null);
  assert.equal(ACTIVITIES.fighting.zone, "Fighting grounds");
  assert.notEqual(ACTIVITIES.fighting, ACTIVITIES.hunting);
  assert.equal(Object.values(ACTIVITY_STAT_WEIGHTS.fighting).reduce((a, b) => a + b, 0), 100);
  const first = choose(newGame(0), "fighting", 0).state;
  const result = finish(first, 10 * ACTIVITIES.fighting.durationMs);
  assert.equal(result.report.completed, 10);
  assert.equal(result.report.gainedItems, 0);
  assert.deepEqual(result.report.items, {});
  assert.equal(result.state.skills.fighting.level, 1);
  assert.ok(result.state.skills.fighting.xp > 0);
  assert.ok(result.state.attributeEffort.STR > 0);
  assert.ok(result.state.attributeEffort.DEX > 0);
  assert.deepEqual(result.state.items, first.items);
  const oldV5 = { ...newGame(0), skills: { ...newGame(0).skills } };
  delete oldV5.skills.fighting;
  assert.deepEqual(readSave(oldV5).skills.fighting, { level: 1, xp: 0 },
    "existing V5 saves safely acquire the new Fighting skill");
});
