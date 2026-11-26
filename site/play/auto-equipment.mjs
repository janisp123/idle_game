// APPRENTICE-A4: mandatory derived unlock, no saved preference or reserve.
import { earnedActivityLevels } from "./apprentice.mjs?v=apprentice-a2";
import { ARMOUR_SLOTS, ARMOUR_TIERS } from "./armour.mjs?v=bal-002";
import { COMBAT_LOADOUTS } from "./combat-skills.mjs?v=gear-a3";
import { itemPower, isEquipmentItem, nextEquipmentUpgrade, smithQuote, ITEM_GRADES, ITEM_QUALITIES } from "./smith.mjs?v=gear-a3";
export const AUTO_EQUIPMENT_AT=10;
export const MAX_AUTO_EQUIPMENT_PURCHASES=(1+ARMOUR_SLOTS.length)*(ITEM_GRADES.length*ITEM_QUALITIES.length-1);
export function chosenEquipmentIds(state){
  if(!Object.hasOwn(COMBAT_LOADOUTS,state.combatLoadout))throw new RangeError("Invalid chosen weapon");
  const ids=[state.combatLoadout];
  for(const {id} of ARMOUR_SLOTS){
    const family=state.armour?.[id];
    if(!ARMOUR_TIERS.includes(family))throw new RangeError("Invalid chosen armour");
    if(family!=="none")ids.push(id+":"+family);
  }
  for(const id of ids)if(!Object.hasOwn(state.equipment??{},id)||!isEquipmentItem(state.equipment[id]))
    throw new RangeError("Chosen equipment must be owned");
  return ids;
}
export function previewAutoEquipment(state,skillIds){
  const earnedLevels=earnedActivityLevels(state,skillIds),unlocked=earnedLevels>=AUTO_EQUIPMENT_AT;
  if(!unlocked)return {unlocked,earnedLevels,unlockAt:AUTO_EQUIPMENT_AT,reason:"locked",next:null};
  const candidates=chosenEquipmentIds(state).map((id,order)=>{
    const current=state.equipment[id],target=nextEquipmentUpgrade(current);
    return target?{id,order,current:{...current},target,rank:itemPower(current),quote:smithQuote(state,id,target)}:null;
  }).filter(Boolean).sort((a,b)=>a.rank-b.rank||a.order-b.order);
  const next=candidates.find(c=>c.quote.levelReady)??candidates[0]??null;
  if(!next)return {unlocked,earnedLevels,unlockAt:AUTO_EQUIPMENT_AT,reason:"complete",next:null};
  const {id,current,target,quote}=next;
  if(!quote.improves||!Number.isSafeInteger(quote.cost)||quote.cost<=0)throw new RangeError("Invalid automatic upgrade quote");
  return {unlocked,earnedLevels,unlockAt:AUTO_EQUIPMENT_AT,reason:quote.reason,
    next:{id,current,target,cost:quote.cost,requiredFightingLevel:quote.requiredFightingLevel,available:quote.available}};
}
