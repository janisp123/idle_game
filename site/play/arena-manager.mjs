// Public arena/raid coordinator. Legacy work remains isolated.
import {newArenaManager,enableArenaOnly,readManagerGame,enterManagerGame,settleManagerLive,chooseManagerGroupClass,chooseManagerGroupStance} from "./manager-lanes.mjs?v=raid-001";
import {validRaidRun,validRaidLast,beginRaid,advanceRaid} from "./raid-session.mjs";
import {saveArenaPreferences} from "./arena-preferences.mjs";
import {enrollAlphaClan,canUpgradeAcademy,upgradeAcademy} from "./alpha-clan.mjs";
export {newArenaManager,enableArenaOnly};
export function readArenaManager(value){
 try{
  const raw=typeof value==="string"?JSON.parse(value):value,s=readManagerGame(raw);if(!s)return null;
  if(raw.raidRun!==undefined&&!validRaidRun(raw.raidRun)||raw.raidLast!==undefined&&!validRaidLast(raw.raidLast))return null;
  if(raw.raidRun&&(raw.raidRun.startedAtMs>s.settledAtMs||s.settledAtMs>=raw.raidRun.startedAtMs+raw.raidRun.durationMs))return null;
  return {...enableArenaOnly(s),...(raw.raidRun!==undefined?{raidRun:raw.raidRun}:{}),...(raw.raidLast!==undefined?{raidLast:raw.raidLast}:{})};
 }catch{return null;}
}
const requireArena=s=>{if(s?.arenaOnly!==true)throw new RangeError("Public game requires arena-only mode");return s;};
function settlePublic(s,now=Date.now(),random=Math.random,online=false){
 requireArena(s);const settle=online?settleManagerLive:enterManagerGame;
 if(!s.raidRun)return settle(s,now,random);
 const out=advanceRaid(s,now);
 if(!out.finished)return {state:out.state,reports:[]};
 const after=settle(out.state,Math.max(now,out.state.settledAtMs),random);
 return {...after,raidFinished:out.finished};
}
export function enterArena(s,now,random){const out=settlePublic(s,now,random,false);return {...out,state:enrollAlphaClan(out.state)};}
export const settleArenaLive=(s,now,random)=>settlePublic(s,now,random,true);
export function startArenaRaid(s,level,now=s.settledAtMs,random=Math.random){
 requireArena(s);if(s.raidRun)return {state:s,reports:[]};
 const out=settleArenaLive(s,now,random);
 return {...out,state:beginRaid(out.state,level)};
}
export const chooseArenaClass=(s,...args)=>s.raidRun?{state:s,reports:[]}:chooseManagerGroupClass(requireArena(s),...args);
export const chooseArenaStance=(s,...args)=>s.raidRun?{state:s,reports:[]}:chooseManagerGroupStance(requireArena(s),...args);

// Real wall-clock lock is separate from the accelerated alpha game clock.
export function chooseArenaPreferences(s,favorites,now=s.settledAtMs,wallNow=Date.now(),random=Math.random){
 requireArena(s);
 const preferences=saveArenaPreferences(s.arenaPreferences,favorites,wallNow);
 const out=settleArenaLive(s,now,random);
 return {...out,state:{...out.state,arenaPreferences:preferences}};
}

// Explicit local clan actions settle earned progress before changing bonuses or balances.
export function chooseClanAcademy(s,now=s.settledAtMs,random=Math.random){const out=settleArenaLive(s,now,random);return canUpgradeAcademy(out.state)?{...out,state:upgradeAcademy(out.state)}:out;}
