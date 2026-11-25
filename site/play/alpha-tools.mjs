import { TIMING_PROFILE, enterGame } from "./engine.mjs?v=alpha-gear-a7";
import { awardAttributeTime,blankAttributeEffort } from "./attributes.mjs?v=glad-001";
import { EXPERTISE_BALANCE } from "./expertise.mjs?v=alpha-gear-a3";
import { ARMOUR_TIERS } from "./armour.mjs?v=glad-003";

export const ALPHA_TOOLS_ENABLED=TIMING_PROFILE==="alpha";
// Rounded-down productive hours of the verified A3 normal daily trajectory
// (ff17713, seed 20261125); use the real attribute formula, not fake stat fields.
export const SIX_MONTH_BUILD=Object.freeze({
  fightingLevel:52,productiveHours:4167,weaponHours:4167,armourHours:4145
});
export const ALPHA_COIN_GRANT=100000;
function requireAlpha(){
  if(!ALPHA_TOOLS_ENABLED)throw new RangeError("Alpha testing tools are disabled");
}

/** Set a representative specialist floor; preserve any higher existing values.
 * Only the current weapon and one explicitly chosen armour family are trained.
 * Settle at the old build first. Never add items, coins or elapsed time here.
 */
export function alphaMaxStats(state,family,now,random=Math.random){
  requireAlpha();
  if(!ARMOUR_TIERS.includes(family))throw new RangeError("Choose one armour family");
  const result=enterGame(state,now,random),old=result.state;
  const floor=awardAttributeTime(blankAttributeEffort(),"fighting",
    SIX_MONTH_BUILD.productiveHours*3600000);
  const attributeEffort=Object.fromEntries(Object.entries(old.attributeEffort)
    .map(([id,value])=>[id,Math.max(value,floor[id])]));
  const fighting=old.skills.fighting.level>=SIX_MONTH_BUILD.fightingLevel?
    old.skills.fighting:{level:SIX_MONTH_BUILD.fightingLevel,xp:0};
  const expertise={...old.expertise};
  expertise[old.combatLoadout]=Math.max(expertise[old.combatLoadout],
    SIX_MONTH_BUILD.weaponHours*EXPERTISE_BALANCE.unitsPerHour);
  expertise[family]=Math.max(expertise[family],
    SIX_MONTH_BUILD.armourHours*EXPERTISE_BALANCE.unitsPerHour);
  const changed=fighting!==old.skills.fighting||
    Object.keys(attributeEffort).some(id=>attributeEffort[id]!==old.attributeEffort[id])||
    Object.keys(expertise).some(id=>expertise[id]!==old.expertise[id]);
  if(!changed)return result;
  return {...result,state:{...old,attributeEffort,skills:{...old.skills,fighting},
    expertise,expertiseActive:{...expertise},attributeEffortActive:{...attributeEffort}}};
}
/** Explicit local test credit, not an arena prize. Existing fights are untouched. */
export function alphaGrantCoins(state,now,random=Math.random){
  requireAlpha();
  const result=enterGame(state,now,random);
  const coins=result.state.coins+ALPHA_COIN_GRANT;
  if(!Number.isSafeInteger(coins)||coins<0)throw new RangeError("Alpha coin grant overflow");
  return {...result,state:{...result.state,coins}};
}

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
