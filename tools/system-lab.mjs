/**
 * SIM-002 — extension point for real game system tests. Not deployed to /site.
 * Add an adapter to tools/simulation/ instead of duplicating game formulas.
 *
 * node tools/system-lab.mjs --config scenarios.json
 * node tools/system-lab.mjs --scenario '{"module":"loot","activity":"mining","level":25}'
 * node tools/system-lab.mjs --list
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulateBatch } from './combat-simulator.mjs';
import { simulateLoot,simulateCrafting } from './simulation/resources.mjs';
import { simulateActivity,simulateAttributes,simulateMaster } from './simulation/progression.mjs';
import { simulateEquipment } from './simulation/equipment.mjs';
import { simulateQueue,simulateSave } from './simulation/queue-save.mjs';
import { simulateClan } from './simulation/clan-fixtures.mjs';

export const LAB_MODULES=Object.freeze({
  combat:simulateBatch,
  activity:simulateActivity,
  loot:simulateLoot,
  crafting:simulateCrafting,
  attributes:simulateAttributes,
  master:simulateMaster,
  equipment:simulateEquipment,
  queue:simulateQueue,
  save:simulateSave,
  clan:simulateClan
});
const plain=(x)=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const resultMeasure=(value,path)=> {
  const steps=path.split('.');
  let current=value;
  for(const segment of steps) {
    if(!plain(current) || !Object.hasOwn(current,segment))
      throw new RangeError('Unknown report metric: '+path);
    current=current[segment];
  }
  if(typeof current!=='number' || !Number.isFinite(current))
    throw new RangeError('Comparison metric must be a finite number: '+path);
  return current;
};
const runOne=(item)=>{
  if(!plain(item))throw new RangeError('Each scenario must be a JSON object');
  const mod=item.module??'combat',fn=LAB_MODULES[mod];
  if(!fn)throw new RangeError('Unknown module: '+mod);
  return fn(item);
};
/** Returns stable JSON reports; no global state, browser storage or network access. */
export function runLab(config) {
  if(!plain(config))throw new RangeError('Expected scenario JSON object');
  if(config.compare!==undefined) {
    const cmp=config.compare;
    if(!plain(cmp)||!plain(cmp.baseline)||!plain(cmp.variant))
      throw new RangeError('compare requires baseline and variant scenario objects');
    const metric=cmp.metric??'winRatePct';
    if(typeof metric!=='string'||metric.length>80 || !/^[a-zA-Z0-9_.]+$/.test(metric))
      throw new RangeError('Invalid comparison metric');
    if((cmp.baseline.module??'combat')!==(cmp.variant.module??'combat'))
      throw new RangeError('Compare the same module using different builds/conditions');
    const base=runOne(cmp.baseline),variant=runOne(cmp.variant);
    const a=resultMeasure(base,metric),b=resultMeasure(variant,metric);
    return {lab:'SIM-002',reportType:'side-by-side comparison',module:base.module??'combat',
      metric,baseline:a,variant:b,delta:b-a,
      note:'Both scenarios use real code; align seeds and sample sizes for paired comparisons. Differences are evidence, not a balance decision.',
      scenarios:[base,variant]};
  }
  const scenarios=config.scenarios??[config];
  if(!Array.isArray(scenarios)||scenarios.length<1||scenarios.length>20)
    throw new RangeError('scenarios must include 1..20 entries');
  return {lab:'SIM-002',reportType:'scenario batch',
    modules:Object.keys(LAB_MODULES),results:scenarios.map(runOne),
    note:'Developer-only simulation. Uses production functions, synthetic data unless local state was supplied. No player saves or gameplay code modified.'};
}
export function parseLabCli(args) {
  if(args.length===1 && (args[0]==='--list'||args[0]==='--help'))
    return {help:true};
  if(args.length!==2 || !['--config','--scenario'].includes(args[0]))
    throw new RangeError('Use --list, --config FILE.json, or --scenario JSON');
  return {data:args[0]==='--config'?
    JSON.parse(readFileSync(resolve(args[1]),'utf8')) : JSON.parse(args[1])};
}
export const HELP=[
 'Developer-only modular game systems lab (no changed game rules).',
 'Modules: '+Object.keys(LAB_MODULES).join(', '),
 'Examples:',
 ' node tools/system-lab.mjs --scenario \'{"module":"activity","activity":"mining","elapsedMs":86400000,"trials":100}\'',
 ' node tools/system-lab.mjs --scenario \'{"module":"loot","activity":"mining","level":25,"units":100,"trials":10000}\'',
 ' node tools/system-lab.mjs --config tools/simulation/example-scenarios.json > report.json',
 ' node tools/system-lab.mjs --list',
 'Output is JSON only. See docs/mechanics/SYSTEM_LAB.md for real-game boundaries, comparisons and data safety.'
].join('\n');
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const args=parseLabCli(process.argv.slice(2));
    console.log(args.help?HELP:JSON.stringify(runLab(args.data),null,2));
  } catch(error) {
    console.error('Game systems lab:',error.message);
    process.exitCode=1;
  }
}
