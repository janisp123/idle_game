// TEAM-004: six-month trajectories using actual normal-profile engine.
import assert from "node:assert/strict";
import {mkdtemp,readdir,copyFile,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const dir=await mkdtemp(join(tmpdir(),"vigil-team-economy-"));
const DAY=86400000,seed=Number(process.argv[4]??20261126),rewardPct=Number(process.argv[3]??100);
assert.ok([100,125,140].includes(rewardPct)&&Number.isSafeInteger(seed)&&seed>=0&&seed<=0xffffffff);
const specs=[
 {name:"tank_archer",first:["sword_shield","plate"],second:["bow","leather"],visitDays:1,liveMinutes:5},
 {name:"hammer_spear",first:["hammer","plate"],second:["spear","leather"],visitDays:1,liveMinutes:5},
 {name:"dual_bow",first:["bow","leather"],second:["bow","leather"],visitDays:1,liveMinutes:5},
 {name:"dual_shield",first:["sword_shield","plate"],second:["sword_shield","plate"],visitDays:1,liveMinutes:5},
 {name:"tank_archer_long",first:["sword_shield","plate"],second:["bow","leather"],visitDays:1,liveMinutes:30},
 {name:"weekly",first:["sword_shield","plate"],second:["bow","leather"],visitDays:7,liveMinutes:5},
 {name:"mixed",first:["hammer","plate"],second:["spear","leather"],visitDays:1,liveMinutes:5,mixed:true}
];
try{
 const play=fileURLToPath(new URL("../site/play/",import.meta.url));
 for(const n of await readdir(play))if(n.endsWith(".mjs"))await copyFile(join(play,n),join(dir,n));
 const ep=join(dir,"engine.mjs"),src=await readFile(ep,"utf8");
 assert.ok(src.includes('export const TIMING_PROFILE = "alpha";'));
 await writeFile(ep,src.replace('export const TIMING_PROFILE = "alpha";','export const TIMING_PROFILE = "normal";'));
 // Counterfactual only in temporary developer copy; round per victory, not per batch.
 const timeline=join(dir,"team-timeline.mjs"),timelineSrc=await readFile(timeline,"utf8");
 const payout="counts.victory*arenaReward(session.players[TEAM_IDS[0]].difficulty)";
 assert.ok(timelineSrc.includes(payout));
 await writeFile(timeline,timelineSrc.replace(payout,"counts.victory*Math.round(arenaReward(session.players[TEAM_IDS[0]].difficulty)*"+rewardPct+"/100)"));
 const load=n=>import(pathToFileURL(join(dir,n+".mjs")).href);
 const [e,c,smith,armour,attributes,expertise,team]=await Promise.all(["engine","combat","smith","armour","attributes","expertise","team"].map(load));
 const selected=process.argv[2]?specs.filter(x=>x.name===process.argv[2]):specs;
 assert.ok(selected.length);
 for(const spec of selected){
  const random=c.seededCombatRandom(seed),ids=Object.fromEntries(team.TEAM_IDS.map(id=>[id,[spec[id][0],...armour.ARMOUR_SLOTS.map(s=>s.id+":"+spec[id][1])]]));
  let s=e.newTeamGame(0),earned=0,spent=0,time=0,bouts=0,wins=0,losses=0,draws=0,liveBouts=0,offlineBouts=0,visits=0,manual=0,automatic=0,claims=0,unlockDay=null,firstS=null,fullS=null,offlineChecks=0;
  const checkpoints=[],stageDays=Array(8).fill(0);
  for(const id of team.TEAM_IDS)s=e.setTeamWeapon(s,id,spec[id][0],0,random).state;
  s=e.chooseActivity(s,"fighting",0,random).state;
  const record=(result,live)=>{
   const prev=s;s=result.state;time=s.settledAtMs;
   for(const rep of result.reports??[result.report]){
    const a=rep?.arena;if(!a)continue;
    earned+=a.coins;bouts+=a.bouts;wins+=a.victories;losses+=a.defeats;draws+=a.doubleDeaths;
    if(live)liveBouts+=a.bouts;else offlineBouts+=a.bouts;
   }
   if(!live){assert.deepEqual(s.autoFight,prev.autoFight,"offline stage frozen");offlineChecks++;}
   assert.equal(s.coins,earned-spent,"wallet conservation");
  };
  const purchase=(fighter,id,target)=>{
   const q=smith.smithQuote({...s,...e.teamFromState(s)[fighter]},id,target);
   if(!q.available)return false;
   const result=e.buyTeamEquipment(s,fighter,id,target,time,random);
   assert.ok(result.purchased);assert.equal(s.coins-result.state.coins,q.cost);
   spent+=q.cost;manual++;s=result.state;return true;
  };
  function shop(){
   for(const fighter of team.TEAM_IDS)for(const id of ids[fighter].slice(1))
    if(!e.teamFromState(s)[fighter].equipment[id])purchase(fighter,id,smith.STARTER_ITEM);
   if(!e.autoEquipmentUnlocked(s)){
    for(let i=0;i<team.MAX_TEAM_UPGRADES;i++){
     const n=team.previewTeamUpgrade(e.teamFromState(s),s.coins,s.skills.fighting.level);
     if(!n?.quote.available)break;
     assert.ok(purchase(n.id,n.itemId,n.target));
    }
   }else if(unlockDay===null)unlockDay=time/DAY;
   const result=e.enterGameWithApprentice(s,time,random),report=result.autoEquipment;
   if(report){
    assert.equal(s.coins-result.state.coins,report.spent);
    for(const step of report.upgrades){assert.ok(ids[step.fighterId].includes(step.id));assert.equal(step.cost,smith.equipmentPrice(step.to)-smith.equipmentPrice(step.from));}
    automatic+=report.upgrades.length;spent+=report.spent;
   }
   assert.deepEqual(result.state.autoFight,s.autoFight);
   s=result.state;assert.equal(s.coins,earned-spent);
   const owned=team.TEAM_IDS.flatMap(id=>ids[id].map(key=>e.teamFromState(s)[id].equipment[key]));
   if(firstS===null&&owned.some(i=>i?.grade===7))firstS=time/DAY;
   if(fullS===null&&owned.every(i=>i?.grade===7&&i?.quality==="masterwork"))fullS=time/DAY;
  }
  const snapshot=()=>({day:time/DAY,fighting:s.skills.fighting.level,teamwork:s.teamwork,stage:s.autoFight.stage,highest:s.autoFight.highest,
    stats:Object.fromEntries(Object.entries(attributes.effectiveAttributeProgress(s.attributeEffort,s.skills)).map(([k,v])=>[k,v.value])),
    coins:s.coins,earned,spent,bouts,wins,losses,draws,liveBouts,offlineBouts,manual,automatic,
    fighters:Object.fromEntries(team.TEAM_IDS.map(id=>{const f=e.teamFromState(s)[id];return [id,{gear:ids[id].map(key=>f.equipment[key]??null),weaponHours:expertise.expertiseHours(f.expertise[spec[id][0]]),armourHours:expertise.expertiseHours(f.expertise[spec[id][1]])}]}))});
  const end=180*DAY;
  while(time<end){
   const start=time;visits++;
   if(e.skillMasterOffer(s).ready.length){const claim=e.learnFromMaster(s,time,random);claims+=claim.mastery.ready.length;s=claim.state;}
   shop();
   if(spec.mixed){const wanted=Math.floor(time/DAY)%7<5?"fighting":"mining";if((s.transition?.targetActivity??s.activity)!==wanted)s=e.requestActivityChange(s,wanted,time,random).state;}
   const liveEnd=Math.min(end,start+spec.liveMinutes*60000);
   while(time<liveEnd){
    if(!s.transition&&s.activity==="fighting"&&!e.activityRewardCapped(s)){
     const remaining=c.BOUT_MS-(s.combatSession?.elapsedMs??0)%c.BOUT_MS;
     const step=Math.min(liveEnd-time,remaining);
     if(step>1){const res=e.settle(s,time+step-1,random);assert.deepEqual(res.state.autoFight,s.autoFight);
      assert.ok(!(res.reports??[res.report]).some(r=>r?.arena?.bouts));record(res,true);}
     if(time<liveEnd)record(e.settleLive(s,time+1,random),true);
     s=e.activateExpertise(s);
    }else{const step=s.transition?Math.min(10000,liveEnd-time):liveEnd-time;record(s.transition?e.settleLive(s,time+step,random):e.settle(s,time+step,random),true);s=e.activateExpertise(s);}
   }
   stageDays[s.autoFight.stage]++;
   const next=Math.min(end,start+spec.visitDays*DAY);
   if(time<next)record(e.enterGame(s,next,random),false);
   if(Math.floor(time/DAY)%30===0||time===end)checkpoints.push(snapshot());
   assert.ok(e.readSave(s),"valid saved team");
  }
  assert.equal(bouts,wins+losses+draws);assert.equal(bouts,liveBouts+offlineBouts);
  console.log(JSON.stringify({spec,seed,rewardPct,profile:e.TIMING_PROFILE,visits,claims,unlockDay,firstS,fullS,offlineChecks,stageDays,final:snapshot(),checkpoints}));
 }
}finally{await rm(dir,{recursive:true,force:true});}
