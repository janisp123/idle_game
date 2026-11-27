// Pure seven-slot foundation. Not yet wired to public manager saves.
// Retain sparse per-class progression; only the frozen used class gains practice.
import {GROUP_CLASSES,DEFAULT_GROUP_CLASSES,isGroupClass,resolveGroupClass} from "./battle-group-classes.mjs?v=group-001";
import {ARMOUR_SLOTS,armourStats} from "./armour.mjs?v=bal-002";
import {blankExpertise,validExpertise,awardExpertise} from "./expertise.mjs?v=alpha-gear-a3";
import {STARTER_ITEM,isEquipmentItem,trainingKit,trainingEffects,smithQuote,nextEquipmentUpgrade,itemPower,ITEM_GRADES,ITEM_QUALITIES} from "./smith.mjs?v=gear-a3";
import {TACTIC_IDS,validTactic,tacticRequiredXP} from "./manager-tactics.mjs?v=manager-tactics-001";
export const GROUP_SIZE=7;
export const GROUP_IDS=Object.freeze(Array.from({length:GROUP_SIZE},(_,i)=>"member"+(i+1)));
const count=n=>Number.isSafeInteger(n)&&n>=0;
const record=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
const exact=(o,keys)=>record(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const levelValid=s=>record(s)&&Number.isInteger(s.level)&&s.level>=1&&s.level<=50&&count(s.xp)&&s.xp<=tacticRequiredXP(s.level);
const skill=()=>({level:1,xp:0});
const armourIds=c=>ARMOUR_SLOTS.map(s=>s.id+":"+c.armour);
function freshProgress(id){
 const c=GROUP_CLASSES[id];
 return {equipment:{[c.loadout]:{...STARTER_ITEM}},expertise:blankExpertise(),expertiseActive:blankExpertise(),mastery:skill()};
}
function validProgress(p,id){
 if(!record(p)||!isGroupClass(id)||!record(p.equipment)||!validExpertise(p.expertise)||!validExpertise(p.expertiseActive)||!levelValid(p.mastery))return false;
 const c=GROUP_CLASSES[id],keys=[c.loadout,...armourIds(c)],owned=Object.keys(p.equipment);
 return Object.hasOwn(p.equipment,c.loadout)&&owned.every(k=>keys.includes(k)&&isEquipmentItem(p.equipment[k]))&&
 Object.keys(p.expertise).every(k=>p.expertiseActive[k]<=p.expertise[k]&&([c.loadout,c.armour,"none"].includes(k)||p.expertise[k]===0));
}
function validMember(m){
 return record(m)&&isGroupClass(m.selected)&&validTactic(m.stance)&&exact(m.stances,TACTIC_IDS)&&TACTIC_IDS.every(t=>levelValid(m.stances[t]))&&
 record(m.classes)&&Object.hasOwn(m.classes,m.selected)&&Object.entries(m.classes).every(([id,p])=>validProgress(p,id));
}
export const validBattleGroup=g=>exact(g,GROUP_IDS)&&GROUP_IDS.every(id=>validMember(g[id]));
function requireGroup(g){if(!validBattleGroup(g))throw new RangeError("Invalid Battle Group");}
function requireMember(id){if(!GROUP_IDS.includes(id))throw new RangeError("Unknown member");}
export function initialBattleGroup(){
 return Object.fromEntries(GROUP_IDS.map((id,i)=>{const selected=DEFAULT_GROUP_CLASSES[i];return [id,{selected,stance:"balanced",stances:Object.fromEntries(TACTIC_IDS.map(t=>[t,skill()])),classes:{[selected]:freshProgress(selected)}}];}));
}
export function selectGroupClass(group,member,race,mainClass,classId){
 requireGroup(group);requireMember(member);resolveGroupClass(race,mainClass,classId);
 const m=group[member];
 return {...group,[member]:{...m,selected:classId,classes:{...m.classes,[classId]:m.classes[classId]??freshProgress(classId)}}};
}
export function selectGroupStance(group,member,stance){
 requireGroup(group);requireMember(member);if(!validTactic(stance))throw new RangeError("Invalid stance");
 return {...group,[member]:{...group[member],stance}};
}
function equippedArmour(c,p){
 return Object.fromEntries(ARMOUR_SLOTS.map(({id})=>[id,Object.hasOwn(p.equipment,id+":"+c.armour)?c.armour:"none"]));
}
export function groupSnapshots(group,shared){
 requireGroup(group);
 if(!record(shared)||!["str","dex","end","skill"].every(k=>Number.isFinite(shared[k])&&shared[k]>=0&&shared[k]<=1e6)||!count(shared.difficulty)||shared.difficulty>=ITEM_GRADES.length)throw new RangeError("Invalid shared combat inputs");
 return Object.fromEntries(GROUP_IDS.map((id,i)=>{
  const m=group[id],c=GROUP_CLASSES[m.selected],p=m.classes[m.selected],armour=equippedArmour(c,p),kit=trainingKit(armour,c.loadout,p.equipment),effects=trainingEffects(kit,c.loadout,p.expertiseActive);
  return [id,{name:"Member "+(i+1),classId:c.id,race:c.race,role:c.role,classLevel:p.mastery.level,tactic:m.stance,tacticLevel:m.stances[m.stance].level,
   difficulty:shared.difficulty,str:shared.str,dex:shared.dex,end:shared.end,skill:shared.skill,loadout:c.loadout,trainingKit:kit,
   gear:{...armourStats(armour,c.loadout),gearDefense:effects.gearDefense},gearAttack:effects.gearAttack,condition:effects.condition}];
 }));
}
function awardSkill(s,ms){const limit=tacticRequiredXP(s.level);return {...s,xp:s.xp+Math.min(ms,limit-s.xp)};}
function advanceSkill(s){return s.level<50&&s.xp===tacticRequiredXP(s.level)?{level:s.level+1,xp:0}:s;}
export function awardGroupPractice(group,snapshots,productiveMs){
 requireGroup(group);if(!exact(snapshots,GROUP_IDS)||!exact(productiveMs,GROUP_IDS))throw new RangeError("Invalid frozen practice");
 return Object.fromEntries(GROUP_IDS.map(id=>{
  const m=group[id],s=snapshots[id],ms=productiveMs[id],c=GROUP_CLASSES[s?.classId],p=m.classes[s?.classId];
  if(!c||!p||!count(ms)||!validTactic(s.tactic)||s.loadout!==c.loadout||!record(s.trainingKit?.armour)||!ARMOUR_SLOTS.every(({id})=>["none",c.armour].includes(s.trainingKit.armour[id])))throw new RangeError("Invalid frozen class");
  if(!ms)return [id,m];
  return [id,{...m,stances:{...m.stances,[s.tactic]:awardSkill(m.stances[s.tactic],ms)},classes:{...m.classes,[c.id]:{...p,mastery:awardSkill(p.mastery,ms),expertise:awardExpertise(p.expertise,c.loadout,s.trainingKit.armour,ms)}}}];
 }));
}
// Activate only the selected class and stance, at existing Master/login boundary.
export function activateGroupPractice(group){
 requireGroup(group);
 return Object.fromEntries(GROUP_IDS.map(id=>{
  const m=group[id],p=m.classes[m.selected];
  return [id,{...m,stances:{...m.stances,[m.stance]:advanceSkill(m.stances[m.stance])},classes:{...m.classes,[m.selected]:{...p,mastery:advanceSkill(p.mastery),expertiseActive:{...p.expertise}}}}];
 }));
}
// New class receives only its starter weapon; armour is automatically bought
// at the real smith price. No player-managed kit selection and no inactive buys.
export function previewGroupUpgrade(group,coins,fightingLevel){
 requireGroup(group);if(!count(coins)||!count(fightingLevel)||fightingLevel<1)throw new RangeError("Invalid group treasury");
 const candidates=GROUP_IDS.flatMap((id,i)=>{
  const m=group[id],c=GROUP_CLASSES[m.selected],p=m.classes[m.selected];
  return [c.loadout,...armourIds(c)].flatMap((itemId,j)=>{
   const current=p.equipment[itemId]??null,target=nextEquipmentUpgrade(current);
   if(!target)return [];
   const quote=smithQuote({equipment:p.equipment,coins,skills:{fighting:{level:fightingLevel}}},itemId,target);
   if(!quote.improves||!count(quote.cost)||!quote.cost)throw new Error("Invalid group smith quote");
   return [{member:id,classId:c.id,itemId,from:current,to:target,rank:current?itemPower(current):-1,order:i*5+j,quote}];
  });
 }).sort((a,b)=>a.rank-b.rank||a.order-b.order);
 return candidates.find(c=>c.quote.levelReady)??candidates[0]??null;
}
export const MAX_GROUP_UPGRADES=GROUP_SIZE*(1+ARMOUR_SLOTS.length)*ITEM_GRADES.length*ITEM_QUALITIES.length;
export function upgradeBattleGroup(group,coins,fightingLevel){
 let next=group,balance=coins;const upgrades=[];
 for(let i=0;i<MAX_GROUP_UPGRADES;i++){
  const choice=previewGroupUpgrade(next,balance,fightingLevel);
  if(!choice?.quote.available)break;
  const {member,classId,itemId,from,to,quote}=choice,m=next[member],p=m.classes[classId];
  next={...next,[member]:{...m,classes:{...m.classes,[classId]:{...p,equipment:{...p.equipment,[itemId]:{...to}}}}}};
  balance-=quote.cost;upgrades.push({member,classId,itemId,from,to,cost:quote.cost});
 }
 const pending=previewGroupUpgrade(next,balance,fightingLevel);
 if(pending?.quote.available)throw new Error("Group upgrade bound exceeded");
 return {group:next,coins:balance,spent:coins-balance,upgrades,pending};
}
