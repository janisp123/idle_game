// TACTIC-UI-001: separate per-fighter choice and practice.
// Provisional policy; use actual frozen completed-bout participation time.
import {BOUT_MS} from "./combat.mjs?v=gear-a3";
export const TACTIC_IDS=Object.freeze(["aggressive","balanced","defensive"]);
export const TACTIC_BALANCE=Object.freeze({maxLevel:50,boutsPerLevel:100,
  noviceActivation:.35,masterActivation:.90,aggressiveApproach:1.5,
  aggressiveFocus:4,aggressiveHealth:3,balancedFocus:2,balancedHealth:1.5});
const ids=["first","second"],count=n=>Number.isSafeInteger(n)&&n>=0;
export const validTactic=id=>TACTIC_IDS.includes(id);
export function tacticRequiredXP(level){
  if(!count(level)||level<1||level>TACTIC_BALANCE.maxLevel)throw new RangeError("Invalid tactic level");
  return level===TACTIC_BALANCE.maxLevel?0:BOUT_MS*TACTIC_BALANCE.boutsPerLevel*level;
}
export const tacticActivation=level=>{
  tacticRequiredXP(level);
  return TACTIC_BALANCE.noviceActivation+(TACTIC_BALANCE.masterActivation-TACTIC_BALANCE.noviceActivation)*(level-1)/(TACTIC_BALANCE.maxLevel-1);
};
const record=o=>o&&typeof o==="object"&&!Array.isArray(o);
const exact=(o,keys)=>record(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const validSkill=s=>Boolean(record(s)&&count(s.level)&&s.level>=1&&s.level<=TACTIC_BALANCE.maxLevel&&count(s.xp)&&s.xp<=tacticRequiredXP(s.level));
export function blankTactics(){
  return Object.fromEntries(ids.map(id=>[id,{selected:"balanced",skills:Object.fromEntries(TACTIC_IDS.map(t=>[t,{level:1,xp:0}]))}]));
}
export const validTactics=t=>Boolean(exact(t,ids)&&ids.every(id=>validTactic(t[id]?.selected)&&exact(t[id].skills,TACTIC_IDS)&&TACTIC_IDS.every(k=>validSkill(t[id].skills[k]))));
export const validTacticSnapshot=s=>s.tactic===undefined&&s.tacticLevel===undefined||
  validTactic(s.tactic)&&count(s.tacticLevel)&&s.tacticLevel>=1&&s.tacticLevel<=TACTIC_BALANCE.maxLevel;
export function chooseTactic(t,id,tactic){
  if(!validTactics(t)||!ids.includes(id)||!validTactic(tactic))throw new RangeError("Invalid tactic choice");
  return {...t,[id]:{...t[id],selected:tactic}};
}
export function tacticSnapshots(t,snapshots){
  if(!validTactics(t))throw new RangeError("Invalid tactics");
  return Object.fromEntries(ids.map(id=>[id,{...snapshots[id],tactic:t[id].selected,tacticLevel:t[id].skills[t[id].selected].level}]));
}
export function awardTacticPractice(t,snapshots,practice){
  if(!validTactics(t))throw new RangeError("Invalid tactics");
  return Object.fromEntries(ids.map(id=>{
    const old=t[id],choice=snapshots[id].tactic,ms=practice[id];
    if(!count(ms)||!validTacticSnapshot(snapshots[id]))throw new RangeError("Invalid frozen practice");
    if(choice===undefined||!ms)return [id,old];
    const skill=old.skills[choice],xp=Math.min(tacticRequiredXP(skill.level),skill.xp+Math.min(ms,tacticRequiredXP(skill.level)));
    return [id,{...old,skills:{...old.skills,[choice]:{...skill,xp}}}];
  }));
}
export function activateTactics(t){
  if(!validTactics(t))throw new RangeError("Invalid tactics");
  const advances=[];
  const tactics=Object.fromEntries(ids.map(id=>{
    const old=t[id],choice=old.selected,skill=old.skills[choice];
    if(skill.level===TACTIC_BALANCE.maxLevel||skill.xp!==tacticRequiredXP(skill.level))return [id,old];
    advances.push({fighterId:id,tactic:choice,level:skill.level+1});
    return [id,{...old,skills:{...old.skills,[choice]:{level:skill.level+1,xp:0}}}];
  }));
  return {tactics,advances};
}
