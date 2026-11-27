import test from "node:test";
import assert from "node:assert/strict";
import {BOUT_MS,RESURRECTION_MS} from "../site/play/combat.mjs";
import {MANAGER_BOUT_MS,MANAGER_RESURRECTION_MS,teamBoutMs,teamWinPrize,startTeamSession,settleTeamSession,fasterTeamSession,validTeamSession,teamCombatAtTime} from "../site/play/team-timeline.mjs";
import {newManagerGame,readManagerGame,settleManagerOffline,settleManagerLive} from "../site/play/manager-lanes.mjs";
import {desiredArenaTeam} from "../site/play/engine.mjs";
import {battlePercentage,buildBattlePreview,committedBattleResult} from "../site/play/arena-presentation.mjs";
const rng=()=>.5;
function fixture(seed=73,fast=true){const s=newManagerGame(0);s.skills.fighting.level=52;return {...s,combatSession:startTeamSession(desiredArenaTeam(s),s.teamwork.level,seed,fast)};}
test("manager cadence is 20 seconds with recovery scaled 10:1; legacy timeline unchanged",()=>{
 const fast=fixture(),old=fixture(73,false);
 assert.equal(MANAGER_BOUT_MS,20000);assert.equal(MANAGER_RESURRECTION_MS,2000);
 assert.equal(teamBoutMs(old.combatSession),BOUT_MS);
 assert.equal(teamBoutMs(fast.combatSession),MANAGER_BOUT_MS);
 assert.equal(settleTeamSession(fast.combatSession,19999).bouts,0);
 assert.equal(settleTeamSession(fast.combatSession,20000).bouts,1);
 const a=settleTeamSession(old.combatSession,BOUT_MS*256),b=settleTeamSession(fast.combatSession,MANAGER_BOUT_MS*256);
 assert.equal(a.victories,b.victories);assert.equal(a.defeats,b.defeats);assert.equal(a.doubleDeaths,b.doubleDeaths);
 assert.equal(a.downtimeMs,b.downtimeMs*10);
 assert.equal(a.coins,b.coins*10+b.session.coinRemainder);
 assert.equal(a.teamworkXP,b.teamworkXP*10+b.session.teamworkRemainder);
 const hourlyOld=settleTeamSession(old.combatSession,BOUT_MS*256),hourlyFast=settleTeamSession(fast.combatSession,BOUT_MS*256);
 assert.equal(hourlyOld.coins,hourlyFast.coins);
 assert.equal(hourlyOld.teamworkXP,hourlyFast.teamworkXP);
 assert.equal(hourlyOld.downtimeMs,hourlyFast.downtimeMs);
});
test("fractional rewards and practice remain exact over split offline settlements",()=>{
 const s=fixture().combatSession,end=13*MANAGER_BOUT_MS+19777;
 const all=settleTeamSession(s,end);let next=s,coins=0,xp=0,downtime=0,first=0,second=0;
 for(const dt of [123,20000,123456,end-143579]){
  const r=settleTeamSession(next,dt);next=r.session;coins+=r.coins;xp+=r.teamworkXP;downtime+=r.downtimeMs;first+=r.practiceMs.first;second+=r.practiceMs.second;
 }
 assert.deepEqual(next,all.session);assert.equal(coins,all.coins);assert.equal(xp,all.teamworkXP);assert.equal(downtime,all.downtimeMs);assert.deepEqual({first,second},all.practiceMs);
 assert.equal(validTeamSession({...next,coinRemainder:10}),false);
});
test("migrate paid legacy cursor and fractional unfinished progress without replay",()=>{
 const old=fixture(73,false);old.combatSession=settleTeamSession(old.combatSession,3*BOUT_MS+123456).session;
 const next=readManagerGame(old);assert.ok(next);assert.equal(next.coins,old.coins);
 assert.equal(next.combatSession.prizeCursor,3);assert.equal(next.combatSession.elapsedMs,3*MANAGER_BOUT_MS+12345);
 assert.deepEqual(next.combatSession.players,old.combatSession.players);
 assert.deepEqual(readManagerGame(JSON.stringify(next)),next);
 assert.equal(settleTeamSession(next.combatSession,0).bouts,0);
});
test("live committed 20-second result shows actual fractional prize and next bout",()=>{
 const s=fixture();s.combatSession.elapsedMs=19800;
 const p=buildBattlePreview(s.combatSession);assert.equal(battlePercentage(s.combatSession),99);
 const out=settleManagerLive(s,200,rng),r=committedBattleResult(s,out,p);
 assert.ok(r?.preview);assert.equal(r.coins,p.reward);assert.equal(r.outcome,p.outcome);
 assert.equal(out.state.combatSession.prizeCursor,1);assert.equal(battlePercentage(out.state.combatSession),0);
 assert.deepEqual(readManagerGame(JSON.stringify(out.state)),out.state);
});
test("new manager settlement starts fast, legacy fixtures remain old",()=>{
 const s=settleManagerOffline(newManagerGame(0),10000,rng).state;
 assert.equal(teamBoutMs(s.combatSession),MANAGER_BOUT_MS);
 assert.deepEqual(readManagerGame(JSON.stringify(s)),s);
});
