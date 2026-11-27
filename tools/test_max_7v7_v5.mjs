// BATTLE-GROUP-001: real v5 resolver, six-month alpha max, no changes to gameplay.
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
test("v5 six-month maximum 7v7 paired terrain matrix (2700 real bouts)",()=>{
 const teams=Object.fromEntries(names.map(k=>[k,roster(classes[k])])),rows=[],summary={};let bouts=0;
 for(const zone of ARENAS){
  const score=Object.fromEntries(names.map(k=>[k,[0,0,0]]));
  for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
   const a=names[i],b=names[j],pair=[0,0,0];
   for(const seed of seeds)for(const swapped of [false,true]){
    const r=resolveTeamBattle(teams[swapped?b:a],teams[swapped?a:b],seed,zone,{player:50,enemy:50,groupCombatRules:5});
    const index=r.outcome==="double_death"?2:(r.outcome==="victory")!==swapped?0:1;
    pair[index]++;score[a][index]++;score[b][index===2?2:1-index]++;bouts++;
   }
   rows.push([zone.id,a,b,...pair]);
  }
  summary[zone.id]=score;
 }
 assert.equal(bouts,2700);for(const s of Object.values(summary))for(const a of Object.values(s))assert.equal(a.reduce((x,y)=>x+y,0),108);
 const stats=Object.fromEntries(Object.values(teams).flat().map(x=>[x.classId,x.attributes]));
 console.log("MAX_7V7_V5_SCREEN "+JSON.stringify({rules:5,hours,grade:7,quality:"masterwork",classMastery:50,stance:"balanced",stanceMastery:50,teamwork:50,seeds,bouts,classes,stats,summary,rows}));
});

test("balanced long range versus balanced melee, matched core, every terrain (600 bouts)",()=>{
 const range=["oathkeeper","lifekeeper","runesage","longshot","blackbow","flameweaver","galescourge"];
 const melee=["oathkeeper","lifekeeper","runesage","blademaster","linebreaker","trickblade","nightblade"];
 const ranged=roster(range),close=roster(melee),rows=[];
 for(const zone of ARENAS){
  const counts=[0,0,0],details=[];
  for(let i=0;i<60;i++)for(const swapped of [false,true]){
   const seed=(20261127+i*7919)>>>0;
   const r=resolveTeamBattle(swapped?close:ranged,swapped?ranged:close,seed,zone,{player:50,enemy:50,groupCombatRules:5});
   const index=r.outcome==="double_death"?2:(r.outcome==="victory")!==swapped?0:1;
   counts[index]++;
   details.push({seed,swapped,outcome:r.outcome});
  }
  assert.equal(counts.reduce((a,b)=>a+b,0),120);rows.push({zone:zone.id,rangeWins:counts[0],meleeWins:counts[1],draws:counts[2],details});
 }
 console.log("BALANCED_RANGE_MELEE_V5 "+JSON.stringify({range,melee,hours,rows}));
});
