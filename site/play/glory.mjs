/**
 * GLORY-001: tiny fixed-slot enchantment/reward module.
 *
 * No generated item instances or per-bout saved history. A scroll has a 50%
 * chance to raise the selected SLOT by one rank; failure resets that slot to
 * zero. Every rank contributes +1 raw attack on the weapon slot or +1 flat
 * physical defense on an armour slot. Tuning lives in one small object.
 *
 * Actual completed victories, never guessed win totals, drive Glory awards.
 * Eligible bouts begin before the frozen Fighting XP earning window closes.
 * The window is computed from current unclaimed XP and the alpha base XP rate;
 * small +/- XP batch variance does not change the snapshot's eligibility.
 * Thus reward settlement stays bounded by the finite XP window, not absence
 * length (20 years away is not 20 years of eligible bouts).
 */
import { ARMOUR_SLOTS } from "./armour.mjs?v=20261122-guard-impact1";
import { BOUT_MS, combatAtTime, seededCombatRandom } from "./combat.mjs?v=20261122-guard-impact1";
export const GLORY_SCROLL_ID = "glory_scroll";
export const GLORY_RULES = Object.freeze({
  winDropChance: 0.5, enchantSuccessChance: 0.5,
  maxRank: 20, attackPerRank: 1, defensePerRank: 1
});
export const ENCHANT_SLOTS = Object.freeze(["weapon",...ARMOUR_SLOTS.map(slot=>slot.id)]);
const validRank = x => Number.isSafeInteger(x) && x >= 0 && x <= GLORY_RULES.maxRank;
const validTime = x => Number.isSafeInteger(x) && x >= 0;
export const blankEnchantments = () => Object.fromEntries(ENCHANT_SLOTS.map(id=>[id,0]));
export function normalizeEnchantments(value) {
  const raw=value===undefined ? {} : value;
  if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
      Object.keys(raw).some(key=>!ENCHANT_SLOTS.includes(key)) ||
      Object.values(raw).some(v=>!validRank(v))) return null;
  const next=blankEnchantments();
  for (const slot of ENCHANT_SLOTS) if (raw[slot]!==undefined) next[slot]=raw[slot];
  return next;
}
export function enchantBonus(enchantments) {
  if (!enchantments || ENCHANT_SLOTS.some(k=>!validRank(enchantments[k])))
    throw new RangeError("Invalid enchantments");
  const defense=ARMOUR_SLOTS.reduce((n,slot)=>n+enchantments[slot.id],0);
  return Object.freeze({
    attack: enchantments.weapon*GLORY_RULES.attackPerRank,
    defense: defense*GLORY_RULES.defensePerRank
  });
}
export function enchantSlot(enchantments,slot,scrolls,roll) {
  if (!ENCHANT_SLOTS.includes(slot) || !Number.isSafeInteger(scrolls) || scrolls<=0 ||
      !enchantments || ENCHANT_SLOTS.some(k=>!validRank(enchantments[k])))
    throw new RangeError("Cannot enchant this slot");
  const before=enchantments[slot];
  if(before >= GLORY_RULES.maxRank)throw new RangeError("Enchant rank cap reached");
  const chance=roll();
  if (!Number.isFinite(chance) || chance<0 || chance>=1)
    throw new RangeError("Invalid enchant roll");
  const success=chance<GLORY_RULES.enchantSuccessChance;
  const rank=success?before+1:0;
  return { enchantments:{...enchantments,[slot]:rank},
    success,before,rank,consumed:1,remainingScrolls:scrolls-1 };
}
/** Captures when a bout may still START while the skill can earn XP. */
export function gloryEligibilityWindow(xpMissing, xpPerCycle, cycleMs, partialMs=0, startElapsed=0) {
  if (![xpMissing,xpPerCycle,cycleMs,partialMs,startElapsed].every(Number.isFinite) ||
    xpMissing<0 || xpPerCycle<=0 || cycleMs<=0 || partialMs<0 || partialMs>=cycleMs ||
    !validTime(startElapsed)) throw new RangeError("Invalid Glory XP window");
  if (xpMissing===0)return startElapsed;
  // Use the frozen nominal XP rate; +/-10% reward batch variation does not
  // invalidate a victory's eligibility once its bout has started.
  const cycles=Math.ceil(xpMissing/xpPerCycle);
  const end=startElapsed+cycles*cycleMs-partialMs;
  if (!Number.isSafeInteger(end)) throw new RangeError("Glory window exceeds safe clock");
  return end;
}
export function attachGloryTracker(session, eligibleUntilMs, startBout=0) {
  if (!session || !validTime(eligibleUntilMs) || !validTime(startBout))
    throw new RangeError("Invalid Glory tracker");
  return {...session, gloryCursor:startBout, gloryEligibleUntilMs:eligibleUntilMs};
}
export function tallyGloryVictories(session) {
  if (!session || !validTime(session.gloryCursor) ||
      !validTime(session.gloryEligibleUntilMs) ||
      !validTime(session.elapsedMs))
    throw new RangeError("Missing verified Glory cursor");
  const completed=Math.floor(session.elapsedMs/BOUT_MS);
  // A bout can qualify only if it STARTED before the skill XP window ended.
  const lastEligible=Math.ceil(session.gloryEligibleUntilMs/BOUT_MS);
  const stop=Math.min(completed,lastEligible);
  let won=0,scrolls=0;
  for (let idx=session.gloryCursor;idx<stop;idx++) {
    const resolved=combatAtTime({...session,elapsedMs:(idx+1)*BOUT_MS-1});
    if (resolved?.outcome!=="victory")continue;
    won++;
    const salt=(Math.imul((idx+1)>>>0,0x9e3779b1)^0xcafebabe^session.seed)>>>0;
    if (seededCombatRandom(salt)()<GLORY_RULES.winDropChance)scrolls++;
  }
  return {session:{...session,gloryCursor:Math.max(session.gloryCursor,stop)},
    eligibleVictories:won,scrolls};
}
