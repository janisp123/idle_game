// BAL-002: production-linked, deterministic tactical validation. No formulas copied.
import {createPlayerSnapshot} from "../combat-simulator.mjs";
import {resolvePhysicalDuel} from "../../site/play/physical-duel.mjs";
import {ARENAS,chooseArena} from "../../site/play/arenas.mjs";
import {seededCombatRandom,startCombatSession,combatAtTime,BOUT_MS} from "../../site/play/combat.mjs";
import {runBuildBaseline} from "./build-progression.mjs";
const styles=["bow","spear","sword_shield","greatsword","hammer"],families=["padded","leather","plate"];
const n=64;
const rng=seededCombatRandom(20261201),seeds=Array.from({length:n},()=>Math.floor(rng()*2**32));
const counts=()=>({n:0,w:0,l:0,d:0});
function add(c,outcome,reverse=false){c.n++;if(outcome==="double_death")c.d++;else if((outcome==="victory")!==reverse)c.w++;else c.l++;}
function pair(a,b,arena,c,d){for(const seed of seeds){const x=resolvePhysicalDuel(a,b,seed,arena).outcome,y=resolvePhysicalDuel(b,a,seed,arena).outcome;add(c,x);add(c,y,true);if(d){add(d,x,true);add(d,y);}}}
const pct=c=>Math.round(c.w/c.n*1000)/10;
for(const [grade,stat,skill] of [[0,10,1],[3,62,17],[7,150,50]]){
  const opt={str:stat,dex:stat,end:stat,skill,itemGrade:grade,quality:"common"};
  const build=(loadout,armour)=>createPlayerSnapshot({...opt,loadout,armour});
  const matrix=styles.map(()=>styles.map(()=>counts())),terrain=styles.map(()=>ARENAS.map(()=>counts()));
  const material=families.map(()=>families.map(()=>counts()));
  const byStyleMaterial=styles.map(()=>families.map(()=>families.map(()=>counts())));
  for(let i=0;i<styles.length;i++)for(let j=i;j<styles.length;j++)for(const family of families)for(let k=0;k<ARENAS.length;k++){
    const c=counts(),d=counts();pair(build(styles[i],family),build(styles[j],family),ARENAS[k],c,d);
    for(const [target,source] of [[matrix[i][j],c],[terrain[i][k],c],...(i===j?[]:[[matrix[j][i],d],[terrain[j][k],d]])]){
      for(const key of Object.keys(c))target[key]+=source[key];
    }
  }
  for(let i=0;i<families.length;i++)for(let j=i;j<families.length;j++)for(const [k,style] of styles.entries())for(const arena of ARENAS){
    const c=counts(),d=counts();pair(build(style,families[i]),build(style,families[j]),arena,c,d);
    for(const [target,source] of [[material[i][j],c],[byStyleMaterial[k][i][j],c],...(i===j?[]:[[material[j][i],d],[byStyleMaterial[k][j][i],d]])])for(const key of Object.keys(c))target[key]+=source[key];
  }
  const npc=styles.map(style=>families.map(family=>{const c=counts();for(const seed of seeds.slice(0,3)){const s=startCombatSession({...build(style,family),difficulty:grade},seed);for(let bout=0;bout<64;bout++)add(c,combatAtTime({...s,elapsedMs:(bout+1)*BOUT_MS-1}).outcome);}return pct(c);}));
  console.log("TACTICAL "+JSON.stringify({grade,styles,families,arenas:ARENAS.map(a=>a.id),matchup:matrix.map(row=>row.map(pct)),terrain:terrain.map(row=>row.map(pct)),material:material.map(row=>row.map(pct)),byStyleMaterial:byStyleMaterial.map(matrix=>matrix.map(row=>row.map(pct))),npc,counts:matrix[0][0].n}));
}
if(process.argv.includes("--progression")){
  const scenarios=styles.flatMap(loadout=>families.map(family=>({id:loadout+"/"+family,days:180,claimHours:24,mixed:false,farm:false,loadout,family})));
  const r=await runBuildBaseline({profiles:["normal"],scenarios,seed:20261201});
  for(const s of r.reports[0].scenarios){const e=s.checkpoints.at(-1);console.log("PROGRESS "+JSON.stringify({id:s.id,firstSSet:s.firstSSet,firstAnyS:s.firstAnyS,level:e.fightingLevel,wins:e.winRatePct,wallet:e.wallet,stats:e.stats,expertise:e.expertise}));}
}
