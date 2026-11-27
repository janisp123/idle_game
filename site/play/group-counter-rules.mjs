// GROUP-COUNTERS-001: symmetric, versioned, candidate endgame coefficients.
// v1 = deployed initial Battle Group. v2 = tactical counters; no legacy duel changes.
export const GROUP_COMBAT_RULES_VERSION=2;
export const COUNTERS=Object.freeze({
 arrowBlock:.76,arrowBlockImpact:.16,shieldedArrowImpact:.60,
 plateArrowImpact:.76,closeArrowImpact:.42,farArrowImpact:1.20,reachArrowImpact:1.12,
 tankMagicImpact:1.30,lightMeleeApproach:2,heavyMeleeApproach:1.35,
 interceptRange:2,arrowInterceptions:2,healRepeatRounds:2,
 healerAttack:.72,supportAttack:.88,summonerAttack:.82,
 exposedCasterAimPenalty:.12,targetCounterPriority:1.5,bridgeWidth:3,
 exposedCasterMelee:1.22
});
export const tacticalActor=a=>Boolean(a.classId&&a.groupCombatRules===GROUP_COMBAT_RULES_VERSION);
export const isArrow=attack=>attack.move==="shot";
export const intactTank=a=>a.role==="tank"&&a.shield.hp>0;
