// Independent cooldowns and a single action budget for class kits.
import {pilotKit,kitStrength,KIT_BALANCE as B} from "./class-kits.mjs";
import {kitStatus,kitHeal,kitControlAllowed,kitControlDuration,controlEligible,applyControl,hasControl,clearControl} from "./class-effects.mjs";
import {resolveStrike,wound,protection,intactArmourSum,flatGuard} from "./physical-actions.mjs?v=kits-001";
import {statHealing,statMagicDamageFactor,classStatusLands} from "./stat-combat.mjs";
import {combatDamageFactor} from "./raid-rules.mjs";
import {tankPriorityActor,tankHealOrder,geometryActor} from "./group-counter-rules.mjs";
const dist=(a,b)=>Math.max(0,Math.abs(a.x-b.x)+Math.abs(a.y-b.y)-1);
const ratio=a=>a.hp/a.maxHP;
const alive=a=>a.hp>0;
const harmful=x=>Boolean(x.bleed||x.stagger||x.classWeaken||x.kitSlowUntil||x.kitDisruptUntil||hasControl(x));
const alliesIn=(a,actors,range)=>actors.filter(x=>x.side===a.side&&alive(x)&&dist(a,x)<=range).sort((x,y)=>ratio(x)-ratio(y)||x.hp-y.hp);
const healThreshold=a=>a.activeTactic==="defensive"?.90:a.activeTactic==="aggressive"?.58:.78;
const healChoices=(a,actors,round,ability)=>alliesIn(a,actors,ability.range).filter(x=>ratio(x)<(tankPriorityActor(a)&&x.role==="tank"?1:healThreshold(a))&&round>=(x.nextHealRound??0)).sort((x,y)=>tankHealOrder(a,x,y)||ratio(x)-ratio(y));
const threatened=(x,actors)=>actors.some(y=>y.side!==x.side&&alive(y)&&dist(x,y)<=1);
const sanctuaryChoices=(a,actors,round,ability)=>alliesIn(a,actors,ability.range).filter(x=>!x.kitBraceUntil&&(harmful(x)||threatened(x,actors))&&ratio(x)<.85).sort((x,y)=>tankHealOrder(a,x,y));
const damageRole=x=>["melee","ranged","mage","summoner"].includes(x.role);
const supportMode=(a,actors,ability)=>{
 if(ability.mode!=="stance")return ability.mode;
 if(a.activeTactic==="defensive")return "guard";
 if(a.activeTactic==="aggressive")return "buff";
 return alliesIn(a,actors,ability.range).some(x=>ratio(x)<.65&&threatened(x,actors))?"guard":"buff";
};
const supportAmount=(a,ability)=>ability.amount*kitStrength(a)*(a.classId==="runesage"?B.focusedBlessing:a.classId==="wardchanter"?B.protectiveSong:1);
const supportChoices=(a,actors,ability,mode)=>{
 const amount=supportAmount(a,ability);
 return alliesIn(a,actors,ability.range).filter(x=>mode==="guard"?x.classGuard<amount&&(ratio(x)<.85||threatened(x,actors)):damageRole(x)&&(mode!=="magic_tempo"||["mage","summoner"].includes(x.role))&&x.classBuff<amount&&(!["tempo","magic_tempo"].includes(mode)||!x.kitTempoUntil)).sort((x,y)=>mode==="guard"?ratio(x)-ratio(y):Number(threatened(y,actors))-Number(threatened(x,actors))||(geometryActor(a)?0:Number(y.role==="melee")-Number(x.role==="melee"))||ratio(y)-ratio(x));
};
const sealChoices=(a,b,actors,round,ability)=>{
 if(dist(a,b)>ability.range)return [];
 return actors.filter(x=>x.side!==a.side&&alive(x)&&x.classId&&!x.kitSealUntil&&dist(b,x)<=1&&dist(a,x)<=ability.range+1&&(pilotKit(x)?Math.min(x.kitReady.primary,x.kitReady.secondary)<=round+1:x.readyRound<=round+1)).sort((x,y)=>Number(y===b)-Number(x===b)||dist(a,x)-dist(a,y));
};
const selfBoonMode=(a,actors)=>a.activeTactic==="defensive"||(a.activeTactic!=="aggressive"&&ratio(a)<.65&&threatened(a,actors))?"guard":"buff";
const siegeNeighbors=(a,b,actors)=>actors.filter(x=>x!==b&&x.side!==a.side&&alive(x)&&dist(b,x)<=1&&dist(a,x)<=1);
const pactChoices=(a,actors,ability)=>alliesIn(a,actors,ability.range).filter(x=>x.role==="melee"&&!x.kitPactUntil&&ratio(x)<B.pactThreshold&&threatened(x,actors));

 // Non-damaging tactical utility may select a real threat; ordinary attacks still draw tank aggro.
 function tacticalChoices(a,b,actors,round,ability,weapon){
  const effect=ability.effect,reach=ability.range??weapon.range;
  if(effect==="cleanse")return alliesIn(a,actors,reach).filter(harmful).sort((x,y)=>tankHealOrder(a,x,y)||ratio(x)-ratio(y));
  let choices=actors.filter(x=>x.side!==a.side&&alive(x)&&dist(a,x)<=reach);
  if(effect==="dispel")return choices.filter(x=>x.classBuff||x.classGuard||x.kitTempoUntil||x.kitFocusUntil||x.kitPactUntil||x.kitBraceUntil).sort((x,y)=>Number(y===b)-Number(x===b)||dist(a,x)-dist(a,y));
  choices=choices.filter(x=>controlEligible(x,effect,round));
  if(effect==="root"||effect==="slow")choices=choices.filter(x=>["melee","tank"].includes(x.role)&&!actors.some(y=>y.side===a.side&&alive(y)&&dist(x,y)===0));
  if(effect==="silence")choices=choices.filter(x=>["mage","healer","summoner","support"].includes(x.role)&&x.loadout==="bow");
  if(effect==="gloom"||effect==="antiheal")choices=choices.filter(x=>x===b);
  return choices.sort((x,y)=>effect==="silence"?Number(y.role==="healer")-Number(x.role==="healer")||dist(a,x)-dist(a,y):["root","slow","stun","paralysis","sleep"].includes(effect)?Number(y.role==="melee")-Number(x.role==="melee")||Number(y.role==="mage")-Number(x.role==="mage")||dist(a,x)-dist(a,y):dist(a,x)-dist(a,y));
 }
function eligible(a,b,actors,round,ability,weapon,terrain){
 const d=dist(a,b),stance=a.activeTactic??"balanced",threshold=stance==="defensive"?.85:stance==="aggressive"?.50:.70;
 switch(ability.type){
 case "tactical_control":return tacticalChoices(a,b,actors,round,ability,weapon).length>0;
 case "strike":return !a.counter&&d<=(ability.range??weapon.range)&&d>=(ability.minRange??0)&&(!ability.maxHP||ratio(a)<=ability.maxHP)&&
  (ability.effect!=="control"||kitControlAllowed(b,round))&&(ability.effect!=="bleed"||!b.bleed)&&(!ability.siphon||round>=(a.nextHealRound??0))&&(ability.effect!=="shadow_hex"||!b.kitDisruptUntil);
 case "self_boon":return selfBoonMode(a,actors)==="guard"?a.classGuard<ability.amount*kitStrength(a)&&threatened(a,actors):a.classBuff<ability.amount*kitStrength(a)&&d<=weapon.range;
 case "siege_charge":return !a.counter&&!a.kitSiege&&d<=ability.range&&siegeNeighbors(a,b,actors).length>0;
 case "support_buff":return supportChoices(a,actors,ability,supportMode(a,actors,ability)).length>0;
 case "seal":return sealChoices(a,b,actors,round,ability).length>=2;
 case "ally_heal":return healChoices(a,actors,round,ability).length>0;
 case "group_heal":{const choices=healChoices(a,actors,round,ability);return choices.length>=2&&(tankPriorityActor(a)&&choices[0].role==="tank"||ratio(choices[0])>=B.healEmergency);}
 case "sanctuary":return sanctuaryChoices(a,actors,round,ability).length>0;
 case "blood_pact":return pactChoices(a,actors,ability).length>0;
 case "brace":return !a.kitBraceUntil&&actors.some(x=>x.side!==a.side&&alive(x)&&dist(a,x)<=1&&["ironfist","scrapbreaker","dreadguard","linebreaker","frostweaver"].includes(x.classId));
 case "totem":return !a.kitTotemUntil&&(stance==="balanced"?d>weapon.range&&!a.kitSlowUntil:d<=weapon.range+1);
 case "disrupt":return d===0&&!b.kitDisruptUntil&&!b.stagger;
 case "dash":return d>weapon.range&&!a.kitSlowUntil;
 case "retreat":return d<2&&a.retreats>0&&terrain.retreatSpace>0;
 case "focus":return d>=1&&d<=weapon.range&&a.kitStationary>=2&&!a.kitFocusUntil&&terrain.lineOfSight>0;
 case "ward":return ratio(a)<ability.threshold&&!a.classGuard;
 case "self_heal":return ratio(a)<ability.threshold&&round>=(a.nextHealRound??0);
 case "sacrifice":return ratio(a)>.55&&actors.some(x=>x!==a&&x.side===a.side&&alive(x)&&dist(a,x)<=2&&ratio(x)<threshold&&round>=(x.nextHealRound??0));
 default:return false;
 }
}
function perform(a,b,actors,round,ability,weapon,ctx){
 const s=kitStrength(a),record=(x,type,extra={})=>ctx.record(a,x,type,{ability:ability.id,...extra});
 if(ability.type==="strike"){
  const actual=ctx.intercept(a,b,ability.range??weapon.range);
  if(actual!==b)ctx.record(actual,a,"intercept",{protected:b.id,ability:ability.id});
  let clean=false,hit=0;
  resolveStrike(a,actual,{active:{...weapon,range:ability.range??weapon.range,recovery:ability.recovery??weapon.recovery,damageScale:ability.scale*s,guardPierce:ability.guardPierce===true,familiar:ability.familiar===true},bow:weapon.move==="shot",distance:Math.min(2,dist(a,actual)),terrain:ctx.terrain,roll:ctx.roll,speedRoll:ctx.speedRoll,
   record:(x,y,t,e={})=>{if(x===a&&y===actual&&["hit","finisher"].includes(t)&&e.damage>0){clean=true;hit=e.damage;}ctx.record(x,y,t,{ability:ability.id,...e});},interruptApproach:x=>{x.approach=0;},onBleed:(x,y)=>{y.bleedSource=x.id;}});
  if(clean&&alive(actual)&&(!ability.effect||classStatusLands(a,actual,weapon.type,ctx.roll))){
   if(ability.effect==="open"){actual.guardOpen=Math.max(actual.guardOpen,2);record(actual,"guard_open");}
   if(ability.effect==="slow"){actual.kitSlowUntil=Math.max(actual.kitSlowUntil??0,round+B.slowDuration+1);record(actual,"slow");}
   if(ability.effect==="bleed"){actual.bleed=Math.max(actual.bleed,3);actual.bleedSource=a.id;record(actual,"deep_wound");}
   if(ability.effect==="shadow_hex"){kitStatus(actual,"classWeaken","weakenUntil",B.shadeWeakness*s,round);actual.kitDisruptUntil=round+B.disruptDuration+1;actual.targetId=null;record(actual,"weaken");record(actual,"misdirection");}
   if(ability.effect==="weaken"){kitStatus(actual,"classWeaken","weakenUntil",.18*s,round);record(actual,"weaken");}
   if(ability.effect==="physical_vulnerability"&&applyControl(actual,"physical_vulnerability",round,a))record(actual,"physical_vulnerability");
   if(ability.effect==="control"&&kitControlAllowed(actual,round)){actual.stagger=Math.max(actual.stagger,1);actual.classControlUntil=round+kitControlDuration(actual);record(actual,"control");}
  }
  if(clean&&ability.siphon){
   const fraction=Math.min(B.siphonMaxHP,hit*ability.siphon/a.maxHP);
   const amount=kitHeal(a,a,fraction,round);if(amount)record(a,"heal",{healing:amount,fromDamage:hit});
  }
  if(clean&&(ability.splash||ability.spreadSlow||ability.spreadControl)){
   const nearby=actors.filter(x=>x!==actual&&alive(x)&&x.side!==a.side&&dist(actual,x)<=1&&dist(a,x)<=(ability.range??weapon.range)+1).slice(0,2);
   for(const x of nearby){
    if(ability.splash){
     const raw=hit*combatDamageFactor(a,x,weapon)/combatDamageFactor(a,actual,weapon)*ability.splash*(a.classId==="flameweaver"?1+(B.flameSplash-1)*s:1)*(1-Math.min(80,protection(x,weapon.type))/100)/(1+intactArmourSum(x,"resistance")*.15)*statMagicDamageFactor(x,weapon.type)-flatGuard(x)*.1;
     const damage=wound(a,x,Math.max(1,Math.round(raw)));record(x,"splash",{damage});
    }
    if(ability.spreadControl&&alive(x)&&classStatusLands(a,x,weapon.type,ctx.roll)&&applyControl(x,"stun",round,a))record(x,"stun");
    if(ability.spreadSlow&&alive(x)&&classStatusLands(a,x,weapon.type,ctx.roll)){x.kitSlowUntil=Math.max(x.kitSlowUntil??0,round+B.slowDuration+1);record(x,"slow");}
   }
  }
  return true;
 }
 switch(ability.type){
 case "tactical_control":{
  const choices=tacticalChoices(a,b,actors,round,ability,weapon),first=choices[0];if(!first)return false;
  const effect=ability.effect,targets=ability.area?choices.filter(x=>dist(first,x)<=1).slice(0,3):[first];
  for(const x of targets){
   if(effect==="cleanse"){clearControl(x);x.bleed=0;x.stagger=0;x.classWeaken=0;x.weakenUntil=0;x.kitSlowUntil=0;x.kitDisruptUntil=0;record(x,"cleanse");continue;}
   if(!classStatusLands(a,x,ability.physical?"physical":"magic",ctx.roll)){record(x,"resist",{effect});continue;}
   if(ability.physical&&x.role==="tank"&&x.shield.hp>0&&!x.guardOpen&&ctx.roll()<.65){record(x,"resist",{effect,shield:true});continue;}
   if(effect==="dispel"){x.classBuff=0;x.classGuard=0;x.buffUntil=0;x.guardUntil=0;x.kitTempoUntil=0;x.kitFocusUntil=0;x.kitPactUntil=0;x.kitBraceUntil=0;record(x,"dispel");continue;}
   if(applyControl(x,effect,round,a)){record(x,effect,{until:x.controlEffects[effect]});if(a.classId==="gravebinder"&&effect==="gloom"&&applyControl(x,"antiheal",round,a))record(x,"antiheal",{until:x.controlEffects.antiheal});}
  }
  return true;
 }
 case "self_boon":{
  const guard=selfBoonMode(a,actors)==="guard",key=guard?"classGuard":"classBuff",until=guard?"guardUntil":"buffUntil";
  kitStatus(a,key,until,ability.amount*s,round,ability.duration);record(a,guard?"ward":"buff",{magnitude:a[key],until:a[until]});return true;
 }
 case "siege_charge":a.kitSiege={targetId:b.id,ready:round+2,expires:round+3};record(b,"siege_charge",{readyRound:round+2});return true;
 case "support_buff":{
  const mode=supportMode(a,actors,ability),targets=supportChoices(a,actors,ability,mode).slice(0,ability.maxTargets);
  if(!targets.length)return false;
  const duration=ability.duration+(a.classId==="warcaller"?B.chantExtraDuration:0),amount=supportAmount(a,ability);
  for(const x of targets){
   const guard=mode==="guard",key=guard?"classGuard":"classBuff",until=guard?"guardUntil":"buffUntil";
   kitStatus(x,key,until,amount,round,duration);
   if(mode==="tempo"||mode==="magic_tempo"){x.kitTempoUntil=round+duration;if([7,8,9,10].includes(a.groupCombatRules))x.kitMagicTempo=mode==="magic_tempo";record(x,"tempo",{until:x.kitTempoUntil});}
   record(x,guard?"ward":"buff",{magnitude:x[key],until:x[until]});
  }
  return true;
 }
 case "seal":{
  const targets=sealChoices(a,b,actors,round,ability).slice(0,ability.maxTargets);if(targets.length<2)return false;
  for(const x of targets){
   if(!classStatusLands(a,x,"magic",ctx.roll)){record(x,"resist");continue;}
   if(pilotKit(x)){
    const slot=x.kitReady.primary<=x.kitReady.secondary?"primary":"secondary";
    x.kitReady[slot]=Math.max(round,x.kitReady[slot])+1;
    record(x,"seal",{delayedSlot:slot,readyRound:x.kitReady[slot]});
   }else{x.readyRound=Math.max(round,x.readyRound)+1;record(x,"seal",{readyRound:x.readyRound});}
   x.kitSealUntil=round+B.sealImmunity;
  }
  return true;
 }
 case "ally_heal":case "group_heal":{
  const targets=healChoices(a,actors,round,ability).slice(0,ability.type==="group_heal"?3:1);
  let used=false;
  for(const x of targets){
   const amount=kitHeal(a,x,ability.amount*statHealing(a),round);if(!amount)continue;
   used=true;record(x,"heal",{healing:amount});
   if(ability.cleanse&&harmful(x)){clearControl(x);x.bleed=0;x.stagger=0;x.classWeaken=0;x.weakenUntil=0;x.kitSlowUntil=0;x.kitDisruptUntil=0;record(x,"cleanse");}
   if(ability.pact&&x.role==="melee"){x.kitPactUntil=round+3;x.kitPactFraction=B.pactDamageFraction*s;record(x,"blood_pact");}
   if(ability.boon){kitStatus(x,"classBuff","buffUntil",ability.boon*s,round);record(x,"buff",{magnitude:x.classBuff});}
  }
  return used;
 }
 case "sanctuary":{
  const x=sanctuaryChoices(a,actors,round,ability)[0];if(!x)return false;
  x.kitBraceUntil=round+ability.duration+1;record(x,"sanctuary",{until:x.kitBraceUntil});return true;
 }
 case "blood_pact":{
  const x=pactChoices(a,actors,ability)[0];if(!x)return false;
  x.kitPactUntil=round+ability.duration+1;x.kitPactFraction=B.pactDamageFraction*s;
  record(x,"blood_pact",{until:x.kitPactUntil,fraction:x.kitPactFraction});return true;
 }
 case "brace":a.kitBraceUntil=round+ability.duration+1;record(a,"brace",{until:a.kitBraceUntil});return true;
 case "totem":a.kitTotemMode=a.activeTactic??"balanced";a.kitTotemUntil=round+ability.duration+1;record(a,"totem",{mode:a.kitTotemMode,until:a.kitTotemUntil});return true;
 case "disrupt":if(!classStatusLands(a,b,weapon.type,ctx.roll)){record(b,"resist");return true;}b.kitDisruptUntil=round+B.disruptDuration+1;b.targetId=null;record(b,"misdirection");return true;
 case "dash":{
  let moved=0;for(let i=0;i<2&&dist(a,b)>weapon.range;i++){if(!ctx.move(a,b,false))break;moved++;}
  if(!moved)return false;a.approach=0;record(b,"dash",{tiles:moved});return true;
 }
 case "retreat":if(!ctx.move(a,b,true))return false;a.retreats--;a.approach=0;record(b,"retreat",{tiles:1});return true;
 case "focus":a.kitFocusUntil=round+B.focusDuration+1;record(a,"focus");return true;
 case "ward":kitStatus(a,"classGuard","guardUntil",ability.amount*s,round);record(a,"ward");return true;
 case "self_heal":{const amount=kitHeal(a,a,ability.amount,round);if(!amount)return false;record(a,"heal",{healing:amount});return true;}
 case "sacrifice":{
  const stance=a.activeTactic??"balanced",threshold=stance==="defensive"?.85:stance==="aggressive"?.50:.70;
  const ally=actors.filter(x=>x!==a&&x.side===a.side&&alive(x)&&dist(a,x)<=2&&ratio(x)<threshold&&round>=(x.nextHealRound??0)).sort((x,y)=>tankHealOrder(a,x,y)||ratio(x)-ratio(y))[0];
  if(!ally)return false;const amount=kitHeal(a,ally,Math.min(.18,(a.hp-1)/ally.maxHP),round);if(!amount)return false;
  const cost=Math.min(a.hp-1,Math.ceil(amount*.65));a.hp-=cost;record(ally,"heal",{healing:amount,selfCost:cost});return true;
 }
 default:return false;
 }
}
export function tryKitAction(a,b,actors,round,weapon,ctx){
 const kit=pilotKit(a);if(!kit||a.recovery>0||!alive(a)||!alive(b))return false;
 if(a.kitSiege){
  const charge=a.kitSiege,ability=kit.secondary;
  if(round<charge.ready)return false;
  a.kitSiege=null;
  const target=actors.find(x=>x.id===charge.targetId&&x.side!==a.side&&alive(x));
  if(round>charge.expires||!target||dist(a,target)>ability.range||a.counter){
   a.recovery=Math.max(1,a.recovery);ctx.record(a,target??null,"siege_fizzle",{ability:ability.id});return true;
  }
  ctx.record(a,target,"siege_release",{ability:ability.id});
  perform(a,target,actors,round,{...ability,type:"strike"},weapon,ctx);
  return true;
 }
 const stance=a.activeTactic??"balanced";
 // Secondary utility first when defensive or clearly needed. Aggressive
 // prioritizes actual attacks, except when a pursuit ability is the legal action.
 const urgent=kit.primary.type==="ally_heal"&&healChoices(a,actors,round,kit.primary).some(x=>ratio(x)<B.healEmergency);
 const priorityHeal=tankPriorityActor(a)&&[kit.primary,kit.secondary].some((ability,i)=>["ally_heal","group_heal"].includes(ability.type)&&round>=a.kitReady[i?"secondary":"primary"]&&eligible(a,b,actors,round,ability,weapon,ctx.terrain)&&healChoices(a,actors,round,ability)[0]?.role==="tank");
 const primaryTankHeal=priorityHeal&&["ally_heal","group_heal"].includes(kit.primary.type)&&round>=a.kitReady.primary&&eligible(a,b,actors,round,kit.primary,weapon,ctx.terrain)&&healChoices(a,actors,round,kit.primary)[0]?.role==="tank";
 const secondaryFirst=priorityHeal?!primaryTankHeal:!urgent&&(stance==="defensive"||stance==="balanced"&&(kit.secondary.type!=="strike"||kit.secondary.utility));
 for(const slot of secondaryFirst?["secondary","primary"]:["primary","secondary"]){
  const ability=kit[slot];if(round<a.kitReady[slot]||!eligible(a,b,actors,round,ability,weapon,ctx.terrain))continue;
  if(!perform(a,b,actors,round,ability,weapon,ctx))continue;
  a.kitReady[slot]=round+ability.cooldown;a.recovery=Math.max(0,a.recovery,ability.type==="strike"?0:1);
  ctx.record(a,null,"class_ability",{ability:ability.id,slot});return true;
 }
 return false;
}
