// Developer-only combined mechanic audit and legacy parry fallback proof.
import {execFileSync} from "node:child_process";
const ref="01362378d8aefcec3aa1fa4bb73116d9457237c3",names=["armour","difficulty","combat-skills","expertise","arenas","smith","physical-duel","combat-verdict","combat-art","combat","arena-wallet"];
const src=Object.fromEntries(names.map(n=>[n,execFileSync("git",["show",ref+":site/play/"+n+".mjs"],{encoding:"utf8"})]));
function run(src,snapshots,validation){








const modules={};

function load(name,source){
 const re={};
 const exports=[...source.matchAll(/^export (?:const|function|class|let)\s+(\w+)/gm)].map(x=>x[1]);
 source=source.replace(/^export\s*\{([^}]+)\}\s*from\s*"\.\/([^"?]+)\.mjs[^"]*";\s*/gm,(_,ids,dep)=>{for(const id of ids.split(",").map(s=>s.trim()).filter(Boolean)){const [a,b]=id.split(/\s+as\s+/);re[b??a]=modules[dep][a];}return "";});
 source=source.replace(/^import\s*\{([^}]+)\}\s*from\s*"\.\/([^"?]+)\.mjs[^"]*";\s*/gm,(_,ids,dep)=>"const {"+ids.replace(/\s+as\s+/g,":")+"}=modules["+JSON.stringify(dep)+"];\n").replace(/^export /gm,"");
 return {...new Function("modules",source+"\nreturn {"+exports.join(",")+"};")(modules),...re};
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



const originalStats=[10,24,42,62,82,104,124,144];
const npcCurves=[
{id:"original",stats:originalStats},
{id:"gentle",stats:[10,24,42,60,78,98,116,132]},
{id:"medium",stats:[10,24,40,58,74,92,108,124]},
{id:"strong",stats:[10,23,38,54,70,86,102,116]}
];
const rewardCurves=[
{id:"original",prizes:[12,20,32,48,68,92,122,158]},
{id:"targeted",prizes:[12,20,32,48,68,92,122,185]},
{id:"moderate",prizes:[12,20,34,52,76,112,165,245]},
{id:"steep",prizes:[12,21,37,60,95,145,220,340]}
];
for(const [a,b] of [["constriction * AIM.clearance","constriction * AIM.clearance * (actor.loadout==='greatsword'?1-.55*(equipped?Math.min(1,Math.max(0,((activePiece.damageMultiplier??1)-1)/5)):0):1)"],["constriction>0?TACTICS.constrainedSwing:TACTICS.openSwing","constriction>0?TACTICS.constrainedSwing+.13*(equipped?Math.min(1,Math.max(0,((activePiece.damageMultiplier??1)-1)/5)):0):TACTICS.openSwing"],["GUARD.parry:GUARD.recoveringParry","GUARD.parry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5):GUARD.recoveringParry+.03*Math.min(1,(target.weapon.damageMultiplier-1)/5)"],["power: 17, recovery: 3","power: 16, recovery: 3"],["gradeScale: .72, strengthScale: .90","gradeScale: .80, strengthScale: .90"]])duel=patch(duel,a,b);
for(const [a,b] of [["plate:1.05","plate:1.15"]])smith=patch(smith,a,b);
modules.smith=load("smith",patch(smith,"24 + power * 3 + 12*item.grade","24 + 3*item.grade + 12*ITEM_QUALITIES.indexOf(item.quality)"));
modules["physical-duel"]=load("physical-duel",duel);
const gearSmith=modules.smith,armour=modules.armour,expertiseModule=modules.expertise;
const originalBench=modules.difficulty.arenaBenchmark;
const builds=["greatsword","sword_shield","hammer","bow","spear"].flatMap(style=>["padded","leather","plate"].map(family=>[style,family]));
function install(curve){
 // Change opponent attributes only; no work multipliers, gear access or skill gates.
 modules.difficulty=load("difficulty",patch(src.difficulty,"[10,24,42,62,82,104,124,144]",JSON.stringify(curve.stats)));
 for(const n of ["combat-verdict","combat-art","combat","arena-wallet"])modules[n]=load(n,src[n]);
 return modules.combat;
}
function fighter(style,family,gear,stats,skill,expertise){
 const pieces=Object.fromEntries(armour.ARMOUR_SLOTS.map(s=>[s.id,gear[s.id+":"+family]?family:"none"]));
 const condition=gearSmith.equippedCondition(pieces,style,gear,expertise);
 return {name:"Research fighter",loadout:style,str:stats.STR,dex:stats.DEX,end:stats.END,skill,gear:armour.armourStats(pieces,style),condition,gearAttack:condition.weapon.flatAttack};
}
function measure(combat,a,d,seeds){
 let wins=0,defeats=0,draws=0;
 for(const seed of seeds){const session=combat.startCombatSession({...a,difficulty:d},seed);for(let i=0;i<32;i++){
 const r=combat.combatAtTime({...session,elapsedMs:(i+1)*combat.BOUT_MS-1});
 wins+=+(r.outcome==="victory");defeats+=+(r.outcome==="defeat");draws+=+(r.outcome==="double_death");
 }}
 if(wins+defeats+draws!==seeds.length*32)throw Error("outcome");
 return {arena:d,wins,defeats,draws,n:seeds.length*32};
}
const seeds=validation?[18737193,29382110,38193301,49172812]:[20261125,1298729031];


const original=modules["physical-duel"].resolvePhysicalDuel;
const safe=duel.replaceAll("Math.min(1,(target.weapon.damageMultiplier-1)/5)","Math.min(1,Math.max(0,((target.weapon.damageMultiplier??1)-1)/5))");
if(safe===duel||safe.includes("target.weapon.damageMultiplier-1"))throw Error("parry patch");
const fixed=load("physical-duel",safe).resolvePhysicalDuel;
const tracked=load("physical-duel",patch(safe,"if(equipped && speedRoll()<activePiece.speed)actor.recovery=Math.max(0,actor.recovery-1);","const beforeRecovery=actor.recovery;\n      const skip=equipped && speedRoll()<activePiece.speed;\n      if(skip)actor.recovery=Math.max(0,actor.recovery-1);\n      if(actor.recovery!==Math.max(0,beforeRecovery-(skip?1:0)))throw Error(\"recovery accounting\");\n      telemetry.push({equipped,speed:activePiece.speed,skip,before:beforeRecovery,after:actor.recovery});")+"\nexport const telemetry=[];\n");

const arena=modules.arenas.ARENAS;
const result={parity:0,legacy:0,legacyChanged:0,capacityChecks:0,weaponStages:0,armourStages:0,speed:[],legacyExamples:[]};
function fullBuild(w,f,g,q){
 const item={grade:g,quality:q},gear=Object.fromEntries([[w,item],...armour.ARMOUR_SLOTS.map(s=>[s.id+":"+f,item])]);
 return fighter(w,f,gear,{STR:100,DEX:100,END:180},40,expertiseModule.fullExpertise());
}
for(const [w,f] of builds)for(let g=0;g<8;g++)for(const q of ["poor","common","fine","masterwork"]){
 const a=fullBuild(w,f,g,q);
 for(const p of [a.condition.weapon,a.condition.shield,...Object.values(a.condition.armour)].filter(Boolean)){
 if(p.maxHP!==24+3*g+12*["poor","common","fine","masterwork"].indexOf(q)||p.breakable!==(q!=="masterwork"))throw Error("condition capacity");
 if(Object.values(p).some(x=>typeof x==="number"&&!Number.isFinite(x)))throw Error("nonfinite condition");
 result.capacityChecks++;
 }
 result.weaponStages++;result.armourStages+=4;
}
let randomState=931876234;const randomSeeds=Array.from({length:64},()=>randomState=(Math.imul(randomState,1664525)+1013904223)>>>0);
for(let g of [0,3,7])for(const q of ["poor","masterwork"]){
 tracked.telemetry.length=0;
 let direct=0,observedBroken=0;
 for(const [w,f] of builds){
 const a=fullBuild(w,f,g,q),b=fullBuild("hammer","plate",g,q);
 for(const t of arena)for(let i=0;i<randomSeeds.length;i++){
 const seed=randomSeeds[i];
 const before=original(a,b,seed,t),after=fixed(a,b,seed,t),tr=tracked.resolvePhysicalDuel(a,b,seed,t);
 if(JSON.stringify(before)!==JSON.stringify(after)||JSON.stringify(after)!==JSON.stringify(tr))throw Error("instrumentation/fallback changed normal duel");
 result.parity++;direct++;
 if(after.events.some(e=>e.broken?.length))observedBroken++;
 }}
 const a=tracked.telemetry,eligible=a.filter(x=>x.equipped),broken=a.filter(x=>!x.equipped),skips=eligible.filter(x=>x.skip),actual=skips.filter(x=>x.before>x.after);
 if(broken.some(x=>x.skip)||g===0&&skips.length)throw Error("invalid skip");
 result.speed.push({g,q,direct,observedBroken,eligible:eligible.length,broken:broken.length,skips:skips.length,removed:actual.length,expected:eligible.reduce((a,x)=>a+x.speed,0),observedRate:skips.length/eligible.length});
}
for(const [w,f] of builds){
 const a=fullBuild(w,f,0,"masterwork"),b=fullBuild("greatsword","plate",0,"masterwork");
 delete b.condition.weapon.damageMultiplier;
 for(const t of arena)for(let i=0;i<12;i++){
 const seed=397813+i*719,old=original(a,b,seed,t),newR=fixed(a,b,seed,t);
 result.legacy++;
 if(JSON.stringify(old)!==JSON.stringify(newR)){result.legacyChanged++;if(result.legacyExamples.length<3)result.legacyExamples.push({w,f,arena:t.id,seed,before:old.outcome,after:newR.outcome});}
 if(newR.events.some(e=>!Number.isFinite(e.damage)))throw Error("nonfinite legacy result");
 }}
return result;

}
console.log(JSON.stringify(run(src,[],true),null,2));
