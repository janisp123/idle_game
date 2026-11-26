// TEAM-001 foundation: independent equipment/effort per gladiator.
// Not connected to the playable save or arena yet.
import { ARMOUR_SLOTS, ARMOUR_TIERS, initialArmour, armourStats, armourOption } from "./armour.mjs?v=bal-002";
import { COMBAT_LOADOUTS, validCombatLoadout } from "./combat-skills.mjs?v=gear-a3";
import { blankExpertise, validExpertise, awardExpertise } from "./expertise.mjs?v=alpha-gear-a3";
import { STARTER_ITEM, isEquipmentItem, trainingKit, validTrainingKit, trainingEffects,
  smithQuote, nextEquipmentUpgrade, itemPower, ITEM_GRADES, ITEM_QUALITIES } from "./smith.mjs?v=gear-a3";

export const TEAM_IDS=Object.freeze(["first","second"]);
const equipmentIds=new Set([...Object.keys(COMBAT_LOADOUTS),...ARMOUR_SLOTS.flatMap(({id})=>
  ARMOUR_TIERS.filter(f=>f!=="none").map(f=>id+":"+f))]);
const count=n=>Number.isSafeInteger(n)&&n>=0;
const record=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
export function initialGladiator(combatLoadout="greatsword"){
  if(!validCombatLoadout(combatLoadout))throw new RangeError("Unknown weapon");
  return {combatLoadout,armour:initialArmour(),equipment:Object.fromEntries(
    Object.keys(COMBAT_LOADOUTS).map(id=>[id,{...STARTER_ITEM}])),
    expertise:blankExpertise(),expertiseActive:blankExpertise()};
}
export function initialTeam(){
  // Both freely changeable. Default styles are provisional, not class locks.
  return {first:initialGladiator("greatsword"),second:initialGladiator("bow")};
}
export function validGladiator(g){
  return record(g)&&validCombatLoadout(g.combatLoadout)&&record(g.armour)&&
    Object.keys(g.armour).length===ARMOUR_SLOTS.length&&
    ARMOUR_SLOTS.every(({id})=>Object.hasOwn(g.armour,id)&&Boolean(armourOption(id,g.armour[id])))&&
    record(g.equipment)&&Object.entries(g.equipment).every(([id,item])=>equipmentIds.has(id)&&isEquipmentItem(item))&&
    Object.keys(COMBAT_LOADOUTS).every(id=>Object.hasOwn(g.equipment,id))&&
    ARMOUR_SLOTS.every(({id})=>g.armour[id]==="none"||Object.hasOwn(g.equipment,id+":"+g.armour[id]))&&
    validExpertise(g.expertise)&&validExpertise(g.expertiseActive)&&
    Object.keys(g.expertise).every(id=>g.expertiseActive[id]<=g.expertise[id]);
}
export function validTeam(team){
  return record(team)&&Object.keys(team).length===2&&TEAM_IDS.every(id=>Object.hasOwn(team,id)&&validGladiator(team[id]));
}
function requireTeam(team){if(!validTeam(team))throw new RangeError("Invalid team");}
function requireId(id){if(!TEAM_IDS.includes(id))throw new RangeError("Unknown gladiator");}
export function chooseTeamWeapon(team,id,loadout){
  requireTeam(team);requireId(id);
  if(!validCombatLoadout(loadout))throw new RangeError("Unknown weapon");
  return {...team,[id]:{...team[id],combatLoadout:loadout}};
}
export function chooseTeamArmour(team,id,slot,family){
  requireTeam(team);requireId(id);
  if(!armourOption(slot,family)||family!=="none"&&!Object.hasOwn(team[id].equipment,slot+":"+family))
    throw new RangeError("Armour is not owned");
  return {...team,[id]:{...team[id],armour:{...team[id].armour,[slot]:family}}};
}
// shared derives once from existing desiredArenaPlayer; explicitly copy only
// common inputs, never one gladiator's gear or expertise into the other.
export function teamSnapshots(team,shared){
  requireTeam(team);
  if(!record(shared)||!["str","dex","end","skill"].every(k=>Number.isFinite(shared[k])&&shared[k]>=0)||
    !count(shared.difficulty)||shared.difficulty>=ITEM_GRADES.length)throw new RangeError("Invalid shared combat inputs");
  return Object.fromEntries(TEAM_IDS.map((id,i)=>{
    const g=team[id],kit=trainingKit(g.armour,g.combatLoadout,g.equipment),effects=trainingEffects(kit,g.combatLoadout,g.expertiseActive);
    return [id,{name:"Gladiator "+(i+1),difficulty:shared.difficulty,str:shared.str,dex:shared.dex,end:shared.end,skill:shared.skill,
      loadout:g.combatLoadout,trainingKit:kit,gear:{...armourStats(g.armour,g.combatLoadout),gearDefense:effects.gearDefense},
      gearAttack:effects.gearAttack,condition:effects.condition}];
  }));
}
// Credit the actual frozen loadouts, not next-bout selections. Per-fighter
// productive time must come from the future settled team outcome.
export function awardTeamPractice(team,snapshots,productiveMs){
  requireTeam(team);
  if(!record(snapshots)||!record(productiveMs))throw new RangeError("Invalid team practice");
  return Object.fromEntries(TEAM_IDS.map(id=>{
    const g=team[id],s=snapshots[id],ms=productiveMs[id];
    if(!s||!validCombatLoadout(s.loadout)||!validTrainingKit(s.trainingKit,s.loadout)||!count(ms))
      throw new RangeError("Invalid frozen practice");
    return [id,{...g,expertise:awardExpertise(g.expertise,s.loadout,s.trainingKit.armour,ms)}];
  }));
}
export function activateTeamPractice(team){
  requireTeam(team);
  return Object.fromEntries(TEAM_IDS.map(id=>[id,{...team[id],expertiseActive:{...team[id].expertise}}]));
}
// Shared treasury; reuse exact smith quote for each gladiator. No spending
// on inactive owned items. Initial armour purchase policy is a later batch.
export const MAX_TEAM_UPGRADES=2*(1+ARMOUR_SLOTS.length)*(ITEM_GRADES.length*ITEM_QUALITIES.length-1);
export function previewTeamUpgrade(team,coins,fightingLevel){
  requireTeam(team);
  if(!count(coins)||!count(fightingLevel)||fightingLevel<1)throw new RangeError("Invalid team treasury");
  const candidates=TEAM_IDS.flatMap((id,index)=>{
    const g=team[id];
    const items=[g.combatLoadout,...ARMOUR_SLOTS.filter(s=>g.armour[s.id]!=="none").map(s=>s.id+":"+g.armour[s.id])];
    return items.flatMap((itemId,slot)=>{
      const current=g.equipment[itemId],target=nextEquipmentUpgrade(current);
      if(!target)return [];
      const quote=smithQuote({equipment:g.equipment,coins,skills:{fighting:{level:fightingLevel}}},itemId,target);
      if(!quote.improves||!count(quote.cost)||!quote.cost)throw new Error("Invalid team quote");
      return [{id,itemId,current:{...current},target,rank:itemPower(current),order:index*5+slot,quote}];
    });
  }).sort((a,b)=>a.rank-b.rank||a.order-b.order);
  return candidates.find(c=>c.quote.levelReady)??candidates[0]??null;
}
export function upgradeTeam(team,coins,fightingLevel){
  requireTeam(team);
  let current=team,balance=coins;const upgrades=[];
  for(let i=0;i<MAX_TEAM_UPGRADES;i++){
    const next=previewTeamUpgrade(current,balance,fightingLevel);
    if(!next?.quote.available)break;
    const {id,itemId,target,quote}=next,g=current[id];
    current={...current,[id]:{...g,equipment:{...g.equipment,[itemId]:{...target}}}};
    balance-=quote.cost;
    upgrades.push({id,itemId,from:next.current,to:{...target},cost:quote.cost});
  }
  const next=previewTeamUpgrade(current,balance,fightingLevel);
  if(next?.quote.available)throw new Error("Team upgrade bound exceeded");
  return {team:current,coins:balance,spent:coins-balance,upgrades,next};
}
