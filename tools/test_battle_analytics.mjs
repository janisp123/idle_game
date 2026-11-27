import test from "node:test";
import assert from "node:assert/strict";
import {newManagerGame,readManagerGame,settleManagerOffline} from "../site/play/manager-lanes.mjs";
import {desiredArenaTeam} from "../site/play/engine.mjs";
import {MANAGER_BOUT_MS,startTeamSession,settleTeamSession,teamCombatAtTime} from "../site/play/team-timeline.mjs";
import {blankBattleAnalytics,accumulateBattleAnalytics,validBattleAnalytics,analyticsSummary,newBattleDelta,recordBattleGroup} from "../site/play/battle-analytics.mjs";
const rng=()=>.5;
const fixture=()=>{const s=newManagerGame(0);s.skills.fighting.level=52;return s;};
test("actual frozen outcomes, environments and opponent team counters match direct resolver",()=>{
 const s=fixture(),session=startTeamSession(desiredArenaTeam(s),s.teamwork.level,73,true);
 const batch=settleTeamSession(session,20*MANAGER_BOUT_MS),expected=newBattleDelta(session.players);
 for(let i=0;i<20;i++){const r=teamCombatAtTime(session,i*MANAGER_BOUT_MS);recordBattleGroup(expected,r.outcome,r.terrain.id,r.enemies.map(e=>e.loadout),1);}
 expected.coins=batch.coins;expected.ms=20*MANAGER_BOUT_MS;
 assert.deepEqual(batch.analytics,expected);
 const all=accumulateBattleAnalytics(blankBattleAnalytics(),[batch.analytics]);assert.ok(validBattleAnalytics(all));assert.equal(analyticsSummary(all.all).battles,20);
});
test("large repeated schedule and split settlements preserve counts, coins and hours",()=>{
 const s=fixture(),session=startTeamSession(desiredArenaTeam(s),s.teamwork.level,73,true),duration=1001*MANAGER_BOUT_MS+73;
 const all=settleTeamSession(session,duration),a=settleTeamSession(session,301*MANAGER_BOUT_MS+123),b=settleTeamSession(a.session,duration-(301*MANAGER_BOUT_MS+123));
 assert.deepEqual(accumulateBattleAnalytics(blankBattleAnalytics(),[all.analytics]),accumulateBattleAnalytics(blankBattleAnalytics(),[a.analytics,b.analytics]));
 assert.ok(all.sampledBouts<=256);
});
test("saved manager counts committed battle report only, not wallet credits; old save begins empty",()=>{
 const s=fixture();delete s.battleAnalytics;const loaded=readManagerGame(s);assert.deepEqual(loaded.battleAnalytics,blankBattleAnalytics());
 const out=settleManagerOffline(loaded,60000,rng),a=out.state.battleAnalytics,report=out.reports.find(r=>r.activity==="fighting");
 assert.ok(report?.arena?.bouts>0);assert.equal(analyticsSummary(a.all).battles,report.arena.bouts);assert.equal(a.all.coins,report.arena.coins);
 assert.deepEqual(readManagerGame(JSON.stringify({...out.state,coins:out.state.coins+100000})).battleAnalytics,a);
 assert.equal(readManagerGame({...out.state,battleAnalytics:{version:1}}),null);
});
test("latest setup starts new counters, lifetime retains both; duplicate enemy weapon counted once",()=>{
 const s=fixture(),d=newBattleDelta(desiredArenaTeam(s));recordBattleGroup(d,"victory","open_field",["bow","bow"],1);d.coins=5;d.ms=20000;
 const e={...structuredClone(d),key:"bow:plate:defensive|bow:plate:defensive"};
 const result=accumulateBattleAnalytics(blankBattleAnalytics(),[d,e]);assert.equal(result.all.outcomes[0],2);assert.equal(result.latest.stats.outcomes[0],1);assert.equal(result.all.weapons.bow[0],2);
});
