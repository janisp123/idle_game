// Tactical intentions, not guaranteed results. Equipment and cooldowns come from registry.
import {GROUP_CLASSES,GROUP_CLASS_IDS,RACE_LABELS} from "./battle-group-classes.mjs?v=group-001";
import {CLASS_KITS,CONTROL_CLASS_KITS,KIT_BALANCE as B} from "./class-kits.mjs";
const rows=[
  [
    "blademaster",
    "Heavy twin-sword burst.",
    "Exposed damage dealers; frontline pressure.",
    "Open Field, Walled Courtyard",
    "Shielded tanks; ranged pressure while closing.",
    "Gatehouse Chamber: closing through confined space."
  ],
  [
    "linebreaker",
    "Polearm reach and sweeping strikes against nearby enemies.",
    "Crowded frontlines and closing melee.",
    "Narrow Bridge, Walled Courtyard",
    "Enemies inside polearm reach; isolated ranged targets.",
    "Gatehouse Chamber: restricted reach."
  ],
  [
    "oathkeeper",
    "Wards a nearby ally; intact shield intercepts arrows.",
    "Archers and attacks on vulnerable allies.",
    "Narrow Bridge, Gatehouse Chamber",
    "Magic and armour breakers; low offensive output.",
    "Open Field against mobile magic teams."
  ],
  [
    "grimwarden",
    "Counterattack with temporary personal protection.",
    "Physical attackers, especially archers.",
    "Narrow Bridge, Gatehouse Chamber",
    "Magic and armour breakers; weak pursuit.",
    "Open Field against mobile casters."
  ],
  [
    "trickblade",
    "Dagger feint opens enemy guard.",
    "Padded-armour mages, exposed healers and archers at contact.",
    "Ruined Streets, Gatehouse Chamber",
    "Plate armour and shields; must physically reach victims.",
    "Open Field: exposed while crossing distance."
  ],
  [
    "longshot",
    "Powerful aimed bow strike.",
    "Exposed casters and healers at distance.",
    "Open Field, clear Narrow Bridge sightlines",
    "Shields, plate and opponents already in melee range.",
    "Ruined Streets, Gatehouse Chamber: obstructed shooting."
  ],
  [
    "flameweaver",
    "Staff spells splash nearby enemies after a hit.",
    "Clusters and heavily armoured tanks.",
    "Narrow Bridge, Gatehouse Chamber with protection",
    "Fast daggers, clear arrow fire; fragile at contact.",
    "Open Field when exposed; confined fights without protection."
  ],
  [
    "gravebinder",
    "Staff curse damages and weakens its target.",
    "Heavy armour and dangerous damage dealers.",
    "Narrow Bridge, Walled Courtyard",
    "Focused ranged fire and fast melee.",
    "Open Field when exposed; close contact without protection."
  ],
  [
    "beastcaller",
    "Familiar-themed wand strike strengthens the caster; no separate pet actor.",
    "Exposed opponents; sustained mixed-team pressure.",
    "Walled Courtyard, Open Field with protection",
    "Focus fire and close melee; hybrid damage tradeoff.",
    "Gatehouse Chamber when exposed."
  ],
  [
    "lifekeeper",
    "Strong direct healing for a wounded living ally; no revival.",
    "Sustained damage against a protected frontline.",
    "Narrow Bridge, Walled Courtyard behind tanks",
    "Burst and focus fire; limited offense.",
    "Open Field when exposed; Gatehouse Chamber without protection."
  ],
  [
    "runesage",
    "Blesses a nearby ally with an offensive buff.",
    "Strong allied damage dealers.",
    "Walled Courtyard, Narrow Bridge",
    "Direct pressure, isolation, redundant buffs.",
    "Open Field when separated from allies."
  ],
  [
    "grovewarden",
    "Wards a nearby ally and intercepts physical attacks.",
    "Archers and pressure on vulnerable allies.",
    "Narrow Bridge, Gatehouse Chamber",
    "Magic and armour breakers; isolated pursuit.",
    "Open Field against ranged magic."
  ],
  [
    "wardchanter",
    "Protective song wards up to three nearby allies.",
    "Sustained damage against clustered allies.",
    "Narrow Bridge, Gatehouse Chamber",
    "Burst before wards activate; needs allied damage.",
    "Open Field if allies spread out."
  ],
  [
    "swiftblade",
    "Mobile dagger attack grants temporary personal protection.",
    "Exposed ranged fighters and casters at contact.",
    "Ruined Streets, Gatehouse Chamber",
    "Heavy armour, shields and control.",
    "Open Field: must close before attacking."
  ],
  [
    "windbow",
    "Mobile bow strike adds temporary personal protection.",
    "Exposed light-armour targets at range.",
    "Open Field, clear Narrow Bridge sightlines",
    "Shields and close pursuit; cannot heal.",
    "Gatehouse Chamber, Ruined Streets."
  ],
  [
    "frostweaver",
    "Staff attack briefly staggers a target; control immunity limits repeats.",
    "Closing melee and heavy armour.",
    "Narrow Bridge, Walled Courtyard behind allies",
    "Focused archers and melee at contact.",
    "Gatehouse Chamber when exposed; open-field arrow fire."
  ],
  [
    "spiritcaller",
    "Wand attack can heal a wounded nearby ally after a hit.",
    "Mixed teams needing supplemental healing.",
    "Walled Courtyard, Narrow Bridge near allies",
    "Focused damage and isolation; hybrid attack tradeoff.",
    "Gatehouse Chamber when exposed."
  ],
  [
    "wellspring",
    "Heals and removes bleed, stagger and weakening.",
    "Debuff-heavy opponents and sustained damage.",
    "Narrow Bridge, Walled Courtyard behind tanks",
    "Focused burst and close assassins.",
    "Gatehouse Chamber when exposed; open-field arrows."
  ],
  [
    "dreadguard",
    "Shield-bearing attack weakens enemy damage.",
    "Archers and dangerous physical attackers.",
    "Narrow Bridge, Gatehouse Chamber",
    "Magic and armour breakers; slow pursuit.",
    "Open Field against mobile casters."
  ],
  [
    "war_dancer",
    "Twin swords and a damage-boosting song for up to three allies.",
    "Mixed offensive teams within support range.",
    "Walled Courtyard, Narrow Bridge",
    "Isolation, redundant buffs and focus fire.",
    "Open Field if allies spread out."
  ],
  [
    "nightblade",
    "High-impact dagger flank opens guard.",
    "Padded-armour mages, healers and archers at contact.",
    "Ruined Streets, Gatehouse Chamber",
    "Plate and intact shields; exposed approach.",
    "Open Field: no instant access to targets."
  ],
  [
    "blackbow",
    "Piercing bow strike opens the target's guard on a hit.",
    "Exposed casters; opening guards for allies.",
    "Open Field, clear Narrow Bridge sightlines",
    "Intact shields, heavy plate and close melee.",
    "Ruined Streets, Gatehouse Chamber."
  ],
  [
    "galescourge",
    "Powerful staff gust splashes nearby opponents.",
    "Clustered enemies and heavy armour.",
    "Narrow Bridge, Gatehouse Chamber with protection",
    "Mobile assassins and exposed ranged duels.",
    "Open Field without protection; contact with daggers."
  ],
  [
    "shadebinder",
    "Shade-themed wand attack weakens its target; no separate pet actor.",
    "Strong enemy damage dealers.",
    "Walled Courtyard, Narrow Bridge with protection",
    "Focused archers and fast melee; hybrid damage tradeoff.",
    "Gatehouse Chamber when exposed."
  ],
  [
    "bloodsage",
    "Heals a wounded ally and briefly boosts its damage.",
    "Offensive teams in sustained exchanges.",
    "Walled Courtyard, Narrow Bridge behind allies",
    "Focus fire; less direct healing than Lifekeeper.",
    "Gatehouse Chamber when exposed; open-field arrows."
  ],
  [
    "ragebreaker",
    "Heavy axe strike delivers concentrated burst.",
    "Targets within melee range; exposed damage dealers.",
    "Walled Courtyard, Ruined Streets",
    "Slow recovery, ranged harassment and shields.",
    "Open Field while closing."
  ],
  [
    "ironfist",
    "Close gauntlet strike briefly staggers its target.",
    "Disrupting exposed casters and light-armour fighters.",
    "Ruined Streets, Gatehouse Chamber",
    "Range, heavy armour and control immunity.",
    "Open Field against retreating archers."
  ],
  [
    "hexchief",
    "Ranged magical mace attack weakens and splashes enemies.",
    "Clustered attackers and heavy armour.",
    "Narrow Bridge, Walled Courtyard",
    "Focused archers and fast melee; lower pure offense.",
    "Open Field when exposed; Gatehouse Chamber without protection."
  ],
  [
    "warcaller",
    "Chants buff allies or ward them in defensive stance.",
    "Mixed groups staying within support range.",
    "Narrow Bridge, Walled Courtyard",
    "Isolation, redundant buffs and focused attacks.",
    "Open Field when separated from allies."
  ],
  [
    "scrapbreaker",
    "Hammer strike opens guards; blunt impact disrupts targets.",
    "Heavy physical protection and shielded frontlines.",
    "Gatehouse Chamber, Ruined Streets",
    "Slow recovery and distant ranged enemies.",
    "Open Field while closing."
  ],
  [
    "forgecaller",
    "Construct-themed hammer strike grants personal protection; no separate pet actor.",
    "Close-range pressure with extra durability.",
    "Gatehouse Chamber, Walled Courtyard",
    "Mobile ranged enemies; hybrid attack tradeoff.",
    "Open Field against retreating opponents."
  ]
];
export const CLASS_TACTICAL_INFO=Object.freeze(Object.fromEntries(rows.map(([id,summary,strong,best,weak,worst])=>[id,Object.freeze({summary,strong,best,weak,worst})])));
if(rows.length!==GROUP_CLASS_IDS.length||GROUP_CLASS_IDS.some(id=>!CLASS_TACTICAL_INFO[id]))throw Error("Incomplete class tactical guide");
// Names, cooldowns and ability parameters come from the combat registry.
const passives=Object.freeze({
 blademaster:"Sonic Cleave penetrates blocks and parries while the weapon is intact.",
 linebreaker:"Polearm strikes hit harder at reach and are less effective at contact.",
 ragebreaker:"Axe damage rises at low health; pursuit is slower.",
 ironfist:"Totem effects depend on stance: pursuit, damage or protection.",
 scrapbreaker:"Intact blunt weapons deal more impact against intact plate.",
 trickblade:"Extra dagger impact against targets without intact plate or a tank shield.",
 swiftblade:"Improved evasion and faster pursuit.",
 nightblade:"More critical pressure with daggers, at the cost of lower ordinary impact.",
 longshot:"Standing still at range improves bow aim and impact.",
 windbow:"Trades bow impact for mobile attack options.",
 blackbow:"Harder bow strikes with longer recovery.",
 oathkeeper:"Extra physical block chance while the shield remains intact.",
 grimwarden:"Reduces incoming impact at low health.",
 grovewarden:"Reduces incoming magical impact.",
 dreadguard:"Defensive shield and weakening attacks disrupt enemy pressure.",
 flameweaver:"Enhanced fire splash, reduced isolated magical impact.",
 gravebinder:"Increased magical impact against already weakened enemies.",
 frostweaver:"Shorter spell recovery, lower magical impact.",
 galescourge:"Higher magical impact, longer recovery.",
 lifekeeper:"Improved healing, reduced personal impact.",
 wellspring:"Less movement loss from slows and longer control immunity.",
 bloodsage:"Supports melee sustain through Blood Pact and offensive healing.",
 runesage:"Stronger focused single-target blessings.",
 wardchanter:"Stronger protective songs, reduced personal impact.",
 war_dancer:"War Dance gives offensive buffs and shorter recovery on slow attacks.",
 hexchief:"Increased impact against enemies affected by a seal.",
 warcaller:"Longer-lasting chants, reduced personal impact.",
 beastcaller:"Improved Familiar Strike, lower direct attack impact.",
 spiritcaller:"Improved hybrid healing, lower personal impact.",
 shadebinder:"Improved aim against disrupted targets, lower personal impact.",
 forgecaller:"Slower pursuit and lower personal impact; intact plate reduces physical impact."
});
const pct=n=>Math.round(n*100)+"%";
const effects=Object.freeze({open:"Opens the target's guard on a clean hit.",slow:"Slows movement on a clean hit.",bleed:"Inflicts bleeding on a clean hit.",weaken:"Weakens the target on a clean hit.",control:"Briefly disrupts the target on a clean hit, subject to immunity.",shadow_hex:"Weakens and disrupts enemy targeting on a clean hit.",physical_vulnerability:"Increases physical damage received on a clean hit."});
function abilityEffect(a){
 const range=a.range===undefined?"":a.range===0?" At close contact.":" Within "+a.range+" range units.";
 switch(a.type){
 case "tactical_control":return ({root:"Prevents movement, not attacks.",slow:"Reduces approach progress.",stun:"Briefly prevents actions.",paralysis:"Prevents movement and actions longer than stun.",sleep:"Prevents actions until damage wakes the target.",silence:"Prevents magic attacks and spell abilities.",gloom:"Increases incoming magic impact and also reduces healing for Gravebinder.",antiheal:"Reduces incoming healing.",dispel:"Removes temporary beneficial combat effects.",cleanse:"Removes harmful combat effects from a living ally."}[a.effect]??"Tactical utility.")+range+(a.area?" Affects up to three clustered targets.":"")+" Consumes an action; hostile effects can be resisted and control has immunity windows.";
 case "strike":return ["Attacks for "+pct(a.scale)+" of normal base impact before mastery, passives and defenses.",range.trim(),a.minRange?"Requires separation from the target.":"",a.guardPierce?"Penetrates blocks and parries.":"",effects[a.effect]??"",a.splash?"On a clean hit, damages up to two additional nearby enemies.":"",a.spreadSlow?"Can slow up to two additional nearby enemies.":"",a.spreadControl?"Can stun up to two additional nearby enemies.":"",a.maxHP?"Available at "+pct(a.maxHP)+" health or lower.":"",a.siphon?"Recovers up to "+pct(B.siphonMaxHP)+" maximum HP from actual damage, subject to the shared healing window.":""].filter(Boolean).join(" ");
 case "ally_heal":return "Heals one wounded living ally (base "+pct(a.amount)+" maximum HP)."+range+(a.cleanse?" Removes bleed, stagger, weaken, slow and targeting disruption after a successful heal.":"")+(a.boon?" Also grants a temporary offensive buff.":"")+(a.pact?" Grants temporary life-steal if the healed ally is melee.":"");
 case "group_heal":return "Heals up to three wounded living allies (base "+pct(a.amount)+" maximum HP each); prioritizes direct rescue when an eligible ally is critical."+range;
 case "ward":return "Grants temporary personal mitigation at below "+pct(a.threshold)+" health.";
 case "self_heal":return "Recovers base "+pct(a.amount)+" maximum HP at below "+pct(a.threshold)+" health.";
 case "sacrifice":return "Heals a wounded nearby ally at a cost to the caster's own health; cannot revive.";
 case "brace":return "Temporarily protects against disabling effects when a disruptive enemy is nearby.";
 case "totem":return "Temporarily improves pursuit in balanced stance, impact in aggressive stance or protection in defensive stance.";
 case "disrupt":return "Disrupts a nearby enemy's targeting.";
 case "dash":return "Advances up to two tiles toward a distant enemy if movement is legal and the caster is not slowed.";
 case "retreat":return "Steps away from a close enemy when retreat space and remaining retreats allow.";
 case "focus":return "Improves ranged aim temporarily after standing still with clear sightlines.";
 case "sanctuary":return "Temporarily protects one threatened or impaired wounded ally from control."+range;
 case "blood_pact":return "Grants a threatened wounded melee ally temporary healing from clean direct melee damage, capped at "+pct(B.pactMaxHP)+" maximum HP per eligible heal."+range;
 case "support_buff":return "Temporarily "+(a.mode==="guard"?"wards":a.mode==="tempo"?"boosts attack and slow-attack recovery for":a.mode==="magic_tempo"?"boosts magical damage dealers and slow spell recovery for":"wards or boosts attack (depending on stance) for")+" up to "+a.maxTargets+" nearby "+(a.maxTargets===1?"ally":"allies")+"; stronger existing effects take priority."+range;
 case "seal":return "Delays one ready or nearly ready ability per enemy in a cluster of two or three; recipient immunity limits repeated delays."+range;
 case "self_boon":return "Temporarily grants personal offensive power or protection, depending on stance and threat.";
 case "siege_charge":return "Charges against a close clustered target; releases a bounded area strike on a later action if that target remains alive and in reach, otherwise fizzles.";
 default:throw Error("Unknown class ability type "+a.type);
 }
}
export function classTacticalInfo(id,rules=3){
 const c=GROUP_CLASSES[id],info=CLASS_TACTICAL_INFO[id],kit=(rules===7?CONTROL_CLASS_KITS:CLASS_KITS)[id];
 if(!c||!info||!kit||!passives[id])throw RangeError("Unknown class");
 const abilities=[kit.primary,kit.secondary].map(a=>({id:a.id,name:a.name,cooldown:a.cooldown,effect:abilityEffect(a)}));
 return {...info,name:c.name,race:RACE_LABELS[c.race],role:c.role,weapon:c.weaponLabel,armour:c.armour,passive:{name:kit.passive,effect:passives[id]},abilities};
}
for(const id of GROUP_CLASS_IDS){classTacticalInfo(id);classTacticalInfo(id,7);}
