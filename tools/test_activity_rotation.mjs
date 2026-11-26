import test from "node:test";
import assert from "node:assert/strict";
import * as e from "../site/play/engine.mjs";
import * as m from "../site/play/manager-lanes.mjs";
import {WORK_ROTATION,ingredientReserve,nextRotationActivity,workEligible} from "../site/play/activity-rotation.mjs";
const rng=()=>.5;
const total=s=>Object.values(s.attributeEffort).reduce((a,b)=>a+b,0);
test("all ten noncombat skills exactly once; skip blocked craft",()=>{
  assert.equal(WORK_ROTATION.length,10);
  const s=m.newManagerGame(0,"farming");
  assert.equal(nextRotationActivity(s,"farming"),"training");
  s.items.iron_ore=1;
  assert.equal(nextRotationActivity(s,"farming"),"smithing");
  assert.equal(nextRotationActivity(s,"training"),"hunting");
});
test("reserve bounded, surplus tribute exact, legacy still takes all",()=>{
  const s=m.newManagerGame(0,"mining");s.skills.mining.xp=e.xpToNextLevel(1);
  s.items.iron_ore=1000;s.items.stone=1000;s.items.limestone=1000;s.items.straw=17;
  const reserve=ingredientReserve(s);
  assert.equal(reserve.iron_ore,20);assert.equal(reserve.stone,20);
  assert.equal(reserve.limestone,reserve.stone);assert.equal(reserve.straw,undefined);
  const out=m.enterManagerGame(s,0,rng);
  for(const key of ["iron_ore","stone","limestone"]){
    assert.equal(out.state.items[key],reserve[key]);assert.equal(out.mastery.tribute[key],1000-reserve[key]);
  }
  assert.equal(out.state.items.straw,17);
  assert.equal(e.automateSettledProgress({state:s}).state.items.iron_ore,0);
});
test("level claim rotates, travel earns no work effort, combat continues",()=>{
  let s=m.newManagerGame(0,"hunting");s.skills.hunting.xp=e.xpToNextLevel(1)-1;
  s.managerWork.progressMs=e.ACTIVITIES.hunting.durationMs-1;
  const first=m.settleManagerLive(s,1,rng).state;
  assert.equal(first.managerWork.activity,"fishing");assert.ok(first.managerWork.travelMs>0);
  const end=1+Math.min(first.managerWork.travelMs,10000);
  const travel=m.settleManagerOffline(first,end,rng);
  assert.equal(travel.effort.workMs,0);assert.ok(travel.effort.combatMs>0);
  assert.equal(travel.state.skills.fishing.xp,0);
  const arrived=m.settleManagerOffline(travel.state,end+travel.state.managerWork.travelMs+10000,rng);
  assert.ok(arrived.state.skills.fishing.xp>0);assert.equal(arrived.state.managerWork.travelMs,0);
  assert.ok(total(arrived.state)<=arrived.state.settledAtMs*100);
});
test("depleted craft rotates with partial XP, no fake resources",()=>{
  let s=m.newManagerGame(0,"smithing");s.items.iron_ore=1;
  let r=m.settleManagerLive(s,10000,rng);
  assert.equal(r.state.items.iron_ore,0);assert.equal(r.state.items.iron_ingot,1);
  assert.ok(r.state.skills.smithing.xp>0);assert.equal(r.state.skills.smithing.level,1);
  assert.equal(r.state.managerWork.activity,"training");
  assert.equal(workEligible(r.state,"smithing"),false);
});
test("offline waits at current cap, entry rotates once without replay",()=>{
  const s=m.newManagerGame(0,"hunting"),end=20*e.DAY_MS;
  const r=m.settleManagerOffline(s,end,rng);
  assert.equal(r.state.managerWork.activity,"hunting");
  assert.equal(r.state.skills.hunting.level,1);
  assert.equal(r.state.skills.fishing.xp,0);
  const entered=m.enterManagerGame(r.state,end,rng);
  assert.equal(entered.state.managerWork.activity,"fishing");
  assert.equal(entered.state.skills.hunting.level,2);
  assert.deepEqual(m.enterManagerGame(entered.state,end,rng).state,entered.state);
});
test("seeded repeated rotation advances every activity with exact material ledger",()=>{
  let s=m.newManagerGame(0);let seed=918273;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const visits=new Set();let steps=0;
  // Use real offline + entry path one cap per visit, no balance sweep.
  for(;steps<100&&WORK_ROTATION.some(id=>s.skills[id].level<2);steps++){
    visits.add(s.managerWork.activity);const previous=s;
    const out=m.enterManagerGame(s,s.settledAtMs+e.DAY_MS,random);
    for(const key of e.ITEM_KEYS){
      let expected=previous.items[key];
      for(const r of out.reports??[])expected+=(r.items?.[key]??0)-(r.consumed?.[key]??0);
      expected-=out.mastery?.tribute?.[key]??0;
      assert.equal(out.state.items[key],expected,key);assert.ok(expected>=0);
    }
    s=out.state;assert.equal(s.activity,"fighting");
    assert.ok(total(s)<=s.settledAtMs*100);
    assert.deepEqual(m.readManagerGame(JSON.stringify(s)),s);
  }
  assert.equal(visits.size,10);
  assert.ok(WORK_ROTATION.every(id=>s.skills[id].level>=2),JSON.stringify(s.skills));
});
