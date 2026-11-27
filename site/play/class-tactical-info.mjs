// Tactical intentions, not guaranteed results. Equipment and cooldowns come from registry.
import {GROUP_CLASSES,GROUP_CLASS_IDS,RACE_LABELS} from "./battle-group-classes.mjs?v=group-001";
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
export function classTacticalInfo(id){const c=GROUP_CLASSES[id],info=CLASS_TACTICAL_INFO[id];if(!c||!info)throw RangeError("Unknown class");return {...info,name:c.name,race:RACE_LABELS[c.race],role:c.role,weapon:c.weaponLabel,armour:c.armour,cooldown:c.ability.cooldown};}
