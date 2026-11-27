import test from "node:test";
import assert from "node:assert/strict";
import {newArenaManager,enterArena,readArenaManager,chooseClanAcademy} from "../site/play/arena-manager.mjs";
import {settleManagerOffline,enterManagerGame} from "../site/play/manager-lanes.mjs";
import {ALPHA_CLAN,clanXpBonus,validAlphaClan,applyClanRewards,upgradeAcademy} from "../site/play/alpha-clan.mjs";
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
test("automatic tenth positive payout, variable reward sizes, fractional carry, and batched equivalence",()=>{
 const s=enterArena(newArenaManager(t),t,rand).state,c=s.alphaClan;
 let r=applyClanRewards(c,9,20,20);assert.equal(r.donated,0);assert.equal(r.clan.rewardCursor,9);
 r=applyClanRewards(r.clan,0,100,20);assert.equal(r.clan.rewardCursor,9);
 r=applyClanRewards(r.clan,1,100,20);assert.equal(r.donated,5);assert.equal(r.clan.rewardCursor,0);
 assert.equal(applyClanRewards(c,1,17,20).clan.rewardCursor,0);
 for(const units of [17,28,45,67,95,129,171,259])for(const carry of [0,1,19])for(const cursor of [0,4,9]){
  const seed={...c,rewardCursor:cursor};let slow=seed,remainder=carry,donated=0;
  for(let i=0;i<1234;i++){const a=applyClanRewards(slow,1,units,20,remainder);slow=a.clan;donated+=a.donated;remainder=(remainder+units)%20;}
  const fast=applyClanRewards(seed,1234,units,20,carry);assert.deepEqual(fast.clan,slow);assert.equal(fast.donated,donated);
 }
 const funded=applyClanRewards(c,1000,200,20).clan;let v={...s,alphaClan:funded,coins:100};
 assert.equal(v.alphaClan.treasury,1000);while(v.alphaClan.treasury>=100*v.alphaClan.academyLevel&&v.alphaClan.academyLevel<6)v=upgradeAcademy(v);
 assert.equal(v.alphaClan.academyLevel,5);assert.equal(v.alphaClan.treasury,0);assert.equal(v.coins,100);assert.ok(validAlphaClan(v.alphaClan));assert.deepEqual(readArenaManager(JSON.stringify(v)),v);
});
test("actual arena settlement transfers rewards without creating coins or changing combat, and persists cursor",()=>{
 const s=enterArena(newArenaManager(t),t,rand).state;
 const base={...s,skills:{...s.skills,fighting:{level:30,xp:0}},alphaClan:{...s.alphaClan,rewardCursor:9}};
 const {alphaClan,...neutral}=base;
 const a=settleManagerOffline(neutral,t+500000,rand).state,b=settleManagerOffline(base,t+500000,rand).state;
 assert.equal(b.coins+b.alphaClan.donated,a.coins);assert.deepEqual(b.groupAnalytics,a.groupAnalytics);
 assert.deepEqual(readArenaManager(JSON.stringify(b)),b);
 assert.equal(enterArena(b,b.settledAtMs,rand).state.alphaClan.donated,b.alphaClan.donated);
});
test("clan Academy boosts actual Fighting XP, stacks with raid XP, preserves payouts and cap",()=>{
 const s=enterArena(newArenaManager(t),t,rand).state,base={...s,skills:{...s.skills,fighting:{level:30,xp:0}}};
 const {alphaClan,...neutral}=base,end=t+200000;
 const a=settleManagerOffline(neutral,end,rand).state,b=settleManagerOffline(base,end,rand).state;
 const boosted={...base,raidBuff:raidVictoryBuff(null,10,t)},r=settleManagerOffline(boosted,end,rand).state;
 assert.ok(b.skills.fighting.xp>a.skills.fighting.xp);assert.ok(r.skills.fighting.xp>b.skills.fighting.xp);
 assert.equal(b.coins+b.alphaClan.donated,a.coins);assert.deepEqual(b.groupAnalytics,a.groupAnalytics);
 const cap=settleManagerOffline(base,t+86400000,rand).state;assert.equal(cap.skills.fighting.xp,xpToNextLevel(cap.skills.fighting.level));
});
