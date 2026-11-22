import test from "node:test";
import assert from "node:assert/strict";
import {
  COMBAT_BALANCE, BOUT_MS, COMBAT_ART, COMBAT_SKILLS, COMBAT_LOADOUTS,
  rollSkullDice, seededCombatRandom, makeOpponent, startCombatSession,
  advanceCombatSession, simulateDuel, combatAtTime, validCombatSession
} from "../site/play/combat.mjs";
import {newGame, chooseActivity, settle, enterGame, readSave, setCombatLoadout,
  GAME_VERSION, allAttributeProgress} from "../site/play/engine.mjs";

const great={name:"Wanderer",loadout:"greatsword",str:10,dex:10,end:10,skill:1};
const shield={name:"Varrik",loadout:"sword_shield",str:10,dex:10,end:10,skill:1};
const YEAR=365*24*3_600_000;
const diceRoll = x => (x-1)/6+0.000001;
const withSequence = (...faces) => {let i=0;return () => diceRoll(faces[i++]??4);};
const firstTurn = (player,enemy,attack=4,defense=4) =>
  simulateDuel(player,enemy,withSequence(
    6,6,6, 1,1,1, attack,attack,attack, defense,defense,defense)).events[2];

test("combat is bounded at six opposed turns, with two skills per fighter",()=>{
  assert.equal(COMBAT_BALANCE.maxHalfTurns,6);
  assert.equal(COMBAT_BALANCE.slotsPerBout,9);
  assert.deepEqual(Object.keys(COMBAT_LOADOUTS).sort(),["greatsword","sword_shield"]);
  assert.equal(COMBAT_SKILLS.heavy_swing.role,"attack");
  assert.equal(COMBAT_SKILLS.blade_guard.role,"defense");
  assert.equal(COMBAT_SKILLS.shield_block.role,"defense");
  assert.ok(COMBAT_SKILLS.heavy_swing.windupMs>COMBAT_SKILLS.thrust.windupMs);
  assert.ok(COMBAT_SKILLS.heavy_swing.damageMultiplier>
    COMBAT_SKILLS.thrust.damageMultiplier);
  assert.ok(COMBAT_SKILLS.shield_block.defenseBonus>
    COMBAT_SKILLS.blade_guard.defenseBonus);
  assert.ok(COMBAT_SKILLS.blade_guard.defenseBonus>
    -COMBAT_BALANCE.untrainedDefensePenalty);
});
test("each skull die is 1–6, independent, and 6–6–6 is possible",()=>{
  assert.deepEqual(rollSkullDice(()=>0),[1,1,1]);
  assert.deepEqual(rollSkullDice(()=>.999999),[6,6,6]);
  for (const bad of [()=>1,()=>-0.01,()=>NaN])
    assert.throws(()=>rollSkullDice(bad),RangeError);
});
test("initiative genuinely rolls THREE dice on BOTH sides, winner attacks first",()=>{
  const playerFirst=simulateDuel(great,shield,withSequence(6,6,6,1,1,1));
  assert.equal(playerFirst.events[0].type,"engage");
  assert.equal(playerFirst.events[1].type,"initiative");
  assert.deepEqual(playerFirst.events[1].playerDice,[6,6,6]);
  assert.deepEqual(playerFirst.events[1].enemyDice,[1,1,1]);
  assert.equal(playerFirst.events[1].actor,"player");
  assert.equal(playerFirst.events[2].actor,"player");
  assert.equal(playerFirst.events[2].turn,1);
  const enemyFirst=simulateDuel(great,shield,withSequence(1,1,1,6,6,6));
  assert.equal(enemyFirst.events[1].actor,"enemy");
  assert.equal(enemyFirst.events[2].actor,"enemy");
  assert.equal(enemyFirst.events[2].turn,1);
});
test("ties reroll in bounded work; constant-RNG ties end safely by initiative skill",()=>{
  const duel=simulateDuel({...shield,name:"Knight A"},{...shield,name:"Knight B"},()=>.5);
  assert.equal(duel.events[1].rerolls,COMBAT_BALANCE.initiativeRerolls);
  assert.equal(duel.events[1].actor,"player");
  assert.ok(duel.events.length<=COMBAT_BALANCE.slotsPerBout);
});
test("each turn is one attack and independent three-dice defense, no charge-only turns",()=>{
  const duel=simulateDuel(great,shield,()=>.5);
  assert.deepEqual(duel,simulateDuel(great,shield,()=>.5));
  assert.equal(duel.events[1].actor,"enemy", "quick sword starts ahead of heavy greatsword on tied dice");
  const actions=duel.events.filter(e=>e.turn);
  assert.equal(actions.length,6);
  assert.deepEqual(actions.map(e=>e.turn),[1,2,3,4,5,6]);
  assert.deepEqual(actions.map(e=>e.actor),["enemy","player","enemy","player","enemy","player"]);
  assert.ok(actions.every(e=>e.attackDice.length===3&&e.defenseDice.length===3));
  assert.ok(actions.some(e=>e.attackSkill==="heavy_swing"));
  assert.ok(actions.every(e=>e.type!=="charge"));
  assert.equal(duel.events.at(-1).type,duel.outcome);
  assert.ok(["victory","defeat","stalemate"].includes(duel.outcome));
});
test("trained shield guard beats blade parry, untrained stat defense is weaker",()=>{
  const attacker={...shield,name:"Attacker"};
  const sh=firstTurn(attacker,{...shield,name:"Shield Knight"});
  const blade=firstTurn(attacker,{...great,name:"Blade Knight"});
  const bare=firstTurn(attacker,{...great,name:"Untrained",defenseSkill:null});
  assert.equal(sh.type,"block");
  assert.equal(sh.defenseSkill,"shield_block");
  assert.equal(blade.type,"parry");
  assert.equal(blade.defenseSkill,"blade_guard");
  assert.ok(["strike","wound","collapse"].includes(bare.type));
  assert.equal(bare.defenseSkill,null);
  assert.equal(sh.damage,0);
  assert.equal(blade.damage,0);
  assert.ok(bare.damage>0);
  assert.deepEqual(bare.attackDice,[4,4,4]);
  assert.deepEqual(bare.defenseDice,[4,4,4]);
  assert.equal(bare.attackTotal,14);
  assert.equal(bare.defenseTotal,10);
});
test("greatsword single hit is heavier than sword thrust, both actions cost a turn",()=>{
  const sword=firstTurn(shield,{...great,name:"Untrained",defenseSkill:null},5,1);
  const heavy=firstTurn(great,{...shield,name:"Untrained",defenseSkill:null},5,1);
  assert.ok(sword.damage>0);
  assert.ok(heavy.damage>sword.damage);
  assert.equal(heavy.turn,1);
  assert.equal(heavy.attackSkill,"heavy_swing");
});
test("miss is a real blunder even with high stat margin; block and dodge inflict no damage",()=>{
  const miss=firstTurn(great,shield,1,1);
  assert.equal(miss.type,"miss");
  assert.equal(miss.damage,0);
  const block=firstTurn(shield,shield,4,4);
  assert.equal(block.damage,0);
  const dodge=firstTurn(shield,{...great,defenseSkill:null,dex:100},4,6);
  assert.equal(dodge.damage,0);
  assert.ok(["dodge","parry"].includes(dodge.type));
});
test("6–6–6 is a finisher only if the attacker overcomes defense",()=>{
  const fatal=simulateDuel(great,shield,withSequence(
    6,6,6,1,1,1, 6,6,6,1,1,1));
  const finisher=fatal.events.find(e=>e.type==="finisher");
  assert.ok(finisher);
  assert.deepEqual(finisher.attackDice,[6,6,6]);
  assert.equal(finisher.damage,0,"finisher is lethal without invented numeric damage");
  assert.equal(fatal.enemyHP,0);
  assert.equal(fatal.outcome,"victory");
  assert.match(finisher.text,/6–6–6/);
  const defended=firstTurn(great,{...shield,dex:500,skill:200},6,6);
  assert.notEqual(defended.type,"finisher","massive veteran defense can survive a lucky triple six");
});
test("a duel never creates more than three attack attempts per side",()=>{
  for(const [p,e] of [[great,shield],[shield,great],[great,great],[shield,shield]]) {
    for(const seed of [1,15,51,1234,99999]) {
      const duel=simulateDuel(p,e,seededCombatRandom(seed));
      const turns=duel.events.filter(e=>e.turn);
      assert.ok(turns.length<=6);
      assert.ok(turns.filter(e=>e.actor==="player").length<=3);
      assert.ok(turns.filter(e=>e.actor==="enemy").length<=3);
      assert.equal(duel.events.at(-1).type,duel.outcome);
    }
  }
});
test("combat sessions are deterministic, persisted and O(1) after decades away",()=>{
  const s=startCombatSession(great,12345);
  assert.equal(validCombatSession(s),true);
  assert.equal(validCombatSession({...s,elapsedMs:-1}),false);
  assert.equal(validCombatSession({...s,seed:0x100000000}),false);
  const near=advanceCombatSession(s,BOUT_MS+2*COMBAT_BALANCE.eventMs+1200);
  const at=combatAtTime(near);
  assert.equal(at.bout,2);
  assert.equal(at.step,2);
  assert.equal(at.eventElapsedMs,1200);
  assert.equal(at.enemy,makeOpponent(1).name);
  assert.deepEqual(combatAtTime(near),at);
  const years=advanceCombatSession(s,20*YEAR);
  assert.ok(combatAtTime(years).bout>1_000_000);
  assert.equal(COMBAT_ART.engage,"fight-engage");
});
test("V6 save migration preserves frozen stats, duel time and items",()=>{
  const old=newGame(0);old.version=6;delete old.combatLoadout;
  old.name="Old Knight";old.items.stone=314;old.skills.fighting.level=11;
  old.combatSession={elapsedMs:83_000,seed:12345,
    player:{name:"Old Knight",weapon:"hammer",str:19,dex:17,end:14,skill:11}};
  const converted=readSave(JSON.stringify(old));
  assert.equal(converted.version,GAME_VERSION);
  assert.equal(converted.combatSession.player.loadout,"greatsword");
  assert.equal(converted.combatSession.elapsedMs,83_000);
  assert.equal(converted.combatSession.seed,12345);
  assert.equal(converted.combatSession.player.str,19);
  assert.equal(converted.items.stone,314);
  assert.equal(converted.skills.fighting.level,11);
  assert.deepEqual(readSave(JSON.stringify(converted)),converted);
});
test("style switching settles saved XP/materials and starts a fresh duel",()=>{
  const state=chooseActivity(newGame(0),"fighting",0,()=>.5).state;
  state.items.stone=38;
  const first=settle(state,COMBAT_BALANCE.eventMs,()=>.5).state;
  const oldXP=first.skills.fighting.xp,oldEffort={...first.attributeEffort};
  const swapped=setCombatLoadout(first,"sword_shield",COMBAT_BALANCE.eventMs,()=>.5);
  assert.equal(swapped.state.combatLoadout,"sword_shield");
  assert.equal(swapped.state.combatSession,null);
  assert.equal(swapped.state.items.stone,38);
  assert.equal(swapped.state.skills.fighting.xp,oldXP);
  assert.deepEqual(swapped.state.attributeEffort,oldEffort);
  assert.deepEqual(readSave(JSON.stringify(swapped.state)),swapped.state);
  const running=settle(swapped.state,COMBAT_BALANCE.eventMs+10_000,()=>.5).state;
  assert.equal(running.combatSession.player.loadout,"sword_shield");
  assert.deepEqual(setCombatLoadout(running,"sword_shield",running.settledAtMs,()=>.5).state,running);
  assert.throws(()=>setCombatLoadout(running,"unknown",running.settledAtMs),RangeError);
});
test("Fighting earns time-based stats and capped XP even after 20 offline years",()=>{
  const state=chooseActivity(newGame(0),"fighting",0,()=>.5).state;
  const out=enterGame(state,20*YEAR,()=>.5);
  assert.equal(out.state.combatSession.player.loadout,"greatsword");
  assert.equal(out.state.combatSession.player.str,10);
  assert.equal(out.state.combatSession.elapsedMs,20*YEAR);
  assert.ok(allAttributeProgress(out.state.attributeEffort).STR.value>10);
  assert.equal(out.state.skills.fighting.level,1);
  assert.deepEqual(readSave(JSON.stringify(out.state)),out.state);
});
