import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { BOUT_MS, combatAtTime, startCombatSession } from '../site/play/combat.mjs';
import { armourStats, ARMOUR_SLOTS } from '../site/play/armour.mjs';
import { blankEnchantments, enchantBonus, tallyGloryVictories } from '../site/play/glory.mjs';
import { conditionBonuses, masteryRanks } from '../site/play/equipment-rules.mjs';
import { createPlayerSnapshot, parseCliArgs, simulateBatch } from './combat-simulator.mjs';

test('the 10,000-bout runner resolves real production opponents, locations and dice', () => {
  const output = simulateBatch({battles:10000,seed:20261124});
  assert.equal(Object.values(output.outcomes).reduce((a,b)=>a+b,0),10000);
  assert.equal(Object.values(output.byTerrain).reduce((a,b)=>a+b.battles,0),10000);
  assert.equal(Object.values(output.byEnemyRole).reduce((a,b)=>a+b.battles,0),10000);
  assert.equal(Object.values(output.byEnemyLoadout).reduce((a,b)=>a+b.battles,0),10000);
  assert.deepEqual(Object.keys(output.byTerrain).sort(),
    ['Dungeon passage','Open field','Ruined courtyard'].sort());
  assert.equal(output.dice.playerInitiative.rolls,10000);
  assert.equal(output.dice.enemyInitiative.rolls,10000);
  assert.equal(output.dice.playerAttack.rolls,output.attacks.player);
  assert.equal(output.dice.enemyAttack.rolls,output.attacks.enemy);
  assert.equal(output.dice.playerDefense.rolls,output.attacks.enemy);
  assert.equal(output.dice.enemyDefense.rolls,output.attacks.player);
  for (const bucket of Object.values(output.dice)) {
    assert.equal(Object.values(bucket.faces).reduce((a,b)=>a+b,0),bucket.rolls*3);
    assert.equal(Object.values(bucket.sum).reduce((a,b)=>a+b,0),bucket.rolls);
    assert.ok(Object.keys(bucket.faces).every(face=>+face>=1 && +face<=6));
    assert.ok(Object.keys(bucket.sum).every(sum=>+sum>=3 && +sum<=18));
  }
  assert.ok(output.winRatePct>=0 && output.winRatePct<=100);
  assert.equal(output.samples.length,0);
});

test('sampled traces equal the actual live combatAtTime events without a substitute resolver', () => {
  const args={battles:50,grade:'F',loadout:'hammer',armour:'leather',
    skill:10,str:14,dex:14,end:14,wil:14,seed:892,trace:3,startBout:4};
  const output=simulateBatch(args);
  const session=startCombatSession(createPlayerSnapshot(args),args.seed);
  for (let i=0;i<output.samples.length;i++) {
    const expected=combatAtTime({...session,elapsedMs:(args.startBout+i)*BOUT_MS});
    const actual=output.samples[i];
    assert.equal(actual.bout,args.startBout+i+1);
    assert.equal(actual.outcome,expected.outcome);
    assert.equal(actual.terrain,expected.terrain.name);
    assert.equal(actual.zoneRoll,expected.zoneRoll);
    assert.equal(actual.enemyRole,expected.enemyRole);
    assert.equal(actual.enemyLoadout,expected.enemyLoadout);
    assert.deepEqual(actual.events,expected.events);
    assert.ok(actual.events[0].playerDice.every(x=>x>=1 && x<=6));
    assert.ok(actual.events.filter(e=>e.turn).every(e=>e.attackDice.length===3 &&
      e.defenseDice.length===3 && e.vitals.player.weapon>=0));
  }
  assert.deepEqual(simulateBatch(args),output);
});

test('gear, mixed armour, enchantment and mastery use production source functions', () => {
  const options={grade:'D',loadout:'sword_shield',armour:'leather',
    armourSlots:{head:'plate',chest:'plate'},str:22,dex:22,end:22,wil:22,
    enchantments:{weapon:3,shield:2,head:4,chest:2},mastery:{weapon:1,head:3,shield:1}};
  const player=createPlayerSnapshot(options);
  const armour=Object.fromEntries(ARMOUR_SLOTS.map(x=>[x.id,options.armourSlots[x.id]??options.armour]));
  const ench={...blankEnchantments(),...options.enchantments};
  const mastery=masteryRanks(options.mastery);
  const bonus=enchantBonus(ench,options.loadout);
  assert.equal(player.attackEnchant,bonus.attack);
  assert.equal(player.gear.defenseEnchant,bonus.defense);
  assert.deepEqual(player.gear,{...armourStats(armour,options.loadout),defenseEnchant:bonus.defense});
  assert.deepEqual(player.conditionBonus,conditionBonuses({armour,enchantments:ench,slotMastery:mastery}));
  assert.equal(player.difficulty,3);
  const output=simulateBatch({...options,battles:100,seed:112,trace:1});
  assert.equal(output.player.attackEnchant,3);
  assert.ok(output.player.conditionBonus.body>0);
  assert.ok(output.samples[0].events.at(-1).vitals.player.armour>=0);
});

test('saved session snapshots preserve frozen power, start bout, seed and exact outcome',()=>{
  const player=createPlayerSnapshot({grade:'F',loadout:'greatsword',armour:'leather',
    enchantments:{weapon:2,head:1},skill:10,str:14,dex:14,end:14,wil:14});
  const session={...startCombatSession(player,3377),elapsedMs:8*BOUT_MS+1200};
  const output=simulateBatch({snapshot:{combatSession:session},battles:30,trace:1});
  assert.equal(output.startBout,8);
  assert.equal(output.seed,3377);
  assert.equal(output.player.attackEnchant,2);
  assert.deepEqual(output.samples[0].events,
    combatAtTime({...session,elapsedMs:8*BOUT_MS}).events);
});

test('optional Glory drops match the unchanged production reward resolver',()=>{
  const opts={battles:30,seed:421,gloryEligibleBouts:13,startBout:5};
  const output=simulateBatch(opts);
  const session=startCombatSession(createPlayerSnapshot(opts),opts.seed);
  const result=tallyGloryVictories({...session,elapsedMs:35*BOUT_MS,
    gloryCursor:5,gloryEligibleUntilMs:18*BOUT_MS});
  assert.equal(output.glory.eligibleVictories,result.eligibleVictories);
  assert.equal(output.glory.scrolls,result.scrolls);
  assert.equal(output.glory.eligibleBouts,13);
  assert.equal(simulateBatch({battles:30}).glory,null);
});

test('invalid grades, impossible gear, forged ranks and excessive runs fail safely',()=>{
  assert.throws(()=>createPlayerSnapshot({grade:'T'}),RangeError);
  assert.throws(()=>createPlayerSnapshot({grade:'F',armour:'plate'}),/Locked armour/);
  assert.throws(()=>createPlayerSnapshot({enchantments:{weapon:21}}),RangeError);
  assert.throws(()=>createPlayerSnapshot({mastery:{weapon:8}}),RangeError);
  assert.throws(()=>createPlayerSnapshot({armourSlots:{unlisted:'plate'}}),RangeError);
  assert.throws(()=>simulateBatch({battles:1000001}),RangeError);
  assert.throws(()=>simulateBatch({battles:10,trace:11}),RangeError);
  assert.throws(()=>parseCliArgs(['--unknown','123']),RangeError);
  assert.throws(()=>parseCliArgs(['--armour','robe','--armour','plate']),RangeError);
  assert.throws(()=>parseCliArgs(['--enchant','weapon:2,weapon:3']),RangeError);
  assert.throws(()=>parseCliArgs(['--snapshot','ignored.json','--grade','F']),/ENOENT/);
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
