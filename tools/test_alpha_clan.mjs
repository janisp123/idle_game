import test from "node:test";
import assert from "node:assert/strict";
import {newArenaManager,enterArena,readArenaManager,chooseClanDonation,chooseClanAcademy} from "../site/play/arena-manager.mjs";
import {settleManagerOffline,enterManagerGame} from "../site/play/manager-lanes.mjs";
import {ALPHA_CLAN,clanXpBonus,validAlphaClan,donateClan,upgradeAcademy} from "../site/play/alpha-clan.mjs";
import {raidVictoryBuff} from "../site/play/raid-rules.mjs";
import {xpToNextLevel} from "../site/play/engine.mjs";
const t=2026112700,rand=()=>.5;
test("first clan enrollment settles old time without retroactive bonus; repeat login and reload retain membership",()=>{
 const s=newArenaManager(t),end=t+100000;
 const old=enterManagerGame(s,end,rand).state,joined=enterArena(s,end,rand).state;
 assert.deepEqual({...joined,alphaClan:undefined},{...old,alphaClan:undefined});
 assert.equal(joined.alphaClan.id,ALPHA_CLAN.id);assert.equal(joined.alphaClan.joinedAtMs,end);assert.equal(clanXpBonus(joined.alphaClan),.05);
 assert.deepEqual(readArenaManager(JSON.stringify(joined)),joined);
 assert.deepEqual(enterArena(joined,end,rand).state.alphaClan,joined.alphaClan);
 assert.equal(readArenaManager(JSON.stringify({...joined,alphaClan:{...joined.alphaClan,treasury:1}})),null);
});
test("voluntary donation and Academy upgrade conserve coins, lock for 24 real hours, persist and cannot exceed max",()=>{
 let s=enterArena(newArenaManager(t),t,rand).state;s={...s,coins:10000};const wall=1000000;
 const d=donateClan(s,wall);assert.equal(d.coins,s.coins-100);assert.equal(d.alphaClan.treasury,100);
 assert.throws(()=>donateClan(d,wall));assert.throws(()=>donateClan(d,wall+ALPHA_CLAN.lockMs-1));assert.throws(()=>donateClan({...s,coins:99},wall));
 const u=upgradeAcademy(d);assert.equal(u.coins,d.coins);assert.equal(u.alphaClan.treasury,0);assert.equal(clanXpBonus(u.alphaClan),.06);assert.throws(()=>upgradeAcademy(u));
 assert.deepEqual(readArenaManager(JSON.stringify(u)),u);
 let v=u;for(let day=1;day<15;day++){v=donateClan(v,wall+day*ALPHA_CLAN.lockMs);if(v.alphaClan.academyLevel<ALPHA_CLAN.maxAcademy&&v.alphaClan.treasury>=100*v.alphaClan.academyLevel)v=upgradeAcademy(v);}
 assert.equal(v.alphaClan.academyLevel,6);assert.equal(clanXpBonus(v.alphaClan),.10);assert.throws(()=>upgradeAcademy(v));assert.ok(validAlphaClan(v.alphaClan));assert.equal(v.coins+v.alphaClan.donated,s.coins);
 const once=chooseClanDonation(s,t,wall,rand).state;assert.equal(once.alphaClan.treasury,100);assert.deepEqual(chooseClanDonation(once,t,wall,rand).state.alphaClan,once.alphaClan);assert.equal(chooseClanAcademy(once,t,rand).state.alphaClan.academyLevel,2);
});
test("clan Academy boosts actual Fighting XP, stacks with raid XP, preserves payouts and cap",()=>{
 const s=enterArena(newArenaManager(t),t,rand).state,base={...s,skills:{...s.skills,fighting:{level:30,xp:0}}};
 const {alphaClan,...neutral}=base,end=t+200000;
 const a=settleManagerOffline(neutral,end,rand).state,b=settleManagerOffline(base,end,rand).state;
 const boosted={...base,raidBuff:raidVictoryBuff(null,10,t)},r=settleManagerOffline(boosted,end,rand).state;
 assert.ok(b.skills.fighting.xp>a.skills.fighting.xp);assert.ok(r.skills.fighting.xp>b.skills.fighting.xp);
 assert.equal(b.coins,a.coins);assert.deepEqual(b.groupAnalytics,a.groupAnalytics);
 const cap=settleManagerOffline(base,t+86400000,rand).state;assert.equal(cap.skills.fighting.xp,xpToNextLevel(cap.skills.fighting.level));
});
