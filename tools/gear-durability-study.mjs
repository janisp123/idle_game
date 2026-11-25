// Developer-only GEAR-RESEARCH-001. No runtime files modified.
// Run from repository root: node tools/gear-durability-study.mjs
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

const qualities=["poor","common","fine","masterwork"];
const variants=[{id:"candidate24g3q",grade:24,quality:3},{id:"moderate6g12q",grade:6,quality:12},{id:"flat0g12q",grade:0,quality:12},{id:"moderate3g12q",grade:3,quality:12}];
const resolve=candidateDuel.resolvePhysicalDuel;
function build(style,family,g,q,stats,effort,v,stress){
 const a=fighter(style,family,g,q,stats,effort);
 if(stress)a.end*=2;
 const maxHP=24+v.grade*g+v.quality*qualities.indexOf(q);
 const ps=[a.condition.weapon,a.condition.shield,...Object.values(a.condition.armour)].filter(Boolean);
 for(const p of ps)p.maxHP=maxHP;
 if(ps.some(p=>p.breakable!==(q!=="masterwork")))throw Error("masterwork invariant");
 return a;
}
function seeds(n,start){let s=start>>>0;return Array.from({length:n},()=>s=(Math.imul(s,1664525)+1013904223)>>>0);}
function counters(){return {n:0,win:0,draw:0,any:0,weapon:0,shield:0,shieldN:0,armour:0,armourPieces:0,timeout:0,wearWeapon:0,wearShield:0,wearArmour:0,lossWithBreak:0};}
function observe(c,r,side,style){
 c.n++;const win=r.outcome===(side==="player"?"victory":"defeat"),loss=r.outcome===(side==="player"?"defeat":"victory");
 c.win+=+win;c.draw+=+(!win&&!loss);c.timeout+=+(r.reason==="timeout");
 let w=false,s=false,ap=new Set();
 for(const e of r.events)for(const b of e.broken??[]){
 if(b==="attack weapon"&&e.actor===side||b==="guard weapon"&&e.target===side)w=true;
 else if(b==="shield"&&e.target===side)s=true;
 else if(["head","torso","arms","legs"].includes(b)&&e.target===side)ap.add(b);
 }
 const any=w||s||ap.size>0;c.any+=+any;c.weapon+=+w;c.shield+=+s;c.shieldN+=+(style==="sword_shield");c.armour+=+(ap.size>0);c.armourPieces+=ap.size;c.lossWithBreak+=+(loss&&any);
 const last=r.events.at(-1).vitals[side];
 c.wearWeapon+=1-last.weapon/last.weaponMax;
 c.wearShield+=last.shieldMax?1-last.shield/last.shieldMax:0;
 c.wearArmour+=1-last.armour/last.maxArmour;
}
function sum(a,b){for(const k of Object.keys(a))a[k]+=b[k];return a;}
function summary(c){const pct=(x,n=c.n)=>n?+(100*x/n).toFixed(2):null;return {n:c.n,win:pct(c.win),draw:pct(c.draw),anyBreak:pct(c.any),weaponBreak:pct(c.weapon),shieldBreak:pct(c.shield,c.shieldN),armourBreak:pct(c.armour),armourPiecesBrokenPer100:pct(c.armourPieces),meanWeaponWear:pct(c.wearWeapon),meanShieldWear:pct(c.wearShield,c.shieldN),meanArmourWear:pct(c.wearArmour),timeout:pct(c.timeout),lossWithBreak:pct(c.lossWithBreak)};}
function sweep(v,stress=false){
 const data=[],byQuality=Object.fromEntries(qualities.map(q=>[q,counters()])),byStyle=Object.fromEntries(styles.map(s=>[s,counters()]));let total=0;
 for(let g=0;g<8;g++)for(const q of qualities){
 const stats=arenaBenchmark(g),c=counters(),worst=[];
 const subjects=stress?builds.filter(([s])=>s==="sword_shield"):builds;
 const opponents=stress?builds.filter(([s])=>s==="hammer"):builds;
 const seedList=seeds(stress?8:2,stress?17711882:20261126);
 for(const [style,family] of subjects){
 const sub=counters();
 const a=build(style,family,g,q,stats,"full",v,stress);
 for(const [os,of] of opponents){
 const b=build(os,of,g,"common",stats,"full",v,stress);
 for(const arena of ARENAS)for(const seed of seedList)for(let rev=0;rev<2;rev++){
 const r=resolve(rev?b:a,rev?a:b,seed,arena);observe(sub,r,rev?"enemy":"player",style);
 }}
 sum(c,sub);sum(byStyle[style],sub);worst.push({style,family,...summary(sub)});
 }
 if(q==="masterwork"&&(c.any||c.wearWeapon||c.wearShield||c.wearArmour))throw Error("Masterwork wear detected");
 sum(byQuality[q],c);total+=c.n;
 data.push({grade:g,quality:q,maxHP:24+v.grade*g+v.quality*qualities.indexOf(q),...summary(c),worstBuild:worst.sort((a,b)=>b.anyBreak-a.anyBreak)[0]});
 }
 return {variant:v,stress,total,data,byQuality:Object.fromEntries(Object.entries(byQuality).map(([q,c])=>[q,summary(c)])),byStyle:Object.fromEntries(Object.entries(byStyle).filter(([,c])=>c.n).map(([s,c])=>[s,summary(c)]))};
}
function transitions(v){
 const result=[];let total=0;
 for(let g=1;g<8;g++){
 const c=counters(),stats=arenaBenchmark(g),effort=expertiseThreshold(g-1);
 for(const [s,f] of builds)for(const [os,of] of builds){
 const a=build(s,f,g,"poor",stats,effort,v,false),b=build(os,of,g-1,"masterwork",stats,effort,v,false);
 for(const arena of ARENAS)for(const seed of seeds(2,8093123))for(let rev=0;rev<2;rev++){
 const r=resolve(rev?b:a,rev?a:b,seed,arena);observe(c,r,rev?"enemy":"player",s);
 }}
 total+=c.n;result.push({grade:g,...summary(c)});
 }
 return {total,result};
}
return variants.map(v=>({regular:sweep(v),stress:sweep(v,true),transitions:transitions(v)}));

}
console.log(JSON.stringify(run(src),null,2));
