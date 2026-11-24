import test from "node:test";
import assert from "node:assert/strict";
import {
  COMBAT_BALANCE, BOUT_MS, COMBAT_ART, COMBAT_SKILLS, COMBAT_LOADOUTS,
  rollSkullDice, seededCombatRandom, makeOpponent, startCombatSession,
  advanceCombatSession, simulateDuel, combatAtTime, validCombatSession
} from "../site/play/combat.mjs";
import {newGame, chooseActivity, settle, enterGame, readSave, setCombatLoadout, buyEquipment,
  GAME_VERSION, allAttributeProgress, effectiveAttributeProgress, learnFromMaster,
  xpToNextLevel} from "../site/play/engine.mjs";
import { ARMOUR_SLOTS, armourStats } from "../site/play/armour.mjs";

const great={name:"Wanderer",loadout:"greatsword",str:10,dex:10,end:10,skill:1};
const shield={name:"Varrik",loadout:"sword_shield",str:10,dex:10,end:10,skill:1};
const YEAR=365*24*3_600_000;
const diceRoll = x => (x-1)/6+0.000001;
const withSequence = (...faces) => {let i=0;return () => diceRoll(faces[i++]??4);};
const firstTurn = (player,enemy,attack=4,defense=4) =>
  simulateDuel(player,enemy,withSequence(
    6,6,6, 1,1,1, attack,attack,attack, defense,defense,defense)).events[1];

test("combat is bounded at six opposed turns, with two skills per fighter",()=>{
  assert.equal(COMBAT_BALANCE.maxHalfTurns,6);
  assert.equal(COMBAT_BALANCE.slotsPerBout,8);
  assert.deepEqual(Object.keys(COMBAT_LOADOUTS).sort(),["bow","greatsword","hammer","spear","sword_shield"]);
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
  assert.equal(playerFirst.events[0].type,"initiative");
  assert.deepEqual(playerFirst.events[0].playerDice,[6,6,6]);
  assert.deepEqual(playerFirst.events[0].enemyDice,[1,1,1]);
  assert.equal(playerFirst.events[0].actor,"player");
  assert.equal(playerFirst.events[1].actor,"player");
  assert.equal(playerFirst.events[1].turn,1);
  const enemyFirst=simulateDuel(great,shield,withSequence(1,1,1,6,6,6));
  assert.equal(enemyFirst.events[0].actor,"enemy");
  assert.equal(enemyFirst.events[1].actor,"enemy");
  assert.equal(enemyFirst.events[1].turn,1);
});
test("ties reroll in bounded work; constant-RNG ties end safely by initiative skill",()=>{
  const duel=simulateDuel({...shield,name:"Knight A"},{...shield,name:"Knight B"},()=>.5);
  assert.equal(duel.events[0].rerolls,COMBAT_BALANCE.initiativeRerolls);
  assert.equal(duel.events[0].actor,"player");
  assert.ok(duel.events.length<=COMBAT_BALANCE.slotsPerBout);
});
test("each turn is one attack and independent three-dice defense, no charge-only turns",()=>{
  const duel=simulateDuel(great,shield,()=>.5);
  assert.deepEqual(duel,simulateDuel(great,shield,()=>.5));
  assert.equal(duel.events[0].actor,"enemy", "quick sword starts ahead of heavy greatsword on tied dice");
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
  assert.equal(sh.damage,1,"shield stops the thrust, but one impact damage gets through");
  assert.equal(blade.damage,2,"parried thrust transmits more impact than a shield");
  assert.equal(sh.hpAfter,29);
  assert.equal(blade.hpAfter,28);
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
test("miss and dodge avoid all damage; successful guards can transmit impact",()=>{
  const miss=firstTurn(great,shield,1,1);
  assert.equal(miss.type,"miss");
  assert.equal(miss.damage,0);
  const block=firstTurn(shield,shield,4,4);
  assert.equal(block.type,"block");
  assert.equal(block.damage,1);
  const dodge=firstTurn(shield,{...great,defenseSkill:null},4,6);
  assert.equal(dodge.type,"dodge");
  assert.equal(dodge.damage,0);
  assert.equal(dodge.hpAfter,30);
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
  const defended=firstTurn(great,{...shield,end:500,skill:200},6,6);
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
test("Heavy Swing and Thrust use their own fixed chip rates, never extra block rolls",()=>{
  assert.deepEqual([
    COMBAT_SKILLS.heavy_swing.blockDamagePct,COMBAT_SKILLS.heavy_swing.parryDamagePct,
    COMBAT_SKILLS.thrust.blockDamagePct,COMBAT_SKILLS.thrust.parryDamagePct
  ],[25,35,10,15]);
  assert.equal(COMBAT_SKILLS.shield_block.defenseBonus,5,
    "shield's +5 defense score is not nerfed");
  assert.equal(COMBAT_SKILLS.blade_guard.defenseBonus,2,
    "parry's +2 defense score is unchanged");

  const heavyBlocked=firstTurn(great,shield,4,5);
  const heavyParried=firstTurn(great,great,4,5);
  assert.equal(heavyBlocked.type,"block");
  assert.equal(heavyParried.type,"parry");
  assert.equal(heavyBlocked.damage,6,"24 raw Heavy Swing ×25% shield leak");
  assert.equal(heavyParried.damage,8,"24 raw Heavy Swing ×35% parry leak");
  assert.equal(heavyBlocked.hpAfter,24);
  assert.equal(heavyParried.hpAfter,22);
  const thrustBlocked=firstTurn(shield,shield,4,4);
  const thrustParried=firstTurn(shield,great,4,4);
  assert.equal(thrustBlocked.type,"block");
  assert.equal(thrustParried.type,"parry");
  assert.equal(thrustBlocked.damage,1,"12 raw Thrust ×10% shield leak");
  assert.equal(thrustParried.damage,2,"12 raw Thrust ×15% parry leak");
  assert.deepEqual(heavyBlocked.attackDice,[4,4,4]);
  assert.deepEqual(heavyBlocked.defenseDice,[5,5,5]);
  assert.deepEqual(heavyParried.attackDice,[4,4,4]);
  assert.deepEqual(heavyParried.defenseDice,[5,5,5]);
  assert.equal(heavyBlocked.attackTotal,15);
  assert.equal(heavyBlocked.defenseTotal,20);
});

test("armour and flat gear defense reduce guarded impact; defense can absorb all chip",()=>{
  const wear=(f,tier,enchant=0)=>({...f,gear:{
    ...armourStats(Object.fromEntries(ARMOUR_SLOTS.map(x=>[x.id,tier])),f.loadout),
    gearDefense:enchant
  }});
  const plateShield=firstTurn(great,wear(shield,"plate"),4,5);
  assert.equal(plateShield.type,"block");
  assert.equal(plateShield.damage,3,
    "full Plate halves transmitted heavy impact after the successful guard");
  const protectedShield=firstTurn(great,wear(shield,"plate",5),4,5);
  assert.equal(protectedShield.type,"block");
  assert.equal(protectedShield.damage,0,
    "defense enchant may absorb the remaining impact without inventing min-1 damage");
  assert.equal(protectedShield.hpAfter,30);
  const leatherParry=firstTurn(great,wear(great,"leather"),4,5);
  assert.equal(leatherParry.type,"parry");
  assert.equal(leatherParry.damage,6);
  const critical=firstTurn(great,shield,6,1);
  assert.equal(critical.type,"finisher","special triple-six outcome remains unchanged");
  assert.equal(critical.damage,0,"do not invent chip HP for a finisher");
});

test("new gear requires a larger defense margin for an actual zero-damage dodge",()=>{
  const wear=(f,tier)=>({...f,gear:armourStats(
    Object.fromEntries(ARMOUR_SLOTS.map(slot=>[slot.id,tier])),f.loadout)});
  assert.deepEqual(["none","leather","plate"].map(x=>
    wear(great,x).gear.dodgeMargin),[6,8,99]);
  const moderate=firstTurn(shield,wear(great,"leather"),4,5);
  const exceptional=firstTurn(shield,wear(great,"leather"),3,6);
  assert.equal(moderate.type,"parry");
  assert.ok(moderate.damage>0);
  assert.equal(exceptional.type,"dodge");
  assert.equal(exceptional.damage,0);
  // Existing, already frozen sessions retain their previous dodge thresholds.
  const beforeUpdate={...wear(great,"leather"),gear:{
    ...wear(great,"leather").gear,dodgeMargin:5}};
  const oldRoll=firstTurn(shield,beforeUpdate,4,5);
  assert.equal(oldRoll.type,"dodge",
    "do not retroactively replace a saved duel's frozen dodge margin");
});

test("physical armor counters real hits; evasion and weight alter actual opposed rolls",()=>{
  const wear=(f,tier)=>({...f,gear:armourStats(
    Object.fromEntries(ARMOUR_SLOTS.map(slot=>[slot.id,tier])),f.loadout)});
  const unguarded={...shield,name:"Unguarded",defenseSkill:null};
  const unarmored=firstTurn(great,wear(unguarded,"none"),5,1);
  const leather=firstTurn(great,wear(unguarded,"leather"),5,1);
  const plate=firstTurn(great,wear(unguarded,"plate"),5,1);
  assert.equal(unarmored.damage,24);
  assert.equal(leather.damage,19);
  assert.equal(plate.damage,12,"full Plate prevents half of landed physical damage");
  assert.ok(plate.attackTotal===leather.attackTotal);
  assert.ok(plate.defenseTotal<leather.defenseTotal,
    "full Plate lowers the defender's opposed defense/dodge score");
  const leatherGuard=firstTurn(shield,wear(great,"leather"),4,5);
  const leatherAvoid=firstTurn(shield,wear(great,"leather"),4,6);
  const plateAvoid=firstTurn(shield,wear(great,"plate"),4,5);
  assert.equal(leatherGuard.type,"parry",
    "a moderate successful defense is no longer automatically a dodge");
  assert.ok(leatherGuard.damage>0,"guard impact still applies through Leather");
  assert.equal(leatherAvoid.type,"dodge","large defensive margin may still dodge");
  assert.equal(leatherAvoid.damage,0);
  assert.notEqual(plateAvoid.type,"dodge",
    "Plate must nearly eliminate successful dodges");
  const equalFighters={...shield,name:"Equal"};
  const heavy=simulateDuel(wear(equalFighters,"plate"),
    wear({...equalFighters,name:"Light"},"none"),()=>.5);
  assert.equal(heavy.events[0].actor,"enemy",
    "heavy encumbrance lowers the actual three-dice initiative total");
  assert.equal(heavy.events[0].playerTotal<heavy.events[0].enemyTotal,true);
  const old=simulateDuel(great,shield,()=>.5);
  assert.equal(old.events.length>0,true,
    "pre-equipment combat fixtures keep original rules for old snapshots");
});

test("changing armour mid-Fighting preserves earned progression and refreshes frozen power",()=>{
  const init=chooseActivity(newGame(0),"fighting",0,()=>.5).state;
  init.items.stone=77;
  init.coins=500;
  const before=settle(init,COMBAT_BALANCE.eventMs,()=>.5).state;
  assert.equal(before.combatSession.player.gear.physicalReductionPct,0);
  const oldXP=before.skills.fighting.xp,oldEffort={...before.attributeEffort};
  const changed=buyEquipment(before,"torso:leather",{grade:2,quality:"fine"},COMBAT_BALANCE.eventMs,()=>.5).state;
  assert.equal(changed.combatSession,null,"equipping a different piece begins a new fight");
  assert.equal(changed.items.stone,77);
  assert.equal(changed.skills.fighting.xp,oldXP);
  assert.deepEqual(changed.attributeEffort,oldEffort);
  assert.equal(changed.armour.torso,"leather");
  const later=settle(changed,2*COMBAT_BALANCE.eventMs,()=>.5).state;
  assert.equal(later.combatSession.player.gear.physicalReductionPct,7);
  assert.equal(later.combatSession.player.gear.totalKg>before.combatSession.player.gear.totalKg,true);
  assert.deepEqual(readSave(JSON.stringify(later)),later);
  // A long offline interval MUST keep the original stats without repeatedly
  // upgrading equipment or retroactively recalculating any absent duels.
  const away=enterGame(before,20*YEAR,()=>.5).state;
  assert.deepEqual(away.combatSession.player.gear,before.combatSession.player.gear);
  assert.equal(away.combatSession.elapsedMs>=20*YEAR,true);
  assert.deepEqual(readSave(JSON.stringify(away)),away);
});

test("claimed levels in ANY activity affect future fighting snapshot without rerolling dice",()=>{
  const s=newGame(0);
  s.skills.mining={level:11,xp:0};

  const playing=chooseActivity(s,"fighting",0,()=>.5).state;
  const first=settle(playing,COMBAT_BALANCE.eventMs,()=>.5).state;
  assert.equal(first.combatSession.player.str,17,"ten claimed Mining levels add 7 STR");
  assert.equal(first.combatSession.player.end,13,"ten Mining levels add 3 END");
  assert.equal(first.combatSession.player.dex,10,"other unused attributes remain unchanged");
  assert.equal(first.combatSession.player.skill,1,"Fighting skill itself did not level");
  const beforeSession=first.combatSession.player;
  const persisted=readSave(JSON.stringify(first));
  assert.deepEqual(persisted,first);
  const away=enterGame(persisted,25*365*24*3600_000,()=>.5).state;
  assert.deepEqual(away.combatSession.player,beforeSession,
    "25 years offline keeps original frozen bonus and dice combat power");
  assert.deepEqual(readSave(JSON.stringify(away)),away);
});

test("Skill Master raises stat immediately but restarts a Fighting duel only afterward",()=>{
  const s=newGame(0);
  s.skills.mining={level:1,xp:xpToNextLevel(1)};
  s.items.stone=7;
  const play=chooseActivity(s,"fighting",0,()=>.5).state;
  const prior=settle(play,COMBAT_BALANCE.eventMs,()=>.5).state;
  assert.equal(prior.combatSession.player.str,10);
  const skillsBefore=prior.skills.fighting.xp;
  const taught=learnFromMaster(prior,COMBAT_BALANCE.eventMs,()=>.5);
  assert.equal(taught.state.skills.mining.level,2);
  assert.equal(taught.state.combatSession,null,
    "new permanent stats should not inherit a stale active Fighting snapshot");
  assert.equal(taught.state.items.stone,0);
  assert.equal(taught.state.skills.fighting.xp,skillsBefore);
  assert.equal(effectiveAttributeProgress(taught.state.attributeEffort,taught.state.skills).STR.value,11);
  const next=settle(taught.state,2*COMBAT_BALANCE.eventMs,()=>.5).state;
  assert.equal(next.combatSession.player.str,11);
  assert.equal(next.skills.mining.level,2);
  assert.deepEqual(readSave(JSON.stringify(next)),next);
});

test("gear adds small physical attack/defense but never extra dice",()=>{
  const unguarded={...shield,name:"Untrained",defenseSkill:null};
  const basic=firstTurn(great,unguarded,5,1);
  const enchanted=firstTurn({...great,gearAttack:2},unguarded,5,1);
  assert.ok(enchanted.damage>basic.damage,
    "gear power increases landed physical attack");
  assert.deepEqual(enchanted.attackDice,basic.attackDice);
  assert.deepEqual(enchanted.defenseDice,basic.defenseDice);
  const protectedHit=firstTurn(great,{...unguarded,
    gear:{...armourStats(Object.fromEntries(ARMOUR_SLOTS.map(x=>[x.id,"leather"])),
      "sword_shield"),gearDefense:4}},5,1);
  const sameRobe=firstTurn(great,{...unguarded,
    gear:armourStats(Object.fromEntries(ARMOUR_SLOTS.map(x=>[x.id,"leather"])),
      "sword_shield")},5,1);
  assert.equal(protectedHit.damage,Math.max(1,sameRobe.damage-4));
  assert.deepEqual(protectedHit.defenseDice,sameRobe.defenseDice);
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

test("contact wears both fighters' equipment; misses and clean dodges preserve it",()=>{
  const tank={...great,loadout:"sword_shield"};
  const slam=firstTurn({...great,loadout:"hammer"},tank,4,4);
  const slash=firstTurn(great,tank,4,4);
  assert.equal(slam.type,"block");
  assert.ok(slam.vitals.enemy.shield<slash.vitals.enemy.shield);
  assert.ok(slam.vitals.player.weapon<slam.vitals.player.weaponMax);
  const heavier=firstTurn({...great,str:50,loadout:"hammer"},tank,4,4);
  assert.ok(heavier.vitals.enemy.shield<slam.vitals.enemy.shield);
  for(const [attack,defense] of [[1,1],[2,6]]) {
    const evaded=firstTurn(great,tank,attack,defense);
    assert.ok(["miss","dodge"].includes(evaded.type));
    assert.equal(evaded.vitals.enemy.shield,evaded.vitals.enemy.shieldMax);
    assert.equal(evaded.vitals.player.weapon,evaded.vitals.player.weaponMax);
  }
});

test("arena draws legal sets, all terrains and reproducible matchups at each grade",()=>{
  const sets = new Set(), faces = new Set();
  for(let seed=0;seed<180;seed++) {
    const session=startCombatSession({...great,difficulty:seed%8},seed);
    const duel=combatAtTime(session);
    const repeat=combatAtTime(session);
    assert.deepEqual(duel,repeat);
    faces.add(duel.zoneRoll);
    sets.add(duel.enemyRole+"/"+duel.enemyArmour);
    assert.ok(duel.events.every(e=>!e.attackDice || Number.isFinite(e.attackTotal)));
    assert.equal(duel.terrain.name,["Open field","Ruined courtyard","Dungeon passage"][Math.floor((duel.zoneRoll-1)/2)]);
  }
  assert.equal(faces.size,6);
  assert.deepEqual([...sets].sort(),["Archer/leather","Breaker/leather","Breaker/plate","Spearman/leather","Spearman/padded","Tank/plate","Vanguard/leather","Vanguard/plate"]);
  const plate=Object.fromEntries(ARMOUR_SLOTS.map(slot=>[slot.id,"plate"]));
  const tank={...shield,gear:armourStats(plate,"sword_shield")};
  for(const loadout of ["bow","sword_shield"]) {
    const actor=loadout==="sword_shield"?tank:{...great,loadout};
    const duel=roll=>simulateDuel(actor,shield,withSequence(6,6,6,1,1,1,4,4,4,3,3,3),roll);
    const field=duel(1),dungeon=duel(6);
    assert.deepEqual(field.events[0],dungeon.events[0]);
    assert.equal(field.events[1].attackTotal-dungeon.events[1].attackTotal,loadout==="sword_shield"?-5:6);
  }
});
