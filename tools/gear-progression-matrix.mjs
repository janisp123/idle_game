// Developer-only GEAR-RESEARCH-001. No runtime files modified.
// Run from repository root: node tools/gear-progression-matrix.mjs
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
const candidateSmith=load("smith",smith),candidateDuel=load("physical-duel",duel);
const {ARMOUR_SLOTS,armourStats}=modules.armour,{ARENAS}=modules.arenas,{arenaBenchmark}=modules.difficulty,{blankExpertise,fullExpertise,expertiseThreshold}=modules.expertise;
const styles=["greatsword","sword_shield","hammer","bow","spear"],families=["padded","leather","plate"];
const builds=styles.flatMap(style=>families.map(family=>[style,family]));
function fighter(style,family,g,q,stats,effort){
 const armour=Object.fromEntries(ARMOUR_SLOTS.map(s=>[s.id,family]));
 const item={grade:g,quality:q},equipment=Object.fromEntries([style,...ARMOUR_SLOTS.map(s=>s.id+":"+family)].map(id=>[id,item]));
 const expertise=effort==="full"?fullExpertise():Object.fromEntries(Object.keys(blankExpertise()).map(k=>[k,effort]));
 const condition=candidateSmith.equippedCondition(armour,style,equipment,expertise);
 return {name:style,loadout:style,str:stats.stat,dex:stats.stat,end:stats.stat,skill:stats.skill,gear:armourStats(armour,style),condition,gearAttack:condition.weapon.flatAttack};
}
function matrix({quality="common",effort="full",n=16,start=34959291,cross=false,selected=false}={}){
 let state=start>>>0;const seeds=Array.from({length:n},()=>state=(Math.imul(state,1664525)+1013904223)>>>0);
 const rows=Array.from({length:8},()=>Array(8).fill(null));let total=0;
 const resolve=candidateDuel.resolvePhysicalDuel;
 for(let hi=0;hi<8;hi++)for(let lo=0;lo<=hi;lo++){
 if(selected&&!(hi-lo===1||hi===7&&lo===0))continue;
 const stats=arenaBenchmark(hi),hours=effort==="prior"?expertiseThreshold(lo):effort;
 const hq=quality==="transition"?"poor":quality,lq=quality==="transition"&&hi!==lo?"masterwork":hq;
 let w=0,l=0,d=0,knock=0,breaks=0,min=Infinity,minPair="",max=0;
 for(const [style,family] of builds)for(const [ls,lf] of cross?builds:[[style,family]]){
 const a=fighter(style,family,hi,hq,stats,hours),b=fighter(ls,lf,lo,lq,stats,hours);
 let pw=0,pn=0;
 for(const arena of ARENAS)for(const seed of seeds)for(let rev=0;rev<2;rev++){
 const r=resolve(rev?b:a,rev?a:b,seed,arena);
 const win=r.outcome===(rev?"defeat":"victory"),loss=r.outcome===(rev?"victory":"defeat");
 w+=+win;l+=+loss;d+=+(!win&&!loss);pw+=+win;pn++;
 knock+=+(win&&r.reason==="knockout");breaks+=+r.events.some(e=>e.broken?.length);
 }
 const p=100*pw/pn;if(p<min){min=p;minPair=style+"/"+family+" vs "+ls+"/"+lf;}max=Math.max(max,p);
 }
 const count=w+l+d;total+=count;
 const pct=x=>+(100*x/count).toFixed(2);
 rows[hi][lo]={win:pct(w),loss:pct(l),draw:pct(d),knockoutWin:pct(knock),anyBreak:pct(breaks),min:+min.toFixed(2),minPair,max:+max.toFixed(2),count};
 if(hi!==lo)rows[lo][hi]={win:pct(l),loss:pct(w),draw:pct(d),count};
 }
 return {total,rows};
}
const scenarios={
 commonFull:matrix(),
 transitionPrior:matrix({quality:"transition",effort:"prior"}),
 crossTransitionPrior:matrix({quality:"transition",effort:"prior",n:4,start:987654321,cross:true,selected:true})
};
return scenarios;

}
console.log(JSON.stringify(run(src),null,2));
