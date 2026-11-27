// NPC-PARITY-001. Rivals have an equivalent earned progression budget,
// independent seeded decisions, and exactly the player snapshot formulas.
import {ARMOUR_SLOTS,ARMOUR_TIERS} from "./armour.mjs?v=bal-002";
import {COMBAT_LOADOUTS} from "./combat-skills.mjs?v=glad-002";
import {ITEM_GRADES,ITEM_QUALITIES,STARTER_ITEM,SMITH_BALANCE,equipmentPrice,equipmentUnlockLevel} from "./smith.mjs?v=gear-a3";
import {blankExpertise,expertiseThreshold} from "./expertise.mjs?v=alpha-gear-a3";
import {TACTIC_IDS,TACTIC_BALANCE,tacticRequiredXP} from "./manager-tactics.mjs?v=manager-tactics-001";
import {initialGladiator,teamSnapshots,TEAM_IDS} from "./team.mjs?v=team-001";
import {seededCombatRandom} from "./combat.mjs?v=gear-a3";
const weapons=Object.keys(COMBAT_LOADOUTS),families=ARMOUR_TIERS.filter(x=>x!=="none");
const slots=ARMOUR_SLOTS.length,cap=expertiseThreshold(7),maxTactic=TACTIC_BALANCE.maxLevel;
const items=ITEM_GRADES.flatMap((_,grade)=>ITEM_QUALITIES.map(quality=>({grade,quality})));
const maxBudget=(slots+1)*equipmentPrice(items.at(-1))+slots*SMITH_BALANCE.firstArmourCost;
const count=n=>Number.isSafeInteger(n)&&n>=0;
const sumCapped=(ns,limit)=>ns.reduce((n,v)=>n+Math.min(limit-n,v),0);
const tacticCost=Array.from({length:maxTactic},(_,i)=>i+1).reduce((a,l)=>[...a,(a.at(-1)??0)+(l===1?0:tacticRequiredXP(l-1))],[]);
export const cloneRewardGrade=skill=>ITEM_GRADES.reduce((g,_,i)=>skill>=equipmentUnlockLevel(i)?i:g,0);
export function captureCloneEnvelope(team,tactics,skill){
 return {version:1,roster:TEAM_IDS.map(id=>{
  const g=team[id];
  return {budget:sumCapped(Object.entries(g.equipment).map(([k,v])=>equipmentPrice(v)+(k.includes(":")?SMITH_BALANCE.firstArmourCost:0)),maxBudget),
    weaponXP:sumCapped(weapons.map(w=>g.expertiseActive[w]),cap),
    armourXP:sumCapped(ARMOUR_TIERS.map(w=>g.expertiseActive[w]),cap),
    tacticLevel:1+tacticCost.filter(c=>c<=sumCapped(TACTIC_IDS.map(t=>tacticCost[tactics[id].skills[t].level-1]),tacticCost.at(-1))).length-1};
 })};
}
export function validCloneEnvelope(e){
 return Boolean(e?.version===1&&Array.isArray(e.roster)&&e.roster.length===TEAM_IDS.length&&e.roster.every(r=>r&&
  count(r.budget)&&r.budget<=maxBudget&&count(r.weaponXP)&&r.weaponXP<=cap&&count(r.armourXP)&&r.armourXP<=cap&&
  Number.isInteger(r.tacticLevel)&&r.tacticLevel>=1&&r.tacticLevel<=maxTactic));
}
// Diverse plausible specialists, NOT a claim of a solved meta. Exploration
// falls from 100% to 10% over Fighting 1..50. No terrain or player choice input.
const coherent={
 greatsword:[["plate","balanced"],["leather","aggressive"],["plate","aggressive"]],
 sword_shield:[["plate","defensive"],["plate","balanced"],["leather","defensive"]],
 hammer:[["plate","aggressive"],["leather","balanced"],["padded","aggressive"]],
 bow:[["padded","defensive"],["leather","balanced"],["leather","defensive"]],
 spear:[["plate","balanced"],["leather","defensive"],["plate","aggressive"]]
};
const pick=(a,r)=>a[Math.floor(r()*a.length)];
export function cloneChoice(skill,random){
 const weapon=pick(weapons,random),experienced=Math.min(.9,Math.max(0,(skill-1)/49*.9));
 const [family,tactic]=random()<experienced?pick(coherent[weapon],random):[pick(families,random),pick(TACTIC_IDS,random)];
 return {weapon,family,tactic};
}
// Same cumulative smith prices, grade gates, first armour purchases and
// weakest-first sequential progression. Binary search equivalent to all
// items advancing in lockstep, then spend on the next stage in slot order.
function allocate(budget,skill,armoured){
 const initial=armoured?slots*SMITH_BALANCE.firstArmourCost:0,n=armoured?slots+1:1;
 const available=Math.max(0,budget-initial),legal=items.filter(i=>equipmentUnlockLevel(i.grade)<=skill);
 let rank=0;for(let i=1;i<legal.length;i++){if(n*equipmentPrice(legal[i])>available)break;rank=i;}
 const result=Array.from({length:n},()=>({...legal[rank]}));
 let left=available-n*equipmentPrice(legal[rank]);
 if(rank+1<legal.length){
  const cost=equipmentPrice(legal[rank+1])-equipmentPrice(legal[rank]);
  for(let i=0;i<n&&left>=cost;i++,left-=cost)result[i]={...legal[rank+1]};
 }
 return result;
}
export function buildCloneTeam(envelope,shared,seed){
 if(!validCloneEnvelope(envelope))throw new RangeError("Invalid clone progression");
 const team={},choices=[];
 for(const [i,id] of TEAM_IDS.entries()){
  const b=envelope.roster[i],r=seededCombatRandom((seed^Math.imul(i+1,0x9e3779b9))>>>0),c=cloneChoice(shared.skill,r);
  const armoured=b.budget>=slots*SMITH_BALANCE.firstArmourCost,family=armoured?c.family:"none",g=initialGladiator(c.weapon),specs=allocate(b.budget,shared.skill,armoured);
  g.equipment[c.weapon]=specs[0];g.armour=Object.fromEntries(ARMOUR_SLOTS.map(({id})=>[id,family]));
  if(armoured)ARMOUR_SLOTS.forEach(({id},j)=>{g.equipment[id+":"+family]=specs[j+1];});
  g.expertise=blankExpertise();g.expertise[c.weapon]=b.weaponXP;g.expertise[family]=b.armourXP;g.expertiseActive={...g.expertise};
  team[id]=g;choices.push({tactic:c.tactic,tacticLevel:b.tacticLevel});
 }
 const snapshots=teamSnapshots(team,shared);
 return TEAM_IDS.map((id,i)=>({...snapshots[id],name:"Rival "+(i+1),...choices[i]}));
}
