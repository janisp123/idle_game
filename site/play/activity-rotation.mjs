// AUTO-ACTIVITY-001 candidate. Deterministic, data-driven one-level rotation.
// Reserve policy is provisional; legacy Master callers retain full tribute.
import {ACTIVITIES,SKILL_BALANCE,PRODUCTION_RECIPES,recipeOptions,xpToNextLevel,
  activityRewardCapped,SAME_ZONE_TRAVEL_MS,ZONE_TRAVEL_MS,PREPARATION_MS} from "./engine.mjs?v=npc-parity-001";

export const WORK_ROTATION=Object.freeze([
  "hunting","fishing","foraging","woodcutting","mining","farming",
  "smithing","construction","cooking","training"
]);
if(new Set(WORK_ROTATION).size!==WORK_ROTATION.length||
  WORK_ROTATION.length!==Object.keys(ACTIVITIES).length-1||
  WORK_ROTATION.some(id=>id==="fighting"||!Object.hasOwn(ACTIVITIES,id)))
  throw new Error("Rotation must contain every noncombat activity exactly once");
export function workEligible(s,id){
  if(!WORK_ROTATION.includes(id))throw new RangeError("Unknown rotation activity");
  if(activityRewardCapped(s,id))return false;
  return !PRODUCTION_RECIPES[id]||recipeOptions(id,s.skills[id].level)
    .some(r=>r.inputs.every(item=>s.items[item]>0));
}
export function nextRotationActivity(s,after){
  const index=WORK_ROTATION.indexOf(after);
  if(index<0)throw new RangeError("Unknown rotation cursor");
  for(let offset=1;offset<=WORK_ROTATION.length;offset++){
    const id=WORK_ROTATION[(index+offset)%WORK_ROTATION.length];
    if(workEligible(s,id))return id;
  }
  return null;
}
// Reserve at most one level of ingredients per eligible alternative recipe.
// Each alternative can stand on its own, including paired limestone/fuel.
// Demand uses the existing XP rate and conservative minimum batch variation.
// Never create inventory: this is a ceiling on retained actual stock, not a grant.
export function ingredientReserve(s){
  const demand={};
  for(const id of WORK_ROTATION){
    if(!PRODUCTION_RECIPES[id])continue;
    const skill=s.skills[id],missing=xpToNextLevel(skill.level)-skill.xp;
    if(missing<=0)continue;
    const efficiency=Math.min(SKILL_BALANCE.maxEfficiency,1+(skill.level-1)*SKILL_BALANCE.efficiencyPerLevel);
    // A single action can round down; using integer lower bound is safe
    // at any tick partition. Current base XP always yields >=1.
    const floorXP=Math.max(1,Math.floor(ACTIVITIES[id].xp*efficiency*(1-SKILL_BALANCE.batchVariation)));
    const cycles=Math.ceil(missing/floorXP);
    for(const r of recipeOptions(id,skill.level))for(const item of r.inputs){
      const n=(demand[item]??0)+cycles;
      if(!Number.isSafeInteger(n))throw new RangeError("Ingredient reserve overflow");
      demand[item]=n;
    }
  }
  return Object.fromEntries(Object.entries(demand).map(([item,n])=>[item,Math.min(n,s.items[item]??0)]).filter(([,n])=>n>0));
}
export function rotationTravelMs(from,to){
  return from===to?0:(ACTIVITIES[from].zone===ACTIVITIES[to].zone?SAME_ZONE_TRAVEL_MS:ZONE_TRAVEL_MS)+PREPARATION_MS;
}
export function rotateManagerWork(s,claimed=[]){
  const current=s.managerWork.activity;
  if(!claimed.includes(current)&&workEligible(s,current))return s;
  const next=nextRotationActivity(s,current);
  if(!next||next===current)return s;
  return {...s,managerWork:{activity:next,progressMs:0,travelMs:rotationTravelMs(current,next)}};
}
