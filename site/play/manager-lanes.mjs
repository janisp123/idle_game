// PERMANENT-FIGHT-001: shared clock, permanent combat, one noncombat lane.
// Reuses production reward and combat resolution; not yet wired to public UI.
import {
  ACTIVITIES, ATTRIBUTE_IDS, ACTIVITY_STAT_WEIGHTS, TIMING_PROFILE,
  newTeamGame, readSave, chooseActivity, settleManagerLane, managerCombatProductivePrefix,
  automateSettledProgress, activateExpertise, activityRewardCapped,
  recipeOptions, PRODUCTION_RECIPES, LIVE_FIGHT_MAX_MS, autoEquipmentPreview
} from "./engine.mjs?v=manager-lanes-001";
import {BOUT_MS} from "./combat.mjs?v=gear-a3";
import {WORK_ROTATION,ingredientReserve,rotateManagerWork,rotationTravelMs} from "./activity-rotation.mjs?v=manager-rotation-001";

export const MANAGER_LANES_VERSION=2;
const count=n=>Number.isSafeInteger(n)&&n>=0;
const validWork=id=>WORK_ROTATION.includes(id);
const route=id=>[{activity:id,plannedMs:null}];
const blankWork=id=>({activity:id,progressMs:0,travelMs:0});
const projection=(s,work=false)=>work?{
  ...s,activity:s.managerWork.activity,progressMs:s.managerWork.progressMs,
  transition:null,wagons:route(s.managerWork.activity),productiveElapsedMs:0,combatSession:null
}:s;
function validManagerShape(s){
  return s?.managerVersion===MANAGER_LANES_VERSION&&s.activity==="fighting"&&
    s.transition===null&&s.wagons?.length===1&&s.wagons[0].activity==="fighting"&&
    s.wagons[0].plannedMs===null&&s.fightingRemainderMs===0&&s.productiveElapsedMs===0&&
    validWork(s.managerWork?.activity)&&count(s.managerWork.progressMs)&&
    s.managerWork.progressMs<ACTIVITIES[s.managerWork.activity].durationMs&&
    count(s.managerWork.travelMs)&&s.managerWork.travelMs<=Math.max(...WORK_ROTATION.map(id=>rotationTravelMs(id,s.managerWork.activity)))&&
    (!s.managerWork.travelMs||s.managerWork.progressMs===0)&&[0,1].includes(s.overlapParity);
}
function requireManager(s){if(!validManagerShape(s))throw new RangeError("Invalid manager state");}
export function newManagerGame(now=Date.now(),firstWork="hunting"){
  if(!validWork(firstWork))throw new RangeError("Invalid starting work");
  const s=chooseActivity(newTeamGame(now),"fighting",now).state;
  return {...s,managerVersion:MANAGER_LANES_VERSION,managerWork:blankWork(firstWork),overlapParity:0};
}
export function readManagerGame(value){
  try{
    const raw=typeof value==="string"?JSON.parse(value):value;
    // Phase 2 prototype only accepts its own current timing profile; never
    // silently convert a legacy route or discard a paid combat cursor.
    if(!validManagerShape(raw)||raw.timingProfile!==TIMING_PROFILE)return null;
    const s=readSave(raw);
    if(!s||!s.teamSecond)return null;
    return {...s,managerVersion:MANAGER_LANES_VERSION,
      managerWork:{...raw.managerWork},overlapParity:raw.overlapParity};
  }catch{return null;}
}
// Internal coordinator hook for Phase 3, never a player-facing action.
// Settle/claim first; switching discards only uncompleted partial cycle,
// not earned XP or materials. Real transition handling remains Phase 3.
export function assignManagerWork(s,id){
  requireManager(s);
  if(!validWork(id))throw new RangeError("Invalid noncombat work");
  if(s.managerWork.activity===id)return s;
  return {...s,managerWork:{...blankWork(id),travelMs:rotationTravelMs(s.managerWork.activity,id)}};
}
function laneTime(before,after){
  const total=ATTRIBUTE_IDS.reduce((n,id)=>n+after.attributeEffort[id]-before.attributeEffort[id],0);
  if(!count(total)||total%100)throw new Error("Nonconserving lane effort");
  return total/100;
}
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
function pair(s,end,random,online){
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
  const next={...c,skills:{...c.skills,[work.activity]:w.skills[work.activity]},
    items:w.items,attributeEffort,settledAtMs:end,
    managerWork:{activity:work.activity,progressMs:w.progressMs,travelMs:Math.max(0,s.managerWork.travelMs-(end-s.settledAtMs))},
    overlapParity:(s.overlapParity+overlap)%2};
  const reports=[a.combat.report,a.work.report].filter(r=>r&&(r.completed||r.arena));
  return {state:next,reports,report:reports.at(-1),effort:{combatMs,workMs,overlap,combatTime,workTime}};
}
export function settleManagerOffline(s,now=Date.now(),random=Math.random){
  requireManager(s);if(!count(now))throw new RangeError("Invalid clock");
  // Frozen inputs; both lanes independently pause at their existing XP cap.
  return pair(s,Math.max(s.settledAtMs,now),random,false);
}
export function enterManagerGame(s,now=Date.now(),random=Math.random){
  const out=settleManagerOffline(s,now,random);
  const active=activateExpertise(out.state),reserve=ingredientReserve(active);
  const claimed=automateSettledProgress({...out,state:active},reserve);
  return {...claimed,state:rotateManagerWork(claimed.state,claimed.mastery?.ready??[]),ingredientReserve:reserve};
}
export function settleManagerLive(s,now=Date.now(),random=Math.random){
  requireManager(s);if(!count(now))throw new RangeError("Invalid clock");
  if(now<s.settledAtMs||now-s.settledAtMs>LIVE_FIGHT_MAX_MS)return enterManagerGame(s,now,random);
  const reports=[],levelsGained={},tribute={},upgrades=[];let spent=0,teamworkLevelGained=0;
  let next=s;
  const apply=()=>{
    const active=activateExpertise(next);
    const out=automateSettledProgress({state:active},ingredientReserve(active));
    next=rotateManagerWork(out.state,out.mastery?.ready??[]);
    for(const [id,n] of Object.entries(out.levelsGained??{}))levelsGained[id]=(levelsGained[id]??0)+n;
    for(const [id,n] of Object.entries(out.mastery?.tribute??{}))tribute[id]=(tribute[id]??0)+n;
    teamworkLevelGained+=out.teamworkLevelGained??0;
    spent+=out.autoEquipment?.spent??0;upgrades.push(...(out.autoEquipment?.upgrades??[]));
  };
  apply();
  for(let i=0;next.settledAtMs<now;i++){
    if(i>=64)throw new Error("Manager live boundary limit");
    const before=next.settledAtMs;
    const segment=Math.min(now-before,BOUT_MS-((next.combatSession?.elapsedMs??0)%BOUT_MS),
      next.managerWork.travelMs||ACTIVITIES[next.managerWork.activity].durationMs-next.managerWork.progressMs,
      ACTIVITIES.fighting.durationMs-next.progressMs);
    const outcome=pair(next,before+segment,random,true);
    next=outcome.state;reports.push(...outcome.reports);apply();
    if(next.settledAtMs<=before)throw new Error("Manager clock failed to advance");
  }
  const ready=Object.keys(levelsGained);
  return {state:next,reports,report:reports.at(-1),levelsGained,teamworkLevelGained,
    ...(ready.length?{mastery:{ready,blocked:[],tribute}}:{}),
    ingredientReserve:ingredientReserve(next),
    autoEquipment:{upgrades,spent,preview:autoEquipmentPreview(next)}};
}
