// CLASS-KITS-001 pilot, melee, mage and healer batches: immutable class-specific data, no persistence or UI.
import {GROUP_CLASSES} from "./battle-group-classes.mjs?v=group-001";
export const KIT_RULES_VERSION=3;
const strike=(id,name,cooldown,scale,extra={})=>({id,name,type:"strike",cooldown,scale,...extra});
const utility=(id,name,type,cooldown,extra={})=>({id,name,type,cooldown,...extra});
const rows=[
 ["lifekeeper","Mercy",utility("greater_mend","Greater Mend","ally_heal",3,{amount:.25,range:3}),utility("group_mend","Group Mend","group_heal",5,{amount:.11,range:3})],
 ["wellspring","Resilience",utility("cleansing_mend","Cleansing Mend","ally_heal",4,{amount:.20,range:3,cleanse:true}),utility("sanctuary","Sanctuary","sanctuary",5,{range:2,duration:2})],
 ["bloodsage","Blood Rite",utility("battle_mend","Battle Mend","ally_heal",4,{amount:.17,range:3,boon:.10}),utility("blood_pact","Blood Pact","blood_pact",5,{range:2,duration:4})],
 ["flameweaver","Fire Spread",strike("flame_burst","Flame Burst",4,1.10,{splash:.50}),strike("fire_ring","Fire Ring",5,.95,{range:0,splash:.60,utility:true})],
 ["gravebinder","Curse Affinity",strike("withering_curse","Withering Curse",4,1.05,{effect:"weaken"}),utility("grave_ward","Grave Ward","ward",6,{threshold:.65,amount:.26})],
 ["frostweaver","Quick Casting",strike("frost_bolt","Frost Bolt",4,1.04,{effect:"slow"}),strike("ice_bind","Ice Bind",6,.82,{effect:"control",utility:true})],
 ["galescourge","Heavy Casting",strike("gale_strike","Gale Strike",5,1.38),strike("life_siphon","Life Siphon",6,.95,{maxHP:.70,siphon:.35,utility:true})],
 ["blademaster","Disciplined Edge",strike("sonic_cleave","Sonic Cleave",4,1.48,{recovery:3,guardPierce:true}),utility("brace","Brace","brace",5,{duration:3})],
 ["linebreaker","Long Reach",strike("sweeping_thrust","Sweeping Thrust",5,1.12,{splash:.42}),strike("pinning_sweep","Pinning Sweep",5,.88,{effect:"slow",spreadSlow:true,utility:true})],
 ["ragebreaker","Fury",strike("rage_strike","Rage Strike",5,1.50,{recovery:3}),utility("last_stand","Last Stand","ward",6,{threshold:.40,amount:.32})],
 ["ironfist","Totem Discipline",strike("disrupting_fist","Disrupting Fist",4,1.12,{effect:"control"}),utility("totem_surge","Totem Surge","totem",6,{duration:3})],
 ["scrapbreaker","Blunt Expertise",strike("guard_break","Guard Break",4,1.22,{effect:"open"}),strike("staggering_blow","Staggering Blow",5,1.05,{effect:"control",utility:true})],
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
 focusAim:.16,focusDuration:3,slowDuration:2,disruptDuration:2,
 bladeBlockImpact:.62,bladeParryImpact:.53,lineReachImpact:1.15,lineContactImpact:.85,
 rageThreshold:.45,rageImpact:1.23,ragePursuit:.85,totemApproach:1.35,totemImpact:1.18,totemGuard:.18,scrapPlateImpact:1.18,
 flameImpact:.90,flameSplash:1.15,graveCurseImpact:1.18,frostImpact:.83,frostRecovery:-1,galeImpact:1.17,galeRecovery:1,siphonMaxHP:.12,
 mercyHealing:1.12,mercyImpact:.78,resilienceSlow:.75,pactDamageFraction:.25,pactMaxHP:.08,pactThreshold:.80,healEmergency:.35});
for(const [id,k] of Object.entries(CLASS_KITS)){
 if(!GROUP_CLASSES[id]||k.primary.id===k.secondary.id||[k.primary,k.secondary].some(b=>!Number.isInteger(b.cooldown)||b.cooldown<2))throw Error("Invalid class kit "+id);
}
