/**
 * Developer-only ALPHA-TOOLS clock: advance logical engine time without
 * modifying activity durations, core RNG, saved skill/loot formulas or V7.
 *
 * This small optional localStorage companion survives browser reloads and
 * keeps the virtual game clock continuous when switching between 1x and 10x.
 * It never runs a timer of its own and does not change the real wall clock.
 */
export const ALPHA_CLOCK_KEY="idle-game-alpha-clock-v1";
export const ALPHA_SPEED=10;
export const ALPHA_DAY_MS=24*60*60*1000;
const safe=n=>Number.isSafeInteger(n)&&n>=0;
export function parseAlphaClock(value) {
  let input=value;
  if (typeof input==="string") {
    try { input=JSON.parse(input); } catch { return null; }
  }
  if (!input || typeof input!=="object" || Array.isArray(input) ||
      input.version!==1 || !safe(input.realAnchorMs) ||
      !safe(input.gameAnchorMs) || (input.speed!==1 && input.speed!==ALPHA_SPEED))
    return null;
  return {version:1,realAnchorMs:input.realAnchorMs,
    gameAnchorMs:input.gameAnchorMs,speed:input.speed};
}
export function alphaTime(clock,realNow) {
  if(!safe(realNow))throw new RangeError("Invalid real time");
  if(!clock)return realNow;
  const elapsed=Math.max(0,realNow-clock.realAnchorMs);
  const logical=clock.gameAnchorMs+Math.floor(elapsed*clock.speed);
  if(!safe(logical))throw new RangeError("Virtual clock overflow");
  return logical;
}
export function setAlphaSpeed(clock,realNow,speed) {
  if(speed!==1 && speed!==ALPHA_SPEED)throw new RangeError("Unsupported alpha speed");
  const current=alphaTime(clock,realNow);
  return {version:1,realAnchorMs:realNow,gameAnchorMs:current,speed};
}
export function advanceAlphaClock(clock,realNow,delta) {
  if(!safe(delta))throw new RangeError("Invalid test-time jump");
  const start=alphaTime(clock,realNow);
  if(!safe(start+delta))throw new RangeError("Test-time jump overflow");
  return {version:1,realAnchorMs:realNow,gameAnchorMs:start+delta,
    speed:clock?.speed??1};
}
