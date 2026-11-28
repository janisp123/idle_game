// Local alpha only. Sequential sorties against a shared seven-enemy HP pool.
// Gear condition and temporary effects reset between sorties; no fake online roster.
import {clanWeek,clanWeekEnd,joinClanWeek,completeClanWeek,clanBonuses,validClanCombat,validAlphaClan} from "./alpha-clan.mjs";
import {startGroupSession,validGroupSession} from "./battle-group-timeline.mjs?v=raid-001";
import {GROUP_IDS} from "./battle-group.mjs?v=group-001";
import {captureGroupCloneEnvelope,validGroupCloneEnvelope,buildGroupCloneTeam} from "./battle-group-clones.mjs?v=group-003";
import {cloneRewardGrade} from "./clone-opponents.mjs?v=npc-parity-001";
import {raidMonsters} from "./raid-encounters.mjs?v=raid-002";
import {GROUP_ARENAS} from "./arenas.mjs?v=bal-002";
import {resolveTeamBattle} from "./team-combat.mjs?v=raid-001";
const count=n=>Number.isSafeInteger(n)&&n>=0;
export const clanRaidGroupCount=level=>2+Math.floor((level-1)/5);
export function validClanRegistration(r){
 return Boolean(r&&count(r.week)&&Number.isInteger(r.level)&&r.level>=1&&r.level<=50&&count(r.seed)&&r.seed<=0xffffffff&&validGroupSession(r.frozen)&&r.frozen.elapsedMs===0&&r.frozen.groupCombatRules===10&&validGroupCloneEnvelope(r.envelope)&&Number.isInteger(r.skill)&&r.skill>=1&&validClanCombat(r.bonus));
}
export function registerClanRaid(s,wallNow){
 const c=s.alphaClan,w=clanWeek(wallNow);
 if(c.levels.portal===50||c.raid.joinedWeek!==null||c.raid.lastWeek!==null&&c.raid.lastWeek>=w)return s;
 const skill=s.skills.fighting.level,seed=Math.imul(w^c.levels.portal,2654435761)>>>0;
 const frozen=startGroupSession(s.battleGroup,{difficulty:cloneRewardGrade(skill),str:1,dex:1,end:1,skill},s.teamwork.level,seed,{rules:10});
 const registration={week:w,level:c.levels.portal+1,seed,frozen,envelope:captureGroupCloneEnvelope(s.battleGroup),skill,bonus:clanBonuses(c).combat};
 if(!validClanRegistration(registration))throw new RangeError("Invalid clan registration snapshot");
 return {...s,alphaClan:joinClanWeek(c,wallNow,registration)};
}
export function resolveClanRaid(r){
 if(!validClanRegistration(r))throw new RangeError("Invalid clan raid registration");
 const tier=Math.ceil(r.level/10)*10,enemies=raidMonsters(tier,r.frozen.staffEquipment===true),terrain=GROUP_ARENAS[(r.level-1)%GROUP_ARENAS.length];
 const shared={difficulty:cloneRewardGrade(r.skill),str:1,dex:1,end:1,skill:r.skill},groups=clanRaidGroupCount(r.level);
 let hp=null,startHP=0,rounds=0,used=0;
 for(let i=0;i<groups;i++){
  const seed=Math.imul(r.seed^(i+1),2654435761)>>>0,players=i===0?GROUP_IDS.map(id=>r.frozen.players[id]):buildGroupCloneTeam(r.envelope,shared,seed,10,r.frozen.staffEquipment===true);
  const result=resolveTeamBattle(players,enemies,seed,terrain,{player:r.frozen.teamworkLevel,enemy:tier,groupCombatRules:10,playerClanBonus:r.bonus,clanEncounter:{level:r.level,hp}});
  if(i===0)startHP=Object.entries(result.events[0].vitals).filter(([k])=>k.startsWith("enemy:")).reduce((n,[,v])=>n+v.maxHP,0);
  hp=Array.from({length:7},(_,j)=>result.survivors["enemy:"+j]);rounds+=result.rounds;used++;
  if(hp.every(n=>n===0))break;
 }
 return {level:r.level,week:r.week,outcome:hp.every(n=>n===0)?"victory":"defeat",groups:used,simulatedAllies:used-1,rounds,startHP,remainingHP:hp.reduce((a,b)=>a+b,0)};
}
export function settleClanRaid(s,wallNow){
 const r=s.alphaClan.raid.registration;if(!r||wallNow<clanWeekEnd(r.week))return {state:s};
 const result=resolveClanRaid(r);return {state:{...s,alphaClan:completeClanWeek(s.alphaClan,wallNow,result.outcome)},clanRaidResult:result};
}
