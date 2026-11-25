// Read-only character sheet. All numeric totals come from the selected build
// constructed by the engine and the shared physical resolver helpers.
import {desiredArenaPlayer,ACTIVITIES} from "./engine.mjs?v=char-stats-001";
import {ATTRIBUTE_BALANCE,ATTRIBUTES,effectiveAttributeProgress,masteryBonusesForSkill} from "./attributes.mjs?v=glad-001";
import {physicalBuildStats} from "./physical-duel.mjs?v=char-stats-001";
import {ARMOUR_SLOTS,ARMOUR_TIER_LABELS,armourStats,initialArmour,armourOption,WEAPON_PIECES} from "./armour.mjs?v=alpha-gear-a8";
import {ITEM_GRADES,STARTER_ITEM,equippedCondition} from "./smith.mjs?v=alpha-gear-a8";
import {COMBAT_LOADOUTS} from "./combat-skills.mjs?v=glad-002";
const fmt=n=>Number(n.toFixed(3)).toLocaleString("en-US",{maximumFractionDigits:3});
const pct=n=>fmt(n*100)+"%";
const signed=(n,suffix="")=>(n<0?"−":"+")+fmt(Math.abs(n))+suffix;
const pp=n=>signed(n*100," pp");
const itemLabel=(name,item)=>name+" · "+ITEM_GRADES[item.grade]+" "+item.quality;
const row=(label,value)=>({label,value:String(value)});
const section=(title,total,rows,note="")=>({title,total:String(total),rows,note});
export function characterStats(state){
  const p=desiredArenaPlayer(state),v=physicalBuildStats(p);
  const earned=effectiveAttributeProgress(state.attributeEffort,state.skills);
  const attrs=effectiveAttributeProgress(state.attributeEffortActive,state.skills);
  const kit=p.trainingKit,weaponName=itemLabel(COMBAT_LOADOUTS[p.loadout].name,kit.equipment[p.loadout]);
  const trained=equippedCondition(kit.armour,p.loadout,kit.equipment);
  const pieces=ARMOUR_SLOTS.filter(slot=>kit.armour[slot.id]!=="none").map(slot=>{
    const family=kit.armour[slot.id],part=p.condition.armour[slot.id];
    return {slot,family,part,full:trained.armour[slot.id],name:itemLabel(slot.name+" "+ARMOUR_TIER_LABELS[family],kit.equipment[slot.id+":"+family])};
  });
  const sections=ATTRIBUTES.map(({id,name})=>section(name+" ("+id+")",fmt(earned[id].value),[
    row("Starting attribute",fmt(ATTRIBUTE_BALANCE.startingStat)),
    row("Productive-time training",signed(earned[id].baseValue-ATTRIBUTE_BALANCE.startingStat)),
    ...Object.entries(state.skills).flatMap(([activity,skill])=>{
      const n=masteryBonusesForSkill(activity,skill.level)[id];
      return n?[row(ACTIVITIES[activity].title+" · claimed Lv "+skill.level,signed(n))]:[];
    }),
    ...(attrs[id].value!==earned[id].value?[row("Active for next bout",fmt(attrs[id].value))]:[])
  ],"Training history is stored as total effort, not per-activity history."));
  sections.push(section("Maximum HP",fmt(v.health.total),[row("Base HP",fmt(v.health.base)),row("Endurance × 1.6",signed(v.health.endurance)),row("Rounding",signed(v.health.total-v.health.base-v.health.endurance))]));
  for(const a of v.attacks){
    const fullFlat=trained.weapon.flatAttack*.65;
    const fullMultiplier=trained.weapon.damageMultiplier;
    sections.push(section("Damage · "+a.move.replaceAll("_"," "),fmt(a.base),[
      row(weaponName+" · base move",fmt(a.weapon)),row("Strength × 0.3",signed(a.strength)),
      row(weaponName+" · full flat bonus × 0.65",signed(fullFlat)),
      row("Unfamiliar equipment · flat penalty",signed(a.gear-fullFlat)),
      row("Full grade/quality multiplier","×"+fmt(fullMultiplier)),
      row("Expertise penalty on multiplier",signed(a.multiplier-fullMultiplier)),
      row("Effective multiplier","×"+fmt(a.multiplier)),
      row("Equipment proficiency",pct(a.condition.proficiency)),row("Damage type",a.type),
      row("Recovery turns after attack",a.recovery-1)
    ],"Intact, unconstrained hit before enemy protection, resistance, guard, dodge, block, parry or vital hit. Terrain, range, weapon breakage and counters modify actual damage."));
  }
  const none=initialArmour(),bare=armourStats(none,p.loadout);
  let prev=bare.mobilityPct;const weightRows=[];
  for(const slot of ARMOUR_SLOTS){
    none[slot.id]=kit.armour[slot.id];const current=armourStats(none,p.loadout);
    weightRows.push(row(slot.name+" "+ARMOUR_TIER_LABELS[kit.armour[slot.id]]+" · "+fmt(armourOption(slot.id,kit.armour[slot.id]).weightKg)+" kg",signed(current.mobilityPct-prev," pp")));prev=current.mobilityPct;
  }
  sections.push(section("Mobility",fmt(v.mobility)+"%",[
    row("Unburdened mobility","100%"),...WEAPON_PIECES[p.loadout].map(x=>row(x.name+" weight",fmt(x.kg)+" kg")),
    row("Weapon weight penalty",signed(bare.mobilityPct-100," pp")),...weightRows,
    ...pieces.map(x=>row(x.name+" · grade mobility",signed(x.part.mobility," pp"))),
    row("100% mobility cap",signed(v.mobility-v.baseMobility-v.gradeMobility," pp"))
  ],"Armour weight penalties are applied in slot order to show the exact rounded total. Mobility affects initiative, bow retreat and natural dodge; it is not an attack-speed multiplier."));
  sections.push(section("Total equipment weight",fmt(p.gear.totalKg)+" kg",[
    ...WEAPON_PIECES[p.loadout].map(x=>row(x.name,fmt(x.kg)+" kg")),
    ...ARMOUR_SLOTS.map(x=>row(x.name+" "+ARMOUR_TIER_LABELS[kit.armour[x.id]],fmt(armourOption(x.id,kit.armour[x.id]).weightKg)+" kg"))
  ]));
  sections.push(section("Dodge chance",pct(v.dodge),[
    row("Natural mobility dodge",pct(v.naturalDodge)),
    ...pieces.map(x=>row(x.name+" · grade dodge",pp(x.part.dodge))),
    row("40% dodge cap",pp(v.dodge-v.naturalDodge-v.gradedDodge))
  ],"Chance to evade an otherwise accurate strike; broken armour loses graded dodge."));
  sections.push(section("Material protection",fmt(v.protection)+"%",pieces.map(x=>row(x.name,signed(x.part.protection," pp"))),"Not universal damage reduction. Attack type and penetration modify protection; the resolver caps material reduction at 80%."));
  sections.push(section("Grade resistance","×"+fmt(1+v.resistance),[row("Base damage divisor","×1"),...pieces.flatMap(x=>[row(x.name+" · trained bonus",signed(x.full.resistance)),row("Expertise penalty",signed(x.part.resistance-x.full.resistance))])],"Damage is divided by 1 + resistance × (1 − enemy penetration)."));
  sections.push(section("Flat armour guard",fmt(v.guard),pieces.flatMap(x=>[row(x.name+" · trained guard",signed(x.full.guard)),row("Expertise penalty",signed(x.part.guard-x.full.guard))]),"Reduces final impact by "+fmt(v.guardDamageReduction)+" before rounding and minimum 1 damage."));
  sections.push(section("Accuracy vs equal DEX / Fighting",pct(Math.min(v.aimMaximum,Math.max(v.aimMinimum,v.aimBase+v.accuracy))),[
    row("Base accuracy",pct(v.aimBase)),row(weaponName+" · trained accuracy",pp(trained.weapon.accuracy)),row("Expertise penalty",pp(v.accuracy-trained.weapon.accuracy)),
    row("DEX advantage per point",pp(v.aimDexPerPoint)),row("Fighting advantage per level",pp(v.aimSkillPerLevel)),
    ...(p.loadout==="bow"?[row("Close-range shot penalty",pp(v.aimCloseBow))]:[]),
    ...(p.loadout==="spear"?[row("Close spear penalty",pp(v.aimCloseSpear))]:[]),
    row("Missing swing clearance (each)",pp(-v.aimClearance)),row("Accuracy bounds",pct(v.aimMinimum)+"–"+pct(v.aimMaximum))
  ],"DEX and skill contributions are relative to the enemy; line of sight and cover can also reduce ranged accuracy."));
  sections.push(section("Armour penetration",pct(v.penetration),[row(weaponName+" · trained penetration",pct(trained.weapon.penetration)),row("Expertise penalty",pp(v.penetration-trained.weapon.penetration))]));
  sections.push(section("Initiative score",fmt(v.initiativeScore),[row("Dexterity",fmt(v.initiativeDex)),row("Mobility ÷ 10",signed(v.initiativeMobility))],"Compared against the opponent; not a fixed first-strike chance."));
  sections.push(section("Block / parry","Conditional",[
    row("Shield block",pct(v.block)),row("Shield block vs blunt",pct(v.bluntBlock)),row("Greatsword ready parry",pct(v.parry)),row("Greatsword recovering parry",pct(v.recoveryParry))
  ],"Checked after accuracy and dodge; requires intact relevant gear. Rates include expertise."));
  sections.push(section("Equipment condition","At start of bout",[
    row(weaponName,fmt(v.weapon.maxHP)+" HP"+(v.weapon.breakable?"":" · Unbreakable")),
    ...(v.shield.maxHP?[row("Shield",fmt(v.shield.maxHP)+" HP"+(v.shield.breakable?"":" · Unbreakable"))]:[]),
    ...pieces.map(x=>row(x.name,fmt(x.part.maxHP)+" HP"+(x.part.breakable?"":" · Unbreakable")+", "+pct(x.part.proficiency)+" proficiency")),
    ...(v.arrows?[row("Bow arrows",v.arrows)]:[])
  ],"Condition and ammunition can change during a fight. The live arena displays remaining condition."));
  const old=state.combatSession?.player;
  const pending=Boolean(old&&JSON.stringify(old)!==JSON.stringify(p));
  return {sections,notice:pending?"Selected build for the next bout. The current fight retains its original equipment and stats.":"Selected build · intact equipment at the start of a fight.",weaponName};
}
