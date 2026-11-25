// Developer-only GEAR-RESEARCH-001 arena candidate economy simulation. Normal profile, pinned production modules; no live edits.
import {execFileSync} from "node:child_process";
const ref="01362378d8aefcec3aa1fa4bb73116d9457237c3",names=["armour","difficulty","combat-skills","expertise","arenas","smith","physical-duel","combat-verdict","combat-art","combat","arena-wallet","attributes","loot","production","apprentice","engine"];
const src=Object.fromEntries(names.map(n=>[n,execFileSync("git",["show",ref+":site/play/"+n+".mjs"],{encoding:"utf8"})]));
function run(src,selected){



const modules={};

function load(name,source){
 const re={};
 const exports=[...source.matchAll(/^export (?:const|function|class|let)\s+(\w+)/gm)].map(x=>x[1]);
 source=source.replace(/^export\s*\{([^}]+)\}\s*from\s*"\.\/([^"?]+)\.mjs[^"]*";\s*/gm,(_,ids,dep)=>{for(const id of ids.split(",").map(s=>s.trim()).filter(Boolean)){const [a,b]=id.split(/\s+as\s+/);re[b??a]=modules[dep][a];}return "";});
 source=source.replace(/^import\s*\{([^}]+)\}\s*from\s*"\.\/([^"?]+)\.mjs[^"]*";\s*/gm,(_,ids,dep)=>"const {"+ids.replace(/\s+as\s+/g,":")+"}=modules["+JSON.stringify(dep)+"];\n").replace(/^export /gm,"");
 return {...new Function("modules",source+"\nreturn {"+exports.join(",")+"};")(modules),...re};
}
function patch(s,a,b){if(!s.includes(a))throw Error("missing patch: "+a);return s.replace(a,b);}
for(const name of ["armour","difficulty","combat-skills","expertise","arenas"])modules[name]=load(name,name==="difficulty"?patch(src[name],"[10,24,42,62,82,104,124,144]","[10,24,40,58,74,92,108,124]"):src[name]);
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
 let source=src[n];if(n==="arena-wallet")source=patch(source,"[12, 20, 32, 48, 68, 92, 122, 158]","[12, 20, 34, 52, 76, 112, 165, 245]");if(n==="engine")source=patch(source,'export const TIMING_PROFILE = "alpha";','export const TIMING_PROFILE = "normal";');
 modules[n]=load(n,source);}
 return {engine:modules.engine,attrs:modules.attributes,smith:modules.smith,combat:modules.combat,armour:modules.armour,difficulty:modules.difficulty,wallet:modules["arena-wallet"]};
}
const DAY=86400000,HOUR=3600000,DEFAULT_DAYS=[0,30,90,150,180],FINAL_ITEM={grade:7,quality:"masterwork"};
const styles=["greatsword","sword_shield","hammer","bow","spear"],families=["padded","leather","plate"];
function audit(smith,armour){
 const stages=prices.flatMap((_,g)=>ITEM_QUALITIES.map(quality=>({grade:g,quality})));
 const ids=[...styles,...armour.ARMOUR_SLOTS.flatMap(s=>families.map(f=>s.id+":"+f))];
 let checked=0,legal=0;const transitions=[];
 for(const id of ids)for(let i=-1;i<32;i++)for(let j=0;j<32;j++){
 const current=stages[i],target=stages[j],state={equipment:i<0?{}:{[id]:current},coins:100000000,skills:{fighting:{level:100}}};
 const x=smith.smithQuote(state,id,target),expected=i===-1?j===0:j===i+1;
 if(x.available!==expected)throw Error("eligibility "+i+" "+j);
 if(expected){if(x.cost<=0||!Number.isSafeInteger(x.cost))throw Error("charge");legal++;
 if(smith.smithQuote({...state,coins:x.cost-1},id,target).available)throw Error("insufficient funds");
 if(x.requiredFightingLevel>1&&smith.smithQuote({...state,skills:{fighting:{level:x.requiredFightingLevel-1}}},id,target).available)throw Error("level gate");
 if(id===ids[0])transitions.push({from:i,to:j,cost:x.cost});
 }checked++;
 }
 return {checked,legal,transitions,weaponTotal:transitions.filter(t=>t.from>=0).reduce((a,b)=>a+b.cost,0)};
}
function trajectory(modules, scenario, seed) {
  const {engine,attrs,smith,combat,armour,difficulty,wallet}=modules;
  const {days,claimHours,mixed,farm,id,loadout='greatsword',family='plate',income=false}=scenario;
  if(!Number.isInteger(days)||days<1||days>180||
     !Number.isInteger(claimHours*60)||claimHours<0.25||claimHours>168)
    throw new RangeError('Unsupported bounded benchmark horizon/cadence');
  const rng=combat.seededCombatRandom(seed);
  let state=engine.newGame(0), time=0, spent=0, earned=0, productiveFightMs=0;
  let firstSWeapon=null,firstSSet=null,firstSWeaponAffordable=null,firstSSetAffordable=null;
  const outcomes={bouts:0,victories:0,defeats:0,doubleDeaths:0};
  let firstAnyS=null,firstAnySAffordable=null;
  if(!armour.ARMOUR_TIERS.includes(family)||family==='none')throw new RangeError('Audit requires an actual armour family');
  const ids=[loadout,...armour.ARMOUR_SLOTS.map(slot=>slot.id+':'+family)];
  const targetSame=(item,target)=>item?.grade===target.grade&&item?.quality===target.quality;
  const snapshot=()=>({
    day:time/DAY, fightingLevel:state.skills.fighting.level,
    fightingXP:state.skills.fighting.xp,
    stats:Object.fromEntries(Object.entries(attrs.effectiveAttributeProgress(state.attributeEffort,state.skills))
      .map(([key,val])=>[key,val.value])),
    productiveFightingHours:Math.round(productiveFightMs/HOUR*100)/100,
    outcomes:{...outcomes},winRatePct:outcomes.bouts?Math.round(10000*outcomes.victories/outcomes.bouts)/100:null,
    coinsEarned:earned,coinsSpent:spent,wallet:state.coins,
    opponentGrade:difficulty.GRADES[state.difficulties.fighting??0],
    gear:Object.fromEntries(ids.map(key=>[key,state.equipment[key]??null])),
    expertise:Object.fromEntries(Object.entries(state.expertise).map(([id,units])=>[id,units/14400000]))
  });
  state=engine.setCombatLoadout(state,loadout,time,rng).state;
  const checkpoints=[snapshot()];
  state=engine.chooseActivity(state,'fighting',time,rng).state;
  const checkAffordability=()=>{
    const quotes=ids.map(key=>smith.smithQuote(state,key,FINAL_ITEM));
    const anyS=ids.map(key=>smith.smithQuote(state,key,{grade:7,quality:state.equipment[key]?.quality??'poor'}));
    if(firstAnySAffordable===null&&anyS.some(q=>q.improves&&q.affordable))firstAnySAffordable=time/DAY;
    if(firstAnyS===null&&ids.some(key=>state.equipment[key]?.grade===7))firstAnyS=time/DAY;
    if(firstSWeaponAffordable===null&&(targetSame(state.equipment[loadout],FINAL_ITEM)||(quotes[0].improves&&quotes[0].affordable)))
      firstSWeaponAffordable=time/DAY;
    if(firstSSetAffordable===null&&ids.every((key,i)=>targetSame(state.equipment[key],FINAL_ITEM)||quotes[i].improves)
       &&quotes.reduce((sum,q)=>sum+q.cost,0)<=state.coins) firstSSetAffordable=time/DAY;
  };
  const buy=(key,target)=>{
    if(targetSame(state.equipment[key],target))return;
    const quote=smith.smithQuote(state,key,target);
    if(!quote.available)return;
    const before=state.coins;
    const result=engine.buyEquipment(state,key,target,time,rng);
    if(!result.purchased)throw new Error('Available shop quote did not settle');
    state=result.state;spent+=before-state.coins;
    if(before-state.coins!==quote.cost)throw new Error('Shop quote differs from charge');
  };
  const shop=()=>{
    for(let stage=0;stage<32;stage++){
      const target={grade:Math.floor(stage/4),quality:smith.ITEM_QUALITIES[stage%4]};
      for(const key of ids)buy(key,target);
    }
    if(firstSWeapon===null&&targetSame(state.equipment[loadout],FINAL_ITEM))firstSWeapon=time/DAY;
    if(firstSSet===null&&ids.every(key=>targetSame(state.equipment[key],FINAL_ITEM)))firstSSet=time/DAY;
  };
  const end=days*DAY, claimInterval=claimHours*HOUR;
  while(time<end){
    // Return at the next configured visit, day boundary (mixed switching), or
    // report checkpoint. Weekly players do not claim/shop merely for a report.
    const nextClaim=(Math.floor(time/claimInterval)+1)*claimInterval;
    const nextDay=(Math.floor(time/DAY)+1)*DAY;
    const nextCheckpoint=DEFAULT_DAYS.find(d=>d*DAY>time)*DAY || end;
    const until=Math.min(end,nextClaim,nextCheckpoint,mixed?nextDay:end);
    const result=engine.enterGame(state,until,rng);
    state=result.state;time=until;
    if(result.offlineArena){
      const a=result.offlineArena;
      for(const key of Object.keys(outcomes))outcomes[key]+=a[key];
      earned+=a.coins;
    }
    // Use real Fighting report durations rather than calendar assumptions.
    for(const rep of result.reports??[result.report]){
      if(rep?.activity==='fighting')productiveFightMs+=rep.elapsedMs-(rep.arena?.downtimeMs??0);
    }
    if(time%claimInterval===0){
      if(engine.skillMasterOffer(state).ready.length)
        state=engine.learnFromMaster(state,time,rng).state;
      shop();
      // Fixed candidate policy: aim for a grade supported by both attributes
      // and the whole equipped build, not the former survival unlock rule.
      const stats=attrs.effectiveAttributeProgress(state.attributeEffort,state.skills);
      const avg=(stats.STR.value+stats.DEX.value+stats.END.value)/3;
      let grade=farm?0:Math.min(...ids.map(key=>state.equipment[key]?.grade??0),
        difficulty.GRADES.reduce((max,_,i)=>avg>=difficulty.arenaBenchmark(i).stat*0.90&&
          state.skills.fighting.level>=difficulty.arenaBenchmark(i).skill?i:max,0));
      if(income){
        // Once daily, choose highest estimated coin/hour, not best actual future seed.
        // The samples are a public fixed independent fixture using current stats/gear.
        grade=state.difficulties.fighting??0;
        if(time%DAY===0){
          let best=-1;
          const player=engine.desiredArenaPlayer(state);
          for(let tier=0;tier<8;tier++){
            const session=combat.startCombatSession({...player,difficulty:tier},(seed^0x49cc4b77)>>>0);
            let wins=0;
            for(let bout=0;bout<24;bout++)wins+=Number(combat.combatAtTime({...session,elapsedMs:(bout+1)*combat.BOUT_MS-1}).outcome==='victory');
            const score=wins*wallet.arenaReward(tier);
            if(score>best){best=score;grade=tier;}
          }
        }
      }
      if((state.difficulties.fighting??0)!==grade)
        state=engine.setDifficulty(state,'fighting',grade,time,rng).state;
    }
    if(mixed&&time%DAY===0&&time<end){
      const wanted=Math.floor(time/DAY)%7<5?'fighting':'mining';
      if((state.transition?.targetActivity??state.activity)!==wanted)
        state=engine.requestActivityChange(state,wanted,time,rng).state;
    }
    if(DEFAULT_DAYS.includes(time/DAY)||time===end)checkpoints.push(snapshot());
    if(state.coins!==earned-spent)throw new Error('Wallet conservation failed');
    if(outcomes.bouts!==outcomes.victories+outcomes.defeats+outcomes.doubleDeaths)
      throw new Error('Arena outcome conservation failed');
  }
  return {id,days,claimHours,mixed,farm,seed,loadout,family,income,firstAnyS,firstAnySAffordable,firstSWeaponAffordable,firstSSetAffordable,
    firstSWeapon,firstSSet,checkpoints};
}



const scenarios=selected??styles.flatMap(loadout=>families.map(family=>[loadout,family]));
const m=install("credit");
return scenarios.map(([loadout,family])=>trajectory(m,{id:"daily",days:180,claimHours:24,mixed:false,farm:false,loadout,family},20261201));

}
const selected=process.argv.slice(2).length?process.argv.slice(2).map(x=>x.split("/")):undefined;
console.log(JSON.stringify(run(src,selected),null,2));
