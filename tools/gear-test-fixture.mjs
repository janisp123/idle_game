// Test-only synthetic fixture: below A4 unlock use actual manual purchase;
// above it build a historical legal kit with real smith quotes for combat tests.
// No runtime bypass; automatic transaction itself is tested separately.
import {buyEquipment,autoEquipmentUnlocked,settle,activateExpertise} from "../site/play/engine.mjs";
import {nextEquipmentUpgrade,smithQuote} from "../site/play/smith.mjs";
export function purchaseThrough(state,id,target,now=0,random=()=>.5){
  let result={state};
  for(let step=0;step<32;step++){
    const current=result.state.equipment[id];
    if(current?.grade===target.grade&&current.quality===target.quality)return result;
    const next=nextEquipmentUpgrade(current);
    if(!next)throw Error("Fixture target unreachable");
    if(autoEquipmentUnlocked(result.state)&&current){
      const settled=settle(result.state,now,random),s=settled.state,q=smithQuote(s,id,next);
      if(!q.available)throw Error("Synthetic historical quote refused");
      const [slot,family]=id.split(":");
      result={...settled,purchased:true,state:activateExpertise({...s,coins:s.coins-q.cost,equipment:{...s.equipment,[id]:next},armour:family?{...s.armour,[slot]:family}:s.armour})};
    }else result=buyEquipment(result.state,id,next,now,random);
    if(!result.purchased)throw Error("Fixture purchase refused: "+id+" "+JSON.stringify(next));
  }
  if(result.state.equipment[id]?.grade===target.grade&&result.state.equipment[id]?.quality===target.quality)return result;
  throw Error("Fixture target unreachable");
}
