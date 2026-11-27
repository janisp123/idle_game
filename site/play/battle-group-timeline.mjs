// Versioned seven-member timeline; not yet integrated into manager saves.
// Owner-approved 10-second cadence, 1-second recovery and fractional payout.
import {ARENA_SCHEDULE_BOUTS,BOUT_MS,seededCombatRandom,validCombatSession} from "./combat.mjs?v=gear-a3";
import {chooseArena} from "./arenas.mjs?v=bal-002";
import {GROUP_IDS,groupSnapshots,awardGroupPractice,validBattleGroup} from "./battle-group.mjs?v=group-001";
import {validGroupSnapshot} from "./battle-group-actions.mjs?v=kits-001";
import {captureGroupCloneEnvelope,validGroupCloneEnvelope,buildGroupCloneTeam} from "./battle-group-clones.mjs?v=group-003";
import {teamArenaReward} from "./team-timeline.mjs?v=group-004";
import {GROUP_TIMELINE_VERSION,GROUP_BOUT_MS,GROUP_RECOVERY_MS} from "./battle-group-timing.mjs";
import {cloneRewardGrade} from "./clone-opponents.mjs?v=npc-parity-001";
import {initialGroupRank,validGroupRank,rankProfile} from "./battle-group-rank.mjs?v=group-005";
import {validTacticSnapshot,validTactic} from "./manager-tactics.mjs?v=manager-tactics-001";
import {awardTeamwork,validTeamwork} from "./teamwork.mjs?v=team-002";
import {resolveTeamBattle} from "./team-combat.mjs?v=raid-001";
import {GROUP_COMBAT_RULES_VERSION,SUPPORTED_GROUP_COMBAT_RULES} from "./group-counter-rules.mjs";
export {GROUP_TIMELINE_VERSION,GROUP_BOUT_MS,GROUP_RECOVERY_MS};
import {validRaidCombatBonus} from "./raid-rules.mjs";
const duration=GROUP_BOUT_MS,recovery=GROUP_RECOVERY_MS,ratio=BOUT_MS/duration;
const count=n=>Number.isSafeInteger(n)&&n>=0;
const exact=(o,keys)=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
import {validCombatAttributes} from "./stat-combat.mjs";
const sharedKeys=["str","dex","end","skill","difficulty"];
function validPlayers(p,rules){
 return exact(p,GROUP_IDS)&&GROUP_IDS.every(id=>{
  const s=p[id];return validGroupSnapshot(s)&&validTactic(s.tactic)&&validTacticSnapshot(s)&&s.trainingKit&&validCombatSession({elapsedMs:0,seed:0,player:s})&&([4,5].includes(rules)?validCombatAttributes(s.attributes)&&s.str===s.attributes.STR&&s.dex===s.attributes.DEX&&s.end===s.attributes.CON&&s.skill===s.classLevel&&s.difficulty===p[GROUP_IDS[0]].difficulty:sharedKeys.every(k=>s[k]===p[GROUP_IDS[0]][k]&&Number.isFinite(s[k])&&s[k]>=0&&s[k]<=1e6))&&Number.isInteger(s.difficulty)&&s.difficulty<=7&&s.skill>=1;
 });
}
export function validGroupSession(s){
 return Boolean(s?.timelineVersion===GROUP_TIMELINE_VERSION&&count(s.seed)&&s.seed<=0xffffffff&&count(s.elapsedMs)&&s.prizeCursor===Math.floor(s.elapsedMs/duration)&&
  [s.coinRemainder,s.teamworkRemainder].every(n=>count(n)&&n<ratio)&&validTeamwork({level:s.teamworkLevel,xp:0})&&validPlayers(s.players,s.groupCombatRules??1)&&(s.raidBonus===undefined||[4,5].includes(s.groupCombatRules)&&validRaidCombatBonus(s.raidBonus))&&validGroupRank(s.rank)&&(s.groupCombatRules===undefined||SUPPORTED_GROUP_COMBAT_RULES.includes(s.groupCombatRules)));
}
export function startGroupSession(group,shared,teamworkLevel,seed,carry={}){
 const s={timelineVersion:GROUP_TIMELINE_VERSION,groupCombatRules:carry.rules??GROUP_COMBAT_RULES_VERSION,seed,elapsedMs:0,prizeCursor:0,teamworkLevel,
  coinRemainder:carry.coinRemainder??0,teamworkRemainder:carry.teamworkRemainder??0,
  players:groupSnapshots(group,shared,carry.rules??GROUP_COMBAT_RULES_VERSION),...(carry.bonus?{raidBonus:carry.bonus}:{}),rank:carry.rank??initialGroupRank(cloneRewardGrade(shared.skill))};
 if(!validGroupSession(s))throw new RangeError("Invalid frozen group session");
 return structuredClone(s);
}
export const groupPrizeGrade=s=>s.rank.grade;
export const groupWinPrize=s=>Math.floor((teamArenaReward(groupPrizeGrade(s))+s.coinRemainder)/ratio);
function bout(s,index){
 const scheduled=index%ARENA_SCHEDULE_BOUTS,seed=Math.imul(s.seed^scheduled,2654435761)>>>0;
 const bracket=rankProfile(s.rank.grade),players=GROUP_IDS.map(id=>s.players[id]),enemies=buildGroupCloneTeam(bracket.envelope,bracket.shared,seed,s.groupCombatRules??1);
 const roll=seededCombatRandom((seed^0x749ae237)>>>0);
 const positioning=chooseArena(players[Math.floor(roll()*players.length)],enemies[Math.floor(roll()*enemies.length)],roll);
 const terrain=positioning.arena;
 const result=resolveTeamBattle(players,enemies,seed,terrain,{player:s.teamworkLevel,enemy:bracket.teamworkLevel,groupCombatRules:s.groupCombatRules??1,...(s.raidBonus?{playerBonus:s.raidBonus}:{})});
 return {result,enemies,positioning,terrain};
}
export function groupCombatAtTime(s,elapsedMs=s?.elapsedMs){
 if(!validGroupSession(s)||!count(elapsedMs))throw new RangeError("Invalid group combat time");
 const index=Math.floor(elapsedMs/duration),inside=elapsedMs%duration,{result,enemies,positioning,terrain}=bout(s,index);
 return {...result,enemies,positioning,terrain,bout:index+1,progress:inside/duration,recovering:inside>=duration-recovery};
}
function summary(s,index){
 const {result,enemies,terrain}=bout(s,index),downtime=result.outcome==="victory"?0:recovery,productive=duration-downtime;
 const practice=Object.fromEntries(GROUP_IDS.map((id,i)=>{
  const death=result.events.find(ev=>ev.vitals["player:"+i].hp===0);
  return [id,death?Math.floor(productive*Math.min(result.rounds,death.round)/Math.max(1,result.rounds)):productive];
 }));
 return {outcome:result.outcome,downtime,practice,zone:terrain.id,classes:enemies.map(e=>e.classId),races:enemies.map(e=>e.race),roles:enemies.map(e=>e.role),stances:enemies.map(e=>e.tactic)};
}
const add=(a,b)=>{const n=a+b;if(!count(n))throw new RangeError("Group settlement overflow");return n;};
export const groupStrategyKey=players=>GROUP_IDS.map(id=>players[id].classId+":"+players[id].tactic).join("|");
export const blankGroupDelta=players=>({key:groupStrategyKey(players),outcomes:[0,0,0],coins:0,ms:0,zones:{},classes:{},races:{},roles:{},stances:{}});
function record(d,s,n){
 const i=["victory","defeat","double_death"].indexOf(s.outcome);d.outcomes[i]=add(d.outcomes[i],n);
 for(const [dim,values] of [["zones",[s.zone]],["classes",s.classes],["races",s.races],["roles",s.roles],["stances",s.stances]]){
  for(const k of new Set(values)){const row=d[dim][k]??(d[dim][k]=[0,0,0]);row[i]=add(row[i],n);}
 }
}
// Cache summaries only, not enormous event logs; bound by the existing 256
// repeating schedule. Cache belongs to this exact frozen build, seed included.
export function settleGroupSession(s,ms,cache=new Map()){
 if(!validGroupSession(s)||!count(ms)||!count(s.elapsedMs+ms))throw new RangeError("Invalid group settlement");
 const end=s.elapsedMs+ms,complete=Math.floor(end/duration),bouts=complete-s.prizeCursor,repeats=Math.floor(bouts/ARENA_SCHEDULE_BOUTS),extra=bouts%ARENA_SCHEDULE_BOUTS;
 const practiceMs=Object.fromEntries(GROUP_IDS.map(id=>[id,0])),analytics=blankGroupDelta(s.players),sampled=new Set();
 let downtimeMs=0;
 const at=i=>{const index=i%ARENA_SCHEDULE_BOUTS;sampled.add(index);if(!cache.has(index))cache.set(index,summary(s,index));return cache.get(index);};
 for(let offset=0;offset<Math.min(bouts,ARENA_SCHEDULE_BOUTS);offset++){
  const n=repeats+Number(offset<extra),b=at(s.prizeCursor+offset);
  record(analytics,b,n);downtimeMs=add(downtimeMs,n*b.downtime);
  for(const id of GROUP_IDS)practiceMs[id]=add(practiceMs[id],n*b.practice[id]);
 }
 const partial=t=>{const overlap=Math.max(0,t%duration-(duration-recovery));return overlap&&at(Math.floor(t/duration)).downtime?overlap:0;};
 downtimeMs+=partial(end)-partial(s.elapsedMs);
 // Initially retain existing team reward; seven-member economic pacing
 // remains a release gate, not a claim of balanced rewards.
 const coinUnits=add(analytics.outcomes[0]*teamArenaReward(groupPrizeGrade(s)),s.coinRemainder),workUnits=add(bouts,s.teamworkRemainder);
 const coins=Math.floor(coinUnits/ratio),teamworkXP=Math.floor(workUnits/ratio);
 analytics.coins=coins;analytics.ms=bouts*duration;
 return {session:{...s,elapsedMs:end,prizeCursor:complete,coinRemainder:coinUnits%ratio,teamworkRemainder:workUnits%ratio},
  bouts,victories:analytics.outcomes[0],defeats:analytics.outcomes[1],doubleDeaths:analytics.outcomes[2],coins,teamworkXP,downtimeMs,practiceMs,sampledBouts:sampled.size,analytics};
}
export function applyGroupSettlement(group,teamwork,s,ms,cache){
 if(!validBattleGroup(group)||!validTeamwork(teamwork)||teamwork.level<s.teamworkLevel)throw new RangeError("Invalid group progression");
 const result=settleGroupSession(s,ms,cache);
 return {...result,group:awardGroupPractice(group,s.players,result.practiceMs),teamwork:awardTeamwork(teamwork,result.teamworkXP)};
}
