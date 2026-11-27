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
