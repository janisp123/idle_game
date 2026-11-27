// Pure bounded class effect state; all values belong to a single bout.
import {kitActor,kitStrength,KIT_BALANCE as B} from "./class-kits.mjs";
export function prepareKitActor(a){
 if(!kitActor(a))return a;
 return {...a,kitReady:{primary:1,secondary:1},kitStationary:0,kitFocusUntil:0,kitSlowUntil:0,kitDisruptUntil:0,kitBraceUntil:0,kitTotemUntil:0,kitTotemMode:null,kitPactUntil:0,kitPactFraction:0,kitTempoUntil:0,kitSealUntil:0,kitSiege:null};
}
export function expireKitEffects(a,round){
 if(!kitActor(a))return;
 if([7,8,9,10].includes(a.groupCombatRules))for(const key of Object.keys(a.controlEffects??{}))if(round>=a.controlEffects[key]){delete a.controlEffects[key];if(a.controlStrength)delete a.controlStrength[key];}
 for(const key of ["kitFocusUntil","kitSlowUntil","kitDisruptUntil","kitBraceUntil","kitTotemUntil","kitPactUntil","kitTempoUntil","kitSealUntil"])if(round>=a[key])a[key]=0;
 if([7,8,9,10].includes(a.groupCombatRules)&&!a.kitTempoUntil)a.kitMagicTempo=false;
}
export function markKitMovement(a){if(kitActor(a)){a.kitStationary=0;a.kitFocusUntil=0;}}
export const kitApproach=a=>!kitActor(a)?1:(a.classId==="swiftblade"?B.swiftPursuit:a.classId==="ragebreaker"?B.ragePursuit:a.classId==="forgecaller"?B.forgeApproach:1)*((a.kitSlowUntil>0||controlActive(a,"slow"))?(a.classId==="wellspring"?B.resilienceSlow:.5):1)*(a.kitTotemUntil>0&&a.kitTotemMode==="balanced"?B.totemApproach:1);
export const kitControlAllowed=(a,round)=>!kitActor(a)||round>=(a.classControlUntil??0)&&round>=(a.kitBraceUntil??0);
export const kitControlDuration=a=>kitActor(a)&&a.classId==="wellspring"?4:3;
export function kitPactHeal(a,damage,round){
 if(!kitActor(a)||a.role!=="melee"||!a.kitPactUntil||round>=a.kitPactUntil||damage<=0||a.hp<=0||round<(a.nextHealRound??0))return 0;
 const amount=Math.min(a.maxHP-a.hp,Math.floor(a.maxHP*B.pactMaxHP),Math.floor(damage*a.kitPactFraction*healingFactor(a)));
 if(amount<=0)return 0;a.hp+=amount;a.nextHealRound=round+2;return amount;
}
export const kitTargetDisrupted=a=>kitActor(a)&&a.kitDisruptUntil>0;
export function kitStatus(a,key,until,value,round,duration=3){
 a[key]=Math.min(.40,Math.max(a[key]??0,value));a[until]=Math.max(a[until]??0,round+duration);
}
export function kitHeal(a,b,fraction,round){
 if(b.hp<=0||round<(b.nextHealRound??0))return 0;
 const amount=Math.min(b.maxHP-b.hp,Math.max(1,Math.round((b.encounterHealMaxHP??b.maxHP)*fraction*kitStrength(a)*healingFactor(b)*(a.classId==="lifekeeper"?B.mercyHealing:a.classId==="spiritcaller"?B.spiritHealing:1))));
 if(amount<=0)return 0;b.hp+=amount;b.nextHealRound=round+2;return amount;
}
export function kitStrikeModifiers(a,b,attack,distance){
 const m={aim:0,dodge:0,impact:1,block:0,crit:0,recovery:0,blockImpact:null,shieldChance:null,parryImpact:null};
 if(!kitActor(a)||!kitActor(b))return m;
 const vulnerability=attack.type==="magic"?"gloom":"physical_vulnerability";
 if(controlActive(b,vulnerability))m.impact*=1+CONTROL_BALANCE.vulnerability*(b.controlStrength?.[vulnerability]??1);
 const s=kitStrength(a),t=kitStrength(b),knife=attack.move==="knife",shot=attack.move==="shot";
 const torso=b.armour.find(p=>p.id==="torso"||p.itemId?.startsWith("torso:"));
 const plate=torso?.hp>0&&b.trainingKit?.armour?.torso==="plate";
 const shield=b.role==="tank"&&b.shield.hp>0;
 // Natural material and intact shield defence. These corrections affect v3 only.
 if(knife&&plate)m.impact*=B.daggerPlateImpact;
 if(knife&&shield&&!b.guardOpen){m.impact*=B.daggerShieldImpact;m.shieldChance=B.daggerShieldBlock;m.blockImpact=B.daggerBlockedImpact;}
 if(a.classId==="trickblade"&&knife&&!shield&&!plate)m.impact*=1+(B.opportunist-1)*s;
 if(b.classId==="swiftblade")m.dodge+=B.swiftEvasion*t;
 if(a.classId==="nightblade"&&knife){m.impact*=B.nightDamage;m.crit+=B.nightCritical*s;}
 if(shot&&a.classId==="longshot"&&a.kitStationary>=2&&distance>0){m.aim+=B.marksmanAim*s;m.impact*=1+(B.marksmanImpact-1)*s;}
 if(shot&&a.kitFocusUntil>0&&distance>0)m.aim+=B.focusAim*s;
 if(shot&&a.classId==="windbow")m.impact*=B.windImpact;
 if(shot&&a.classId==="blackbow"){m.impact*=1+(B.blackImpact-1)*s;m.recovery+=1;}
 if(shield&&b.classId==="oathkeeper"&&attack.type!=="magic")m.block+=B.guardianBlock*t;
 if(b.classId==="grimwarden"&&b.hp/b.maxHP<.45)m.impact*=1-B.grimLowHPGuard*t;
 if(b.classId==="grovewarden"&&attack.type==="magic")m.impact*=1-B.groveMagicGuard*t;
 if(a.classId==="blademaster"&&attack.guardPierce&&a.weapon.hp>0){m.blockImpact=B.bladeBlockImpact;m.parryImpact=B.bladeParryImpact;}
 if(a.classId==="linebreaker"&&attack.move==="thrust")m.impact*=distance===1?1+(B.lineReachImpact-1)*s:distance===0?B.lineContactImpact:1;
 if(a.classId==="ragebreaker"&&attack.move==="axe"&&a.hp/a.maxHP<=B.rageThreshold)m.impact*=1+(B.rageImpact-1)*s;
 if(a.classId==="ironfist"&&a.kitTotemUntil>0&&a.kitTotemMode==="aggressive")m.impact*=1+(B.totemImpact-1)*s;
 if(b.classId==="ironfist"&&b.kitTotemUntil>0&&b.kitTotemMode==="defensive")m.impact*=1-B.totemGuard*t;
 if(a.classId==="scrapbreaker"&&attack.type==="blunt"&&plate&&a.weapon.hp>0)m.impact*=1+(B.scrapPlateImpact-1)*s;
 if(a.classId==="lifekeeper")m.impact*=B.mercyImpact;
 if(a.classId==="wardchanter")m.impact*=B.wardchanterImpact;
 if(a.classId==="warcaller")m.impact*=B.warcallerImpact;
 if(a.classId==="beastcaller")m.impact*=attack.familiar?1+(B.beastFamiliarImpact-1)*s:B.beastDirectImpact;
 if(a.classId==="spiritcaller")m.impact*=B.spiritImpact;
 if(a.classId==="shadebinder"){m.impact*=B.shadeImpact;if(b.kitDisruptUntil>0)m.aim+=B.shadeDisruptAim*s;}
 if(a.classId==="forgecaller")m.impact*=B.forgeImpact;
 if(b.classId==="forgecaller"&&plate&&attack.type!=="magic")m.impact*=1-B.forgePlateGuard*t;
 if(a.classId==="hexchief"&&b.kitSealUntil>0)m.impact*=1+(B.sealImpact-1)*s;
 if(a.kitTempoUntil>0&&attack.recovery>=3&&(!a.kitMagicTempo||attack.type==="magic"))m.recovery+=B.tempoRecovery;

 if(attack.type==="magic"){
  if(a.classId==="flameweaver")m.impact*=B.flameImpact;
  if(a.classId==="gravebinder"&&b.classWeaken>0)m.impact*=1+(B.graveCurseImpact-1)*s;
  if(a.classId==="frostweaver"){m.impact*=B.frostImpact;m.recovery+=B.frostRecovery;}
  if(a.classId==="galescourge"){m.impact*=1+(B.galeImpact-1)*s;m.recovery+=B.galeRecovery;}
 }
 return m;
}

 // V7 statuses are transient, nonstacking and cannot refresh while active.
 export const CONTROL_BALANCE=Object.freeze({root:2,slow:2,stun:1,paralysis:2,silence:2,sleep:2,gloom:3,antiheal:3,physical_vulnerability:3,immunity:3,antihealFraction:.35,vulnerability:.20});
 export const controlActive=(a,key)=>[7,8,9,10].includes(a.groupCombatRules)&&Boolean(a.controlEffects?.[key]);
 export const rooted=a=>controlActive(a,"root");
 export const silenced=a=>controlActive(a,"silence");
 export const incapacitated=a=>["stun","paralysis","sleep"].find(k=>controlActive(a,k));
 export const healingFactor=a=>controlActive(a,"antiheal")?1-CONTROL_BALANCE.antihealFraction*(a.controlStrength?.antiheal??1):1;
 const hardOrMove=new Set(["root","stun","paralysis","sleep"]);
 export const controlEligible=(a,key,round)=>[7,8,9,10].includes(a.groupCombatRules)&&a.hp>0&&!controlActive(a,key)&&(!hardOrMove.has(key)||kitControlAllowed(a,round))&&(key!=="silence"||round>=(a.silenceImmuneUntil??0));
 export function applyControl(a,key,round,source){
  if(!controlEligible(a,key,round)||!CONTROL_BALANCE[key])return false;
  a.controlEffects??={};a.controlEffects[key]=round+CONTROL_BALANCE[key]+1;
  if([9,10].includes(source?.groupCombatRules)&&["gloom","antiheal","physical_vulnerability"].includes(key)){a.controlStrength??={};a.controlStrength[key]=kitStrength(source);}
  if(hardOrMove.has(key))a.classControlUntil=round+CONTROL_BALANCE[key]+CONTROL_BALANCE.immunity+1;
  if(key==="silence")a.silenceImmuneUntil=round+CONTROL_BALANCE[key]+CONTROL_BALANCE.immunity+1;
  if(key==="root")a.approach=0;
  return true;
 }
 export function clearControl(a){if([7,8,9,10].includes(a.groupCombatRules)){a.controlEffects={};if(a.controlStrength)a.controlStrength={};}}
 export const hasControl=a=>[7,8,9,10].includes(a.groupCombatRules)&&Object.keys(a.controlEffects??{}).length>0;
 export function wakeOnDamage(a){if(controlActive(a,"sleep"))delete a.controlEffects.sleep;}
