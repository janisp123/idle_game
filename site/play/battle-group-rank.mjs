// Independent legal progression brackets, not reactive enemy debuffs.
import {arenaBenchmark,validTier} from "./difficulty.mjs?v=gear-a3";
import {equipmentPrice,SMITH_BALANCE,equipmentUnlockLevel} from "./smith.mjs?v=gear-a3";
import {expertiseThreshold} from "./expertise.mjs?v=alpha-gear-a3";
import {GROUP_IDS} from "./battle-group.mjs?v=group-001";
export const GROUP_RANK_RULES=Object.freeze({wins:3,losses:2});
export const validGroupRank=r=>Boolean(r&&validTier(r.grade)&&Number.isInteger(r.streak)&&r.streak> -GROUP_RANK_RULES.losses&&r.streak<GROUP_RANK_RULES.wins);
export function initialGroupRank(grade=0){if(!validTier(grade))throw new RangeError("Invalid arena grade");return {grade,streak:0};}
export function advanceGroupRank(r,outcome){
 if(!validGroupRank(r)||!["victory","defeat","double_death"].includes(outcome))throw new RangeError("Invalid rank result");
 let streak=outcome==="victory"?Math.max(0,r.streak)+1:outcome==="defeat"?Math.min(0,r.streak)-1:0;
 let grade=r.grade;
 if(streak>=GROUP_RANK_RULES.wins){grade=Math.min(7,grade+1);streak=0;}
 if(streak<=-GROUP_RANK_RULES.losses){grade=Math.max(0,grade-1);streak=0;}
 return {grade,streak};
}
export function rankProfile(grade){
 if(!validTier(grade))throw new RangeError("Invalid clone bracket");
 const a=arenaBenchmark(grade),classLevel=equipmentUnlockLevel(grade),quality=grade===7?"masterwork":grade===0?"poor":"common";
 const shared={difficulty:grade,str:grade===7?141:a.stat,dex:grade===7?141:a.stat,end:grade===7?129:a.stat,skill:grade===7?52:a.skill};
 const b={budget:5*equipmentPrice({grade,quality})+4*SMITH_BALANCE.firstArmourCost,weaponXP:expertiseThreshold(grade),armourXP:expertiseThreshold(grade),classLevel,tacticLevel:classLevel};
 return {shared,teamworkLevel:classLevel,envelope:{version:1,roster:GROUP_IDS.map(()=>({...b}))}};
}
