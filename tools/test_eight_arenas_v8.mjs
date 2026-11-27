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
 const p=Object.values(groupSnapshots(g,{str:141,dex:141,end:129,skill:52,difficulty:7},5));
 assert.equal(p.length,7);for(const a of p){assert.equal(a.classLevel,50);assert.equal(a.tacticLevel,50);assert.ok(a.attributes);assert.ok(Object.values(a.trainingKit.equipment).every(i=>i.grade===7&&i.quality==="masterwork"));}
 return p;
}

import {teamArenaWidth} from "../site/play/team-combat.mjs";
import {ENGAGEMENT_GEOMETRY} from "../site/play/group-counter-rules.mjs";
const levels=rules=>({player:50,enemy:50,groupCombatRules:rules});
const range=["oathkeeper","lifekeeper","runesage","longshot","blackbow","flameweaver","galescourge"];
const melee=["oathkeeper","lifekeeper","runesage","blademaster","linebreaker","trickblade","nightblade"];
const firstDps=(r,side)=>{
 const actors=new Set([3,4,5,6].map(i=>side+":"+i));
 return r.events.find(e=>["hit","finisher","block","parry","miss","dodge"].includes(e.type)&&actors.has(e.type==="dodge"?e.target:e.actor))?.round??33;
};


import {GROUP_ARENAS,groupArenaPool,chooseArena} from "../site/play/arenas.mjs";
import {terrainTileBlocked,terrainApproachFactor} from "../site/play/group-counter-rules.mjs";
import {seededRandom} from "../site/play/physical-actions.mjs";
import {startGroupSession,groupCombatAtTime,settleGroupSession,validGroupSession} from "../site/play/battle-group-timeline.mjs";
import {blankGroupAnalytics,accumulateGroupAnalytics,validGroupAnalytics} from "../site/play/battle-group-analytics.mjs";
Object.assign(classes,{
 ranged_core:["oathkeeper","lifekeeper","runesage","longshot","blackbow","flameweaver","galescourge"],
 melee_core:["oathkeeper","lifekeeper","runesage","blademaster","linebreaker","trickblade","nightblade"],
 control_core:["oathkeeper","bloodsage","runesage","longshot","windbow","gravebinder","frostweaver"],
 siege_core:["grovewarden","wellspring","hexchief","linebreaker","flameweaver","forgecaller","war_dancer"],
 attrition_core:["dreadguard","bloodsage","warcaller","gravebinder","shadebinder","galescourge","spiritcaller"],
 ambush_core:["grimwarden","bloodsage","war_dancer","trickblade","swiftblade","nightblade","beastcaller"]
});
const rosterNames=Object.keys(classes);
test("eight zones preserve legacy selection and old combat outcomes, real geometry and legal positions",()=>{
 assert.equal(ARENAS.length,5);assert.equal(GROUP_ARENAS.length,8);assert.deepEqual(GROUP_ARENAS.slice(0,5),ARENAS);
 const p=roster(classes.control_core),e=roster(classes.melee_core),seen=new Set();
 for(let i=0;i<256;i++){
  const seed=(20261127+i*7919)>>>0;
  assert.deepEqual(chooseArena(p[0],e[0],seededRandom(seed)),chooseArena(p[0],e[0],seededRandom(seed),groupArenaPool(7)));
  seen.add(chooseArena(p[0],e[0],seededRandom(seed),groupArenaPool(8)).arena.id);
 }
 assert.equal(seen.size,8);
 for(const zone of ARENAS)for(const seed of seeds.slice(0,3))assert.deepEqual(resolveTeamBattle(p,e,seed,zone,levels(7)),resolveTeamBattle(p,e,seed,zone,levels(8)));
 const forest=GROUP_ARENAS.find(z=>z.id==="dense_forest"),hall=GROUP_ARENAS.find(z=>z.id==="grand_hall"),marsh=GROUP_ARENAS.find(z=>z.id==="marshland");
 assert.ok(terrainTileBlocked(forest,4,1,7,8));assert.ok(terrainTileBlocked(forest,5,5,7,8));assert.equal(terrainTileBlocked(forest,4,3,7,8),false);assert.equal(terrainTileBlocked(forest,4,1,7,7),false);
 const plate={groupCombatRules:8,trainingKit:{armour:{torso:"plate"}}},leather={groupCombatRules:8,trainingKit:{armour:{torso:"leather"}}};
 assert.ok(terrainApproachFactor(marsh,plate)<terrainApproachFactor(marsh,leather));assert.equal(terrainApproachFactor(hall,plate),1);
 for(const z of [forest,hall,marsh])for(const [a,b] of [[p,e],[roster(classes.archers),roster(classes.heavy_melee)],[roster(classes.siege_core),roster(classes.attrition_core)]]){
  const result=resolveTeamBattle(a,b,seeds[0],z,levels(8)),initial=result.events[0].vitals;
  assert.equal(new Set(Object.values(initial).map(v=>v.x+":"+v.y)).size,14);
  if(z===hall)for(const side of ["player","enemy"])assert.ok(new Set(Object.entries(initial).filter(([k])=>k.startsWith(side+":")).map(([,v])=>v.y)).size<=3);
  for(const ev of result.events)for(const v of Object.values(ev.vitals)){assert.ok(v.x>=0&&v.x<teamArenaWidth(z,8)&&v.y>=0&&v.y<7);assert.equal(terrainTileBlocked(z,v.x,v.y,7,8),false);}
 }
});
test("v8 live frozen schedule selects all eight zones and persists new analytics rows",()=>{
 const group=initialBattleGroup(),shared={str:141,dex:141,end:129,skill:52,difficulty:7},seed=20261127;
 const old=startGroupSession(group,shared,50,seed,{rules:7}),current=startGroupSession(group,shared,50,seed,{rules:8});
 assert.ok(validGroupSession(old)&&validGroupSession(current));
 const oldSeen=new Set(),newSeen=new Set();
 // Bound to 96 real scheduled bouts per version, and verify frozen old pool stays five.
 for(let i=0;i<96;i++){oldSeen.add(groupCombatAtTime(old,i*10000).terrain.id);newSeen.add(groupCombatAtTime(current,i*10000).terrain.id);}
 assert.equal(oldSeen.size,5);assert.equal(newSeen.size,8);
 const settled=settleGroupSession(current,960000),analytics=accumulateGroupAnalytics(blankGroupAnalytics(),[settled.analytics]);
 assert.ok(validGroupAnalytics(analytics));assert.deepEqual(JSON.parse(JSON.stringify(analytics)),analytics);assert.equal(Object.keys(analytics.all.zones).length,8);
 assert.equal(analytics.all.outcomes.reduce((x,y)=>x+y,0),96);
});
test("v8 sixteen compositions, eight zones, 5760 actual max-only paired battles",()=>{
 const teams=Object.fromEntries(rosterNames.map(k=>[k,roster(classes[k])])),rows=[],summary={},effects={},zoneStats={};let bouts=0;
 const selected=seeds.slice(0,3);
 for(const zone of GROUP_ARENAS){
  const score=Object.fromEntries(rosterNames.map(k=>[k,[0,0,0]])),status={};let timeouts=0,rounds=0;
  for(let i=0;i<rosterNames.length;i++)for(let j=i+1;j<rosterNames.length;j++){
   const a=rosterNames[i],b=rosterNames[j],pair=[0,0,0];
   for(const seed of selected)for(const swapped of [false,true]){
    const r=resolveTeamBattle(teams[swapped?b:a],teams[swapped?a:b],seed,zone,levels(8)),index=r.outcome==="double_death"?2:(r.outcome==="victory")!==swapped?0:1;
    pair[index]++;score[a][index]++;score[b][index===2?2:1-index]++;bouts++;timeouts+=+(r.reason==="timeout");rounds+=r.rounds;
    for(const ev of r.events)if(["root","stun","paralysis","sleep","silence","antiheal","heal","splash","dispel","cleanse","resist"].includes(ev.type))status[ev.type]=(status[ev.type]??0)+1;
   }
   rows.push([zone.id,a,b,...pair]);
  }
  for(const r of Object.values(score))assert.equal(r.reduce((a,b)=>a+b,0),90);
  summary[zone.id]=score;effects[zone.id]=status;zoneStats[zone.id]={timeouts,rounds,bouts:720};
 }
 assert.equal(bouts,5760);
 // Compact logs: summary separate from pair rows to avoid job-line truncation.
 console.log("EIGHT_ARENAS_SUMMARY "+JSON.stringify({hours,classes,seeds:selected,bouts,summary,zoneStats,effects}));
 for(const z of GROUP_ARENAS)console.log("EIGHT_ARENAS_PAIRS "+JSON.stringify({zone:z.id,rows:rows.filter(r=>r[0]===z.id)}));
});
