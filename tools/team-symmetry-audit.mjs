// TEAM-004: independent paired-seed positioning/grade sensitivity.
// Candidate geometry exists only in a temporary copy, not the playable modules.
import assert from "node:assert/strict";
import {mkdtemp,readdir,copyFile,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {seededCombatRandom} from "../site/play/combat.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {resolveTeamBattle as centered} from "../site/play/team-combat.mjs";
const seed=20261127,grade=Number(process.argv[2]??0),samples=128;
assert.ok([0,3,7].includes(grade));
const rng=seededCombatRandom(seed),seeds=Array.from({length:samples},()=>Math.floor(rng()*2**32));
const dir=await mkdtemp(join(tmpdir(),"team-geometry-"));
try{
 const play=fileURLToPath(new URL("../site/play/",import.meta.url));
 for(const name of await readdir(play))if(name.endsWith(".mjs"))await copyFile(join(play,name),join(dir,name));
 const p=join(dir,"team-combat.mjs");let src=await readFile(p,"utf8");
 const rep=(a,b)=>{assert.ok(src.includes(a),a);src=src.replace(a,b);};
 // Reverse only the approved geometry changes in a disposable copy for comparison.
 rep('function adjacent(a,actors,height,width,side,terrain={}){\n  const d=side==="player"?1:-1;','function adjacent(a,actors,height,width,side,terrain={}){\n  const d=1;');
 rep('width=teamArenaWidth(terrain,rules),roll=','width=9,roll=');
 await writeFile(p,src);
 const {resolveTeamBattle:baseline}=await import(pathToFileURL(p).href);
 const pairs=[
  ["tank_archer",["sword_shield","plate"],["bow","leather"]],
  ["hammer_spear",["hammer","plate"],["spear","leather"]],
  ["dual_bow",["bow","leather"],["bow","leather"]],
  ["dual_shield",["sword_shield","plate"],["sword_shield","plate"]],
  ["greatsword_spear",["greatsword","plate"],["spear","padded"]]
 ];
 const make=(pair,g,extra={})=>pair.slice(1).map(([loadout,armour])=>createPlayerSnapshot({loadout,armour,grade:g,itemGrade:g,quality:"common",...extra}));
 const tally=()=>({wins:0,losses:0,draws:0,bouts:0,score:0,intercepts:0});
 function add(t,r){
  t.bouts++;t.wins+=+(r.outcome==="victory");t.losses+=+(r.outcome==="defeat");t.draws+=+(r.outcome==="double_death");
  t.score+=r.outcome==="victory"?1:r.outcome==="double_death"?.5:0;
  t.intercepts+=r.events.filter(x=>x.type==="intercept").length;
 }
 const done=t=>({...t,winPct:100*t.wins/t.bouts,scorePct:100*t.score/t.bouts});
 const mirror=[],dominance=[];
 for(const [mode,resolve] of [["baseline",baseline],["centered",centered]]){
  for(const pair of pairs){
   const a=make(pair,grade),b=[...a].reverse(),cells={};
   for(const [orientation,p,q] of [["AA",a,a],["BB",b,b],["AB",a,b],["BA",b,a]]){
    const t=tally(),byArena={};
    for(const arena of ARENAS)for(const s of seeds){
     const r=resolve(p,q,s,arena,{player:1,enemy:1});add(t,r);add(byArena[arena.id]??=tally(),r);
     if(mode==="centered"){
      const v=r.events[0].vitals,width=8+Math.min(2,Math.max(0,arena.startDistance??2));
      for(const id of [0,1])assert.equal(v["player:"+id].x+v["enemy:"+id].x,width-1+(p[id].loadout==="bow"&&p.some(x=>x.loadout!=="bow")?-1:0)+(q[id].loadout==="bow"&&q.some(x=>x.loadout!=="bow")?1:0));
      for(const ev of r.events)for(const f of Object.values(ev.vitals))assert.ok(f.x>=0&&f.x<width);
     }
    }
    cells[orientation]={...done(t),byArena:Object.fromEntries(Object.entries(byArena).map(([k,v])=>[k,done(v)]))};
   }
   const sideBias=(cells.AA.scorePct+cells.BB.scorePct+cells.AB.scorePct+cells.BA.scorePct)/4-50;
   const slotEffect=(cells.AB.scorePct-cells.BA.scorePct)/2;
   mirror.push({mode,grade,name:pair[0],sideBias,slotEffect,cells});
  }
  // Each grade's lower neighbour, plus F vs NG at grade zero.
  const high=grade===0?1:grade,low=high-1;
  for(const stat of [10,150])for(const expertiseMode of ["trained","novice"]){
   const t=tally(),w=tally();
   for(const pair of pairs){
    const common={str:stat,dex:stat,end:stat,skill:50};
    const p=make(pair,high,{...common,expertiseMode}),q=make(pair,low,{...common,expertiseMode:"trained"});
    for(const arena of ARENAS)for(const s of seeds){add(t,resolve(p,q,s,arena,{player:1,enemy:1}));add(w,resolve(q,p,s,arena,{player:1,enemy:1}));}
   }
   dominance.push({mode,high,low,stat,expertiseMode,strong:done(t),weak:done(w)});
  }
 }
 console.log(JSON.stringify({seed,seeds,samples,grade,mirror,dominance,counts:{mirror:mirror.reduce((n,x)=>n+Object.values(x.cells).reduce((m,c)=>m+c.bouts,0),0),dominance:dominance.reduce((n,x)=>n+x.strong.bouts+x.weak.bouts,0)}}));
}finally{await rm(dir,{recursive:true,force:true});}
