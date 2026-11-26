// Test-only fixture: acquire a target via the production purchase path, never a bypass.
import {buyEquipment} from "../site/play/engine.mjs";
import {nextEquipmentUpgrade} from "../site/play/smith.mjs";
export function purchaseThrough(state,id,target,now=0,random=()=>.5){
  let result={state};
  for(let step=0;step<32;step++){
    const current=result.state.equipment[id];
    if(current?.grade===target.grade&&current.quality===target.quality)return result;
    const next=nextEquipmentUpgrade(current);
    if(!next)throw Error("Fixture target unreachable");
    result=buyEquipment(result.state,id,next,now,random);
    if(!result.purchased)throw Error("Fixture purchase refused: "+id+" "+JSON.stringify(next));
  }
  if(result.state.equipment[id]?.grade===target.grade&&result.state.equipment[id]?.quality===target.quality)return result;
  throw Error("Fixture target unreachable");
}
