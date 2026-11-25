import test from "node:test";
import assert from "node:assert/strict";
import { ARENA_SCHEDULE_BOUTS, BOUT_MS, combatAtTime } from "../site/play/combat.mjs";
import { newGame, chooseActivity, settle, enterGame, readSave, setCombatLoadout, queueStartActivity, HOUR_MS,
  buyEquipment, allAttributeProgress, learnFromMaster, effectiveAttributeProgress, xpToNextLevel } from "../site/play/engine.mjs";
const YEAR = 365 * 24 * 3_600_000;
const STEP_MS = 5_000;
test("changing armour mid-Fighting preserves earned progression and refreshes frozen power",()=>{
  const init=chooseActivity(newGame(0),"fighting",0,()=>.5).state;
  init.items.stone=77;
  init.coins=500;
  const before=settle(init,STEP_MS,()=>.5).state;
  assert.equal(before.combatSession.player.gear.physicalReductionPct,0);
  const oldXP=before.skills.fighting.xp,oldEffort={...before.attributeEffort};
  const changed=buyEquipment(before,"torso:leather",{grade:0,quality:"fine"},STEP_MS,()=>.5).state;
  assert.equal(changed.combatSession,null,"equipping a different piece begins a new fight");
  assert.equal(changed.items.stone,77);
  assert.equal(changed.skills.fighting.xp,oldXP);
  assert.deepEqual(changed.attributeEffort,oldEffort);
  assert.equal(changed.armour.torso,"leather");
  const later=settle(changed,2*STEP_MS,()=>.5).state;
  assert.equal(later.combatSession.player.gear.physicalReductionPct,7);
  assert.equal(later.combatSession.player.gear.totalKg>before.combatSession.player.gear.totalKg,true);
  assert.deepEqual(readSave(JSON.stringify(later)),later);
  // A long offline interval MUST keep the original stats without repeatedly
  // upgrading equipment or retroactively recalculating any absent duels.
  const away=enterGame(before,20*YEAR,()=>.5).state;
  assert.deepEqual(away.combatSession.player.gear,before.combatSession.player.gear);
  assert.equal(away.combatSession.elapsedMs>=20*YEAR,true);
  assert.deepEqual(readSave(JSON.stringify(away)),away);
});

test("claimed levels in ANY activity affect future fighting snapshot without changing past bouts",()=>{
  const s=newGame(0);
  s.skills.mining={level:11,xp:0};

  const playing=chooseActivity(s,"fighting",0,()=>.5).state;
  const first=settle(playing,STEP_MS,()=>.5).state;
  assert.equal(first.combatSession.player.str,17,"ten claimed Mining levels add 7 STR");
  assert.equal(first.combatSession.player.end,13,"ten Mining levels add 3 END");
  assert.equal(first.combatSession.player.dex,10,"other unused attributes remain unchanged");
  assert.equal(first.combatSession.player.skill,1,"Fighting skill itself did not level");
  const beforeSession=first.combatSession.player;
  const persisted=readSave(JSON.stringify(first));
  assert.deepEqual(persisted,first);
  const away=enterGame(persisted,25*365*24*3600_000,()=>.5).state;
  assert.deepEqual(away.combatSession.player,beforeSession,
    "25 years offline keeps original frozen bonus and dice combat power");
  assert.deepEqual(readSave(JSON.stringify(away)),away);
});

test("Skill Master raises stat immediately but restarts a Fighting duel only afterward",()=>{
  const s=newGame(0);
  s.skills.mining={level:1,xp:xpToNextLevel(1)};
  s.items.stone=7;
  const play=chooseActivity(s,"fighting",0,()=>.5).state;
  const prior=settle(play,STEP_MS,()=>.5).state;
  assert.equal(prior.combatSession.player.str,10);
  const skillsBefore=prior.skills.fighting.xp;
  const taught=learnFromMaster(prior,STEP_MS,()=>.5);
  assert.equal(taught.state.skills.mining.level,2);
  assert.equal(taught.state.combatSession,null,
    "new permanent stats should not inherit a stale active Fighting snapshot");
  assert.equal(taught.state.items.stone,0);
  assert.equal(taught.state.skills.fighting.xp,skillsBefore);
  assert.equal(effectiveAttributeProgress(taught.state.attributeEffort,taught.state.skills).STR.value,11);
  const next=settle(taught.state,2*STEP_MS,()=>.5).state;
  assert.equal(next.combatSession.player.str,11);
  assert.equal(next.skills.mining.level,2);
  assert.deepEqual(readSave(JSON.stringify(next)),next);
});

test("style switching settles saved XP/materials and starts a fresh duel",()=>{
  const state=chooseActivity(newGame(0),"fighting",0,()=>.5).state;
  state.items.stone=38;
  const first=settle(state,STEP_MS,()=>.5).state;
  const oldXP=first.skills.fighting.xp,oldEffort={...first.attributeEffort};
  const swapped=setCombatLoadout(first,"sword_shield",STEP_MS,()=>.5);
  assert.equal(swapped.state.combatLoadout,"sword_shield");
  assert.equal(swapped.state.combatSession,null);
  assert.equal(swapped.state.items.stone,38);
  assert.equal(swapped.state.skills.fighting.xp,oldXP);
  assert.deepEqual(swapped.state.attributeEffort,oldEffort);
  assert.deepEqual(readSave(JSON.stringify(swapped.state)),swapped.state);
  const running=settle(swapped.state,STEP_MS+10_000,()=>.5).state;
  assert.equal(running.combatSession.player.loadout,"sword_shield");
  assert.deepEqual(setCombatLoadout(running,"sword_shield",running.settledAtMs,()=>.5).state,running);
  assert.throws(()=>setCombatLoadout(running,"unknown",running.settledAtMs),RangeError);
});
test("Fighting earns time-based stats and capped XP even after 20 offline years",()=>{
  const state=chooseActivity(newGame(0),"fighting",0,()=>.5).state;
  const out=enterGame(state,20*YEAR,()=>.5);
  assert.equal(out.state.combatSession.player.loadout,"greatsword");
  assert.equal(out.state.combatSession.player.str,10);
  assert.equal(out.state.combatSession.elapsedMs,20*YEAR);
  assert.ok(allAttributeProgress(out.state.attributeEffort).STR.value>10);
  assert.equal(out.state.skills.fighting.level,1);
  assert.deepEqual(readSave(JSON.stringify(out.state)),out.state);
});


test("resurrection costs productive time and keeps paid rewards and the frozen gear", () => {
  const state = chooseActivity(newGame(42), "fighting", 42, () => .5).state;
  const started = settle(state, 43, () => .5).state;
  const session = started.combatSession;
  const lost = Array.from({ length: 32 }, (_, index) => index).find(index =>
    combatAtTime({ ...session, elapsedMs: index * BOUT_MS }).outcome !== "victory");
  assert.notEqual(lost, undefined);
  const end = 42 + (lost + 1) * BOUT_MS;
  const beginReturn = settle(started, end - 20_000, () => .5).state;
  assert.equal(combatAtTime(beginReturn.combatSession).recovering, true);
  const returned = settle(beginReturn, end, () => .5).state;
  assert.deepEqual(returned.attributeEffort, beginReturn.attributeEffort);
  assert.equal(returned.coins, beginReturn.coins);
  assert.deepEqual(returned.combatSession.player.condition, session.player.condition);
  assert.equal(combatAtTime(returned.combatSession).event.type, "engage");
});

test("GLAD-005 offline arena summary conserves results, coins and productive time across reloads", () => {
  const start = chooseActivity(newGame(42), "fighting", 42, () => .5).state;
  const end = 42 + 20 * YEAR;
  const whole = enterGame(start, end, () => .5);
  const splitAt = 42 + 43 * BOUT_MS - 7_000;
  const first = enterGame(start, splitAt, () => .5);
  const second = enterGame(readSave(JSON.stringify(first.state)), end, () => .5);
  const { bouts, victories, defeats, doubleDeaths, coins, downtimeMs } = whole.offlineArena;
  assert.ok(whole.offlineArena.sampledBouts <= ARENA_SCHEDULE_BOUTS);
  assert.equal(bouts, Math.floor((end - 42) / BOUT_MS));
  assert.equal(victories + defeats + doubleDeaths, bouts);
  assert.equal(coins, victories * 12);
  assert.equal(whole.state.coins, coins);
  assert.equal(second.state.coins, whole.state.coins);
  assert.equal(first.offlineArena.downtimeMs + second.offlineArena.downtimeMs, downtimeMs);
  assert.deepEqual(second.state.attributeEffort, whole.state.attributeEffort);
  assert.equal(enterGame(whole.state, end, () => .5).offlineArena, undefined);
});

test("GLAD-005 a twenty-year three-wagon claim preserves crafting inputs and frozen arena gear", () => {
  const queue = (state, id, duration) => queueStartActivity(state, id, duration, 0, () => .5).state;
  const start = queue(queue(queue(newGame(0), "farming", null), "cooking", HOUR_MS), "fighting", HOUR_MS);
  const result = enterGame(readSave(JSON.stringify(start)), 20 * YEAR, () => .5);
  assert.deepEqual(result.reports.map(report => report.activity), ["farming", "cooking", "fighting"]);
  const [farm, cooking] = result.reports;
  assert.equal(cooking.consumed.grain, farm.items.grain);
  assert.equal(result.state.items.ration, farm.items.grain);
  assert.equal(result.state.items.straw, farm.items.straw);
  assert.equal(result.state.combatSession.player.str, 10);
  assert.deepEqual(result.state.equipment, start.equipment);
  assert.ok(result.offlineArena.sampledBouts <= ARENA_SCHEDULE_BOUTS);
  assert.equal(result.state.coins, result.offlineArena.victories * 12);
  assert.ok(Object.values(result.state.skills).every(skill => skill.level === 1));
});
