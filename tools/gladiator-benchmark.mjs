// Representative alpha benchmark. Every bout calls the live physical resolver.
import { BOUT_MS, RESURRECTION_MS, seededCombatRandom } from "../site/play/combat.mjs";
import { ARENAS } from "../site/play/arenas.mjs";
import { arenaReward } from "../site/play/arena-wallet.mjs";
import { resolvePhysicalDuel } from "../site/play/physical-duel.mjs";
import { ITEM_QUALITIES } from "../site/play/smith.mjs";
import { createPlayerSnapshot } from "./combat-simulator.mjs";

const styles = ["bow", "spear", "sword_shield", "greatsword", "hammer"];
const armourLoads = ["padded", "leather", "plate"];
const random = seededCombatRandom(20261124);
const seeds = Array.from({ length: 128 }, () => Math.floor(random() * 2 ** 32));
const outcomes = () => ({ bouts: 0, victory: 0, defeat: 0, double_death: 0,
  breaks: 0, arrowExhaustions: 0, bleedTicks: 0, staggers: 0, coins: 0, productiveMs: 0 });

function sample(player, enemy, arena, grade, seeds, totals) {
  for (const seed of seeds) {
    const result = resolvePhysicalDuel(player, enemy, seed, arena);
    totals.bouts++;
    totals[result.outcome]++;
    totals.coins += result.outcome === "victory" ? arenaReward(grade) : 0;
    totals.productiveMs += BOUT_MS - (result.outcome === "victory" ? 0 : RESURRECTION_MS);
    const final = result.events.at(-1);
    for (const [side, fighter] of [["player", player], ["enemy", enemy]]) {
      if (fighter.loadout === "bow" && final.vitals[side].arrows === 0) totals.arrowExhaustions++;
    }
    for (const event of result.events) {
      totals.breaks += event.broken?.length ?? 0;
      totals.bleedTicks += Number(event.type === "bleed");
      totals.staggers += Number(event.type === "stagger");
    }
  }
  return totals;
}

const byArena = Object.fromEntries(ARENAS.map(arena => [arena.name, Object.fromEntries(styles.map(style => {
  const player = createPlayerSnapshot({ loadout: style, armour: "leather" });
  return [style, Object.fromEntries(styles.map(opponent => [
    opponent, sample(player, createPlayerSnapshot({ loadout: opponent, armour: "leather" }),
      arena, 0, seeds.slice(0, 64), outcomes())
  ]))];
}))]));

const upgradeRows = [];
for (const [index, armour] of armourLoads.entries()) {
  for (const grade of [0, 1, 2]) {
    const loadout = styles[(grade + index) % styles.length];
    const opponent = styles[(grade + index + 2) % styles.length];
    const arena = ARENAS[(grade + index) % ARENAS.length];
    const enemy = createPlayerSnapshot({ loadout: opponent, grade, armour, itemGrade: grade, quality: "common" });
    for (const quality of ITEM_QUALITIES) {
      const player = createPlayerSnapshot({ loadout, armour, itemGrade: grade, quality,
        grade });
      const totals = sample(player, enemy, arena, grade, seeds, outcomes());
      upgradeRows.push({ armour, grade, loadout, opponent, arena: arena.name, quality,
        ...totals, coinsPerProductiveHour: totals.coins * 3_600_000 / totals.productiveMs });
    }
  }
}

const gradeRows = [];
const fixedArena = ARENAS.find(arena => arena.id === "walled_courtyard");
for (const opponentGrade of [0, 1, 2]) {
  const enemy = createPlayerSnapshot({ loadout: "spear", grade: opponentGrade, armour: "leather", itemGrade: opponentGrade });
  for (const itemGrade of [0, 1, 2]) {
    const player = createPlayerSnapshot({ loadout: "greatsword", armour: "leather", itemGrade, quality: "common",
      skill: 10, str: 14, dex: 14, end: 14 });
    gradeRows.push({ opponentGrade, itemGrade, ...sample(player, enemy, fixedArena, opponentGrade, seeds, outcomes()) });
  }
}

console.log(JSON.stringify({ seed: 20261124,
  bouts: 5 * styles.length ** 2 * 64 + (upgradeRows.length + gradeRows.length) * seeds.length,
  byArena, upgradeRows, gradeRows }, null, 2));
