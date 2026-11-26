// Phase 7: controlled research, not a gameplay patch. All candidate bouts
// use S Masterwork, full expertise, representative six-month maximum stats.
import assert from "node:assert/strict";
import {mkdtemp,readdir,copyFile,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {pathToFileURL,fileURLToPath} from "node:url";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {resolveTeamBattle as baseline} from "../site/play/team-combat.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {TACTIC_IDS} from "../site/play/manager-tactics.mjs";
const params={grade:7,itemGrade:7,quality:"masterwork",str:141,dex:141,end:129,skill:52};
const levels={player:50,enemy:50},seed=20261128;
const weapons=["sword_shield","bow","spear","hammer","greatsword"],families=["padded","leather","plate"];
const fighters=weapons.flatMap(w=>families.flatMap(a=>TACTIC_IDS.map(t=>({id:[w,a,t].join(":"),w,a,t,s:{...createPlayerSnapshot({...params,loadout:w,armour:a}),tactic:t,tacticLevel:50}}))));
const get=(w,a,t="balanced")=>fighters.find(f=>f.w===w&&f.a===a&&f.t===t);
const team=(a,b)=>({id:a.id+"+"+b.id,f:[a,b]});
const all=fighters.flatMap(a=>fighters.map(b=>team(a,b)));
const roster=t=>t.f.map(x=>x.s);
const uniform=weapons.flatMap(w=>families.map(a=>team(get(w,a),get(w,a))));
const mix=[
["sword_shield","plate","bow","leather"],["sword_shield","padded","spear","plate"],
["hammer","padded","spear","leather"],["spear","plate","bow","leather"],
["greatsword","leather","bow","plate"],["hammer","leather","greatsword","plate"],
["spear","padded","spear","plate"],["sword_shield","leather","hammer","plate"],
["bow","padded","bow","plate"],["greatsword","padded","sword_shield","plate"]
].map(([w,a,v,b],i)=>team(get(w,a,i%2?"aggressive":"defensive"),get(v,b,i%2?"defensive":"aggressive")));
const pool=[...uniform,...mix];
const changes={
 spear:[["reachInterruptTurns:2","reachInterruptTurns:1"],["reachSpearImpact:1.18","reachSpearImpact:1.08"],["reachBlockImpact:.85","reachBlockImpact:.60"]],
 plate:[["plate:Object.freeze({piercing:.80,slashing:1.0,blunt:.18})","plate:Object.freeze({piercing:.65,slashing:.82,blunt:.18})"]],
 shield:[["block:.29,bluntBlock:.40","block:.37,bluntBlock:.44"]],
 hammer:[['hammer: { move: "hammer", type: "blunt", range: 0, power: 16, recovery: 3 }','hammer: { move: "hammer", type: "blunt", range: 0, power: 16, recovery: 2 }']]
};
const root=fileURLToPath(new URL("../site/play/",import.meta.url)),dir=await mkdtemp(join(tmpdir(),"manager-balance-"));
let calls=0;
function play(fn,p,e,s,a){calls++;const r=fn(roster(p),roster(e),s>>>0,a,levels);return r.outcome==="victory"?1:r.outcome==="double_death"?.5:0;}
const seedAt=(salt,i,j,k)=> (seed+salt+Math.imul(i+1,0x9e3779b9)+Math.imul(j+1,0x85ebca6b)+Math.imul(k+1,0x27d4eb2d))>>>0;
async function variant(name,keys){
 const folder=join(dir,name);await (await import("node:fs/promises")).mkdir(folder);
 for(const n of await readdir(root))if(n.endsWith(".mjs"))await copyFile(join(root,n),join(folder,n));
 const path=join(folder,"physical-actions.mjs");let src=await readFile(path,"utf8");
 for(const key of keys)for(const [a,b] of changes[key]){assert.ok(src.includes(a),a);src=src.replace(a,b);}
 await writeFile(path,src);
 return (await import(pathToFileURL(join(folder,"team-combat.mjs")).href)).resolveTeamBattle;
}
function paired(fn,p,e,s,a){return (play(fn,p,e,s,a)+1-play(fn,e,p,s,a))/2;}
function measure(fn,teams,opponents,salt,repeats){
 return teams.map((p,i)=>{
  const byArena=ARENAS.map((a,j)=>{
   let score=0;for(let k=0;k<opponents.length;k++)for(let r=0;r<repeats;r++)score+=paired(fn,p,opponents[k],seedAt(salt,k,j,r),a);
   return score/(opponents.length*repeats);
  });
  return {id:p.id,score:byArena.reduce((a,b)=>a+b,0)/ARENAS.length,byArena};
 });
}
function summary(rows){
 const groups=weapons.map(w=>{const r=rows.filter(x=>x.id.split("+").every(s=>s.startsWith(w+":")));return {weapon:w,mean:r.reduce((a,b)=>a+b.score,0)/r.length,best:Math.max(...r.map(x=>x.score))};});
 const armour=families.map(a=>{const r=rows.filter(x=>x.id.split("+").every(s=>s.split(":")[1]===a));return {family:a,mean:r.reduce((n,x)=>n+x.score,0)/r.length};});
 return {groups,armour,spread:Math.max(...groups.map(g=>g.mean))-Math.min(...groups.map(g=>g.mean))};
}
try{
 const policies={baseline:[],spear:["spear"],plate:["plate"],shield:["shield"],hammer:["hammer"],combined:["spear","plate","shield","hammer"]};
 const fns={baseline};for(const [name,keys] of Object.entries(policies))if(keys.length)fns[name]=await variant(name,keys);
 const search={};
 for(const [name,fn] of Object.entries(fns)){const rows=measure(fn,uniform,pool,0,4);search[name]={...summary(rows),rows};}
 // Selection uses only the screening sample. Fresh holdout for all policies.
 const best=Object.keys(search).sort((a,b)=>search[a].spread-search[b].spread)[0];
 const held={};for(const [name,fn] of Object.entries(fns)){const rows=measure(fn,uniform,pool,0x50000000,12);held[name]={...summary(rows),rows};}
 // All ordered builds vs mixed 10 plus five uniform reference teams.
 const broadFoes=[...uniform.filter((_,i)=>i%3===1),...mix];
 const broad={};
 for(const name of [...new Set(["baseline",best])]){
  const fn=fns[name],rows=measure(fn,all,broadFoes,0x20000000,1).sort((a,b)=>b.score-a.score);
  const chosen=new Set(rows.slice(0,12).map(r=>r.id));
  for(const w of weapons){const r=rows.find(r=>r.id.split("+").some(x=>x.startsWith(w+":")));chosen.add(r.id);}
  for(const a of families){const r=rows.find(r=>r.id.split("+").every(x=>x.split(":")[1]===a));chosen.add(r.id);}
  const candidates=all.filter(t=>chosen.has(t.id));
  const validation=measure(fn,candidates,pool,0x70000000,12).sort((a,b)=>b.score-a.score);
  // Search for counters against the strongest holdout team, then independently validate.
  const elite=all.find(t=>t.id===validation[0].id);
  const counterSearch=measure(fn,all,[elite],0x30000000,1).sort((a,b)=>b.score-a.score).slice(0,12);
  const counters=measure(fn,all.filter(t=>counterSearch.some(r=>r.id===t.id)),[elite],0x60000000,32).sort((a,b)=>b.score-a.score);
  broad[name]={configs:rows.length,top:rows.slice(0,12),validation,elite:elite.id,counters,rows};
 }
 console.log(JSON.stringify({profile:params,seed,levels,tacticLevel:50,policies,changes,pool:pool.map(t=>t.id),calls,best,search,held,broad,
 limitations:["screening uses one seed per cell for broad pool; independent holdouts and counter validation","side reversed paired score, draws half","not exhaustive every-team vs every-team","candidate changes research only; no runtime patch","max representative stats, not absolute uncapped ceiling"]}));
}finally{await rm(dir,{recursive:true,force:true});}
