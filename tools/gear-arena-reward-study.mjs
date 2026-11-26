// Developer-only NPC/reward candidate test, pinned source and previously saved synthetic progression snapshots.
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const ref="01362378d8aefcec3aa1fa4bb73116d9457237c3",names=["armour","difficulty","combat-skills","expertise","arenas","smith","physical-duel","combat-verdict","combat-art","combat","arena-wallet"];
const src=Object.fromEntries(names.map(n=>[n,execFileSync("git",["show",ref+":site/play/"+n+".mjs"],{encoding:"utf8"})]));
const snapshots=["docs/mechanics/GEAR_DIFFICULTY_TRAJECTORIES_1.json","docs/mechanics/GEAR_DIFFICULTY_TRAJECTORIES_2.json"].flatMap(p=>JSON.parse(readFileSync(p,"utf8")).rows);
function run(src,snapshots,filter,validation=false){





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
const seeds=validation?[975318642,314159265,246813579,271828182]:[20261125,1298729031];
function runCurve(curve){
 const combat=install(curve);
 const rows=snapshots.map(s=>{
 const expertise=Object.fromEntries(Object.entries(s.expertise).map(([k,v])=>[k,Math.round(v*14400000)]));
 const a=fighter(s.style,s.family,s.gear,s.stats,s.skill,expertise);
 return {style:s.style,family:s.family,day:s.day,grade:s.grade,opts:Array.from({length:8},(_,d)=>measure(combat,a,d,seeds))};
 });
 const guards=[];
 for(const [style,family] of builds)for(let g=0;g<8;g++)for(const quality of ["poor","masterwork"]){
 const spec={grade:g,quality},gear=Object.fromEntries([[style,spec],...armour.ARMOUR_SLOTS.map(s=>[s.id+":"+family,spec])]);
 const b=originalBench(g),stats={STR:b.stat,DEX:b.stat,END:b.stat};
 const units=expertiseModule.expertiseThreshold(quality==="masterwork"?7:Math.max(0,g-1));
 const expertise=Object.fromEntries(Object.keys(expertiseModule.blankExpertise()).map(k=>[k,units]));
 const a=fighter(style,family,gear,stats,b.skill,expertise);
 guards.push({style,family,grade:g,quality,opts:[g,...(g<7?[g+1]:[]),...(g<6?[g+2]:[])].map(d=>measure(combat,a,d,seeds))});
 }
 return {curve,rows,guards,total:(rows.reduce((a,r)=>a+r.opts.length,0)+guards.reduce((a,r)=>a+r.opts.length,0))*seeds.length*32};
}
function evaluate(r,prize){
 const score=o=>o.wins/o.n*prize.prizes[o.arena]*18;
 const groups=[30,90,150,180].map(day=>{
 const rows=r.rows.filter(x=>x.day===day).map(x=>{const best=x.opts.reduce((a,b)=>score(b)>score(a)?b:a),own=x.opts[x.grade];return {style:x.style,family:x.family,grade:x.grade,bestArena:best.arena,ownWin:100*own.wins/own.n,ownIncome:score(own),bestIncome:score(best),ownRatio:score(own)/Math.max(1,...x.opts.filter(o=>o.arena<x.grade).map(score))};});
 return {day,own:rows.filter(x=>x.bestArena===x.grade).length,lower:rows.filter(x=>x.bestArena<x.grade).length,above:rows.filter(x=>x.bestArena>x.grade).length,minOwnWin:Math.min(...rows.map(x=>x.ownWin)),maxOwnWin:Math.max(...rows.map(x=>x.ownWin)),minOwnRatio:Math.min(...rows.map(x=>x.ownRatio)),maxOwnRatio:Math.max(...rows.map(x=>x.ownRatio)),rows};
 });
 const guardSummary=["poor","masterwork"].map(q=>{
 const rows=r.guards.filter(x=>x.quality===q),adj=rows.filter(x=>x.grade<7),two=rows.filter(x=>x.grade<6);
 const agg=rs=>100*rs.reduce((a,x)=>a+x.wins,0)/rs.reduce((a,x)=>a+x.n,0);
 return {quality:q,ownWin:agg(rows.map(x=>x.opts[0])),nextWin:agg(adj.map(x=>x.opts[1])),twoWin:agg(two.map(x=>x.opts[2])),nextMoreProfitable:adj.filter(x=>score(x.opts[1])>score(x.opts[0])).length,twoMoreProfitable:two.filter(x=>score(x.opts[2])>score(x.opts[0])).length,maxNextWin:Math.max(...adj.map(x=>100*x.opts[1].wins/x.opts[1].n))};
 });
 return {reward:prize,groups,guardSummary};
}
const result=npcCurves.filter(c=>!filter||filter===c.id).map(runCurve).map(r=>({...r,evaluations:rewardCurves.map(p=>evaluate(r,p))}));
return result;

}
console.log(JSON.stringify(run(src,snapshots,process.argv[2],process.argv.includes('--validate')),null,2));
