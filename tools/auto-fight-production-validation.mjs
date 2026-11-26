import * as m0 from "../site/play/armour.mjs";
import * as m1 from "../site/play/difficulty.mjs";
import * as m2 from "../site/play/combat-skills.mjs";
import * as m3 from "../site/play/expertise.mjs";
import * as m4 from "../site/play/arenas.mjs";
import * as m5 from "../site/play/smith.mjs";
import * as m6 from "../site/play/physical-duel.mjs";
import * as m7 from "../site/play/combat-verdict.mjs";
import * as m8 from "../site/play/combat-art.mjs";
import * as m9 from "../site/play/combat.mjs";
import * as m10 from "../site/play/arena-wallet.mjs";
import {readFileSync} from "node:fs";
const modules={"armour":m0,"difficulty":m1,"combat-skills":m2,"expertise":m3,"arenas":m4,"smith":m5,"physical-duel":m6,"combat-verdict":m7,"combat-art":m8,"combat":m9,"arena-wallet":m10};
const trajectories=["docs/mechanics/GEAR_TACTICAL_ECONOMY_1.json","docs/mechanics/GEAR_TACTICAL_ECONOMY_2.json","docs/mechanics/GEAR_TACTICAL_ECONOMY_3.json","docs/mechanics/GEAR_TACTICAL_ECONOMY_4.json"].flatMap(p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8")));
function run(modules,trajectories){
 const {armour,smith,expertise,combat,"arena-wallet":wallet}=modules;
 const builds=new Map();
 for(const t of trajectories)builds.set(t.loadout+"/"+t.family,t);
 if(builds.size!==15)throw Error("expected 15 builds, got "+builds.size);
 const cases=[];
 for(const t of builds.values()){
  for(const day of [0,30,90,150,180]){
   const c=t.checkpoints.find(x=>x.day===day);if(!c)throw Error("missing day "+day);
   cases.push({id:t.loadout+"/"+t.family+"/"+day,day,kind:"trajectory",style:t.loadout,family:t.family,gear:c.gear,stats:c.stats,skill:c.fightingLevel,practice:Object.fromEntries(Object.entries(c.expertise).map(([k,v])=>[k,Math.round(v*14400000)]))});
  }
  const c=t.checkpoints.find(x=>x.day===180),style=t.loadout;
  const weak=Object.fromEntries([[style,{grade:0,quality:"poor"}],...armour.ARMOUR_SLOTS.map(s=>[s.id+":"+t.family,{grade:0,quality:"poor"}])]);
  cases.push({id:style+"/"+t.family+"/weak",day:180,kind:"weak",style,family:t.family,gear:weak,stats:c.stats,skill:c.fightingLevel,practice:expertise.blankExpertise()});
  cases.push({id:style+"/"+t.family+"/switch",day:180,kind:"switch",style,family:t.family,gear:c.gear,stats:c.stats,skill:c.fightingLevel,practice:{...Object.fromEntries(Object.entries(c.expertise).map(([k,v])=>[k,Math.round(v*14400000)])),[style]:0}});
 }
 const policies=[{up:1,retry:1},{up:3,retry:3},{up:3,retry:5},{up:3,retry:10}];
 const seeds=[743829103,2986713491],liveBouts=36,offlineBouts=18,rows=[];
 let resolutions=0,offlineChecks=0;
 for(const c of cases){
  const pieces=Object.fromEntries(armour.ARMOUR_SLOTS.map(s=>[s.id,c.gear[s.id+":"+c.family]?c.family:"none"]));
  const kit=smith.trainingKit(pieces,c.style,c.gear),effects=smith.trainingEffects(kit,c.style,c.practice);
  const fighter={name:"Policy research",loadout:c.style,str:c.stats.STR,dex:c.stats.DEX,end:c.stats.END,skill:c.skill,trainingKit:kit,gear:{...armour.armourStats(pieces,c.style),gearDefense:effects.gearDefense},gearAttack:effects.gearAttack,condition:effects.condition};
  for(const seed of seeds){
   const sessions=Array.from({length:8},(_,difficulty)=>combat.startCombatSession({...fighter,difficulty},seed));
   const cache=new Map();
   function outcome(stage,b){const key=stage+":"+b;if(!cache.has(key)){const r=combat.combatAtTime({...sessions[stage],elapsedMs:(b+1)*combat.BOUT_MS-1});if(!r||!["victory","defeat","double_death"].includes(r.outcome))throw Error("invalid duel");cache.set(key,r.outcome);resolutions++;}return cache.get(key);}
   const coin=(stage,b)=>outcome(stage,b)==="victory"?wallet.arenaReward(stage):0;
   const fixed=Array.from({length:8},(_,stage)=>({stage,online:Array.from({length:liveBouts},(_,b)=>coin(stage,b)).reduce((a,b)=>a+b,0),offline:Array.from({length:offlineBouts},(_,b)=>coin(stage,liveBouts+b)).reduce((a,b)=>a+b,0)}));
   const bestOnline=Math.max(...fixed.map(x=>x.online)),bestOffline=Math.max(...fixed.map(x=>x.offline));
   for(const p of policies)for(const start of [0,Math.max(0,Math.min(7,c.gear[c.style]?.grade??0))]){
    let stage=start,streak=0,blocked=-1,coins=0,losses=0,changes=0,highest=-1;
    for(let b=0;b<liveBouts;b++){
     const old=stage,o=outcome(stage,b);
     if(o==="victory"){coins+=wallet.arenaReward(stage);highest=Math.max(highest,stage);streak++;if(stage<7&&streak>=Math.max(p.up,blocked===stage+1?p.retry:0)){stage++;streak=0;}}
     else{losses++;streak=0;if(stage>0){blocked=stage;stage--;}}
     changes+=Number(stage!==old);
    }
    const frozen={stage,streak,blocked,highest};
    const from=liveBouts*combat.BOUT_MS,to=(liveBouts+offlineBouts)*combat.BOUT_MS;
    const session={...sessions[stage],prizeCursor:liveBouts,elapsedMs:to};
    const actual=wallet.settleArenaPrizes(session,from);
    const expected=fixed[stage].offline;
    if(actual.coins!==expected||actual.bouts!==offlineBouts||actual.session.player.difficulty!==stage||actual.downtimeMs!==(actual.defeats+actual.doubleDeaths)*combat.RESURRECTION_MS)throw Error("offline wallet parity "+c.id);
    offlineChecks++;
    rows.push({id:c.id,kind:c.kind,day:c.day,seed,start,startMode:start===0?"NG":"gear",policy:p.up+"/1/"+p.retry,stage,highest,streak:frozen.streak,blocked:frozen.blocked,coins,bestOnline,offlineCoins:actual.coins,bestOffline,losses,changes,offlineLosses:actual.defeats+actual.doubleDeaths});
   }
  }
 }
 const summary=[];
 for(const p of policies){const policy=p.up+"/1/"+p.retry;for(const kind of ["trajectory","weak","switch"]){const rr=rows.filter(r=>r.policy===policy&&r.kind===kind);const ratio=(num,den)=>{const eligible=rr.filter(r=>r[den]>0);return +(eligible.reduce((s,r)=>s+r[num]/r[den],0)/eligible.length).toFixed(4)};const avg=key=>+(rr.reduce((s,r)=>s+r[key],0)/rr.length).toFixed(4);summary.push({policy,kind,runs:rr.length,online:ratio("coins","bestOnline"),offline:ratio("offlineCoins","bestOffline"),lossRate:+(avg("losses")/liveBouts).toFixed(4),changesPerHour:+(avg("changes")/(liveBouts/18)).toFixed(4),endStage:avg("stage")});}}
 return {seeds,liveBouts,offlineBouts,cases:cases.length,resolutions,offlineChecks,summary,rows};
}
console.log(JSON.stringify(run(modules,trajectories),null,2));
