import test from "node:test";
import assert from "node:assert/strict";
import {GROUP_CLASSES} from "../site/play/battle-group-classes.mjs";
import {GROUP_IDS,initialBattleGroup,groupSnapshots,selectGroupClass,upgradeBattleGroup,validBattleGroup} from "../site/play/battle-group.mjs";
import {captureGroupCloneEnvelope,buildGroupCloneTeam,validGroupCloneEnvelope,groupCloneChoices} from "../site/play/battle-group-clones.mjs";
import {startGroupSession,validGroupSession,groupCombatAtTime,settleGroupSession,applyGroupSettlement} from "../site/play/battle-group-timeline.mjs";
import {equipmentPrice,SMITH_BALANCE} from "../site/play/smith.mjs";
import {expertiseThreshold} from "../site/play/expertise.mjs";
const max={str:141,dex:141,end:129,skill:52,difficulty:7},seed=20261127;
const maxGroup=()=>{
 let fresh=initialBattleGroup();for(const m of Object.values(fresh))m.classes[m.selected].mastery.level=50;
 let g=upgradeBattleGroup(fresh,7*(5*equipmentPrice({grade:7,quality:"masterwork"})+4*SMITH_BALANCE.firstArmourCost),52).group;
 for(const m of Object.values(g)){const p=m.classes[m.selected],c=GROUP_CLASSES[m.selected];p.mastery.level=50;m.stances.balanced.level=50;p.expertise[c.loadout]=expertiseThreshold(7);p.expertise[c.armour]=expertiseThreshold(7);p.expertiseActive={...p.expertise};}
 return g;
};
test("seven max-investment clone fighters use same gear, mastery and stats; independent seeded choices",()=>{
 const g=maxGroup(),env=captureGroupCloneEnvelope(g);assert.ok(validGroupCloneEnvelope(env));
 const e=buildGroupCloneTeam(env,max,seed);assert.deepEqual(e,buildGroupCloneTeam(env,max,seed));assert.equal(e.length,7);
 for(const p of e){assert.equal(p.classLevel,50);assert.equal(p.tacticLevel,50);assert.equal(p.str,141);assert.equal(p.dex,141);assert.equal(p.end,129);assert.equal(p.skill,52);assert.equal(Object.keys(p.trainingKit.equipment).length,5);assert.ok(Object.values(p.trainingKit.equipment).every(i=>i.grade===7&&i.quality==="masterwork"));}
 const choices=new Set(Array.from({length:30},(_,i)=>groupCloneChoices(52,seed+i).map(x=>x.classId+":"+x.stance).join("|")));
 assert.ok(choices.size>=25);
 assert.equal(validGroupCloneEnvelope({...env,roster:env.roster.slice(1)}),false);
});
test("frozen seven-character timeline partitions exact payouts, practice and analytics; no retroactive selection",()=>{
 const g=maxGroup(),s=startGroupSession(g,max,50,seed,{coinRemainder:7,teamworkRemainder:3});
 assert.ok(validGroupSession(JSON.parse(JSON.stringify(s))));assert.equal(validGroupSession({...s,prizeCursor:1}),false);
 const cache=new Map(),a=settleGroupSession(s,213456,cache),b=settleGroupSession(a.session,247891,cache),all=settleGroupSession(s,461347,cache);
 for(const k of ["bouts","victories","defeats","doubleDeaths","coins","teamworkXP","downtimeMs"])assert.equal(a[k]+b[k],all[k],k);
 assert.deepEqual(b.session,all.session);for(const id of GROUP_IDS)assert.equal(a.practiceMs[id]+b.practiceMs[id],all.practiceMs[id]);
 for(const dim of ["zones","classes","races","roles","stances"])for(const [key,row] of Object.entries(all.analytics[dim]))assert.deepEqual(row,row.map((_,i)=>(a.analytics[dim][key]?.[i]??0)+(b.analytics[dim][key]?.[i]??0)));
 assert.equal(all.analytics.outcomes.reduce((x,y)=>x+y,0),all.bouts);assert.equal(all.analytics.ms,all.bouts*10000);
 const c=GROUP_CLASSES.trickblade,changed=selectGroupClass(g,"member1",c.race,c.mainClass,c.id),r=applyGroupSettlement(changed,{level:50,xp:0},s,10000,cache);
 assert.ok(validBattleGroup(r.group));assert.equal(r.group.member1.classes.trickblade.expertise[c.loadout],0);assert.equal(r.group.member1.classes.trickblade.mastery.xp,0);
 assert.equal(groupCombatAtTime(s,5000).progress,.5);
});
test("long offline group settlement samples at most one fixed schedule",()=>{
 const s=startGroupSession(maxGroup(),max,50,seed),cache=new Map(),r=settleGroupSession(s,10000*513,cache);
 assert.equal(r.bouts,513);assert.equal(r.sampledBouts,256);assert.equal(cache.size,256);assert.equal(r.victories+r.defeats+r.doubleDeaths,513);
 assert.ok(r.coins>=0);assert.ok(r.downtimeMs>=0);
 console.log("GROUP_TIMELINE_MAX_DIAGNOSTIC "+JSON.stringify({seed,bouts:r.bouts,sampled:r.sampledBouts,outcomes:r.analytics.outcomes,coins:r.coins,ms:r.analytics.ms,zones:r.analytics.zones,classes:r.analytics.classes}));
});

test("legacy saved rules remain frozen and new sessions explicitly use tactical rules",()=>{
 const next=startGroupSession(maxGroup(),max,50,seed),old={...next};delete old.groupCombatRules;
 assert.equal(next.groupCombatRules,3);assert.ok(validGroupSession(old));assert.ok(!validGroupSession({...next,groupCombatRules:999}));
 const a=settleGroupSession(old,10000);assert.equal(a.session.groupCombatRules,undefined);
 assert.deepEqual(groupCombatAtTime(old),groupCombatAtTime({...old,groupCombatRules:1}));
});

test("deployed v1 maximum-build schedule preserves exact 513-bout reward history",()=>{
 const s=startGroupSession(maxGroup(),max,50,seed);delete s.groupCombatRules;
 const r=settleGroupSession(s,513*10000);
 assert.deepEqual(r.analytics.outcomes,[272,239,2]);assert.equal(r.coins,3522);assert.equal(r.session.groupCombatRules,undefined);
});

test("v2 terrain candidate remains exact after pilot kit rule addition",()=>{
 const s=startGroupSession(maxGroup(),max,50,seed);s.groupCombatRules=2;
 const r=settleGroupSession(s,513*10000);
 assert.deepEqual(r.analytics.outcomes,[213,300,0]);assert.equal(r.coins,2758);assert.equal(r.session.groupCombatRules,2);
});

import {awardGroupPractice,activateGroupPractice,migrateGroupAttributes} from "../site/play/battle-group.mjs";
import {blankCharacterEffort,awardCharacterEffort,characterAttributes} from "../site/play/character-attributes.mjs";
test("individual stat training credits frozen member and class, not a switched or duplicate class",()=>{
 const g=initialBattleGroup(),c=GROUP_CLASSES.longshot,zero=blankCharacterEffort();
 const twin=selectGroupClass(g,"member2",c.race,c.mainClass,c.id),snap=groupSnapshots(twin,max);
 const changed=selectGroupClass(twin,"member3",GROUP_CLASSES.galescourge.race,GROUP_CLASSES.galescourge.mainClass,"galescourge");
 const ms=Object.fromEntries(GROUP_IDS.map(id=>[id,id==="member3"?9000:id==="member2"?3000:0]));
 const earned=awardGroupPractice(changed,snap,ms);
 assert.deepEqual(earned.member3.classes.longshot.attributeEffort,awardCharacterEffort(zero,"longshot",9000));
 assert.deepEqual(earned.member2.classes.longshot.attributeEffort,awardCharacterEffort(zero,"longshot",3000));
 assert.deepEqual(earned.member3.classes.galescourge.attributeEffort,zero);
 assert.deepEqual(earned.member3.classes.longshot.attributeEffortActive,zero);
 assert.deepEqual(twin.member2.classes.longshot.attributeEffort,zero);
 const active=activateGroupPractice(earned);
 assert.deepEqual(active.member2.classes.longshot.attributeEffortActive,active.member2.classes.longshot.attributeEffort);
 assert.deepEqual(active.member3.classes.longshot.attributeEffortActive,zero);
 const back=activateGroupPractice(selectGroupClass(active,"member3",c.race,c.mainClass,c.id));
 assert.deepEqual(back.member3.classes.longshot.attributeEffortActive,back.member3.classes.longshot.attributeEffort);
 assert.ok(validBattleGroup(back));
});
test("legacy individual effort migration is idempotent and recovers actual per-class weapon practice",()=>{
 const g=initialBattleGroup(),c=GROUP_CLASSES[g.member1.selected],p=g.member1.classes[c.id],zero=blankCharacterEffort();
 delete p.attributeEffort;delete p.attributeEffortActive;
 p.expertise[c.loadout]=400000;p.expertiseActive[c.loadout]=200000;
 assert.ok(validBattleGroup(g));const migrated=migrateGroupAttributes(g),n=migrated.member1.classes[c.id];
 assert.deepEqual(n.attributeEffort,awardCharacterEffort(zero,c.id,100000));
 assert.deepEqual(n.attributeEffortActive,awardCharacterEffort(zero,c.id,50000));
 assert.equal(migrateGroupAttributes(migrated),migrated);
 assert.deepEqual(migrated.member2.classes[g.member2.selected].attributeEffort,zero);
 assert.deepEqual(n.equipment,p.equipment);assert.deepEqual(n.mastery,p.mastery);
 const invalid=structuredClone(migrated);invalid.member1.classes[c.id].attributeEffortActive.STR=n.attributeEffort.STR+1;
 assert.equal(validBattleGroup(invalid),false);
});

import {statAttack,statSpeed,statCrit,statMagicDamageFactor,statStatusResistance,statHealing,statEvasion,statMobility,statInitiative} from "../site/play/stat-combat.mjs";
test("v4 snapshots ignore account stats, use individual mastery and match clone semantics",()=>{
 const g=initialBattleGroup(),s=startGroupSession(g,max,50,seed,{rules:4});
 assert.ok(validGroupSession(s));assert.equal(s.groupCombatRules,4);
 assert.deepEqual(s.players,groupSnapshots(g,{...max,str:1,dex:999,end:1,skill:1},4));
 const p=s.players.member1,q=s.players.member3;
 assert.notDeepEqual(p.attributes,q.attributes);assert.equal(p.skill,1);
 const broken=structuredClone(s);broken.players.member1.attributes.STR++;assert.equal(validGroupSession(broken),false);
 const r=groupCombatAtTime(s);assert.ok(r.enemies.every(x=>x.attributes&&x.skill===x.classLevel));assert.ok(r.events.length>1);
 const a=settleGroupSession(s,12345),b=settleGroupSession(a.session,87655),all=settleGroupSession(s,100000);
 assert.deepEqual(b.session,all.session);for(const k of ["coins","bouts","victories","defeats","doubleDeaths"])assert.equal(a[k]+b[k],all[k]);
});
test("six attributes affect distinct v4 combat functions and never legacy combat",()=>{
 const base={STR:20,DEX:20,CON:20,INT:20,WIT:20,MEN:20},a={attributes:base,groupCombatRules:4,str:20,dex:20,end:20};
 const plus=k=>({...a,attributes:{...base,[k]:100}});
 assert.ok(statAttack(plus("STR"),"piercing")>statAttack(a,"piercing"));assert.equal(statAttack(plus("STR"),"magic"),statAttack(a,"magic"));
 assert.ok(statAttack(plus("INT"),"magic")>statAttack(a,"magic"));assert.ok(statHealing(plus("INT"))>statHealing(a));
 assert.ok(statSpeed(plus("DEX"),"piercing")>statSpeed(a,"piercing"));assert.equal(statSpeed(plus("DEX"),"magic"),statSpeed(a,"magic"));
 assert.ok(statCrit(plus("WIT"),"magic")>statCrit(a,"magic"));assert.ok(statInitiative(plus("WIT"),"magic")>statInitiative(a,"magic"));assert.ok(statEvasion(plus("DEX"))>statEvasion(a));assert.ok(statMobility(plus("DEX"))>statMobility(a));
 assert.ok(statStatusResistance(plus("CON"),"physical")>statStatusResistance(a,"physical"));assert.ok(statMagicDamageFactor(plus("MEN"),"magic")<statMagicDamageFactor(a,"magic"));assert.ok(statStatusResistance(plus("MEN"),"magic")>statStatusResistance(a,"magic"));
 assert.equal(statAttack({...plus("INT"),groupCombatRules:3},"magic"),6);assert.equal(statSpeed({...a,groupCombatRules:3},"magic"),0);
});

import {RAID_LEVELS,RAID_CATALOG,RAID_BUFF_MS,RAID_MAX_ROUNDS,RAID_ROUND_MS,raidVictoryBuff,activeRaidBuff,raidBonus,raidResistanceFactor,combatDamageFactor} from "../site/play/raid-rules.mjs";
import {raidMonsters,resolveRaid} from "../site/play/raid-encounters.mjs";
test("raid buffs refresh, replace, expire and never stack or downgrade",()=>{
 const t=1000,b=raidVictoryBuff(null,20,t);assert.deepEqual(b,{level:20,expiresAtMs:t+RAID_BUFF_MS});
 assert.deepEqual(raidVictoryBuff(b,10,t+1),b);assert.deepEqual(raidVictoryBuff(b,20,t+1),{level:20,expiresAtMs:t+1+RAID_BUFF_MS});
 const high=raidVictoryBuff(b,50,t+2);assert.deepEqual(raidBonus(high,t+2),{xp:.10,damage:.10,defence:.10});
 assert.equal(activeRaidBuff(high,high.expiresAtMs),null);assert.equal(raidVictoryBuff(high,10,high.expiresAtMs).level,10);
 assert.throws(()=>raidVictoryBuff(b,11,t));assert.equal(raidResistanceFactor("physical",.35,"magic"),1);
 assert.equal(raidResistanceFactor("magic",.4,"magic"),.6);assert.equal(raidResistanceFactor("melee",.4,"ranged"),1);
 assert.equal(combatDamageFactor({}, {}, {type:"magic"}),1);
});
test("five real raid encounters use named crews, bounded time, deterministic knockouts",()=>{
 const g=maxGroup();for(const m of Object.values(g)){const p=m.classes[m.selected];p.attributeEffort=awardCharacterEffort(blankCharacterEffort(),m.selected,3700*3600000);p.attributeEffortActive={...p.attributeEffort};}
 const players=Object.values(groupSnapshots(g,max,4)),results=[];
 for(const level of RAID_LEVELS){const d=RAID_CATALOG[level],e=raidMonsters(level);assert.equal(e.length,7);assert.equal(new Set(e.map(x=>x.name)).size,7);assert.equal(e[0].name,d.boss.name);assert.ok(e.every(x=>x.attributes&&x.classLevel===level));
  for(const offset of [0,17,31]){
   const r=resolveRaid(players,level,seed+offset,50);assert.ok(r.rounds<=RAID_MAX_ROUNDS);assert.ok(r.durationMs<=RAID_ROUND_MS*RAID_MAX_ROUNDS);
   assert.ok(r.events[0].vitals["enemy:0"].maxHP>r.events[0].vitals["enemy:1"].maxHP);
   if(r.outcome==="victory")assert.ok(Object.entries(r.survivors).filter(([id])=>id.startsWith("enemy:")).every(([,hp])=>hp===0));
   if(r.reason==="timeout")assert.notEqual(r.outcome,"victory");
   results.push({level,seed:seed+offset,outcome:r.outcome,rounds:r.rounds,durationMs:r.durationMs,reason:r.reason,bossHP:r.events[0].vitals["enemy:0"].maxHP,bossRemaining:r.survivors["enemy:0"]});
  }
 }
 console.log("RAID_INITIAL_SCREEN "+JSON.stringify({build:"max S masterwork, 3700h individual stats",results}));
});
