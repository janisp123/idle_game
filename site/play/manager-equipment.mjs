// MANAGER-UI-001: atomic full-family selection, real smith quotes.
// No changes to grade prices, damage, mastery, or existing legacy APIs.
import {ARMOUR_SLOTS,ARMOUR_TIERS} from "./armour.mjs?v=bal-002";
import {STARTER_ITEM,smithQuote} from "./smith.mjs?v=gear-a3";
import {TEAM_IDS,validTeam,chooseTeamWeapon,upgradeTeam} from "./team.mjs?v=team-001";
import {teamFromState,autoEquipmentPreview} from "./engine.mjs?v=npc-parity-001";

export const MANAGER_ARMOUR_FAMILIES=Object.freeze(ARMOUR_TIERS.filter(id=>id!=="none"));
const count=n=>Number.isSafeInteger(n)&&n>=0;
export const blankArmourRequests=()=>Object.fromEntries(TEAM_IDS.map(id=>[id,null]));
const familyValid=id=>MANAGER_ARMOUR_FAMILIES.includes(id);
const fighterValid=id=>TEAM_IDS.includes(id);
export function validArmourRequests(requests){
  return requests!==null&&typeof requests==="object"&&!Array.isArray(requests)&&
    Object.keys(requests).length===TEAM_IDS.length&&TEAM_IDS.every(id=>Object.hasOwn(requests,id)&&
      (requests[id]===null||familyValid(requests[id])));
}
export function equippedArmourFamily(g){
  const first=g.armour[ARMOUR_SLOTS[0].id];
  return ARMOUR_SLOTS.every(slot=>g.armour[slot.id]===first)?first:null;
}
function applyTeam(s,team){
  return {...s,...team.first,teamSecond:team.second};
}
function checked(s){
  const team=teamFromState(s);
  if(!validTeam(team)||!validArmourRequests(s.armourRequests)||!count(s.coins))
    throw new RangeError("Invalid manager equipment state");
  return team;
}
export function quoteArmourSet(s,id,family){
  const team=checked(s);
  if(!fighterValid(id)||!familyValid(family))throw new RangeError("Unknown armour set or gladiator");
  const g=team[id],missing=[];
  for(const slot of ARMOUR_SLOTS){
    const itemId=slot.id+":"+family;
    if(Object.hasOwn(g.equipment,itemId))continue;
    const quote=smithQuote({...s,...g},itemId,STARTER_ITEM);
    if(!quote.improves||!count(quote.cost)||quote.cost<=0)throw new Error("Invalid starter quote");
    missing.push({itemId,cost:quote.cost,levelReady:quote.levelReady});
  }
  const cost=missing.reduce((n,p)=>n+p.cost,0),levelReady=missing.every(p=>p.levelReady);
  if(!count(cost))throw new RangeError("Armour set cost overflow");
  return {id,family,missing,cost,levelReady,available:levelReady&&s.coins>=cost,
    equipped:equippedArmourFamily(g)===family,pending:s.armourRequests[id]===family};
}
export function requestArmourSet(s,id,family){
  const quote=quoteArmourSet(s,id,family);
  return {...s,armourRequests:{...s.armourRequests,[id]:quote.equipped?null:family}};
}
export function selectManagerWeapon(s,id,loadout){
  const team=checked(s);
  return applyTeam(s,chooseTeamWeapon(team,id,loadout));
}
// Fully owned set changes cost nothing. Paid acquisitions are atomic.
// Service first/second deterministically; do not let routine upgrades
// consume money reserved for an outstanding selected whole kit.
export function acquireRequestedArmour(s){
  checked(s);
  let next=s;const acquisitions=[],equipped=[];
  for(const id of TEAM_IDS){
    const family=next.armourRequests[id];
    if(family===null)continue;
    const q=quoteArmourSet(next,id,family);
    if(!q.available)continue;
    const team=teamFromState(next),g=team[id],equipment={...g.equipment};
    for(const part of q.missing){
      equipment[part.itemId]={...STARTER_ITEM};
      acquisitions.push({fighterId:id,id:part.itemId,from:null,to:{...STARTER_ITEM},cost:part.cost});
    }
    const armour=Object.fromEntries(ARMOUR_SLOTS.map(slot=>[slot.id,family]));
    next=applyTeam({...next,coins:next.coins-q.cost,
      armourRequests:{...next.armourRequests,[id]:null}},
      {...team,[id]:{...g,armour,equipment}});
    equipped.push({fighterId:id,family,cost:q.cost});
  }
  return {state:next,acquisitions,equipped,spent:s.coins-next.coins};
}
export function managerEquipmentPreview(s){
  checked(s);
  const pending=TEAM_IDS.flatMap(id=>s.armourRequests[id]===null?[]:
    [quoteArmourSet(s,id,s.armourRequests[id])]);
  return {...autoEquipmentPreview(s),pending,holdingForSet:pending.length>0};
}
export function automateManagerEquipment(outcome){
  const original=outcome.state;
  const a=acquireRequestedArmour(original);
  let s=a.state,upgrades=[];
  if(!TEAM_IDS.some(id=>s.armourRequests[id]!==null)){
    const u=upgradeTeam(teamFromState(s),s.coins,s.skills.fighting.level);
    s=applyTeam({...s,coins:u.coins},u.team);
    upgrades=u.upgrades.map(x=>({...x,fighterId:x.id,id:x.itemId}));
  }
  return {...outcome,state:s,autoEquipment:{upgrades,acquisitions:a.acquisitions,
    equipped:a.equipped,spent:original.coins-s.coins,preview:managerEquipmentPreview(s)}};
}
