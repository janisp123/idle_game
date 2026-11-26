import test from "node:test";
import assert from "node:assert/strict";
import {newTeamGame,chooseActivity,settle,ACTIVITIES} from "../site/play/engine.mjs";
import {migrateLegacyManager} from "../site/play/manager-migration.mjs";
import {readManagerGame,settleManagerOffline} from "../site/play/manager-lanes.mjs";
const rng=()=>.5;
test("legacy work migration preserves partial progress, resources and paid interval",()=>{
 let s=chooseActivity(newTeamGame(0),"mining",0,rng).state;
 s.name="Legacy";s.coins=123;s.items.iron_ore=3;
 const until=ACTIVITIES.mining.durationMs+123;
 const expected=settle(s,until,rng).state;
 const raw=JSON.stringify(s),r=migrateLegacyManager(raw,until,rng);
 assert.ok(r);const n=r.state;
 assert.equal(n.name,"Legacy");assert.equal(n.coins,expected.coins);assert.deepEqual(n.items,expected.items);
 assert.deepEqual(n.skills,expected.skills);assert.deepEqual(n.equipment,expected.equipment);
 assert.deepEqual(n.teamSecond,expected.teamSecond);assert.deepEqual(n.attributeEffort,expected.attributeEffort);
 assert.equal(n.activity,"fighting");assert.equal(n.managerWork.activity,"mining");
 assert.equal(n.managerWork.progressMs,expected.progressMs);assert.equal(n.settledAtMs,until);
 assert.deepEqual(readManagerGame(JSON.stringify(n)),n);
 assert.deepEqual(settleManagerOffline(n,until,rng).state,n);
 assert.equal(JSON.stringify(s),raw);
});
test("legacy fight migration preserves exact frozen session and original mastery",()=>{
 let s=chooseActivity(newTeamGame(0),"fighting",0,rng).state;
 s=settle(s,123,rng).state;
 const r=migrateLegacyManager(s,s.settledAtMs,rng);assert.ok(r);
 assert.deepEqual(r.state.combatSession,s.combatSession);
 assert.deepEqual(r.state.expertise,s.expertise);assert.deepEqual(r.state.teamwork,s.teamwork);
 assert.equal(r.state.managerWork.activity,"hunting");
 assert.equal(r.state.managerTactics.first.selected,"balanced");
});
test("invalid legacy is rejected without changing its contents",()=>{
 const raw='{"version":-1}';assert.equal(migrateLegacyManager(raw,0,rng),null);
});
