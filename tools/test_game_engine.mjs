import {purchaseThrough} from "./gear-test-fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITIES, ITEM_KEYS, ITEM_LABELS, LOOT_TABLES, lootChances, PRODUCTION_RECIPES, PRODUCTION_INPUTS, recipeOptions, SKILL_IDS, GAME_VERSION, SAVE_KEY, BASE_CYCLE_MS,
  ATTRIBUTES, ATTRIBUTE_IDS, ATTRIBUTE_BALANCE, ACTIVITY_STAT_WEIGHTS, attributeXP, attributeProgress, allAttributeProgress,
   MASTERY_ATTRIBUTE_BALANCE, masteryBonusesForSkill, masteryAwardForNextLevel,
   totalMasteryAttributeBonuses, effectiveAttributeProgress,
  ZONE_TRAVEL_MS, SAME_ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS, TIMING_PROFILE, MAX_WAGONS, SKILL_BALANCE, SCHEDULE_BALANCE, MINUTE_MS, HOUR_MS, DAY_MS, UNTIL_LEVEL_UP, MASTER_RESOURCE_MINIMUM, skillMasterReadiness, validQueuePlan, validPlannedDuration, queueStartActivity, queueInsertTimedActivity, queueSetDuration, queueSwap, queueRemoveLast, activityDuration, newGame, readSave, settle, chooseActivity, requestActivityChange,
  enterGame, testOfflineDay, xpForLevel, levelFromXP, xpToNextLevel, skillSpoils, skillMasterOffer, learnFromMaster, setArmourChoice, buyEquipment
} from "../site/play/engine.mjs";
import { ARMOUR_SLOTS, ARMOUR_TIERS, armourStats } from "../site/play/armour.mjs";
import { xpForAttributeValue } from "../site/play/attributes.mjs";
import { ALPHA_CLOCK_KEY, ALPHA_SPEED, ALPHA_DAY_MS, alphaTime, parseAlphaClock,
  setAlphaSpeed, advanceAlphaClock, alphaMaxStats, alphaGrantCoins, ALPHA_TOOLS_ENABLED } from "../site/play/alpha-tools.mjs";

const midpoint = () => 0.5;
const stockTotal = (state, skill) => skillSpoils(skill).reduce((sum, id) => sum + state.items[id], 0);
const YEAR = 365 * 24 * 60 * 60 * 1000;
const choose = (s, a, now) => chooseActivity(s, a, now, midpoint);
const finish = (s, now) => settle(s, now, midpoint);
const enter = (s, now) => enterGame(s, now, midpoint);

test("alpha test clock simulates 24h and switches 1x/10x without rewinding time",()=>{
  assert.equal(ALPHA_CLOCK_KEY,"idle-game-alpha-clock-v1");
  assert.equal(ALPHA_DAY_MS,86_400_000);
  assert.equal(ALPHA_SPEED,10);
  const t=2_000_000_000_000;
  assert.equal(alphaTime(null,t),t,"normal mode uses real clock");
  const accelerated=setAlphaSpeed(null,t,ALPHA_SPEED);
  assert.deepEqual(parseAlphaClock(JSON.stringify(accelerated)),accelerated,
    "persistent alpha clock reloads without losing the virtual timestamp");
  assert.equal(alphaTime(accelerated,t+1000),t+10_000);
  const normal=setAlphaSpeed(accelerated,t+1000,1);
  assert.equal(alphaTime(normal,t+1000),t+10_000,
    "turning 10x off never rewinds the saved game timestamp");
  assert.equal(alphaTime(normal,t+2000),t+11_000,
    "normal speed accrues only one second per second after toggle off");
  const advanced=advanceAlphaClock(normal,t+2000,ALPHA_DAY_MS);
  assert.equal(alphaTime(advanced,t+2000),t+11_000+ALPHA_DAY_MS,
    "exact simulated day advances the logical game by 24 hours once");
  assert.equal(advanced.speed,1,"one-day testing does not turn on 10x");
  assert.equal(alphaTime(advanced,t+3000),t+12_000+ALPHA_DAY_MS);
  const ten=advanceAlphaClock(accelerated,t+1000,ALPHA_DAY_MS);
  assert.equal(ten.speed,10,"one-day test preserves an already enabled 10x mode");
  assert.equal(alphaTime(ten,t+2000),t+10_000+ALPHA_DAY_MS+10_000);
  assert.equal(alphaTime(accelerated,t-10_000),t,
    "backward wall-clock adjustment never goes backwards");
  assert.equal(parseAlphaClock(null),null);
  for(const bad of ["not-json","{}",
      '{"version":1,"realAnchorMs":-1,"gameAnchorMs":1,"speed":10}',
      '{"version":1,"realAnchorMs":1,"gameAnchorMs":1,"speed":100}'])
    assert.equal(parseAlphaClock(bad),null);
  assert.throws(()=>setAlphaSpeed(null,t,42),RangeError);
  assert.throws(()=>advanceAlphaClock(null,t,-1),RangeError);
  assert.throws(()=>alphaTime(null,-5),RangeError);

  // This tool invokes the real engine, not handcrafted 24h ore or XP.
  const work={...newGame(t),activity:"mining",wagons:[{activity:"mining",plannedMs:null}]};
  const oneDay=enterGame(work,alphaTime(advanceAlphaClock(null,t,ALPHA_DAY_MS),t),midpoint);
  assert.equal(oneDay.state.settledAtMs,t+ALPHA_DAY_MS);
  assert.equal(oneDay.state.skills.mining.level,1,
    "testing 24h cannot auto-level a skill past Skill Master");
  assert.equal(oneDay.state.skills.mining.xp,xpToNextLevel(1),
    "testing 24h must still obey one-bar skill XP cap");
  assert.ok(oneDay.state.items.stone>0);
  assert.deepEqual(readSave(JSON.stringify(oneDay.state)),oneDay.state);
  assert.deepEqual(enterGame(oneDay.state,t+ALPHA_DAY_MS,midpoint).state,oneDay.state,
    "reopening at the same virtual time never duplicates 24-hour rewards");
});

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

test("each claimed activity rank awards exactly ONE automatically allocated attribute point",()=>{
  assert.equal(MASTERY_ATTRIBUTE_BALANCE.pointsPerClaimedLevel,1);
  const blank = newGame(0);
  assert.deepEqual(totalMasteryAttributeBonuses(blank.skills),
    {STR:0,DEX:0,END:0});
  const zero = effectiveAttributeProgress(blank.attributeEffort,blank.skills);
  for(const id of ATTRIBUTE_IDS) {
    assert.equal(zero[id].value, ATTRIBUTE_BALANCE.startingStat);
    assert.equal(zero[id].masteryBonus,0);
  }
  for(const [activity, weights] of Object.entries(ACTIVITY_STAT_WEIGHTS)) {
    const onceAround=masteryBonusesForSkill(activity,101);
    assert.deepEqual(onceAround,Object.fromEntries(ATTRIBUTE_IDS.map(id =>
      [id,weights[id]??0])),"100 claimed levels follow original "+activity+" percentages");
    let last=masteryBonusesForSkill(activity,1);
    for(let level=1;level<150;level++) {
      const now=masteryBonusesForSkill(activity,level+1);
      const award=masteryAwardForNextLevel(activity,level);
      assert.equal(Object.values(award).reduce((sum,v)=>sum+v,0),1,
        activity+" level "+level+" must earn exactly one point");
      assert.equal(ATTRIBUTE_IDS.reduce((sum,id)=>sum+now[id]-last[id],0),1);
      for(const id of ATTRIBUTE_IDS) assert.ok(now[id]>=last[id],
        "leveling "+activity+" may never remove "+id+" points");
      last=now;
    }
  }
  assert.deepEqual(masteryBonusesForSkill("mining",11),
    {STR:7,DEX:0,END:3});
  const twentyYearVeteran = masteryBonusesForSkill("mining",100_000_001);
  assert.equal(Object.values(twentyYearVeteran).reduce((a,x)=>a+x,0),100_000_000,
    "mastery awards are computed in bounded time, not by replaying levels");
  assert.throws(()=>masteryBonusesForSkill("made_up",2),RangeError);
  assert.throws(()=>masteryBonusesForSkill("mining",0),RangeError);
});

test("existing skill levels grant derived mastery stats once without changing current saves",()=>{
  const existing=newGame(0);
  existing.skills.mining={level:11,xp:0};

  existing.items.stone=91;
  const expected={STR:7,DEX:0,END:3};
  assert.deepEqual(totalMasteryAttributeBonuses(existing.skills),expected);
  const before=effectiveAttributeProgress(existing.attributeEffort,existing.skills);
  for(const id of ATTRIBUTE_IDS) assert.equal(before[id].value,10+expected[id]);
  assert.equal(before.STR.baseValue,10);
  const restored=readSave(JSON.stringify(existing));
  assert.deepEqual(restored,existing,"no schema, XP or inventory migration");
  assert.deepEqual(totalMasteryAttributeBonuses(restored.skills),expected);
  assert.deepEqual(effectiveAttributeProgress(restored.attributeEffort,restored.skills),before,
    "reading save again cannot duplicate earned points");

});

test("Skill Master grants one stat point only on explicit confirmed level advancement",()=>{
  const s=newGame(0);
  s.skills.mining.xp=xpToNextLevel(1);
  s.items.stone=17;
  const before=effectiveAttributeProgress(s.attributeEffort,s.skills);
  const returned=enterGame(s,0,midpoint).state;
  assert.deepEqual(effectiveAttributeProgress(returned.attributeEffort,returned.skills),before,
    "full XP bar and offline return alone give no mastery attribute");
  const taught=learnFromMaster(returned,0,midpoint);
  const after=effectiveAttributeProgress(taught.state.attributeEffort,taught.state.skills);
  const award=masteryAwardForNextLevel("mining",1);
  assert.deepEqual(award,{STR:1});
  assert.equal(after.STR.value,before.STR.value+1);
  assert.equal(after.STR.masteryBonus,1);
  for(const id of ATTRIBUTE_IDS.filter(x=>x!=="STR"))
    assert.equal(after[id].value,before[id].value);
  assert.equal(taught.state.items.stone,0,"existing Master tribute is unchanged");
  assert.equal(taught.state.skills.mining.xp,0);
  assert.deepEqual(effectiveAttributeProgress(readSave(taught.state).attributeEffort,
    readSave(taught.state).skills),after);
  assert.throws(()=>learnFromMaster(taught.state,0,midpoint),RangeError,
    "cannot claim the same level's permanent stat reward twice");
});

test("only individual activities have levels; character has a name but no level", () => {
  const state = newGame(0);
  assert.equal(state.version, GAME_VERSION);
  assert.equal(state.name, "Wanderer");
  assert.equal(SAVE_KEY, "idle-game-prototype-v1", "keep existing local save key for migration");
  assert.equal(Object.hasOwn(state, "level"), false);
  assert.equal(Object.hasOwn(state, "totalXP"), false);
  assert.ok(SKILL_IDS.length >= 10);
  assert.ok(ITEM_KEYS.length >= 14, "rare resources have separate stack keys");
  for (const id of SKILL_IDS) assert.deepEqual(state.skills[id], { level: 1, xp: 0 });
});

test("mastery offers collect every possible skill spoil, including rare stock", () => {
  const start = newGame(0);
  start.skills.mining = {level:1,xp:xpToNextLevel(1)};
  start.skills.hunting = {level:1,xp:xpToNextLevel(1)};
  start.skills.training = {level:1,xp:xpToNextLevel(1)};
  start.items.stone = 1; // the smallest sacrifice is enough
    start.items.iron_ore = 19;
  start.items.limestone = 5;
  start.items.log = 40; // unrelated resources must survive
  assert.deepEqual(skillSpoils("mining"), ["stone","limestone","iron_ore"]);
  assert.deepEqual(skillSpoils("training"), []);
  assert.deepEqual(skillSpoils("cooking"), ["ration"]);
  const offer = skillMasterOffer(start);
  assert.deepEqual(offer.ready, ["hunting","mining","training"],
    "full XP remains eligible even when all outputs were consumed");
  assert.deepEqual(offer.blocked, []);
  assert.deepEqual(offer.tribute, {
    stone:1,iron_ore:19,limestone:5
  });
  const out = learnFromMaster(start, 0);
  for (const key of Object.keys(offer.tribute)) assert.equal(out.state.items[key], 0, key);
  assert.equal(out.state.items.log, 40);
  assert.equal(Object.hasOwn(out.state, "protectedItems"), false);
  assert.deepEqual(out.state.skills.mining, {level:2,xp:0});
  assert.deepEqual(out.state.skills.training, {level:2,xp:0});
  assert.deepEqual(out.state.skills.hunting, {level:2,xp:0});
  assert.deepEqual(readSave(JSON.stringify(out.state)), out.state);
  assert.throws(() => learnFromMaster(out.state, 0), RangeError,
    "one visit can never grant two levels for a single XP bar");
});

test("spending spoils before the Master is strategic, and full XP prevents missing-output deadlock", () => {
  const start = newGame(0);
  start.skills.mining.xp = xpToNextLevel(1);
  assert.deepEqual(skillMasterOffer(start).ready, ["mining"]);
  assert.deepEqual(skillMasterOffer(start).blocked, []);
  assert.equal(learnFromMaster(start,0).state.skills.mining.level,2);
  start.items.stone = 1;
  start.items.iron_ore = 0;
  assert.deepEqual(skillMasterOffer(start).ready, ["mining"]);
  const out = learnFromMaster(start, 0);
  assert.equal(out.state.items.stone, 0);
  assert.equal(out.state.skills.mining.level, 2);
  assert.equal(out.state.skills.mining.xp, 0);
  assert.deepEqual(skillMasterOffer(out.state).ready, []);
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
    for (const ingredient of PRODUCTION_RECIPES[id]?.[0]?.inputs ?? []) start.items[ingredient] = 1;
    const chosen = choose(start, id, 0).state;
    assert.equal(finish(chosen, activity.durationMs - 1000).report.completed, 0);
    const result = finish(chosen, activity.durationMs);
    assert.equal(result.report.completed, 1);
    if (activity.item === null) {
      assert.equal(result.report.gainedItems, 0);
      assert.deepEqual(result.report.items, {});
    } else assert.equal(result.report.gainedItems, 1);
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
  assert.equal(stockTotal(result.state, "mining"), 20, "loot stops at the XP cap");
  const returned = enter(chosen, amount * ACTIVITIES.mining.durationMs);
  assert.equal(returned.state.skills.mining.level, 1, "return never auto-levels");
  assert.deepEqual(returned.levelsGained, {});
  const offer = skillMasterOffer(returned.state);
  assert.deepEqual(offer.ready, ["mining"]);
  assert.equal(Object.values(offer.tribute).reduce((sum, n) => sum + n, 0), 20);
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
  assert.equal(state.items.stone, 20);
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
test("50 offline years award only the first skill XP bar and its loot", () => {
  const start = 1_600_000_000_000;
  const elapsed = YEAR * 50;
  const away = choose(newGame(start), "hunting", start).state;
  const out = finish(away, start + elapsed);
  const actions = Math.ceil(xpToNextLevel(1)/ACTIVITIES.hunting.xp);
  assert.equal(out.report.completed, actions);
  assert.equal(out.state.skills.hunting.xp, xpToNextLevel(1));
  assert.equal(out.state.skills.hunting.level, 1);
  assert.equal(out.state.skills.mining.level, 1);
  assert.equal(stockTotal(out.state, "hunting"), actions);
  const home = enter(away, start + elapsed);
  assert.equal(home.state.skills.hunting.level, 1);
  assert.equal(stockTotal(home.state, "hunting"), actions);
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
  const time = 10 * ACTIVITIES.mining.durationMs;
  const low = settle(chosen, time, () => 0);
  const rolls = [0.999999, 0, 0.999999, 0];
  const high = settle(chosen, time, () => rolls.shift() ?? 0.5);
  assert.equal(low.report.gainedItems, 9);
  assert.equal(high.report.gainedItems, 11);
  assert.equal(low.state.skills.mining.xp, 18);
  assert.equal(high.state.skills.mining.xp, 22);
  assert.equal(low.state.skills.mining.level, 1);
  assert.equal(high.state.skills.mining.level, 1);
});

test("20 years settle with constant number of random rolls", () => {
  const start = 1_600_000_000_000;
  const chosen = choose(newGame(start), "foraging", start).state;
  let rolls = 0;
  const out = enterGame(chosen, start + YEAR * 20, () => { rolls++; return 0.5; });
  assert.ok(rolls <= 20,"bounded probe RNG, not individual actions");
  assert.equal(out.state.skills.foraging.level, 1);
  assert.equal(out.state.skills.foraging.xp, 40);
  assert.equal(out.state.skills.mining.level, 1);
});

test("one-day testing shortcut internally respects frozen skill levels", () => {
  const start = 86400000;
  const chosen = choose(newGame(start), "foraging", start).state;
  const out = testOfflineDay(chosen, start, midpoint);
  assert.equal(out.report.completed, Math.ceil(xpToNextLevel(1)/ACTIVITIES.foraging.xp));
  assert.equal(out.state.skills.foraging.level, 1);
  assert.equal(out.state.skills.foraging.xp, xpToNextLevel(1));
  assert.deepEqual(readSave(JSON.stringify(out.state)), out.state);
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
  assert.ok(result.state.items.iron_ore > 0);
  assert.ok(result.state.items.iron_ore > 0);
  assert.ok(result.state.items.limestone > 0);
  assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
});

test("processing consumes inventory: no iron ore means no ingots or XP", () => {
  assert.deepEqual(Object.keys(PRODUCTION_RECIPES), ["smithing", "construction", "cooking"]);
  assert.deepEqual(PRODUCTION_INPUTS, ["iron_ore", "limestone", "fuel", "log", "stone", "hide", "grain", "meat", "fish", "herb"]);
  const s = choose(newGame(0), "smithing", 0).state;
  const result = finish(s, 100 * ACTIVITIES.smithing.durationMs);
  assert.equal(result.report.completed, 0);
  assert.equal(result.state.items.iron_ingot, 0);
  assert.equal(result.state.skills.smithing.xp, 0);
  assert.equal(result.state.settledAtMs, 100 * ACTIVITIES.smithing.durationMs);
  assert.equal(result.state.progressMs, 0);
});

test("long offline cooking consumes available fish, but Master takes meals to level", () => {
  const start = newGame(0);
  start.items.fish = 1000;
  const selected = choose(start, "cooking", 0).state;
  const out = finish(selected, 20 * YEAR);
  assert.equal(out.report.completed, 20);
  assert.equal(out.state.items.fish, 980);
  assert.equal(out.state.items.ration, 20);
  assert.equal(out.state.skills.cooking.level, 1);
  assert.equal(out.state.skills.cooking.xp, xpToNextLevel(1));
  const returned = enter(selected, 20 * YEAR);
  assert.equal(returned.state.skills.cooking.level, 1);
  const claimed = learnFromMaster(returned.state, returned.state.settledAtMs);
  assert.equal(claimed.state.skills.cooking.level, 2);
  assert.equal(claimed.state.items.ration, 0);
  assert.deepEqual(readSave(JSON.stringify(claimed.state)), claimed.state);
});
test("XP-only skills remain offline-safe and advance with no material tribute", () => {
  const old = newGame(0);
  const restored = readSave(JSON.stringify(old));
  assert.ok(restored);
  assert.deepEqual(restored.skills.training, {level: 1, xp: 0});
  const away = choose(restored, "training", 0).state;
  const result = finish(away, 20 * YEAR);
  assert.equal(result.state.skills.training.xp, 40);
  assert.equal(result.state.skills.training.level, 1);
  assert.deepEqual(result.report.items, {});
  assert.deepEqual(result.state.items, restored.items);
  const back = enter(away, 20 * YEAR);
  assert.equal(back.state.skills.training.level, 1);
  const offer = skillMasterOffer(back.state);
  assert.deepEqual(offer.ready, ["training"]);
  assert.deepEqual(offer.tribute, {});
  const trained = learnFromMaster(back.state, 20 * YEAR);
  assert.deepEqual(trained.state.skills.training, {level:2,xp:0});
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
  const request = switchTo(initial, "foraging", 0).state;
  const finishedAt = ACTIVITIES.hunting.durationMs;
  const moving = finish(request, finishedAt).state;
  assert.equal(moving.transition.phase, "moving");
  const preparing = finish(moving, finishedAt + SAME_ZONE_TRAVEL_MS).state;
  assert.equal(preparing.transition.phase, "preparing");
  const working = finish(preparing, finishedAt + SAME_ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.equal(working.activity, "foraging");
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
  const retarget = switchTo(state, "smithing", state.settledAtMs).state;
  assert.equal(retarget.transition.phase, "moving");
  assert.equal(retarget.transition.phaseProgressMs, 0);
  const noChange = switchTo(retarget, "smithing", retarget.settledAtMs).state;
  assert.deepEqual(noChange, retarget, "same-target Start must not reset progress");
  const next = finish(retarget, retarget.settledAtMs + ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.equal(next.activity, "smithing");
  assert.equal(next.items.stone, 1);
  assert.equal(next.items.hide, 0);
  assert.equal(next.skills.mining.xp, 2);
  const after = finish(next, next.settledAtMs + ACTIVITIES.smithing.durationMs).state;
  assert.equal(after.items.iron_ingot, 0, "no free crafted output");
  assert.equal(after.skills.smithing.xp, 0);
});

test("retarget while preparing restarts movement from the old zone", () => {
  const start = choose(newGame(0), "mining", 0).state;
  const requested = switchTo(start, "hunting", 0).state;
  const preparingAt = ACTIVITIES.mining.durationMs + ZONE_TRAVEL_MS;
  const preparing = finish(requested, preparingAt + PREPARATION_MS / 2).state;
  assert.equal(preparing.transition.phase, "preparing");
  const redirect = switchTo(preparing, "construction", preparing.settledAtMs).state;
  assert.equal(redirect.transition.phase, "moving");
  assert.equal(redirect.transition.phaseProgressMs, 0);
  const newTargetAt = redirect.settledAtMs + ZONE_TRAVEL_MS + PREPARATION_MS;
  assert.equal(finish(redirect, newTargetAt).state.activity, "construction");
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
  assert.equal(stockTotal(after.state,"hunting"),1);
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


test("Current-build unfinished cycles migrate to alpha without resetting name, XP or inventory", () => {
  const old = newGame(1_000);
  old.version = GAME_VERSION;
  old.timingProfile = "normal";
  old.wagons = [{ activity: "mining", plannedMs: null }];
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

test("Current-build saved travel and preparation migrate proportionally without prematurely completing the switch", () => {
  const original = newGame(0);
  original.version = GAME_VERSION;
  original.timingProfile = "normal";
  original.wagons = [{ activity: "hunting", plannedMs: null }];
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

  const initial = { ...original, activity: null, wagons: [{ activity: "mining", plannedMs: null }],
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

// Queue regression fixtures have earned three slots through an unused skill.
const queueFixture = (now=0) => {
  const state = newGame(now);
  state.skills.fishing.level=21;
  return state;
};
const queueStart = (state, id, duration, now = state.settledAtMs) =>
  queueStartActivity(state, id, duration, now, midpoint);
const queueDuration = (state, index, duration, now = state.settledAtMs) =>
  queueSetDuration(state, index, duration, now, midpoint);
const queueReorder = (state, index, now = state.settledAtMs) =>
  queueSwap(state, index, now, midpoint);

const queueTimed = (state, id, duration, now = state.settledAtMs) =>
  queueInsertTimedActivity(state, id, duration, now, midpoint);

test("new selected task owns four-hour duration; original work remains Forever fallback", () => {
  const fresh=newGame(0); fresh.skills.hunting.level=1000;
  let state = queueStart(fresh, "mining", null).state;
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
  let state = queueStart(queueFixture(0), "mining", null).state;
  state = queueStart(state, "construction", 2 * HOUR_MS).state;
  state = finish(state, INITIAL_PREPARATION_MS + 5_000).state;
  const prior = { ...state, wagons: state.wagons.map(w => ({ ...w })) };
  const next = queueTimed(state, "hunting", 4 * HOUR_MS).state;
  assert.deepEqual(next.wagons, [
    { activity: "mining", plannedMs: 2 * HOUR_MS },
    { activity: "hunting", plannedMs: 4 * HOUR_MS },
    { activity: "construction", plannedMs: null }
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
  let state = queueStart(queueFixture(0), "mining", null).state;
  state = queueTimed(state, "hunting", MINUTE_MS).state;
  state = finish(state, INITIAL_PREPARATION_MS + 30_000).state;
  const earnedXP = state.skills.hunting.xp;
  const earnedItems = { ...state.items };
  const result = requestActivityChange(state, "construction", state.settledAtMs, midpoint);
  assert.deepEqual(result.state.wagons, [{ activity: "construction", plannedMs: null }]);
  assert.equal(result.state.transition.targetActivity, "construction");
  assert.equal(result.state.skills.hunting.xp, earnedXP);
  assert.deepEqual(result.state.items, earnedItems);
  assert.equal(settle(result.state, result.state.settledAtMs, midpoint).report.completed, 0);
});

test("three wagon invariants: one Forever last, explicit previous slot duration, no fourth", () => {
  assert.equal(MAX_WAGONS, 5);
  for (let i = 1; i <= 8; i++) {
    assert.equal(validPlannedDuration(i * MINUTE_MS), true);
    assert.equal(validPlannedDuration(i * HOUR_MS), true);
    assert.equal(validPlannedDuration(i * DAY_MS), true);
  }
  for (const n of [0, 500, 9 * MINUTE_MS, 9 * HOUR_MS, 9 * DAY_MS, 10_000]) {
    assert.equal(validPlannedDuration(n), false);
  }
  const first = queueStart(queueFixture(0), "mining", null).state;
  assert.deepEqual(first.wagons, [{ activity: "mining", plannedMs: null }]);
  assert.equal(first.transition.phase, "preparing");
  assert.equal(first.activity, null);
  assert.throws(() => queueStart(first, "hunting", null), RangeError);
  const second = queueStart(first, "hunting", HOUR_MS).state;
  assert.deepEqual(second.wagons, [
    { activity: "mining", plannedMs: HOUR_MS },
    { activity: "hunting", plannedMs: null }
  ]);
  const third = queueStart(second, "construction", DAY_MS).state;
  assert.deepEqual(third.wagons, [
    { activity: "mining", plannedMs: HOUR_MS },
    { activity: "hunting", plannedMs: DAY_MS },
    { activity: "construction", plannedMs: null }
  ]);
  assert.throws(() => queueStart(third, "foraging", HOUR_MS), RangeError);
  assert.throws(() => queueStart(third, "mining", HOUR_MS), RangeError);
  assert.throws(() => queueDuration(third, 2, HOUR_MS), RangeError);
  assert.deepEqual(readSave(JSON.stringify(third)), third);
});

test("alpha minute slots complete in real productive minutes without losing old saves", () => {
  let first = queueStart(queueFixture(0), "mining", null).state;
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
  const initial = queueStart(queueFixture(0), "mining", null).state;
  const queued = queueStart(initial, "hunting", HOUR_MS).state;
  let rolls = 0;
  const result = settle(queued, YEAR * 20, () => { rolls++; return 0.5; });
  assert.ok(rolls < 100, "no per-cycle or per-day loop");
  assert.deepEqual(result.state.wagons, [{ activity: "hunting", plannedMs: null }]);
  assert.equal(result.state.transition, null);
  assert.equal(result.state.productiveElapsedMs, 0);
  assert.equal(stockTotal(result.state, "mining"), 20);
  assert.equal(stockTotal(result.state,"hunting"),14);
  assert.equal(result.state.skills.hunting.level, 1);
  assert.equal(result.state.skills.mining.level, 1);
  assert.equal(result.reports.length, 2);
  assert.equal(settle(result.state, YEAR * 20, midpoint).report.completed, 0);
  assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
  const returned = enter(queued, YEAR * 20);
  assert.equal(returned.state.skills.hunting.level, 1);
  assert.equal(returned.state.skills.hunting.xp, 40);
});

test("three wagons consume prior foraging in chronological order and then work forever", () => {
  let state = queueStart(queueFixture(0), "mining", null).state;
  state = queueStart(state, "construction", HOUR_MS).state;
  state = queueStart(state, "hunting", HOUR_MS).state;
  const result = finish(state, 20 * YEAR);
  assert.equal(result.state.items.stone+(result.state.items.block??0),result.reports[0].items.stone,"construction conserves mined stone");
  assert.equal(result.state.items.block,result.reports[1].consumed.stone??0);
  assert.equal(stockTotal(result.state,"hunting"),14);
  assert.equal(result.state.skills.mining.xp, xpToNextLevel(1));
  assert.equal(result.state.skills.construction.xp, xpToNextLevel(1));
  assert.deepEqual(result.state.wagons, [{ activity: "hunting", plannedMs: null }]);
  assert.equal(result.reports.length, 3);
  assert.deepEqual(result.reports.map(r => r.activity), ["mining", "construction", "hunting"]);
});

test("queue works with a partially finished last cycle, with no extra reward at a boundary", () => {
  let state = queueStart({...newGame(0),skills:{...newGame(0).skills,mining:{level:100,xp:0}}}, "mining", null).state;
  state = queueStart(state, "hunting", HOUR_MS).state;
  const exact = finish(state, INITIAL_PREPARATION_MS + HOUR_MS).state;
  assert.equal(stockTotal(exact, "mining"), HOUR_MS / 10_000 * 2);
  assert.equal(exact.transition.phase, "moving");
  assert.equal(exact.progressMs, 0);
  const ready = finish(exact, exact.settledAtMs + ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.equal(stockTotal(ready, "mining"), HOUR_MS / 10_000 * 2, "no phantom extra finishing cycle");
  assert.equal(ready.activity, "hunting");
  assert.equal(ready.items.hide, 0);

  // An explicit running-duration edit starts its new window now, not back
  // at the first productive instant. The last cycle still finishes once.
  const started = queueStart({...newGame(0),skills:{...newGame(0).skills,mining:{level:100,xp:0}}}, "mining", null).state;
  let second = queueStart(started, "hunting", HOUR_MS).state;
  second = finish(second, INITIAL_PREPARATION_MS + 3_000).state;
  const edited = queueDuration(second, 0, HOUR_MS, second.settledAtMs).state;
  assert.equal(edited.productiveElapsedMs, 0);
  assert.equal(edited.progressMs, 3_000);
  const expiry = finish(edited, edited.settledAtMs + HOUR_MS).state;
  assert.equal(expiry.transition.phase, "finishing");
  assert.equal(stockTotal(expiry, "mining"), HOUR_MS / 10_000 * 2);
  const boundary = finish(expiry, expiry.settledAtMs + 7_000).state;
  assert.equal(stockTotal(boundary, "mining"), HOUR_MS / 10_000 * 2 + 2);
  assert.equal(boundary.transition.phase, "moving");
});

test("future swap is free, current swap restarts travel without losing old cycle rewards", () => {
  let state = queueStart(queueFixture(0), "mining", null).state;
  state = queueStart(state, "hunting", HOUR_MS).state;
  state = queueStart(state, "construction", HOUR_MS).state;
  const ready = finish(state, INITIAL_PREPARATION_MS + 4_000).state;
  const futureSwap = queueReorder(ready, 1).state;
  assert.equal(futureSwap.activity, "mining");
  assert.equal(futureSwap.transition, null);
  assert.equal(futureSwap.progressMs, 4_000);
  assert.deepEqual(futureSwap.wagons.map(w => w.activity), ["mining", "construction", "hunting"]);
  const activeSwap = queueReorder(futureSwap, 0).state;
  assert.equal(activeSwap.wagons[0].activity, "construction");
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
  assert.deepEqual(redirect.wagons.map(w => w.activity), ["mining", "construction", "hunting"]);
  assert.equal(settle(redirect, redirect.settledAtMs, midpoint).report.completed, 0);
});

test("future wagon can be removed without losing current progress; final becomes Forever", () => {
  let state = queueStart(queueFixture(0), "mining", null).state;
  state = queueStart(state, "hunting", HOUR_MS).state;
  state = queueStart(state, "construction", HOUR_MS).state;
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

test("Skill Master and queue share full-XP readiness", () => {
  assert.equal(UNTIL_LEVEL_UP, "untilLevelUp");
  assert.equal(validQueuePlan(UNTIL_LEVEL_UP), true);
  assert.equal(validQueuePlan(MINUTE_MS), true);
  assert.equal(validQueuePlan("other"), false);
  assert.equal(MASTER_RESOURCE_MINIMUM.mining, 0);
  assert.equal(MASTER_RESOURCE_MINIMUM.smithing, 0);
  assert.equal(MASTER_RESOURCE_MINIMUM.training, 0);
  const s = newGame(0);
  s.skills.mining.xp = xpToNextLevel(1);
  let ready = skillMasterReadiness(s, "mining");
  assert.equal(ready.xpReady, true);
  assert.equal(ready.resourcesReady, true);
  assert.equal(ready.requiredItems, 0);
  assert.equal(ready.ready, true);
  assert.deepEqual(skillMasterOffer(s).blocked, []);
  s.items.stone = 1;
  ready = skillMasterReadiness(s, "mining");
  assert.equal(ready.ready, true);
  assert.deepEqual(skillMasterOffer(s).ready, ["mining"]);
  s.items.stone = 0;
  s.items.iron_ore = 1;
  assert.equal(skillMasterReadiness(s, "mining").ready, true,
    "higher-tier spoils from the same skill also count toward its Master eligibility");
  s.skills.training.xp = xpToNextLevel(1);
  assert.equal(skillMasterReadiness(s, "training").ready, true,
    "XP-only skills have no material requirement");
});

test("Until LvL Up scheduled XP-only activity stops at mastery readiness without auto-leveling", () => {
  let state = queueStart(queueFixture(0), "hunting", null).state;
  state = queueTimed(state, "training", UNTIL_LEVEL_UP).state;
  assert.deepEqual(state.wagons, [
    {activity:"training", plannedMs:UNTIL_LEVEL_UP},
    {activity:"hunting", plannedMs:null}
  ]);
  assert.deepEqual(readSave(JSON.stringify(state)), state);
  let calls = 0;
  const result = settle(state, 20 * YEAR, () => { calls++; return 0.5; });
  assert.ok(calls < 30, "even decades of offline work do not run per-cycle loops");
  assert.deepEqual(result.state.wagons, [{activity:"hunting", plannedMs:null}]);
  assert.equal(result.state.transition, null);
  assert.equal(result.state.activity, "hunting");
  assert.equal(result.state.skills.training.level, 1);
  assert.equal(result.state.skills.training.xp, xpToNextLevel(1));
  assert.equal(skillMasterReadiness(result.state, "training").ready, true);
  assert.ok(result.state.items.hide > 0, "Forever job continues after readiness");
  assert.equal(settle(result.state, 20 * YEAR, midpoint).report.completed, 0,
    "repeated settlement never grants duplicate rewards");
  assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
});

test("Until LvL Up skips a full XP bar even when all outputs were consumed", () => {
  let state=queueStart(queueFixture(0),"hunting",null).state;
  state.skills.mining.xp=xpToNextLevel(1);
  state=queueTimed(state,"mining",UNTIL_LEVEL_UP).state;
  const out=finish(state,INITIAL_PREPARATION_MS+ZONE_TRAVEL_MS+PREPARATION_MS+ACTIVITIES.hunting.durationMs).state;
  assert.deepEqual(out.wagons,[{activity:"hunting",plannedMs:null}]);
  assert.equal(stockTotal(out,"mining"),0);
  assert.equal(out.skills.mining.level,1);
  assert.equal(skillMasterReadiness(out,"mining").ready,true);
});


test("capped crafting skips without consuming inputs and uncapped empty crafting cannot fabricate XP",()=>{
  let state=queueStart(queueFixture(0),"hunting",null).state;
  state.skills.smithing.xp=xpToNextLevel(1);state.items.iron_ore=2;
  state=queueTimed(state,"smithing",UNTIL_LEVEL_UP).state;
  const out=finish(state,20*YEAR).state;
  assert.equal(out.activity,"hunting");assert.equal(out.items.iron_ore,2);assert.equal(out.items.iron_ingot,0);
  assert.equal(skillMasterReadiness(out,"smithing").ready,true);
  let waiting=queueStart(queueFixture(0),"hunting",null).state;
  waiting=queueTimed(waiting,"smithing",UNTIL_LEVEL_UP).state;
  const blocked=finish(waiting,20*YEAR).state;
  assert.equal(blocked.activity,"smithing");assert.equal(blocked.items.iron_ingot,0);assert.equal(blocked.skills.smithing.xp,0);
});


test("editing and reordering Until LvL Up schedule preserve other jobs and saved progress", () => {
  let state = queueStart(queueFixture(0), "mining", null).state;
  state = queueTimed(state, "hunting", MINUTE_MS).state;
  state = queueTimed(state, "training", UNTIL_LEVEL_UP).state;
  assert.deepEqual(state.wagons.map(w=>w.plannedMs), [MINUTE_MS, UNTIL_LEVEL_UP, null]);
  assert.deepEqual(readSave(JSON.stringify(state)), state);
  const futureSwap = queueReorder(state, 1).state;
  assert.deepEqual(futureSwap.wagons.map(w=>w.plannedMs), [MINUTE_MS, UNTIL_LEVEL_UP, null],
    "swap exchanges activity names, not slot stop conditions");
  assert.deepEqual(futureSwap.wagons.map(w=>w.activity), ["hunting","mining","training"]);
  const edited = queueDuration(futureSwap, 0, UNTIL_LEVEL_UP).state;
  assert.equal(edited.wagons[0].plannedMs, UNTIL_LEVEL_UP);
  assert.equal(edited.productiveElapsedMs, 0);
  assert.deepEqual(readSave(JSON.stringify(edited)), edited);
  assert.equal(readSave({...edited, wagons: [
    {activity:"hunting",plannedMs:"bogus"},
    {activity:"mining",plannedMs:UNTIL_LEVEL_UP},
    {activity:"training",plannedMs:null}]}), null);
  assert.equal(readSave({...edited, wagons: [
    {activity:"hunting",plannedMs:UNTIL_LEVEL_UP},
    {activity:"mining",plannedMs:UNTIL_LEVEL_UP},
    {activity:"training",plannedMs:UNTIL_LEVEL_UP}]}), null,
    "last wagon must remain Forever");
});

test("every survival activity splits the same hourly stat budget", () => {
  assert.equal(ATTRIBUTE_IDS.length, 3);
  assert.deepEqual(ATTRIBUTE_IDS, ["STR", "DEX", "END"]);
  assert.equal(ATTRIBUTE_BALANCE.xpPerProductiveHour, 100);
  assert.deepEqual(Object.keys(ACTIVITY_STAT_WEIGHTS).sort(), [...SKILL_IDS].sort());
  for (const id of SKILL_IDS) {
    const weights = ACTIVITY_STAT_WEIGHTS[id];
    assert.equal(Object.values(weights).reduce((sum, x) => sum + x, 0), 100, id);
    assert.ok(Object.keys(weights).every(stat => ATTRIBUTE_IDS.includes(stat)), id);
  }
});

test("stat growth is based on productive time, even mid-cycle, never actions completed", () => {
  const fresh=newGame(0);fresh.skills.mining.level=100;
  const start = choose(fresh, "mining", 0).state;
  const first = finish(start, HOUR_MS - 1);
  const second = finish(first.state, HOUR_MS);
  const continuous = finish(start, HOUR_MS);
  assert.deepEqual(second.state.attributeEffort, continuous.state.attributeEffort,
    "settling in small pieces must not lose fractional XP");
  assert.equal(continuous.state.attributeEffort.STR, HOUR_MS * 70);
  assert.equal(continuous.state.attributeEffort.END, HOUR_MS * 30);
  assert.equal(continuous.state.attributeEffort.DEX, 0);
  assert.equal(attributeXP(continuous.state.attributeEffort.STR), 70);
  assert.equal(attributeXP(continuous.state.attributeEffort.END), 30);
  assert.equal(Object.values(continuous.state.attributeEffort)
    .reduce((sum, amount) => sum + attributeXP(amount), 0), 100);
  assert.deepEqual(start.attributeEffort, newGame(0).attributeEffort,
    "settling may not mutate the original state");
});

test("changing activities changes stat distribution but not total XP per hour", () => {
  const fresh=newGame(0);fresh.skills.mining.level=100;fresh.skills.training.level=100;
  const mining = finish(choose(fresh, "mining", 0).state, HOUR_MS).state;
  const study = finish(choose(fresh, "training", 0).state, HOUR_MS).state;
  assert.equal(attributeXP(mining.attributeEffort.STR), 70);
  assert.equal(attributeXP(study.attributeEffort.DEX), 35);
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
  const switching = requestActivityChange(mined, "training", mined.settledAtMs, midpoint).state;
  const oldDoneAt = mined.settledAtMs + ACTIVITIES.mining.durationMs;
  const finished = finish(switching, oldDoneAt).state;
  const afterTransition = finish(finished, oldDoneAt + ZONE_TRAVEL_MS + PREPARATION_MS).state;
  assert.deepEqual(afterTransition.attributeEffort, finished.attributeEffort,
    "travel and preparation are not productive work");
});

test("attribute effort stops at full skill XP and resumes after an explicit claim",()=>{
  const start=choose(newGame(0),"training",0).state;
  const first=finish(start,YEAR).state, long=finish(start,20*YEAR).state;
  assert.equal(long.skills.training.level,1);assert.equal(long.skills.training.xp,xpToNextLevel(1));
  assert.deepEqual(long.attributeEffort,first.attributeEffort);
  assert.equal(Object.values(long.attributeEffort).reduce((a,b)=>a+b,0),14*ACTIVITIES.training.durationMs*100);
  const paused=finish(readSave(JSON.stringify(long)),21*YEAR).state;
  assert.deepEqual(paused.attributeEffort,long.attributeEffort);
  const claimed=learnFromMaster(paused,21*YEAR,midpoint).state;
  const resumed=finish(claimed,21*YEAR+ACTIVITIES.training.durationMs).state;
  assert.ok(resumed.attributeEffort.STR>paused.attributeEffort.STR);
});


test("old alpha saves reset and current saves validate stats", () => {
  const legacy = newGame(123);
  legacy.version = GAME_VERSION - 1;
  delete legacy.attributeEffort;
  legacy.skills.mining = { level: 18, xp: 21 };
  legacy.items.stone = 37;
  assert.equal(readSave(JSON.stringify(legacy)), null);
  const migrated = newGame(123);
  const progressed = finish(choose(migrated, "mining", 123).state, 123 + HOUR_MS).state;
  assert.ok(progressed.attributeEffort.STR > 0);
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
  assert.equal(readSave(oldV5), null, "required current-build skills cannot be missing");
});

test("noncombat grades remain gated; automatic Fighting grades survive reloading",async()=>{
  const {setDifficulty}=await import("../site/play/engine.mjs");
  const {workMultiplier,benchmark}=await import("../site/play/difficulty.mjs");
  let state=newGame(0);
  delete state.difficulties;
  state=readSave(state);
  assert.deepEqual(state.difficulties,{});
  for(let tier=1;tier<=7;tier++) {
    state.skills.mining.level=tier*10-1;
    assert.throws(()=>setDifficulty(state,"mining",tier,0));
    state.skills.mining.level++;
    state=setDifficulty(state,"mining",tier,0).state;
    assert.equal(readSave(state).difficulties.mining,tier);
    assert.throws(()=>setDifficulty(state,"fighting",tier,0),/automatically/);
    state={...state,difficulties:{...state.difficulties,fighting:tier},autoFight:{stage:tier,streak:0,blocked:-1,highest:-1}};
    assert.equal(readSave(state).autoFight.stage,tier);
    const model=benchmark(tier), weight={STR:100};
    assert.ok(workMultiplier(tier,weight,{STR:{value:model.stat}})>1);
    assert.ok(workMultiplier(tier,weight,{STR:{value:model.stat/2}})<1);
  }
  assert.equal(state.skills.fighting.level,1);
  assert.equal(state.difficulties.fighting,7);
  assert.throws(()=>setDifficulty(state,"fighting",8,0));
  assert.throws(()=>setDifficulty(state,"mining",8,0));
});

test("GLAD-001 exposes eleven survival activities and three physical attributes", () => {
  assert.deepEqual(SKILL_IDS, [
    "fighting", "hunting", "fishing", "foraging", "woodcutting", "mining",
    "smithing", "construction", "cooking", "farming", "training"
  ]);
  assert.deepEqual(ATTRIBUTE_IDS, ["STR", "DEX", "END"]);
  assert.deepEqual(ACTIVITY_STAT_WEIGHTS.training, { STR: 35, DEX: 35, END: 30 });
  assert.deepEqual(skillSpoils("training"), []);
});

test("GLAD-001 mortar requires and consumes both limestone and fuel", () => {
  const initial = choose(newGame(0), "construction", 0).state;
  initial.items.limestone = 4;
  initial.items.fuel = 2;
  const t = INITIAL_PREPARATION_MS + 10 * activityDuration("construction");
  const { state } = finish(initial, t);
  assert.equal(state.items.mortar, 2);
  assert.equal(state.items.limestone, 2);
  assert.equal(state.items.fuel, 0);
});

test("GLAD-001 a 20-year farm and cooking route consumes grain and preserves straw", () => {
  const fresh=newGame(0);fresh.skills.farming.level=10;fresh.skills.fishing.level=2;
  let state = queueStart(fresh, "farming", null).state;
  state = queueStart(state, "cooking", HOUR_MS).state;
  const result = finish(readSave(JSON.stringify(state)), 20 * YEAR);
  const harvest = result.reports.find(report => report.activity === "farming");
  const cooking = result.reports.find(report => report.activity === "cooking");
  assert.ok(harvest.items.grain > 0 && harvest.items.straw > 0);
  assert.equal(cooking.consumed.grain??0,result.state.items.ration);
  assert.equal(result.state.items.ration+result.state.items.grain,harvest.items.grain);
  assert.equal(result.state.items.straw, harvest.items.straw);
  assert.equal(result.state.items.ration,20);
  assert.equal(result.state.skills.cooking.level, 1);
  assert.ok(skillMasterOffer(result.state).ready.includes("cooking"));
  assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
});

test("GLAD-001 grade S training and mining keep capped offline skill XP and distinct outputs", () => {
  for (const activity of ["training", "mining"]) {
    const state = newGame(0);
    state.skills[activity].level = 70;
    state.difficulties[activity] = 7;
    const result = enter(choose(state, activity, 0).state, 20 * YEAR);
    assert.equal(result.state.skills[activity].xp, xpToNextLevel(70));
    assert.equal(result.state.skills[activity].level, 70);
    assert.equal(result.state.difficulties[activity], 7);
    assert.equal(result.report.gainedItems > 0, activity === "mining");
    assert.ok(skillMasterOffer(result.state).ready.includes(activity));
    assert.deepEqual(readSave(JSON.stringify(result.state)), result.state);
  }
});

test("GLAD-002 arena rewards match resolved wins and are independent of settlement splits", async () => {
  const { arenaReward, settleArenaPrizes } = await import("../site/play/arena-wallet.mjs");
  const { BOUT_MS, combatAtTime, startCombatSession } = await import("../site/play/combat.mjs");
  const {createPlayerSnapshot}=await import("./combat-simulator.mjs");
  // Test real payout/split semantics with a properly equipped F fighter.
  // The old bare fixture lost all 18 after A8 made armour meaningful.
  const player=createPlayerSnapshot({loadout:"greatsword",armour:"plate",grade:1,itemGrade:1,
    quality:"common",str:30,dex:30,end:30,skill:12});
  const initial = startCombatSession(player, 197);
  const result = settleArenaPrizes({ ...initial, elapsedMs: 18 * BOUT_MS });
  let wins = 0;
  for (let bout = 1; bout <= 18; bout++) {
    if (combatAtTime({ ...initial, elapsedMs: bout * BOUT_MS - 1 }).outcome === "victory") wins++;
  }
  assert.ok(wins > 0);
  assert.equal(result.coins, wins * arenaReward(1));
  const first = settleArenaPrizes({ ...initial, elapsedMs: 7 * BOUT_MS });
  const second = settleArenaPrizes({ ...first.session, elapsedMs: 18 * BOUT_MS });
  assert.equal(first.coins + second.coins, result.coins);
  assert.equal(settleArenaPrizes(result.session).coins, 0);
  assert.ok(arenaReward(7) > arenaReward(1) && arenaReward(1) > arenaReward(0));
});

test("GLAD-002 decades of prizes agree with the frozen arena schedule", async () => {
  const { arenaReward, settleArenaPrizes } = await import("../site/play/arena-wallet.mjs");
  const { ARENA_SCHEDULE_BOUTS, BOUT_MS, startCombatSession } = await import("../site/play/combat.mjs");
  const initial = startCombatSession({ name: "Offline fighter", loadout: "greatsword",
    difficulty: 0, str: 18, dex: 17, end: 16, skill: 10 }, 761);
  const cycleMs = ARENA_SCHEDULE_BOUTS * BOUT_MS;
  const cycles = Math.floor(20 * YEAR / cycleMs);
  const tailMs = 19 * BOUT_MS;
  const cycle = settleArenaPrizes({ ...initial, elapsedMs: cycleMs });
  const tail = settleArenaPrizes({ ...initial, elapsedMs: tailMs });
  const elapsedMs = cycles * cycleMs + tailMs;
  const whole = settleArenaPrizes({ ...initial, elapsedMs });
  assert.equal(whole.coins, cycles * cycle.coins + tail.coins);
  assert.ok(whole.coins >= arenaReward(0));
  const midpoint = settleArenaPrizes({ ...initial, elapsedMs: 37 * BOUT_MS });
  const rest = settleArenaPrizes({ ...midpoint.session, elapsedMs });
  assert.equal(midpoint.coins + rest.coins, whole.coins);
});

test("GLAD-002 arena wins reach the saved wallet once", async () => {
  const { BOUT_MS } = await import("../site/play/combat.mjs");
  const fresh=newGame(42);fresh.skills.fighting.level=100;
  const state = choose(fresh, "fighting", 42).state;
  const at = 42 + BOUT_MS * 20;
  const result = finish(state, at);
  assert.ok(result.state.coins > 0);
  const loaded = readSave(JSON.stringify(result.state));
  assert.equal(loaded.coins, result.state.coins);
  assert.equal(finish(loaded, at).state.coins, loaded.coins);
  assert.equal(readSave({ ...loaded, coins: -1 }), null);
});

test("APPRENTICE-A3 sells only the next grade or quality that improves real power", async () => {
  const shop = await import("../site/play/smith.mjs");
  const state = { ...newGame(0), coins: 10000 };
  state.skills.fighting.level=5;
  const item = { grade: 1, quality: "fine" };
  assert.equal(shop.smithQuote(state,"greatsword",item).available,false);
  const previous=purchaseThrough(state,"greatsword",{grade:1,quality:"common"}).state;
  const quote = shop.smithQuote(previous, "greatsword", item);
  assert.ok(quote.cost > 0 && quote.available);
  assert.ok(shop.itemPower(item) > shop.itemPower({ grade: 0, quality: "fine" }));
  assert.ok(shop.itemPower(item) > shop.itemPower({ grade: 1, quality: "common" }));
  assert.equal(shop.conditionProfile("greatsword", { grade: 1, quality: "masterwork" }).breakable, false);
});

test("GLAD-002 four slots and five weapon styles support real purchases", () => {
  assert.deepEqual(ARMOUR_SLOTS.map(s => s.id), ["head", "torso", "arms", "legs"]);
  assert.deepEqual(ARMOUR_TIERS, ["none", "padded", "leather", "plate"]);
  const start = { ...newGame(0), coins: 10000 };
  start.skills.fighting.level=5;
  assert.deepEqual(Object.keys(start.equipment).sort(), ["bow", "greatsword", "hammer", "spear", "sword_shield"]);
  assert.throws(() => setArmourChoice(start, "arms", "leather", 0), RangeError);
  assert.equal(buyEquipment(start,"arms:leather",{grade:1,quality:"common"},0).purchased,undefined);
  const purchased = purchaseThrough(start, "arms:leather", { grade: 1, quality: "common" }, 0);
  assert.equal(purchased.purchased, true);
  assert.equal(purchased.state.armour.arms, "leather");
  assert.equal(purchased.state.coins, 7431);
  assert.ok(armourStats(purchased.state.armour, start.combatLoadout).physicalReductionPct > 0);
  const retry = buyEquipment(readSave(JSON.stringify(purchased.state)), "arms:leather",
    { grade: 1, quality: "common" }, 0);
  assert.equal(retry.purchased, undefined);
  assert.deepEqual(retry.state, purchased.state);
  assert.equal(buyEquipment(retry.state, "arms:leather", { grade: 7, quality: "common" }, 0).purchased, undefined);
  const forged = { ...retry.state, armour: { ...retry.state.armour, torso: "plate" } };
  assert.equal(readSave(forged), null);
});

test("ALPHA-GEAR-001 purchase requires actual Fighting level and wallet, not weapon history",async()=>{
  const shop=await import("../site/play/smith.mjs");
  const s={...newGame(0),coins:10000000};
  const final={grade:7,quality:"masterwork"},target={grade:7,quality:"poor"};
  assert.equal(shop.smithQuote(s,"greatsword",target).reason,"no_improvement");
  s.skills.fighting.level=40;
  const prior=purchaseThrough(s,"greatsword",{grade:6,quality:"masterwork"}).state;
  const locked=shop.smithQuote(prior,"greatsword",target);
  assert.equal(locked.requiredFightingLevel,50);
  assert.equal(locked.affordable,true);
  assert.equal(locked.reason,"fighting_level");
  assert.equal(buyEquipment(prior,"greatsword",target,0).purchased,undefined);
  prior.skills.fighting.level=50;
  const poor={...prior,coins:1};
  assert.equal(shop.smithQuote(poor,"greatsword",target).reason,"coins");
  assert.equal(buyEquipment(poor,"greatsword",target,0).purchased,undefined);
  assert.equal(buyEquipment(prior,"greatsword",final,0).purchased,undefined);
  const staged=purchaseThrough(prior,"greatsword",final).state;
  assert.equal(staged.coins,10000000-shop.equipmentPrice(final),"full credit must not charge twice");
  assert.deepEqual(staged.equipment.greatsword,final);
  assert.equal(buyEquipment(staged,"greatsword",final,0).purchased,undefined);
  const {arenaReward}=await import("../site/play/arena-wallet.mjs");
  const {BOUT_MS}=await import("../site/play/combat.mjs");
  assert.ok(shop.equipmentPrice({grade:7,quality:"poor"})>Math.floor(30*86400000/BOUT_MS)*arenaReward(0));
});
test("ALPHA-GEAR-001 normal Fighting cannot reach the S purchase gate in 30 days",async()=>{
  const e=await import("../site/play/engine.mjs");
  const shop=await import("../site/play/smith.mjs");
  const a=e.ACTIVITIES.fighting, normalCycle=a.baseMinutes*e.BASE_CYCLE_MS/a.speed;
  const maximum=Math.floor(30*e.DAY_MS/normalCycle)*
    Math.ceil(a.xp*e.SKILL_BALANCE.maxEfficiency*(1+e.SKILL_BALANCE.batchVariation));
  assert.ok(maximum<e.xpForLevel(shop.equipmentUnlockLevel(7)));
});
test("ALPHA-GEAR-001 attempting S cannot artificially accelerate productive Fighting XP",async()=>{
  const e=await import("../site/play/engine.mjs");
  const {awardAttributeTime}=await import("../site/play/attributes.mjs");
  let s=e.newGame(0);s.skills.fighting={level:30,xp:0};
  s.attributeEffort=awardAttributeTime(s.attributeEffort,"fighting",180*e.DAY_MS);
  s=e.chooseActivity(s,"fighting",0,()=>.5).state;
  // Developer fixture for a fixed-stage reward comparison, not a player action.
  const high={...s,difficulties:{...s.difficulties,fighting:7},autoFight:{stage:7,streak:0,blocked:-1,highest:-1}};
  const lowResult=e.settle(s,5*e.MINUTE_MS,()=>.5);
  const highResult=e.settle(high,5*e.MINUTE_MS,()=>.5);
  assert.ok(highResult.state.skills.fighting.xp<=lowResult.state.skills.fighting.xp);
});

test("A4 Max Stats uses the six-month normal specialist floor, not all mastery tracks",()=>{
  assert.equal(ALPHA_TOOLS_ENABLED,true);
  const fresh=newGame(0);
  const boosted=alphaMaxStats(fresh,"plate",0,midpoint).state;
  assert.equal(boosted.skills.fighting.level,52);
  const attrs=effectiveAttributeProgress(boosted.attributeEffort,boosted.skills);
  assert.deepEqual(Object.fromEntries(Object.entries(attrs).map(([id,v])=>[id,v.value])),{STR:149,DEX:149,END:137});
  assert.equal(boosted.expertise.greatsword,4235*14400000);
  assert.equal(boosted.expertise.plate,4213*14400000);
  for(const id of Object.keys(boosted.expertise).filter(id=>!["greatsword","plate"].includes(id)))assert.equal(boosted.expertise[id],0);
  assert.deepEqual(boosted.expertise,boosted.expertiseActive);
  assert.deepEqual(boosted.equipment,fresh.equipment);
  assert.deepEqual(boosted.items,fresh.items);
  assert.equal(boosted.coins,0);
  assert.equal(boosted.settledAtMs,0);
  assert.deepEqual(readSave(JSON.stringify(boosted)),boosted);
  assert.deepEqual(alphaMaxStats(boosted,"plate",0,midpoint).state,boosted);
  const better={...boosted,skills:{...boosted.skills,fighting:{level:60,xp:5}},
    attributeEffort:{...boosted.attributeEffort,STR:boosted.attributeEffort.STR+1},
    expertise:{...boosted.expertise,bow:14400000}};
  const next=alphaMaxStats(better,"plate",0,midpoint).state;
  assert.deepEqual(next.skills,better.skills);
  assert.deepEqual(next.attributeEffort,better.attributeEffort);
  assert.equal(next.expertise.bow,14400000);
  assert.throws(()=>alphaMaxStats(fresh,"unknown",0,midpoint),RangeError);
});
test("A4 grants exactly 100000 coins separately, preserves old settlement and rejects overflow",()=>{
  const fresh=newGame(0);
  const one=alphaGrantCoins(fresh,0,midpoint).state;
  const two=alphaGrantCoins(one,0,midpoint).state;
  assert.deepEqual(two,{...fresh,coins:200000});
  assert.throws(()=>alphaGrantCoins({...fresh,coins:Number.MAX_SAFE_INTEGER},0,midpoint),RangeError);
  const fighting=chooseActivity(fresh,"fighting",0,midpoint).state;
  const normal=enterGame(fighting,HOUR_MS,midpoint).state;
  const grant=alphaGrantCoins(fighting,HOUR_MS,midpoint).state;
  assert.deepEqual(grant,{...normal,coins:normal.coins+100000});
  const max=alphaMaxStats(fighting,"leather",HOUR_MS,midpoint).state;
  assert.equal(max.coins,normal.coins);
  assert.deepEqual(max.combatSession,normal.combatSession);
  assert.equal(max.settledAtMs,normal.settledAtMs);
  assert.equal(max.skills.fighting.level,52);
  assert.equal(max.expertise.leather,4213*14400000);
  assert.equal(max.expertise.plate,0);
});