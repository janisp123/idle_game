import * as e from "../site/play/engine.mjs";
import * as s from "../site/play/smith.mjs";
import * as c from "../site/play/combat.mjs";
function verify(e,s,c){
 let checks=0;const check=(ok,msg)=>{checks++;if(!ok)throw Error(msg)};
 const same=(a,b,msg)=>check(JSON.stringify(a)===JSON.stringify(b),msg);
 const rng=()=>.5,poor={grade:0,quality:"poor"},common={grade:0,quality:"common"};
 const make=(level,coins)=>{const x=e.newGame(0);return {...x,coins,skills:{...x.skills,fighting:{level,xp:0}}};};
 let x=make(1,1000);check(e.autoEquipmentUnlocked(x),"first entry unlocked");check(e.enterGameWithApprentice(x,0,rng).state.coins<1000,"first entry automatic spend");check(e.buyEquipment(x,"greatsword",common,0,rng).purchaseBlocked==="automatic_equipment","manual blocked from start");
 x=make(11,1000);check(e.autoEquipmentUnlocked(x),"ten unlocked");const before=JSON.stringify(x);
 check(e.buyEquipment(x,"greatsword",common,0,rng).purchaseBlocked==="automatic_equipment","manual selected blocked");check(e.buyEquipment(x,"bow",common,0,rng).purchaseBlocked==="automatic_equipment","manual offloadout blocked");
 const bought=e.buyEquipment(x,"head:plate",poor,0,rng);check(bought.purchased&&bought.state.armour.head==="plate","initial chosen armour remains");check(e.buyEquipment(bought.state,"head:plate",common,0,rng).purchaseBlocked==="automatic_equipment","manual armour upgrade blocked");
 const offline=e.enterGame(bought.state,0,rng);same(offline.state.equipment,bought.state.equipment,"ordinary entry no purchase");const login=e.enterGameWithApprentice(bought.state,0,rng);
 check(login.autoEquipment.upgrades.length>0,"mandatory login");check(login.autoEquipment.upgrades[0].id==="greatsword"&&login.autoEquipment.upgrades[1].id==="head:plate","weakest stable tie");
 check(login.autoEquipment.spent===bought.state.coins-login.state.coins,"exact total");same(login.state.armour,bought.state.armour,"preserve armour");same(login.state.equipment.bow,x.equipment.bow,"unused bow untouched");same(JSON.stringify(x),before,"input immutable");
 const save=e.readSave(JSON.stringify(login.state));check(save!==null,"valid save");const reload=e.enterGameWithApprentice(save,0,rng);check(reload.autoEquipment.upgrades.length===0&&reload.state.coins===save.coins,"reload no duplicate");
 const switched=e.setCombatLoadout(save,"bow",0,rng).state;const other=e.enterGameWithApprentice(switched,0,rng);check(other.state.combatLoadout==="bow","selected bow preserved");same(other.state.equipment.greatsword,save.equipment.greatsword,"offloadout old sword frozen");
 const rich=make(50,10_000_000);let kit=rich;for(const slot of ["head","torso","arms","legs"])kit=e.buyEquipment(kit,slot+":plate",poor,0,rng).state;
 const all=e.enterGameWithApprentice(kit,0,rng);check(all.autoEquipment.upgrades.length===155,"155 max purchases");check(all.autoEquipment.preview.reason==="complete","all S complete");check(all.autoEquipment.spent===5*s.equipmentPrice({grade:7,quality:"masterwork"}),"full credit exact");
 let active=e.chooseActivity(make(11,10000),"fighting",0,rng).state;
 active=e.settle(active,1,rng).state;const frozen=JSON.stringify(active.combatSession);
 const upgraded=e.enterGameWithApprentice(active,1,rng);same(JSON.stringify(upgraded.state.combatSession),frozen,"old in-flight fighter unchanged");same(upgraded.state.autoFight,active.autoFight,"no offline grade advance");
 const next=e.settle(upgraded.state,c.BOUT_MS+1,rng).state;check(next.combatSession.player.trainingKit.equipment[active.combatLoadout].grade===upgraded.state.equipment[active.combatLoadout].grade,"new gear at next bout");
 const ready=make(51,10_000_000);ready.skills.fighting.xp=e.xpToNextLevel(51);ready.apprenticeMasterConsent=1;
 const combined=e.enterGameWithApprentice(ready,0,rng);check(combined.mastery.ready.includes("fighting")&&combined.state.skills.fighting.level===52,"master first");check(combined.autoEquipment.upgrades.length===31,"equipment after master");
 return {checks};
}
console.log(JSON.stringify(verify(e,s,c)));
