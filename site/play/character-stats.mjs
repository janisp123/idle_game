import {GRADES,workMultiplier,benchmark} from "./difficulty.mjs?v=alpha-gear-a2";
// Read-only character sheet. All numeric totals come from the selected build
// constructed by the engine and the shared physical resolver helpers.
import {desiredArenaPlayer,ACTIVITIES,SKILL_BALANCE,PRODUCTION_RECIPES,activityRewardCapped} from "./engine.mjs?v=apprentice-a2";
import {ATTRIBUTE_BALANCE,ATTRIBUTES,ACTIVITY_STAT_WEIGHTS,effectiveAttributeProgress,masteryBonusesForSkill} from "./attributes.mjs?v=glad-001";
import {physicalBuildStats} from "./physical-duel.mjs?v=bal-002";
import {ARMOUR_SLOTS,ARMOUR_TIER_LABELS,armourStats,initialArmour,armourOption,WEAPON_PIECES} from "./armour.mjs?v=bal-002";
import {ITEM_GRADES,equippedCondition} from "./smith.mjs?v=bal-002";
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
    const fullFlat=trained.weapon.flatAttack*.65*a.flatScale;
    const fullMultiplier=1+(trained.weapon.damageMultiplier-1)*a.gradeScale;
    sections.push(section("Damage · "+a.move.replaceAll("_"," "),fmt(a.base),[
      row(weaponName+" · base move",fmt(a.weapon)),row("Strength × "+fmt(.3*a.strengthScale),signed(a.strength)),
      row(weaponName+" · full flat bonus × "+fmt(.65*a.flatScale),signed(fullFlat)),
      row("Unfamiliar equipment · flat penalty",signed(a.gear-fullFlat)),
      row("Full grade/quality multiplier","×"+fmt(fullMultiplier)),
      row("Expertise penalty on multiplier",signed(a.multiplier-fullMultiplier)),
      row("Effective multiplier","×"+fmt(a.multiplier)),
      row("Equipment proficiency",pct(a.condition.proficiency)),row("Damage type",a.type),
      ...(a.move==="shot"?[row("Far-range impact","×"+fmt(v.tactics.farShotImpact)),row("Reach-range impact","×"+fmt(v.tactics.reachShotImpact)),row("Close-range impact","×"+fmt(v.tactics.closeShotImpact))]:[]),
      ...(a.move==="thrust"?[row("Reach impact","×"+fmt(v.tactics.reachSpearImpact)),row("Close impact","×"+fmt(v.tactics.shortSpearImpact))]:[]),
      ...(a.move==="swing"?[row("Unconstrained swing impact","×"+fmt(v.tactics.openSwing)),row("Constrained swing impact","×"+fmt(v.tactics.constrainedSwing))]:[]),
      ...(a.move==="dagger"?[row("Backup handling factor",pct(v.tactics.daggerHandling))]:[]),
      row("Recovery turns after attack",a.recovery-1)
    ],"Intact, unconstrained hit before enemy protection, resistance, guard, dodge, block, parry or vital hit. Terrain, range, weapon breakage and counters modify actual damage. Backup dagger and shield bash use reduced equipment scaling."));
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
    ...pieces.flatMap(x=>[row(x.name+" · trained grade mobility",signed(x.full.mobility," pp")),row("Expertise penalty",signed(x.part.mobility-x.full.mobility," pp"))]),
    row("100% mobility cap",signed(v.mobility-v.baseMobility-v.gradeMobility," pp"))
  ],"Armour weight penalties are applied in slot order to show the exact rounded total. Mobility affects initiative, approach, bow retreat and natural dodge; it is not an attack-speed multiplier."));
  sections.push(section("Total equipment weight",fmt(p.gear.totalKg)+" kg",[
    ...WEAPON_PIECES[p.loadout].map(x=>row(x.name,fmt(x.kg)+" kg")),
    ...ARMOUR_SLOTS.map(x=>row(x.name+" "+ARMOUR_TIER_LABELS[kit.armour[x.id]],fmt(armourOption(x.id,kit.armour[x.id]).weightKg)+" kg"))
  ]));
  sections.push(section("Dodge chance",pct(v.dodge),[
    row("Natural mobility dodge",pct(v.naturalDodge)),
    ...pieces.flatMap(x=>[row(x.name+" · trained grade dodge",pp(x.full.dodge)),row("Expertise penalty",pp(x.part.dodge-x.full.dodge))]),
    row("40% dodge cap",pp(v.dodge-v.naturalDodge-v.gradedDodge))
  ],"Chance to evade an otherwise accurate strike; broken armour loses graded dodge."));
  sections.push(section("Material protection",fmt(v.protection)+"%",[...pieces.map(x=>row(x.name,signed(x.part.protection," pp"))),...Object.entries(v.materialProtection).map(([type,protection])=>row(type+" protection before penetration",fmt(protection)+"%"))],"Not universal damage reduction. Attack type and penetration modify protection; the resolver caps material reduction at 80%."));
  sections.push(section("Grade resistance","×"+fmt(1+v.resistance),[row("Base damage divisor","×1"),...pieces.flatMap(x=>[row(x.name+" · trained bonus",signed(x.full.resistance)),row("Expertise penalty",signed(x.part.resistance-x.full.resistance))])],"Damage is divided by 1 + resistance × (1 − enemy penetration)."));
  sections.push(section("Flat armour guard",fmt(v.guard),pieces.flatMap(x=>[row(x.name+" · trained guard",signed(x.full.guard)),row("Expertise penalty",signed(x.part.guard-x.full.guard))]),"Reduces final impact by "+fmt(v.guardDamageReduction)+" before rounding and minimum 1 damage."));
  sections.push(section("Accuracy vs equal DEX / Fighting",pct(Math.min(v.aimMaximum,Math.max(v.aimMinimum,v.aimBase+v.accuracy))),[
    row("Base accuracy",pct(v.aimBase)),row(weaponName+" · trained accuracy",pp(trained.weapon.accuracy)),row("Expertise penalty",pp(v.accuracy-trained.weapon.accuracy)),
    row("DEX advantage per point",pp(v.aimDexPerPoint)),row("Fighting advantage per level",pp(v.aimSkillPerLevel)),
    ...(p.loadout==="bow"?[row("Close-range shot penalty",pp(v.aimCloseBow)),row("Far-range shot advantage",pp(v.aimFarBow))]:[]),
    ...(p.loadout==="spear"?[row("Close spear penalty",pp(v.aimCloseSpear)),row("Reach thrust advantage",pp(v.aimReachSpear))]:[]),
    row("Missing swing clearance (each)",pp(-v.aimClearance)),row("Accuracy bounds",pct(v.aimMinimum)+"–"+pct(v.aimMaximum))
  ],"DEX and skill contributions are relative to the enemy; line of sight and cover can also reduce ranged accuracy."));
  sections.push(section("Armour penetration",pct(v.penetration),[row(weaponName+" · trained penetration",pct(trained.weapon.penetration)),row("Expertise penalty",pp(v.penetration-trained.weapon.penetration))]));
  sections.push(section("Recovery skip chance",pct(v.speed),[
    row(weaponName+" · trained bonus",pct(trained.weapon.speed)),
    row("Expertise penalty",pp(v.speed-trained.weapon.speed))
  ],"Chance per intact attack to remove one recovery turn; not a direct attack-speed percentage."));
  sections.push(section("Critical chance modifier",pp(v.crit),[
    row("Base critical chance", "4%"),row(weaponName+" · trained bonus",pp(trained.weapon.crit)),
    row("Expertise penalty",pp(v.crit-trained.weapon.crit))
  ],"Conditional on an accurate, undodged strike without block or parry. Enemy critical avoidance reduces the chance."));
  sections.push(section("Critical damage modifier",signed(v.critDamage),[
    row("Base critical multiplier","×1.65"),row(weaponName+" · trained bonus",signed(trained.weapon.critDamage)),
    row("Expertise penalty",signed(v.critDamage-trained.weapon.critDamage))
  ],"Added to the critical multiplier; enemy armour can reduce the bonus."));
  sections.push(section("Critical avoidance",pct(v.critResist),
    pieces.flatMap(x=>[row(x.name+" · trained bonus",pp(x.full.critResist)),row("Expertise penalty",pp(x.part.critResist-x.full.critResist))]),
    "Subtracts from an opponent's conditional critical chance while armour is intact."));
  sections.push(section("Critical damage reduction",fmt(v.critReduction),
    pieces.flatMap(x=>[row(x.name+" · trained reduction",signed(x.full.critReduction)),row("Expertise penalty",signed(x.part.critReduction-x.full.critReduction))]),
    "Subtracts from the critical bonus multiplier, not ordinary attack damage."));
  sections.push(section("Initiative score",fmt(v.initiativeScore),[row("Dexterity",fmt(v.initiativeDex)),row("Mobility ÷ 10",signed(v.initiativeMobility))],"Compared against the opponent; not a fixed first-strike chance."));
  sections.push(section("Block / parry","Conditional",[
    row("Shield block",pct(v.block)),row("Shield block vs blunt",pct(v.bluntBlock)),row("Greatsword ready parry",pct(v.parry)),row("Greatsword recovering parry",pct(v.recoveryParry)),row("Relevant equipment proficiency",pct(v.weapon.proficiency)),row("Guard after heavy impact","Temporarily reduced"),row("Shield block impact · standard",pct(v.guardRules.blockImpact)),row("Shield block impact · ranged",pct(v.guardRules.rangedBlockImpact)),row("Shield block impact · reach thrust",pct(v.guardRules.reachBlockImpact)),row("Shield block impact · blunt",pct(v.guardRules.bluntBlockImpact))
  ],"Checked after accuracy and dodge; requires intact relevant gear. Rates include expertise."));
  sections.push(section("Equipment condition","At start of bout",[
    row(weaponName,fmt(v.weapon.maxHP)+" HP"+(v.weapon.breakable?"":" · Unbreakable")),
    ...(v.shield.maxHP?[row("Shield",fmt(v.shield.maxHP)+" HP"+(v.shield.breakable?"":" · Unbreakable"))]:[]),
    ...pieces.map(x=>row(x.name,fmt(x.part.maxHP)+" HP"+(x.part.breakable?"":" · Unbreakable")+", "+pct(x.part.proficiency)+" proficiency")),
    ...(v.arrows?[row("Bow arrows",v.arrows)]:[])
  ],"Condition and ammunition can change during a fight. The live arena displays remaining condition."));
  // Keep the detailed values for inspection, but the overview is about
  // modifiers, not predicting a particular combat result.
  const overview=sections.map((detail,i)=>{
    const entry={...detail,key:detail.title,group:i<3?"Attributes":"Combat modifiers",summary:detail.total};
    if(i<3)return {...entry,summary:detail.total,subtitle:"+0 from equipment",
      rows:[...detail.rows,row("Equipment attribute bonus","+0")]};
    if(detail.title.startsWith("Damage · ")){
      const a=v.attacks.find(a=>"Damage · "+a.move.replaceAll("_"," ")===detail.title);
      // Isolate grade/quality effects on this same move at the same STR.
      const baseline=a.weapon+a.strength;
      const bonus=(a.base/baseline-1)*100;
      return {...entry,key:a===v.attacks[0]?"primary-attack":"secondary-attack",
        title:"Attack power · "+a.move.replaceAll("_"," "),summary:signed(bonus,"%"),
        subtitle:"vs same move without grade/quality bonuses",
        rows:[row("Same move without grade/quality bonuses",fmt(baseline)),
          row("Grade/quality attack power bonus",signed(bonus,"%")),...detail.rows,
          row("Unmitigated intact hit input",detail.total)]};
    }
    if(detail.title==="Maximum HP")return {...entry,subtitle:"No equipment HP bonus",rows:[...detail.rows,row("Equipment bonus","+0 HP")]};
    if(detail.title==="Mobility")return {...entry,subtitle:signed(v.mobility-100," pp")+" vs unburdened"};
    if(detail.title==="Dodge chance")return {...entry,title:"Dodge modifier",summary:pp(v.gradedDodge),
      subtitle:"Intact armour grade bonus, before cap",rows:[...detail.rows,row("Conditional dodge rate after cap",detail.total)]};
    if(detail.title==="Material protection")return {...entry,summary:signed(v.protection," pp"),subtitle:"Material coverage, not damage avoided"};
    if(detail.title==="Accuracy vs equal DEX / Fighting")return {...entry,title:"Weapon accuracy modifier",
      summary:pp(v.accuracy),subtitle:"Before situational effects and caps",
      rows:[...detail.rows,row("Unobstructed equal-stat accuracy",detail.total)]};
    if(detail.title==="Armour penetration")return {...entry,summary:pp(v.penetration),subtitle:"Reduces enemy protection and resistance"};
    if(detail.title==="Initiative score")return {...entry,title:"Initiative modifier",summary:signed(v.initiativeMobility),
      subtitle:"Mobility contribution; not a first-strike probability",rows:[...detail.rows,row("Total comparison score",detail.total)]};
    if(detail.title==="Grade resistance")return {...entry,summary:signed(v.resistance),subtitle:"Added to damage divisor"};
    if(detail.title==="Block / parry")return {...entry,summary:p.loadout==="sword_shield"?"Shield":p.loadout==="greatsword"?"Parry":"None",subtitle:"Conditional defense"};
    return entry;
  });
  for(const [id,activity] of Object.entries(ACTIVITIES)){
    const level=state.skills[id].level,tier=state.difficulties[id]??0;
    const mastery=Math.min(SKILL_BALANCE.maxEfficiency,1+Math.max(0,level-1)*SKILL_BALANCE.efficiencyPerLevel);
    // Exactly the production work multiplier; Fighting deliberately ignores
    // difficulty for XP. Display at currently earned stats for the next
    // settlement, not as a promise of the frozen offline outcome.
    const difficulty=id==="fighting"?1:workMultiplier(tier,ACTIVITY_STAT_WEIGHTS[id],earned);
    const capped=activityRewardCapped(state,id);
    const efficiency=capped?0:mastery*difficulty;
    const crafted=Object.hasOwn(PRODUCTION_RECIPES,id);
    const weights=ACTIVITY_STAT_WEIGHTS[id];
    const weightedStat=Object.entries(weights).reduce((n,[stat,w])=>n+earned[stat].value*w/100,0);
    const rows=[row("Direct equipment XP/yield bonus","+0%"),
      row("Claimed skill Lv "+level,signed((mastery-1)*100,"%")),
      row("Skill efficiency cap","×"+fmt(SKILL_BALANCE.maxEfficiency)),
      row("Selected difficulty",GRADES[tier])];
    if(id!=="fighting"&&tier>0)rows.push(row("Weighted attribute readiness",fmt(weightedStat)+" / "+benchmark(tier).stat),
      ...Object.entries(weights).map(([stat,w])=>row(stat+" · "+w+"% weight",fmt(earned[stat].value*w/100))),
      row("Difficulty / readiness factor","×"+fmt(difficulty)));
    else rows.push(row("Difficulty XP/yield factor","×1"));
    rows.push(row("Combined XP factor","×"+fmt(efficiency)),row("Reward status",capped?"Paused · Skill Master":"Available"));
    if(activity.item!==null)rows.push(row(crafted?"Recipe output per successful cycle":"Primary resource yield factor",crafted?(capped?"0":"1"):"×"+fmt(efficiency)));
    rows.push(row("Attribute training split",Object.entries(weights).map(([stat,w])=>stat+" "+w+"%").join(" · ")));
    const note=capped?"Full XP bar: all rewards and productive time are paused until the Skill Master advances this skill.":id==="fighting"?"Gear affects combat performance and productive time through victory or resurrection, not the direct skill XP multiplier. Arena coins depend on actual wins and difficulty.":crafted?"Recipes require available inputs. Efficiency affects skill XP, not the number of items per successful recipe.":"Efficiency affects skill XP"+(activity.item!==null?" and primary resource yield":"")+", not action duration. Random batch variation and the skill XP cap still apply.";
    overview.push({key:"activity-"+id,group:"Activity modifiers",title:activity.title,summary:"×"+fmt(efficiency),
      subtitle:id==="fighting"?"XP factor · combat gear effects above":crafted?"XP factor · no direct gear bonus":activity.item!==null?"XP / yield factor · no direct gear bonus":"XP factor · no direct gear bonus",
      rows,note});
  }
  const old=state.combatSession?.player;
  const pending=Boolean(old&&JSON.stringify(old)!==JSON.stringify(p));
  return {sections,overview,notice:pending?"Selected build for the next bout. The current fight retains its original equipment and stats.":"Selected build · intact equipment at the start of a fight.",weaponName};
}
