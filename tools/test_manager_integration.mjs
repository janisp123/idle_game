import test from "node:test";
import assert from "node:assert/strict";
import * as m from "../site/play/manager-lanes.mjs";
import {ITEM_KEYS,ACTIVITIES,LIVE_FIGHT_MAX_MS} from "../site/play/engine.mjs";
import {WORK_ROTATION} from "../site/play/activity-rotation.mjs";
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const effort=s=>Object.values(s.attributeEffort).reduce((a,b)=>a+b,0);
function verify(old,out){
 const s=out.state;
 assert.equal(s.activity,"fighting");assert.ok(s.settledAtMs>=old.settledAtMs);
 assert.ok(effort(s)-effort(old)<=(s.settledAtMs-old.settledAtMs)*100);
 const items={...old.items};let earned=0;
 for(const r of out.reports??[]){
   if(!r)continue;earned+=r.gainedCoins??0;
   for(const [k,n] of Object.entries(r.items??{}))items[k]+=n;
   for(const [k,n] of Object.entries(r.consumed??{}))items[k]-=n;
 }
 for(const [k,n] of Object.entries(out.mastery?.tribute??{}))items[k]-=n;
 for(const k of ITEM_KEYS){assert.equal(s.items[k],items[k],k);assert.ok(items[k]>=0);}
 assert.equal(s.coins,old.coins+earned-(out.autoEquipment?.spent??0),"exact shared wallet");
 assert.equal(out.autoEquipment?.spent??0,[...(out.autoEquipment?.upgrades??[]),...(out.autoEquipment?.acquisitions??[])].reduce((n,p)=>n+p.cost,0));
 for(const id of Object.keys(ACTIVITIES))assert.equal(s.skills[id].level-old.skills[id].level,out.levelsGained?.[id]??0,id);
 assert.deepEqual(m.readManagerGame(JSON.stringify(s)),s);
 return s;
}
test("integrated seeded foreground, reloads, offline rotation and equipment ledger",()=>{
 const random=seeded(20261127);
 let s=m.newManagerGame(0);
 s=m.chooseManagerArmour(s,"first","plate",0,random).state;
 s=m.chooseManagerArmour(s,"second","leather",0,random).state;
 const visits=new Set(),initial=s;
 for(let i=0;i<720;i++){
   visits.add(s.managerWork.activity);
   s=verify(s,m.settleManagerLive(s,s.settledAtMs+LIVE_FIGHT_MAX_MS,random));
   if(i%30===0)s=m.readManagerGame(JSON.stringify(s));
 }
 for(let i=0;i<60;i++){
   visits.add(s.managerWork.activity);
   const old=s;
   s=verify(s,m.enterManagerGame(s,s.settledAtMs+86400000,random));
   assert.deepEqual(s.autoFight,old.autoFight,"offline cannot change difficulty");
 }
 assert.ok(s.skills.fighting.level>initial.skills.fighting.level);
 assert.equal(visits.size,WORK_ROTATION.length);
 assert.ok(WORK_ROTATION.every(id=>s.skills[id].level>1));
 assert.ok(s.combatSession.prizeCursor>0);
 console.log(JSON.stringify({seed:20261127,foregroundTicks:720,offlineVisits:60,visits:[...visits],levels:Object.fromEntries(Object.entries(s.skills).map(([k,v])=>[k,v.level])),coins:s.coins,bouts:s.combatSession.prizeCursor}));
});
test("offline capped settlement does not replay after save and no unpaid gain on zero time",()=>{
 const random=seeded(99),old=m.newManagerGame(0),raw=m.settleManagerOffline(old,86400000,random);
 const saved=m.readManagerGame(JSON.stringify(raw.state));const again=m.settleManagerOffline(saved,saved.settledAtMs,random);
 assert.deepEqual(again.state,saved);
 const entered=m.enterManagerGame(saved,saved.settledAtMs,random);
 assert.deepEqual(m.enterManagerGame(entered.state,entered.state.settledAtMs,random).state,entered.state);
});
