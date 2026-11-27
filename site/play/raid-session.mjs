// One saved, deterministic raid attempt; no separate save key or clock.
import {RAID_LEVELS,RAID_RULES_VERSION,RAID_ROUND_MS,RAID_MAX_ROUNDS,validRaidBuff,raidDefinition,raidVictoryBuff} from "./raid-rules.mjs?v=raid-002";
import {resolveRaid} from "./raid-encounters.mjs?v=raid-002";
import {startGroupSession,validGroupSession} from "./battle-group-timeline.mjs?v=raid-001";
import {GROUP_IDS} from "./battle-group.mjs?v=group-001";
const count=n=>Number.isSafeInteger(n)&&n>=0;
export function validRaidRun(r){return r===null||Boolean(r&&r.version===RAID_RULES_VERSION&&RAID_LEVELS.includes(r.level)&&count(r.startedAtMs)&&count(r.durationMs)&&r.durationMs>=RAID_ROUND_MS&&r.durationMs<=RAID_ROUND_MS*RAID_MAX_ROUNDS&&r.durationMs%RAID_ROUND_MS===0&&count(r.startedAtMs+r.durationMs)&&validRaidBuff(r.buff)&&validGroupSession(r.frozen)&&[4,5].includes(r.frozen.groupCombatRules)&&r.frozen.elapsedMs===0);}
export const validRaidLast=r=>r===null||Boolean(r&&RAID_LEVELS.includes(r.level)&&count(r.finishedAtMs)&&["victory","defeat","double_death"].includes(r.outcome)&&r.coins===(r.outcome==="victory"?raidDefinition(r.level).coins:0));
let cachedKey="",cachedResult=null;
export function raidResult(run){
 if(!validRaidRun(run)||!run)throw new RangeError("Invalid raid attempt");
 const key=JSON.stringify([run.version,run.level,run.startedAtMs,run.buff,run.frozen]);
 if(key!==cachedKey){cachedResult=resolveRaid(GROUP_IDS.map(id=>run.frozen.players[id]),run.level,run.frozen.seed,run.frozen.teamworkLevel,run.buff,run.startedAtMs,run.frozen.groupCombatRules);cachedKey=key;}
 if(cachedResult.durationMs!==run.durationMs)throw new RangeError("Raid duration does not match frozen combat");
 return cachedResult;
}
export function beginRaid(s,level,seed=s.settledAtMs>>>0){
 if(!s.arenaOnly||s.raidRun)throw new RangeError("Cannot begin raid");
 const d=raidDefinition(level),frozen=startGroupSession(s.battleGroup,{difficulty:d.grade,str:1,dex:1,end:1,skill:s.skills.fighting.level},s.teamwork.level,seed,{rules:5});
 const buff=s.raidBuff??null,result=resolveRaid(GROUP_IDS.map(id=>frozen.players[id]),level,seed,s.teamwork.level,buff,s.settledAtMs,frozen.groupCombatRules);
 const raidRun={version:RAID_RULES_VERSION,level,startedAtMs:s.settledAtMs,durationMs:result.durationMs,buff,frozen};
 if(!validRaidRun(raidRun))throw new RangeError("Invalid raid start");
 cachedKey=JSON.stringify([raidRun.version,level,raidRun.startedAtMs,buff,frozen]);cachedResult=result;
 return {...s,raidRun};
}
export function advanceRaid(s,now){
 if(!validRaidRun(s.raidRun)||!s.raidRun||!count(now))throw new RangeError("Invalid raid clock");
 const run=s.raidRun,end=run.startedAtMs+run.durationMs,time=Math.max(s.settledAtMs,now);
 if(time<end)return {state:{...s,settledAtMs:time},finished:null};
 const result=raidResult(run),coins=result.outcome==="victory"?raidDefinition(run.level).coins:0,total=s.coins+coins;
 if(!count(total))throw new RangeError("Raid reward overflow");
 const raidLast={level:run.level,finishedAtMs:end,outcome:result.outcome,coins};
 const raidBuff=coins?raidVictoryBuff(s.raidBuff??null,run.level,end):s.raidBuff??null;
 return {state:{...s,settledAtMs:end,coins:total,raidRun:null,raidLast,raidBuff},finished:raidLast};
}
