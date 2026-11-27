// Stage 5: reproducible max-only screen; no tune-to-pass thresholds.
import test from "node:test";
import assert from "node:assert/strict";
import {GROUP_CLASSES,GROUP_CLASS_IDS,DEFAULT_GROUP_CLASSES} from "../site/play/battle-group-classes.mjs";
import {GROUP_IDS,initialBattleGroup,selectGroupClass,selectGroupStance,groupSnapshots} from "../site/play/battle-group.mjs";
import {rankProfile} from "../site/play/battle-group-rank.mjs";
import {buildGroupCloneTeam} from "../site/play/battle-group-clones.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {ITEM_GRADES} from "../site/play/smith.mjs";
import {expertiseThreshold} from "../site/play/expertise.mjs";
import {teamArenaReward} from "../site/play/team-timeline.mjs";
const profile=rankProfile(7),shared=profile.shared,base=[...DEFAULT_GROUP_CLASSES],seeds=[20261127,20261219];
const slots={tank:0,melee:1,ranged:2,mage:3,healer:4,support:5,summoner:6};
const pool=Object.values(GROUP_CLASSES);
function roster(ids,stances=ids.map(()=>"balanced")){
 let g=initialBattleGroup();
 for(const [i,id] of GROUP_IDS.entries()){
  const c=GROUP_CLASSES[ids[i]];
  g=selectGroupClass(g,id,c.race,c.mainClass,c.id);g=selectGroupStance(g,id,stances[i]);
  const m=g[id],p=m.classes[c.id];p.mastery={level:50,xp:0};m.stances[stances[i]]={level:50,xp:0};
  // Exact legal endgame kit, no purchases or early-grade sweep.
  p.equipment[c.loadout]={grade:7,quality:"masterwork"};
  for(const slot of ["head","torso","arms","legs"])p.equipment[slot+":"+c.armour]={grade:7,quality:"masterwork"};
  p.expertise[c.loadout]=expertiseThreshold(7);p.expertise[c.armour]=expertiseThreshold(7);p.expertiseActive={...p.expertise};
 }
 const snapshots=Object.values(groupSnapshots(g,shared));
 for(const p of snapshots){assert.equal(p.classLevel,50);assert.equal(p.tacticLevel,50);assert.equal(Object.keys(p.trainingKit.equipment).length,5);assert.ok(Object.values(p.trainingKit.equipment).every(i=>i.grade===7&&i.quality==="masterwork"));}
 return snapshots;
}
const configs=[{name:"default",ids:base}];
for(const id of GROUP_CLASS_IDS){const c=GROUP_CLASSES[id],ids=[...base];ids[slots[c.role]]=id;configs.push({name:"sub:"+id,ids});}
for(const role of Object.keys(slots)){const ids=pool.filter(c=>c.role===role).map(c=>c.id);configs.push({name:"stack:"+role,ids:Array.from({length:7},(_,i)=>ids[i%ids.length])});}
for(const [name,stances] of [["all aggressive",base.map(()=>"aggressive")],["all defensive",base.map(()=>"defensive")],["role stances",["defensive","aggressive","aggressive","balanced","defensive","defensive","balanced"]]])configs.push({name,ids:base,stances});
const add=(r,out,reverse)=>{const i=out==="double_death"?2:(out==="victory")!==reverse?0:1;r[i]++;};
test("max-only paired orientation and terrain class composition diagnostic",()=>{
 const fixtures=[];
 for(const [set,seed] of seeds.entries())for(const [z,arena] of ARENAS.entries())for(let i=0;i<6;i++){
  const b=(seed+z*100003+i*1009)>>>0,enemy=buildGroupCloneTeam(profile.envelope,shared,b);
  assert.ok(enemy.every(x=>x.classLevel===50&&Object.values(x.trainingKit.equipment).every(g=>g.grade===7&&g.quality==="masterwork")));
  fixtures.push({set,arena,seed:b,enemy});
 }
 const results=[];
 for(const c of configs){
  const p=roster(c.ids,c.stances),sets=seeds.map(()=>[0,0,0]),zones=Object.fromEntries(ARENAS.map(a=>[a.id,[0,0,0]]));let rounds=0;
  for(const x of fixtures){
   const a=resolveTeamBattle(p,x.enemy,x.seed,x.arena,{player:50,enemy:50});
   const b=resolveTeamBattle(x.enemy,p,x.seed,x.arena,{player:50,enemy:50});
   for(const [r,reverse] of [[a,false],[b,true]]){add(sets[x.set],r.outcome,reverse);add(zones[x.arena.id],r.outcome,reverse);rounds+=r.rounds;}
  }
  const totals=sets[0].map((n,i)=>n+sets[1][i]),bouts=totals.reduce((a,b)=>a+b,0);
  assert.equal(bouts,fixtures.length*2);
  results.push({name:c.name,ids:c.ids,stances:c.stances??base.map(()=>"balanced"),sets,zones,totals,bouts,avgRounds:rounds/bouts,grossCoinsPerHour:totals[0]/bouts*teamArenaReward(7)*18});
 }
 console.log("GROUP_ENDGAME_SCREEN "+JSON.stringify({seeds,shared,fixtures:fixtures.length,configs:results.length,bouts:fixtures.length*2*results.length,results}));
});

test("max-only direct role counter matrix across all five environments",()=>{
 const roles=Object.keys(slots),teams=Object.fromEntries(configs.filter(c=>c.name.startsWith("stack:")).map(c=>[c.name.slice(6),roster(c.ids)])),matrix=[];
 for(let i=0;i<roles.length;i++)for(let j=i+1;j<roles.length;j++){
  const a=roles[i],b=roles[j],zones={};
  for(const [z,terrain] of ARENAS.entries()){
   const r=zones[terrain.id]=[0,0,0];
   for(let k=0;k<4;k++){const seed=(20261129+z*100003+k*1009)>>>0;
    add(r,resolveTeamBattle(teams[a],teams[b],seed,terrain,{player:50,enemy:50}).outcome,false);
    add(r,resolveTeamBattle(teams[b],teams[a],seed,terrain,{player:50,enemy:50}).outcome,true);
   }
  }
  matrix.push({a,b,zones,totals:Object.values(zones).reduce((r,x)=>r.map((n,i)=>n+x[i]),[0,0,0])});
 }
 console.log("GROUP_COUNTER_MATRIX "+JSON.stringify({bouts:matrix.length*40,matrix}));
});
