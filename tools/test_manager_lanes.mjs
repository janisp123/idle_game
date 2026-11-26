import test from "node:test";
import assert from "node:assert/strict";
import * as e from "../site/play/engine.mjs";
import * as m from "../site/play/manager-lanes.mjs";
const rng=()=>.5;
const effort=s=>Object.values(s.attributeEffort).reduce((a,b)=>a+b,0);
test("both lanes run with one shared attribute budget",()=>{
  const s=m.newManagerGame(0,"hunting"),end=10000;
  const r=m.settleManagerOffline(s,end,rng);
  assert.ok(r.state.skills.fighting.xp>0);assert.ok(r.state.skills.hunting.xp>0);
  assert.ok(r.state.items.hide>0);assert.equal(effort(r.state),100*end);
  assert.equal(r.effort.combatTime+r.effort.workTime,end);
  assert.equal(r.state.activity,"fighting");
  assert.ok(r.state.combatSession);
});
test("separate cap and frozen offline settlement, no replay",()=>{
  const s=m.newManagerGame(0,"hunting"),end=20*365*e.DAY_MS;
  const r=m.settleManagerOffline(s,end,rng);
  for(const id of ["fighting","hunting"]){
    assert.equal(r.state.skills[id].level,1);
    assert.equal(r.state.skills[id].xp,e.xpToNextLevel(1));
  }
  assert.ok(effort(r.state)<=end*100);
  const again=m.settleManagerOffline(r.state,end,rng);
  assert.deepEqual(again.state,r.state);
  const returned=m.enterManagerGame(r.state,end,rng);
  assert.equal(returned.state.skills.fighting.level,2);
  assert.equal(returned.state.skills.hunting.level,2);
  assert.ok(returned.state.items.hide>0,"real construction inputs retained");
  assert.equal(returned.state.managerWork.activity,"fishing");
});
test("foreground advances a work skill without interrupting current combat",()=>{
  let s=m.newManagerGame(0,"hunting");
  s.skills.hunting.xp=e.xpToNextLevel(1)-1;
  s.managerWork.progressMs=e.ACTIVITIES.hunting.durationMs-1;
  const r=m.settleManagerLive(s,1,rng);
  assert.equal(r.state.skills.hunting.level,2);assert.equal(r.levelsGained.hunting,1);
  assert.ok(r.state.combatSession);assert.equal(r.state.activity,"fighting");
  const next=m.settleManagerLive(r.state,2,rng);
  assert.equal(next.state.combatSession.seed,r.state.combatSession.seed);
  assert.equal(next.state.managerWork.activity,"fishing");
  assert.equal(next.state.managerWork.progressMs,0);
  assert.ok(next.state.managerWork.travelMs>0);
});
test("blocked production grants no work effort and combat continues",()=>{
  const s=m.newManagerGame(0,"smithing");
  const r=m.settleManagerOffline(s,10000,rng);
  assert.equal(r.effort.workMs,0);assert.equal(r.state.skills.smithing.xp,0);
  assert.ok(r.state.skills.fighting.xp>0);
  assert.equal(r.state.items.iron_ingot,0);
  assert.equal(effort(r.state),r.effort.combatMs*100);
});
test("production uses actual inventory, no phantom inputs",()=>{
  const s=m.newManagerGame(0,"smithing");s.items.iron_ore=1;
  const r=m.settleManagerOffline(s,30000,rng);
  assert.equal(r.state.items.iron_ore,0);assert.equal(r.state.items.iron_ingot,1);
  assert.equal(r.effort.workMs,e.ACTIVITIES.smithing.durationMs);
  assert.ok(r.state.skills.smithing.xp>0);
});
test("save roundtrip, invalid work and backward clock",()=>{
  const s=m.settleManagerOffline(m.newManagerGame(0),10001,rng).state;
  assert.deepEqual(m.readManagerGame(JSON.stringify(s)),s);
  assert.equal(m.readManagerGame({...s,managerWork:{activity:"fighting",progressMs:0}}),null);
  assert.equal(m.readManagerGame({...s,overlapParity:2}),null);
  assert.deepEqual(m.settleManagerOffline(s,0,rng).state,s);
});
test("internal rotation hook keeps earned XP and frozen combat session",()=>{
  const s=m.settleManagerOffline(m.newManagerGame(0),10000,rng).state;
  const n=m.assignManagerWork(s,"training");
  assert.deepEqual(n.skills,s.skills);assert.deepEqual(n.combatSession,s.combatSession);
  assert.deepEqual(n.items,s.items);assert.equal(n.managerWork.activity,"training");
});
