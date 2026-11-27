// Pure bounded pilot effect state; all values belong to a single bout.
import {kitActor,kitStrength,KIT_BALANCE as B} from "./class-kits.mjs";
export function prepareKitActor(a){
 if(!kitActor(a))return a;
 return {...a,kitReady:{primary:1,secondary:1},kitStationary:0,kitFocusUntil:0,kitSlowUntil:0,kitDisruptUntil:0};
}
export function expireKitEffects(a,round){
 if(!kitActor(a))return;
 for(const key of ["kitFocusUntil","kitSlowUntil","kitDisruptUntil"])if(round>=a[key])a[key]=0;
}
export function markKitMovement(a){if(kitActor(a)){a.kitStationary=0;a.kitFocusUntil=0;}}
export const kitApproach=a=>!kitActor(a)?1:(a.classId==="swiftblade"?B.swiftPursuit:1)*(a.kitSlowUntil>0?.5:1);
export const kitTargetDisrupted=a=>kitActor(a)&&a.kitDisruptUntil>0;
export function kitStatus(a,key,until,value,round,duration=3){
 a[key]=Math.min(.40,Math.max(a[key]??0,value));a[until]=Math.max(a[until]??0,round+duration);
}
export function kitHeal(a,b,fraction,round){
 if(b.hp<=0||round<(b.nextHealRound??0))return 0;
 const amount=Math.min(b.maxHP-b.hp,Math.max(1,Math.round(b.maxHP*fraction*kitStrength(a))));
 if(amount<=0)return 0;b.hp+=amount;b.nextHealRound=round+2;return amount;
}
export function kitStrikeModifiers(a,b,attack,distance){
 const m={aim:0,dodge:0,impact:1,block:0,crit:0,recovery:0,blockImpact:null,shieldChance:null};
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
 return m;
}
