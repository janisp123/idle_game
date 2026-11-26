// Developer-only GEAR-RESEARCH-001. No runtime files modified.
// Run from repository root: node tools/gear-tactical-transitions.mjs
// Reads only the pinned committed baseline via git show; candidate changes are in memory.
import {execFileSync} from "node:child_process";
const ref="01362378d8aefcec3aa1fa4bb73116d9457237c3";
const names=["armour","difficulty","combat-skills","expertise","arenas","smith","physical-duel"];
const src=Object.fromEntries(names.map(name=>[name,execFileSync("git",["show",ref+":site/play/"+name+".mjs"],{encoding:"utf8"})]));
function run(src){




const modules={};
function load(name,source){
 const exports=[...source.matchAll(/^export (?:const|function|class|let)\s+(\w+)/gm)].map(x=>x[1]);
 source=source.replace(/^import \{([^}]+)\} from "\.\/([^"?]+)\.mjs[^"]*";\s*/gm,(_,names,dep)=>"const {"+names+"}=modules["+JSON.stringify(dep)+"];\n").replace(/^export /gm,"");
 return new Function("modules",source+"\nreturn {"+exports.join(",")+"};")(modules);
}
function patch(s,a,b){if(!s.includes(a))throw Error("missing patch: "+a);return s.replace(a,b);}
for(const name of ["armour","difficulty","combat-skills","expertise","arenas"])modules[name]=load(name,src[name]);
let smith=src.smith,duel=src["physical-duel"];
smith=patch(smith,"poor: 0, common: 2, fine: 5, masterwork: 9","poor: 0, common: 1, fine: 2, masterwork: 3");
smith=patch(smith,"item.grade * 3","item.grade * 4");
smith=patch(smith,"24 + power * 3","24 + power * 3 + 12*item.grade");
smith=patch(smith,smith.slice(smith.indexOf("function weaponEffects"),smith.indexOf("export function conditionProfile")), 
'function cumulative(g,effort,value){let result=0;for(let t=1;t<=g;t++)result+=(value(t)-value(t-1))*proficiency(effort,t);return result;}\n'+
'function effectiveFlat(item,effort){return cumulative(item.grade,effort,t=>4*t)+QUALITY_POWER[item.quality]*proficiency(effort,item.grade);}\n'+
'function effectiveMultiplier(item,effort){return 1+cumulative(item.grade,effort,t=>1.35**t)+1.35**item.grade*(GEAR_BALANCE.qualityFactors[item.quality]-1)*proficiency(effort,item.grade);}\n'+
'function weaponEffects(style,item,effort){const g=item.grade,C=v=>cumulative(g,effort,v);return {proficiency:proficiency(effort,g),flatAttack:Math.round(effectiveFlat(item,effort)),damageMultiplier:effectiveMultiplier(item,effort),accuracy:C(t=>t*(GEAR_BALANCE.weaponAccuracy[style]??0)+Math.max(0,t-1)*.01),penetration:C(t=>t*(GEAR_BALANCE.weaponPenetration[style]??0)),speed:C(t=>t*.02),crit:C(t=>Math.max(0,t-2)*.005),critDamage:C(t=>Math.max(0,t-3)*.03)};}\n'+
'function armourEffects(slot,family,item,effort){const g=item.grade,coverage=slot.coverage/100,C=v=>cumulative(g,effort,v);return {proficiency:proficiency(effort,g),protection:pieceProtection(slot,family),guard:Math.ceil(effectiveFlat(item,effort)/4),resistance:coverage*(effectiveMultiplier(item,effort)-1)*GEAR_BALANCE.armourResistance[family],mobility:coverage*C(t=>t*GEAR_BALANCE.armourMobility[family]),dodge:coverage*C(t=>t*GEAR_BALANCE.armourDodge[family]+Math.max(0,t-1)*.005*({padded:1,leather:.65,plate:.15}[family])),critResist:coverage*C(t=>Math.max(0,t-2)*.005),critReduction:coverage*C(t=>Math.max(0,t-3)*.03)};}\n');
duel=patch(duel,"mobility:profile?.mobility??0,dodge:profile?.dodge??0","mobility:profile?.mobility??0,dodge:profile?.dodge??0,speed:profile?.speed??0,crit:profile?.crit??0,critDamage:profile?.critDamage??0,critResist:profile?.critResist??0,critReduction:profile?.critReduction??0");
duel=patch(duel,"const roll = seededRandom(seed);","const roll = seededRandom(seed); const speedRoll=seededRandom((seed^0x85ebca6b)>>>0);");
duel=patch(duel,"const equipped=activePiece.hp>0;\n      const handling","const equipped=activePiece.hp>0;\n      if(equipped && speedRoll()<activePiece.speed)actor.recovery=Math.max(0,actor.recovery-1);\n      const handling");
duel=patch(duel,"guardRoll > 0.96",'guardRoll > 1-Math.max(0,.04+(equipped?activePiece.crit:0)-intactArmourSum(target,"critResist"))');
duel=patch(duel,"(vital ? 1.65 : 1)",'(vital ? 1+Math.max(0,.65+(equipped?activePiece.critDamage:0)-intactArmourSum(target,"critReduction")) : 1)');

smith=patch(smith,"24 + power * 3 + 12*item.grade","24 + 3*item.grade + 12*ITEM_QUALITIES.indexOf(item.quality)");
const {ARMOUR_SLOTS,armourStats}=modules.armour,{ARENAS}=modules.arenas,{arenaBenchmark}=modules.difficulty,{blankExpertise,fullExpertise,expertiseThreshold}=modules.expertise;
const styles=["greatsword","sword_shield","hammer","bow","spear"],families=["padded","leather","plate"],builds=styles.flatMap(s=>families.map(f=>[s,f]));
const variants=[{"id":"candidate"},{"id":"swing","patches":[["constrainedSwing:.85","constrainedSwing:.96"],["clearance:.12","clearance:.08"],["parry:.36","parry:.40"],["recoveringParry:.22","recoveringParry:.26"]]},{"id":"swingHammer","patches":[["constrainedSwing:.85","constrainedSwing:.96"],["clearance:.12","clearance:.08"],["parry:.36","parry:.40"],["recoveringParry:.22","recoveringParry:.26"],["power: 17, recovery: 3","power: 15, recovery: 3"]]},{"id":"targeted","patches":[["constrainedSwing:.85","constrainedSwing:1.0"],["clearance:.12","clearance:.06"],["parry:.36","parry:.40"],["recoveringParry:.22","recoveringParry:.26"],["power: 17, recovery: 3","power: 15, recovery: 3"],["power: 12, recovery: 2","power: 11, recovery: 2"]]},{"id":"scaled","patches":[["constriction * AIM.clearance","constriction * AIM.clearance * (actor.loadout==='greatsword'?1-.45*Math.min(1,(activePiece.damageMultiplier-1)/5):1)"],["constriction>0?TACTICS.constrainedSwing:TACTICS.openSwing","constriction>0?TACTICS.constrainedSwing+.11*Math.min(1,(activePiece.damageMultiplier-1)/5):TACTICS.openSwing"],["GUARD.parry:GUARD.recoveringParry","GUARD.parry+.025*Math.min(1,(target.weapon.damageMultiplier-1)/5):GUARD.recoveringParry+.025*Math.min(1,(target.weapon.damageMultiplier-1)/5)"]]},{"id":"scaledPlus","patches":[["constriction * AIM.clearance","constriction * AIM.clearance * (actor.loadout==='greatsword'?1-.55*Math.min(1,(activePiece.damageMultiplier-1)/5):1)"],["constriction>0?TACTICS.constrainedSwing:TACTICS.openSwing","constriction>0?TACTICS.constrainedSwing+.13*Math.min(1,(activePiece.damageMultiplier-1)/5):TACTICS.openSwing"],["GUARD.parry:GUARD.recoveringParry","GUARD.parry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5):GUARD.recoveringParry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5)"],["power: 17, recovery: 3","power: 16, recovery: 3"]]},{"id":"balanced","patches":[["constriction * AIM.clearance","constriction * AIM.clearance * (actor.loadout==='greatsword'?1-.55*(equipped?Math.min(1,Math.max(0,((activePiece.damageMultiplier??1)-1)/5)):0):1)"],["constriction>0?TACTICS.constrainedSwing:TACTICS.openSwing","constriction>0?TACTICS.constrainedSwing+.13*(equipped?Math.min(1,Math.max(0,((activePiece.damageMultiplier??1)-1)/5)):0):TACTICS.openSwing"],["GUARD.parry:GUARD.recoveringParry","GUARD.parry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5):GUARD.recoveringParry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5)"],["power: 17, recovery: 3","power: 16, recovery: 3"],["gradeScale: .72, strengthScale: .90","gradeScale: .80, strengthScale: .90"]],"smithPatches":[["plate:1.05","plate:1.15"]]},{"id":"balancedLite","patches":[["constriction * AIM.clearance","constriction * AIM.clearance * (actor.loadout==='greatsword'?1-.55*(equipped?Math.min(1,Math.max(0,((activePiece.damageMultiplier??1)-1)/5)):0):1)"],["constriction>0?TACTICS.constrainedSwing:TACTICS.openSwing","constriction>0?TACTICS.constrainedSwing+.13*(equipped?Math.min(1,Math.max(0,((activePiece.damageMultiplier??1)-1)/5)):0):TACTICS.openSwing"],["GUARD.parry:GUARD.recoveringParry","GUARD.parry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5):GUARD.recoveringParry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5)"],["power: 17, recovery: 3","power: 16, recovery: 3"],["gradeScale: .72, strengthScale: .90","gradeScale: .78, strengthScale: .90"]],"smithPatches":[["plate:1.05","plate:1.10"]]}];
function make(style,family,g,q,effort,smithMod){
 const stats=arenaBenchmark(g),pieces=Object.fromEntries(ARMOUR_SLOTS.map(s=>[s.id,family])),item={grade:g,quality:q};
 const equipment=Object.fromEntries([[style,item],...ARMOUR_SLOTS.map(s=>[s.id+":"+family,item])]);
 const expertise=effort==="full"?fullExpertise():Object.fromEntries(Object.keys(blankExpertise()).map(k=>[k,expertiseThreshold(Math.max(0,g-1))]));
 const condition=smithMod.equippedCondition(pieces,style,equipment,expertise);
 return {name:style,loadout:style,str:stats.stat,dex:stats.stat,end:stats.stat,skill:stats.skill,gear:armourStats(pieces,style),condition,gearAttack:condition.weapon.flatAttack};
}

const variant=variants.find(v=>v.id==="balanced");
let d=duel,s=smith;
for(const [a,b] of variant.patches)d=patch(d,a,b);
for(const [a,b] of variant.smithPatches)s=patch(s,a,b);
const sm=load("smith",s),resolve=load("physical-duel",d).resolvePhysicalDuel;
const seeds=[19372231,736892014,1246618951,3912258801,50293882,192881774,338719981,204879321];
const rows=[];
for(let hi=1;hi<8;hi++){
 const lo=hi-1,stats=arenaBenchmark(hi);
 const makeF=(w,f,g,q)=>{
 const pieces=Object.fromEntries(ARMOUR_SLOTS.map(s=>[s.id,f])),item={grade:g,quality:q};
 const equipment=Object.fromEntries([[w,item],...ARMOUR_SLOTS.map(s=>[s.id+":"+f,item])]);
 const expertise=Object.fromEntries(Object.keys(blankExpertise()).map(k=>[k,expertiseThreshold(lo)]));
 const condition=sm.equippedCondition(pieces,w,equipment,expertise);
 return {name:w,loadout:w,str:stats.stat,dex:stats.stat,end:stats.stat,skill:stats.skill,gear:armourStats(pieces,w),condition,gearAttack:condition.weapon.flatAttack};
 };
 let wins=0,losses=0,draws=0,matchedWins=0,matchedN=0;
 const pairs=[];
 for(const [w,f] of builds)for(const [ow,of] of builds){
 const a=makeF(w,f,hi,"poor"),b=makeF(ow,of,lo,"masterwork");let pw=0,pl=0,pd=0;
 for(const arena of ARENAS)for(const seed of seeds)for(let rev=0;rev<2;rev++){
 const r=resolve(rev?b:a,rev?a:b,seed,arena);const win=r.outcome===(rev?"defeat":"victory"),loss=r.outcome===(rev?"victory":"defeat");pw+=+win;pl+=+loss;pd+=+(!win&&!loss);
 }
 wins+=pw;losses+=pl;draws+=pd;if(w===ow&&f===of){matchedWins+=pw;matchedN+=pw+pl+pd;}pairs.push({w,f,ow,of,wins:pw,losses:pl,draws:pd});
 }
 rows.push({hi,lo,wins,losses,draws,matchedWins,matchedN,pairs});
}
return {variant,seeds,total:rows.reduce((a,x)=>a+x.wins+x.losses+x.draws,0),rows};

}
console.log(JSON.stringify(run(src),null,2));
