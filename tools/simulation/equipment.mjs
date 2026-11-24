/** Equipment choices, durability upgrades and Glory Scroll enchants use engine operations. */
import { setArmourChoice,setCombatLoadout,trainEquipmentSlot,enchantEquipmentSlot,skillMasterReadiness }
  from '../../site/play/engine.mjs';
import { ARMOUR_SLOTS, ARMOUR_TIERS,armourStats,armourUnlocked } from '../../site/play/armour.mjs';
import { COMBAT_LOADOUTS } from '../../site/play/combat-skills.mjs';
import { ENCHANT_SLOTS,GLORY_RULES } from '../../site/play/glory.mjs';
import { masteryOffer } from '../../site/play/equipment-rules.mjs';
import { effectiveAttributeProgress } from '../../site/play/attributes.mjs';
import { count,choose,trials,sourceSeed,seededState,average,histogram,deltas } from './common.mjs';

export function simulateEquipment(options={}) {
  let state=seededState(options);
  const nextLoadout=choose(options.loadout??state.combatLoadout,Object.keys(COMBAT_LOADOUTS),'weapon style');
  const slot=choose(options.slot??'head',ARMOUR_SLOTS.map(x=>x.id),'armour slot');
  const gear=choose(options.gear??state.armour[slot],ARMOUR_TIERS,'armour tier');
  const beforeStats=effectiveAttributeProgress(state.attributeEffort,state.skills);
  const beforeGear=armourStats(state.armour,state.combatLoadout);
  // These are the actual user-facing public engine operations, on detached data.
  state=setCombatLoadout(state,nextLoadout,state.settledAtMs,sourceSeed(options)).state;
  const qualified=armourUnlocked(beforeStats,slot,gear);
  let applied=false,reason=null;
  try {
    state=setArmourChoice(state,slot,gear,state.settledAtMs,sourceSeed(options)).state;
    applied=true;
  } catch(error) {
    if (!(error instanceof RangeError)) throw error;
    reason=error.message;
  }
  const offer=masteryOffer(state,choose(options.masterySlot??slot,['weapon','shield',...ARMOUR_SLOTS.map(x=>x.id)],'mastery slot'));
  let trained=false;
  if (options.train===true) {
    const action=trainEquipmentSlot(state,options.masterySlot??slot,offer.rank,state.settledAtMs,sourceSeed(options));
    state=action.state;
    trained=!!action.trained;
  }
  return {module:'equipment',source:'site/play/engine.mjs:setCombatLoadout+setArmourChoice+trainEquipmentSlot',
    requested:{loadout:nextLoadout,slot,gear},
    eligible:qualified,applied,reason,trained,masteryOffer:offer,
    currentStats:beforeStats,armourBefore:beforeGear,armourAfter:armourStats(state.armour,state.combatLoadout),
    equippedArmour:state.armour,masteryRanks:state.slotMastery,
    inventoryRemaining:state.items};
}

export function simulateEnchanting(options={}) {
  const slot=choose(options.slot??'weapon',ENCHANT_SLOTS,'enchant slot');
  const attempts=count(options.attempts??5,'attempts per trial',100,1);
  const runs=trials(options);
  const startingRank=count(options.startingRank??0,'starting rank',GLORY_RULES.maxRank);
  if (startingRank===GLORY_RULES.maxRank) throw new RangeError('Rank is already maximum');
  const base=seededState(options);
  const totals={success:0,fail:0,scrollsSpent:0,finalRanks:{},rankGain:0,resetToZero:0};
  let example=null;
  for(let i=0;i<runs;i++){
    let state=structuredClone(base);
    // Invent a laboratory supply of exactly N scrolls, NEVER a player grant.
    state.items.glory_scroll=attempts;
    state.enchantments[slot]=startingRank;
    const random=sourceSeed(options,i);
    const trace=[];
    for(let j=0;j<attempts;j++){
      if(state.enchantments[slot]===GLORY_RULES.maxRank)break;
      const before=state.enchantments[slot];
      const outcome=enchantEquipmentSlot(state,slot,state.settledAtMs,random);
      state=outcome.state;
      totals.success+=Number(outcome.enchantment.success);
      totals.fail+=Number(!outcome.enchantment.success);
      if(!outcome.enchantment.success&&before>0)totals.resetToZero++;
      totals.scrollsSpent++;
      if(i===0)trace.push({attempt:j+1,...outcome.enchantment});
    }
    histogram(totals.finalRanks,state.enchantments[slot]);
    totals.rankGain+=state.enchantments[slot]-startingRank;
    if(i===0)example=trace;
  }
  return {module:'enchanting',source:'site/play/engine.mjs:enchantEquipmentSlot (production Glory 50/50 rules)',
    slot,trials:runs,attemptsPerTrial:attempts,startingRank,
    chance:GLORY_RULES.enchantSuccessChance,
    successes:totals.success,failures:totals.fail,
    successesPct:average(100*totals.success,totals.scrollsSpent),
    totalScrollsSpent:totals.scrollsSpent,
    resetFromPositiveRank:totals.resetToZero,
    finalRankHistogram:totals.finalRanks,
    averageRankChange:average(totals.rankGain,runs),
    sampleSequence:example,note:'Synthetic lab scrolls are discarded; no player inventory is modified'};
}
