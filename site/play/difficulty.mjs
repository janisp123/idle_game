// Shared alpha benchmarks for unlocks, stat readiness and arena opponents.
export const GRADES=["Non-grade","F","E","D","C","B","A","S"];
export const unlockLevel=tier=>tier===0?1:tier*10;
export const validTier=tier=>Number.isInteger(tier)&&tier>=0&&tier<GRADES.length;
export function benchmark(tier) {
  if(!validTier(tier)) throw new RangeError("Invalid difficulty");
  return {skill:unlockLevel(tier),stat:10+4*tier,gearPower:tier};
}
export function workMultiplier(tier,weights,attributes) {
  if(!tier) return 1;
  const stat=Object.entries(weights).reduce((total,[key,pct])=>total+attributes[key].value*pct/100,0);
  return (1+0.18*tier)*Math.min(1,(stat/benchmark(tier).stat)**2);
}
export const TERRAIN=[
  {name:"Open field",ranged:3,melee:-1,heavy:-2},
  {name:"Ruined courtyard",ranged:0,melee:0,heavy:0},
  {name:"Dungeon passage",ranged:-3,melee:2,heavy:0}
];
export const TERRAIN_ROLL_START=5500;
export const TERRAIN_REVEAL=9000;
export function terrainBonus(f,terrain) {
  if(!terrain) return 0;
  if(f.loadout === "bow") return terrain.ranged;
  return terrain.melee+((f.gear?.mobilityPct??100)<80?terrain.heavy:0);
}
