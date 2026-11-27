// CLASS-KITS-001 complete 31-class candidate: immutable class-specific data, no persistence or UI.
import {GROUP_CLASSES} from "./battle-group-classes.mjs?v=group-001";
export const KIT_RULES_VERSION=3;
const strike=(id,name,cooldown,scale,extra={})=>({id,name,type:"strike",cooldown,scale,...extra});
const utility=(id,name,type,cooldown,extra={})=>({id,name,type,cooldown,...extra});
const rows=[
 ["beastcaller","Familiar Bond",strike("familiar_strike","Familiar Strike",3,1.20,{familiar:true}),utility("familiar_aid","Familiar Aid","self_boon",5,{amount:.18,duration:3})],
 ["spiritcaller","Supportive Familiar",strike("spirit_bolt","Spirit Bolt",4,1.08),utility("spirit_aid","Spirit Aid","ally_heal",5,{amount:.13,range:2})],
 ["shadebinder","Disruptive Familiar",strike("shade_strike","Shade Strike",4,1.13),strike("shadow_hex","Shadow Hex",5,.85,{effect:"shadow_hex",utility:true})],
 ["forgecaller","Construct Bond",strike("construct_strike","Construct Strike",4,1.18),utility("siege_pulse","Siege Pulse","siege_charge",7,{range:0,scale:1.40,splash:.55,recovery:3})],
 ["runesage","Focused Blessings",strike("light_bolt","Light Bolt",4,1.08),utility("blessing","Blessing","support_buff",5,{range:3,amount:.24,duration:3,maxTargets:1,mode:"stance"})],
 ["wardchanter","Protective Songs",strike("sword_cut","Sword Cut",4,1.08),utility("sheltering_song","Sheltering Song","support_buff",5,{range:2,amount:.22,duration:3,maxTargets:3,mode:"guard"})],
 ["war_dancer","Battle Rhythm",strike("twin_cut","Twin Cut",4,1.15),utility("war_dance","War Dance","support_buff",5,{range:2,amount:.12,duration:3,maxTargets:3,mode:"tempo"})],
 ["hexchief","Seal Affinity",strike("hex_bolt","Hex Bolt",4,1.04,{effect:"weaken"}),utility("sealing_circle","Sealing Circle","seal",6,{range:2,maxTargets:3})],
 ["warcaller","Chant Endurance",strike("war_bolt","War Bolt",4,1.05),utility("battle_chant","Battle Chant","support_buff",5,{range:3,amount:.16,duration:3,maxTargets:3,mode:"stance"})],
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
export const kitActor=a=>[KIT_RULES_VERSION,4,5,6,7,8,9,10].includes(a?.groupCombatRules)&&Boolean(a.classId);

 // V7 source-inspired variants. Legacy CLASS_KITS remains immutable for frozen v1–v6.
 const hex=(id,name,effect,cooldown,extra={})=>utility(id,name,"tactical_control",cooldown,{effect,...extra});
 const variants={
  blademaster:{primary:strike("sonic_cleave","Sonic Cleave",4,1.48,{range:1,recovery:3,guardPierce:true})},
  linebreaker:{secondary:strike("shock_sweep","Shock Sweep",6,.88,{effect:"control",spreadControl:true,utility:true})},
  oathkeeper:{primary:strike("shield_stun","Shield Stun",5,1.06,{effect:"control"})},
  grimwarden:{secondary:hex("hamstring","Hamstring","slow",5,{range:2,physical:true})},
  trickblade:{}, // retain target disruption
  longshot:{secondary:hex("stunning_shot","Stunning Shot","stun",6,{physical:true})},
  windbow:{primary:hex("stunning_shot","Stunning Shot","stun",6,{physical:true})},
  blackbow:{primary:hex("stunning_shot","Stunning Shot","stun",7,{physical:true})},
  flameweaver:{secondary:hex("cancellation","Cancellation","dispel",6)},
  gravebinder:{primary:hex("curse_gloom","Curse Gloom","gloom",5),secondary:hex("anchor","Anchor","paralysis",8)},
  lifekeeper:{}, // preserve strongest dedicated healer
  runesage:{primary:hex("dryad_root","Dryad Root","root",6,{range:4})},
  grovewarden:{primary:hex("arrest","Arrest","root",6,{range:1})},
  wardchanter:{}, // protective songs
  swiftblade:{primary:hex("entangle","Entangle","slow",5,{range:3})},
  frostweaver:{secondary:hex("ice_bind","Ice Bind","root",6)},
  spiritcaller:{secondary:utility("seraphim_aid","Seraphim Aid","support_buff",5,{range:3,amount:.10,duration:3,maxTargets:2,mode:"magic_tempo"})},
  wellspring:{secondary:hex("purifying_grace","Purifying Grace","cleanse",5,{range:3})},
  dreadguard:{secondary:hex("lightning_strike","Lightning Strike","paralysis",8,{range:2})},
  war_dancer:{}, // shared offensive tempo
  nightblade:{secondary:strike("hex_blade","Hex Blade",5,1.10,{effect:"physical_vulnerability",utility:true})},
  galescourge:{secondary:hex("silence","Silence","silence",7)},
  shadebinder:{secondary:hex("nightshade_curse","Nightshade Curse","antiheal",6)},
  bloodsage:{secondary:hex("dryad_root","Dryad Root","root",6,{range:4}),primary:utility("battle_mend","Battle Mend","ally_heal",4,{amount:.17,range:3,boon:.10,pact:true})},
  ironfist:{primary:strike("force_blaster","Force Blaster",4,1.12,{range:2,effect:"slow"})},
  hexchief:{secondary:hex("seal_of_silence","Seal of Silence","silence",8,{range:2,area:true})},
  warcaller:{primary:hex("madness","Madness","sleep",7,{range:3})},
  beastcaller:{},ragebreaker:{},scrapbreaker:{},forgecaller:{}
 };
 export const CONTROL_CLASS_KITS=Object.freeze(Object.fromEntries(Object.entries(CLASS_KITS).map(([id,k])=>[id,Object.freeze({...k,...Object.fromEntries(Object.entries(variants[id]??{}).map(([slot,v])=>[slot,Object.freeze(v)]))})])));

export const pilotKit=a=>kitActor(a)?([7,8,9,10].includes(a.groupCombatRules)?CONTROL_CLASS_KITS:CLASS_KITS)[a.classId]??null:null;
export const classMasteryStrength=level=>.5+.5*(level-1)/49;
export const kitStrength=a=>[9,10].includes(a.groupCombatRules)?classMasteryStrength(a.classLevel):.75+.25*(a.classLevel-1)/49;
// Scale a beneficial modifier around its neutral value, not the base attack.
export const masteryBonus=(a,magnitude)=>[9,10].includes(a.groupCombatRules)?magnitude*kitStrength(a):magnitude;
export const KIT_BALANCE=Object.freeze({daggerShieldImpact:.38,daggerShieldBlock:.65,daggerPlateImpact:.62,daggerBlockedImpact:.19,
 opportunist:1.12,swiftEvasion:.07,swiftPursuit:1.22,nightCritical:.22,nightDamage:.94,
 marksmanAim:.10,marksmanImpact:1.10,windImpact:.87,blackImpact:1.16,
 guardianBlock:.10,grimLowHPGuard:.13,groveMagicGuard:.30,dreadBlockWeaken:.10,
 focusAim:.16,focusDuration:3,slowDuration:2,disruptDuration:2,
 bladeBlockImpact:.62,bladeParryImpact:.53,lineReachImpact:1.15,lineContactImpact:.85,
 rageThreshold:.45,rageImpact:1.23,ragePursuit:.85,totemApproach:1.35,totemImpact:1.18,totemGuard:.18,scrapPlateImpact:1.18,
 flameImpact:.90,flameSplash:1.15,graveCurseImpact:1.18,frostImpact:.83,frostRecovery:-1,galeImpact:1.17,galeRecovery:1,siphonMaxHP:.12,
 mercyHealing:1.12,mercyImpact:.78,resilienceSlow:.75,pactDamageFraction:.25,pactMaxHP:.08,pactThreshold:.80,healEmergency:.35,
 focusedBlessing:1.12,protectiveSong:1.12,wardchanterImpact:.86,warcallerImpact:.83,
 chantExtraDuration:1,tempoImpact:.10,tempoRecovery:-1,sealImmunity:4,sealImpact:1.12,
 beastDirectImpact:.88,beastFamiliarImpact:1.12,spiritImpact:.85,spiritHealing:1.10,
 shadeImpact:.90,shadeDisruptAim:.10,shadeWeakness:.22,forgeApproach:.80,forgePlateGuard:.12,forgeImpact:.90});
for(const [id,k] of Object.entries(CLASS_KITS)){
 if(!GROUP_CLASSES[id]||k.primary.id===k.secondary.id||[k.primary,k.secondary].some(b=>!Number.isInteger(b.cooldown)||b.cooldown<2))throw Error("Invalid class kit "+id);
}

if(Object.keys(CLASS_KITS).length!==Object.keys(GROUP_CLASSES).length||Object.keys(GROUP_CLASSES).some(id=>!Object.hasOwn(CLASS_KITS,id)))throw Error("Incomplete class kit registry");
