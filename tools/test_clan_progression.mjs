// CLAN-BUILDINGS-001: diagnostic, not accepted live balance.
import test from "node:test";
import assert from "node:assert/strict";
import {newArenaManager,enterArena,chooseClanRaid} from "../site/play/arena-manager.mjs";
import {settleManagerOffline} from "../site/play/manager-lanes.mjs";
import {alphaMaxStats} from "../site/play/alpha-tools.mjs";
import {upgradeBattleGroup} from "../site/play/battle-group.mjs";
import {startGroupSession} from "../site/play/battle-group-timeline.mjs";
import {initialGroupRank} from "../site/play/battle-group-rank.mjs";
import {teamArenaReward} from "../site/play/team-timeline.mjs";
import {CLAN_DAY,CLAN_BUILDINGS,CLAN_CONSTRUCTION,clanBonuses,advanceConstruction,applyClanRewards,setClanPriority,validAlphaClan} from "../site/play/alpha-clan.mjs";
import {resolveClanRaid} from "../site/play/clan-raid.mjs";
const t=2026112700,wall=2026112700000,rand=()=>.5;
const fresh=()=>enterArena(newArenaManager(t),t,rand,wall).state;
function veteran(){
 const s=alphaMaxStats(fresh(),"none",t,rand).state;
 return {...s,battleGroup:upgradeBattleGroup(s.battleGroup,100000000,52).group};
}
function sample(s,grade){
 const session=startGroupSession(s.battleGroup,{difficulty:grade,str:1,dex:1,end:1,skill:s.skills.fighting.level},s.teamwork.level,27112001,{rules:10,rank:initialGroupRank(grade),arenaFavorites:[]});
 const out=settleManagerOffline({...s,combatSession:session},t+CLAN_DAY,rand);
 return {grade,units:teamArenaReward(grade),wins:out.reports.reduce((n,r)=>n+(r.arena?.victories??0),0),bouts:out.reports.reduce((n,r)=>n+(r.arena?.bouts??0),0),gross:out.reports.reduce((n,r)=>n+(r.arena?.coins??0),0)};
}
test("clan economy diagnostic: actual capped arena payout samples, 730-day capacity-limited model",()=>{
 const low=sample(fresh(),0),high=sample(veteran(),7),samples=[low,high],rows=[];
 for(const target of [10,25,50,75,110])for(const cadence of [1,7]){
  let c=fresh().alphaClan,players=[],complete=null;
  for(let day=0;day<=730;day++){
   const now=wall+day*CLAN_DAY,capacity=Math.min(target,clanBonuses(c).members);
   while(players.length<capacity)players.push({ledger:fresh().alphaClan,carry:0});
   let donation=0;
   if(day%cadence===0){
    for(let i=0;i<players.length;i++){
     const p=players[i],s=i%4===0?low:high,units=s.units*(100+c.levels.bank),r=applyClanRewards(p.ledger,s.wins,units,2000,p.carry);
     p.ledger=r.clan;p.carry=(p.carry+s.wins*units)%2000;donation+=r.donated;
    }
   }
   c={...c,treasury:c.treasury+donation,donated:c.donated+donation};
   const priority=10+5*c.levels.barracks<target?"barracks":CLAN_CONSTRUCTION.filter(k=>c.levels[k]<CLAN_BUILDINGS[k].max).sort((a,b)=>c.levels[a]/CLAN_BUILDINGS[a].max-c.levels[b]/CLAN_BUILDINGS[b].max)[0]??"barracks";
   c=advanceConstruction(setClanPriority(c,priority),now);
   if(CLAN_CONSTRUCTION.every(k=>c.levels[k]===CLAN_BUILDINGS[k].max)&&complete===null)complete=day;
  }
  assert.ok(validAlphaClan(c));assert.ok(complete===null||complete>=480);
  rows.push({target,loginEveryDays:cadence,finalMembers:players.length,levels:c.levels,donated:c.donated,treasury:c.treasury,completeDay:complete});
 }
 console.log("CLAN_ECONOMY_730 "+JSON.stringify({samples,assumptions:"25% novice / 75% veteran fixed cohort; one capped sampled absence per login; no live income or XP cap change; exact sampled-rank payout and Bank scaling; no backdating; diagnostic only",rows}));
});
test("clan raid diagnostic: all 50 tiers at actual six-month max benchmark",()=>{
 const s=veteran(),rows=[];
 for(let level=1;level<=50;level++){
  const c={...s.alphaClan,levels:{...s.alphaClan.levels,portal:level-1}};
  const joined=chooseClanRaid({...s,alphaClan:c},t,wall,rand).state,r=resolveClanRaid(joined.alphaClan.raid.registration);
  assert.equal(r.outcome,r.remainingHP===0?"victory":"defeat");
  rows.push({level,outcome:r.outcome,groups:r.groups,remainingHP:r.remainingHP,startHP:r.startHP,rounds:r.rounds});
 }
 console.log("CLAN_RAID_50 "+JSON.stringify({hours:3700,seedWeek:wall,assumptions:"One max roster plus synthetic allies based on its investment, shared HP across sorties, gear/status reset per sortie; prior portal clears included, no Armoury. One seed per level; not final tuning.",rows}));
});
