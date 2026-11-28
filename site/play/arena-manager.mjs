// Public arena/raid coordinator. Legacy work remains isolated.
import {newArenaManager,enableArenaOnly,readManagerGame,enterManagerGame,settleManagerLive,chooseManagerGroupClass,chooseManagerGroupStance} from "./manager-lanes.mjs?v=raid-001";
import {validRaidRun,validRaidLast,beginRaid,advanceRaid} from "./raid-session.mjs";
import {saveArenaPreferences} from "./arena-preferences.mjs";
import {enrollAlphaClan,advanceConstruction,setClanPriority,clanWeekEnd} from "./alpha-clan.mjs";
import {validClanRegistration,registerClanRaid,settleClanRaid} from "./clan-raid.mjs";
import {activeGroupIds} from "./battle-group.mjs?v=group-001";
import {towerProgress,validTower,raidUnlocked,beginTower,advanceTower} from "./endless-tower.mjs";
export {newArenaManager,enableArenaOnly};
export function readArenaManager(value){
 try{
  const raw=typeof value==="string"?JSON.parse(value):value,s=readManagerGame(raw);if(!s)return null;
  if(s.alphaClan?.raid.registration&&!validClanRegistration(s.alphaClan.raid.registration))return null;
  if(raw.raidRun!==undefined&&!validRaidRun(raw.raidRun)||raw.raidLast!==undefined&&!validRaidLast(raw.raidLast))return null;
  if(raw.raidRun&&(raw.raidRun.startedAtMs>s.settledAtMs||s.settledAtMs>=raw.raidRun.startedAtMs+raw.raidRun.durationMs))return null;
  if(raw.tower!==undefined&&(!validTower(raw.tower,s.settledAtMs)||raw.tower.run&&raw.raidRun))return null;
  return {...enableArenaOnly(s),...(raw.tower!==undefined?{tower:raw.tower}:{}),...(raw.raidRun!==undefined?{raidRun:raw.raidRun}:{}),...(raw.raidLast!==undefined?{raidLast:raw.raidLast}:{})};
 }catch{return null;}
}
const requireArena=s=>{if(s?.arenaOnly!==true)throw new RangeError("Public game requires arena-only mode");return s;};
function settlePublic(s,now=Date.now(),random=Math.random,online=false){
 requireArena(s);const settle=online?settleManagerLive:enterManagerGame;
 const tower=towerProgress(s);
 const keep=out=>({...out,state:{...out.state,tower:out.state.tower??tower}});
 if(tower.run){const out=advanceTower(s,now);if(!out.finished)return {state:out.state,reports:[]};const after=settle(out.state,Math.max(now,out.state.settledAtMs),random);return {...after,state:{...after.state,tower:out.state.tower},towerFinished:out.finished};}
 if(!s.raidRun)return keep(settle(s,now,random));
 const out=advanceRaid(s,now);
 if(!out.finished)return keep({state:out.state,reports:[]});
 const after=settle(out.state,Math.max(now,out.state.settledAtMs),random);
 return keep({...after,raidFinished:out.finished});
}
function updateClan(out,wallNow){const s=out.state;if(!s.alphaClan)return out;const r=settleClanRaid(s,wallNow);return {...out,...r,state:{...r.state,alphaClan:advanceConstruction(r.state.alphaClan,wallNow)}};}
export function enterArena(s,now,random,wallNow=Date.now()){const out=settlePublic(s,now,random,false);return updateClan({...out,state:enrollAlphaClan(out.state)},wallNow);}
export const settleArenaLive=(s,now,random,wallNow=Date.now())=>updateClan(settlePublic(s,now,random,true),wallNow);
export function startArenaRaid(s,level,now=s.settledAtMs,random=Math.random){
 requireArena(s);if(s.raidRun||towerProgress(s).run||activeGroupIds(s.battleGroup).length<7||!raidUnlocked(s,level))return {state:s,reports:[]};
 const out=settleArenaLive(s,now,random);
 return {...out,state:beginRaid(out.state,level)};
}
export function startArenaTower(s,now=s.settledAtMs,random=Math.random){requireArena(s);if(s.raidRun||towerProgress(s).run)return {state:s,reports:[]};const out=settleArenaLive(s,now,random);return {...out,state:beginTower(out.state)};}
const chooseGroup=(fn,s,args)=>{if(s.raidRun||towerProgress(s).run)return {state:s,reports:[]};const out=fn(requireArena(s),...args);return {...out,state:{...out.state,tower:towerProgress(s)}};};
export const chooseArenaClass=(s,...args)=>chooseGroup(chooseManagerGroupClass,s,args);
export const chooseArenaStance=(s,...args)=>chooseGroup(chooseManagerGroupStance,s,args);

// Real wall-clock lock is separate from the accelerated alpha game clock.
export function chooseArenaPreferences(s,favorites,now=s.settledAtMs,wallNow=Date.now(),random=Math.random){
 requireArena(s);
 const preferences=saveArenaPreferences(s.arenaPreferences,favorites,wallNow);
 const out=settleArenaLive(s,now,random);
 return {...out,state:{...out.state,arenaPreferences:preferences}};
}

// Explicit local clan actions settle earned progress before changing bonuses or balances.
export function chooseClanPriority(s,id,now=s.settledAtMs,wallNow=Date.now(),random=Math.random){const out=settleArenaLive(s,now,random,wallNow);return {...out,state:{...out.state,alphaClan:advanceConstruction(setClanPriority(out.state.alphaClan,id),wallNow)}};}
export function chooseClanRaid(s,now=s.settledAtMs,wallNow=Date.now(),random=Math.random){const out=settleArenaLive(s,now,random,wallNow);return {...out,state:registerClanRaid(out.state,wallNow)};}
// Developer-only explicit simulation of the signed-up week; no arena clock change.
export function testClanRaid(s,now=s.settledAtMs,wallNow=Date.now(),random=Math.random){const out=settleArenaLive(s,now,random,wallNow),r=out.state.alphaClan.raid.registration;if(!r)return out;return {...out,...settleClanRaid(out.state,clanWeekEnd(r.week))};}
