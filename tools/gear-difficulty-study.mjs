// Developer-only GEAR-RESEARCH-001 arena difficulty audit. Normal profile, pinned production modules; no live edits.
import {execFileSync} from "node:child_process";
const ref="01362378d8aefcec3aa1fa4bb73116d9457237c3",names=["armour","difficulty","combat-skills","expertise","arenas","smith","physical-duel","combat-verdict","combat-art","combat","arena-wallet","attributes","loot","production","apprentice","engine"];
const src=Object.fromEntries(names.map(n=>[n,execFileSync("git",["show",ref+":site/play/"+n+".mjs"],{encoding:"utf8"})]));
function run(src,filter){



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

const policy="export function smithQuote(state,itemId,target){\n if(!isEquipmentItem(target))throw new RangeError(\"Invalid equipment specification\");\n const current=Object.hasOwn(state.equipment??{},itemId)?state.equipment[itemId]:null;\n const q=ITEM_QUALITIES.indexOf(target.quality),cq=current?ITEM_QUALITIES.indexOf(current.quality):-1;\n const nextGrade=!!current&&target.grade===current.grade+1&&cq===3&&q===0;\n const improves=!current?target.grade===0&&q===0:target.grade===current.grade&&q===cq+1||nextGrade;\n const credit=current?equipmentPrice(current):0;\n const cost=!improves?0:!current?SMITH_BALANCE.firstArmourCost:equipmentPrice(target)-(nextGrade&&PRICE_MODE===\"noCredit\"?equipmentPrice({grade:current.grade,quality:\"poor\"}):credit);\n const requiredFightingLevel=equipmentUnlockLevel(target.grade),levelReady=(state.skills?.fighting?.level??1)>=requiredFightingLevel,affordable=cost<=state.coins;\n const reason=!improves||!Number.isSafeInteger(cost)||cost<=0?\"no_improvement\":!levelReady?\"fighting_level\":!affordable?\"coins\":null;\n return {current,cost,improves,requiredFightingLevel,levelReady,affordable,reason,available:reason===null};\n}";

const {ITEM_QUALITIES,equipmentPrice}=load("smith",src.smith);
const prices=Array.from({length:8},(_,grade)=>ITEM_QUALITIES.map(quality=>equipmentPrice({grade,quality})));
const candidateSmithSource=patch(smith,"24 + power * 3 + 12*item.grade","24 + 3*item.grade + 12*ITEM_QUALITIES.indexOf(item.quality)");
function install(mode){
 const s=patch(candidateSmithSource,candidateSmithSource.slice(candidateSmithSource.indexOf("export function smithQuote"),candidateSmithSource.indexOf("export function equipmentBonuses")),"const PRICE_MODE="+JSON.stringify(mode)+";\n"+policy+"\n");
 modules.smith=load("smith",s);
 modules["physical-duel"]=load("physical-duel",duel);
 for(const n of ["combat-verdict","combat-art","combat","arena-wallet","attributes","loot","production","apprentice","engine"]){
 let source=src[n];if(n==="engine")source=patch(source,'export const TIMING_PROFILE = "alpha";','export const TIMING_PROFILE = "normal";');
 modules[n]=load(n,source);}
 return {engine:modules.engine,attrs:modules.attributes,smith:modules.smith,combat:modules.combat,armour:modules.armour,difficulty:modules.difficulty,wallet:modules["arena-wallet"]};
}
const DAY=86400000,HOUR=3600000,DEFAULT_DAYS=[0,30,90,150,180],FINAL_ITEM={grade:7,quality:"masterwork"};
const styles=["greatsword","sword_shield","hammer","bow","spear"],families=["padded","leather","plate"];

const m=install("credit");
const {combat,smith,armour,difficulty,wallet}=m;
const {fullExpertise,blankExpertise,expertiseThreshold}=modules.expertise;
const builds=styles.flatMap(style=>families.map(family=>[style,family]));
const profiles=[
{id:"freshPoor",quality:"poor",practice:"prior",stats:"grade"},
{id:"masteredMW",quality:"masterwork",practice:"full",stats:"grade"},
{id:"overlevelledMW",quality:"masterwork",practice:"full",stats:"S"},
{id:"starterUnarmoured",quality:"poor",practice:"zero",stats:"grade",unarmoured:true}
];
function player(style,family,g,tier,p){
 const stats=difficulty.arenaBenchmark(p.stats==="S"?7:g);
 const pieces=Object.fromEntries(armour.ARMOUR_SLOTS.map(s=>[s.id,p.unarmoured?"none":family]));
 const spec={grade:g,quality:p.quality};
 const equipment=Object.fromEntries([[style,spec],...armour.ARMOUR_SLOTS.filter(s=>!p.unarmoured).map(s=>[s.id+":"+family,spec])]);
 const hours=p.practice==="full"?expertiseThreshold(7):p.practice==="prior"?expertiseThreshold(Math.max(0,g-1)):0;
 const expertise=Object.fromEntries(Object.keys(blankExpertise()).map(k=>[k,hours]));
 const condition=smith.equippedCondition(pieces,style,equipment,expertise);
 return {name:"Research fighter",loadout:style,str:stats.stat,dex:stats.stat,end:stats.stat,skill:stats.skill,difficulty:tier,gear:armour.armourStats(pieces,style),condition,gearAttack:condition.weapon.flatAttack};
}
function audit(p){
 const rows=[],seeds=[20261125,1298729031];let total=0;
 const activeBuilds=p.unarmoured?styles.map(s=>[s,"none"]):builds;
 for(let g=0;g<(p.unarmoured?1:8);g++)for(let d=0;d<8;d++){
  const perBuild=[];let wins=0,defeats=0,draws=0,ko=0;
  for(const [style,family] of activeBuilds){
   const a=player(style,family,g,d,p);let w=0,l=0,t=0,k=0;
   for(const seed of seeds){
    const session=combat.startCombatSession(a,seed);
    for(let i=0;i<32;i++){
     const r=combat.combatAtTime({...session,elapsedMs:(i+1)*combat.BOUT_MS-1});
     w+=+(r.outcome==="victory");l+=+(r.outcome==="defeat");t+=+(r.outcome==="double_death");k+=+(r.outcome==="victory"&&r.reason==="knockout");
    }
   }
   const n=w+l+t;if(n!==64)throw Error("outcome conservation");
   wins+=w;defeats+=l;draws+=t;ko+=k;
   perBuild.push({style,family,wins:w,defeats:l,draws:t,winRate:100*w/n,coinsPerHour:w/n*wallet.arenaReward(d)*3600000/combat.BOUT_MS});
  }
  const n=wins+defeats+draws;total+=n;
  rows.push({gearGrade:g,arena:d,n,wins,defeats,draws,winRate:100*wins/n,knockoutWinRate:100*ko/n,coinsPerHour:wins/n*wallet.arenaReward(d)*3600000/combat.BOUT_MS,perBuild});
 }
 const best=Array.from(new Set(rows.map(r=>r.gearGrade))).map(g=>{
  const rr=rows.filter(r=>r.gearGrade===g);
  const b=rr.map(r=>r.perBuild).flatMap((v,i)=>i===0?v.map(x=>{
   const opts=rr.map(row=>({arena:row.arena,...row.perBuild.find(z=>z.style===x.style&&z.family===x.family)}));
   const best=opts.reduce((a,b)=>b.coinsPerHour>a.coinsPerHour?b:a);
   const own=opts[g];
   return {style:x.style,family:x.family,bestArena:best.arena,bestCoins:best.coinsPerHour,ownCoins:own.coinsPerHour,bestWin:best.winRate,skip:best.arena>g,skipTwo:best.arena>=g+2};
  }):[]);
  return {gearGrade:g,bestArena:rr.reduce((a,b)=>b.coinsPerHour>a.coinsPerHour?b:a).arena,individual:b};
 });
 return {profile:p,total,rows,best};
}
return profiles.filter(p=>!filter||p.id===filter).map(audit);

}
console.log(JSON.stringify(run(src,process.argv[2]),null,2));
