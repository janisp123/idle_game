// AUTO-FIGHT-05: isolated production normal-profile trajectory benchmark.
import {mkdtemp,readdir,copyFile,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
function run(modules,scenarios,seed=20261126){
 const {engine:e,combat:c,smith,armour,attributes,expertise}=modules;
 if(e.TIMING_PROFILE!=="normal")throw Error("normal profile required");
 const DAY=86400000,HOUR=3600000,results=[];
 for(const spec of scenarios){
  const {style,family,visitDays=1,liveMinutes=30,mixed=false,days=180,liveStepMs=0}=spec;
  if(!Number.isInteger(liveStepMs)||liveStepMs<0||liveStepMs>10000)throw Error("Invalid live step");
  const rng=c.seededCombatRandom(seed);
  let s=e.newGame(0),time=0,earned=0,spent=0,liveCoins=0,offlineCoins=0,liveBouts=0,offlineBouts=0,losses=0,advances=0,retreats=0,capVisits=0,firstS=null,firstSSet=null,firstSMastery=null,offlineChecks=0,visits=0;
  const ids=[style,...armour.ARMOUR_SLOTS.map(x=>x.id+":"+family)],checkpoints=[],gradeNights=Array(8).fill(0);
  s=e.setCombatLoadout(s,style,0,rng).state;s=e.chooseActivity(s,"fighting",0,rng).state;
  const record=(result,live)=>{
   const old=s; s=result.state; time=s.settledAtMs;
   for(const rep of result.reports??[result.report]){
    const a=rep?.arena;if(!a)continue;
    earned+=a.coins;losses+=a.defeats+a.doubleDeaths;
    if(live){liveCoins+=a.coins;liveBouts+=a.bouts;}else{offlineCoins+=a.coins;offlineBouts+=a.bouts;}
   }
   if(!live){if(JSON.stringify(old.autoFight)!==JSON.stringify(s.autoFight))throw Error("offline changed policy");offlineChecks++;}
   else {advances+=+(s.autoFight.stage>old.autoFight.stage);retreats+=+(s.autoFight.stage<old.autoFight.stage);}
   if(s.coins!==earned-spent)throw Error("wallet conservation");
  };
  const shop=()=>{
   for(let stage=0;stage<32;stage++)for(const id of ids){
    const target={grade:Math.floor(stage/4),quality:smith.ITEM_QUALITIES[stage%4]};
    const q=smith.smithQuote(s,id,target);if(!q.available)continue;
    const raw=e.settle(s,time,rng);const [slot,family]=id.split(":");
    const result=Object.hasOwn(raw.state.equipment,id)?{...raw,purchased:true,state:e.activateExpertise({...raw.state,coins:raw.state.coins-q.cost,equipment:{...raw.state.equipment,[id]:target},armour:family?{...raw.state.armour,[slot]:family}:raw.state.armour})}:e.buyEquipment(s,id,target,time,rng);
    if(!result.purchased||s.coins-result.state.coins!==q.cost)throw Error("shop");
    spent+=q.cost;s=result.state;
   }
   if(firstS===null&&ids.some(id=>s.equipment[id]?.grade===7))firstS=time/DAY;
   if(firstSSet===null&&ids.every(id=>s.equipment[id]?.grade===7&&s.equipment[id]?.quality==="masterwork"))firstSSet=time/DAY;
  };
  function snapshot(){return {day:time/DAY,level:s.skills.fighting.level,stats:Object.fromEntries(Object.entries(attributes.effectiveAttributeProgress(s.attributeEffort,s.skills)).map(([k,v])=>[k,v.value])),stage:s.autoFight.stage,highest:s.autoFight.highest,gear:ids.map(id=>s.equipment[id]??null),coins:s.coins,earned,spent,liveBouts,offlineBouts,liveCoins,offlineCoins,losses,advances,retreats,weaponHours:expertise.expertiseHours(s.expertise[style]),armourHours:expertise.expertiseHours(s.expertise[family])}}
  const end=days*DAY;
  // Visit at time zero and every configured interval. Daily mixed scenario switches
  // activities only during visits; no report-only artificial login.
  while(time<end){
   const visitStart=time;visits++;
   if(e.skillMasterOffer(s).ready.length){capVisits++;s=e.learnFromMaster(s,time,rng).state;}
   shop();
   if(mixed){const wanted=Math.floor(time/DAY)%7<5?"fighting":"mining";if((s.transition?.targetActivity??s.activity)!==wanted)s=e.requestActivityChange(s,wanted,time,rng).state;}
   const liveEnd=Math.min(end,visitStart+liveMinutes*60000);
   while(time<liveEnd){
    if(liveStepMs){record(e.settleLive(s,Math.min(liveEnd,time+liveStepMs),rng),true);s=e.activateExpertise(s);continue;}
    // Actual production live guard, at most 10 s. Accelerate time before the
    // next arena boundary via fixed settlement; only the final millisecond
    // is live. For transitions use bounded chunks (no skipped live finish).
    if(!s.transition&&s.activity==="fighting"&&!e.activityRewardCapped(s)){
     const remaining=c.BOUT_MS-(s.combatSession?.elapsedMs??0)%c.BOUT_MS;
     const step=Math.min(liveEnd-time,remaining);
     if(step>1){const old=s.autoFight;const res=e.settle(s,time+step-1,rng);
      if(JSON.stringify(old)!==JSON.stringify(res.state.autoFight))throw Error("preboundary policy");
      // Reports can include productive work, but must not include a paid bout.
      if((res.reports??[res.report]).some(r=>r?.arena?.bouts))throw Error("preboundary unexpectedly paid bout");
      record(res,true);
     }
     if(time<liveEnd)record(e.settleLive(s,time+1,rng),true);
     s=e.activateExpertise(s);
    }else{
     const step=s.transition?Math.min(10000,liveEnd-time):liveEnd-time;
     record(s.transition?e.settleLive(s,time+step,rng):e.settle(s,time+step,rng),true);s=e.activateExpertise(s);
    }
   }
   gradeNights[s.autoFight.stage]++;
   const next=Math.min(end,visitStart+visitDays*DAY);
   if(time<next)record(e.enterGame(s,next,rng),false);
   if(firstSMastery===null&&s.expertise[style]>=expertise.expertiseThreshold(7))firstSMastery=time/DAY;
   if(Math.floor(time/DAY)%30===0||time===end)checkpoints.push(snapshot());
  }
  results.push({...spec,seed,visits,capVisits,firstS,firstSSet,firstSMastery,offlineChecks,gradeNights,final:snapshot(),checkpoints});
 }
 return results;
}
const dir=await mkdtemp(join(tmpdir(),"vigil-auto-economy-"));
try{
 const play=fileURLToPath(new URL("../site/play/",import.meta.url));
 for(const n of await readdir(play))if(n.endsWith(".mjs"))await copyFile(join(play,n),join(dir,n));
 const ep=join(dir,"engine.mjs"),src=await readFile(ep,"utf8");
 if(!src.includes('export const TIMING_PROFILE = "alpha";'))throw Error("profile changed");
// Historical manual-shop counterfactual ONLY in the isolated developer copy.
    // A4 mandatory runtime purchases are tested separately; never publish this copy.
    const manualGate="if(autoEquipmentUnlocked(result.state)&&Object.hasOwn(result.state.equipment,id))";
 if(!src.includes(manualGate))throw Error("Historical comparator gate changed");
 await writeFile(ep,src.replace('export const TIMING_PROFILE = "alpha";','export const TIMING_PROFILE = "normal";').replace(manualGate,"if(false)"));
 const names=["armour","difficulty","combat-skills","expertise","arenas","smith","physical-duel","combat-verdict","combat-art","combat","arena-wallet","attributes","loot","production","apprentice","auto-fight","engine"];
 const modules=Object.fromEntries(await Promise.all(names.map(async n=>[n,await import(pathToFileURL(join(dir,n+".mjs")).href)])));
 const specs=process.argv[2]?JSON.parse(process.argv[2]):["greatsword","sword_shield","hammer","bow","spear"].flatMap(style=>["padded","leather","plate"].map(family=>({style,family,visitDays:1,liveMinutes:30})));
 console.log(JSON.stringify(run(modules,specs,Number(process.argv[3]??20261126))));
}finally{await rm(dir,{recursive:true,force:true});}
