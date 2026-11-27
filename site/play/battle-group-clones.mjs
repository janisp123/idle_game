// Equal-progression synthetic seven-character opponents. Frozen, independent
// choices. Candidate uses each member's selected investment (not inactive kits).
import {GROUP_CLASSES,GROUP_CLASS_IDS,GROUP_ROLES} from "./battle-group-classes.mjs?v=group-001";
import {GROUP_IDS,initialBattleGroup,validBattleGroup,selectGroupClass,selectGroupStance,groupSnapshots} from "./battle-group.mjs?v=group-001";
import {ARMOUR_SLOTS} from "./armour.mjs?v=bal-002";
import {expertiseThreshold,blankExpertise} from "./expertise.mjs?v=alpha-gear-a3";
import {ITEM_GRADES,ITEM_QUALITIES,STARTER_ITEM,SMITH_BALANCE,equipmentPrice,equipmentUnlockLevel} from "./smith.mjs?v=gear-a3";
import {TACTIC_IDS} from "./manager-tactics.mjs?v=manager-tactics-001";
import {seededCombatRandom} from "./combat.mjs?v=gear-a3";
import {blankCharacterEffort,awardCharacterEffort} from "./character-attributes.mjs";
const cap=expertiseThreshold(7),count=n=>Number.isSafeInteger(n)&&n>=0;
const maxBudget=(1+ARMOUR_SLOTS.length)*equipmentPrice({grade:7,quality:"masterwork"})+ARMOUR_SLOTS.length*SMITH_BALANCE.firstArmourCost;
const level=n=>Number.isInteger(n)&&n>=1&&n<=50;
const profiles=ITEM_GRADES.flatMap((_,grade)=>ITEM_QUALITIES.map(quality=>({grade,quality})));
const pool=Object.fromEntries(GROUP_ROLES.map(role=>[role,GROUP_CLASS_IDS.filter(id=>GROUP_CLASSES[id].role===role)]));
const choose=(a,r)=>a[Math.floor(r()*a.length)];
const mix=x=>{x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);return (x^(x>>>16))>>>0;};
export function captureGroupCloneEnvelope(group){
 if(!validBattleGroup(group))throw new RangeError("Invalid group");
 return {version:1,roster:GROUP_IDS.map(id=>{
  const m=group[id],c=GROUP_CLASSES[m.selected],p=m.classes[m.selected];
  return {budget:Object.entries(p.equipment).reduce((n,[k,v])=>n+equipmentPrice(v)+(k.includes(":")?SMITH_BALANCE.firstArmourCost:0),0),
   weaponXP:Math.min(cap,p.expertiseActive[c.loadout]),armourXP:Math.min(cap,p.expertiseActive[c.armour]),
   classLevel:p.mastery.level,tacticLevel:m.stances[m.stance].level};
 })};
}
export const validGroupCloneEnvelope=e=>Boolean(e?.version===1&&Array.isArray(e.roster)&&e.roster.length===GROUP_IDS.length&&e.roster.every(b=>b&&count(b.budget)&&b.budget<=maxBudget&&count(b.weaponXP)&&b.weaponXP<=cap&&count(b.armourXP)&&b.armourXP<=cap&&level(b.classLevel)&&level(b.tacticLevel)));
// Independently pick roster before location. At high progression, prefer
// diverse role coverage, with a nonzero chance of arbitrary combinations.
// This is a heuristic, not a proven optimum or a counterpick.
export function groupCloneChoices(skill,seed){
 if(!Number.isFinite(skill)||skill<1||!count(seed)||seed>0xffffffff)throw new RangeError("Invalid clone seed");
 const r=seededCombatRandom(mix(seed)),competence=Math.min(.9,(skill-1)*.9/49);
 const coherent=r()<competence;
 const roles=coherent?["tank","healer","support",choose(["support","melee","summoner"],r),choose(["melee","ranged","mage"],r),choose(["melee","ranged","mage","summoner"],r),choose(["melee","ranged","mage"],r)]:[];
 // Shuffle so slots do not privilege the tank/healer with a particular budget.
 for(let i=roles.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[roles[i],roles[j]]=[roles[j],roles[i]];}
 return GROUP_IDS.map((_,i)=>{
  const id=choose(coherent?pool[roles[i]]:GROUP_CLASS_IDS,r),c=GROUP_CLASSES[id];
  const preferred=c.role==="tank"||c.role==="healer"?["balanced","defensive"]:c.role==="support"?["balanced","defensive","aggressive"]:["balanced","aggressive"];
  return {classId:id,stance:choose(r()<competence?preferred:TACTIC_IDS,r)};
 });
}
// Same smith price/gates and weakest-first allocation as group automatic
// upgrades, without thousands of state mutations per simulated opponent.
function allocate(c,budget,skill){
 const keys=[c.loadout,...ARMOUR_SLOTS.map(s=>s.id+":"+c.armour)],equipment={[keys[0]]:{...STARTER_ITEM}};
 let left=budget;
 for(const key of keys.slice(1)){
  if(left<SMITH_BALANCE.firstArmourCost)break;
  equipment[key]={...STARTER_ITEM};left-=SMITH_BALANCE.firstArmourCost;
 }
 const owned=Object.keys(equipment),legal=profiles.filter(p=>equipmentUnlockLevel(p.grade)<=skill);
 for(let rank=1;rank<legal.length;rank++){
  const cost=equipmentPrice(legal[rank])-equipmentPrice(legal[rank-1]);
  for(const key of owned){if(left<cost)return equipment;equipment[key]={...legal[rank]};left-=cost;}
 }
 return equipment;
}
export function buildGroupCloneTeam(envelope,shared,seed,rules=3){
 if(!validGroupCloneEnvelope(envelope))throw new RangeError("Invalid group clone envelope");
 const choices=groupCloneChoices(shared.skill,seed);
 let group=initialBattleGroup();
 for(const [i,id] of GROUP_IDS.entries()){
  const b=envelope.roster[i],choice=choices[i],c=GROUP_CLASSES[choice.classId];
  group=selectGroupClass(group,id,c.race,c.mainClass,c.id);group=selectGroupStance(group,id,choice.stance);
  const m=group[id],p=m.classes[c.id];
  p.equipment=allocate(c,b.budget,shared.skill);p.mastery={level:b.classLevel,xp:0};
  p.expertise=blankExpertise();p.expertise[c.loadout]=b.weaponXP;p.expertise[c.armour]=b.armourXP;p.expertiseActive={...p.expertise};
  if([4,5,6,7,8].includes(rules)){p.attributeEffort=awardCharacterEffort(blankCharacterEffort(),c.id,Math.floor(b.weaponXP/4));p.attributeEffortActive={...p.attributeEffort};}
  m.stances[choice.stance]={level:b.tacticLevel,xp:0};
 }
 const snapshots=groupSnapshots(group,shared,rules);
 return GROUP_IDS.map((id,i)=>({...snapshots[id],name:"Rival "+(i+1)}));
}
