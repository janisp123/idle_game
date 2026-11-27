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
 assert.deepEqual([...seen].filter(id=>ids.includes(id)).sort(),ids.sort());
});

import {fighter} from "../site/play/physical-actions.mjs";
import {prepareClassActor,classWeapon} from "../site/play/battle-group-actions.mjs";
import {prepareKitActor,expireKitEffects,kitStrikeModifiers,kitControlAllowed,kitApproach,kitPactHeal,kitControlDuration} from "../site/play/class-effects.mjs";
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

const healerBatch=["lifekeeper","wellspring","bloodsage"];
test("three healer kits use independent cooldowns and one action per round in max-only battles",()=>{
 const p=roster([...healerBatch,"oathkeeper","blademaster","linebreaker","longshot"]),q=roster(["frostweaver","galescourge","trickblade","scrapbreaker","grovewarden","longshot","gravebinder"]);
 const seen=new Set();
 for(const arena of ARENAS)for(let i=0;i<8;i++){
  const seed=20261301+i*1009,r=resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3});
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
 for(const id of healerBatch)assert.ok(seen.has(id),"no real ability "+id);
});
test("healers rescue before group healing, respect recipient window, cleanse, sanctuary and bounded melee pact",()=>{
 const ids=[...healerBatch,"oathkeeper","blademaster","linebreaker","trickblade"],snap=roster(ids);
 const mk=(id,side,x,y)=>prepareKitActor(prepareClassActor({...fighter(snap[ids.indexOf(id)],side),groupCombatRules:3,id:side+":"+id,x,y,kitRound:1,activeTactic:"balanced",retreats:2,approach:0}));
 const life=mk("lifekeeper","player",0,0),well=mk("wellspring","player",0,1),blood=mk("bloodsage","player",0,2);
 const tank=mk("oathkeeper","player",1,0),blade=mk("blademaster","player",1,2),line=mk("linebreaker","player",2,0),enemy=mk("trickblade","enemy",2,2);
 const events=[],ctx={terrain:ARENAS[0],roll:()=>.5,speedRoll:()=>1,record:(x,y,type,extra={})=>events.push({x,y,type,...extra}),intercept:(x,y)=>y,move:()=>false};
 const actors=[life,well,blood,tank,blade,line,enemy],use=(x,round)=>{events.length=0;x.kitRound=round;return tryKitAction(x,enemy,actors,round,classWeapon(x),ctx);};
 tank.hp=Math.floor(tank.maxHP*.2);blade.hp=Math.floor(blade.maxHP*.5);line.hp=0;
 assert.ok(use(life,1));assert.ok(events.some(x=>x.ability==="greater_mend"&&x.type==="heal"&&x.y===tank));
 assert.equal(tank.nextHealRound,3);assert.equal(line.hp,0);
 tank.hp=Math.floor(tank.maxHP*.6);life.hp=Math.floor(life.maxHP*.6);life.recovery=0;
 assert.ok(use(life,2));assert.ok(events.some(x=>x.ability==="group_mend"));assert.ok(events.filter(x=>x.type==="heal").length<=3);assert.ok(!events.some(x=>x.type==="heal"&&(x.y===tank||x.y===line)));
 blade.hp=Math.floor(blade.maxHP*.2);blade.nextHealRound=0;blade.bleed=2;blade.stagger=1;blade.classWeaken=.1;blade.kitSlowUntil=8;
 assert.ok(use(well,3));assert.ok(events.some(x=>x.type==="cleanse"&&x.y===blade));assert.equal(blade.bleed+blade.stagger+blade.classWeaken+blade.kitSlowUntil,0);
 well.recovery=0;blade.hp=Math.floor(blade.maxHP*.5);
 assert.ok(use(well,4));assert.ok(events.some(x=>x.type==="sanctuary"));const ward=events.find(x=>x.type==="sanctuary").y;assert.equal(kitControlAllowed(ward,5),false);expireKitEffects(ward,7);assert.equal(kitControlAllowed(ward,7),true);
 assert.equal(kitControlDuration(well),4);
 tank.hp=tank.maxHP;life.hp=life.maxHP;blade.hp=Math.floor(blade.maxHP*.5);blade.nextHealRound=0;
 assert.ok(use(blood,5));assert.ok(events.some(x=>x.type==="blood_pact"&&x.y===blade));
 const before=blade.hp,heal=kitPactHeal(blade,100,5);assert.ok(heal>0&&heal<=25&&heal<=Math.floor(blade.maxHP*.08));assert.equal(blade.hp,before+heal);
 assert.equal(kitPactHeal(blade,100,6),0);assert.equal(kitPactHeal(blade,0,7),0);expireKitEffects(blade,10);assert.equal(kitPactHeal(blade,100,10),0);
});

const supportBatch=["runesage","wardchanter","war_dancer","hexchief","warcaller"];
test("five support kits use independent cooldowns and single actions in max-only battles",()=>{
 const p=roster([...supportBatch,"blademaster","longshot"]),q=roster(["oathkeeper","frostweaver","trickblade","scrapbreaker","gravebinder","longshot","lifekeeper"]);
 const seen=new Set();
 for(const arena of ARENAS)for(let i=0;i<8;i++){
  const seed=20261311+i*1009,r=resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3});
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
 for(const id of supportBatch)assert.ok(seen.has(id),"no real ability "+id);
});
test("support buffs are bounded, stance dependent, expire and seal cannot chain indefinitely",()=>{
 const ids=[...supportBatch,"ragebreaker","frostweaver"],snap=roster(ids);
 const mk=(id,side,x,y)=>prepareKitActor(prepareClassActor({...fighter(snap[ids.indexOf(id)],side),groupCombatRules:3,id:side+":"+id+":"+x+":"+y,x,y,kitRound:1,activeTactic:"balanced",retreats:2,approach:0}));
 const rune=mk("runesage","player",0,0),ward=mk("wardchanter","player",0,1),dance=mk("war_dancer","player",0,2),hex=mk("hexchief","player",1,1),chant=mk("warcaller","player",1,2);
 const ally=mk("ragebreaker","player",1,0),ally2=mk("frostweaver","player",1,3);
 const foe=mk("ragebreaker","enemy",2,0),foe2=mk("frostweaver","enemy",2,1),foe3=mk("frostweaver","enemy",3,1),far=mk("frostweaver","enemy",7,7);
 const actors=[rune,ward,dance,hex,chant,ally,ally2,foe,foe2,foe3,far],events=[],ctx={terrain:ARENAS[0],roll:()=>.5,speedRoll:()=>1,record:(x,y,type,extra={})=>events.push({x,y,type,...extra}),intercept:(x,y)=>y,move:()=>false};
 const use=(x,round,target=foe)=>{events.length=0;x.kitRound=round;return tryKitAction(x,target,actors,round,classWeapon(x),ctx);};
 ally.hp=Math.floor(ally.maxHP*.5);rune.activeTactic="defensive";
 assert.ok(use(rune,1));assert.equal(events.filter(x=>x.type==="ward").length,1);assert.ok(ally.classGuard>.24);
 const originalGuard=ally.classGuard;assert.ok(use(ward,1));assert.ok(events.filter(x=>x.type==="ward").length<=3);assert.equal(ally.classGuard,originalGuard);
 assert.ok(use(dance,1));assert.ok(events.some(x=>x.type==="tempo"&&x.y===ally));assert.ok(events.filter(x=>x.type==="tempo").length<=3);
 assert.ok(kitStrikeModifiers(ally,foe,classWeapon(ally),0).recovery<0);expireKitEffects(ally,4);assert.equal(kitStrikeModifiers(ally,foe,classWeapon(ally),0).recovery,0);
 chant.activeTactic="defensive";assert.ok(use(chant,1));assert.ok(events.filter(x=>x.type==="ward").length<=3);assert.ok(events.some(x=>x.type==="ward"&&x.until===5));
 assert.ok(use(hex,1,foe2));assert.equal(events.filter(x=>x.type==="seal").length,3);assert.equal(foe2.kitReady.primary,2);assert.equal(far.kitReady.primary,1);
 hex.recovery=0;hex.kitReady.secondary=1;assert.ok(use(hex,2,foe2));assert.ok(!events.some(x=>x.type==="seal"));assert.equal(foe2.kitReady.primary,2);
 expireKitEffects(foe2,5);assert.equal(foe2.kitSealUntil,0);
});

const summonerBatch=["beastcaller","spiritcaller","shadebinder","forgecaller"];
test("all 31 classes have immutable unique kits and summoners act in real max-only bouts",()=>{
 assert.deepEqual(Object.keys(CLASS_KITS).sort(),[...GROUP_CLASS_IDS].sort());
 const abilityIds=new Set();
 for(const k of Object.values(CLASS_KITS)){
  assert.ok(Object.isFrozen(k));assert.ok(k.passive);
  for(const ability of [k.primary,k.secondary]){assert.ok(Object.isFrozen(ability));assert.ok(!abilityIds.has(ability.id));abilityIds.add(ability.id);}
 }
 const p=roster([...summonerBatch,"oathkeeper","longshot","lifekeeper"]),q=roster(["blademaster","frostweaver","trickblade","scrapbreaker","gravebinder","longshot","forgecaller"]);
 const seen=new Set();
 for(const arena of ARENAS)for(let i=0;i<8;i++){
  const seed=20261411+i*1009,r=resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3});
  assert.deepEqual(r,resolveTeamBattle(p,q,seed,arena,{player:50,enemy:50,groupCombatRules:3}));
  assert.equal(Object.keys(r.survivors).length,14);
  const last={},acted=new Set();
  for(const ev of r.events){
   for(const v of Object.values(ev.vitals))assert.ok(Number.isInteger(v.hp)&&v.hp>=0&&v.hp<=v.maxHP);
   if(ev.type==="siege_release"||ev.type==="siege_fizzle"){assert.ok(!acted.has(ev.actor+":"+ev.round));acted.add(ev.actor+":"+ev.round);continue;}
   if(ev.type!=="class_ability"||!ev.slot)continue;
   const [side,j]=ev.actor.split(":"),id=(side==="player"?p:q)[Number(j)].classId,ability=CLASS_KITS[id][ev.slot],key=ev.actor+":"+ev.slot;
   assert.equal(ev.ability,ability.id);assert.ok(last[key]===undefined||ev.round-last[key]>=ability.cooldown);
   assert.ok(!acted.has(ev.actor+":"+ev.round));last[key]=ev.round;acted.add(ev.actor+":"+ev.round);seen.add(id);
  }
 }
 for(const id of summonerBatch)assert.ok(seen.has(id),"no real ability "+id);
});
test("summoner effects are bounded, use existing fighters and siege has a paid delayed release or fizzle",()=>{
 const ids=[...summonerBatch,"oathkeeper","longshot","trickblade"],snap=roster(ids);
 const mk=(id,side,x,y)=>prepareKitActor(prepareClassActor({...fighter(snap[ids.indexOf(id)],side),groupCombatRules:3,id:side+":"+id+":"+x+":"+y,x,y,kitRound:1,activeTactic:"balanced",retreats:2,approach:0}));
 const beast=mk("beastcaller","player",0,0),spirit=mk("spiritcaller","player",0,1),shade=mk("shadebinder","player",0,2),forge=mk("forgecaller","player",1,2);
 const tank=mk("oathkeeper","player",1,0),foe=mk("longshot","enemy",2,2),near=mk("trickblade","enemy",2,1),far=mk("longshot","enemy",7,7);
 const actors=[beast,spirit,shade,forge,tank,foe,near,far],events=[];let i=0;
 const ctx={terrain:ARENAS[0],roll:()=>[0,.99,.5][i++%3],speedRoll:()=>1,record:(x,y,type,extra={})=>events.push({x,y,type,...extra}),intercept:(x,y)=>y,move:()=>false};
 const use=(x,round,target=foe)=>{events.length=0;i=0;x.kitRound=round;return tryKitAction(x,target,actors,round,classWeapon(x),ctx);};
 const direct=kitStrikeModifiers(beast,foe,classWeapon(beast),1).impact;
 assert.ok(kitStrikeModifiers(beast,foe,{...classWeapon(beast),familiar:true},1).impact>direct);
 assert.ok(use(beast,1,near));assert.ok(events.some(x=>x.ability==="familiar_aid"&&x.type==="buff"));
 tank.hp=Math.floor(tank.maxHP*.5);assert.ok(use(spirit,1,near));assert.ok(events.some(x=>x.ability==="spirit_aid"&&x.type==="heal"&&x.y===tank));
 assert.ok(use(shade,1,foe));assert.ok(foe.classWeaken>0&&foe.kitDisruptUntil>0);
 assert.ok(kitApproach(forge)<1);
 assert.ok(kitStrikeModifiers(near,forge,classWeapon(near),0).impact<kitStrikeModifiers(near,tank,classWeapon(near),0).impact||kitStrikeModifiers(near,forge,classWeapon(near),0).impact<1);
 const before=foe.hp;assert.ok(use(forge,1));assert.ok(events.some(x=>x.type==="siege_charge"));assert.equal(foe.hp,before);
 assert.equal(forge.kitReady.secondary,8);forge.recovery=0;assert.ok(use(forge,3));assert.ok(events.some(x=>x.type==="siege_release"));assert.ok(foe.hp<before);assert.ok(events.filter(x=>x.type==="splash").length<=2);assert.ok(!events.some(x=>x.type==="splash"&&x.y===far));assert.equal(forge.kitSiege,null);
 forge.recovery=0;forge.kitReady.secondary=1;assert.ok(use(forge,8));foe.x=6;forge.recovery=0;assert.ok(use(forge,10,near));assert.ok(events.some(x=>x.type==="siege_fizzle"));assert.ok(!events.some(x=>x.type==="hit"||x.type==="splash"));assert.equal(forge.kitSiege,null);
});
