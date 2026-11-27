// Pure bounded class effect state; all values belong to a single bout.
import {kitActor,kitStrength,KIT_BALANCE as B} from "./class-kits.mjs";
export function prepareKitActor(a){
 if(!kitActor(a))return a;
 return {...a,kitReady:{primary:1,secondary:1},kitStationary:0,kitFocusUntil:0,kitSlowUntil:0,kitDisruptUntil:0,kitBraceUntil:0,kitTotemUntil:0,kitTotemMode:null,kitPactUntil:0,kitPactFraction:0,kitTempoUntil:0,kitSealUntil:0};
}
export function expireKitEffects(a,round){
 if(!kitActor(a))return;
 for(const key of ["kitFocusUntil","kitSlowUntil","kitDisruptUntil","kitBraceUntil","kitTotemUntil","kitPactUntil","kitTempoUntil","kitSealUntil"])if(round>=a[key])a[key]=0;
}
export function markKitMovement(a){if(kitActor(a)){a.kitStationary=0;a.kitFocusUntil=0;}}
export const kitApproach=a=>!kitActor(a)?1:(a.classId==="swiftblade"?B.swiftPursuit:a.classId==="ragebreaker"?B.ragePursuit:1)*(a.kitSlowUntil>0?(a.classId==="wellspring"?B.resilienceSlow:.5):1)*(a.kitTotemUntil>0&&a.kitTotemMode==="balanced"?B.totemApproach:1);
export const kitControlAllowed=(a,round)=>!kitActor(a)||round>=(a.classControlUntil??0)&&round>=(a.kitBraceUntil??0);
export const kitControlDuration=a=>kitActor(a)&&a.classId==="wellspring"?4:3;
export function kitPactHeal(a,damage,round){
 if(!kitActor(a)||a.role!=="melee"||!a.kitPactUntil||round>=a.kitPactUntil||damage<=0||a.hp<=0||round<(a.nextHealRound??0))return 0;
 const amount=Math.min(a.maxHP-a.hp,Math.floor(a.maxHP*B.pactMaxHP),Math.floor(damage*a.kitPactFraction));
 if(amount<=0)return 0;a.hp+=amount;a.nextHealRound=round+2;return amount;
}
export const kitTargetDisrupted=a=>kitActor(a)&&a.kitDisruptUntil>0;
export function kitStatus(a,key,until,value,round,duration=3){
 a[key]=Math.min(.40,Math.max(a[key]??0,value));a[until]=Math.max(a[until]??0,round+duration);
}
export function kitHeal(a,b,fraction,round){
 if(b.hp<=0||round<(b.nextHealRound??0))return 0;
 const amount=Math.min(b.maxHP-b.hp,Math.max(1,Math.round(b.maxHP*fraction*kitStrength(a)*(a.classId==="lifekeeper"?B.mercyHealing:1))));
 if(amount<=0)return 0;b.hp+=amount;b.nextHealRound=round+2;return amount;
}
export function kitStrikeModifiers(a,b,attack,distance){
 const m={aim:0,dodge:0,impact:1,block:0,crit:0,recovery:0,blockImpact:null,shieldChance:null,parryImpact:null};
 if(!kitActor(a)||!kitActor(b))return m;
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
 if(a.classId==="hexchief"&&b.kitSealUntil>0)m.impact*=1+(B.sealImpact-1)*s;
 if(a.kitTempoUntil>0&&attack.recovery>=3)m.recovery+=B.tempoRecovery;

 if(attack.type==="magic"){
  if(a.classId==="flameweaver")m.impact*=B.flameImpact;
  if(a.classId==="gravebinder"&&b.classWeaken>0)m.impact*=1+(B.graveCurseImpact-1)*s;
  if(a.classId==="frostweaver"){m.impact*=B.frostImpact;m.recovery+=B.frostRecovery;}
  if(a.classId==="galescourge"){m.impact*=1+(B.galeImpact-1)*s;m.recovery+=B.galeRecovery;}
 }
 return m;
}
