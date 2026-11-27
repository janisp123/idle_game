// Manager-only migration. Preserve all owned progress; discard obsolete manual route.
// Legacy source remains untouched in its original key. Settle its elapsed interval
// using the old engine before starting the two-lane clock.
import {readSave,settle,activateExpertise,ACTIVITIES,TIMING_PROFILE} from "./engine.mjs?v=analytics-001";
import {newManagerGame,readManagerGame,MANAGER_LANES_VERSION} from "./manager-lanes.mjs?v=analytics-001";
import {blankArmourRequests} from "./manager-equipment.mjs?v=manager-gear-001";
import {blankTactics} from "./manager-tactics.mjs?v=manager-tactics-001";
import {WORK_ROTATION} from "./activity-rotation.mjs?v=manager-rotation-001";
export const MANAGER_SAVE_KEY="idle-game-manager-v1";
export const MANAGER_CLOCK_KEY="idle-game-manager-clock-v1";
export function migrateLegacyManager(value,now,random=Math.random){
 const old=readSave(value);
 if(!old?.teamSecond)return null;
 const result=settle(old,Math.max(now,old.settledAtMs),random);
 const s=activateExpertise(result.state);
 const fighting=s.activity==="fighting"&&(!s.transition||s.transition.phase==="finishing");
 const working=WORK_ROTATION.includes(s.activity)&&(!s.transition||s.transition.phase==="finishing");
 const next={...s,activity:"fighting",progressMs:fighting?s.progressMs:s.fightingRemainderMs,
  fightingRemainderMs:0,transition:null,wagons:[{activity:"fighting",plannedMs:null}],productiveElapsedMs:0,
  combatSession:fighting?s.combatSession:null,managerVersion:MANAGER_LANES_VERSION,
  managerWork:{activity:working?s.activity:"hunting",progressMs:working?s.progressMs:0,travelMs:0},
  overlapParity:0,armourRequests:blankArmourRequests(),managerTactics:blankTactics()};
 const valid=readManagerGame(next);
 return valid?{state:valid,reports:result.reports??[result.report],migrated:true}:null;
}
