// TEAM-003 candidate: frozen team timeline and bounded, exact settlement.
// No live save/UI import until integration and balance gates pass.
import { ARENA_SCHEDULE_BOUTS,BOUT_MS,RESURRECTION_MS,makeOpponent,
  seededCombatRandom,validCombatSession } from "./combat.mjs?v=gear-a3";
import { chooseArena } from "./arenas.mjs?v=bal-002";
import { arenaReward } from "./arena-wallet.mjs?v=gear-a3";
import { TEAM_IDS,awardTeamPractice } from "./team.mjs?v=team-001";
import { awardTeamwork,coordinationChance } from "./teamwork.mjs?v=team-002";
import { resolveTeamBattle } from "./team-combat.mjs?v=manager-tactics-001";
import {validTacticSnapshot} from "./manager-tactics.mjs?v=manager-tactics-001";

export const TEAM_TIMELINE_VERSION=2;
export const TEAM_REWARD_PERCENT=140;
export const teamArenaReward=grade=>Math.round(arenaReward(grade)*TEAM_REWARD_PERCENT/100);
const count=n=>Number.isSafeInteger(n)&&n>=0;
const uint=n=>count(n)&&n<=0xffffffff;
const own=(o,k)=>Object.hasOwn(o,k);
function validSnapshots(s){
  if(!s||typeof s!=="object"||Array.isArray(s)||Object.keys(s).length!==TEAM_IDS.length)return false;
  return TEAM_IDS.every(id=>own(s,id)&&s[id]?.trainingKit&&
    validCombatSession({elapsedMs:0,seed:0,player:s[id]})&&validTacticSnapshot(s[id])&&
    ["difficulty","str","dex","end","skill"].every(k=>s[id][k]===s[TEAM_IDS[0]][k])&&
    Number.isInteger(s[id].difficulty)&&s[id].difficulty>=0&&s[id].difficulty<=7&&
    ["str","dex","end","skill"].every(k=>s[id][k]<=1e6));
}
function validLevel(level){try{coordinationChance(level);return true;}catch{return false;}}
export function validTeamSession(s){
  return Boolean(s&&s.timelineVersion===TEAM_TIMELINE_VERSION&&uint(s.seed)&&count(s.elapsedMs)&&
    count(s.prizeCursor)&&s.prizeCursor===Math.floor(s.elapsedMs/BOUT_MS)&&
    validLevel(s.teamworkLevel)&&validSnapshots(s.players));
}
export function startTeamSession(players,teamworkLevel,seed){
  const s={timelineVersion:TEAM_TIMELINE_VERSION,elapsedMs:0,prizeCursor:0,seed,
    players:structuredClone(players),teamworkLevel};
  if(!validTeamSession(s))throw new RangeError("Invalid frozen team session");
  return s;
}
function boutAt(session,index){
  const scheduled=index%ARENA_SCHEDULE_BOUTS;
  const seed=Math.imul(session.seed^scheduled,2654435761)>>>0;
  const players=TEAM_IDS.map(id=>session.players[id]);
  const grade=players[0].difficulty;
  const enemies=players.map((_,i)=>makeOpponent(scheduled*players.length+i,grade,
    seededCombatRandom((seed^Math.imul(i+1,0x9e3779b9))>>>0)));
  // Provisional symmetric representative draw: keep the existing arena dice,
  // without privileging either roster slot. Does not alter damage formulas.
  const arenaRoll=seededCombatRandom((seed^0x749ae237)>>>0);
  const p=players[Math.floor(arenaRoll()*players.length)];
  const e=enemies[Math.floor(arenaRoll()*enemies.length)];
  const positioning=chooseArena(p,e,arenaRoll);
  const result=resolveTeamBattle(players,enemies,seed,positioning.arena,
    {player:session.teamworkLevel,enemy:1});
  return {result,enemies,positioning,terrain:positioning.arena};
}
export function teamCombatAtTime(session,elapsedMs=session?.elapsedMs){
  if(!validTeamSession(session)||!count(elapsedMs))throw new RangeError("Invalid team timeline");
  const index=Math.floor(elapsedMs/BOUT_MS),inside=elapsedMs%BOUT_MS;
  const {result,enemies,positioning,terrain}=boutAt(session,index);
  const eventMs=Math.floor((BOUT_MS-RESURRECTION_MS-5000)/Math.max(1,result.events.length-1));
  const step=Math.min(result.events.length-1,Math.floor(inside/eventMs));
  return {...result,enemies,positioning,terrain,bout:index+1,step,event:result.events[step],
    eventElapsedMs:inside-step*eventMs,progress:inside/BOUT_MS,
    recovering:inside>=BOUT_MS-RESURRECTION_MS};
}
function summaryAt(session,index){
  const {result}=boutAt(session,index);
  const downtime=result.outcome==="victory"?0:RESURRECTION_MS;
  // Practice candidate: survivors train for the productive bout; a fallen
  // member trains only through its last living round. No inactive-kit credit.
  // A round-based approximation, not elapsed wall-clock strike timing.
  const productive=BOUT_MS-downtime;
  const practice=Object.fromEntries(TEAM_IDS.map((id,i)=>{
    const actor="player:"+i;
    const death=result.events.find(ev=>ev.vitals[actor].hp===0);
    return [id,death?Math.floor(productive*Math.min(result.rounds,death.round)/Math.max(1,result.rounds)):productive];
  }));
  return {outcome:result.outcome,downtime,practice};
}
export function settleTeamSession(session,elapsedMs,cache=new Map()) {
  if(!validTeamSession(session)||!count(elapsedMs)||!count(session.elapsedMs+elapsedMs))
    throw new RangeError("Invalid team settlement time");
  const end=session.elapsedMs+elapsedMs,complete=Math.floor(end/BOUT_MS),cursor=session.prizeCursor;
  const bouts=complete-cursor,repeats=Math.floor(bouts/ARENA_SCHEDULE_BOUTS),extra=bouts%ARENA_SCHEDULE_BOUTS;
  const sampled=new Set(),counts={victory:0,defeat:0,double_death:0};
  const practiceMs=Object.fromEntries(TEAM_IDS.map(id=>[id,0]));
  let downtimeMs=0;
  const at=i=>{
    const index=i%ARENA_SCHEDULE_BOUTS;
    sampled.add(index);
    if(!cache.has(index))cache.set(index,summaryAt(session,index));
    return cache.get(index);
  };
  for(let offset=0;offset<Math.min(bouts,ARENA_SCHEDULE_BOUTS);offset++){
    const n=repeats+Number(offset<extra),s=at(cursor+offset);
    counts[s.outcome]+=n;downtimeMs+=n*s.downtime;
    for(const id of TEAM_IDS)practiceMs[id]+=n*s.practice[id];
  }
  const partial=ms=>{
    const overlap=Math.max(0,ms%BOUT_MS-(BOUT_MS-RESURRECTION_MS));
    return overlap&&at(Math.floor(ms/BOUT_MS)).downtime?overlap:0;
  };
  downtimeMs+=partial(end)-partial(session.elapsedMs);
  const coins=counts.victory*teamArenaReward(session.players[TEAM_IDS[0]].difficulty);
  return {session:{...session,elapsedMs:end,prizeCursor:complete},bouts,
    victories:counts.victory,defeats:counts.defeat,doubleDeaths:counts.double_death,
    coins,downtimeMs,practiceMs,sampledBouts:sampled.size};
}
// Apply to current owned choices using the OLD frozen snapshots. Login
// activation and the activity XP cap remain the future engine's responsibility.
export function applyTeamSettlement(team,teamwork,session,elapsedMs,cache){
  if(teamwork?.level<session?.teamworkLevel)throw new RangeError("Teamwork below frozen level");
  const result=settleTeamSession(session,elapsedMs,cache);
  return {...result,team:awardTeamPractice(team,session.players,result.practiceMs),
    teamwork:awardTeamwork(teamwork,result.bouts)};
}
