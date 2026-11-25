/**
 * ALPHA-GEAR-001 A0 — pre-change progression/economy baseline.
 * Developer-only. Uses real settlement, Master claims, shop and combat prizes.
 * No player save, live-code edits, or duplicate damage / reward formulas.
 */
import { mkdtemp, readdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PLAY = fileURLToPath(new URL('../../site/play/', import.meta.url));
const DAY = 86400000, HOUR = DAY / 24;
const DEFAULT_DAYS = [0,30,90,150,180];
const FINAL_ITEM = {grade:7,quality:'masterwork'};

async function withProfile(profile, run) {
  if (!['normal','alpha'].includes(profile)) throw new RangeError('Unknown timing profile');
  // Switch ONLY the existing sanctioned timing-profile constant in an isolated
  // module copy. This exercises the production normal code without changing
  // the alpha site or replacing its progression formulas with a second model.
  const dir = await mkdtemp(join(tmpdir(),'vigil-progression-'));
  try {
    for (const name of await readdir(PLAY)) {
      if (!name.endsWith('.mjs')) continue;
      await copyFile(join(PLAY,name),join(dir,name));
    }
    const enginePath = join(dir,'engine.mjs');
    const source = await readFile(enginePath,'utf8');
    const pattern = /export const TIMING_PROFILE = "(alpha|normal)";/g;
    if ([...source.matchAll(pattern)].length !== 1)
      throw new Error('Timing profile declaration changed; inspect the source before benchmarking');
    await writeFile(enginePath,source.replace(pattern,'export const TIMING_PROFILE = "'+profile+'";'));
    const load = name => import(pathToFileURL(join(dir,name)).href);
    const [engine,attrs,smith,combat,armour,difficulty] = await Promise.all(
      ['engine.mjs','attributes.mjs','smith.mjs','combat.mjs','armour.mjs','difficulty.mjs'].map(load));
    if(engine.TIMING_PROFILE!==profile) throw new Error('Incorrect timing profile');
    return await run({engine,attrs,smith,combat,armour,difficulty});
  } finally {
    await rm(dir,{recursive:true,force:true});
  }
}

export const BASELINE_SCENARIOS = Object.freeze([
  {id:'daily',days:180,claimHours:24,mixed:false,farm:false},
  {id:'weekly',days:180,claimHours:168,mixed:false,farm:false},
  {id:'mixed',days:180,claimHours:24,mixed:true,farm:false},
  {id:'rapid-farm',days:30,claimHours:1,mixed:false,farm:true}
]);

function trajectory(modules, scenario, seed) {
  const {engine,attrs,smith,combat,armour,difficulty}=modules;
  const {days,claimHours,mixed,farm,id}=scenario;
  if(!Number.isInteger(days)||days<1||days>180||
     !Number.isInteger(claimHours)||claimHours<1||claimHours>168)
    throw new RangeError('Unsupported bounded benchmark horizon/cadence');
  const rng=combat.seededCombatRandom(seed);
  let state=engine.newGame(0), time=0, spent=0, earned=0, productiveFightMs=0;
  let firstSWeapon=null,firstSSet=null,firstSWeaponAffordable=null,firstSSetAffordable=null;
  const outcomes={bouts:0,victories:0,defeats:0,doubleDeaths:0};
  const loadout='greatsword', family='plate';
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
    // This baseline predates expertise. Never invent a mastered value.
    expertise:null
  });
  const checkpoints=[snapshot()];
  state=engine.setCombatLoadout(state,loadout,time,rng).state;
  state=engine.queueStartActivity(state,'fighting',null,time,rng).state;
  const checkAffordability=()=>{
    const quotes=ids.map(key=>smith.smithQuote(state,key,FINAL_ITEM));
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
    checkAffordability();
    // Fixed transparent baseline policy: outfit one build in successive common
    // grades, then Masterwork. The farm scenario rushes S directly instead.
    if(farm) for(const key of ids)buy(key,FINAL_ITEM);
    else for(let grade=0;grade<=7;grade++){
      const target={grade,quality:'common'};
      for(const key of ids)buy(key,target);
    }
    if(!farm)for(const key of ids)buy(key,FINAL_ITEM);
    if(firstSWeapon===null&&targetSame(state.equipment[loadout],FINAL_ITEM))firstSWeapon=time/DAY;
    if(firstSSet===null&&ids.every(key=>targetSame(state.equipment[key],FINAL_ITEM)))firstSSet=time/DAY;
    checkAffordability();
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
      const grade=farm?0:Math.min(...ids.map(key=>state.equipment[key]?.grade??0),
        difficulty.GRADES.reduce((max,_,i)=>avg>=difficulty.arenaBenchmark(i).stat*0.90&&
          state.skills.fighting.level>=difficulty.arenaBenchmark(i).skill?i:max,0));
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
  return {id,days,claimHours,mixed,farm,seed,firstSWeaponAffordable,firstSSetAffordable,
    firstSWeapon,firstSSet,checkpoints};
}

export async function runBuildBaseline({profiles=['normal','alpha'],scenarios=BASELINE_SCENARIOS,seed=20261125}={}){
  const reports=[];
  for(const profile of profiles)reports.push(await withProfile(profile,modules=>({
    profile,cycleMs:modules.engine.ACTIVITIES.fighting.durationMs,
    boutMs:modules.combat.BOUT_MS,
    scenarios:scenarios.map(s=>trajectory(modules,s,seed))
  })));
  return {version:'ALPHA-GEAR-001-A2',kind:'production-engine progression and economy trajectory',
    limitations:['One deterministic seed per scenario; not a confidence interval.',
      'Fixed greatsword/plate purchase policy and target-stat/whole-build arena selection; not an optimal progression search. Selection policy changed from A1, so before/after includes that policy change.',
      'Rapid hourly visits test aggressive play, not a proven earliest possible claim.',
      'Weekly checkpoint settlements may split absence without claiming; outcomes reflect current engine.',
      'Affordability ignores skill gates; purchases enforce both.',
      'No expertise exists yet. No future values inferred.'],reports};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{console.log(JSON.stringify(await runBuildBaseline(),null,2));}
  catch(error){console.error(error);process.exitCode=1;}
}
