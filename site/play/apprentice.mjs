/** APPRENTICE-A1: pure unlock policy. No automatic actions or save mutations.
 * Thresholds derive from activated levels, not XP, time, or saved unlock flags.
 */
export const APPRENTICE_BALANCE=Object.freeze({
  levelsPerSlot:10,
  maxSlots:5,
  autoMaster:0
});

/** The caller supplies actual SKILL_IDS from the engine; never count arbitrary keys. */
export function earnedActivityLevels(state,skillIds){
  if(!Array.isArray(skillIds)||new Set(skillIds).size!==skillIds.length)
    throw new RangeError("Invalid skill catalogue");
  let total=0;
  for(const id of skillIds){
    const level=state?.skills?.[id]?.level;
    if(!Number.isSafeInteger(level)||level<1)throw new RangeError("Invalid activated skill level");
    total+=level-1;
    if(!Number.isSafeInteger(total))throw new RangeError("Invalid total earned levels");
  }
  return total;
}
export function apprenticeProgress(state,skillIds){
  const earnedLevels=earnedActivityLevels(state,skillIds);
  const slots=Math.min(APPRENTICE_BALANCE.maxSlots,1+Math.floor(earnedLevels/APPRENTICE_BALANCE.levelsPerSlot));
  return {earnedLevels,slots,
    nextSlotAt:slots<APPRENTICE_BALANCE.maxSlots?slots*APPRENTICE_BALANCE.levelsPerSlot:null,
    autoMasterUnlocked:earnedLevels>=APPRENTICE_BALANCE.autoMaster,
    autoMasterAt:APPRENTICE_BALANCE.autoMaster};
}

/** Consent is specific to the current Master tribute policy. A future policy change
 * must increment this version and require consent again. */
export const MASTER_CONSENT_VERSION = 1;
export const normalizeMasterConsent = value => value === MASTER_CONSENT_VERSION ? MASTER_CONSENT_VERSION : 0;
