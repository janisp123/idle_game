// Public game entry points. Legacy two-lane functions remain accessible only
// through the historical manager adapter for regression/migration.
import {newArenaManager,enableArenaOnly,readManagerGame,enterManagerGame,settleManagerLive,chooseManagerGroupClass,chooseManagerGroupStance} from "./manager-lanes.mjs?v=individual-stats-001";
export {newArenaManager,enableArenaOnly};
export function readArenaManager(value){const s=readManagerGame(value);return s?enableArenaOnly(s):null;}
const requireArena=s=>{if(s?.arenaOnly!==true)throw new RangeError("Public game requires arena-only mode");return s;};
export const enterArena=(s,...args)=>enterManagerGame(requireArena(s),...args);
export const settleArenaLive=(s,...args)=>settleManagerLive(requireArena(s),...args);
export const chooseArenaClass=(s,...args)=>chooseManagerGroupClass(requireArena(s),...args);
export const chooseArenaStance=(s,...args)=>chooseManagerGroupStance(requireArena(s),...args);
