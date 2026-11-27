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
function roster(ids,stances=ids.map(()=>"balanced")){
 let g=initialBattleGroup();
 for(const [i,id] of GROUP_IDS.entries()){
  const c=GROUP_CLASSES[ids[i]];g=selectGroupClass(g,id,c.race,c.mainClass,c.id);
  const m=g[id],p=m.classes[c.id],item={grade:7,quality:"masterwork"};
  p.mastery={level:50,xp:0};m.stance=stances[i];m.stances[stances[i]]={level:50,xp:0};
  p.equipment=Object.fromEntries([c.loadout,...ARMOUR_SLOTS.map(s=>s.id+":"+c.armour)].map(k=>[k,{...item}]));
  p.expertise[c.loadout]=expertiseThreshold(7);p.expertise[c.armour]=expertiseThreshold(7);p.expertiseActive={...p.expertise};
  p.attributeEffort=awardCharacterEffort(blankCharacterEffort(),c.id,hours*3600000);p.attributeEffortActive={...p.attributeEffort};
 }
 const p=Object.values(groupSnapshots(g,{str:141,dex:141,end:129,skill:52,difficulty:7},9));
 assert.equal(p.length,7);for(const a of p){assert.equal(a.classLevel,50);assert.equal(a.tacticLevel,50);assert.ok(a.attributes);assert.ok(Object.values(a.trainingKit.equipment).every(i=>i.grade===7&&i.quality==="masterwork"));}
 return p;
}


import {GROUP_ARENAS} from "../site/play/arenas.mjs";
const siege=["grovewarden","wellspring","hexchief","linebreaker","flameweaver","forgecaller","war_dancer"];
const melee=["oathkeeper","lifekeeper","runesage","blademaster","linebreaker","trickblade","nightblade"];
const ranged=["oathkeeper","lifekeeper","runesage","longshot","blackbow","flameweaver","galescourge"];
const control=["oathkeeper","bloodsage","runesage","longshot","windbow","gravebinder","frostweaver"];
const replace=(a,i,v)=>a.map((x,j)=>i===j?v:x);
const configs={
 siege:{ids:siege},melee:{ids:melee},ranged:{ids:ranged},control:{ids:control},
 ambush:{ids:["grimwarden","bloodsage","war_dancer","trickblade","swiftblade","nightblade","beastcaller"]},
 attrition:{ids:["dreadguard","bloodsage","warcaller","gravebinder","shadebinder","galescourge","spiritcaller"]},
 balanced:{ids:classes.balanced},
 siege_no_forge:{ids:replace(siege,5,"blademaster")},
 siege_no_hex:{ids:replace(siege,2,"runesage")},
 siege_no_line:{ids:replace(siege,3,"ragebreaker")},
 siege_no_dance:{ids:replace(siege,6,"wardchanter")},
 siege_no_tank:{ids:replace(siege,0,"galescourge")},
 siege_no_healer:{ids:replace(siege,1,"nightblade")},
 siege_tactical:{ids:siege,stances:["defensive","defensive","balanced","aggressive","aggressive","aggressive","balanced"]},
 siege_aggressive:{ids:siege,stances:siege.map(()=>"aggressive")},
 anti_siege:{ids:["dreadguard","wellspring","gravebinder","galescourge","frostweaver","runesage","nightblade"]}
};
const ids=Object.keys(configs),teams=Object.fromEntries(ids.map(k=>[k,roster(configs[k].ids,configs[k].stances)]));
const levels={player:50,enemy:50,groupCombatRules:9};
const seedSet=[27112801,27113197,27113869,27114541];
const resultIndex=(r,swap)=>r.outcome==="double_death"?2:(r.outcome==="victory")!==swap?0:1;
function stats(){return {w:0,l:0,d:0,timeout:0,koW:0,koL:0,rounds:0,endHP:0,enemyHP:0,damage:0,healing:0,disabled:0};}
function add(s,r,side,index){
 s[["w","l","d"][index]]++;s.timeout+=+(r.reason==="timeout");s.koW+=+(index===0&&r.reason==="knockout");s.koL+=+(index===1&&r.reason==="knockout");s.rounds+=r.rounds;
 const end=r.events.at(-1).vitals,start=r.events[0].vitals,keys=Object.keys(end).filter(k=>k.startsWith(side+":")),other=Object.keys(end).filter(k=>!keys.includes(k));
 const fraction=ks=>ks.reduce((sum,k)=>sum+end[k].hp,0)/ks.reduce((sum,k)=>sum+start[k].maxHP,0);
 s.endHP+=fraction(keys);s.enemyHP+=fraction(other);
 for(const e of r.events){if(e.actor?.startsWith(side+":")){s.damage+=e.damage??0;s.healing+=e.healing??0;}if(e.type==="disabled"&&e.actor?.startsWith(side+":"))s.disabled++;}
}
function bout(a,b,seed,z,swap){return resolveTeamBattle(teams[swap?b:a],teams[swap?a:b],seed,z,levels);}
test("v9 targeted meta screen: 16 competitive and ablation compositions across all eight zones",()=>{
 let total=0;const summary={};
 for(const z of GROUP_ARENAS){
  const score=Object.fromEntries(ids.map(k=>[k,stats()])),pairs=[];
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
   const a=ids[i],b=ids[j],pair=[0,0,0];let timeouts=0,ko=[0,0,0];
   for(const seed of seedSet)for(const swap of [false,true]){
    const r=bout(a,b,seed,z,swap),ix=resultIndex(r,swap);pair[ix]++;timeouts+=+(r.reason==="timeout");if(r.reason==="knockout")ko[ix]++;
    add(score[a],r,swap?"enemy":"player",ix);add(score[b],r,swap?"player":"enemy",ix===2?2:1-ix);total++;
   }
   pairs.push([a,b,...pair,timeouts,...ko]);
  }
  for(const s of Object.values(score))assert.equal(s.w+s.l+s.d,120);
  summary[z.id]=Object.fromEntries(Object.entries(score).map(([k,s])=>[k,[s.w,s.l,s.d,s.timeout,s.koW,s.koL]]));
  console.log("META_V9_ZONE "+JSON.stringify({zone:z.id,score,pairs}));
 }
 assert.equal(total,7680);
 console.log("META_V9_SUMMARY "+JSON.stringify({total,hours,seedSet,configs,summary}));
});
test("v9 independent confirmation: siege against six specialized opponents, mirrored 12 new seeds per zone",()=>{
 const opponents=["melee","ranged","control","attrition","anti_siege","siege_tactical"],out={};let total=0;
 for(const z of GROUP_ARENAS){
  const rows={};for(const b of opponents){
   const pair=[0,0,0],s=stats(),opp=stats();const perClass={};
   for(let i=0;i<12;i++)for(const swap of [false,true]){
    const seed=(27120001+7919*i)>>>0,r=bout("siege",b,seed,z,swap),ix=resultIndex(r,swap),side=swap?"enemy":"player";pair[ix]++;add(s,r,side,ix);add(opp,r,swap?"player":"enemy",ix===2?2:1-ix);
    for(const ev of r.events){if(!ev.actor?.startsWith(side+":"))continue;const k=siege[Number(ev.actor.split(":")[1])],v=perClass[k]??(perClass[k]={damage:0,heal:0,abilities:{},disabled:0});v.damage+=ev.damage??0;v.heal+=ev.healing??0;if(ev.type==="class_ability")v.abilities[ev.ability]=(v.abilities[ev.ability]??0)+1;if(ev.type==="disabled")v.disabled++;}
    total++;
   }
   rows[b]={pair,siege:s,opponent:opp,perClass};
  }
  out[z.id]=Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v.pair]));
  console.log("META_V9_CONFIRM_ZONE "+JSON.stringify({zone:z.id,rows}));
 }
 assert.equal(total,1152);console.log("META_V9_CONFIRM "+JSON.stringify({total,out}));
});
