// A5: pure projection of adopted settlement and committed login chores.
// No reward calculation, random rolls, mutation, persistence or replay.
import { effectiveAttributeProgress, attributeXP } from "./attributes.mjs?v=glad-001";
import { expertiseHours } from "./expertise.mjs?v=alpha-gear-a3";
import { SKILL_IDS, activityRewardCapped } from "./engine.mjs?v=apprentice-a4";

export function loginReport(before,outcome,{saved=true,automationUnavailable=false}={}){
  const after=outcome.state, arena={bouts:0,victories:0,defeats:0,doubleDeaths:0,downtimeMs:0,coins:0};
  const work={},gained={},consumed={};
  const add=(target,values)=>{for(const [id,qty] of Object.entries(values??{}))if(qty)target[id]=(target[id]??0)+qty;};
  for(const r of outcome.reports??[outcome.report]){
    if(!r)continue;
    if(r.activity&&(r.completed||r.gainedXP||r.arena)){
      const row=work[r.activity]??={completed:0,xp:0};
      row.completed+=r.completed??0;row.xp+=r.gainedXP??0;
    }
    add(gained,r.items);add(consumed,r.consumed);
    if(r.arena)for(const key of Object.keys(arena))arena[key]+=r.arena[key]??0;
  }
  // Gross income from settled wallet, not a guess based on win rate.
  const upgrades=saved?(outcome.autoEquipment?.upgrades??[]):[];
  const spent=saved?(outcome.autoEquipment?.spent??0):0;
  const mastery=saved?outcome.mastery:null;
  const equipment={};
  for(const step of upgrades){
    const key=(step.fighterId??"")+":"+step.id;
    const row=equipment[key]??={id:step.id,...(step.fighterId?{fighterId:step.fighterId}:{}),from:{...step.from},to:{...step.to},steps:0,cost:0};
    row.to={...step.to};row.steps++;row.cost+=step.cost;
  }
  const oldStats=effectiveAttributeProgress(before.attributeEffortActive,before.skills);
  const stats=effectiveAttributeProgress(after.attributeEffortActive,after.skills);
  const attributes=Object.keys(stats).map(id=>({id,from:oldStats[id].value,to:stats[id].value,
    xp:attributeXP(Math.max(0,after.attributeEffort[id]-before.attributeEffort[id]))}));
  const expertise=Object.keys(after.expertise).filter(id=>after.expertise[id]>before.expertise[id]).map(id=>({id,hours:expertiseHours(after.expertise[id]-before.expertise[id])}));
  if(after.teamSecond&&before.teamSecond){
    for(const id of Object.keys(after.teamSecond.expertise))if(after.teamSecond.expertise[id]>before.teamSecond.expertise[id])expertise.push({id,fighterId:"second",hours:expertiseHours(after.teamSecond.expertise[id]-before.teamSecond.expertise[id])});
    for(const x of expertise)if(!x.fighterId)x.fighterId="first";
  }
  const skills=SKILL_IDS.filter(id=>work[id]||after.skills[id].level!==before.skills[id].level).map(id=>({id,completed:work[id]?.completed??0,xp:work[id]?.xp??0,from:before.skills[id].level,to:after.skills[id].level,ready:activityRewardCapped(after,id)}));
  return {elapsedMs:Math.max(0,after.settledAtMs-before.settledAtMs),saved,automationUnavailable,
    arena:{...arena,losses:arena.defeats+arena.doubleDeaths,winRate:arena.bouts?arena.victories/arena.bouts:null},
    wallet:{before:before.coins,earned:arena.coins,spent,after:after.coins},gained,consumed,tribute:{...(mastery?.tribute??{})},
    ...(after.teamwork&&before.teamwork?{teamwork:{from:before.teamwork.level,to:saved?after.teamwork.level:before.teamwork.level,xp:after.teamwork.xp}}:{}),
    skills,attributes,expertise,upgrades:Object.values(equipment),upgradeCount:upgrades.length,levels:mastery?.ready.length??0,
    activity:after.activity,transition:after.transition?.targetActivity??null,route:after.wagons.map(w=>w.activity),
    capped:SKILL_IDS.filter(id=>activityRewardCapped(after,id)),stage:after.autoFight.stage};
}
