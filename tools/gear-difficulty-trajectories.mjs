// Developer-only source-linked trajectory audit. No gameplay edits.
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
const ref="01362378d8aefcec3aa1fa4bb73116d9457237c3",names=["armour","difficulty","combat-skills","expertise","arenas","smith","physical-duel","combat-verdict","combat-art","combat","arena-wallet"];
const src=Object.fromEntries(names.map(n=>[n,execFileSync("git",["show",ref+":site/play/"+n+".mjs"],{encoding:"utf8"})]));
const files=["docs/mechanics/GEAR_ECONOMY_GREATSWORD_PLATE.json","docs/mechanics/GEAR_ECONOMY_HAMMER_PADDED.json","docs/mechanics/GEAR_ECONOMY_BOW_LEATHER.json","docs/mechanics/GEAR_ECONOMY_SHIELD_PLATE.json","docs/mechanics/GEAR_ECONOMY_SPEAR_PADDED.json","docs/mechanics/GEAR_ECONOMY_CREDIT_BATCH_1.json","docs/mechanics/GEAR_ECONOMY_CREDIT_BATCH_2.json","docs/mechanics/GEAR_ECONOMY_CREDIT_BATCH_3.json"];
const paths=process.argv.slice(2).length?process.argv.slice(2):files;
const trajectories=paths.flatMap(path=>JSON.parse(readFileSync(path,"utf8"))).filter(x=>x.mode==="credit"&&x.t.id==="daily").map(x=>x.t);
function run(src,trajectories){




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


modules.smith=load("smith",patch(smith,"24 + power * 3 + 12*item.grade","24 + 3*item.grade + 12*ITEM_QUALITIES.indexOf(item.quality)"));
modules["physical-duel"]=load("physical-duel",duel);
for(const n of ["combat-verdict","combat-art","combat","arena-wallet"])modules[n]=load(n,src[n]);
const {combat,smith:gearSmith,armour}=modules,wallet=modules["arena-wallet"];
const rows=[];
for(const t of trajectories)for(const c of t.checkpoints.filter(x=>x.day>0)){
 const style=t.loadout,family=t.family,pieces=Object.fromEntries(armour.ARMOUR_SLOTS.map(s=>[s.id,c.gear[s.id+":"+family]?family:"none"]));
 const equipment=Object.fromEntries(Object.entries(c.gear).filter(([,v])=>v));
 const expertise=Object.fromEntries(Object.entries(c.expertise).map(([k,v])=>[k,Math.round(v*14400000)]));
 const condition=gearSmith.equippedCondition(pieces,style,equipment,expertise);
 const grade=Math.min(...Object.values(c.gear).map(x=>x?.grade??0));
 const opts=[];
 for(let d=0;d<8;d++){
 const a={name:"Research fighter",loadout:style,str:c.stats.STR,dex:c.stats.DEX,end:c.stats.END,skill:c.fightingLevel,difficulty:d,gear:armour.armourStats(pieces,style),condition,gearAttack:condition.weapon.flatAttack};
 let wins=0,defeats=0,draws=0;
 for(const seed of [20261125,1298729031]){
 const session=combat.startCombatSession(a,seed);
 for(let i=0;i<32;i++){
 const r=combat.combatAtTime({...session,elapsedMs:(i+1)*combat.BOUT_MS-1});
 wins+=+(r.outcome==="victory");defeats+=+(r.outcome==="defeat");draws+=+(r.outcome==="double_death");
 }}
 if(wins+defeats+draws!==64)throw Error("outcome");
 opts.push({arena:d,wins,defeats,draws,winRate:100*wins/64,coinsPerHour:wins/64*wallet.arenaReward(d)*3600000/combat.BOUT_MS});
 }
 const best=opts.reduce((a,b)=>b.coinsPerHour>a.coinsPerHour?b:a);
 rows.push({style,family,day:c.day,grade,gear:c.gear,stats:c.stats,skill:c.fightingLevel,expertise:c.expertise,opts,bestArena:best.arena,bestCoins:best.coinsPerHour,ownCoins:opts[grade].coinsPerHour});
}
return {total:rows.length*8*64,rows};

}
console.log(JSON.stringify(run(src,trajectories),null,2));
