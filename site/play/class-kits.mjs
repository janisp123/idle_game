// CLASS-KITS-001 pilot: immutable class-specific data, no persistence or UI.
import {GROUP_CLASSES} from "./battle-group-classes.mjs?v=group-001";
export const KIT_RULES_VERSION=3;
const strike=(id,name,cooldown,scale,extra={})=>({id,name,type:"strike",cooldown,scale,...extra});
const utility=(id,name,type,cooldown,extra={})=>({id,name,type,cooldown,...extra});
const rows=[
 ["trickblade","Opportunist",strike("feint","Feint",4,1.25,{effect:"open"}),utility("misdirection","Misdirection","disrupt",5)],
 ["swiftblade","Agility",strike("hamstring","Hamstring",4,1.05,{effect:"slow"}),utility("dash","Dash","dash",5)],
 ["nightblade","Lethality",strike("execution_strike","Execution Strike",5,1.55,{recovery:3}),strike("deep_wound","Deep Wound",4,1.10,{effect:"bleed",utility:true})],
 ["longshot","Marksman",strike("aimed_shot","Aimed Shot",4,1.40,{minRange:1}),utility("sniper_focus","Sniper's Focus","focus",6)],
 ["windbow","Skirmisher",strike("rapid_shot","Rapid Shot",4,.95,{range:1,recovery:1}),utility("evade","Evade","retreat",5)],
 ["blackbow","Dead Eye",strike("piercing_shot","Piercing Shot",5,1.40,{effect:"open"}),strike("last_shot","Last Shot",6,1.65,{maxHP:.45,recovery:3,utility:true})],
 ["oathkeeper","Guardian",strike("shield_strike","Shield Strike",4,1.12,{effect:"open"}),utility("sacrifice","Sacrifice","sacrifice",5)],
 ["grimwarden","Shadow Bond",strike("panther_strike","Panther Strike",4,1.45),utility("dark_bulwark","Dark Bulwark","ward",5,{threshold:.65,amount:.26})],
 ["grovewarden","Spell Ward",strike("ward_strike","Ward Strike",4,1.16),utility("natures_renewal","Nature's Renewal","self_heal",5,{threshold:.70,amount:.13})],
 ["dreadguard","Disruptive Shield",strike("dread_strike","Dread Strike",4,1.18,{effect:"weaken"}),strike("dark_bind","Dark Bind",6,.90,{effect:"control",utility:true})]
];
export const CLASS_KITS=Object.freeze(Object.fromEntries(rows.map(([id,passive,primary,secondary])=>[id,Object.freeze({passive,primary:Object.freeze(primary),secondary:Object.freeze(secondary)})])));
export const kitActor=a=>a?.groupCombatRules===KIT_RULES_VERSION&&Boolean(a.classId);
export const pilotKit=a=>kitActor(a)?CLASS_KITS[a.classId]??null:null;
export const kitStrength=a=>.75+.25*(a.classLevel-1)/49;
export const KIT_BALANCE=Object.freeze({daggerShieldImpact:.38,daggerShieldBlock:.65,daggerPlateImpact:.62,daggerBlockedImpact:.19,
 opportunist:1.12,swiftEvasion:.07,swiftPursuit:1.22,nightCritical:.22,nightDamage:.94,
 marksmanAim:.10,marksmanImpact:1.10,windImpact:.87,blackImpact:1.16,
 guardianBlock:.10,grimLowHPGuard:.13,groveMagicGuard:.30,dreadBlockWeaken:.10,
 focusAim:.16,focusDuration:3,slowDuration:2,disruptDuration:2});
for(const [id,k] of Object.entries(CLASS_KITS)){
 if(!GROUP_CLASSES[id]||k.primary.id===k.secondary.id||[k.primary,k.secondary].some(b=>!Number.isInteger(b.cooldown)||b.cooldown<2))throw Error("Invalid class kit "+id);
}
