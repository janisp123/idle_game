import * as planner from "../site/play/auto-equipment.mjs";
import * as smith from "../site/play/smith.mjs";
import * as armour from "../site/play/armour.mjs";
import * as combat from "../site/play/combat-skills.mjs";
function verify(planner,smith,armour,combat){
 let checks=0;const check=(v,m)=>{checks++;if(!v)throw Error(m)};
 const levels=["fighting","mining"];
 const item=n=>({grade:Math.floor(n/4),quality:smith.ITEM_QUALITIES[n%4]});
 const state=(n=0)=>({skills:{fighting:{level:50},mining:{level:1}},combatLoadout:"greatsword",armour:Object.fromEntries(armour.ARMOUR_SLOTS.map(s=>[s.id,"plate"])),equipment:{greatsword:item(n),bow:item(0),...Object.fromEntries(armour.ARMOUR_SLOTS.map(s=>[s.id+":plate",item(n)]))},coins:10_000_000});
 const p=s=>planner.previewAutoEquipment(s,levels);
 let s=state();s.skills.fighting.level=10;check(p(s).reason==="locked","9 locked");s.skills.mining.level=2;check(p(s).unlocked,"10 unlocked");
 s.apprenticeAutoEquipment=false;check(p(s).next?.id==="greatsword","fake off flag ignored");
 s=state();s.coins=44;check(p(s).reason==="coins"&&p(s).next.cost===45,"save toward weakest");
 s=state(3);s.skills.fighting.level=4;s.skills.mining.level=8;check(p(s).reason==="fighting_level"&&p(s).next.target.grade===1,"grade gate");
 const ids=planner.chosenEquipmentIds(state());
 for(let a=0;a<32;a++)for(let b=0;b<32;b++){
   s=state(31);s.equipment[ids[0]]=item(a);s.equipment[ids[1]]=item(b);
   const n=p(s).next;check((n?.id??null)===(a===31&&b===31?null:a<=b?ids[0]:ids[1]),"weakest then stable tie");
   if(n){const q=smith.smithQuote(s,n.id,n.target);check(q.available&&n.cost===q.cost&&n.cost>0,"exact quote");}
 }
 for(const style of Object.keys(combat.COMBAT_LOADOUTS))for(const family of armour.ARMOUR_TIERS){
   s=state();s.combatLoadout=style;s.equipment[style]=item(0);
   s.armour=Object.fromEntries(armour.ARMOUR_SLOTS.map(x=>[x.id,family]));
   if(family!=="none")for(const x of armour.ARMOUR_SLOTS)s.equipment[x.id+":"+family]=item(0);
   const selected=planner.chosenEquipmentIds(s);
   check(selected.length===(family==="none"?1:5)&&selected[0]===style,"chosen only");
   const before=JSON.stringify(s);let count=0,coins=0;
   while(p(s).next){const n=p(s).next;check(n.available&&selected.includes(n.id),"legal selected purchase");s={...s,coins:s.coins-n.cost,equipment:{...s.equipment,[n.id]:n.target}};coins+=n.cost;count++;check(count<=planner.MAX_AUTO_EQUIPMENT_PURCHASES,"bound");}
   check(count===selected.length*31,"complete stages");check(coins===10_000_000-s.coins,"conservation");check(p(s).reason==="complete","terminal");check(JSON.parse(before).combatLoadout===s.combatLoadout,"no weapon switch");
 }
 s=state(31);s.skills.fighting.level=4;s.skills.mining.level=8;s.equipment[ids[1]]=item(3);s.equipment[ids[2]]=item(2);check(p(s).next.id===ids[2],"eligible lower grade");
 // A blocked lower nominal stage cannot actually precede a legal higher
 // one under monotone grade gates. Verify a mixed loadout and no off-kit spending.
 s=state(31);s.armour[armour.ARMOUR_SLOTS[0].id]="leather";s.equipment[armour.ARMOUR_SLOTS[0].id+":leather"]=item(0);check(p(s).next.id.endsWith(":leather"),"mixed material");
 s=state();delete s.equipment[ids[1]];let refused=false;try{p(s)}catch{refused=true}check(refused,"unowned selected gear rejected");
 return {checks};
}
console.log(JSON.stringify(verify(planner,smith,armour,combat)));
