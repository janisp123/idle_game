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
