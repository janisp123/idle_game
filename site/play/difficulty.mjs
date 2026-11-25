// Shared alpha benchmarks for unlocks, stat readiness and arena opponents.
export const GRADES=["Non-grade","F","E","D","C","B","A","S"];
export const unlockLevel=tier=>tier===0?1:tier*10;
export const validTier=tier=>Number.isInteger(tier)&&tier>=0&&tier<GRADES.length;
// Arena challenge access is independent of shop grade unlocks. Work retains its existing gate.
export const canSelectDifficulty=(activity,level,tier)=>validTier(tier)&&
  (activity==="fighting"||level>=unlockLevel(tier));
export function benchmark(tier) {
  if(!validTier(tier)) throw new RangeError("Invalid difficulty");
  return {skill:unlockLevel(tier),stat:10+4*tier,gearPower:tier};
}
export function workMultiplier(tier,weights,attributes) {
  if(!tier) return 1;
  const stat=Object.entries(weights).reduce((total,[key,pct])=>total+attributes[key].value*pct/100,0);
  return (1+0.18*tier)*Math.min(1,(stat/benchmark(tier).stat)**2);
}
