import assert from "node:assert/strict";
import {initialTeam,teamSnapshots,chooseTeamWeapon,awardTeamPractice} from "../site/play/team.mjs";
import {initialTeamwork,awardTeamwork} from "../site/play/teamwork.mjs";
import {ARENA_SCHEDULE_BOUTS,BOUT_MS,RESURRECTION_MS} from "../site/play/combat.mjs";
import {arenaReward} from "../site/play/arena-wallet.mjs";
import {startTeamSession,validTeamSession,teamCombatAtTime,settleTeamSession,applyTeamSettlement,teamArenaReward,TEAM_REWARD_PERCENT} from "../site/play/team-timeline.mjs";

const seed=20261126,team=initialTeam(),shared={str:10,dex:10,end:10,skill:1,difficulty:0};
const snapshots=teamSnapshots(team,shared),session=startTeamSession(snapshots,1,seed);
const clone=JSON.parse(JSON.stringify(session));
assert.ok(validTeamSession(clone));
assert.deepEqual(clone,session);
snapshots.first.str=999;
assert.equal(session.players.first.str,10,"frozen snapshot is isolated");
assert.throws(()=>startTeamSession(snapshots,1,seed));
assert.throws(()=>startTeamSession(session.players,51,seed));
assert.throws(()=>startTeamSession(session.players,1,-1));
assert.equal(validTeamSession({...session,prizeCursor:1}),false);
assert.equal(validTeamSession({...session,elapsedMs:BOUT_MS}),false);
assert.equal(validTeamSession({...session,timelineVersion:99}),false);
assert.throws(()=>settleTeamSession(session,-1));
assert.throws(()=>settleTeamSession({...session,prizeCursor:1},BOUT_MS));
assert.deepEqual(teamCombatAtTime(clone),teamCombatAtTime(session));
const fields=["bouts","victories","defeats","doubleDeaths","coins","downtimeMs"];
const sum=rows=>Object.fromEntries(fields.map(k=>[k,rows.reduce((n,r)=>n+r[k],0)]));
const practice=rows=>Object.fromEntries(["first","second"].map(id=>[id,rows.reduce((n,r)=>n+r.practiceMs[id],0)]));
const duration=13*BOUT_MS+BOUT_MS-7000;
const whole=settleTeamSession(session,duration);
let current=session;const parts=[];
for(const dt of [BOUT_MS-10000,20000,3*BOUT_MS,8*BOUT_MS+333,duration-(12*BOUT_MS+10333)]){
  const next=settleTeamSession(current,dt);parts.push(next);current=next.session;
}
assert.deepEqual(current,whole.session);
assert.deepEqual(sum(parts),sum([whole]));
assert.deepEqual(practice(parts),whole.practiceMs);
assert.equal(whole.bouts,whole.victories+whole.defeats+whole.doubleDeaths);
assert.equal(TEAM_REWARD_PERCENT,140);
for(let grade=0;grade<8;grade++)assert.equal(teamArenaReward(grade),Math.round(arenaReward(grade)*1.4));
assert.equal(whole.coins,whole.victories*teamArenaReward(0));
assert.ok(whole.downtimeMs>=0&&whole.downtimeMs<=duration);
const manual={victory:0,defeat:0,double_death:0};
let fallen=0;
for(let i=0;i<whole.bouts;i++){
  const at=teamCombatAtTime(session,(i+1)*BOUT_MS-1);
  manual[at.outcome]++;
  assert.equal(at.event.type,at.outcome);
  assert.ok(at.recovering);
  if(Object.entries(at.survivors).some(([id,hp])=>id.startsWith("player:")&&hp===0))fallen++;
}
assert.deepEqual([whole.victories,whole.defeats,whole.doubleDeaths],[manual.victory,manual.defeat,manual.double_death]);
const partial=teamCombatAtTime(session,duration);
assert.equal(whole.downtimeMs,(manual.defeat+manual.double_death)*RESURRECTION_MS+
  (partial.outcome==="victory"?0:RESURRECTION_MS-7000));
const replay=teamCombatAtTime(session,ARENA_SCHEDULE_BOUTS*BOUT_MS);
const first=teamCombatAtTime(session,0);
assert.deepEqual(replay.events,first.events);
assert.deepEqual(replay.enemies,first.enemies);
assert.equal(replay.bout,first.bout+ARENA_SCHEDULE_BOUTS);
const zero=settleTeamSession(whole.session,0);
assert.deepEqual(sum([zero]),Object.fromEntries(fields.map(k=>[k,0])));
assert.deepEqual(zero.practiceMs,{first:0,second:0});
const period=ARENA_SCHEDULE_BOUTS*BOUT_MS;
const cycle=settleTeamSession(session,period);
const twentyYears=20*365*86400000;
const cycles=Math.floor(twentyYears/period),tail=twentyYears%period;
const long=settleTeamSession(session,twentyYears),rest=settleTeamSession(session,tail);
for(const field of fields)assert.equal(long[field],cycles*cycle[field]+rest[field],field);
for(const id of ["first","second"]){
  assert.equal(long.practiceMs[id],cycles*cycle.practiceMs[id]+rest.practiceMs[id]);
  assert.ok(long.practiceMs[id]<=long.bouts*BOUT_MS);
}
assert.ok(long.sampledBouts<=ARENA_SCHEDULE_BOUTS);
const selected=chooseTeamWeapon(team,"first","hammer"),work=initialTeamwork();
const applied=applyTeamSettlement(selected,work,session,duration);
assert.deepEqual(applied.team,awardTeamPractice(selected,session.players,whole.practiceMs));
assert.deepEqual(applied.teamwork,awardTeamwork(work,whole.bouts));
assert.equal(applied.team.first.combatLoadout,"hammer");
assert.deepEqual(applied.team.first.expertiseActive,team.first.expertiseActive);
assert.deepEqual(applied.team.second.expertiseActive,team.second.expertiseActive);
assert.equal(applyTeamSettlement(team,{level:2,xp:0},session,duration).teamwork.level,2);
assert.throws(()=>applyTeamSettlement(team,work,{...session,teamworkLevel:2},duration));
assert.deepEqual(session,clone,"no input mutation");
console.log(JSON.stringify({teamTimeline:"PASS",seed,manualBouts:whole.bouts,manual,fallen,
  longBouts:long.bouts,longSampled:long.sampledBouts,longCoins:long.coins,
  splitParity:"PASS",frozenBuild:"PASS",exactOnce:"PASS",practiceMs:whole.practiceMs}));
