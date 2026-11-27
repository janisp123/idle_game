import test from "node:test";
import assert from "node:assert/strict";
import {GROUP_CLASSES,GROUP_CLASS_IDS} from "../site/play/battle-group-classes.mjs";
import {GROUP_IDS,initialBattleGroup,selectGroupClass,groupSnapshots,upgradeBattleGroup} from "../site/play/battle-group.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
import {expertiseThreshold} from "../site/play/expertise.mjs";
import {equipmentPrice,SMITH_BALANCE} from "../site/play/smith.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
const max={str:141,dex:141,end:129,skill:52,difficulty:7};
const budget=7*(5*equipmentPrice({grade:7,quality:"masterwork"})+4*SMITH_BALANCE.firstArmourCost);
const roster=ids=>{
 let g=initialBattleGroup();for(const [i,id] of GROUP_IDS.entries()){const c=GROUP_CLASSES[ids[i]];g=selectGroupClass(g,id,c.race,c.mainClass,c.id);}
 for(const m of Object.values(g))m.classes[m.selected].mastery.level=50;
 g=upgradeBattleGroup(g,budget,52).group;
 for(const m of Object.values(g)){const p=m.classes[m.selected],c=GROUP_CLASSES[m.selected];p.mastery.level=50;m.stances.balanced.level=50;p.expertise[c.loadout]=expertiseThreshold(7);p.expertise[c.armour]=expertiseThreshold(7);p.expertiseActive={...p.expertise};}
 return Object.values(groupSnapshots(g,max));
};
const classic=["oathkeeper","blademaster","longshot","flameweaver","lifekeeper","wardchanter","war_dancer"];
test("seven vs seven actual max-only shared resolver is deterministic, bounded and cooldown-correct",()=>{
 const p=roster(classic),e=roster(["ragebreaker","ironfist","blackbow","galescourge","wellspring","hexchief","forgecaller"]);
 for(const arena of ARENAS){const r=resolveTeamBattle(p,e,20261127,arena,{player:50,enemy:50,groupCombatRules:2});
  assert.deepEqual(r,resolveTeamBattle(p,e,20261127,arena,{player:50,enemy:50,groupCombatRules:2}));assert.equal(Object.keys(r.survivors).length,14);assert.ok(r.rounds<=32);
  const previous={};for(const ev of r.events){for(const v of Object.values(ev.vitals)){assert.ok(v.hp>=0&&v.hp<=v.maxHP);assert.ok(Number.isFinite(v.hp));}
   if(ev.type==="class_ability"){const [side,i]=ev.actor.split(":"),c=GROUP_CLASSES[(side==="player"?p:e)[Number(i)].classId];
    assert.equal(ev.ability,c.ability.effect);if(previous[ev.actor]!==undefined)assert.ok(ev.round-previous[ev.actor]>=c.ability.cooldown);previous[ev.actor]=ev.round;}
  }
  assert.ok(Object.keys(previous).length>=4);assert.ok(["victory","defeat","double_death"].includes(r.outcome));
 }
});
test("all 31 class effects appear in real endgame bouts; healing, ward and offensive actions stay bounded",()=>{
 const base=roster(classic),seen=new Set(),kinds=new Set();
 for(let i=0;i<GROUP_CLASS_IDS.length;i+=7){
  const p=roster(Array.from({length:7},(_,j)=>GROUP_CLASS_IDS[(i+j)%GROUP_CLASS_IDS.length]));
  for(let j=0;j<5;j++){const r=resolveTeamBattle(p,base,(20261127+i*71+j*199)>>>0,ARENAS[j],{player:50,enemy:50,groupCombatRules:2});
   for(const ev of r.events){if(ev.type==="class_ability"&&ev.actor.startsWith("player:"))seen.add(p[Number(ev.actor.split(":")[1])].classId);kinds.add(ev.type);if(ev.type==="heal")assert.ok(ev.healing>0);}
  }
 }
 assert.equal(seen.size,31,"missing "+GROUP_CLASS_IDS.filter(c=>!seen.has(c)).join(","));
 assert.ok(kinds.has("heal")&&kinds.has("ward")&&kinds.has("buff"));
});
test("duplicate healers are legal; combat still terminates without mana or extra actors",()=>{
 const p=roster(Array(7).fill("lifekeeper")),r=resolveTeamBattle(p,p,77,ARENAS[0],{player:50,enemy:50,groupCombatRules:2});
 assert.ok(r.rounds<=32);assert.equal(Object.keys(r.survivors).length,14);
});

test("max-only archers cannot heal; tank shield intercepts arrows, magic bypasses shield",()=>{
 const p=roster(["oathkeeper","grimwarden","grovewarden","dreadguard","lifekeeper","flameweaver","swiftblade"]);
 const e=roster(Array(7).fill("longshot"));let intercepts=0,blocks=0,heals=0;
 for(const arena of ARENAS)for(let i=0;i<4;i++){
  const r=resolveTeamBattle(p,e,20261129+i*1009,arena,{player:50,enemy:50,groupCombatRules:2});
  for(const ev of r.events){if(ev.type==="intercept"&&ev.actor?.startsWith("player:")&&ev.target?.startsWith("enemy:"))intercepts++;if(ev.type==="block"&&ev.move==="shot")blocks++;if(ev.type==="heal"){assert.ok(!ev.actor.startsWith("enemy:"));heals++;}}
 }
 assert.ok(intercepts>0,"no actual arrow interception");assert.ok(blocks>0,"no arrow blocks");assert.ok(heals>0,"no healer action");
 const tanks=roster(Array(7).fill("oathkeeper")),mages=roster(Array(7).fill("flameweaver"));
 for(const arena of ARENAS){const r=resolveTeamBattle(tanks,mages,20261129,arena,{player:50,enemy:50,groupCombatRules:2});assert.ok(!r.events.some(x=>x.type==="block"&&x.move==="spell"));}
});

import {CLASS_KITS} from "../site/play/class-kits.mjs";
test("pilot kits use independent cooldowns, a single action and deterministic legal combat",()=>{
 const ids=["trickblade","swiftblade","nightblade","longshot","windbow","blackbow","oathkeeper","grimwarden","grovewarden","dreadguard"],seen=new Set(),p=roster(["trickblade","swiftblade","nightblade","longshot","windbow","blackbow","oathkeeper"]),q=roster(["grimwarden","grovewarden","dreadguard","flameweaver","lifekeeper","longshot","nightblade"]);
 for(const arena of ARENAS)for(let i=0;i<5;i++){
  const seed=20261201+i*1009,r=resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3});
  assert.deepEqual(r,resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3}));
  const last={},acted=new Set();
  for(const ev of r.events){
   for(const v of Object.values(ev.vitals)){assert.ok(v.hp>=0&&v.hp<=v.maxHP);assert.ok(Number.isInteger(v.hp));}
   if(ev.type!=="class_ability"||!ev.slot)continue;
   const [side,j]=ev.actor.split(":"),snapshot=(side==="player"?p:q)[Number(j)],k=CLASS_KITS[snapshot.classId],ability=k[ev.slot];
   assert.equal(ev.ability,ability.id);const key=ev.actor+":"+ev.slot;
   assert.ok(last[key]===undefined||ev.round-last[key]>=ability.cooldown);
   last[key]=ev.round;assert.ok(!acted.has(ev.actor+":"+ev.round));acted.add(ev.actor+":"+ev.round);seen.add(snapshot.classId);
  }
 }
 assert.deepEqual([...seen].sort(),ids.sort());
});

import {fighter} from "../site/play/physical-actions.mjs";
import {prepareClassActor,classWeapon} from "../site/play/battle-group-actions.mjs";
import {prepareKitActor,expireKitEffects,kitStrikeModifiers,kitControlAllowed,kitApproach} from "../site/play/class-effects.mjs";
import {tryKitAction} from "../site/play/class-ability-policy.mjs";
const meleeBatch=["blademaster","linebreaker","ragebreaker","ironfist","scrapbreaker"];
test("five melee kits have distinct effects, bounded cooldowns and real actions at maximum build",()=>{
 const seen=new Set(),p=roster([...meleeBatch,"oathkeeper","lifekeeper"]),q=roster(["scrapbreaker","ironfist","blademaster","linebreaker","ragebreaker","longshot","flameweaver"]);
 for(const arena of ARENAS)for(let i=0;i<8;i++){
  const seed=20261201+i*1009,r=resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3});
  assert.deepEqual(r,resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3}));
  const last={},acted=new Set();
  for(const ev of r.events){
   for(const v of Object.values(ev.vitals))assert.ok(Number.isInteger(v.hp)&&v.hp>=0&&v.hp<=v.maxHP);
   if(ev.type!=="class_ability"||!ev.slot)continue;
   const [side,j]=ev.actor.split(":"),id=(side==="player"?p:q)[Number(j)].classId;
   const ability=CLASS_KITS[id][ev.slot],key=ev.actor+":"+ev.slot;
   assert.equal(ev.ability,ability.id);assert.ok(last[key]===undefined||ev.round-last[key]>=ability.cooldown);
   assert.ok(!acted.has(ev.actor+":"+ev.round));last[key]=ev.round;acted.add(ev.actor+":"+ev.round);seen.add(id);
  }
 }
 for(const id of meleeBatch)assert.ok(seen.has(id),"no real ability "+id);
});
test("melee passive and utility conditions, expiry, no free action and bounded splash",()=>{
 const ids=[...meleeBatch,"oathkeeper","flameweaver"],snap=roster(ids);
 const mk=(id,side,x,y)=>prepareKitActor(prepareClassActor({...fighter(snap[ids.indexOf(id)],side),classId:id,groupCombatRules:3,id:side+":"+id,x,y,kitRound:1,activeTactic:"balanced",retreats:2,approach:0}));
 const blade=mk("blademaster","player",0,0),fist=mk("ironfist","enemy",1,0),tank=mk("oathkeeper","enemy",1,1),mage=mk("flameweaver","enemy",2,0);
 const events=[],ctx={terrain:ARENAS[0],roll:()=>.5,speedRoll:()=>1,record:(x,y,type,extra={})=>events.push({x,y,type,...extra}),intercept:(x,y)=>y,move:()=>false};
 const use=(x,y,actors,round)=>tryKitAction(x,y,actors,round,classWeapon(x),ctx);
 assert.ok(use(blade,fist,[blade,fist],1));assert.ok(events.some(x=>x.type==="brace"));assert.equal(kitControlAllowed(blade,2),false);expireKitEffects(blade,5);assert.equal(kitControlAllowed(blade,5),true);
 assert.ok(kitStrikeModifiers(blade,tank,{...classWeapon(blade),guardPierce:true},0).blockImpact>0);
 const line=mk("linebreaker","player",0,0);
 assert.ok(kitStrikeModifiers(line,tank,classWeapon(line),1).impact>kitStrikeModifiers(line,tank,classWeapon(line),0).impact);
 line.activeTactic="aggressive";assert.ok(use(line,fist,[line,fist,tank,mage],1));assert.ok(events.filter(x=>x.type==="splash").length<=2);
 const rage=mk("ragebreaker","player",0,0),rageWeapon=classWeapon(rage);
 const normal=kitStrikeModifiers(rage,tank,rageWeapon,0).impact;rage.hp=Math.floor(rage.maxHP*.3);
 assert.ok(kitStrikeModifiers(rage,tank,rageWeapon,0).impact>normal);assert.ok(use(rage,fist,[rage,fist],1));assert.ok(rage.classGuard>0);
 const monk=mk("ironfist","player",0,0),far=mk("flameweaver","enemy",4,0);
 assert.ok(use(monk,far,[monk,far],1));assert.equal(monk.kitTotemMode,"balanced");assert.ok(kitApproach(monk)>1);expireKitEffects(monk,5);assert.equal(kitApproach(monk),1);
 const scrap=mk("scrapbreaker","player",0,0);
 assert.ok(kitStrikeModifiers(scrap,tank,classWeapon(scrap),0).impact>kitStrikeModifiers(scrap,mage,classWeapon(scrap),0).impact);
});

const mageBatch=["flameweaver","gravebinder","frostweaver","galescourge"];
test("four mage kits act in actual endgame combat with bounded cooldowns and deterministic replay",()=>{
 const p=roster([...mageBatch,"oathkeeper","lifekeeper","linebreaker"]),q=roster(["frostweaver","galescourge","trickblade","swiftblade","grovewarden","longshot","gravebinder"]);
 const seen=new Set();
 for(const arena of ARENAS)for(let i=0;i<8;i++){
  const seed=20261231+i*1009,r=resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3});
  assert.deepEqual(r,resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3}));
  const last={},acted=new Set();
  for(const ev of r.events){
   for(const v of Object.values(ev.vitals))assert.ok(Number.isInteger(v.hp)&&v.hp>=0&&v.hp<=v.maxHP);
   if(ev.type!=="class_ability"||!ev.slot)continue;
   const [side,j]=ev.actor.split(":"),id=(side==="player"?p:q)[Number(j)].classId,ability=CLASS_KITS[id][ev.slot],key=ev.actor+":"+ev.slot;
   assert.equal(ev.ability,ability.id);assert.ok(last[key]===undefined||ev.round-last[key]>=ability.cooldown);
   assert.ok(!acted.has(ev.actor+":"+ev.round));last[key]=ev.round;acted.add(ev.actor+":"+ev.round);seen.add(id);
  }
 }
 for(const id of mageBatch)assert.ok(seen.has(id),"no real ability "+id);
});
test("mage passives and abilities enforce splash geometry, ward expiry, control immunity and actual damage-linked healing",()=>{
 const ids=[...mageBatch,"oathkeeper","longshot","trickblade"],snap=roster(ids);
 const mk=(id,side,x,y)=>prepareKitActor(prepareClassActor({...fighter(snap[ids.indexOf(id)],side),groupCombatRules:3,id:side+":"+id,x,y,kitRound:1,activeTactic:"balanced",retreats:2,approach:0}));
 const flame=mk("flameweaver","player",0,0),grave=mk("gravebinder","player",0,0),frost=mk("frostweaver","player",0,0),gale=mk("galescourge","player",0,0);
 const bow=mk("longshot","enemy",1,0),dagger=mk("trickblade","enemy",1,1),tank=mk("oathkeeper","enemy",2,0),far=mk("longshot","enemy",3,0);
 const events=[];let index=0;
 const ctx={terrain:ARENAS[0],roll:()=>[0,.99,.5][index++%3],speedRoll:()=>1,record:(x,y,type,extra={})=>events.push({x,y,type,...extra}),intercept:(x,y)=>y,move:()=>false};
 const use=(x,y,actors,round)=>{index=0;events.length=0;x.kitRound=round;return tryKitAction(x,y,actors,round,classWeapon(x),ctx);};
 const mods=(x,y)=>kitStrikeModifiers(x,y,classWeapon(x),0);
 assert.ok(mods(frost,tank).recovery<mods(gale,tank).recovery);assert.ok(mods(frost,tank).impact<mods(gale,tank).impact);
 assert.ok(use(flame,bow,[flame,bow,dagger,tank,far],1));
 assert.ok(events.some(x=>x.type==="class_ability"&&x.ability==="fire_ring"));
 assert.ok(events.some(x=>x.type==="splash"));assert.ok(events.filter(x=>x.type==="splash").length<=2);
 assert.ok(!events.some(x=>x.type==="splash"&&x.y===far));
 const normal=mods(grave,tank).impact;assert.ok(use(grave,tank,[grave,tank],1));assert.ok(tank.classWeaken>0);assert.ok(mods(grave,tank).impact>normal);
 grave.hp=Math.floor(grave.maxHP*.4);grave.recovery=0;assert.ok(use(grave,tank,[grave,tank],2));assert.ok(grave.classGuard>0);
 assert.ok(use(frost,dagger,[frost,dagger],1));assert.ok(events.some(x=>x.type==="control"));assert.equal(kitControlAllowed(dagger,2),false);
 frost.recovery=0;frost.kitReady.secondary=1;assert.ok(use(frost,dagger,[frost,dagger],2));assert.ok(!events.some(x=>x.type==="control"));
 gale.hp=Math.floor(gale.maxHP*.4);const before=gale.hp;assert.ok(use(gale,tank,[gale,tank],1));const heal=events.find(x=>x.type==="heal");
 assert.ok(heal&&heal.healing>0);assert.equal(gale.hp-before,heal.healing);assert.ok(heal.healing<=Math.max(1,Math.round(heal.fromDamage*.35)));assert.ok(heal.healing<=Math.round(gale.maxHP*.12));
});
