import test from "node:test";
import assert from "node:assert/strict";
import {newArenaManager,enterArena,readArenaManager,chooseClanRaid,testClanRaid,settleArenaLive} from "../site/play/arena-manager.mjs";
import {settleManagerOffline,enterManagerGame} from "../site/play/manager-lanes.mjs";
import {ALPHA_CLAN,CLAN_BUILDINGS,CLAN_CONSTRUCTION,CLAN_DAY,CLAN_STATS,clanBonuses,clanSnapshot,validAlphaClan,applyClanRewards,buildingCost,buildingDuration,advanceConstruction,setClanPriority,clanWeekEnd,completeClanWeek,migrateAlphaClan} from "../site/play/alpha-clan.mjs";
import {resolveClanRaid,clanRaidGroupCount} from "../site/play/clan-raid.mjs";
import {startGroupSession,settleGroupSession,groupWinPrize,groupCoinRatio} from "../site/play/battle-group-timeline.mjs";
import {xpToNextLevel} from "../site/play/engine.mjs";
const t=2026112700,rand=()=>.5,wall=2026112700000;
const fresh=()=>enterArena(newArenaManager(t),t,rand,wall).state;
const funded=(c,n)=>({...c,treasury:c.treasury+n,donated:c.donated+n});
test("local enrollment occurs after offline settlement; all five buildings level zero",()=>{
 const s=newArenaManager(t),end=t+100000,old=enterManagerGame(s,end,rand).state,joined=enterArena(s,end,rand,wall).state;
 assert.deepEqual({...joined,alphaClan:undefined},{...old,alphaClan:undefined});
 assert.deepEqual(joined.alphaClan.levels,{barracks:0,armoury:0,training:0,bank:0,portal:0});assert.equal(clanBonuses(joined.alphaClan).xp,0);assert.equal(clanBonuses(joined.alphaClan).members,10);
 assert.deepEqual(readArenaManager(JSON.stringify(joined)),joined);
 assert.deepEqual(enterArena(joined,end,rand,wall).state.alphaClan,joined.alphaClan);
 assert.equal(readArenaManager(JSON.stringify({...joined,alphaClan:{...joined.alphaClan,treasury:1}})),null);
 const oldClan={id:ALPHA_CLAN.id,version:1,joinedAtMs:t,treasury:17,donated:117,rewardCursor:9,academyLevel:2};
 const migrated=migrateAlphaClan(oldClan);assert.ok(validAlphaClan(migrated));assert.equal(migrated.treasury,17);assert.equal(migrated.rewardCursor,9);
});
test("every tenth positive reward remains exact with fractional Bank payouts, variable grade and batching",()=>{
 const c=fresh().alphaClan;let r=applyClanRewards(c,9,20,20);assert.equal(r.donated,0);r=applyClanRewards(r.clan,1,100,20);assert.equal(r.donated,5);
 for(const [units,ratio] of [[17,20],[28,20],[259,20],[1785,2000],[3360,2000],[31080,2000]])for(const carry of [0,ratio-1])for(const cursor of [0,9]){
  const seed={...c,rewardCursor:cursor};let slow=seed,remainder=carry,donated=0;
  for(let i=0;i<2222;i++){const a=applyClanRewards(slow,1,units,ratio,remainder);slow=a.clan;donated+=a.donated;remainder=(remainder+units)%ratio;}
  const fast=applyClanRewards(seed,2222,units,ratio,carry);assert.deepEqual(fast.clan,slow);assert.equal(fast.donated,donated);
 }
});
test("all 160 construction upgrades need exactly 480 days even with unlimited treasury",()=>{
 let c=funded(fresh().alphaClan,100000000),now=wall,n=0;c=advanceConstruction(c,now);
 while(c.construction){const q=c.construction;assert.equal(q.cost,buildingCost(q.id,q.level));assert.equal(q.end-q.start,buildingDuration(q.id,q.level));assert.deepEqual(advanceConstruction(c,q.end-1),c);now=q.end;c=advanceConstruction(c,now);assert.ok(validAlphaClan(c));n++;assert.ok(n<=160);}
 assert.equal(n,160);assert.equal(now-wall,480*CLAN_DAY);const b=clanBonuses(c);assert.equal(b.members,110);assert.equal(b.xp,20);assert.equal(b.coins,20);assert.ok(CLAN_STATS.every(k=>b.armoury[k]===20));
 const portal={...c,levels:{...c.levels,portal:50}};assert.ok(validAlphaClan(portal));assert.ok(CLAN_STATS.every(k=>clanBonuses(portal).combat[k]===50));
 let early=advanceConstruction(setClanPriority(funded(fresh().alphaClan,500),"bank"),wall);
 assert.equal(early.construction.id,"bank");const later=advanceConstruction(early,wall+100*CLAN_DAY);assert.equal(later.levels.bank,1);assert.equal(later.construction.start,wall+100*CLAN_DAY);
});
test("actual clan raid snapshots persist, resolve once after cutoff, no fake victories or repeat attempts",()=>{
 const s=fresh(),joined=chooseClanRaid(s,t,wall,rand).state,r=joined.alphaClan.raid.registration;
 assert.ok(r);assert.deepEqual(readArenaManager(JSON.stringify(joined)),joined);
 assert.deepEqual(chooseClanRaid(joined,t,wall,rand).state.alphaClan,joined.alphaClan);
 assert.deepEqual(completeClanWeek(joined.alphaClan,clanWeekEnd(r.week)-1,"victory"),joined.alphaClan);
 const result=resolveClanRaid(r);assert.equal(result.outcome,result.remainingHP===0?"victory":"defeat");assert.ok(result.groups<=clanRaidGroupCount(1));assert.deepEqual(resolveClanRaid(r),result);
 const done=testClanRaid(joined,t,wall,rand);assert.equal(done.clanRaidResult.outcome,result.outcome);assert.equal(done.state.alphaClan.levels.portal,Number(result.outcome==="victory"));
 assert.equal(done.state.alphaClan.raid.registration,null);assert.equal(chooseClanRaid(done.state,t,wall,rand).state.alphaClan.raid.registration,null);
 assert.deepEqual(readArenaManager(JSON.stringify(done.state)),done.state);
 for(let level=1;level<=50;level++)assert.ok(clanRaidGroupCount(level)>=2&&clanRaidGroupCount(level)<=11);
});
test("actual Fighting XP and Bank bonus follow completed levels; cap and old snapshot preserved",()=>{
 let s=fresh();let c=advanceConstruction(funded(s.alphaClan,50),wall);assert.equal(c.construction.id,"training");c=advanceConstruction(c,wall+CLAN_DAY);assert.equal(c.levels.training,1);
 const base={...s,skills:{...s.skills,fighting:{level:30,xp:0}},alphaClan:{...c,rewardCursor:9}};
 const neutral={...base,alphaClan:s.alphaClan};
 const a=settleManagerOffline(neutral,t+500000,rand).state,b=settleManagerOffline(base,t+500000,rand).state;
 assert.ok(b.skills.fighting.xp>=a.skills.fighting.xp);assert.equal(b.coins+b.alphaClan.donated-base.alphaClan.donated,a.coins+a.alphaClan.donated-neutral.alphaClan.donated);assert.deepEqual(b.groupAnalytics,a.groupAnalytics);
 const cap=settleManagerOffline(base,t+86400000,rand).state;assert.equal(cap.skills.fighting.xp,xpToNextLevel(cap.skills.fighting.level));
 let bank=advanceConstruction(setClanPriority(funded(s.alphaClan,50),"bank"),wall);bank=advanceConstruction(bank,wall+CLAN_DAY);
 const snap=clanSnapshot(bank);assert.equal(snap.bank,1);const session=startGroupSession(s.battleGroup,{difficulty:0,str:1,dex:1,end:1,skill:1},1,123,{rules:10,clanSnapshot:snap});
 assert.equal(groupCoinRatio(session),2000);const result=settleGroupSession(session,100000);
 assert.equal(result.rewardUnits%101,0);assert.ok(result.session.coinRemainder<2000);
});

import {startArenaRaid} from "../site/play/arena-manager.mjs";
import {raidResult} from "../site/play/raid-session.mjs";
test("personal raids freeze completed clan combat bonus, without altering historical raid replay",()=>{
 const s=fresh(),c={...s.alphaClan,levels:{...s.alphaClan.levels,portal:5}};
 assert.ok(validAlphaClan(c));const started=startArenaRaid({...s,alphaClan:c,tower:{version:1,highest:10,legacyAccess:0,run:null,last:null}},10,t,rand).state;
 assert.equal(started.raidRun.clanBonus.hp,15);assert.ok(validClanCombatForTest(started.raidRun.clanBonus));
 assert.deepEqual(readArenaManager(JSON.stringify(started)),started);
 assert.deepEqual(raidResult(started.raidRun),raidResult(readArenaManager(JSON.stringify(started)).raidRun));
});
function validClanCombatForTest(b){return CLAN_STATS.every(k=>Number.isInteger(b[k])&&b[k]>=0);}
