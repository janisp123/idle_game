// TEAM-005: strategy diagnostic on the actual V17 resolver. No gameplay changes.
import assert from "node:assert/strict";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
import {ARENAS,chooseArena} from "../site/play/arenas.mjs";
import {makeOpponent,seededCombatRandom} from "../site/play/combat.mjs";
const grade=Number(process.argv[2]??3),level=Number(process.argv[3]??1),seed=20261128;
assert.ok([0,3,7].includes(grade)&&[1,50].includes(level));
const weapons=["greatsword","sword_shield","hammer","bow","spear"],armours=["padded","leather","plate"];
const builds=weapons.flatMap(loadout=>armours.map(armour=>({loadout,armour})));
const labels=builds.map(x=>x.loadout+"/"+x.armour);
const teams=[];for(let i=0;i<15;i++)for(let j=i;j<15;j++)teams.push({id:i+":"+j,builds:[i,j],name:labels[i]+" + "+labels[j]});
const id=(a,b)=>[a,b].sort((a,b)=>a-b).join(":");
const contexts=[
 ["tank_archer",id(5,10)],["dual_archers",id(10,10)],["dual_shields",id(5,5)],
 ["dual_hammers",id(8,8)],["spear_archer",id(13,10)],["hammer_spear",id(8,13)],
 ["dual_greatswords",id(2,2)],["dual_spears",id(14,14)]
];
const rng=seededCombatRandom(seed),seeds=n=>Array.from({length:n},()=>Math.floor(rng()*2**32));
const train=seeds(16),test=seeds(64),npcSeeds=seeds(256);
assert.equal(new Set([...train,...test,...npcSeeds]).size,train.length+test.length+npcSeeds.length);
const snapshots=builds.map(b=>createPlayerSnapshot({...b,grade,itemGrade:grade,quality:"common"}));
const roster=(team,flip)=>{const a=team.builds.map(i=>snapshots[i]);return flip?a.reverse():a;};
const byId=Object.fromEntries(teams.map(t=>[t.id,t]));
const tally=()=>({n:0,w:0,l:0,d:0,intercepts:0,rounds:0,fallen:0});
let fights=0;
function add(t,r){fights++;t.n++;t.w+=+(r.outcome==="victory");t.l+=+(r.outcome==="defeat");t.d+=+(r.outcome==="double_death");t.intercepts+=r.events.filter(x=>x.type==="intercept"&&x.actor?.startsWith("player:")).length;t.rounds+=r.rounds;t.fallen+=+(r.survivors["player:0"]===0)+ +(r.survivors["player:1"]===0);}
const score=t=>(t.w+.5*t.d)/t.n;
const merge=ts=>ts.reduce((a,b)=>{for(const k of Object.keys(a))a[k]+=b[k];return a;},tally());
function battle(team,enemy,arena,s,i){return resolveTeamBattle(roster(team,i%2),roster(enemy,Math.floor(i/2)%2),s,arena,{player:level,enemy:level});}
const matrix=teams.map(team=>{
 const cells=contexts.map(([name,enemy])=>ARENAS.map(arena=>{const t=tally();train.forEach((s,i)=>add(t,battle(team,byId[enemy],arena,s,i)));return t;}));
 return {id:team.id,cells,overall:merge(cells.flat())};
});
const rank=(fn)=>[...matrix].sort((a,b)=>score(fn(b))-score(fn(a))||a.id.localeCompare(b.id));
const global=rank(x=>x.overall)[0],worst=rank(x=>x.overall).at(-1);
const oppBest=contexts.map((_,c)=>rank(x=>merge(x.cells[c]))[0].id);
const arenaBest=ARENAS.map((_,a)=>rank(x=>merge(x.cells.map(c=>c[a])))[0].id);
const cellBest=contexts.map((_,c)=>ARENAS.map((_,a)=>rank(x=>x.cells[c][a])[0].id));
const named=Object.fromEntries(contexts);
const selected=[...new Set([global.id,worst.id,...oppBest,...arenaBest,...cellBest.flat(),...Object.values(named),...rank(x=>x.overall).slice(0,5).map(x=>x.id)])];
const held={};
for(const id of selected){held[id]=contexts.map(([name,enemy])=>ARENAS.map(arena=>{const t=tally();test.forEach((s,i)=>add(t,battle(byId[id],byId[enemy],arena,s,i)));return t;}));}
const overall=id=>merge(held[id].flat());
const policies={global:overall(global.id),worst:overall(worst.id),
 opponent:merge(oppBest.flatMap((id,c)=>held[id][c])),
 arena:merge(arenaBest.flatMap((id,a)=>held[id].map(c=>c[a]))),
 both:merge(cellBest.flatMap((row,c)=>row.map((id,a)=>held[id][c][a])))};
const byOpponent=contexts.map(([name],c)=>({name,best:oppBest[c],bestResult:merge(held[oppBest[c]][c]),global:merge(held[global.id][c]),named:Object.fromEntries(contexts.map(([n,id])=>[n,merge(held[id][c])]))}));
const byArena=ARENAS.map((a,i)=>({name:a.id,best:arenaBest[i],bestResult:merge(held[arenaBest[i]].map(c=>c[i])),global:merge(held[global.id].map(c=>c[i])),named:Object.fromEntries(contexts.map(([n,id])=>[n,merge(held[id].map(c=>c[i]))]))}));
// Actual arena dice and NPC generation. One fixed team per trial, no advance knowledge.
const npc={};for(const id of [...new Set([global.id,worst.id,...Object.values(named),...oppBest,...arenaBest])]){
 const t=tally();npcSeeds.forEach((s,i)=>{
  const p=roster(byId[id],i%2),e=[0,1].map(j=>makeOpponent(i*2+j,grade,seededCombatRandom((s^Math.imul(j+1,0x9e3779b9))>>>0)));
  const roll=seededCombatRandom((s^0x749ae237)>>>0),a=chooseArena(p[Math.floor(roll()*2)],e[Math.floor(roll()*2)],roll).arena;
  add(t,resolveTeamBattle(p,e,s,a,{player:level,enemy:1}));
 });npc[id]=t;
}
assert.ok(Object.values(policies).every(t=>t.n===contexts.length*ARENAS.length*test.length));
const result={grade,level,seed,trainSeeds:train,testSeeds:test,npcSeeds,counts:{fights,train:teams.length*contexts.length*ARENAS.length*train.length,holdout:selected.length*contexts.length*ARENAS.length*test.length,npc:Object.keys(npc).length*npcSeeds.length},teams,contexts,global:global.id,worst:worst.id,oppBest,arenaBest,cellBest,selected,policies,byOpponent,byArena,named:Object.fromEntries(contexts.map(([n,id])=>[n,overall(id)])),npc,ranking:rank(x=>x.overall).map(x=>({id:x.id,...x.overall})),matrix,held};
console.log(JSON.stringify(result));
