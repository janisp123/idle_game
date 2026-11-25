import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BOUT_MS, combatAtTime, startCombatSession } from '../site/play/combat.mjs';
import { armourStats, ARMOUR_SLOTS } from '../site/play/armour.mjs';
import { createPlayerSnapshot, parseCliArgs, simulateBatch } from './combat-simulator.mjs';

test('the 10,000-bout runner resolves real production opponents, locations and events', () => {
  const output = simulateBatch({battles:10000,seed:20261124});
  assert.equal(Object.values(output.outcomes).reduce((a,b)=>a+b,0),10000);
  assert.equal(Object.values(output.byTerrain).reduce((a,b)=>a+b.battles,0),10000);
  assert.equal(Object.values(output.byEnemyRole).reduce((a,b)=>a+b.battles,0),10000);
  assert.equal(Object.values(output.byEnemyLoadout).reduce((a,b)=>a+b.battles,0),10000);
  assert.deepEqual(Object.keys(output.byTerrain).sort(),
    ['Open Field','Narrow Bridge','Ruined Streets','Walled Courtyard','Gatehouse Chamber'].sort());
  assert.ok(output.attacks.player > 0 && output.attacks.enemy > 0);
  assert.ok(output.winRatePct>=0 && output.winRatePct<=100);
  assert.equal(output.samples.length,0);
});

test('sampled traces equal the actual live combatAtTime events without a substitute resolver', () => {
  const args={battles:50,grade:'F',loadout:'hammer',armour:'leather',
    skill:10,str:14,dex:14,end:14,seed:892,trace:3,startBout:4};
  const output=simulateBatch(args);
  const session=startCombatSession(createPlayerSnapshot(args),args.seed);
  for (let i=0;i<output.samples.length;i++) {
    const expected=combatAtTime({...session,elapsedMs:(args.startBout+i)*BOUT_MS});
    const actual=output.samples[i];
    assert.equal(actual.bout,args.startBout+i+1);
    assert.equal(actual.outcome,expected.outcome);
    assert.equal(actual.terrain,expected.terrain.name);
    assert.equal(actual.enemyRole,expected.enemyRole);
    assert.equal(actual.enemyLoadout,expected.enemyLoadout);
    assert.deepEqual(actual.events,expected.events);
    assert.equal(actual.events[0].type, "engage");
    assert.equal(actual.events.at(-1).type, actual.outcome);
  }
  assert.deepEqual(simulateBatch(args),output);
});

test('saved session snapshots preserve frozen power, start bout, seed and exact outcome',()=>{
  const player=createPlayerSnapshot({grade:'F',loadout:'greatsword',armour:'leather',
    itemGrade:2,quality:"fine",skill:10,str:14,dex:14,end:14});
  const session={...startCombatSession(player,3377),elapsedMs:8*BOUT_MS+1200};
  const output=simulateBatch({snapshot:{combatSession:session},battles:30,trace:1});
  assert.equal(output.startBout,8);
  assert.equal(output.seed,3377);
  assert.equal(output.player.gearAttack,11);
  assert.equal(output.playerBuild,null);
  assert.deepEqual(output.samples[0].events,
    combatAtTime({...session,elapsedMs:8*BOUT_MS}).events);
});

test('invalid grades, impossible gear, forged ranks and excessive runs fail safely',()=>{
  assert.throws(()=>createPlayerSnapshot({grade:'T'}),RangeError);
  assert.throws(()=>createPlayerSnapshot({armourSlots:{unlisted:'plate'}}),RangeError);
  assert.throws(()=>simulateBatch({battles:1000001}),RangeError);
  assert.throws(()=>simulateBatch({battles:10,trace:11}),RangeError);
  assert.throws(()=>parseCliArgs(['--unknown','123']),RangeError);
  assert.throws(()=>parseCliArgs(['--armour','padded','--armour','plate']),RangeError);
  assert.throws(()=>parseCliArgs(['--snapshot','ignored.json','--grade','F']),/ENOENT/);
});

test('scenario JSON works via CLI and manual workflow never accepts uploaded saves',()=>{
  const folder=mkdtempSync(join(tmpdir(),'idle-combat-sim-'));
  try {
    const config=join(folder,'scenario.json');
    const args={battles:40,grade:'F',armour:'leather',seed:2323,trace:1};
    writeFileSync(config,JSON.stringify(args),'utf8');
    assert.deepEqual(parseCliArgs(['--config',config]),args);
    assert.throws(()=>parseCliArgs(['--config',config,'--grade','S']),RangeError);
    const raw=execFileSync(process.execPath,['tools/combat-simulator.mjs','--config',config],{encoding:'utf8'});
    assert.deepEqual(JSON.parse(raw),simulateBatch(args));
    const workflow=readFileSync('.github/workflows/combat-simulator.yml','utf8');
    assert.match(workflow,/workflow_dispatch:/);
    assert.match(workflow,/upload-artifact/);
    assert.match(workflow,/"snapshot" in data/);
    assert.ok(!workflow.includes('node -e \'eval'));
  } finally {
    rmSync(folder,{recursive:true,force:true});
  }
});

test('CLI outputs JSON and remains outside the static website package',()=>{
  const raw=execFileSync(process.execPath,['tools/combat-simulator.mjs','--battles','20',
    '--seed','992','--grade','F','--armour','leather','--trace','1'],
    {encoding:'utf8',maxBuffer:2*1024*1024});
  const output=JSON.parse(raw);
  assert.equal(output.battles,20);
  assert.equal(output.difficulty,'F');
  assert.equal(output.samples.length,1);
  const workflow=readFileSync('.github/workflows/pages.yml','utf8');
  assert.match(workflow,/path:\s*["']?\.\/site["']?/);
  assert.match(workflow,/test_combat_simulator\.mjs/);
  assert.ok(!readFileSync('site/play/index.html','utf8').includes('combat-simulator.mjs'));
});

import {newGame,desiredArenaPlayer,chooseActivity,settle,readSave} from "../site/play/engine.mjs";
import {blankExpertise,fullExpertise,EXPERTISE_BALANCE} from "../site/play/expertise.mjs";
import {COMBAT_LOADOUTS} from "../site/play/combat-skills.mjs";
import {arenaReward} from "../site/play/arena-wallet.mjs";
test("SIM-003 synthetic kits exactly match real engine snapshots, including novice and mixed armour",()=>{
  for(const loadout of Object.keys(COMBAT_LOADOUTS))for(const grade of [0,3,7])for(const mode of ["trained","novice"]){
    const state=newGame(42),spec={grade,quality:grade===7?"masterwork":"common"};
    state.combatLoadout=loadout;state.armour={head:"padded",torso:"plate",arms:"leather",legs:"none"};
    state.equipment[loadout]=spec;
    for(const [slot,family] of Object.entries(state.armour))if(family!=="none")state.equipment[slot+":"+family]=spec;
    state.skills.fighting={level:52,xp:0};state.difficulties.fighting=grade;
    const practice=mode==="novice"?blankExpertise():fullExpertise();
    practice[loadout]=1000*EXPERTISE_BALANCE.unitsPerHour;
    state.expertise={...practice};state.expertiseActive={...practice};
    const expected=desiredArenaPlayer(state);
    const synthetic=createPlayerSnapshot({grade,itemGrade:grade,quality:spec.quality,loadout,armourSlots:state.armour,
      expertiseMode:mode,expertiseHours:{[loadout]:1000},str:expected.str,dex:expected.dex,end:expected.end,skill:expected.skill});
    assert.deepEqual(synthetic,expected);
    const live=settle(chooseActivity(state,"fighting",42,()=>.5).state,43,()=>.5).state;
    assert.deepEqual(live.combatSession.player,synthetic);
    const saved=readSave(JSON.stringify(live));assert.ok(saved);
    const before=JSON.stringify(saved);
    const report=simulateBatch({snapshot:saved,battles:8,trace:2});
    const end=settle(saved,42+8*BOUT_MS,()=>.5);
    assert.equal(report.coins,end.state.coins-saved.coins);
    assert.equal(report.coins,report.outcomes.victory*arenaReward(grade));
    assert.equal(report.outcomes.victory,end.report.arena.victories);
    assert.equal(report.outcomes.defeat,end.report.arena.defeats);
    assert.equal(report.outcomes.double_death,end.report.arena.doubleDeaths);
    for(const [i,sample] of report.samples.entries())assert.deepEqual(sample.events,
      combatAtTime({...saved.combatSession,elapsedMs:i*BOUT_MS}).events);
    assert.equal(JSON.stringify(saved),before);
  }
});
test("SIM-003 explicitly novice or trained reports, no silently ignored frozen-build overrides",()=>{
  const args={grade:"S",itemGrade:7,quality:"common",armour:"plate",battles:2};
  const novice=simulateBatch({...args,expertiseMode:"novice"}),trained=simulateBatch(args);
  assert.equal(novice.playerBuild.expertiseMode,"novice");
  assert.equal(trained.playerBuild.expertiseMode,"trained");
  assert.ok(novice.player.condition.weapon.proficiency<trained.player.condition.weapon.proficiency);
  assert.throws(()=>createPlayerSnapshot({...args,expertiseMode:"unknown"}),RangeError);
  assert.throws(()=>simulateBatch({snapshot:startCombatSession(createPlayerSnapshot(args),42),grade:"S",battles:1}),RangeError);
  assert.deepEqual(parseCliArgs(["--expertise-mode","novice","--expertise-hours","greatsword:1000,plate:2000"]),
    {expertiseMode:"novice",expertiseHours:{greatsword:1000,plate:2000}});
});
