/**
 * Exact productive time, offline catch-up, XP caps, skill-master, attribute growth.
 * Game engine is authoritative; artificial test states are explicitly labeled.
 */
import { ACTIVITIES, SKILL_IDS, chooseActivity, setDifficulty, enterGame,
  skillMasterOffer, learnFromMaster, xpToNextLevel, skillMasterReadiness } from '../../site/play/engine.mjs';
import { canSelectDifficulty } from '../../site/play/difficulty.mjs';
import { awardAttributeTime, effectiveAttributeProgress, ACTIVITY_STAT_WEIGHTS } from '../../site/play/attributes.mjs';
import { count,choose,trials,sourceSeed,seededState,addCounts,average,histogram,assertConserved,deltas } from './common.mjs';

export function simulateActivity(options={}) {
  const activity=choose(options.activity??'mining',SKILL_IDS,'activity');
  const elapsedMs=count(options.elapsedMs??3600000,'elapsedMs',1000000000000);
  const level=count(options.level??options.levels?.[activity]??1,'skill level',100000,1);
  const tier=count(options.difficulty??0,'difficulty',7);
  const runs=trials(options);
  const base=seededState(options);
  if (options.state===undefined) base.skills[activity]={level,xp:count(options.xp??0,'xp',xpToNextLevel(level))};
  const chosenLevel=base.skills[activity].level;
  if (!canSelectDifficulty(activity,chosenLevel,tier)) throw new RangeError('Difficulty locked for skill '+activity);
  if (options.state!==undefined && options.xp!==undefined) throw new RangeError('Cannot change XP on a saved state; create a synthetic one');
  const result={module:'activity',source:'site/play/engine.mjs:chooseActivity+enterGame',
    mode:'real productive-time engine batch; starting an activity is immediate in this test (not an actual travel simulation)',
    activity,elapsedMs,trials:runs,startingLevel:chosenLevel,difficulty:tier,
    completed:0,gainedXP:0,gainedCoins:0,items:{},consumed:{},
    endingSkillXP:{min:Infinity,max:0},masterReadyCount:0,masterBlockedCount:0,
    endingLevels:{},endingStatValues:{},firstTrial:null};
  for(let i=0;i<runs;i++){
    const s=structuredClone(base), rng=sourceSeed(options,i);
    let started=chooseActivity(s,activity,s.settledAtMs,rng).state;
    if(tier) started=setDifficulty(started,activity,tier,started.settledAtMs,rng).state;
    const before=structuredClone(started);
    const out=enterGame(started,started.settledAtMs+elapsedMs,rng);
    const after=out.state;
    const reports=out.reports??[out.report];
    let completed=0,xp=0,coins=0;
    for(const rep of reports){
      if(!rep) continue;
      completed+=rep.completed??0;
      xp+=rep.gainedXP??0;
      coins+=rep.gainedCoins??0;
      addCounts(result.items,rep.items??{});
      addCounts(result.consumed,rep.consumed??{});
    }
    result.completed+=completed;result.gainedXP+=xp;result.gainedCoins+=coins;
    const skill=after.skills[activity];
    assertConserved(skill.level===before.skills[activity].level,'skill auto-leveled offline');
    assertConserved(skill.xp>=before.skills[activity].xp && skill.xp<=xpToNextLevel(skill.level),'invalid offline XP cap');
    result.endingSkillXP.min=Math.min(result.endingSkillXP.min,skill.xp);
    result.endingSkillXP.max=Math.max(result.endingSkillXP.max,skill.xp);
    const offer=skillMasterReadiness(after,activity);
    result.masterReadyCount+=Number(offer.ready);
    result.masterBlockedCount+=Number(offer.xpReady&&!offer.resourcesReady);
    histogram(result.endingLevels,skill.level);
    const stats=effectiveAttributeProgress(after.attributeEffort,after.skills);
    for(const [id,value] of Object.entries(stats))
      result.endingStatValues[id]=(result.endingStatValues[id]??0)+value.value;
    if(i===0) result.firstTrial={
      report:out.report,offlineArena:out.offlineArena ?? null,finishedSkills:{[activity]:skill},
      itemChanges:deltas(before.items,after.items),statProgress:stats,
      readiness:offer,productiveElapsedMs:after.productiveElapsedMs,
      settledAtMs:after.settledAtMs,
      activeActivity:after.activity
    };
    if(elapsedMs===0)assertConserved(JSON.stringify(before.items)===JSON.stringify(after.items),'zero time produced resources');
  }
  result.average={
    completed:average(result.completed,runs),
    earnedXP:average(result.gainedXP,runs),
    coins:average(result.gainedCoins,runs),
    endingStatValues:Object.fromEntries(Object.entries(result.endingStatValues).map(([k,v])=>[k,average(v,runs)]))
  };
  return result;
}

export function simulateAttributes(options={}) {
  const activity=choose(options.activity??'mining',SKILL_IDS,'activity');
  const elapsedMs=count(options.elapsedMs??3600000,'productive elapsedMs',1000000000000);
  const state=seededState(options);
  const before=effectiveAttributeProgress(state.attributeEffort,state.skills);
  const effort=awardAttributeTime(state.attributeEffort,activity,elapsedMs);
  const after=effectiveAttributeProgress(effort,state.skills);
  return {module:'attributes',source:'site/play/attributes.mjs:awardAttributeTime+effectiveAttributeProgress',
    activity,elapsedMs,weights:ACTIVITY_STAT_WEIGHTS[activity],before,after,
    gainedXP:Object.fromEntries(Object.entries(after).map(([id,v])=>[id,v.xp-before[id].xp])),
    note:'This is productive time only, without travel. Skill Master claims are a separate module.'};
}

export function simulateMaster(options={}) {
  const skillId=choose(options.activity??'mining',SKILL_IDS,'activity');
  const s=seededState(options);
  const level=s.skills[skillId].level;
  if(options.xp!==undefined && options.state!==undefined)throw new RangeError('Use real saved XP when state provided');
  if(options.xp!==undefined)s.skills[skillId]={level,xp:count(options.xp,'XP',xpToNextLevel(level))};
  const readiness=skillMasterReadiness(s,skillId);
  const offer=skillMasterOffer(s);
  const before=effectiveAttributeProgress(s.attributeEffort,s.skills);
  const chooseClaim=options.claim===true;
  let after=null,itemsSpent={},gainedLevels={};
  if(chooseClaim && offer.ready.length) {
    const out=learnFromMaster(s,s.settledAtMs,sourceSeed(options));
    after=out.state;
    itemsSpent=deltas(s.items,after.items);
    for (const id of SKILL_IDS)
      if(s.skills[id].level!==after.skills[id].level) gainedLevels[id]=after.skills[id].level-s.skills[id].level;
  }
  return {module:'master',source:'site/play/engine.mjs:skillMasterReadiness+skillMasterOffer+learnFromMaster',
    skill:skillId,readiness,offer,claimRequested:chooseClaim,claimPerformed:!!after,
    itemsDelta:itemsSpent,gainedLevels,
    beforeStats:before,afterStats:after?effectiveAttributeProgress(after.attributeEffort,after.skills):null,
    remainingInventory:after?after.items:null};
}
