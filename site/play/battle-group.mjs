// Pure seven-slot foundation. Not yet wired to public manager saves.
// Retain sparse per-class progression; only the frozen used class gains practice.
import {GROUP_CLASSES,DEFAULT_GROUP_CLASSES,isGroupClass,resolveGroupClass} from "./battle-group-classes.mjs?v=group-001";
import {ARMOUR_SLOTS,armourStats} from "./armour.mjs?v=bal-002";
import {blankExpertise,validExpertise,awardExpertise} from "./expertise.mjs?v=alpha-gear-a3";
import {STARTER_ITEM,isEquipmentItem,trainingKit,trainingEffects,smithQuote,nextEquipmentUpgrade,itemPower,ITEM_GRADES,ITEM_QUALITIES} from "./smith.mjs?v=gear-a3";
import {TACTIC_IDS,validTactic,tacticRequiredXP} from "./manager-tactics.mjs?v=manager-tactics-001";
import {blankCharacterEffort,validCharacterEffort,awardCharacterEffort,characterAttributes} from "./character-attributes.mjs";
export const GROUP_SIZE=7;
export const GROUP_IDS=Object.freeze(Array.from({length:GROUP_SIZE},(_,i)=>"member"+(i+1)));
const count=n=>Number.isSafeInteger(n)&&n>=0;
const record=o=>o!==null&&typeof o==="object"&&!Array.isArray(o);
const exact=(o,keys)=>record(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const levelValid=s=>record(s)&&Number.isInteger(s.level)&&s.level>=1&&s.level<=50&&count(s.xp)&&s.xp<=tacticRequiredXP(s.level);
const skill=()=>({level:1,xp:0});
export const RECRUIT_LEVELS=Object.freeze([1,5,10,15,20,25,30]);
export const SPECIALIZATION_LEVEL=20;
export const activeGroupIds=g=>GROUP_IDS.filter(id=>g[id].recruitment?.active!==false);
export const recruitmentEnabled=g=>g[GROUP_IDS[0]].recruitment!==undefined;
export const specializationUnlocked=m=>!m.recruitment||m.recruitment.level>=SPECIALIZATION_LEVEL;
export function basicClass(race,profession){return Object.values(GROUP_CLASSES).find(c=>c.race===race&&c.mainClass===profession);}
export function initialRecruitGroup(){const g=initialBattleGroup();return Object.fromEntries(GROUP_IDS.map((id,i)=>{const m=g[id],c=GROUP_CLASSES[m.selected],base=basicClass(c.race,c.mainClass).id;return [id,{...m,selected:base,classes:{[base]:freshProgress(base)},recruitment:{active:i===0,...skill()}}];}));}
export function syncRecruitment(g,fightingLevel){if(!recruitmentEnabled(g))return g;return Object.fromEntries(GROUP_IDS.map((id,i)=>{const m=g[id];return [id,!m.recruitment.active&&fightingLevel>=RECRUIT_LEVELS[i]?{...m,recruitment:{...m.recruitment,active:true}}:m];}));}
export function maxRecruitment(g){if(!recruitmentEnabled(g))return g;return Object.fromEntries(GROUP_IDS.map(id=>[id,{...g[id],recruitment:{active:true,level:50,xp:0}}]));}
const armourIds=c=>ARMOUR_SLOTS.map(s=>s.id+":"+c.armour);
function freshProgress(id){
 const c=GROUP_CLASSES[id];
 return {equipment:{[c.loadout]:{...STARTER_ITEM}},expertise:blankExpertise(),expertiseActive:blankExpertise(),mastery:skill(),attributeEffort:blankCharacterEffort(),attributeEffortActive:blankCharacterEffort()};
}
function validProgress(p,id){
 if(!record(p)||!isGroupClass(id)||!record(p.equipment)||!validExpertise(p.expertise)||!validExpertise(p.expertiseActive)||!levelValid(p.mastery))return false;
 if((p.attributeEffort!==undefined||p.attributeEffortActive!==undefined)&&(!validCharacterEffort(p.attributeEffort)||!validCharacterEffort(p.attributeEffortActive)||Object.keys(p.attributeEffort).some(k=>p.attributeEffortActive[k]>p.attributeEffort[k])))return false;
 const c=GROUP_CLASSES[id],keys=[c.loadout,...armourIds(c)],owned=Object.keys(p.equipment);
 return Object.hasOwn(p.equipment,c.loadout)&&owned.every(k=>keys.includes(k)&&isEquipmentItem(p.equipment[k]))&&
 Object.keys(p.expertise).every(k=>p.expertiseActive[k]<=p.expertise[k]&&([c.loadout,c.armour,"none"].includes(k)||p.expertise[k]===0));
}
function validMember(m){
 return record(m)&&(m.recruitment===undefined||typeof m.recruitment.active==="boolean"&&levelValid(m.recruitment)&&(!m.recruitment.active?m.recruitment.level===1&&m.recruitment.xp===0:true))&&isGroupClass(m.selected)&&validTactic(m.stance)&&exact(m.stances,TACTIC_IDS)&&TACTIC_IDS.every(t=>levelValid(m.stances[t]))&&
 record(m.classes)&&Object.hasOwn(m.classes,m.selected)&&Object.entries(m.classes).every(([id,p])=>validProgress(p,id));
}
export const validBattleGroup=g=>exact(g,GROUP_IDS)&&GROUP_IDS.every(id=>validMember(g[id]))&&GROUP_IDS.every(id=>Boolean(g[id].recruitment)===Boolean(g[GROUP_IDS[0]].recruitment))&&(!recruitmentEnabled(g)||activeGroupIds(g).length>=1&&activeGroupIds(g).every((id,i)=>id===GROUP_IDS[i]));
function requireGroup(g){if(!validBattleGroup(g))throw new RangeError("Invalid Battle Group");}
// Legacy records contain exact class-specific weapon practice in quarter-ms.
// Recover it once; retain the old account ledger for historical combat only.
// Never duplicate general account training into every newly selected class.
function migrateProgress(p,id){
 if(p.attributeEffort!==undefined)return p;
 const c=GROUP_CLASSES[id];
 return {...p,attributeEffort:awardCharacterEffort(blankCharacterEffort(),id,Math.floor(p.expertise[c.loadout]/4)),attributeEffortActive:awardCharacterEffort(blankCharacterEffort(),id,Math.floor(p.expertiseActive[c.loadout]/4))};
}
export function migrateGroupAttributes(group){
 requireGroup(group);
 if(GROUP_IDS.every(id=>Object.values(group[id].classes).every(p=>p.attributeEffort!==undefined)))return group;
 return Object.fromEntries(GROUP_IDS.map(id=>{const m=group[id];return [id,{...m,classes:Object.fromEntries(Object.entries(m.classes).map(([classId,p])=>[classId,migrateProgress(p,classId)]))}];}));
}
function requireMember(id){if(!GROUP_IDS.includes(id))throw new RangeError("Unknown member");}
export function initialBattleGroup(){
 return Object.fromEntries(GROUP_IDS.map((id,i)=>{const selected=DEFAULT_GROUP_CLASSES[i];return [id,{selected,stance:"balanced",stances:Object.fromEntries(TACTIC_IDS.map(t=>[t,skill()])),classes:{[selected]:freshProgress(selected)}}];}));
}
export function selectGroupClass(group,member,race,mainClass,classId){
 requireGroup(group);requireMember(member);resolveGroupClass(race,mainClass,classId);
 const m=group[member];if(m.recruitment?.active===false||!specializationUnlocked(m)&&basicClass(race,mainClass).id!==classId)throw new RangeError("Character or specialization locked");
 return {...group,[member]:{...m,selected:classId,classes:{...m.classes,[classId]:m.classes[classId]??freshProgress(classId)}}};
}
export function selectGroupStance(group,member,stance){
 requireGroup(group);requireMember(member);if(group[member].recruitment?.active===false||!validTactic(stance))throw new RangeError("Invalid stance");
 return {...group,[member]:{...group[member],stance}};
}
function equippedArmour(c,p){
 return Object.fromEntries(ARMOUR_SLOTS.map(({id})=>[id,Object.hasOwn(p.equipment,id+":"+c.armour)?c.armour:"none"]));
}
export function groupSnapshots(group,shared,rules=3){
 requireGroup(group);
 if(!record(shared)||!["str","dex","end","skill"].every(k=>Number.isFinite(shared[k])&&shared[k]>=0&&shared[k]<=1e6)||!count(shared.difficulty)||shared.difficulty>=ITEM_GRADES.length)throw new RangeError("Invalid shared combat inputs");
 return Object.fromEntries(activeGroupIds(group).map((id,i)=>{
  const m=group[id],c=GROUP_CLASSES[m.selected],p=m.classes[m.selected],armour=equippedArmour(c,p),kit=trainingKit(armour,c.loadout,p.equipment),effects=trainingEffects(kit,c.loadout,p.expertiseActive);
  const attrs=[4,5,6,7,8,9,10].includes(rules)?characterAttributes(c.id,migrateProgress(p,c.id).attributeEffortActive):null;
  return [id,{name:"Member "+(i+1),...(!specializationUnlocked(m)?{novice:true}:{}),classId:c.id,race:c.race,role:c.role,classLevel:p.mastery.level,tactic:m.stance,tacticLevel:m.stances[m.stance].level,
   difficulty:shared.difficulty,...(attrs?{attributes:attrs,str:attrs.STR,dex:attrs.DEX,end:attrs.CON,skill:p.mastery.level}:{str:shared.str,dex:shared.dex,end:shared.end,skill:shared.skill}),loadout:c.loadout,trainingKit:kit,
   gear:{...armourStats(armour,c.loadout),gearDefense:effects.gearDefense},gearAttack:effects.gearAttack,condition:effects.condition}];
 }));
}
function awardSkill(s,ms){const limit=tacticRequiredXP(s.level);return {...s,xp:s.xp+Math.min(ms,limit-s.xp)};}
function advanceSkill(s){return s.level<50&&s.xp===tacticRequiredXP(s.level)?{...s,level:s.level+1,xp:0}:s;}
export function awardGroupPractice(group,snapshots,productiveMs){
 requireGroup(group);if(!snapshots||!Object.keys(snapshots).length||!Object.keys(snapshots).every((id,i)=>id===GROUP_IDS[i])||!exact(productiveMs,GROUP_IDS))throw new RangeError("Invalid frozen practice");
 return Object.fromEntries(GROUP_IDS.map(id=>{
  const m=group[id],s=snapshots[id],ms=productiveMs[id];if(!s){if(ms!==0)throw new RangeError("Locked member practice");return [id,m];}const c=GROUP_CLASSES[s?.classId],p=m.classes[s?.classId];
  if(!c||!p||!count(ms)||!validTactic(s.tactic)||s.loadout!==c.loadout||!record(s.trainingKit?.armour)||!ARMOUR_SLOTS.every(({id})=>["none",c.armour].includes(s.trainingKit.armour[id])))throw new RangeError("Invalid frozen class");
  if(!ms)return [id,m];
  const trained=migrateProgress(p,c.id);
  return [id,{...m,...(m.recruitment?{recruitment:awardSkill(m.recruitment,ms)}:{}),stances:{...m.stances,[s.tactic]:awardSkill(m.stances[s.tactic],ms)},classes:{...m.classes,[c.id]:{...trained,mastery:awardSkill(p.mastery,ms),expertise:awardExpertise(p.expertise,c.loadout,s.trainingKit.armour,ms),attributeEffort:awardCharacterEffort(trained.attributeEffort,c.id,ms)}}}];
 }));
}
// Activate only the selected class and stance, at existing Master/login boundary.
export function activateGroupPractice(group){
 requireGroup(group);
 return Object.fromEntries(GROUP_IDS.map(id=>{
  const m=group[id];if(m.recruitment?.active===false)return [id,m];const p=migrateProgress(m.classes[m.selected],m.selected);
  return [id,{...m,...(m.recruitment?{recruitment:advanceSkill(m.recruitment)}:{}),stances:{...m.stances,[m.stance]:advanceSkill(m.stances[m.stance])},classes:{...m.classes,[m.selected]:{...p,mastery:advanceSkill(p.mastery),expertiseActive:{...p.expertise},attributeEffortActive:{...p.attributeEffort}}}}];
 }));
}
// New class receives only its starter weapon; armour is automatically bought
// at the real smith price. No player-managed kit selection and no inactive buys.
export function previewGroupUpgrade(group,coins,fightingLevel){
 requireGroup(group);if(!count(coins)||!count(fightingLevel)||fightingLevel<1)throw new RangeError("Invalid group treasury");
 const candidates=activeGroupIds(group).flatMap((id,i)=>{
  const m=group[id],c=GROUP_CLASSES[m.selected],p=m.classes[m.selected];
  return [c.loadout,...armourIds(c)].flatMap((itemId,j)=>{
   const current=p.equipment[itemId]??null,target=nextEquipmentUpgrade(current);
   if(!target)return [];
   const quote=smithQuote({equipment:p.equipment,coins,skills:{fighting:{level:Math.min(fightingLevel,p.mastery.level)}}},itemId,target);
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
