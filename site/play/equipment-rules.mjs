// Alpha tuning. Each row is the incremental bonus for that slot and rank.
import { ARMOUR_SLOTS } from "./armour.mjs?v=glad-001";
export const EQUIP_SLOTS=["weapon","shield",...ARMOUR_SLOTS.map(slot=>slot.id)];
export const MAX_ENCHANT=20;
export const ENCHANT_STEPS=Object.fromEntries(EQUIP_SLOTS.map(slot=>[slot,
  Array.from({length:MAX_ENCHANT},()=>({attack:slot==="weapon"?1:0,
    defense:slot==="weapon"?0:1,durability:2}))]));
export function slotBonus(slot,rank) {
  const total={attack:0,defense:0,durability:0};
  for(const step of ENCHANT_STEPS[slot].slice(0,rank))
    for(const stat of Object.keys(total)) total[stat]+=step[stat]??0;
  return total;
}
export const GRADES=[
  {grade:"F",level:1,cost:{log:5,stone:5}},
  {grade:"E",level:5,cost:{log:15,hide:10}},
  {grade:"D",level:15,cost:{hide:25,ingot:10}},
  {grade:"C",level:35,cost:{ingot:30,log:50}},
  {grade:"B",level:70,cost:{ingot:80,hide:80}},
  {grade:"A",level:120,cost:{ingot:180,stone:250}},
  {grade:"S",level:200,cost:{ingot:400,hide:500}}
];
export function characterLevel(skills) {
  return 1+Object.values(skills).reduce((n,s)=>n+s.level-1,0);
}
export function masteryRanks(raw={}) {
  if (!raw || typeof raw!=="object" || Array.isArray(raw) ||
      Object.entries(raw).some(([slot,n])=>!EQUIP_SLOTS.includes(slot)||
        !Number.isInteger(n)||n<0||n>GRADES.length)) return null;
  return Object.fromEntries(EQUIP_SLOTS.map(slot=>[slot,raw[slot]??0]));
}
export function masteryOffer(state,slot) {
  const rank=state.slotMastery[slot],next=GRADES[rank];
  const available=Boolean(next && characterLevel(state.skills)>=next.level &&
    Object.entries(next.cost).every(([item,n])=>state.items[item]>=n));
  return {rank,next,available};
}
export function conditionBonuses(state) {
  const slotLife=slot=>slotBonus(slot,state.enchantments[slot]).durability+state.slotMastery[slot]*3;
  return {weapon:slotLife("weapon"),shield:slotLife("shield"),
    body:ARMOUR_SLOTS.reduce((n,s)=>n+(state.armour[s.id]==="none"?0:slotLife(s.id)),0)};
}
