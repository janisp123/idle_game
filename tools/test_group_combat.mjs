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
 g=upgradeBattleGroup(g,budget,52).group;
 for(const m of Object.values(g)){const p=m.classes[m.selected],c=GROUP_CLASSES[m.selected];p.mastery.level=50;m.stances.balanced.level=50;p.expertise[c.loadout]=expertiseThreshold(7);p.expertise[c.armour]=expertiseThreshold(7);p.expertiseActive={...p.expertise};}
 return Object.values(groupSnapshots(g,max));
};
const classic=["oathkeeper","blademaster","longshot","flameweaver","lifekeeper","wardchanter","war_dancer"];
test("seven vs seven actual max-only shared resolver is deterministic, bounded and cooldown-correct",()=>{
 const p=roster(classic),e=roster(["ragebreaker","ironfist","blackbow","galescourge","wellspring","hexchief","forgecaller"]);
 for(const arena of ARENAS){const r=resolveTeamBattle(p,e,20261127,arena,{player:50,enemy:50});
  assert.deepEqual(r,resolveTeamBattle(p,e,20261127,arena,{player:50,enemy:50}));assert.equal(Object.keys(r.survivors).length,14);assert.ok(r.rounds<=32);
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
  for(let j=0;j<5;j++){const r=resolveTeamBattle(p,base,(20261127+i*71+j*199)>>>0,ARENAS[j],{player:50,enemy:50});
   for(const ev of r.events){if(ev.type==="class_ability"&&ev.actor.startsWith("player:"))seen.add(p[Number(ev.actor.split(":")[1])].classId);kinds.add(ev.type);if(ev.type==="heal")assert.ok(ev.healing>0);}
  }
 }
 assert.equal(seen.size,31,"missing "+GROUP_CLASS_IDS.filter(c=>!seen.has(c)).join(","));
 assert.ok(kinds.has("heal")&&kinds.has("ward")&&kinds.has("buff"));
});
test("duplicate healers are legal; combat still terminates without mana or extra actors",()=>{
 const p=roster(Array(7).fill("lifekeeper")),r=resolveTeamBattle(p,p,77,ARENAS[0],{player:50,enemy:50});
 assert.ok(r.rounds<=32);assert.equal(Object.keys(r.survivors).length,14);
});
