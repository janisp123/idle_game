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

import {applyControl,controlActive,rooted,silenced,incapacitated,expireKitEffects,clearControl,kitHeal,kitApproach,wakeOnDamage,kitStrikeModifiers} from "../site/play/class-effects.mjs";
import {CONTROL_CLASS_KITS,CLASS_KITS} from "../site/play/class-kits.mjs";
import {classTacticalInfo} from "../site/play/class-tactical-info.mjs";
import {wound} from "../site/play/physical-actions.mjs";
test("v7 distinct bounded status lifecycle, no refresh, resistance immunity, healing penalty and legacy inertness",()=>{
 const make=()=>({groupCombatRules:7,classId:"oathkeeper",classLevel:50,role:"tank",hp:50,maxHP:100,classControlUntil:0,kitBraceUntil:0,kitSlowUntil:0});
 const a=make();assert.ok(applyControl(a,"root",1));assert.ok(rooted(a));assert.equal(incapacitated(a),undefined);assert.equal(applyControl(a,"root",2),false);assert.equal(applyControl(a,"stun",2),false);
 expireKitEffects(a,4);assert.equal(rooted(a),false);assert.equal(applyControl(a,"paralysis",4),false);assert.ok(applyControl(a,"paralysis",7));assert.equal(incapacitated(a),"paralysis");
 const b=make();assert.ok(applyControl(b,"sleep",1));assert.equal(incapacitated(b),"sleep");wound({inflicted:0},b,1);assert.equal(incapacitated(b),undefined);assert.equal(applyControl(b,"stun",2),false);
 assert.ok(applyControl(b,"silence",2));assert.ok(silenced(b));clearControl(b);assert.equal(silenced(b),false);
 const c=make(),d=make();applyControl(c,"antiheal",1);assert.equal(kitHeal(d,c,.2,1),13);assert.equal(kitHeal(d,d,.2,1),20);
 const e=make();applyControl(e,"slow",1);assert.ok(kitApproach(e)<kitApproach(make()));
 const old={...make(),groupCombatRules:6};assert.equal(applyControl(old,"root",1),false);assert.equal(rooted(old),false);
 assert.equal(Object.keys(CONTROL_CLASS_KITS).length,31);for(const id of Object.keys(CLASS_KITS)){const info=classTacticalInfo(id,7);assert.equal(info.abilities[0].id,CONTROL_CLASS_KITS[id].primary.id);assert.equal(info.abilities[1].id,CONTROL_CLASS_KITS[id].secondary.id);}
});
const controlRange=["oathkeeper","bloodsage","runesage","longshot","windbow","gravebinder","frostweaver"];
const controlMelee=["dreadguard","wellspring","war_dancer","blademaster","linebreaker","trickblade","nightblade"];
const statusTypes=new Set(["root","slow","stun","paralysis","silence","sleep","gloom","antiheal","physical_vulnerability","dispel","cleanse","disabled","silenced","resist"]);
test("v7 actual matched arena bouts: original and control-synergy teams, both sides, max-only v6/v7",()=>{
 const rows=[],allEvents={};
 for(const [name,a,b] of [["original",range,melee],["control_synergy",controlRange,controlMelee]]){
 const p=roster(a),e=roster(b);
 for(const zone of ARENAS)for(const rules of [6,7]){
  const wins=[0,0,0],events={};let timeouts=0,first=[0,0];
  for(let i=0;i<30;i++)for(const swap of [false,true]){
   const r=resolveTeamBattle(swap?e:p,swap?p:e,(20261127+i*7919)>>>0,zone,levels(rules));const n=r.outcome==="double_death"?2:(r.outcome==="victory")!==swap?0:1;wins[n]++;timeouts+=+(r.reason==="timeout");first[0]+=firstDps(r,swap?"enemy":"player");first[1]+=firstDps(r,swap?"player":"enemy");
   for(let j=1;j<r.events.length;j++){
    const ev=r.events[j],prev=r.events[j-1];
    if(statusTypes.has(ev.type)){events[ev.type]=(events[ev.type]??0)+1;if(rules===7)allEvents[ev.type]=(allEvents[ev.type]??0)+1;}
    if(rules===7&&ev.round===prev.round)for(const [id,v] of Object.entries(prev.vitals)){if(v.control?.root&&ev.vitals[id].control?.root){assert.equal(ev.vitals[id].x,v.x);assert.equal(ev.vitals[id].y,v.y);}}
   }
  }
  assert.equal(wins.reduce((x,y)=>x+y,0),60);rows.push({name,zone:zone.id,rules,wins,timeouts,firstDpsRoundSum:first,events});
 }}
 assert.ok(allEvents.root>0&&allEvents.stun>0&&allEvents.paralysis>0&&allEvents.gloom>0&&allEvents.antiheal>0&&allEvents.cleanse>0);
 console.log("INTERLUDE_CONTROL_MATCHED "+JSON.stringify({hours,rows,allEvents}));
});
test("v7 31-class coverage and 2700-bout full terrain screen",()=>{
 const teams=Object.fromEntries(names.map(k=>[k,roster(classes[k])])),rows=[],summary={},abilities={},status={};let bouts=0;
 for(const zone of ARENAS){
  const score=Object.fromEntries(names.map(k=>[k,[0,0,0]]));
  for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){
   const a=names[i],b=names[j],pair=[0,0,0];
   for(const seed of seeds)for(const swapped of [false,true]){
    const r=resolveTeamBattle(teams[swapped?b:a],teams[swapped?a:b],seed,zone,levels(7));const index=r.outcome==="double_death"?2:(r.outcome==="victory")!==swapped?0:1;pair[index]++;score[a][index]++;score[b][index===2?2:1-index]++;bouts++;
    for(const ev of r.events){if(ev.type==="class_ability")abilities[ev.ability]=(abilities[ev.ability]??0)+1;if(statusTypes.has(ev.type))status[ev.type]=(status[ev.type]??0)+1;}
   }
   rows.push([zone.id,a,b,...pair]);
  }
  summary[zone.id]=score;
 }
 assert.equal(bouts,2700);console.log("INTERLUDE_CONTROL_MATRIX "+JSON.stringify({bouts,summary,abilities,status,rows}));
});
