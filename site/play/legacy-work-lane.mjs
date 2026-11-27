// HISTORICAL REGRESSION ONLY: retired two-lane gathering/crafting manager.
// Never call from arena-only settlement. Preserve old fixtures and research.
import {ACTIVITIES,ATTRIBUTE_IDS,ACTIVITY_STAT_WEIGHTS,settleManagerLane,managerCombatProductivePrefix,activityRewardCapped,recipeOptions,PRODUCTION_RECIPES} from "./engine.mjs?v=arena-only-001";
import {accumulateBattleAnalytics} from "./battle-analytics.mjs?v=npc-parity-001";
import {accumulateGroupAnalytics} from "./battle-group-analytics.mjs?v=group-004";
const count=n=>Number.isSafeInteger(n)&&n>=0;
const projection=(s,work=false)=>work?{...s,activity:s.managerWork.activity,progressMs:s.managerWork.progressMs,transition:null,wagons:[{activity:s.managerWork.activity,plannedMs:null}],productiveElapsedMs:0,combatSession:null}:s;
function laneTime(before,after){const total=ATTRIBUTE_IDS.reduce((n,id)=>n+after.attributeEffort[id]-before.attributeEffort[id],0);if(!count(total)||total%100)throw new Error("Nonconserving lane effort");return total/100;}
function workEnd(s,end,start){
  const id=s.managerWork.activity;
  if(!PRODUCTION_RECIPES[id])return end;
  const options=recipeOptions(id,s.skills[id].level);
  // Current recipes have disjoint input sets within each activity.
  // Reject future overlapping recipes rather than overcrediting capacity.
  const seen=new Set();let capacity=0;
  for(const recipe of options){
    for(const item of recipe.inputs){
      if(seen.has(item))throw new Error("Shared recipe inputs require a capacity allocator");
      seen.add(item);
    }
    capacity+=Math.min(...recipe.inputs.map(item=>s.items[item]??0));
  }
  if(!capacity)return start;
  return start+Math.min(end-start,Math.max(0,capacity*ACTIVITIES[id].durationMs-s.managerWork.progressMs));
}
function replay(random){
  const values=[];
  return ()=>{let i=0;return ()=>{if(i===values.length)values.push(random());return values[i++];};};
}
export function settleLegacyWorkPair(s,end,random,online){
  if(s.arenaOnly)throw new RangeError("Retired work lane is forbidden in the arena");
  const combat=projection(s),work=projection(s,true);
  const combatRoll=replay(random),workRoll=replay(random);
  const run=target=>({
    combat:settleManagerLane(combat,target,combatRoll(),online),
    work:(()=>{
      const start=Math.min(target,s.settledAtMs+s.managerWork.travelMs);
      return settleManagerLane({...work,settledAtMs:start},workEnd(s,target,start),workRoll(),online);
    })()
  });
  let a=run(end);
  if(online){
    // An eligible cap in either lane is an automation boundary for BOTH.
    const capEnd=Math.min(end,...[["combat",combat],["work",work]].flatMap(([k,start])=>
      !activityRewardCapped(start)&&activityRewardCapped(a[k].state)?[a[k].state.settledAtMs]:[]));
    if(capEnd<end){end=capEnd;a=run(end);}
  }
  const c=a.combat.state,w=a.work.state;
  const combatMs=laneTime(s,c),workMs=laneTime(s,w);
  const combatWall=c.settledAtMs-s.settledAtMs;
  const workStart=Math.min(end-s.settledAtMs,s.managerWork.travelMs);
  const prefix=t=>t>=combatWall?combatMs:managerCombatProductivePrefix(combat,t,online);
  const overlap=workMs?prefix(Math.min(combatWall,workStart+workMs))-prefix(Math.min(combatWall,workStart)):0;
  if(!count(overlap)||overlap>Math.min(combatMs,workMs))throw new Error("Invalid productive overlap");
  // Alternate odd overlap milliseconds between lanes; exact 100-weight
  // total per wall millisecond, no fractional or lost shared effort.
  const combatShare=Math.floor((overlap+s.overlapParity)/2);
  const combatTime=combatMs-overlap+combatShare,workTime=workMs-combatShare;
  const cw=ACTIVITY_STAT_WEIGHTS.fighting,ww=ACTIVITY_STAT_WEIGHTS[work.activity];
  const attributeEffort=Object.fromEntries(ATTRIBUTE_IDS.map(id=>{
    const n=s.attributeEffort[id]+combatTime*(cw[id]??0)+workTime*(ww[id]??0);
    if(!count(n))throw new RangeError("Manager effort overflow");return [id,n];
  }));
  const next={...c,battleAnalytics:accumulateBattleAnalytics(s.battleAnalytics,a.combat.report?.arena?.analytics??[]),...(s.battleGroup?{groupAnalytics:accumulateGroupAnalytics(s.groupAnalytics,a.combat.report?.arena?.groupAnalytics??[])}:{}),skills:{...c.skills,[work.activity]:w.skills[work.activity]},
    items:w.items,attributeEffort,settledAtMs:end,
    managerWork:{activity:work.activity,progressMs:w.progressMs,travelMs:Math.max(0,s.managerWork.travelMs-(end-s.settledAtMs))},
    overlapParity:(s.overlapParity+overlap)%2};
  const reports=[a.combat.report,a.work.report].filter(r=>r&&(r.completed||r.arena));
  return {state:next,reports,report:reports.at(-1),effort:{combatMs,workMs,overlap,combatTime,workTime}};
}
