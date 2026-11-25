/** Equipment practice in integer quarter-milliseconds, independent of skill levels. */
import { COMBAT_LOADOUTS } from "./combat-skills.mjs?v=glad-002";
import { ARMOUR_SLOTS, ARMOUR_TIERS } from "./armour.mjs?v=glad-003";
import { validTier } from "./difficulty.mjs?v=alpha-gear-a2";

export const EXPERTISE_BALANCE=Object.freeze({
  hoursPerGrade:Object.freeze([0,160,320,660,1320,2000,2800,4000]),
  unitsPerHour:4*3600000,
  maximumPenalty:0.60
});
export const EXPERTISE_IDS=Object.freeze([...Object.keys(COMBAT_LOADOUTS),...ARMOUR_TIERS]);
const count=n=>Number.isSafeInteger(n)&&n>=0;
export const blankExpertise=()=>Object.fromEntries(EXPERTISE_IDS.map(id=>[id,0]));
export const validExpertise=e=>Boolean(e&&typeof e==="object"&&!Array.isArray(e)&&
  Object.keys(e).length===EXPERTISE_IDS.length&&EXPERTISE_IDS.every(id=>Object.hasOwn(e,id)&&count(e[id])));
export function expertiseHours(units){
  if(!count(units))throw new RangeError("Invalid expertise units");
  return units/EXPERTISE_BALANCE.unitsPerHour;
}
export function expertiseThreshold(grade){
  if(!validTier(grade))throw new RangeError("Invalid expertise grade");
  return EXPERTISE_BALANCE.hoursPerGrade[grade]*EXPERTISE_BALANCE.unitsPerHour;
}
export function expertiseProgress(units){
  const hours=expertiseHours(units);
  const rank=EXPERTISE_BALANCE.hoursPerGrade.reduce((n,h,i)=>hours>=h?i:n,0);
  return {hours,rank,nextHours:EXPERTISE_BALANCE.hoursPerGrade[rank+1]??null};
}
/** Grade zero is fully usable; training reduces only the equipment penalty. */
export function proficiency(units,grade){
  if(!count(units)||!validTier(grade))throw new RangeError("Invalid proficiency input");
  if(grade===0)return 1;
  const minimum=1-EXPERTISE_BALANCE.maximumPenalty*Math.pow(grade/7,0.7);
  return minimum+(1-minimum)*Math.min(1,units/expertiseThreshold(grade));
}
/** All slots share one armour budget. Four identical slots = one full track. */
export function awardExpertise(current,loadout,armour,productiveMs){
  if(!validExpertise(current)||!Object.hasOwn(COMBAT_LOADOUTS,loadout)||
    !count(productiveMs)||!armour||!ARMOUR_SLOTS.every(({id})=>ARMOUR_TIERS.includes(armour[id])))
    throw new RangeError("Invalid expertise training input");
  const next={...current};
  const add=(id,units)=>{
    if(!count(units)||!count(next[id]+units))throw new RangeError("Expertise effort overflow");
    next[id]+=units;
  };
  add(loadout,4*productiveMs);
  for(const {id} of ARMOUR_SLOTS)add(armour[id],productiveMs);
  return next;
}
export const fullExpertise=()=>Object.fromEntries(EXPERTISE_IDS.map(id=>[id,expertiseThreshold(7)]));
