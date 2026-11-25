// ALPHA-GEAR-001 A6. Developer-only audit; never changes playable formulas.
import {createPlayerSnapshot} from "../combat-simulator.mjs";
import {resolvePhysicalDuel} from "../../site/play/physical-duel.mjs";
import {ARENAS} from "../../site/play/arenas.mjs";
import {seededCombatRandom, startCombatSession,combatAtTime,BOUT_MS} from "../../site/play/combat.mjs";
import {arenaReward} from "../../site/play/arena-wallet.mjs";
import {equipmentPrice,equipmentUnlockLevel} from "../../site/play/smith.mjs";
import {runBuildBaseline} from "./build-progression.mjs";
const styles=["bow","spear","sword_shield","greatsword","hammer"];
const families=["none","padded","leather","plate"];
const seeds=[20261125,20261126,20261127].flatMap(seed=>{
  const random=seededCombatRandom(seed);
  return Array.from({length:8},()=>Math.floor(random()*2**32));
});
const counts=()=>({bouts:0,wins:0,losses:0,draws:0});
function tally(c,outcome,side="player"){
  c.bouts++;
  if(outcome==="double_death")c.draws++;
  else if((outcome==="victory")===(side==="player"))c.wins++;
  else c.losses++;
}
const pct=c=>Math.round(c.wins*10000/c.bouts)/100;
function paired(a,b,arena,seed,ca,cb,orientation){
  for(const [p,q,first,second] of [[a,b,ca,cb],[b,a,cb,ca]]){
    const out=resolvePhysicalDuel(p,q,seed,arena).outcome;
    tally(first,out);tally(second,out,"enemy");tally(orientation,out);
  }
}
const rows=[],matchups=[],terrainRows=[];
for(const [grade,stat,skill] of [[0,10,1],[3,62,17],[7,150,50]]){
  const builds=styles.flatMap(style=>families.map(family=>({
    style,family,build:createPlayerSnapshot({loadout:style,armour:family,itemGrade:grade,quality:"common",str:stat,dex:stat,end:stat,skill}),
    total:counts(),npc:counts(),coins:0
  })));
  const orientation=counts(),mirror=counts();
  for(let i=0;i<builds.length;i++)for(let j=i;j<builds.length;j++){
    const a=builds[i],b=builds[j],ca=counts(),cb=counts();
    for(const arena of ARENAS){
      const ta=counts(),tb=counts(),orientationCount=counts();
      for(const seed of seeds)paired(a.build,b.build,arena,seed,ta,tb,orientationCount);
      for(const k of Object.keys(ca)){ca[k]+=ta[k];cb[k]+=tb[k];(i===j?mirror:orientation)[k]+=orientationCount[k];}
      terrainRows.push({grade,arena:arena.id,a:a.style+"/"+a.family,b:b.style+"/"+b.family,...ta,winPct:pct(ta)});
    }
    // Count every build equally, including exactly one self matchup.
    for(const [target,source] of i===j?[[a.total,ca]]:[[a.total,ca],[b.total,cb]])for(const key of Object.keys(target))target[key]+=source[key];
    matchups.push({grade,a:a.style+"/"+a.family,b:b.style+"/"+b.family,...ca,winPct:pct(ca)});
  }
  for(const b of builds){
    for(const seed of seeds.slice(0,3)){
      const session=startCombatSession({...b.build,difficulty:grade},seed);
      for(let bout=0;bout<64;bout++){
        const result=combatAtTime({...session,elapsedMs:(bout+1)*BOUT_MS-1});
        tally(b.npc,result.outcome);if(result.outcome==="victory")b.coins+=arenaReward(grade);
      }
    }
    rows.push({kind:"build",grade,style:b.style,family:b.family,pairedWinPct:pct(b.total),npcWinPct:pct(b.npc),npcBouts:b.npc.bouts,npcCoinsPerHour:Math.round(b.coins/b.npc.bouts*3600000/BOUT_MS)});
  }
  for(const style of styles){
    const subset=terrainRows.filter(r=>r.grade===grade&&r.a.split("/")[1]!=="none"&&r.b.split("/")[1]!=="none");
    for(const arena of ARENAS){
      const total=counts();
      for(const r of subset.filter(r=>r.arena===arena.id)){
        const a=r.a.split("/")[0],b=r.b.split("/")[0];
        if(a===style){total.bouts+=r.bouts;total.wins+=r.wins;total.losses+=r.losses;total.draws+=r.draws;}
        if(b===style&&r.b!==r.a){total.bouts+=r.bouts;total.wins+=r.losses;total.losses+=r.wins;total.draws+=r.draws;}
      }
      rows.push({kind:"terrain",grade,style,arena:arena.id,winPct:pct(total),bouts:total.bouts});
    }
  }
  const independent=counts();
  for(const [i,b] of builds.entries())for(const [j,arena] of ARENAS.entries()){
    const rng=seededCombatRandom(20261129+grade*10000+i*100+j);
    for(let n=0;n<64;n++)tally(independent,resolvePhysicalDuel(b.build,b.build,Math.floor(rng()*2**32),arena).outcome);
  }
  rows.push({kind:"independent-mirror",grade,...independent,winPct:pct(independent)});
  rows.push({kind:"orientation",grade,mirrorPlayerWinPct:pct(mirror),mirrorBouts:mirror.bouts,mirrorDrawPct:100*mirror.draws/mirror.bouts,crossPlayerWinPct:pct(orientation),crossBouts:orientation.bouts});
  for(const [dimension,keys] of [["style",styles],["family",families]]){
    for(const key of keys){
      const subset=builds.filter(b=>b[dimension]===key),agg=counts(),npc=counts();
      for(const b of subset)for(const k of Object.keys(agg)){agg[k]+=b.total[k];npc[k]+=b.npc[k];}
      rows.push({kind:dimension,grade,key,pairedWinPct:pct(agg),npcWinPct:pct(npc)});
    }
  }
}
// Within a grade, compare quality and gradually earned proficiency, using
// identical loadout/material/attributes in both orientations.
for(const [grade,stat,skill] of [[0,10,1],[3,62,17],[7,150,50]]){
  for(const quality of ["poor","fine","masterwork"]){
    const a=counts(),b=counts(),orientation=counts();
    for(const style of styles)for(const family of families.slice(1)){
      const opt={loadout:style,armour:family,itemGrade:grade,str:stat,dex:stat,end:stat,skill};
      const p=createPlayerSnapshot({...opt,quality}),q=createPlayerSnapshot({...opt,quality:"common"});
      for(const arena of ARENAS)for(const seed of seeds.slice(0,8))paired(p,q,arena,seed,a,b,orientation);
    }
    rows.push({kind:"quality",grade,quality,...a,winPct:pct(a)});
  }
}
for(const hours of [0,1000,2000,3000,4000])for(const novice of ["weapon","armour","both"]){
  const a=counts(),b=counts(),orientation=counts();
  for(const style of styles)for(const family of families.slice(1)){
    const opt={loadout:style,armour:family,itemGrade:7,str:150,dex:150,end:150,skill:50,quality:"masterwork"};
    const practice={};if(novice!=="armour")practice[style]=hours;if(novice!=="weapon")practice[family]=hours;
    const p=createPlayerSnapshot(opt),q=createPlayerSnapshot({...opt,expertiseHours:practice});
    for(const arena of ARENAS)for(const seed of seeds.slice(0,8))paired(p,q,arena,seed,a,b,orientation);
  }
  rows.push({kind:"expertise",hours,novice,...a,trainedWinPct:pct(a)});
}
// Adjacent grades with the strongest plausible quality contrast, same
// attributes, same style/material, paired orientations.
for(const higher of [1,4,7]){
  const stat=[0,24,0,0,82,0,0,150][higher],a=counts(),b=counts(),orientation=counts();
  for(const style of styles)for(const family of families.slice(1)){
    const opt={loadout:style,armour:family,str:stat,dex:stat,end:stat,skill:50};
    const p=createPlayerSnapshot({...opt,itemGrade:higher,quality:"poor"});
    const q=createPlayerSnapshot({...opt,itemGrade:higher-1,quality:"masterwork"});
    for(const arena of ARENAS)for(const seed of seeds.slice(0,8))paired(p,q,arena,seed,a,b,orientation);
  }
  rows.push({kind:"adjacent-quality",higher,lower:higher-1,...a,winPct:pct(a)});
}
// Normal and alpha are explicitly separate, with no testing-button use.
const economy=[];
const short=[{id:"rapid-income",days:30,claimHours:.25,mixed:false,farm:false,income:true},
 {id:"rapid-starter-rush",days:30,claimHours:.25,mixed:false,farm:true}];
const long=[{id:"bow-leather",days:180,claimHours:24,mixed:false,farm:false,loadout:"bow",family:"leather"},
 {id:"hammer-plate",days:180,claimHours:24,mixed:false,farm:false,loadout:"hammer",family:"plate"},
 {id:"greatsword-padded",days:180,claimHours:24,mixed:false,farm:false,loadout:"greatsword",family:"padded"},
 {id:"greatsword-plate-income",days:180,claimHours:24,mixed:false,farm:false,income:true},
 {id:"spear-padded",days:180,claimHours:24,mixed:false,farm:false,loadout:"spear",family:"padded"},
 {id:"shield-leather",days:180,claimHours:24,mixed:false,farm:false,loadout:"sword_shield",family:"leather"}];
for(const [profiles,scenarios,seed] of [[["normal","alpha"],short,20261125],[["normal"],short,20261126],[["normal"],long,20261126]]){
  const report=await runBuildBaseline({profiles,scenarios,seed});
  for(const p of report.reports)for(const scenario of p.scenarios){
    const e=scenario.checkpoints.at(-1);
    economy.push({profile:p.profile,...scenario,ending:{level:e.fightingLevel,stats:e.stats,wins:e.winRatePct,
      earned:e.coinsEarned,spent:e.coinsSpent,wallet:e.wallet,weapon:e.gear[scenario.loadout],expertise:e.expertise}});
  }
}
const report={version:"A8",seedGroups:[20261125,20261126,20261127],rows,matchups,terrainRows,economy,
 bounds:{sPoorPrice:equipmentPrice({grade:7,quality:"poor"}),sUnlock:equipmentUnlockLevel(7),
  nonGradePerfect30d:Math.floor(30*86400000/BOUT_MS)*arenaReward(0),
  allSPerfect30d:Math.floor(30*86400000/BOUT_MS)*arenaReward(7)},
 limitations:["Same-grade build matrix uses all four families, including unarmoured, and fixed terrain weighting (not encounter frequencies). Paired win counts control role orientation; independent seeds are not confidence intervals.","NPC samples use 3 fixed seeds and first 64 bouts per seed; no optimal strategy proof.","Income policy estimates prizes using a separate fixed fixture once per day and selects a tier; not oracle knowledge of upcoming fights. Time spent at old frozen snapshot and buying strategy remain real.","30-day rapid visits every 15 minutes, not mathematically earliest possible; normal first-month level ceiling separately tested in game engine.","No alpha test buttons used."]};
console.log(JSON.stringify(report));
