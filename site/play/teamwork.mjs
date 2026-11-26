// TEAM-002 provisional tuning, independent from gear and base attributes.
// Teamwork is a shared skill of the active fixed roster, not transferable
// weapon/armour mastery. Only actual settled team bouts earn XP.
export const TEAMWORK_BALANCE=Object.freeze({maxLevel:50,xpPerLevel:100,xpPerBout:1,
  noviceCoordination:.15,masterCoordination:.85});
const count=n=>Number.isSafeInteger(n)&&n>=0;
export function teamworkRequiredXP(level){
  if(!count(level)||level<1||level>TEAMWORK_BALANCE.maxLevel)throw new RangeError("Invalid Teamwork level");
  return level===TEAMWORK_BALANCE.maxLevel?0:level*TEAMWORK_BALANCE.xpPerLevel;
}
export function initialTeamwork(){return {level:1,xp:0};}
export function validTeamwork(t){
  return Boolean(t&&count(t.level)&&t.level>=1&&t.level<=TEAMWORK_BALANCE.maxLevel&&count(t.xp)&&t.xp<=teamworkRequiredXP(t.level));
}
export function awardTeamwork(t,bouts){
  if(!validTeamwork(t)||!count(bouts))throw new RangeError("Invalid Teamwork award");
  return {...t,xp:Math.min(teamworkRequiredXP(t.level),t.xp+Math.min(bouts,teamworkRequiredXP(t.level))*TEAMWORK_BALANCE.xpPerBout)};
}
export function activateTeamworkOnLogin(t){
  if(!validTeamwork(t))throw new RangeError("Invalid Teamwork");
  return t.level<TEAMWORK_BALANCE.maxLevel&&t.xp===teamworkRequiredXP(t.level)?{level:t.level+1,xp:0}:{...t};
}
export function coordinationChance(level){
  teamworkRequiredXP(level);
  const b=TEAMWORK_BALANCE;
  return b.noviceCoordination+(b.masterCoordination-b.noviceCoordination)*(level-1)/(b.maxLevel-1);
}
