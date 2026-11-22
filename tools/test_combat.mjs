import test from "node:test";
import assert from "node:assert/strict";
import {
  COMBAT_BALANCE, BOUT_MS, COMBAT_ART, COMBAT_SKILLS, COMBAT_LOADOUTS,
  rollSkullDice, seededCombatRandom, makeOpponent, startCombatSession,
  advanceCombatSession, simulateDuel, combatAtTime, validCombatSession
} from "../site/play/combat.mjs";
import {
  newGame, chooseActivity, settle, enterGame, readSave, setCombatLoadout,
  GAME_VERSION, allAttributeProgress
} from "../site/play/engine.mjs";

const great = {name:"Wanderer",loadout:"greatsword",str:10,dex:10,end:10,skill:1};
const shield = {name:"Varrik",loadout:"sword_shield",str:10,dex:10,end:10,skill:1};
const YEAR = 365 * 24 * 3_600_000;
const seeded = seed => seededCombatRandom(seed);

test("exactly two automatic abilities per style are valid and tuneable", () => {
  assert.deepEqual(Object.keys(COMBAT_LOADOUTS).sort(),["greatsword","sword_shield"]);
  for (const loadout of Object.values(COMBAT_LOADOUTS)) {
    assert.equal(COMBAT_SKILLS[loadout.attackSkill].role,"attack");
    assert.equal(COMBAT_SKILLS[loadout.defenseSkill].role,"defense");
  }
  assert.equal(COMBAT_SKILLS.heavy_swing.chargeTurns,1);
  assert.equal(COMBAT_SKILLS.thrust.chargeTurns,0);
  assert.ok(COMBAT_SKILLS.heavy_swing.damageMultiplier >
    COMBAT_SKILLS.thrust.damageMultiplier);
  assert.ok(COMBAT_SKILLS.shield_block.guardChance >
    COMBAT_SKILLS.blade_guard.guardChance);
  assert.ok(COMBAT_SKILLS.blade_guard.guardChance >
    COMBAT_BALANCE.untrainedGuardChance);
});

test("skull dice remain six-sided, and 6-6-6 is possible", () => {
  assert.deepEqual(rollSkullDice(() => 0),[1,1,1]);
  assert.deepEqual(rollSkullDice(() => 0.999999),[6,6,6]);
  for (const bad of [() => 1, () => -0.01, () => NaN])
    assert.throws(() => rollSkullDice(bad),RangeError);
});

test("the greatsword requires a preparation turn while thrust strikes immediately", () => {
  const duel = simulateDuel(great,shield,seeded(1234));
  assert.deepEqual(duel,simulateDuel(great,shield,seeded(1234)));
  assert.equal(duel.events[0].type,"engage");
  assert.equal(duel.events[1].type,"charge");
  assert.equal(duel.events[1].attackSkill,"heavy_swing");
  assert.equal(duel.events[2].actor,"enemy");
  assert.equal(duel.events[2].attackSkill,"thrust");
  assert.equal(duel.events[3].actor,"player");
  assert.equal(duel.events[3].attackSkill,"heavy_swing");
  assert.notEqual(duel.events[3].type,"charge");
  assert.ok(duel.events.length <= COMBAT_BALANCE.slotsPerBout);
  assert.equal(duel.events.at(-1).type,duel.outcome);
  assert.ok(["victory","defeat","stalemate"].includes(duel.outcome));
  assert.equal(duel.events.filter(e => e.actor==="player" && e.attackRoll !== undefined).length <= 4,true);
});

test("attack and defense use separate rolls; shield beats blade guard beats bare stats", () => {
  const hits = (defender, defenceRoll) =>
    simulateDuel({...shield,name:"Attacker",str:10},
      defender, (() => {
        let index=0;
        const rolls=[0,defenceRoll];
        return () => rolls[index++] ?? 0.5;
      })()).events[1];
  const armored = hits({...shield,name:"Shield Knight"},0.20);
  const bladed = hits({...great,name:"Greatsword Knight"},0.20);
  const bare = hits({...great,name:"Untrained Knight",defenseSkill:null},0.20);
  assert.equal(armored.type,"block");
  assert.equal(armored.defenseSkill,"shield_block");
  assert.equal(bladed.type,"parry");
  assert.equal(bladed.defenseSkill,"blade_guard");
  assert.ok(["strike","wound","collapse"].includes(bare.type));
  assert.equal(bare.defenseSkill,null);
  assert.equal(armored.damage,0);
  assert.equal(bladed.damage,0);
  assert.ok(bare.damage > 0);
  assert.equal(armored.attackRoll,0);
  assert.equal(armored.defenseRoll,0.20);
  const stronger = hits({...shield,name:"Shield Knight"},0.40);
  const weaker = hits({...great,name:"Greatsword Knight"},0.40);
  assert.equal(stronger.type,"block");
  assert.ok(weaker.damage > 0);
});

test("greatsword heavy damage exceeds sword thrust when both connect", () => {
  const s = simulateDuel(shield,{...great,defenseSkill:null},() => 0.99);
  const g = simulateDuel(great,{...shield,defenseSkill:null},() => 0.99);
  // Both miss on 0.99, so force successful attack and failed defense.
  const force = () => { let n=0; return () => {
    const k=n++; return k%2===0 ? 0 : 0.99;
  }; };
  const one = simulateDuel(shield,{...great,defenseSkill:null},force()).events.find(x=>x.damage>0);
  const two = simulateDuel(great,{...shield,defenseSkill:null},force()).events.find(x=>x.actor==="player"&&x.damage>0);
  assert.ok(one && two);
  assert.ok(two.damage > one.damage);
  assert.equal(s.events[0].type,"engage");
  assert.equal(g.events[1].type,"charge");
});

test("6-6-6 executes only when a clean hit meets the vulnerability threshold", () => {
  const enemy = {...great,loadout:"sword_shield",name:"Weak Rival",end:0,str:0,dex:0,skill:0,defenseSkill:null};
  const player = {...shield,str:12,name:"Player"};
  let i=0;
  const rolls=[0,0.99, 0.999, 0,0.99,0.999,0.999,0.999];
  const out=simulateDuel(player,enemy,()=>rolls[i++] ?? 0.5);
  const f=out.events.find(e=>e.type==="finisher");
  assert.ok(f,JSON.stringify(out.events));
  assert.deepEqual(f.dice,[6,6,6]);
  assert.equal(f.attackSkill,"thrust");
  assert.equal(f.actor,"player");
  assert.equal(out.outcome,"victory");
  assert.equal(out.enemyHP,0);
  assert.match(f.text,/6–6–6/);
});

test("blocked and missed exchanges cannot invent finisher dice", () => {
  const allDodge=simulateDuel(shield,great,()=>0);
  assert.ok(allDodge.events.every(e=>!e.dice));
  assert.ok(allDodge.events.filter(e=>e.attackRoll!==undefined).every(e=>e.damage===0));
});

test("combat session remains bounded after decades with stable seed and frozen player", () => {
  const session=startCombatSession(great,12345);
  assert.equal(validCombatSession(session),true);
  assert.equal(validCombatSession({...session,elapsedMs:-1}),false);
  assert.equal(validCombatSession({...session,seed:0x100000000}),false);
  const within=advanceCombatSession(session,BOUT_MS+3*COMBAT_BALANCE.eventMs);
  const at=combatAtTime(within);
  assert.equal(at.bout,2);
  assert.equal(at.step,Math.min(3,at.events.length-1));
  assert.equal(at.enemy,makeOpponent(1).name);
  assert.deepEqual(combatAtTime(within),at);
  assert.ok(combatAtTime(advanceCombatSession(session,20*YEAR)).bout>1_000_000);
  assert.equal(COMBAT_ART.engage,"fight-engage");
  assert.equal(COMBAT_ART.finisher,undefined);
});

test("V6 save migration preserves materials, stats, combat time and RNG seed", () => {
  const old=newGame(0);
  old.version=6;
  delete old.combatLoadout;
  old.name="Old Knight";
  old.items.stone=314;
  old.skills.fighting.level=11;
  old.combatSession={ elapsedMs:83_000, seed:12345,
    player:{name:"Old Knight",weapon:"hammer",str:19,dex:17,end:14,skill:11} };
  const converted=readSave(JSON.stringify(old));
  assert.ok(converted);
  assert.equal(converted.version,GAME_VERSION);
  assert.equal(converted.combatLoadout,"greatsword");
  assert.equal(converted.combatSession.elapsedMs,83_000);
  assert.equal(converted.combatSession.seed,12345);
  assert.equal(converted.combatSession.player.str,19);
  assert.equal(converted.combatSession.player.loadout,"greatsword");
  assert.equal(converted.items.stone,314);
  assert.equal(converted.skills.fighting.level,11);
  assert.deepEqual(readSave(JSON.stringify(converted)),converted);
});

test("switching between the two skill pairs never deletes earned progress", () => {
  const game=chooseActivity(newGame(0),"fighting",0,()=>0.5).state;
  game.items.stone=38;
  const fighting=settle(game,COMBAT_BALANCE.eventMs,()=>0.5).state;
  const priorXP=fighting.skills.fighting.xp;
  const priorAttr={...fighting.attributeEffort};
  const sw=setCombatLoadout(fighting,"sword_shield",COMBAT_BALANCE.eventMs,()=>0.5);
  assert.equal(sw.state.combatLoadout,"sword_shield");
  assert.equal(sw.state.combatSession,null,"fresh duel after switching equipped skills");
  assert.equal(sw.state.items.stone,38);
  assert.equal(sw.state.skills.fighting.xp,priorXP);
  assert.deepEqual(sw.state.attributeEffort,priorAttr);
  assert.deepEqual(readSave(JSON.stringify(sw.state)),sw.state);
  const active=settle(sw.state,COMBAT_BALANCE.eventMs+10_000,()=>0.5).state;
  assert.equal(active.combatSession.player.loadout,"sword_shield");
  const stable=setCombatLoadout(active,"sword_shield",active.settledAtMs,()=>0.5);
  assert.deepEqual(stable.state,active);
  assert.throws(()=>setCombatLoadout(active,"unknown",active.settledAtMs),RangeError);
});

test("Fighting gains time-based attributes and Master XP without permanent loss", () => {
  const state=chooseActivity(newGame(0),"fighting",0,()=>0.5).state;
  const out=enterGame(state,20*YEAR,()=>0.5);
  assert.equal(out.state.combatSession.player.loadout,"greatsword");
  assert.equal(out.state.combatSession.player.str,10);
  assert.ok(allAttributeProgress(out.state.attributeEffort).STR.value>10);
  assert.equal(out.state.combatSession.elapsedMs,20*YEAR);
  assert.equal(out.state.skills.fighting.level,1);
  assert.deepEqual(readSave(JSON.stringify(out.state)),out.state);
});
