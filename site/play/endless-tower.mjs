// TOWER-001: permanent progression, frozen single-floor attempts, no repeat payouts.
import {GROUP_IDS} from "./battle-group.mjs?v=group-001";
import {startGroupSession,validGroupSession,GROUP_BOUT_MS} from "./battle-group-timeline.mjs?v=raid-001";
import {rankProfile} from "./battle-group-rank.mjs?v=group-005";
import {buildGroupCloneTeam} from "./battle-group-clones.mjs?v=group-003";
import {GROUP_ARENAS} from "./arenas.mjs?v=bal-002";
import {resolveTeamBattle} from "./team-combat.mjs?v=raid-001";
import {validCombatSession} from "./combat.mjs?v=gear-a3";
import {validGroupSnapshot} from "./battle-group-actions.mjs?v=kits-001";
import {raidCombatBonus,RAID_LEVELS} from "./raid-rules.mjs?v=raid-002";
import {clanBonuses,validClanCombat} from "./alpha-clan.mjs";
const count=n=>Number.isSafeInteger(n)&&n>=0;
export const TOWER_VERSION=1;
export const TOWER_ATTEMPT_MS=GROUP_BOUT_MS;
export const towerReward=floor=>5*floor;
const validFloor=n=>Number.isSafeInteger(n)&&n>=1&&n<=Math.floor(Number.MAX_SAFE_INTEGER/5);
export function towerDifficulty(floor){
 if(!validFloor(floor))throw new RangeError("Invalid tower floor");
 return {grade:Math.min(7,Math.floor((floor-1)/7)),factor:.35+.021*floor};
}
export function towerProgress(s){
 return s.tower??{version:TOWER_VERSION,highest:0,legacyAccess:Math.max(0,s.raidBuff?.level??0,s.raidRun?.level??0,s.raidLast?.outcome==="victory"?s.raidLast.level:0),run:null,last:null};
}
export const raidUnlocked=(s,level)=>RAID_LEVELS.includes(level)&&Math.max(towerProgress(s).highest,towerProgress(s).legacyAccess)>=level;
const seedFor=floor=>Math.imul(floor^0x4a831fe2,2654435761)>>>0;
export function validTower(t,now){
 if(!t||t.version!==TOWER_VERSION||!count(t.highest)||t.highest>Math.floor(Number.MAX_SAFE_INTEGER/5)||![0,...RAID_LEVELS].includes(t.legacyAccess))return false;
 if(t.last!==null&&!(t.last&&validFloor(t.last.floor)&&count(t.last.finishedAtMs)&&t.last.finishedAtMs<=now&&["victory","defeat","double_death"].includes(t.last.outcome)&&t.last.floor===(t.last.outcome==="victory"?t.highest:t.highest+1)&&t.last.coins===(t.last.outcome==="victory"?towerReward(t.last.floor):0)))return false;
 const r=t.run;if(r===null)return true;
 return Boolean(r&&r.version===TOWER_VERSION&&validFloor(r.floor)&&r.floor===t.highest+1&&count(r.startedAtMs)&&r.startedAtMs<=now&&now<r.startedAtMs+TOWER_ATTEMPT_MS&&r.seed===seedFor(r.floor)&&validGroupSession(r.frozen)&&r.frozen.seed===r.seed&&r.frozen.elapsedMs===0&&r.frozen.groupCombatRules===10&&Array.isArray(r.enemies)&&r.enemies.length===Object.keys(r.frozen.players).length&&r.enemies.every(e=>validGroupSnapshot(e)&&validCombatSession({elapsedMs:0,seed:0,player:e}))&&Number.isInteger(r.enemyTeamwork)&&r.enemyTeamwork>=1&&r.enemyTeamwork<=50&&GROUP_ARENAS.some(a=>a.id===r.arenaId)&&(r.clanBonus===null||validClanCombat(r.clanBonus)));
}
export function beginTower(s){
 const t=towerProgress(s);if(s.raidRun||t.run)return s;
 const floor=t.highest+1,d=towerDifficulty(floor),seed=seedFor(floor),bracket=rankProfile(d.grade);
 const bonus=raidCombatBonus(s.raidBuff,s.settledAtMs),clanBonus=s.alphaClan?clanBonuses(s.alphaClan).combat:null;
 const frozen=startGroupSession(s.battleGroup,{difficulty:d.grade,str:1,dex:1,end:1,skill:s.skills.fighting.level},s.teamwork.level,seed,{rules:10,bonus});
 const enemies=buildGroupCloneTeam(bracket.envelope,bracket.shared,seed,10,frozen.recruitment?Object.keys(frozen.players).length:undefined,frozen.recruitment&&Object.values(frozen.players).every(p=>p.recruitLevel!==undefined)?Object.values(frozen.players).map(p=>p.recruitLevel):undefined,frozen.stanceGate===1),arenaId=GROUP_ARENAS[(floor-1)%GROUP_ARENAS.length].id;
 const run={version:TOWER_VERSION,floor,startedAtMs:s.settledAtMs,seed,frozen,enemies,enemyTeamwork:bracket.teamworkLevel,arenaId,clanBonus};
 const tower={...t,run};if(!validTower(tower,s.settledAtMs))throw new RangeError("Invalid tower attempt");return {...s,tower};
}
export function resolveTower(run){
 const terrain=GROUP_ARENAS.find(a=>a.id===run.arenaId),players=Object.values(run.frozen.players);
 return resolveTeamBattle(players,run.enemies,run.seed,terrain,{player:run.frozen.teamworkLevel,enemy:run.enemyTeamwork,groupCombatRules:10,towerFactor:towerDifficulty(run.floor).factor,...(run.frozen.raidBonus?{playerBonus:run.frozen.raidBonus}:{}),...(run.clanBonus?{playerClanBonus:run.clanBonus}:{})});
}
export function advanceTower(s,now){
 const t=towerProgress(s),r=t.run;if(!r||!count(now))throw new RangeError("Invalid tower clock");
 const end=r.startedAtMs+TOWER_ATTEMPT_MS,time=Math.max(s.settledAtMs,now);
 if(time<end)return {state:{...s,settledAtMs:time},finished:null};
 const result=resolveTower(r),won=result.outcome==="victory",coins=won?towerReward(r.floor):0,total=s.coins+coins;
 if(!count(total))throw new RangeError("Tower reward overflow");
 const finished={floor:r.floor,finishedAtMs:end,outcome:result.outcome,coins};
 return {state:{...s,settledAtMs:end,coins:total,tower:{...t,highest:won?r.floor:t.highest,run:null,last:finished}},finished};
}
