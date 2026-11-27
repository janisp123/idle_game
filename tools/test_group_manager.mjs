import test from "node:test";
import assert from "node:assert/strict";
import {newManagerGame,newBattleGroupManager,enableBattleGroupManager,readManagerGame,settleManagerLive,settleManagerOffline,chooseManagerGroupClass} from "../site/play/manager-lanes.mjs";
import {GROUP_IDS,validBattleGroup} from "../site/play/battle-group.mjs";
import {validGroupAnalytics} from "../site/play/battle-group-analytics.mjs";
import {groupCombatAtTime,GROUP_BOUT_MS,validGroupSession} from "../site/play/battle-group-timeline.mjs";
import {arenaBoutProgress} from "../site/play/engine.mjs";
const rand=()=>.5,now=2026112700;
test("opted-in manager uses ten-second actual battles and persists truthful class analytics",()=>{
 let s=newBattleGroupManager(now);assert.equal(GROUP_BOUT_MS,10000);
 s=settleManagerLive(s,now+5000,rand).state;assert.equal(arenaBoutProgress(s),.5);assert.ok(validGroupSession(s.combatSession));assert.equal(groupCombatAtTime(s.combatSession).enemies.length,7);
 s=settleManagerLive(s,now+10000,rand).state;assert.equal(s.groupAnalytics.all.ms,10000);assert.equal(s.groupAnalytics.all.outcomes.reduce((a,b)=>a+b,0),1);assert.equal(s.battleAnalytics.all.ms,0);
 assert.ok(validBattleGroup(s.battleGroup));assert.ok(validGroupAnalytics(s.groupAnalytics));assert.deepEqual(readManagerGame(JSON.stringify(s)).groupAnalytics,s.groupAnalytics);
});
test("old partial battle settles once before ten-second group begins; carry survives",()=>{
 const old=settleManagerLive(newManagerGame(now),now+5000,rand).state;
 const s=enableBattleGroupManager(old),a=settleManagerOffline(s,now+20000,rand).state;
 assert.equal(a.battleAnalytics.all.outcomes.reduce((x,y)=>x+y,0),1);
 assert.ok(validGroupSession(a.combatSession));assert.equal(a.combatSession.elapsedMs,0);assert.equal(a.groupAnalytics.all.ms,0);
 assert.equal(a.combatSession.teamworkRemainder,(old.combatSession.teamworkRemainder+1)*2);
 const b=settleManagerOffline(a,now+30000,rand).state;
 assert.equal(b.battleAnalytics.all.ms,20000);assert.equal(b.groupAnalytics.all.ms,10000);assert.ok(readManagerGame(JSON.stringify(b)));
});
test("class change mid-bout credits frozen member and keeps original legacy gear",()=>{
 let s=settleManagerLive(newBattleGroupManager(now),now+4000,rand).state;
 const old=s.combatSession.players.member1.classId,legacy=structuredClone(s.equipment);
 s=chooseManagerGroupClass(s,"member1","human","Rogue","trickblade",now+4000,rand).state;
 assert.equal(s.combatSession.players.member1.classId,old);
 s=settleManagerLive(s,now+10000,rand).state;
 assert.equal(s.battleGroup.member1.classes.trickblade.mastery.xp,0);
 assert.deepEqual(s.equipment,legacy);
 assert.ok(validBattleGroup(s.battleGroup));assert.equal(Object.keys(s.battleGroup).length,GROUP_IDS.length);
});
