import test from "node:test";
import assert from "node:assert/strict";
import {ARMOUR_SLOTS} from "../site/play/armour.mjs";
import {STARTER_ITEM,smithQuote} from "../site/play/smith.mjs";
import * as m from "../site/play/manager-lanes.mjs";
import * as g from "../site/play/manager-equipment.mjs";
const rng=()=>.5;
const owned=(s,id)=>id==="first"?s:s.teamSecond;
const family=(s,id)=>g.equippedArmourFamily(owned(s,id));
const pieceIds=f=>ARMOUR_SLOTS.map(slot=>slot.id+":"+f);
test("atomic acquisition uses exact real smith quotes",()=>{
  const s=m.newManagerGame(0);s.coins=96;
  const quote=g.quoteArmourSet(s,"first","plate");
  const real=pieceIds("plate").reduce((n,id)=>n+smithQuote(s,id,STARTER_ITEM).cost,0);
  assert.equal(quote.cost,real);assert.equal(quote.cost,96);
  const r=m.chooseManagerArmour(s,"first","plate",0,rng);
  assert.equal(r.state.coins,0);assert.equal(r.autoEquipment.spent,real);
  assert.equal(r.autoEquipment.acquisitions.length,4);
  assert.equal(family(r.state,"first"),"plate");assert.equal(family(r.state,"second"),"none");
  assert.deepEqual(r.state.armourRequests,g.blankArmourRequests());
});
test("insufficient funds retain old set and prevent discretionary upgrades",()=>{
  let s=m.newManagerGame(0);s.coins=95;
  let r=m.chooseManagerArmour(s,"first","leather",0,rng);
  assert.equal(r.state.coins,95);assert.equal(family(r.state,"first"),"none");
  assert.equal(r.state.armourRequests.first,"leather");
  assert.equal(r.autoEquipment.upgrades.length,0);assert.equal(r.autoEquipment.acquisitions.length,0);
  assert.equal(r.autoEquipment.preview.holdingForSet,true);
  s={...r.state,coins:96};
  r=m.enterManagerGame(s,0,rng);
  assert.equal(family(r.state,"first"),"leather");assert.equal(r.state.coins,0);
  assert.equal(r.autoEquipment.spent,96);
});
test("partial ownership charges only missing starter items",()=>{
  let s=m.newManagerGame(0);s.coins=72;
  s.equipment["head:padded"]={grade:3,quality:"masterwork"};
  const r=m.chooseManagerArmour(s,"first","padded",0,rng);
  assert.equal(r.autoEquipment.acquisitions.length,3);assert.equal(r.autoEquipment.spent,72);
  assert.deepEqual(r.state.equipment["head:padded"],{grade:3,quality:"masterwork"});
  assert.equal(family(r.state,"first"),"padded");
});
test("shared treasury and stable two-fighter requests",()=>{
  let s=m.newManagerGame(0);
  s=g.requestArmourSet(s,"second","padded");
  s=g.requestArmourSet(s,"first","plate");s.coins=96;
  const a=m.enterManagerGame(s,0,rng);
  assert.equal(family(a.state,"first"),"plate");assert.equal(family(a.state,"second"),"none");
  assert.equal(a.state.armourRequests.second,"padded");assert.equal(a.state.coins,0);
  const b=m.enterManagerGame({...a.state,coins:96},0,rng);
  assert.equal(family(b.state,"second"),"padded");assert.equal(b.state.coins,0);
  assert.equal(b.autoEquipment.spent,96);
});
test("switching preserves ownership, mastery and frozen started bout",()=>{
  let s=m.newManagerGame(0);s.coins=192;
  s=g.requestArmourSet(s,"first","plate");
  s=g.requestArmourSet(s,"second","leather");
  s=m.enterManagerGame(s,0,rng).state;
  s=m.settleManagerLive(s,1,rng).state;
  const frozen=structuredClone(s.combatSession),old=structuredClone(s.equipment);
  s={...s,coins:96};
  const r=m.chooseManagerArmour(s,"first","padded",1,rng);
  assert.deepEqual(r.state.combatSession,frozen);
  assert.equal(family(r.state,"first"),"padded");
  for(const id of pieceIds("plate"))assert.deepEqual(r.state.equipment[id],old[id]);
  const back=m.chooseManagerArmour(r.state,"first","plate",1,rng);
  assert.equal(family(back.state,"first"),"plate");assert.equal(back.autoEquipment.spent,0);
  assert.deepEqual(back.state.expertise,r.state.expertise);
  assert.deepEqual(back.state.teamSecond,r.state.teamSecond);
});
test("new selection replaces pending, selecting worn set cancels",()=>{
  let s=m.newManagerGame(0);s.coins=96;
  s=m.chooseManagerArmour(s,"first","plate",0,rng).state;
  s=m.chooseManagerArmour(s,"first","leather",0,rng).state;
  assert.equal(s.armourRequests.first,"leather");
  s=m.chooseManagerArmour(s,"first","padded",0,rng).state;
  assert.equal(s.armourRequests.first,"padded");
  s=m.chooseManagerArmour(s,"first","plate",0,rng).state;
  assert.equal(s.armourRequests.first,null);assert.equal(family(s,"first"),"plate");
});
test("weapon selection independent and pending survives save",()=>{
  let s=m.newManagerGame(0);
  s=m.chooseManagerArmour(s,"second","plate",0,rng).state;
  const r=m.chooseManagerWeapon(s,"second","hammer",0,rng);
  assert.equal(r.state.teamSecond.combatLoadout,"hammer");
  assert.equal(r.state.combatLoadout,s.combatLoadout);
  assert.equal(r.state.armourRequests.second,"plate");
  assert.deepEqual(m.readManagerGame(JSON.stringify(r.state)),r.state);
  assert.equal(m.readManagerGame({...r.state,armourRequests:{first:null,second:"none"}}),null);
  assert.throws(()=>m.chooseManagerArmour(s,"first","none"),RangeError);
});
test("no upgrades to inactive families; maxed gear incurs no cost",()=>{
  let s=m.newManagerGame(0);s.coins=192;
  s=g.requestArmourSet(s,"first","plate");s=g.requestArmourSet(s,"second","leather");
  s=m.enterManagerGame(s,0,rng).state;
  for(const fighter of [s,s.teamSecond]){
    for(const id of [fighter.combatLoadout,...ARMOUR_SLOTS.map(slot=>slot.id+":"+fighter.armour[slot.id])])
      fighter.equipment[id]={grade:7,quality:"masterwork"};
  }
  s.equipment["head:padded"]={...STARTER_ITEM};s.coins=100000;
  const r=m.enterManagerGame(s,0,rng);
  assert.equal(r.state.coins,s.coins);assert.equal(r.autoEquipment.upgrades.length,0);
  assert.deepEqual(r.state.equipment["head:padded"],STARTER_ITEM);
});
