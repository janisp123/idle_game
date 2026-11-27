// Geometry is expressed in the same three abstract distance bands as combat.
export const ARENAS = Object.freeze([
  { id: "open_field", name: "Open Field", startDistance: 2, lineOfSight: 2, cover: 0,
    retreatSpace: 4, approachSteps: 2, clearance: 2, detail: "Long sightlines and room to retreat" },
  { id: "narrow_bridge", name: "Narrow Bridge", startDistance: 2, lineOfSight: 2, cover: 0,
    retreatSpace: 0, approachSteps: 2, clearance: 1, detail: "Single approach and restricted swings" },
  { id: "ruined_streets", name: "Ruined Streets", startDistance: 1, lineOfSight: 0, cover: 2,
    retreatSpace: 1, approachSteps: 1, clearance: 1, detail: "Broken sightlines and cover for an approach" },
  { id: "walled_courtyard", name: "Walled Courtyard", startDistance: 1, lineOfSight: 1, cover: 0,
    retreatSpace: 0, approachSteps: 1, clearance: 2, detail: "Room to swing with limited retreat" },
  { id: "gatehouse_chamber", name: "Gatehouse Chamber", startDistance: 0, lineOfSight: 0, cover: 0,
    retreatSpace: 0, approachSteps: 1, clearance: 0, detail: "Close quarters and low swing clearance" }
].map(Object.freeze));

// Legacy ARENAS stays exactly five, including order, for frozen v1–v7 schedules.
export const GROUP_ARENAS=Object.freeze([...ARENAS,...[
 {id:"dense_forest",name:"Dense Forest",startDistance:2,lineOfSight:0,cover:2,retreatSpace:1,approachSteps:1,clearance:1,detail:"Trees block lanes, short sightlines, covered approach"},
 {id:"grand_hall",name:"Grand Hall",startDistance:1,lineOfSight:1,cover:0,retreatSpace:0,approachSteps:1,clearance:2,detail:"Compact three-lane starting formation, high swing clearance"},
 {id:"marshland",name:"Marshland",startDistance:2,lineOfSight:2,cover:0,retreatSpace:1,approachSteps:3,clearance:2,detail:"Long approach through mud; heavier armour slows movement"}
].map(Object.freeze)]);
export const groupArenaPool=rules=>[8,9,10].includes(rules)?GROUP_ARENAS:ARENAS;
const AVAILABILITY_BIAS = 0.64;
const preferences = {
  bow: arena => 2 * arena.lineOfSight + 2 * arena.retreatSpace,
  spear: arena => 2 * arena.startDistance + 3 * arena.approachSteps + arena.clearance - 2 * arena.retreatSpace,
  sword_shield: arena => 3 * arena.cover - arena.startDistance,
  greatsword: arena => 3 * arena.clearance - arena.retreatSpace,
  hammer: arena => 3 * (2 - arena.clearance) - arena.startDistance
};

export function preferredArenas(fighter,pool=ARENAS) {
  const scores = pool.map(preferences[fighter.loadout]);
  const best = Math.max(...scores);
  return pool.filter((arena, index) => scores[index] === best);
}

export function chooseArena(player, enemy, random,available=ARENAS) {
  const roll = () => Array.from({ length: 3 }, () => 1 + Math.floor(random() * 6));
  const playerDice = roll(), enemyDice = roll();
  const total = dice => dice.reduce((sum, die) => sum + die, 0);
  const playerTotal = total(playerDice), enemyTotal = total(enemyDice);
  const higher = playerTotal === enemyTotal ? null : playerTotal > enemyTotal ? "player" : "enemy";
  // A tie is neutral. With a winner, reserve the remaining probability for
  // every arena, including those neither fighter prefers.
  const pool = higher && random() < AVAILABILITY_BIAS
    ? preferredArenas(higher === "player" ? player : enemy,available) : available;
  const arena = pool[Math.floor(random() * pool.length)];
  return { playerDice, enemyDice, playerTotal, enemyTotal, higher, arena };
}
