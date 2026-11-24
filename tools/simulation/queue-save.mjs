/** Actual three-wagon planner, timed transitions, settlement and save roundtrips. */
import { ACTIVITIES,SKILL_IDS,MAX_WAGONS,UNTIL_LEVEL_UP,validQueuePlan,
  queueStartActivity,settle,readSave,GAME_VERSION } from '../../site/play/engine.mjs';
import { effectiveAttributeProgress } from '../../site/play/attributes.mjs';
import { count,choose,trials,sourceSeed,seededState,average,addCounts,deltas,assertConserved,histogram } from './common.mjs';

function normalizeRoute(raw) {
  if(!Array.isArray(raw) || raw.length<1 || raw.length>MAX_WAGONS)
    throw new RangeError('Route must have 1..'+MAX_WAGONS+' activities');
  const used=new Set();
  return raw.map((item,i)=>{
    if(!item || typeof item!=='object'||Array.isArray(item))
      throw new RangeError('Invalid route activity');
    const activity=choose(item.activity,SKILL_IDS,'route activity');
    if(used.has(activity))throw new RangeError('Duplicate route activity '+activity);
    used.add(activity);
    const plan=item.plannedMs ?? null;
    if(i<raw.length-1 && !validQueuePlan(plan))
      throw new RangeError('Non-final route entries require valid timed work or untilLevelUp');
    if(i===raw.length-1 && plan!==null)
      throw new RangeError('Last queue entry must run forever');
    return {activity,plannedMs:plan};
  });
}
function setupRoute(start,route,rng) {
  let state=start;
  for(let i=0;i<route.length;i++) {
    const activity=route[i].activity;
    const prior=i>0 ? route[i-1].plannedMs : null;
    state=queueStartActivity(state,activity,prior,state.settledAtMs,rng).state;
  }
  return state;
}
export function simulateQueue(options={}) {
  const route=options.state?null:normalizeRoute(options.route??[
    {activity:'mining',plannedMs:60000},{activity:'woodcutting',plannedMs:null}]);
  const elapsedMs=count(options.elapsedMs??3600000,'elapsedMs',1000000000000);
  const runs=trials(options),baseline=seededState(options);
  const result={module:'queue',source:'site/play/engine.mjs:queueStartActivity+settle',
    configuredRoute:route,elapsedMs,trials:runs,
    endedAt:{},transitionPhases:{},totalItems:{},totalConsumed:{},
    totalXP:{},workingActivities:{},firstTrial:null};
  for(let i=0;i<runs;i++){
    const rng=sourceSeed(options,i);
    let s=structuredClone(baseline);
    if(route) s=setupRoute(s,route,rng);
    const before=structuredClone(s);
    const out=settle(s,s.settledAtMs+elapsedMs,rng),end=out.state;
    assertConserved(end.settledAtMs===before.settledAtMs+elapsedMs,'queue clock not settled');
    assertConserved(end.wagons.length<=MAX_WAGONS,'planner exceeded maximum');
    histogram(result.endedAt,end.activity??'none');
    histogram(result.transitionPhases,end.transition?.phase??'none');
    const reports=out.reports??[out.report];
    for(const rep of reports){
      if(!rep) continue;
      addCounts(result.totalItems,rep.items??{});
      addCounts(result.totalConsumed,rep.consumed??{});
      if(rep.activity)histogram(result.workingActivities,rep.activity);
    }
    for(const [id,skill] of Object.entries(end.skills)) {
      const n=skill.xp-before.skills[id].xp;
      if(n)result.totalXP[id]=(result.totalXP[id]??0)+n;
      assertConserved(skill.level===before.skills[id].level,'queue offline raised an activated skill level');
    }
    if(i===0)result.firstTrial={reports,finalActivity:end.activity,
      finalQueue:end.wagons,transition:end.transition,
      itemChanges:deltas(before.items,end.items),
      skills:Object.fromEntries(Object.entries(end.skills).filter(([id,x])=>x.xp!==before.skills[id].xp)),
      stats:effectiveAttributeProgress(end.attributeEffort,end.skills)};
  }
  result.averageXP=Object.fromEntries(Object.entries(result.totalXP).map(([key,n])=>[key,average(n,runs)]));
  return result;
}
export function simulateSave(options={}) {
  const input=seededState(options);
  const encoded=JSON.stringify(input);
  const restored=readSave(encoded);
  if(!restored)throw new Error('Save made from valid simulated state cannot be read');
  const second=readSave(JSON.stringify(restored));
  if(!second)throw new Error('Restored save not stable');
  const stable=JSON.stringify(restored)===JSON.stringify(second);
  const equivalent=JSON.stringify(input)===JSON.stringify(restored);
  return {module:'save',source:'site/play/engine.mjs:newGame+readSave',
    inputVersion:input.version,outputVersion:restored.version,currentVersion:GAME_VERSION,
    validRoundtrip:!!restored,stableSecondRoundtrip:stable,
    unchangedFromInput:equivalent,
    note:'No saved file is written or uploaded; old versions are migrated by production readSave'};
}
