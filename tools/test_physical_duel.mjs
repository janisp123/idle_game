import test from "node:test";
import assert from "node:assert/strict";
import { resolvePhysicalDuel, timeoutVerdict, PHYSICAL_RULES } from "../site/play/physical-duel.mjs";

const actor = (loadout, extra = {}) => ({ name: loadout, loadout, str: 10, dex: 10, end: 10, skill: 1, ...extra });

test("timeout compares raw HP and requires damage from the leading fighter", () => {
  assert.equal(timeoutVerdict({ hp: 21, inflicted: 1 }, { hp: 20, inflicted: 3 }), "victory");
  assert.equal(timeoutVerdict({ hp: 21, inflicted: 0 }, { hp: 20, inflicted: 3 }), "double_death");
  assert.equal(timeoutVerdict({ hp: 20, inflicted: 2 }, { hp: 20, inflicted: 3 }), "double_death");
});

test("a seeded archer uses a finite quiver and switches to its dagger", () => {
  const bow = actor("bow", { end: 60 });
  const spear = actor("spear", { end: 60 });
  const first = resolvePhysicalDuel(bow, spear, 72);
  assert.deepEqual(resolvePhysicalDuel(bow, spear, 72), first);
  assert.ok(first.events.length <= PHYSICAL_RULES.turnLimit * 3 + 1);
  const moves = first.events.filter(event => event.actor === "player").map(event => event.move);
  assert.equal(moves.filter(move => move === "shot").length, PHYSICAL_RULES.arrows);
  assert.ok(moves.includes("dagger"));
});

test("condition damage changes later exchanges while Masterwork stays intact", () => {
  const breakable = actor("sword_shield", { end: 60, condition: {
    shield: { maxHP: 1, breakable: true },
    armour: { torso: { maxHP: 1, breakable: true, protection: 32 } }
  } });
  const protectedGear = structuredClone(breakable);
  protectedGear.condition.shield.breakable = false;
  protectedGear.condition.armour.torso.breakable = false;
  const hammer = actor("hammer", { end: 60 });
  const broken = resolvePhysicalDuel(hammer, breakable, 11);
  const intact = resolvePhysicalDuel(hammer, protectedGear, 11);
  assert.ok(broken.events.some(event => event.broken?.includes("shield")));
  assert.ok(broken.events.some(event => event.broken?.includes("torso")));
  assert.equal(intact.events.at(-1).vitals.enemy.shield, 1);
  assert.equal(intact.events.at(-1).vitals.enemy.armour, 1);
  assert.notDeepEqual(broken.events.map(event => event.damage), intact.events.map(event => event.damage));
});


// Check the actual condition fields consumed by the resolver, including the
// early-game/late-game grade advantage independent of base attributes.
import { createPlayerSnapshot } from "./combat-simulator.mjs";
import { ARENAS } from "../site/play/arenas.mjs";
import { seededCombatRandom,makeOpponent,startCombatSession } from "../site/play/combat.mjs";
import { gearFactor } from "../site/play/smith.mjs";
test("A2 high grades scale weapon and armour effects at every attribute level",()=>{
  const rand=seededCombatRandom(20261125);
  const seeds=Array.from({length:64},()=>Math.floor(rand()*2**32));
  for(const stat of [10,80,150]){
    const opts={str:stat,dex:stat,end:stat,skill:40,loadout:"greatsword",armour:"leather",quality:"common"};
    const low=createPlayerSnapshot({...opts,itemGrade:0}),high=createPlayerSnapshot({...opts,itemGrade:7});
    assert.ok(high.condition.weapon.damageMultiplier>low.condition.weapon.damageMultiplier*5);
    assert.ok(high.condition.armour.torso.resistance>low.condition.armour.torso.resistance);
    const win=seeds.filter((seed,i)=>resolvePhysicalDuel(high,low,seed,ARENAS[i%5]).outcome==="victory").length;
    assert.ok(win>=63,"S gear should overwhelm Non-grade at stat "+stat+": "+win);
  }
  assert.ok(gearFactor({grade:1,quality:"poor"})>gearFactor({grade:0,quality:"masterwork"}));
});
test("A2 NPC uses real matching-grade weapon and each armour piece",()=>{
  const enemy=makeOpponent(0,7,seededCombatRandom(33));
  assert.ok(enemy.str>130);
  assert.equal(enemy.condition.weapon.damageMultiplier,gearFactor({grade:7,quality:"common"}));
  assert.equal(Object.keys(enemy.condition.armour).length,4);
  assert.ok(Object.values(enemy.condition.armour).every(p=>p.resistance>0));
  const invalid=structuredClone(enemy);invalid.condition.weapon.damageMultiplier=Infinity;
  assert.throws(()=>startCombatSession(invalid,0),RangeError);
});
test("A2 broken equipment loses physical effects and Masterwork remains intact",()=>{
  const p=createPlayerSnapshot({loadout:"greatsword",armour:"plate",itemGrade:7,quality:"masterwork",str:80,dex:80,end:150});
  const q=createPlayerSnapshot({loadout:"hammer",armour:"plate",itemGrade:7,quality:"masterwork",str:80,dex:80,end:150});
  const weak=structuredClone(p);weak.condition.weapon.maxHP=1;weak.condition.weapon.breakable=true;
  for(const piece of Object.values(weak.condition.armour)){piece.maxHP=1;piece.breakable=true}
  const intact=resolvePhysicalDuel(p,q,12,ARENAS[4]),broken=resolvePhysicalDuel(weak,q,12,ARENAS[4]);
  assert.equal(intact.events.at(-1).vitals.player.weapon,p.condition.weapon.maxHP);
  assert.ok(broken.events.some(e=>e.broken?.length));
  assert.notDeepEqual(broken.events.map(e=>e.damage),intact.events.map(e=>e.damage));
});
import {dodgeChance} from "../site/play/armour.mjs";
test("A8 mobility and intact graded armour affect real dodge events",()=>{
  assert.ok(dodgeChance(98,.2)>dodgeChance(75,.007));
  assert.equal(dodgeChance(100,1),.4);
  const opts={str:150,dex:150,end:150,skill:50,loadout:"greatsword",itemGrade:7,quality:"common"};
  const a=createPlayerSnapshot({...opts,armour:"padded"});
  const b=createPlayerSnapshot({...opts,armour:"plate"});
  let padded=0,plate=0;
  const random=seededCombatRandom(20261125);
  for(let i=0;i<128;i++){
    const result=resolvePhysicalDuel(a,b,Math.floor(random()*2**32),ARENAS[2]);
    for(const e of result.events.filter(e=>e.type==="dodge")){
      assert.equal(e.damage,0);
      if(e.actor==="player")padded++;else plate++;
    }
  }
  assert.ok(padded>plate,"lighter armour must produce actual evasion");
});
test("A8 equal mirrors have no large initiative-side advantage in independent-seed sample",()=>{
  const build=createPlayerSnapshot({loadout:"greatsword",armour:"leather",itemGrade:7,quality:"common",str:150,dex:150,end:150,skill:50});
  const random=seededCombatRandom(19482076);
  let wins=0,losses=0;
  for(let i=0;i<512;i++){
    const result=resolvePhysicalDuel(build,build,Math.floor(random()*2**32),ARENAS[i%5]);
    wins+=Number(result.outcome==="victory");losses+=Number(result.outcome==="defeat");
  }
  assert.ok(Math.abs(wins-losses)<512*.15,"mirror win/loss imbalance");
});
