// Shared cooldown-only class action policy. Same actions for both sides.
// Candidate coefficients: deliberately central, awaiting max-only balance.
import {GROUP_CLASSES,isGroupClass} from "./battle-group-classes.mjs?v=group-001";
import {WEAPONS,resolveStrike,wound,attackComponents,protection,intactArmourSum,flatGuard} from "./physical-actions.mjs?v=kits-001";
import {COUNTERS,tacticalActor} from "./group-counter-rules.mjs";
import {kitControlAllowed,kitControlDuration} from "./class-effects.mjs";
export const GROUP_ACTION_BALANCE=Object.freeze({supportRange:3,maxTargets:3,healFraction:.16,healGradeFactor:.018,
 buff:.18,guard:.24,weaken:.16,duration:3,controlImmunity:3,masteryMin:.75,masteryMax:1});
const B=GROUP_ACTION_BALANCE;
const spec=(move,type,range,power,recovery=2)=>Object.freeze({move,type,range,power,recovery,ranged:range>=2});
const profiles=Object.freeze({
 "Twin swords":spec("twin_cut","slashing",0,12),"Dagger":spec("knife","piercing",0,9),
 "Gauntlets":spec("fist","blunt",0,9),"Great axe":spec("axe","slashing",0,16,3),
 "Staff":spec("spell","magic",2,12),"Wand":spec("spirit_bolt","magic",2,8),
 "Scepter":spec("light_bolt","magic",2,6),"Mace":spec("hex_bolt","magic",2,7),
 "Sword":spec("sword","slashing",0,8)
});
const magicRoles=["mage","healer","summoner","support"];
export const validGroupSnapshot=s=>isGroupClass(s?.classId)&&s.race===GROUP_CLASSES[s.classId].race&&s.role===GROUP_CLASSES[s.classId].role&&s.loadout===GROUP_CLASSES[s.classId].loadout&&Number.isInteger(s.classLevel)&&s.classLevel>=1&&s.classLevel<=50;
export function classWeapon(a){
 const c=GROUP_CLASSES[a.classId];
 if(!c)return null;
 return profiles[c.weaponLabel]??WEAPONS[c.loadout];
}
export function prepareClassActor(a){
 if(!a.classId)return a;
 const c=GROUP_CLASSES[a.classId];
 // Legacy equipment adapters must not accidentally grant a dagger user a shield.
 if(c.role!=="tank")a.shield={...a.shield,hp:0,maxHP:0};
 return {...a,readyRound:1,classBuff:0,classGuard:0,classWeaken:0,classControlUntil:0,
  buffUntil:0,guardUntil:0,weakenUntil:0};
}
export function expireClassEffects(a,round){
 if(!a.classId)return;
 for(const [key,until] of [["classBuff","buffUntil"],["classGuard","guardUntil"],["classWeaken","weakenUntil"]])
  if(round>=a[until])a[key]=0;
}
const hpRatio=a=>a.hp/a.maxHP;
const distance=(a,b)=>Math.max(0,Math.abs(a.x-b.x)+Math.abs(a.y-b.y)-1);
const order=(a,b)=>hpRatio(a)-hpRatio(b)||a.hp-b.hp;
const strength=a=>B.masteryMin+(B.masteryMax-B.masteryMin)*(a.classLevel-1)/49;
function status(a,key,until,value,round){a[key]=Math.max(a[key]??0,value);a[until]=Math.max(a[until]??0,round+B.duration);}
function heal(a,b,factor,record,round){
 if(tacticalActor(a)&&tacticalActor(b)&&round<(b.nextHealRound??0))return false;
 // HP and graded weapon power both matter. Never overheal or revive.
 const amount=Math.min(b.maxHP-b.hp,Math.max(1,Math.round((b.maxHP*B.healFraction+attackComponents(a,classWeapon(a),a.weapon).base*B.healGradeFactor)*factor*strength(a))));
 if(amount<=0)return false;b.hp+=amount;if(tacticalActor(b))b.nextHealRound=round+COUNTERS.healRepeatRounds;record(a,b,"heal",{healing:amount});return true;
}
const living=(actors,a,same)=>actors.filter(b=>b.hp>0&&(same?b.side===a.side:b.side!==a.side));
function supportTargets(a,actors,threshold=1){return living(actors,a,true).filter(b=>distance(a,b)<=B.supportRange&&hpRatio(b)<threshold).sort(order);}
const offensive=Object.freeze({
 burst:{scale:1.55},sweep:{scale:1.12,splash:.48},counter:{scale:1.32,guard:true},feint:{scale:1.22,open:true},
 aimed:{scale:1.40},blast:{scale:1.15,splash:.55},curse:{scale:1.12,weaken:true},familiar:{scale:1.30,buff:true},
 dash:{scale:1.26,guard:true},mobile_shot:{scale:1.20,guard:true},slow:{scale:1.08,control:true},spirit:{scale:1.12,heal:true},
 weaken:{scale:1.10,weaken:true},flank:{scale:1.48,open:true},pierce:{scale:1.45,open:true},gust:{scale:1.38,splash:.35},
 shade:{scale:1.36,weaken:true},rage_strike:{scale:1.60},rush:{scale:1.20,control:true},hex:{scale:1.03,weaken:true,splash:.35},
 break_guard:{scale:1.25,open:true},construct:{scale:1.20,guard:true}
});
// One action per turn. Ability consumes ordinary recovery plus its cooldown.
// All ranged and melee offensive abilities use the real strike resolver.
export function tryClassAction(a,target,actors,round,ctx){
 if(!validGroupSnapshot(a)||a.recovery>0||round<a.readyRound)return false;
 const c=GROUP_CLASSES[a.classId],effect=c.ability.effect,s=strength(a),stance=a.activeTactic??"balanced";
 const record=(b,type,extra={})=>ctx.record(a,b,type,{ability:effect,...extra});
 const finish=()=>{a.readyRound=round+c.ability.cooldown;a.recovery=Math.max(1,a.recovery);record(null,"class_ability");return true;};
 const threshold=stance==="aggressive"?.55:stance==="defensive"?.91:.78;
 const wounded=supportTargets(a,actors,threshold).filter(b=>!tacticalActor(a)||round>=(b.nextHealRound??0));
 if(["heal","cleanse_heal","battle_heal"].includes(effect)){
  const b=wounded[0];if(!b)return false;
  heal(a,b,effect==="heal"?1.35:effect==="cleanse_heal"?1.10:1.0,(x,y,t,e)=>record(y,t,e),round);
  if(effect==="cleanse_heal"){b.bleed=0;b.stagger=0;b.classWeaken=0;b.weakenUntil=0;}
  if(effect==="battle_heal")status(b,"classBuff","buffUntil",B.buff*.65*s,round);
  return finish();
 }
 if(["guard","ward","ward_song","blessing","war_song","chant"].includes(effect)){
  const peers=living(actors,a,true).filter(b=>distance(a,b)<=B.supportRange);
  const guarding=["guard","ward","ward_song"].includes(effect)||effect==="chant"&&stance==="defensive";
  const key=guarding?"classGuard":"classBuff",until=guarding?"guardUntil":"buffUntil";
  const choices=peers.filter(b=>(b[key]??0)===0).sort((b,d)=>guarding?order(b,d):Number(["melee","ranged","mage"].includes(d.role))-Number(["melee","ranged","mage"].includes(b.role))||d.str-b.str);
  const n=["ward_song","war_song","chant"].includes(effect)?B.maxTargets:1;
  const recipients=choices.slice(0,n);if(!recipients.length)return false;
  if(guarding&&stance==="aggressive"&&!wounded.length)return false;
  for(const b of recipients){status(b,key,until,(guarding?B.guard:B.buff)*s,round);record(b,guarding?"ward":"buff",{magnitude:b[key]});}
  return finish();
 }
 const config=offensive[effect],weapon=classWeapon(a);
 if(!config||!target||distance(a,target)>weapon.range)return false;
 // Defensive tanks preserve their signature protection before committing.
 if(config.guard&&stance==="defensive")status(a,"classGuard","guardUntil",B.guard*s,round);
 const actual=ctx.intercept(a,target);
 if(tacticalActor(a)&&actual!==target)ctx.record(actual,a,"intercept",{protected:target.id,ability:effect});
 let hit=0;
 const attack={...weapon,power:weapon.power,damageScale:config.scale*s};
 resolveStrike(a,actual,{active:attack,bow:weapon===WEAPONS.bow,distance:Math.min(2,distance(a,actual)),terrain:ctx.terrain,roll:ctx.roll,speedRoll:ctx.speedRoll,
  record:(x,y,t,e={})=>{if(x===a&&y===actual)hit+=e.damage??0;ctx.record(x,y,t,{ability:effect,...e});},interruptApproach:b=>{b.approach=0;},onBleed:(x,b)=>{b.bleedSource=x.id;}});
 if(hit){
  if(config.open)actual.guardOpen=Math.max(actual.guardOpen,2);
  if(config.weaken)status(actual,"classWeaken","weakenUntil",B.weaken*s,round);
  if(config.control&&round>=(actual.classControlUntil??0)&&kitControlAllowed(actual,round)){actual.stagger=Math.max(actual.stagger,1);actual.classControlUntil=round+kitControlDuration(actual);}
  if(config.guard)status(a,"classGuard","guardUntil",B.guard*.65*s,round);
  if(config.buff)status(a,"classBuff","buffUntil",B.buff*s,round);
  if(config.heal&&wounded.length)heal(a,wounded[0],.6,(x,y,t,e)=>record(y,t,e),round);
  if(config.splash)for(const b of living(actors,a,false).filter(b=>b!==actual&&distance(actual,b)<=1&&distance(a,b)<=weapon.range+1).slice(0,B.maxTargets-1)){
   // Splash derives from real primary strike, bounded by victim protection.
   const raw=hit*config.splash*(1-Math.min(80,protection(b,weapon.type))/100)/(1+intactArmourSum(b,"resistance")*.15)-flatGuard(b)*.1;
   const damage=wound(a,b,Math.max(1,Math.round(raw)));record(b,"splash",{damage});
  }
 }
 return finish();
}
