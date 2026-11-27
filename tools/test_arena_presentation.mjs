import test from "node:test";
import assert from "node:assert/strict";
import {BOUT_MS} from "../site/play/combat.mjs";
import {teamCombatAtTime,startTeamSession,settleTeamSession} from "../site/play/team-timeline.mjs";
import {newManagerGame} from "../site/play/manager-lanes.mjs";
import {desiredArenaTeam} from "../site/play/engine.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {buildBattlePreview,battlePercentage,battlePreviewKey,committedBattleResult} from "../site/play/arena-presentation.mjs";
function fixture(seed=73){
 const s=newManagerGame(0),session=startTeamSession(desiredArenaTeam(s),s.teamwork.level,seed);
 return {...s,combatSession:{...session,elapsedMs:BOUT_MS-1000}};
}
test("frozen actual arena, static start stats, no invented enemy tactic, pure presentation",()=>{
 const s=fixture(),session=s.combatSession,raw=JSON.stringify(session),p=buildBattlePreview(session),r=teamCombatAtTime(session);
 assert.equal(p.environment.id,r.terrain.id);assert.ok(ARENAS.some(a=>a.id===p.environment.id));
 assert.equal(p.players.length,2);assert.equal(p.enemies.length,2);
 assert.equal(p.players[0].tactic,"balanced");assert.equal(p.enemies[0].tactic,null);
 for(const [side,roster] of [["player",p.players],["enemy",p.enemies]])for(let i=0;i<2;i++){
  assert.equal(roster[i].hp,r.events[0].vitals[side+":"+i].maxHP);
  assert.equal(roster[i].armour,r.events[0].vitals[side+":"+i].maxArmour);
 }
 assert.equal(battlePercentage(session),99);
 assert.equal(battlePreviewKey(session),battlePreviewKey({...session,elapsedMs:10}));
 assert.equal(battlePercentage({...session,elapsedMs:10}),0);
 assert.equal(JSON.stringify(session),raw);
});
test("only exact committed result and reward reveal frozen roster at 100",()=>{
 for(let seed=0;seed<20;seed++){
  const old=fixture(seed),p=buildBattlePreview(old.combatSession),r=settleTeamSession(old.combatSession,1000);
  const out={state:{...old,combatSession:r.session},reports:[{arena:r}]},actual=committedBattleResult(old,out,p);
  assert.equal(actual.outcome,p.outcome);assert.equal(actual.coins,p.reward);assert.deepEqual(actual.preview,p);
  assert.equal(committedBattleResult(old,{...out,reports:[]},p),null);
  assert.equal(committedBattleResult(null,out,p).preview,null);
  assert.equal(committedBattleResult(old,out,{...p,key:"wrong"}).preview,null);
 }
});
test("aggregated absence reports cannot be assigned to one frozen roster",()=>{
 const old=fixture(),p=buildBattlePreview(old.combatSession),r=settleTeamSession(old.combatSession,BOUT_MS+1000);
 const actual=committedBattleResult(old,{state:{...old,combatSession:r.session},reports:[{arena:r}]},p);
 assert.equal(actual.bouts,2);assert.equal(actual.preview,null);assert.equal(actual.outcome,null);
 assert.equal(actual.coins,r.coins);
});
