import test from "node:test";
import assert from "node:assert/strict";
import {newManagerGame,settleManagerOffline,settleManagerLive,readManagerGame} from "../site/play/manager-lanes.mjs";
import {desiredArenaTeam,teamFromState} from "../site/play/engine.mjs";
import {captureCloneEnvelope,buildCloneTeam,cloneRewardGrade} from "../site/play/clone-opponents.mjs";
import {startTeamSession,teamCombatAtTime,settleTeamSession,MANAGER_BOUT_MS,isCloneTeamSession} from "../site/play/team-timeline.mjs";
import {ARMOUR_SLOTS} from "../site/play/armour.mjs";
import {equipmentPrice,SMITH_BALANCE} from "../site/play/smith.mjs";
import {expertiseThreshold} from "../site/play/expertise.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {xpForAttributeValue,totalMasteryAttributeBonuses} from "../site/play/attributes.mjs";
import {teamArenaReward} from "../site/play/team-timeline.mjs";
const rng=()=>.5;
function max(){
 const s=newManagerGame(0);s.skills.fighting.level=52;s.teamwork.level=50;
 const bonuses=totalMasteryAttributeBonuses(s.skills),target={STR:141,DEX:141,END:129};
 s.attributeEffort=Object.fromEntries(Object.entries(target).map(([id,value])=>[id,xpForAttributeValue(value-bonuses[id])*3600000]));s.attributeEffortActive={...s.attributeEffort};
 const team=teamFromState(s);
 for(const [i,id] of ["first","second"].entries()){
  const g=team[id],family=i?"leather":"plate";
  g.armour=Object.fromEntries(ARMOUR_SLOTS.map(({id})=>[id,family]));
  for(const key of [g.combatLoadout,...ARMOUR_SLOTS.map(({id})=>id+":"+family)])g.equipment[key]={grade:7,quality:"masterwork"};
  g.expertise[g.combatLoadout]=expertiseThreshold(7);g.expertise[family]=expertiseThreshold(7);g.expertiseActive={...g.expertise};
  s.managerTactics[id].skills.balanced.level=50;
 }
 return {...s,...team.first,teamSecond:team.second};
}
test("max-only clone uses identical real gear, mastery, stats, tactics and teamwork budgets independently of active selection",()=>{
 const s=max(),p=desiredArenaTeam(s),team=teamFromState(s),e=captureCloneEnvelope(team,s.managerTactics,52);
 const seen=new Set();
 for(let seed=0;seed<100;seed++){
  const rivals=buildCloneTeam(e,p.first,seed);assert.deepEqual(rivals,buildCloneTeam(e,p.first,seed));
  for(const [i,r] of rivals.entries()){
   assert.equal(r.skill,p.first.skill);assert.equal(r.str,p.first.str);assert.equal(r.dex,p.first.dex);assert.equal(r.end,p.first.end);assert.equal(r.tacticLevel,50);
   assert.ok(Object.values(r.trainingKit.equipment).every(g=>g.grade===7&&g.quality==="masterwork"));
   assert.equal(r.condition.weapon.proficiency,1);seen.add(r.loadout+":"+r.tactic);
   assert.ok(Object.entries(r.trainingKit.equipment).reduce((n,[k,v])=>n+equipmentPrice(v)+(k.includes(":")?SMITH_BALANCE.firstArmourCost:0),0)<=e.roster[i].budget);
  }
 }
 assert.ok(seen.size>=10);assert.equal(cloneRewardGrade(52),7);
 const changed={...team,first:{...team.first,combatLoadout:"hammer"}};
 assert.deepEqual(captureCloneEnvelope(changed,s.managerTactics,52),e);
});
test("clone timeline is frozen, exact and bounded; real tactic/armour analytics",()=>{
 const s=max(),p=desiredArenaTeam(s),e=captureCloneEnvelope(teamFromState(s),s.managerTactics,52),session=startTeamSession(p,50,73,true,e);
 assert.ok(isCloneTeamSession(session));
 const a=settleTeamSession(session,321*MANAGER_BOUT_MS),x=settleTeamSession(session,101*MANAGER_BOUT_MS+23),y=settleTeamSession(x.session,220*MANAGER_BOUT_MS-23);
 assert.equal(a.bouts,x.bouts+y.bouts);assert.equal(a.coins,x.coins+y.coins);assert.deepEqual(a.session,y.session);
 assert.equal(a.analytics.cloneOutcomes.reduce((n,v)=>n+v,0),321);
 assert.ok(Object.keys(a.analytics.tactics).length>=2);assert.ok(Object.keys(a.analytics.armours).length>=2);
 assert.ok(a.sampledBouts<=256);assert.deepEqual(teamCombatAtTime(session),teamCombatAtTime(structuredClone(session)));
});
test("manager creates clone sessions, saves them, and never changes the legacy stage after new results",()=>{
 const s=max(),out=settleManagerOffline(s,60000,rng);assert.ok(isCloneTeamSession(out.state.combatSession));
 assert.equal(out.state.autoFight.stage,s.autoFight.stage);assert.ok(readManagerGame(JSON.stringify(out.state)));
 const a=settleManagerLive(out.state,60000+2000,rng);assert.equal(a.state.autoFight.stage,s.autoFight.stage);
});
test("old in-flight v3 bout is settled unchanged before clone conversion",()=>{
 const s=max(),old=startTeamSession(desiredArenaTeam(s),50,73,true);old.elapsedMs=MANAGER_BOUT_MS-200;s.combatSession=old;
 const expected=settleTeamSession(old,200),actual=settleManagerLive(s,200,rng);
 assert.equal(actual.reports.find(r=>r.arena).arena.coins,expected.coins);
 assert.equal(actual.state.combatSession.prizeCursor,1);assert.ok(isCloneTeamSession(actual.state.combatSession));
});

// Same max-only benchmark as the existing manager endgame suite. Use the
// generated rival population as the actual opponent pool, with paired sides
// and fixed independently selected arenas. Diagnostic only: do not tune
// based on one noisy screening sample or claim these are optimal builds.
test("max-only rival matchup diagnostic, paired-side symmetry and economy",()=>{
 const s=max(),p=desiredArenaTeam(s),e=captureCloneEnvelope(teamFromState(s),s.managerTactics,52);
 assert.deepEqual([p.first.str,p.first.dex,p.first.end],[141,141,129]);
 const catalog=Array.from({length:24},(_,i)=>buildCloneTeam(e,p.first,(20261127+Math.imul(i+1,0x9e3779b9))>>>0));
 const counts={};for(const team of catalog)for(const fighter of team){const key=fighter.loadout;counts[key]=(counts[key]??0)+1;}
 const score=(r)=>r.outcome==="victory"?1:r.outcome==="defeat"?0:.5;
 const byArena={},byBuild=[];let calls=0;
 for(const [i,player] of catalog.entries()){
  const results=[];
  for(const [j,arena] of ARENAS.entries()){
   let wins=0,draws=0,losses=0;
   for(const [k,enemy] of catalog.entries()){
    const seed=(20261127+Math.imul(i+1,0x85ebca6b)+Math.imul(k+1,0xc2b2ae35)+j)>>>0;
    const a=resolveTeamBattle(player,enemy,seed,arena,{player:50,enemy:50});
    const b=resolveTeamBattle(enemy,player,seed,arena,{player:50,enemy:50});calls+=2;
    for(const r of [a,{outcome:b.outcome==="victory"?"defeat":b.outcome==="defeat"?"victory":b.outcome}]){
     if(r.outcome==="victory")wins++;else if(r.outcome==="defeat")losses++;else draws++;
    }
   }
   results.push({arena:arena.id,wins,losses,draws});
   const agg=byArena[arena.id]??(byArena[arena.id]={wins:0,losses:0,draws:0});agg.wins+=wins;agg.losses+=losses;agg.draws+=draws;
  }
  const n=results.reduce((a,r)=>a+r.wins+r.losses+r.draws,0),wins=results.reduce((a,r)=>a+r.wins,0),draws=results.reduce((a,r)=>a+r.draws,0);
  byBuild.push({build:player.map(r=>[r.loadout,r.trainingKit.armour.head,r.tactic].join(":")).join("+"),winRate:wins/n,score:(wins+.5*draws)/n,results});
 }
 const mirror=catalog[0],mirrorResult=resolveTeamBattle(mirror,mirror,12345,ARENAS[0],{player:50,enemy:50});
 const rates=byBuild.map(b=>b.winRate);
 assert.equal(calls,5760);assert.equal(Object.keys(counts).length,5);assert.ok(rates.every(n=>n>=0&&n<=1));
 const result={profile:{str:141,dex:141,end:129,skill:52,gear:"S Masterwork",tactic:50,teamwork:50},seed:20261127,calls,weaponCounts:counts,byArena,byBuild:byBuild.sort((a,b)=>b.score-a.score),grossCoinsPerHourAt50PercentWins:teamArenaReward(7)*.1*180*.5,mirrorExample:mirrorResult.outcome};
 console.log("NPC_PARITY_MAX_DIAGNOSTIC "+JSON.stringify(result));
});
