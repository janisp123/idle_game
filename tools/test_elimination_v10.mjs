// RANGE-GEOMETRY-001: actual max-only paired arena simulations; v5 vs v6.
import test from "node:test";
import assert from "node:assert/strict";
import {GROUP_IDS,initialBattleGroup,selectGroupClass,groupSnapshots} from "../site/play/battle-group.mjs";
import {GROUP_CLASSES} from "../site/play/battle-group-classes.mjs";
import {ARMOUR_SLOTS} from "../site/play/armour.mjs";
import {expertiseThreshold} from "../site/play/expertise.mjs";
import {blankCharacterEffort,awardCharacterEffort} from "../site/play/character-attributes.mjs";
import {TEAM_SIX_MONTH_BUILD} from "../site/play/alpha-tools.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
const cycle=ids=>Array.from({length:7},(_,i)=>ids[i%ids.length]);
const classes={
 balanced:["oathkeeper","blademaster","longshot","flameweaver","lifekeeper","wardchanter","war_dancer"],
 fortified:["oathkeeper","grovewarden","lifekeeper","wellspring","flameweaver","nightblade","blackbow"],
 archers:cycle(["longshot","windbow","blackbow"]),
 daggers:cycle(["trickblade","swiftblade","nightblade"]),
 mages:cycle(["flameweaver","gravebinder","frostweaver","galescourge"]),
 heavy_melee:cycle(["blademaster","linebreaker","ragebreaker","scrapbreaker"]),
 tanks:cycle(["oathkeeper","grimwarden","grovewarden","dreadguard"]),
 healers:cycle(["lifekeeper","wellspring","bloodsage"]),
 summoners:cycle(["beastcaller","spiritcaller","shadebinder","forgecaller"]),
 support:cycle(["runesage","wardchanter","war_dancer","hexchief","warcaller"])
};
const names=Object.keys(classes);
const hours=TEAM_SIX_MONTH_BUILD.productiveHours;
const seeds=[20261127,20261144,20261158,20261201,20261219,20270103];
function roster(ids){
 let g=initialBattleGroup();
 for(const [i,id] of GROUP_IDS.entries()){
  const c=GROUP_CLASSES[ids[i]];g=selectGroupClass(g,id,c.race,c.mainClass,c.id);
  const m=g[id],p=m.classes[c.id],item={grade:7,quality:"masterwork"};
  p.mastery={level:50,xp:0};m.stances.balanced={level:50,xp:0};
  p.equipment=Object.fromEntries([c.loadout,...ARMOUR_SLOTS.map(s=>s.id+":"+c.armour)].map(k=>[k,{...item}]));
  p.expertise[c.loadout]=expertiseThreshold(7);p.expertise[c.armour]=expertiseThreshold(7);p.expertiseActive={...p.expertise};
  p.attributeEffort=awardCharacterEffort(blankCharacterEffort(),c.id,hours*3600000);p.attributeEffortActive={...p.attributeEffort};
 }
 const p=Object.values(groupSnapshots(g,{str:141,dex:141,end:129,skill:52,difficulty:7},10));
 assert.equal(p.length,7);for(const a of p){assert.equal(a.classLevel,50);assert.equal(a.tacticLevel,50);assert.ok(a.attributes);assert.ok(Object.values(a.trainingKit.equipment).every(i=>i.grade===7&&i.quality==="masterwork"));}
 return p;
}


import {GROUP_ARENAS} from "../site/play/arenas.mjs";
import {ELIMINATION_MAX_ROUNDS} from "../site/play/group-counter-rules.mjs";
import {GROUP_BOUT_MS,GROUP_RECOVERY_MS} from "../site/play/battle-group-timing.mjs";
Object.assign(classes,{
 ranged_core:["oathkeeper","lifekeeper","runesage","longshot","blackbow","flameweaver","galescourge"],
 melee_core:["oathkeeper","lifekeeper","runesage","blademaster","linebreaker","trickblade","nightblade"],
 control_core:["oathkeeper","bloodsage","runesage","longshot","windbow","gravebinder","frostweaver"],
 siege_core:["grovewarden","wellspring","hexchief","linebreaker","flameweaver","forgecaller","war_dancer"],
 attrition_core:["dreadguard","bloodsage","warcaller","gravebinder","shadebinder","galescourge","spiritcaller"],
 ambush_core:["grimwarden","bloodsage","war_dancer","trickblade","swiftblade","nightblade","beastcaller"]
});

const names10=Object.keys(classes),teams=Object.fromEntries(names10.map(k=>[k,roster(classes[k])]));
const old={player:50,enemy:50,groupCombatRules:9},full={...old,groupCombatRules:10};
const index=(r,swap)=>r.outcome==="double_death"?2:(r.outcome==="victory")!==swap?0:1;
function check(r){
 const e=r.events.at(-1),v=e.vitals,p=Object.keys(v).filter(k=>k.startsWith("player:")).some(k=>v[k].hp>0),q=Object.keys(v).filter(k=>k.startsWith("enemy:")).some(k=>v[k].hp>0);
 assert.ok(r.rounds<=ELIMINATION_MAX_ROUNDS);
 if(r.reason==="simulation_limit"){assert.equal(r.outcome,"double_death");assert.ok(p&&q);assert.equal(r.rounds,ELIMINATION_MAX_ROUNDS);}
 else{assert.equal(r.reason,"knockout");assert.ok(!p||!q);assert.equal(r.outcome,p?"victory":q?"defeat":"double_death");}
}
test("v10 keeps ten seconds, exact first 32 rounds and determinism, no HP-scored wins",()=>{
 assert.equal(GROUP_BOUT_MS,10000);assert.equal(GROUP_RECOVERY_MS,1000);
 let extended=0;
 for(const z of GROUP_ARENAS){
  const a=teams.ranged_core,b=teams.melee_core,seed=27190001;
  const x=resolveTeamBattle(a,b,seed,z,old),y=resolveTeamBattle(a,b,seed,z,full);
  check(y);
  assert.deepEqual(y.events.slice(0,x.events.length-1),x.events.slice(0,-1));
  assert.deepEqual(y,resolveTeamBattle(a,b,seed,z,full));
  if(y.rounds>32)extended++;
 }
 assert.ok(extended>0);
});
test("v10 elimination versus previous HP scoring: 3840 max 7v7 bouts per version",()=>{
 let count=0;const summary={},seeds10=[27191007,27199003];
 for(const z of GROUP_ARENAS){
  const score=Object.fromEntries(names10.map(k=>[k,{before:[0,0,0],after:[0,0,0]}]));
  let unresolved=0,oldTimeouts=0,changes=0,roundSum=0,max=0;const rounds=[],pairs=[];
  for(let i=0;i<names10.length;i++)for(let j=i+1;j<names10.length;j++){
   const a=names10[i],b=names10[j],before=[0,0,0],after=[0,0,0];let limits=0;
   for(const seed of seeds10)for(const swap of [false,true]){
    const p=teams[swap?b:a],q=teams[swap?a:b],x=resolveTeamBattle(p,q,seed,z,old),y=resolveTeamBattle(p,q,seed,z,full);
    check(y);const ix=index(x,swap),iy=index(y,swap);before[ix]++;after[iy]++;oldTimeouts+=+(x.reason==="timeout");limits+=+(y.reason==="simulation_limit");changes+=+(ix!==iy);roundSum+=y.rounds;max=Math.max(max,y.rounds);rounds.push(y.rounds);count++;
    if(x.reason==="knockout")assert.equal(x.outcome,y.outcome);
   }
   unresolved+=limits;
   for(let k=0;k<3;k++){score[a].before[k]+=before[k];score[b].before[k===2?2:1-k]+=before[k];score[a].after[k]+=after[k];score[b].after[k===2?2:1-k]+=after[k];}
   pairs.push([a,b,before,after,limits]);
  }
  rounds.sort((a,b)=>a-b);
  for(const s of Object.values(score)){assert.equal(s.before.reduce((a,b)=>a+b,0),60);assert.equal(s.after.reduce((a,b)=>a+b,0),60);}
  summary[z.id]={score,oldTimeouts,unresolved,changes,roundSum,max,median:rounds[Math.floor(rounds.length/2)],p95:rounds[Math.floor(rounds.length*.95)],bouts:rounds.length};
  console.log("ELIMINATION_V10_ZONE "+JSON.stringify({zone:z.id,...summary[z.id],pairs}));
 }
 assert.equal(count,3840);console.log("ELIMINATION_V10_SUMMARY "+JSON.stringify({count,hours,seeds:seeds10,summary}));
});
