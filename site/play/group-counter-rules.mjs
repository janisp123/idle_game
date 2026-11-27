// GROUP-COUNTERS-001: symmetric, versioned, candidate endgame coefficients.
// v1 = deployed initial Battle Group. v2 = tactical counters; no legacy duel changes.
export const GROUP_COMBAT_RULES_VERSION=3;
export const SUPPORTED_GROUP_COMBAT_RULES=Object.freeze([1,2,3,4,5]);
export const COUNTERS=Object.freeze({
 arrowBlock:.76,arrowBlockImpact:.16,shieldedArrowImpact:.60,
 plateArrowImpact:.76,closeArrowImpact:.42,farArrowImpact:1.20,reachArrowImpact:1.12,
 tankMagicImpact:1.30,lightMeleeApproach:2,heavyMeleeApproach:1.35,
 interceptRange:2,arrowInterceptions:2,healRepeatRounds:2,
 healerAttack:.72,supportAttack:.88,summonerAttack:.82,
 exposedCasterAimPenalty:.12,targetCounterPriority:1.5,bridgeWidth:3,
 exposedCasterMelee:1.22,
 daggerVsPadded:1.48,daggerVsLeather:1.18,daggerVsPlate:.72,
 daggerTerrain:Object.freeze({open_field:1,narrow_bridge:1.02,ruined_streets:1.28,walled_courtyard:1.04,gatehouse_chamber:1.42}),
 arrowTerrain:Object.freeze({open_field:1,narrow_bridge:.94,ruined_streets:.66,walled_courtyard:.85,gatehouse_chamber:.40}),
 arrowTerrainAim:Object.freeze({open_field:0,narrow_bridge:0,ruined_streets:.10,walled_courtyard:.04,gatehouse_chamber:.22})
});
export const tacticalActor=a=>Boolean(a.classId&&[2,3,4,5].includes(a.groupCombatRules));
export const isArrow=attack=>attack.move==="shot";
export const intactTank=a=>a.role==="tank"&&a.shield.hp>0;

// Version 5: role-based primary targeting, not a stat or taunt cooldown.
export const TANK_PRIORITY_RULES_VERSION=5;
export const tankPriorityActor=a=>a?.groupCombatRules===TANK_PRIORITY_RULES_VERSION;
export const tankFirstTargets=(a,targets)=>{
 if(!tankPriorityActor(a))return targets;
 const living=targets.filter(b=>b.hp>0),tanks=living.filter(b=>b.role==="tank");
 return tanks.length?tanks:living;
};
export const tankHealOrder=(a,x,y)=>tankPriorityActor(a)?Number(y.role==="tank")-Number(x.role==="tank"):0;
