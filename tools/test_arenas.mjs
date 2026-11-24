import test from "node:test";
import assert from "node:assert/strict";
import { ARENAS, chooseArena, preferredArenas } from "../site/play/arenas.mjs";
import { seededCombatRandom } from "../site/play/combat.mjs";

test("arena dice produce a genuine, fallible preference bias", () => {
  const player = { loadout: "bow" }, enemy = { loadout: "hammer" };
  const preferred = preferredArenas(player);
  assert.deepEqual(preferred.map(arena => arena.id), ["open_field"]);
  assert.equal(ARENAS.length, 5);
  const random = seededCombatRandom(98110);
  let high = 0, matched = 0, ties = 0, maximum = 0;
  for (let i = 0; i < 16000; i++) {
    const result = chooseArena(player, enemy, random);
    const { playerDice, enemyDice, higher, arena } = result;
    for (const dice of [playerDice, enemyDice]) {
      assert.equal(dice.length, 3);
      assert.ok(dice.every(die => Number.isInteger(die) && die >= 1 && die <= 6));
    }
    if (playerDice.every(die => die === 6)) maximum++;
    if (!higher) ties++;
    if (higher === "player") {
      high++;
      matched += Number(preferred.includes(arena));
    }
  }
  assert.ok(ties / 16000 > 0.08 && ties / 16000 < 0.11);
  assert.ok(maximum / 16000 > 0.0025 && maximum / 16000 < 0.007);
  assert.ok(matched / high > 0.60 && matched / high < 0.80);
});

test("equal rolls use neutral availability and identical preferences stay fair", () => {
  const values = [0, 0, 0, 0, 0, 0, 0.99];
  const tied = chooseArena({ loadout: "bow" }, { loadout: "bow" }, () => values.shift());
  assert.equal(tied.higher, null);
  assert.equal(tied.arena, ARENAS.at(-1));
  assert.equal(values.length, 0);
  const a = chooseArena({ loadout: "spear" }, { loadout: "greatsword" }, seededCombatRandom(65));
  const b = chooseArena({ loadout: "spear" }, { loadout: "greatsword" }, seededCombatRandom(65));
  assert.deepEqual(a, b);
});

test("each preferred arena offers a measured advantage over a constrained alternative", async () => {
  const { resolvePhysicalDuel } = await import("../site/play/physical-duel.mjs");
  const { createPlayerSnapshot } = await import("./combat-simulator.mjs");
  const contrasts = [
    ["bow", "open_field", "ruined_streets"],
    ["spear", "narrow_bridge", "gatehouse_chamber"],
    ["sword_shield", "ruined_streets", "open_field"],
    ["greatsword", "walled_courtyard", "gatehouse_chamber"],
    ["hammer", "gatehouse_chamber", "open_field"]
  ];
  const builds = contrasts.map(([loadout]) => createPlayerSnapshot({ loadout, armour: "leather" }));
  const random = seededCombatRandom(20261124);
  const seeds = Array.from({ length: 128 }, () => Math.floor(random() * 2 ** 32));
  for (const [style, favourable, constrained] of contrasts) {
    const fighter = builds.find(build => build.loadout === style);
    const opponents = builds.filter(build => build !== fighter);
    const wins = id => opponents.reduce((sum, opponent) => sum + seeds.filter(seed =>
      resolvePhysicalDuel(fighter, opponent, seed, ARENAS.find(arena => arena.id === id)).outcome === "victory").length, 0);
    assert.ok(preferredArenas(fighter).some(arena => arena.id === favourable));
    assert.ok(wins(favourable) > wins(constrained) + 30, style);
    const terrain = ARENAS.find(arena => arena.id === favourable);
    assert.deepEqual(resolvePhysicalDuel(fighter, opponents[0], 19, { ...terrain, id: "alias", name: "Alias" }),
      resolvePhysicalDuel(fighter, opponents[0], 19, terrain));
  }
});
