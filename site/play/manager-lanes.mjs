// Public arena-only manager and historical save/fixture compatibility.
// The retired work lane is isolated in legacy-work-lane.mjs.
import {settleLegacyWorkPair} from "./legacy-work-lane.mjs";
import {
  ACTIVITIES, ATTRIBUTE_IDS, TIMING_PROFILE,
  newTeamGame, readSave, chooseActivity, settleManagerLane,
  automateSettledProgress, activateExpertise, LIVE_FIGHT_MAX_MS
} from "./engine.mjs?v=kits-001";
import {teamBoutMs,fasterTeamSession} from "./team-timeline.mjs?v=group-004";
import {GROUP_TIMELINE_VERSION} from "./battle-group-timing.mjs";
import {initialBattleGroup,validBattleGroup,selectGroupClass,selectGroupStance,upgradeBattleGroup,previewGroupUpgrade} from "./battle-group.mjs?v=group-001";
import {blankGroupAnalytics,validGroupAnalytics,accumulateGroupAnalytics} from "./battle-group-analytics.mjs?v=group-004";
import {blankBattleAnalytics,validBattleAnalytics,accumulateBattleAnalytics} from "./battle-analytics.mjs?v=npc-parity-001";
import {WORK_ROTATION,ingredientReserve,rotateManagerWork,rotationTravelMs} from "./activity-rotation.mjs?v=npc-parity-001";
import {blankArmourRequests,validArmourRequests,requestArmourSet,selectManagerWeapon,automateManagerEquipment,managerEquipmentPreview} from "./manager-equipment.mjs?v=npc-parity-001";

import {blankTactics,validTactics,chooseTactic,validTacticSnapshot,activateTactics} from "./manager-tactics.mjs?v=manager-tactics-001";
export const MANAGER_LANES_VERSION=4;
const count=n=>Number.isSafeInteger(n)&&n>=0;
const validWork=id=>WORK_ROTATION.includes(id);
const blankWork=id=>({activity:id,progressMs:0,travelMs:0});
function validManagerShape(s){
  return s?.managerVersion===MANAGER_LANES_VERSION&&s.activity==="fighting"&&
    s.transition===null&&s.wagons?.length===1&&s.wagons[0].activity==="fighting"&&
    s.wagons[0].plannedMs===null&&s.fightingRemainderMs===0&&s.productiveElapsedMs===0&&
    (s.arenaOnly===true?Boolean(s.battleGroup&&s.managerWork===undefined&&s.overlapParity===undefined&&Object.values(s.items??{}).every(v=>v===0)):s.arenaOnly===undefined&&validWork(s.managerWork?.activity)&&count(s.managerWork.progressMs)&&
    s.managerWork.progressMs<ACTIVITIES[s.managerWork.activity].durationMs&&
    count(s.managerWork.travelMs)&&s.managerWork.travelMs<=Math.max(...WORK_ROTATION.map(id=>rotationTravelMs(id,s.managerWork.activity)))&&
    (!s.managerWork.travelMs||s.managerWork.progressMs===0)&&[0,1].includes(s.overlapParity))&&validArmourRequests(s.armourRequests)&&validTactics(s.managerTactics)&&
    (!s.combatSession||Object.values(s.combatSession.players??{}).every(validTacticSnapshot))&&
    (s.battleGroup===undefined?s.groupAnalytics===undefined:validBattleGroup(s.battleGroup)&&validGroupAnalytics(s.groupAnalytics));
}
function requireManager(s){if(!validManagerShape(s))throw new RangeError("Invalid manager state");}
export function newManagerGame(now=Date.now(),firstWork="hunting"){
  if(!validWork(firstWork))throw new RangeError("Invalid starting work");
  const s=chooseActivity(newTeamGame(now),"fighting",now).state;
  return {...s,managerVersion:MANAGER_LANES_VERSION,managerWork:blankWork(firstWork),overlapParity:0,armourRequests:blankArmourRequests(),managerTactics:blankTactics(),battleAnalytics:blankBattleAnalytics()};
}
export function readManagerGame(value){
  try{
    const raw=typeof value==="string"?JSON.parse(value):value;
    // Phase 2 prototype only accepts its own current timing profile; never
    // silently convert a legacy route or discard a paid combat cursor.
    if(!validManagerShape(raw)||raw.timingProfile!==TIMING_PROFILE)return null;
    const s=readSave(raw);
    if(!s||!s.teamSecond||raw.battleAnalytics!==undefined&&!validBattleAnalytics(raw.battleAnalytics))return null;
    return {...s,combatSession:s.combatSession?.timelineVersion===GROUP_TIMELINE_VERSION?s.combatSession:fasterTeamSession(s.combatSession),managerVersion:MANAGER_LANES_VERSION,
      battleAnalytics:raw.battleAnalytics??blankBattleAnalytics(),...(raw.battleGroup?{groupAnalytics:structuredClone(raw.groupAnalytics)}:{}),...(raw.arenaOnly?{arenaOnly:true}:{managerWork:{...raw.managerWork},overlapParity:raw.overlapParity}),armourRequests:{...raw.armourRequests},managerTactics:structuredClone(raw.managerTactics)};
  }catch{return null;}
}
// Internal coordinator hook for Phase 3, never a player-facing action.
// Settle/claim first; switching discards only uncompleted partial cycle,
// not earned XP or materials. Real transition handling remains Phase 3.
export function assignManagerWork(s,id){
  requireManager(s);if(s.arenaOnly)throw new RangeError("Noncombat work was retired");
  if(!validWork(id))throw new RangeError("Invalid noncombat work");
  if(s.managerWork.activity===id)return s;
  return {...s,managerWork:{...blankWork(id),travelMs:rotationTravelMs(s.managerWork.activity,id)}};
}
// Historical manager migration and group fixtures.
export function enableBattleGroupManager(s){
 requireManager(s);return s.battleGroup?s:{...s,battleGroup:initialBattleGroup(),groupAnalytics:blankGroupAnalytics()};
}
export function newBattleGroupManager(now=Date.now(),firstWork="hunting"){return enableBattleGroupManager(newManagerGame(now,firstWork));}
// Existing manager saves keep paid gear, battle cursor, skill bonuses and
// accumulated attribute effort. No material conversion or additional work.
export function enableArenaOnly(s){
 requireManager(s);if(s.arenaOnly)return s;
 const {managerWork,overlapParity,...next}=enableBattleGroupManager(s);
 return {...next,arenaOnly:true,items:Object.fromEntries(Object.keys(s.items).map(id=>[id,0]))};
}
export function newArenaManager(now=Date.now()){return enableArenaOnly(newBattleGroupManager(now));}
function managerUpgradePreview(s){
 return s.battleGroup?previewGroupUpgrade(s.battleGroup,s.coins,s.skills.fighting.level):managerEquipmentPreview(s);
}
function automateEquipment(out){
 const s=out.state;if(!s.battleGroup)return automateManagerEquipment(out);
 // An old frozen bout remains unchanged; no legacy purchases after opt-in.
 const u=upgradeBattleGroup(s.battleGroup,s.coins,s.skills.fighting.level);
 return {...out,state:{...s,battleGroup:u.group,coins:u.coins},autoEquipment:{upgrades:u.upgrades,acquisitions:[],equipped:[],spent:u.spent,preview:u.pending}};
}
export function chooseManagerGroupClass(s,member,race,mainClass,classId,now=s.settledAtMs,random=Math.random){
 selectGroupClass(s.battleGroup,member,race,mainClass,classId);
 const old=now===s.settledAtMs?{state:s,reports:[],levelsGained:{}}:settleManagerLive(s,now,random);
 return automateEquipment({...old,state:{...old.state,battleGroup:selectGroupClass(old.state.battleGroup,member,race,mainClass,classId)}});
}
export function chooseManagerGroupStance(s,member,stance,now=s.settledAtMs,random=Math.random){
 selectGroupStance(s.battleGroup,member,stance);
 const old=now===s.settledAtMs?{state:s,reports:[],levelsGained:{}}:settleManagerLive(s,now,random);
 return {...old,state:{...old.state,battleGroup:selectGroupStance(old.state.battleGroup,member,stance)}};
}
function laneTime(before,after){
  const total=ATTRIBUTE_IDS.reduce((n,id)=>n+after.attributeEffort[id]-before.attributeEffort[id],0);
  if(!count(total)||total%100)throw new Error("Nonconserving lane effort");
  return total/100;
}
function pair(s,end,random,online){
  if(s.arenaOnly){
    const a=settleManagerLane(s,end,random,online),c=a.state,combatMs=laneTime(s,c);
    const next={...c,settledAtMs:online?c.settledAtMs:end,battleAnalytics:accumulateBattleAnalytics(s.battleAnalytics,a.report?.arena?.analytics??[]),groupAnalytics:accumulateGroupAnalytics(s.groupAnalytics,a.report?.arena?.groupAnalytics??[])};
    const reports=[a.report].filter(r=>r&&(r.completed||r.arena));
    return {state:next,reports,report:reports.at(-1),effort:{combatMs,workMs:0,overlap:0,combatTime:combatMs,workTime:0}};
  }
  return settleLegacyWorkPair(s,end,random,online);
}
export function settleManagerOffline(s,now=Date.now(),random=Math.random){
  requireManager(s);if(!count(now))throw new RangeError("Invalid clock");
  // Frozen inputs; both lanes independently pause at their existing XP cap.
  return pair(s,Math.max(s.settledAtMs,now),random,false);
}
export function enterManagerGame(s,now=Date.now(),random=Math.random){
  const out=settleManagerOffline(s,now,random);
  const active=activateExpertise(out.state),reserve=active.arenaOnly?{}:ingredientReserve(active);
  const claimed=automateSettledProgress({...out,state:active},reserve,automateEquipment);
  return {...claimed,state:active.arenaOnly?claimed.state:rotateManagerWork(claimed.state,claimed.mastery?.ready??[]),ingredientReserve:reserve};
}
export function settleManagerLive(s,now=Date.now(),random=Math.random){
  requireManager(s);if(!count(now))throw new RangeError("Invalid clock");
  if(now<s.settledAtMs||now-s.settledAtMs>LIVE_FIGHT_MAX_MS)return enterManagerGame(s,now,random);
  const reports=[],levelsGained={},tribute={},upgrades=[],acquisitions=[],equipped=[],tacticAdvances=[];let spent=0,teamworkLevelGained=0;
  let next=s;
  const apply=()=>{
    const active=activateExpertise(next);
    const out=automateSettledProgress({state:active},active.arenaOnly?{}:ingredientReserve(active),automateEquipment);
    next=active.arenaOnly?out.state:rotateManagerWork(out.state,out.mastery?.ready??[]);
    for(const [id,n] of Object.entries(out.levelsGained??{}))levelsGained[id]=(levelsGained[id]??0)+n;
    for(const [id,n] of Object.entries(out.mastery?.tribute??{}))tribute[id]=(tribute[id]??0)+n;
    teamworkLevelGained+=out.teamworkLevelGained??0;tacticAdvances.push(...(out.tacticAdvances??[]));
    spent+=out.autoEquipment?.spent??0;upgrades.push(...(out.autoEquipment?.upgrades??[]));
    acquisitions.push(...(out.autoEquipment?.acquisitions??[]));equipped.push(...(out.autoEquipment?.equipped??[]));
  };
  apply();
  for(let i=0;next.settledAtMs<now;i++){
    if(i>=64)throw new Error("Manager live boundary limit");
    const before=next.settledAtMs;
    const duration=teamBoutMs(next.combatSession,true,Boolean(next.battleGroup));
    const segment=Math.min(now-before,duration-((next.combatSession?.elapsedMs??0)%duration),
      next.arenaOnly?Infinity:(next.managerWork.travelMs||ACTIVITIES[next.managerWork.activity].durationMs-next.managerWork.progressMs),
      ACTIVITIES.fighting.durationMs-next.progressMs);
    const outcome=pair(next,before+segment,random,true);
    next=outcome.state;reports.push(...outcome.reports);apply();
    if(next.settledAtMs<=before)throw new Error("Manager clock failed to advance");
  }
  const ready=Object.keys(levelsGained);
  return {state:next,reports,report:reports.at(-1),levelsGained,teamworkLevelGained,tacticAdvances,
    ...(ready.length?{mastery:{ready,blocked:[],tribute}}:{}),
    ingredientReserve:next.arenaOnly?{}:ingredientReserve(next),
    autoEquipment:{upgrades,acquisitions,equipped,spent,preview:managerUpgradePreview(next)}};
}

// Public integration adapters must settle the old selection first and commit
// this single result. Never let the old single-lane mutation settle twice.
export function chooseManagerArmour(s,id,family,now=s.settledAtMs,random=Math.random){
  // Validate choice and register it only AFTER elapsed time is settled.
  requestArmourSet(s,id,family);
  const old=now===s.settledAtMs?{state:s,reports:[],levelsGained:{}}:settleManagerLive(s,now,random);
  const selected=requestArmourSet(old.state,id,family);
  const a=automateManagerEquipment({state:selected});
  const prior=old.autoEquipment??{};
  return {...old,state:a.state,autoEquipment:{...a.autoEquipment,
    upgrades:[...(prior.upgrades??[]),...a.autoEquipment.upgrades],
    acquisitions:[...(prior.acquisitions??[]),...a.autoEquipment.acquisitions],
    equipped:[...(prior.equipped??[]),...a.autoEquipment.equipped],
    spent:(prior.spent??0)+a.autoEquipment.spent}};
}
export function chooseManagerWeapon(s,id,loadout,now=s.settledAtMs,random=Math.random){
  selectManagerWeapon(s,id,loadout);
  const old=now===s.settledAtMs?{state:s,reports:[],levelsGained:{}}:settleManagerLive(s,now,random);
  const a=automateManagerEquipment({state:selectManagerWeapon(old.state,id,loadout)});
  const prior=old.autoEquipment??{};
  return {...old,state:a.state,autoEquipment:{...a.autoEquipment,
    upgrades:[...(prior.upgrades??[]),...a.autoEquipment.upgrades],
    acquisitions:[...(prior.acquisitions??[]),...a.autoEquipment.acquisitions],
    equipped:[...(prior.equipped??[]),...a.autoEquipment.equipped],
    spent:(prior.spent??0)+a.autoEquipment.spent}};
}

export function chooseManagerTactic(s,id,tactic,now=s.settledAtMs,random=Math.random){
  chooseTactic(s.managerTactics,id,tactic);
  const old=now===s.settledAtMs?{state:s,reports:[],levelsGained:{}}:settleManagerLive(s,now,random);
  const next={...old.state,managerTactics:chooseTactic(old.state.managerTactics,id,tactic)};
  const a=activateTactics(next.managerTactics);
  return {...old,state:{...next,managerTactics:a.tactics},tacticAdvances:[...(old.tacticAdvances??[]),...a.advances]};
}
