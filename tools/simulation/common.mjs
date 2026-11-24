/**
 * SIM-002 infrastructure. Development-only, no copies of game balance math.
 * All scenario data is synthetic unless an explicit local save is provided.
 */
import { seededCombatRandom } from '../../site/play/combat.mjs';
import { newGame, readSave, SKILL_IDS, ITEM_KEYS } from '../../site/play/engine.mjs';
export const MAX_TRIALS=10000;
export const DEFAULT_SEED=20261124;
export function count(value, label, max=1000000000, min=0) {
  if (!Number.isSafeInteger(value) || value<min || value>max)
    throw new RangeError(label+' must be an integer from '+min+' to '+max);
  return value;
}
export const choose = (value, values, label) => {
  if (!values.includes(value)) throw new RangeError('Unknown '+label+': '+String(value));
  return value;
};
export function trials(options) {
  return count(options.trials ?? 100, 'trials',MAX_TRIALS,1);
}
export function sourceSeed(options,index=0) {
  const seed=count(options.seed ?? DEFAULT_SEED,'seed',0xffffffff);
  return seededCombatRandom((seed+index)>>>0);
}
export function inputInventory(raw={}) {
  if (!raw || typeof raw!=='object' || Array.isArray(raw))
    throw new RangeError('Inventory must be an object');
  const inventory={};
  for (const [key,value] of Object.entries(raw)) {
    choose(key,ITEM_KEYS,'inventory item');
    inventory[key]=count(value,'inventory '+key,1000000000000);
  }
  return inventory;
}
export function seededState(options={}) {
  if (options.state!==undefined) {
    // readSave validates existing saves, and rehydrates a detached state.
    const s=readSave(structuredClone(options.state));
    if (!s) throw new RangeError('Invalid saved game state');
    return s;
  }
  const result=newGame(0);
  const levels=options.levels ?? {};
  if (!levels || typeof levels!=='object' || Array.isArray(levels))
    throw new RangeError('levels must be an object');
  for (const [key,value] of Object.entries(levels)) {
    choose(key,SKILL_IDS,'skill');
    result.skills[key]={level:count(value,'level '+key,100000,1),xp:0};
  }
  Object.assign(result.items,inputInventory(options.inventory ?? {}));
  return result;
}
export function deltas(before,after) {
  const result={};
  for(const key of Object.keys(before)) {
    if(after[key]!==before[key]) result[key]=after[key]-before[key];
  }
  return result;
}
export function addCounts(into,record) {
  for(const [key,n] of Object.entries(record)) into[key]=(into[key]??0)+n;
}
export function average(total,n) {return n?Math.round(total/n*1000)/1000:0;}
export function histogram(bucket,key) {bucket[key]=(bucket[key]??0)+1;}
export function assertConserved(test,details) {
  if(!test) throw new Error('Production invariant failed: '+details);
}
