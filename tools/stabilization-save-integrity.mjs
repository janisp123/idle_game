// S01 read-only save integrity diagnostic. Actual public engine, synthetic fixtures only.
import assert from "node:assert/strict";
import {isDeepStrictEqual} from "node:util";
import {writeFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {newArenaManager,readArenaManager,enterArena,settleArenaLive} from "../site/play/arena-manager.mjs";
import {settleManagerOffline} from "../site/play/manager-lanes.mjs";
import {desiredArenaPlayer,xpToNextLevel} from "../site/play/engine.mjs";
import {alphaMaxStats,parseAlphaClock,alphaTime,setAlphaSpeed,advanceAlphaClock} from "../site/play/alpha-tools.mjs";
import {upgradeBattleGroup,activeGroupIds} from "../site/play/battle-group.mjs";
import {startGroupSession} from "../site/play/battle-group-timeline.mjs";
import {initialGroupRank} from "../site/play/battle-group-rank.mjs";
const now=1800000000000,seed=20261128,rand=()=>.5,day=86400000;
const fresh=()=>enterArena(newArenaManager(now,true),now,rand,now).state;
function maxed(bad=false){
 let s=alphaMaxStats(fresh(),"none",now,rand).state;
 s={...s,battleGroup:upgradeBattleGroup(s.battleGroup,100000000,52).group};
 const shared={...desiredArenaPlayer(s),...(bad?{difficulty:7}:{})};
 return {...s,combatSession:startGroupSession(s.battleGroup,shared,s.teamwork.level,seed,{rules:10,rank:initialGroupRank(7),arenaFavorites:[]})};
}
function read(s){return readArenaManager(JSON.stringify(s));}
function paths(a,b,p="",out=[]){
 if(isDeepStrictEqual(a,b)||out.length>=30)return out;
 if(a&&b&&typeof a==="object"&&typeof b==="object"&&Array.isArray(a)===Array.isArray(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)])){paths(a[k],b[k],p+"/"+k,out);if(out.length>=30)break;}}
 else out.push(p||"/");
 return out;
}
const results=[];
function check(id,fn){try{const evidence=fn();results.push({id,pass:true,evidence});}catch(e){results.push({id,pass:false,error:String(e.message)});}}
const snapshot=s=>({coins:s.coins,fighting:s.skills.fighting,battleGroup:s.battleGroup,groupAnalytics:s.groupAnalytics,teamwork:s.teamwork,combatSession:s.combatSession,alphaClan:s.alphaClan});
check("S00 invalid fixture hypothesis",()=>{
 const old=maxed(true),correct=maxed();
 assert.equal(old.combatSession.players.member1.difficulty,7);
 assert.equal(old.autoFight.stage,0);
 const oldMid=enterArena(old,now+500,rand,now+500).state;
 const correctMid=enterArena(correct,now+500,rand,now+500).state;
 assert.equal(read(oldMid),null);
 assert.deepEqual(read(correctMid),correctMid);
 assert.equal(correct.combatSession.rank.grade,7);
 return {oldFrozenGrade:old.combatSession.players.member1.difficulty,actualStage:old.autoFight.stage,correctedFrozenGrade:correct.combatSession.players.member1.difficulty,rank:correct.combatSession.rank.grade,oldAccepted:!!read(oldMid),correctAccepted:!!read(correctMid)};
});
for(const [label,make] of [["fresh",fresh],["maxed",maxed]]){
 check(label+" entry and live boundaries",()=>{
  const s=make(),rows=[];
  for(const elapsed of [0,1,500,9999,10000,10001]){
   for(const [kind,fn] of [["entry",enterArena],["live",settleArenaLive]]){
    const next=fn(s,now+elapsed,rand,now+elapsed).state;
    assert.deepEqual(read(next),next,label+" "+kind+" "+elapsed);
    const again=enterArena(read(next),now+elapsed,rand,now+elapsed).state;
    assert.equal(again.coins,next.coins,"duplicate payout");
    assert.deepEqual(again.groupAnalytics,next.groupAnalytics,"duplicate analytics");
    rows.push({kind,elapsed,coins:next.coins,cursor:next.combatSession?.prizeCursor});
   }
  }
  return rows;
 });
 check(label+" frozen offline chunking and caps",()=>{
  const s=make(),end=now+30000;
  const once=settleManagerOffline(s,end,rand).state;
  const part=settleManagerOffline(s,now+12345,rand).state;
  const restored=read(part);assert.ok(restored);
  const twice=settleManagerOffline(restored,end,rand).state;
  const diff=paths(snapshot(once),snapshot(twice));
  // Separate absence chunks must not grant a second login or a duplicate prize.
  assert.equal(twice.coins,once.coins,"offline chunk payout");
  assert.deepEqual(twice.skills.fighting,once.skills.fighting,"offline chunk XP");
  assert.deepEqual(twice.groupAnalytics,once.groupAnalytics,"offline chunk analytics");
  assert.deepEqual(read(twice),twice);
  return {exactSnapshot:diff.length===0,changedPaths:diff,coins:once.coins,cursor:once.combatSession?.prizeCursor};
 });
 check(label+" 24h/7d/30d capped absence",()=>{
  const s=make(),rows=[];
  for(const d of [1,7,30]){
   const next=settleManagerOffline(s,now+d*day,rand).state;
   assert.deepEqual(read(next),next);
   assert.equal(next.skills.fighting.level,s.skills.fighting.level);
   assert.equal(next.skills.fighting.xp,xpToNextLevel(next.skills.fighting.level));
   assert.equal(next.settledAtMs,now+d*day);
   const replay=settleManagerOffline(read(next),next.settledAtMs,rand).state;
   assert.equal(replay.coins,next.coins);assert.deepEqual(replay.groupAnalytics,next.groupAnalytics);
   rows.push({days:d,coins:next.coins,xp:next.skills.fighting.xp,cursor:next.combatSession?.prizeCursor,active:activeGroupIds(next.battleGroup).length});
  }
  for(const r of rows.slice(1)){assert.equal(r.coins,rows[0].coins,"extra reward past cap");assert.equal(r.cursor,rows[0].cursor,"extra bout past cap");}
  return rows;
 });
}
check("malformed and tampered saves rejected",()=>{
 const s=fresh(),cases=[null,"{",JSON.stringify({}),JSON.stringify({...s,coins:-1}),JSON.stringify({...s,settledAtMs:-1}),JSON.stringify({...s,combatSession:{...s.combatSession,prizeCursor:999}})];
 for(const value of cases)assert.equal(readArenaManager(value),null);
 return {rejected:cases.length};
});
check("alpha clock continuity",()=>{
 const c=setAlphaSpeed(null,now,10),t=now+500;
 assert.equal(alphaTime(c,t),now+5000);assert.deepEqual(parseAlphaClock(JSON.stringify(c)),c);
 const slower=setAlphaSpeed(c,t,1);assert.equal(alphaTime(slower,t),now+5000);assert.equal(alphaTime(slower,t+100),now+5100);
 const advanced=advanceAlphaClock(slower,t,day);assert.equal(alphaTime(advanced,t),now+5000+day);
 assert.equal(parseAlphaClock("{"),null);assert.equal(parseAlphaClock({...c,speed:100}),null);
 return {speedSwitchContinuous:true,dayJump:day};
});
const report={commit:execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim(),seed,now,results,limitations:["Synthetic states only; browser storage failures and competing tabs not tested here.","Any failures remain candidates until reproduced and scoped; no production changes."]};
writeFileSync("stabilization-save-integrity.json",JSON.stringify(report,null,2)+"\n");
for(const row of results)console.log("S01_CASE "+JSON.stringify(row));
console.log("S01_SUMMARY "+JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length}));
if(results.some(r=>!r.pass))process.exitCode=1;
