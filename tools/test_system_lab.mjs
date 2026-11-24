import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runLab,parseLabCli,LAB_MODULES } from './system-lab.mjs';
import { simulateLoot,simulateCrafting } from './simulation/resources.mjs';
import { simulateActivity,simulateAttributes,simulateMaster } from './simulation/progression.mjs';
import { simulateEquipment } from './simulation/equipment.mjs';
import { simulateQueue,simulateSave } from './simulation/queue-save.mjs';
import { allocateLoot,lootChances } from '../site/play/loot.mjs';
import { produce } from '../site/play/production.mjs';
import { newGame,chooseActivity,settle,skillMasterReadiness,learnFromMaster,
  queueStartActivity,xpToNextLevel,readSave,MAX_WAGONS } from '../site/play/engine.mjs';
import { awardAttributeTime,effectiveAttributeProgress } from '../site/play/attributes.mjs';
import { armourStats,ARMOUR_SLOTS } from '../site/play/armour.mjs';
import { seededCombatRandom } from '../site/play/combat.mjs';

test('the lab registry covers all production-backed modules and is deterministic',()=>{
  assert.deepEqual(Object.keys(LAB_MODULES).sort(),
    ['combat','activity','loot','crafting','attributes','master','equipment','queue','save'].sort());
  const config=JSON.parse(readFileSync('tools/simulation/example-scenarios.json','utf8'));
  const before=JSON.stringify(config);
  const a=runLab(config),b=runLab(config);
  assert.deepEqual(a,b);
  assert.equal(a.results.length,9);
  assert.equal(JSON.stringify(config),before,'input config should not mutate');
  assert.equal(a.results[0].outcomes.victory+a.results[0].outcomes.defeat+a.results[0].outcomes.stalemate,1000);
  assert.equal(a.results[1].module,'activity');
  assert.equal(a.results[8].validRoundtrip,true);
});

test('loot simulator mirrors original allocation and eligible tier probabilities',()=>{
  const args={activity:'mining',level:25,units:140,trials:1,seed:83};
  const report=simulateLoot(args);
  const expected=allocateLoot(args.activity,args.level,args.units,seededCombatRandom(args.seed));
  assert.deepEqual(report.produced,expected);
  assert.deepEqual(report.theoreticalProbabilities,lootChances(args.activity,args.level));
  assert.equal(Object.values(report.produced).reduce((x,y)=>x+y,0),args.units);
  const runs=simulateLoot({...args,trials:10000});
  assert.equal(runs.totalProduced,1400000);
  assert.ok(runs.produced.iron_ore>0);
  assert.ok(Math.abs(runs.observedPct.stone-100*lootChances('mining',25)[0].chance)<1.5);
  const locked=simulateLoot({activity:'mining',level:1,units:100,trials:10});
  assert.deepEqual(Object.keys(locked.produced).sort(),['iron_ore','limestone','stone']);
});

test('craft simulator uses real produce with exact conserved input and no phantom work',()=>{
  const args={activity:'construction',level:25,workCycles:90,
    inventory:{limestone:70,fuel:45},seed:199,trials:1};
  const report=simulateCrafting(args);
  const expected=produce(args.activity,args.level,args.workCycles,args.inventory,seededCombatRandom(args.seed));
  assert.deepEqual(report.created,expected.created);
  assert.deepEqual(report.consumed,expected.consumed);
  assert.equal(report.averageCompletedPerBatch,expected.completed);
  assert.equal(Object.values(report.created).reduce((a,b)=>a+b,0),expected.completed);
  const noMaterials=simulateCrafting({activity:'smithing',inventory:{},workCycles:100,trials:1000});
  assert.equal(noMaterials.averageCompletedPerBatch,0);
  assert.equal(noMaterials.blockedBatches,1000);
  assert.deepEqual(noMaterials.created,{});
});

test('offline activity matches exact production settle with frozen skill and no automatic Master visit',()=>{
  const args={activity:'mining',level:5,xp:10,elapsedMs:86400000,trials:1,seed:13579};
  const s=newGame(0);
  s.skills.mining={level:5,xp:10};
  const rng=seededCombatRandom(args.seed);
  const activated=chooseActivity(s,'mining',0,rng).state;
  const direct=settle(activated,86400000,rng);
  const output=simulateActivity(args);
  assert.equal(output.firstTrial.finishedSkills.mining.level,direct.state.skills.mining.level);
  assert.equal(output.firstTrial.finishedSkills.mining.xp,direct.state.skills.mining.xp);
  assert.deepEqual(output.firstTrial.itemChanges,
    Object.fromEntries(Object.entries(direct.state.items)
      .filter(([key,value])=>value!==activated.items[key])
      .map(([key,value])=>[key,value-activated.items[key]])));
  assert.equal(output.firstTrial.settledAtMs,86400000);
  assert.equal(output.masterReadyCount,1);
  assert.equal(output.average.earnedXP,output.gainedXP);
  const noTime=simulateActivity({activity:'foraging',elapsedMs:0,trials:2});
  assert.deepEqual(noTime.firstTrial.itemChanges,{});
  assert.equal(noTime.gainedXP,0);
});

test('attribute module uses real productive-time weights and mastery offsets',()=>{
  const args={activity:'fighting',elapsedMs:8*3600000,levels:{fighting:10}};
  const r=simulateAttributes(args);
  const s=newGame(0);s.skills.fighting={level:10,xp:0};
  const expected=awardAttributeTime(s.attributeEffort,'fighting',args.elapsedMs);
  assert.deepEqual(r.after,effectiveAttributeProgress(expected,s.skills));
  assert.equal(r.before.STR.value,effectiveAttributeProgress(s.attributeEffort,s.skills).STR.value);
  assert.ok(r.gainedXP.STR>0 && r.gainedXP.DEX>r.gainedXP.END);
});

test('Skill Master report mirrors exact readiness and confirmed resource payment',()=>{
  const args={activity:'mining',xp:40,inventory:{stone:5},claim:true};
  const report=simulateMaster(args);
  const s=newGame(0);s.skills.mining.xp=xpToNextLevel(1);s.items.stone=5;
  assert.deepEqual(report.readiness,skillMasterReadiness(s,'mining'));
  const out=learnFromMaster(s,0,seededCombatRandom(20261124));
  assert.equal(report.gainedLevels.mining,1);
  assert.equal(report.remainingInventory.stone,out.state.items.stone);
  assert.equal(report.itemsDelta.stone,-5);
  const blocked=simulateMaster({activity:'mining',xp:40,claim:true});
  assert.equal(blocked.claimPerformed,false);
  assert.equal(blocked.readiness.resourcesReady,false);
});

test('queue simulated work and travel reproduce the same source settlement exactly',()=>{
  const args={route:[{activity:'mining',plannedMs:60000},
    {activity:'woodcutting',plannedMs:null}],elapsedMs:1234567,seed:6789,trials:1};
  let s=newGame(0),rng=seededCombatRandom(args.seed);
  s=queueStartActivity(s,'mining',null,0,rng).state;
  s=queueStartActivity(s,'woodcutting',60000,0,rng).state;
  assert.equal(s.wagons.length,2);
  const expected=settle(s,args.elapsedMs,rng);
  const actual=simulateQueue(args);
  assert.equal(actual.firstTrial.finalActivity,expected.state.activity);
  assert.deepEqual(actual.firstTrial.finalQueue,expected.state.wagons);
  assert.deepEqual(actual.firstTrial.transition,expected.state.transition);
  assert.equal(MAX_WAGONS,3);
  const twentyYears=simulateQueue({route:[{activity:'mining',plannedMs:null}],
    elapsedMs:20*365*86400000,trials:1,seed:42});
  assert.ok(twentyYears.firstTrial.itemChanges.stone>0);
  assert.equal(twentyYears.firstTrial.skills.mining.xp,xpToNextLevel(1));
});

test('local save test roundtrips using readSave and never writes to player state',()=>{
  const s=newGame(0);s.items.stone=11;
  const snapshot=JSON.stringify(s);
  assert.equal(simulateSave({state:s}).validRoundtrip,true);
  assert.equal(JSON.stringify(s),snapshot);
  assert.ok(readSave(snapshot));
  assert.throws(()=>simulateSave({state:{version:123}}),RangeError);
});

test('side-by-side comparisons share actual seed and resolve both scenarios',()=>{
  const config={compare:{metric:'winRatePct',
    baseline:{module:'combat',battles:100,seed:2121},
    variant:{module:'combat',battles:100,seed:2121,loadout:'sword_shield'}}};
  const report=runLab(config);
  assert.equal(report.module,'combat');
  assert.equal(report.scenarios.length,2);
  assert.equal(report.delta,report.variant-report.baseline);
  assert.throws(()=>runLab({compare:{metric:'__proto__.bad',
    baseline:{module:'loot'},variant:{module:'crafting'}}}),RangeError);
});

test('module input validation catches impossible configurations and secrets do not enter public site',()=>{
  assert.throws(()=>runLab({module:'nonexistent'}),RangeError);
  assert.throws(()=>runLab({scenarios:Array.from({length:21},()=>({module:'save'}))}),RangeError);
  assert.throws(()=>simulateLoot({activity:'mining',level:0}),RangeError);
  assert.throws(()=>simulateCrafting({inventory:{forged_item:1}}),RangeError);
  assert.throws(()=>simulateQueue({route:[{activity:'mining',plannedMs:null},{activity:'woodcutting'}]}),RangeError);
  assert.throws(()=>simulateActivity({activity:'fighting',level:1,difficulty:2}),RangeError);
  assert.equal(readFileSync('site/play/index.html','utf8').includes('system-lab.mjs'),false);
  assert.equal(readFileSync('.github/workflows/pages.yml','utf8').includes('tools/system-lab.mjs'),false);
});

test('CLI can run multi-scenario file, JSON input and list modules',()=>{
  const out=JSON.parse(execFileSync(process.execPath,
    ['tools/system-lab.mjs','--config','tools/simulation/example-scenarios.json'],
    {encoding:'utf8',maxBuffer:10*1024*1024}));
  assert.equal(out.results.length,9);
  assert.match(execFileSync(process.execPath,['tools/system-lab.mjs','--list'],{encoding:'utf8'}),/equipment/);
  const folder=mkdtempSync(join(tmpdir(),'idle-lab-'));
  try {
    const file=join(folder,'scenario.json');
    const scenario={module:'loot',activity:'mining',level:2,trials:2};
    writeFileSync(file,JSON.stringify(scenario),'utf8');
    assert.deepEqual(parseLabCli(['--config',file]).data,scenario);
    const text=execFileSync(process.execPath,['tools/system-lab.mjs','--scenario',JSON.stringify(scenario)],{encoding:'utf8'});
    assert.equal(JSON.parse(text).results[0].trials,2);
  } finally {
    rmSync(folder,{recursive:true,force:true});
  }
});

test("equipment lab reports an actual smith purchase", () => {
  const result = simulateEquipment({ slot: "arms", gear: "padded", coins: 100, quality: "common" });
  assert.equal(result.purchased, true);
  assert.equal(result.coins, 31);
  assert.equal(result.equippedArmour.arms, "padded");
  assert.ok(result.bonuses.defense > 0);
});
