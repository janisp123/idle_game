// INDIVIDUAL-STATS-001: pure, tunable foundation. No combat or save side effects.
// Legacy attributes.mjs remains the historical three-stat calculator.
import {GROUP_CLASS_IDS} from "./battle-group-classes.mjs?v=group-001";
export const CHARACTER_ATTRIBUTE_IDS=Object.freeze(["STR","DEX","CON","INT","WIT","MEN"]);
export const CHARACTER_ATTRIBUTE_EFFECTS=Object.freeze({
 STR:"Physical damage",
 DEX:"Physical attack speed, accuracy, evasion, physical critical chance and movement",
 CON:"Maximum HP and physical status resistance",
 INT:"Magical damage and healing",
 WIT:"Casting speed and magical critical chance",
 MEN:"Magical defence and magical status resistance"
});
export const CHARACTER_ATTRIBUTE_BALANCE=Object.freeze({
 baseBudget:100,weightBudget:100,xpPerProductiveHour:100,firstPointXP:20,additionalPointXP:20
});
const rows=[
 ["blademaster",[35,24,23,5,5,8],[38,24,23,3,4,8]],
 ["linebreaker",[32,19,30,5,5,9],[34,19,32,3,4,8]],
 ["oathkeeper",[24,10,35,5,6,20],[15,10,40,5,5,25]],
 ["grimwarden",[27,10,33,8,7,15],[22,9,38,8,5,18]],
 ["trickblade",[25,40,15,5,8,7],[25,45,15,3,7,5]],
 ["longshot",[22,35,16,7,10,10],[25,40,15,3,7,10]],
 ["flameweaver",[5,8,12,36,24,15],[3,5,12,40,25,15]],
 ["gravebinder",[6,7,15,32,18,22],[4,5,15,35,18,23]],
 ["beastcaller",[10,14,19,28,15,14],[8,13,19,33,14,13]],
 ["lifekeeper",[5,5,15,25,25,25],[3,5,12,25,30,25]],
 ["runesage",[6,7,14,21,24,28],[5,5,15,15,30,30]],
 ["grovewarden",[18,12,30,7,8,25],[12,10,35,5,8,30]],
 ["wardchanter",[20,16,30,6,9,19],[17,13,32,5,11,22]],
 ["swiftblade",[20,44,15,5,9,7],[20,48,15,3,9,5]],
 ["windbow",[18,40,17,5,12,8],[20,45,15,3,10,7]],
 ["frostweaver",[5,7,10,25,38,15],[3,5,10,28,38,16]],
 ["spiritcaller",[6,9,15,25,23,22],[4,7,15,26,25,23]],
 ["wellspring",[5,6,14,22,29,24],[3,5,13,22,32,25]],
 ["dreadguard",[23,11,31,10,7,18],[19,10,33,10,6,22]],
 ["war_dancer",[27,25,22,6,10,10],[29,28,20,4,11,8]],
 ["nightblade",[32,35,15,5,7,6],[32,39,14,3,7,5]],
 ["blackbow",[31,30,16,6,8,9],[34,35,15,3,6,7]],
 ["galescourge",[5,7,13,40,20,15],[3,5,12,47,18,15]],
 ["shadebinder",[7,12,14,29,19,19],[5,10,14,32,21,18]],
 ["bloodsage",[7,8,18,29,19,19],[5,6,18,33,20,18]],
 ["ragebreaker",[40,13,33,4,4,6],[44,13,33,2,3,5]],
 ["ironfist",[30,29,25,5,5,6],[32,33,24,2,4,5]],
 ["hexchief",[7,9,18,27,20,19],[5,7,18,30,23,17]],
 ["warcaller",[8,8,20,18,20,26],[6,6,20,17,23,28]],
 ["scrapbreaker",[37,14,34,4,4,7],[40,12,34,2,4,8]],
 ["forgecaller",[29,12,35,8,6,10],[28,10,38,9,5,10]]
];
const B=CHARACTER_ATTRIBUTE_BALANCE,IDS=CHARACTER_ATTRIBUTE_IDS,HOUR_MS=3600000;
const asStats=values=>Object.freeze(Object.fromEntries(IDS.map((id,i)=>[id,values[i]])));
const validVector=(a,budget)=>a.length===IDS.length&&a.every(n=>Number.isSafeInteger(n)&&n>0)&&a.reduce((x,y)=>x+y,0)===budget;
export const CHARACTER_CLASS_PROFILES=Object.freeze(Object.fromEntries(rows.map(([id,base,growth])=>{
 if(!validVector(base,B.baseBudget)||!validVector(growth,B.weightBudget))throw Error("Invalid class attribute budget: "+id);
 return [id,Object.freeze({base:asStats(base),growth:asStats(growth)})];
})));
if(rows.length!==GROUP_CLASS_IDS.length||GROUP_CLASS_IDS.some(id=>!Object.hasOwn(CHARACTER_CLASS_PROFILES,id)))throw Error("Incomplete character attribute profiles");
function profile(id){if(!Object.hasOwn(CHARACTER_CLASS_PROFILES,id))throw new RangeError("Unknown specialization");return CHARACTER_CLASS_PROFILES[id];}
const count=n=>Number.isSafeInteger(n)&&n>=0;
export const blankCharacterEffort=()=>Object.fromEntries(IDS.map(id=>[id,0]));
export const validCharacterEffort=e=>Boolean(e&&typeof e==="object"&&!Array.isArray(e)&&Object.keys(e).length===IDS.length&&IDS.every(id=>Object.hasOwn(e,id)&&count(e[id])));
export function awardCharacterEffort(e,classId,productiveMs){
 const weights=profile(classId).growth;
 if(!validCharacterEffort(e)||!count(productiveMs))throw new RangeError("Invalid character effort");
 const next=Object.fromEntries(IDS.map(id=>[id,e[id]+productiveMs*weights[id]]));
 if(!validCharacterEffort(next))throw new RangeError("Character effort overflow");
 return next;
}
// Store already-distributed effort, not just time: changing future weights
// does not retroactively redistribute past training. Growth is O(6), even offline.
export function characterAttributeProgress(classId,effort){
 const p=profile(classId);
 if(!validCharacterEffort(effort))throw new RangeError("Invalid character effort");
 const first=B.firstPointXP,added=B.additionalPointXP;
 if(!(first>0&&added>=0&&B.xpPerProductiveHour>0))throw Error("Invalid attribute progression tuning");
 const cost=n=>first*n+added*n*(n-1)/2;
 return Object.fromEntries(IDS.map(id=>{
  const xp=effort[id]*B.xpPerProductiveHour/(HOUR_MS*B.weightBudget);
  const a=added/2,b=first-a;
  let points=a?Math.max(0,Math.floor((-b+Math.sqrt(b*b+4*a*xp))/(2*a))):Math.floor(xp/first);
  while(points>0&&cost(points)>xp)points--;
  while(cost(points+1)<=xp)points++;
  const nextXP=first+added*points;
  return [id,{base:p.base[id],value:p.base[id]+points,xp,points,progressXP:xp-cost(points),nextXP,progressPercent:100*(xp-cost(points))/nextXP}];
 }));
}
export function characterAttributes(classId,effort){const progress=characterAttributeProgress(classId,effort);return Object.fromEntries(IDS.map(id=>[id,progress[id].value]));}
