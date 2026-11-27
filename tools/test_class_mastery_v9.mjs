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



import {GROUP_ARENAS} from "../site/play/arenas.mjs";
import {kitStrength,classMasteryStrength} from "../site/play/class-kits.mjs";
import {classStatusLands,statStatusResistance} from "../site/play/stat-combat.mjs";
import {kitHeal,applyControl,healingFactor,expireKitEffects,clearControl} from "../site/play/class-effects.mjs";
test("mastery v9 doubles scalable class skill effectiveness from level 1 to 50 and retains v8",()=>{
 assert.equal(classMasteryStrength(1),.5);assert.equal(classMasteryStrength(50),1);
 let previous=0;for(let i=1;i<=50;i++){const n=classMasteryStrength(i);assert.ok(n>previous&&n<=1);previous=n;}
 const make=(level,rules=9)=>({groupCombatRules:rules,classId:"oathkeeper",classLevel:level,role:"tank",hp:50,maxHP:100,attributes:{STR:100,DEX:100,CON:100,INT:100,WIT:100,MEN:100}});
 assert.equal(kitStrength(make(1,8)),.75);assert.equal(kitStrength(make(50,8)),1);
 assert.equal(kitHeal(make(1),make(50),.2,1),10);assert.equal(kitHeal(make(50),make(50),.2,1),20);
 const target=make(50),low=make(1),high=make(50),r=statStatusResistance(target,"magic");let novice=0,master=0,legacy=0;
 for(let i=0;i<10000;i++){const roll=()=>i/10000;novice+=+classStatusLands(low,target,"magic",roll);master+=+classStatusLands(high,target,"magic",roll);legacy+=+classStatusLands(make(50,8),target,"magic",roll);}
 assert.equal(master,legacy);assert.ok(Math.abs(novice*2-master)<=2);assert.ok(Math.abs(master/10000-(1-r))<.001);
 const a=make(50),b=make(50);assert.ok(applyControl(a,"antiheal",1,low));assert.ok(applyControl(b,"antiheal",1,high));assert.equal(healingFactor(a),.825);assert.equal(healingFactor(b),.65);
 assert.ok(applyControl(a,"gloom",1,low));assert.ok(applyControl(b,"gloom",1,high));assert.equal(a.controlStrength.gloom,.5);assert.equal(b.controlStrength.gloom,1);
 assert.equal(a.controlEffects.gloom,b.controlEffects.gloom);assert.ok(applyControl(a,"root",1,low));assert.ok(applyControl(b,"root",1,high));assert.equal(a.controlEffects.root,b.controlEffects.root);assert.equal(a.classControlUntil,b.classControlUntil);
 expireKitEffects(a,5);assert.equal(healingFactor(a),1);assert.equal(a.controlStrength.antiheal,undefined);clearControl(b);assert.equal(healingFactor(b),1);
 console.log("MASTERY_CURVE "+JSON.stringify({novice,master,legacy,physicalResistance:statStatusResistance(target,"physical"),magicResistance:r}));
});
test("v9 level 50 combat is exactly v8 in 240 paired max-only bouts across all eight zones",()=>{
 const rosterList=Object.values(classes).map(roster);let count=0;
 for(const zone of GROUP_ARENAS)for(let i=0;i<5;i++)for(let j=0;j<3;j++)for(const swap of [false,true]){
  const a=rosterList[i],b=rosterList[(i+j+5)%rosterList.length],seed=seeds[j];
  const p=swap?b:a,q=swap?a:b;
  assert.deepEqual(resolveTeamBattle(p,q,seed,zone,levels(9)),resolveTeamBattle(p,q,seed,zone,levels(8)));
  count++;
 }
 assert.equal(count,240);console.log("MASTERY_MAX_PARITY "+count);
});
