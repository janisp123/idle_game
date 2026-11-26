// TEAM-004 developer-only audit. Actual resolver, common seed, no balance overrides.
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {makeOpponent,seededCombatRandom} from "../site/play/combat.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {arenaBenchmark} from "../site/play/difficulty.mjs";
const seed=20261126,styles=["greatsword","sword_shield","hammer","bow","spear"],families=["padded","leather","plate"];
const builds=styles.flatMap(loadout=>families.map(armour=>({loadout,armour})));
const named=[["tank_archer",builds[5],builds[10]],["dual_bow",builds[10],builds[10]],["dual_shield",builds[5],builds[5]],["spear_bow",builds[13],builds[10]],["hammer_greatsword",builds[8],builds[2]],["hammer_spear",builds[8],builds[13]]];
const snap=(b,grade,extra={})=>createPlayerSnapshot({...b,grade,itemGrade:grade,quality:"common",...extra});
const rng=seededCombatRandom(seed),seeds=Array.from({length:16},()=>Math.floor(rng()*2**32));
function tally(){return {bouts:0,wins:0,losses:0,draws:0,aliveFirst:0,aliveSecond:0,rounds:0,intercepts:0};}
function add(row,r){row.bouts++;row.wins+=+(r.outcome==="victory");row.losses+=+(r.outcome==="defeat");row.draws+=+(r.outcome==="double_death");row.aliveFirst+=+(r.survivors["player:0"]>0);row.aliveSecond+=+(r.survivors["player:1"]>0);row.rounds+=r.rounds;row.intercepts+=r.events.filter(e=>e.type==="intercept").length;}
function done(row){return {...row,winPct:100*row.wins/row.bouts,avgRounds:row.rounds/row.bouts};}
const matrix=[],mirrors=[],dominance=[],coordination=[];
for(const grade of [0,3,7]){
 const samples=ARENAS.flatMap(arena=>seeds.map((s,i)=>({arena,s,enemies:[0,1].map(j=>makeOpponent(i*2+j,grade,seededCombatRandom((s^Math.imul(j+1,0x9e3779b9))>>>0)))})));
 for(const [i,a] of builds.entries())for(const [j,b] of builds.entries()){
  const players=[snap(a,grade),snap(b,grade)],row=tally(),byArena={};
  for(const {arena,s,enemies} of samples){const result=resolveTeamBattle(players,enemies,s,arena,{player:1,enemy:1});add(row,result);add(byArena[arena.id]??=tally(),result);}
  matrix.push({grade,first:i,second:j,...done(row),byArena:Object.fromEntries(Object.entries(byArena).map(([id,v])=>[id,done(v)]))});
 }
 for(const [name,a,b] of named){
  const players=[snap(a,grade),snap(b,grade)],row=tally(),reversed=tally();
  for(const {arena,s} of samples){add(row,resolveTeamBattle(players,players,s,arena,{player:1,enemy:1}));add(reversed,resolveTeamBattle([...players].reverse(),[...players].reverse(),s,arena,{player:1,enemy:1}));}
  mirrors.push({grade,name,forward:done(row),reverse:done(reversed)});
  for(const level of [1,10,25,50]){
   const t=tally();for(const {arena,s,enemies} of samples)add(t,resolveTeamBattle(players,enemies,s,arena,{player:level,enemy:1}));
   coordination.push({grade,name,level,...done(t)});
  }
 }
}
for(const [high,low] of [[1,0],[3,0],[7,0],[7,6]]){
 for(const stat of [10,80,150]){
  const strong=tally(),weak=tally();for(const [name,a,b] of named){
   const opts={str:stat,dex:stat,end:stat,skill:50},p=[snap(a,high,opts),snap(b,high,opts)],q=[snap(a,low,opts),snap(b,low,opts)];
   for(const arena of ARENAS)for(const s of seeds){add(strong,resolveTeamBattle(p,q,s,arena,{player:1,enemy:1}));add(weak,resolveTeamBattle(q,p,s,arena,{player:1,enemy:1}));}
  }
  dominance.push({high,low,stat,strong:done(strong),weak:done(weak)});
 }
}
const report={seed,seeds,builds,counts:{matrix:matrix.reduce((n,r)=>n+r.bouts,0),mirror:mirrors.reduce((n,r)=>n+r.forward.bouts+r.reverse.bouts,0),coordination:coordination.reduce((n,r)=>n+r.bouts,0),dominance:dominance.reduce((n,r)=>n+r.strong.bouts+r.weak.bouts,0)},matrix,mirrors,coordination,dominance};
console.log(JSON.stringify(report));
