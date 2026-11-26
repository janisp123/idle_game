import * as m0 from "../site/play/armour.mjs";
import * as m1 from "../site/play/difficulty.mjs";
import * as m2 from "../site/play/combat-skills.mjs";
import * as m3 from "../site/play/expertise.mjs";
import * as m4 from "../site/play/arenas.mjs";
import * as m5 from "../site/play/smith.mjs";
import * as m6 from "../site/play/physical-duel.mjs";
import * as m7 from "../site/play/combat-verdict.mjs";
import * as m8 from "../site/play/combat-art.mjs";
import * as m9 from "../site/play/combat.mjs";
import * as m10 from "../site/play/arena-wallet.mjs";
import * as m11 from "../site/play/attributes.mjs";
import * as m12 from "../site/play/loot.mjs";
import * as m13 from "../site/play/production.mjs";
import * as m14 from "../site/play/apprentice.mjs";
import * as m15 from "../site/play/engine.mjs";
import * as m16 from "../site/play/character-stats.mjs";
const modules={"armour":m0,"difficulty":m1,"combat-skills":m2,"expertise":m3,"arenas":m4,"smith":m5,"physical-duel":m6,"combat-verdict":m7,"combat-art":m8,"combat":m9,"arena-wallet":m10,"attributes":m11,"loot":m12,"production":m13,"apprentice":m14,"engine":m15,"character-stats":m16};
function run(){

const {smith,armour,expertise,difficulty,combat,engine,"physical-duel":duel,"arena-wallet":wallet,"character-stats":sheet}=modules;
function check(ok,message){if(!ok)throw Error(message);}
const stages=Array.from({length:32},(_,i)=>({grade:Math.floor(i/4),quality:smith.ITEM_QUALITIES[i%4]}));
const styles=Object.keys(modules["combat-skills"].COMBAT_LOADOUTS);
const families=["padded","leather","plate"];
const ids=[...styles,...armour.ARMOUR_SLOTS.flatMap(s=>families.map(f=>s.id+":"+f))];
let quotes=0,legal=0,conditionChecks=0,sessions=0,duels=0,transactions=0;
for(const id of ids)for(let i=-1;i<32;i++)for(let j=0;j<32;j++){
 const state={equipment:i<0?{}:{[id]:stages[i]},coins:10000000,skills:{fighting:{level:100}}};
 const q=smith.smithQuote(state,id,stages[j]),allowed=j===i+1;
 check(q.available===allowed,"quote eligibility "+id+" "+i+" "+j);quotes++;
 if(allowed){
  legal++;check(q.cost>0&&Number.isSafeInteger(q.cost),"positive price");
  check(!smith.smithQuote({...state,coins:q.cost-1},id,stages[j]).available,"insufficient funds");
  if(q.requiredFightingLevel>1)check(!smith.smithQuote({...state,skills:{fighting:{level:q.requiredFightingLevel-1}}},id,stages[j]).available,"level restriction");
 }
}
for(const w of styles)for(const f of families)for(const item of stages){
 const pieces=Object.fromEntries(armour.ARMOUR_SLOTS.map(s=>[s.id,f]));
 const gear=Object.fromEntries([[w,item],...armour.ARMOUR_SLOTS.map(s=>[s.id+":"+f,item])]);
 for(const practice of [expertise.blankExpertise(),expertise.fullExpertise()]){
  const c=smith.equippedCondition(pieces,w,gear,practice);
  for(const p of [c.weapon,c.shield,...Object.values(c.armour)].filter(Boolean)){
   check(p.maxHP===24+3*item.grade+12*smith.ITEM_QUALITIES.indexOf(item.quality),"capacity");
   check(p.breakable===(item.quality!=="masterwork"),"masterwork condition");
   check(Object.values(p).every(x=>typeof x!=="number"||Number.isFinite(x)),"finite profile");conditionChecks++;
  }
  const a={name:"Test fighter",loadout:w,str:100,dex:100,end:100,skill:40,difficulty:item.grade,gear:armour.armourStats(pieces,w),condition:c,gearAttack:c.weapon.flatAttack};
  const session=combat.startCombatSession(a,813421);
  check(combat.validCombatSession(session),"valid generated snapshot "+w+" "+f+" "+item.grade+" "+item.quality);sessions++;
  const r=combat.combatAtTime({...session,elapsedMs:combat.BOUT_MS-1});
  check(["victory","defeat","double_death"].includes(r.outcome),"valid outcome");duels++;
  const invalid={...session,player:{...session.player,condition:{...c,weapon:{...c.weapon,speed:1}}}};
  check(!combat.validCombatSession(invalid),"reject out-of-bound speed");
 }
}
let state=engine.newGame(0);
state={...state,coins:10000000,skills:{...state.skills,fighting:{...state.skills.fighting,level:50}}};
for(const id of ["greatsword","head:plate"]){
 let current=state.equipment[id]??null;
 while(true){
 const target=smith.nextEquipmentUpgrade(current);if(!target)break;
 const quote=smith.smithQuote(state,id,target),before=state.coins;
 const r=engine.buyEquipment(state,id,target,0,()=>.5);
 check(r.purchased&&before-r.state.coins===quote.cost,"engine purchase debit");
 state=r.state;current=state.equipment[id];transactions++;
 }
 check(current.grade===7&&current.quality==="masterwork","terminal stage");
}
const view=sheet.characterStats(state);
for(const title of ["Recovery skip chance","Critical chance modifier","Critical damage modifier","Critical avoidance","Critical damage reduction"])check(view.sections.some(x=>x.title===title),"missing stat "+title);
check(!JSON.stringify(view).includes("NaN"),"finite stat display");
check(wallet.arenaReward(7)===185,"S reward");
check(difficulty.arenaBenchmark(7).stat===124,"NPC curve");
return {quotes,legal,conditionChecks,sessions,duels,transactions,statSections:view.sections.length};

}
console.log("APPRENTICE-A3",JSON.stringify(run()));
