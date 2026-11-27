// Independent cooldowns and a single action budget for class kits.
import {pilotKit,kitStrength,KIT_BALANCE as B} from "./class-kits.mjs";
import {kitStatus,kitHeal,kitControlAllowed} from "./class-effects.mjs";
import {resolveStrike,wound,protection,intactArmourSum,flatGuard} from "./physical-actions.mjs?v=kits-001";
const dist=(a,b)=>Math.max(0,Math.abs(a.x-b.x)+Math.abs(a.y-b.y)-1);
const ratio=a=>a.hp/a.maxHP;
const alive=a=>a.hp>0;
function eligible(a,b,actors,round,ability,weapon,terrain){
 const d=dist(a,b),stance=a.activeTactic??"balanced",threshold=stance==="defensive"?.85:stance==="aggressive"?.50:.70;
 switch(ability.type){
 case "strike":return !a.counter&&d<=(ability.range??weapon.range)&&d>=(ability.minRange??0)&&(!ability.maxHP||ratio(a)<=ability.maxHP)&&
  (ability.effect!=="control"||kitControlAllowed(b,round))&&(ability.effect!=="bleed"||!b.bleed)&&(!ability.siphon||round>=(a.nextHealRound??0));
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
  resolveStrike(a,actual,{active:{...weapon,range:ability.range??weapon.range,recovery:ability.recovery??weapon.recovery,damageScale:ability.scale*s,guardPierce:ability.guardPierce===true},bow:weapon.move==="shot",distance:Math.min(2,dist(a,actual)),terrain:ctx.terrain,roll:ctx.roll,speedRoll:ctx.speedRoll,
   record:(x,y,t,e={})=>{if(x===a&&y===actual&&["hit","finisher"].includes(t)&&e.damage>0){clean=true;hit=e.damage;}ctx.record(x,y,t,{ability:ability.id,...e});},interruptApproach:x=>{x.approach=0;},onBleed:(x,y)=>{y.bleedSource=x.id;}});
  if(clean&&alive(actual)){
   if(ability.effect==="open"){actual.guardOpen=Math.max(actual.guardOpen,2);record(actual,"guard_open");}
   if(ability.effect==="slow"){actual.kitSlowUntil=Math.max(actual.kitSlowUntil??0,round+B.slowDuration+1);record(actual,"slow");}
   if(ability.effect==="bleed"){actual.bleed=Math.max(actual.bleed,3);actual.bleedSource=a.id;record(actual,"deep_wound");}
   if(ability.effect==="weaken"){kitStatus(actual,"classWeaken","weakenUntil",.18*s,round);record(actual,"weaken");}
   if(ability.effect==="control"&&kitControlAllowed(actual,round)){actual.stagger=Math.max(actual.stagger,1);actual.classControlUntil=round+3;record(actual,"control");}
  }
  if(clean&&ability.siphon){
   const fraction=Math.min(B.siphonMaxHP,hit*ability.siphon/a.maxHP);
   const amount=kitHeal(a,a,fraction,round);if(amount)record(a,"heal",{healing:amount,fromDamage:hit});
  }
  if(clean&&(ability.splash||ability.spreadSlow)){
   const nearby=actors.filter(x=>x!==actual&&alive(x)&&x.side!==a.side&&dist(actual,x)<=1&&dist(a,x)<=(ability.range??weapon.range)+1).slice(0,2);
   for(const x of nearby){
    if(ability.splash){
     const raw=hit*ability.splash*(a.classId==="flameweaver"?1+(B.flameSplash-1)*s:1)*(1-Math.min(80,protection(x,weapon.type))/100)/(1+intactArmourSum(x,"resistance")*.15)-flatGuard(x)*.1;
     const damage=wound(a,x,Math.max(1,Math.round(raw)));record(x,"splash",{damage});
    }
    if(ability.spreadSlow&&alive(x)){x.kitSlowUntil=Math.max(x.kitSlowUntil??0,round+B.slowDuration+1);record(x,"slow");}
   }
  }
  return true;
 }
 switch(ability.type){
 case "brace":a.kitBraceUntil=round+ability.duration+1;record(a,"brace",{until:a.kitBraceUntil});return true;
 case "totem":a.kitTotemMode=a.activeTactic??"balanced";a.kitTotemUntil=round+ability.duration+1;record(a,"totem",{mode:a.kitTotemMode,until:a.kitTotemUntil});return true;
 case "disrupt":b.kitDisruptUntil=round+B.disruptDuration+1;b.targetId=null;record(b,"misdirection");return true;
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
  const ally=actors.filter(x=>x!==a&&x.side===a.side&&alive(x)&&dist(a,x)<=2&&ratio(x)<threshold&&round>=(x.nextHealRound??0)).sort((x,y)=>ratio(x)-ratio(y))[0];
  if(!ally)return false;const amount=kitHeal(a,ally,Math.min(.18,(a.hp-1)/ally.maxHP),round);if(!amount)return false;
  const cost=Math.min(a.hp-1,Math.ceil(amount*.65));a.hp-=cost;record(ally,"heal",{healing:amount,selfCost:cost});return true;
 }
 default:return false;
 }
}
export function tryKitAction(a,b,actors,round,weapon,ctx){
 const kit=pilotKit(a);if(!kit||a.recovery>0||!alive(a)||!alive(b))return false;
 const stance=a.activeTactic??"balanced";
 // Secondary utility first when defensive or clearly needed. Aggressive
 // prioritizes actual attacks, except when a pursuit ability is the legal action.
 const secondaryFirst=stance==="defensive"||stance==="balanced"&&(kit.secondary.type!=="strike"||kit.secondary.utility);
 for(const slot of secondaryFirst?["secondary","primary"]:["primary","secondary"]){
  const ability=kit[slot];if(round<a.kitReady[slot]||!eligible(a,b,actors,round,ability,weapon,ctx.terrain))continue;
  if(!perform(a,b,actors,round,ability,weapon,ctx))continue;
  a.kitReady[slot]=round+ability.cooldown;a.recovery=Math.max(0,a.recovery,ability.type==="strike"?0:1);
  ctx.record(a,null,"class_ability",{ability:ability.id,slot});return true;
 }
 return false;
}
