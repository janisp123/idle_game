/** Actual drop allocation and crafting recipes, never shadow algorithms. */
import { LOOT_TABLES, lootChances, allocateLoot } from '../../site/play/loot.mjs';
import { PRODUCTION_RECIPES, produce, recipeOptions } from '../../site/play/production.mjs';
import { count,choose,trials,sourceSeed,inputInventory,addCounts,average,assertConserved } from './common.mjs';
const total=items=>Object.values(items).reduce((a,b)=>a+b,0);
export function simulateLoot(options={}) {
  const activity=choose(options.activity??'mining',Object.keys(LOOT_TABLES),'loot activity');
  const level=count(options.level??1,'skill level',100000,1);
  const units=count(options.units??100,'units per batch',100000000,0);
  const runs=trials(options);
  const probabilities=lootChances(activity,level);
  const found={},frequency={};let min=Infinity,max=0;
  for(let i=0;i<runs;i++){
    const result=allocateLoot(activity,level,units,sourceSeed(options,i));
    assertConserved(total(result)===units,'loot may not create/discard units');
    for(const [key,n] of Object.entries(result)){
      if(!probabilities.some(p=>p.item===key)) throw new Error('Locked loot tier produced: '+key);
      frequency[key]=(frequency[key]??0)+Number(n>0);
    }
    addCounts(found,result);
    const rare=total(result)- (result[probabilities[0].item]??0);
    min=Math.min(min,rare);max=Math.max(max,rare);
  }
  return {module:'loot',source:'site/play/loot.mjs:lootChances+allocateLoot',
    activity,level,trials:runs,unitsPerBatch:units,totalProduced:total(found),
    theoreticalProbabilities:probabilities,produced:found,
    observedPct:Object.fromEntries(probabilities.map(p=>[p.item,average((found[p.item]??0)*100,units*runs)])),
    batchesWithItem:frequency,rareUnitsPerBatch:{min,max},
    invariant:'every real batch conserved, locked tiers never produced'};
}
export function simulateCrafting(options={}) {
  const activity=choose(options.activity??'smithing',Object.keys(PRODUCTION_RECIPES),'craft activity');
  const level=count(options.level??1,'skill level',100000,1);
  const workCycles=count(options.workCycles??100,'work cycles',100000000,0);
  const inventory=inputInventory(options.inventory??{iron_ore:100});
  const available=recipeOptions(activity,level);
  const runs=trials(options),consumed={},created={};
  let min=Infinity,max=0,blocked=0;
  for(let i=0;i<runs;i++){
    const frozen=structuredClone(inventory);
    const out=produce(activity,level,workCycles,frozen,sourceSeed(options,i));
    assertConserved(JSON.stringify(inventory)===JSON.stringify(frozen),'crafting mutated input');
    assertConserved(out.completed<=workCycles,'crafting overfilled capacity');
    assertConserved(total(out.consumed)>=out.completed && total(out.created)===out.completed,'crafting resource conservation');
    for(const [item,n] of Object.entries(out.consumed)) {
      assertConserved(n <= (inventory[item]??0),'crafting consumed unavailable input '+item);
    }
    for(const item of Object.keys(out.created))
      assertConserved(available.some(r=>r.output===item),'locked recipe produced '+item);
    blocked+=Number(out.completed===0);
    min=Math.min(min,out.completed);max=Math.max(max,out.completed);
    addCounts(consumed,out.consumed);addCounts(created,out.created);
  }
  return {module:'crafting',source:'site/play/production.mjs:recipeOptions+produce',
    activity,level,trials:runs,workCycles,startingInventory:inventory,eligibleRecipes:available,
    averageCompletedPerBatch:average(total(created),runs),completedRange:{min,max},
    blockedBatches:blocked,consumed,created,
    invariant:'no negative inventory, no material creation, locked recipes excluded'};
}
