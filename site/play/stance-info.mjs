// Read-only descriptions of actual per-fighter group stance policy, not new modifiers.
import {TACTIC_BALANCE,tacticActivation,validTactic} from "./manager-tactics.mjs?v=manager-tactics-001";
const approach=Math.round((TACTIC_BALANCE.aggressiveApproach-1)*100);
const descriptions=Object.freeze({
 aggressive:Object.freeze({name:"Aggressive",behaviour:"Prioritizes offensive abilities and concentrating attacks on vulnerable targets. Approach progress increases by "+approach+"% when this stance activates. Flexible support skills favour offensive buffs.",strengths:"Closing distance, pressing weakened opponents, offensive support and fast melee pressure.",tradeoffs:"Does not perform normal defensive retreats or shield interception while active. Healers wait until non-tank allies fall below 58% HP before ordinary healing; urgent tank healing keeps its priority."}),
 balanced:Object.freeze({name:"Balanced",behaviour:"Uses both offensive and utility abilities when conditions permit. Target selection moderately favours wounded or focused opponents. Flexible support skills adapt between damage and protection.",strengths:"General-purpose teams, mixed roles and situations where offensive and defensive tools are both useful.",tradeoffs:"No aggressive approach bonus or defensive interception boost. Ordinary non-tank healing threshold is 78% HP. Open-field archers can still retreat when threatened."}),
 defensive:Object.freeze({name:"Defensive",behaviour:"Prioritizes secondary abilities, protective support, shield escort and interception when legal. Reach and ranged weapons may spend a ready action retreating if mobility and space permit.",strengths:"Protecting allies, keeping distance, earlier ordinary non-tank healing below 90% HP, and sustaining fragile damage dealers.",tradeoffs:"Protective movement or utility can cost attacking opportunities. Retreat needs available space and sufficient mobility. No universal damage reduction is granted simply by selecting this stance."})
});
export function stanceInfo(id,level){
 if(!validTactic(id))throw new RangeError("Unknown stance");
 const chance=Math.round(tacticActivation(level)*1000)/10;
 return {...descriptions[id],mastery:"Mastery "+level+" / "+TACTIC_BALANCE.maxLevel+" · "+chance+"% activation per eligible turn",
 shared:"Each fighter trains its selected stance independently. When the stance does not activate, normal combat policy applies. Class abilities and terrain affect the result; living tanks still draw primary attack aggro and wounded tanks receive healing priority."};
}
