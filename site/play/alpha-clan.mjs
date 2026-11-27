// CLAN-BUILDINGS-001: pure local clan rules; no server authority.
export const ALPHA_CLAN=Object.freeze({id:"ashen_covenant",name:"The Ashen Covenant",version:2,rewardInterval:10,baseMembers:10});
export const CLAN_DAY=86400000,CLAN_WEEK=7*CLAN_DAY;
export const CLAN_BUILDINGS=Object.freeze({barracks:{name:"Barracks",max:20,base:50},armoury:{name:"Armoury",max:100,base:20},training:{name:"Training Hall",max:20,base:50},bank:{name:"Clan Bank",max:20,base:50},portal:{name:"Clan Portal",max:50}});
export const CLAN_CONSTRUCTION=Object.freeze(["barracks","armoury","training","bank"]);
export const CLAN_STATS=Object.freeze(["hp","defence","damage","accuracy","healing"]);
const count=n=>Number.isSafeInteger(n)&&n>=0;
const own=(o,k)=>Object.hasOwn(o,k);
export const clanWeek=t=>Math.floor((t+3*CLAN_DAY)/CLAN_WEEK);
export const clanWeekEnd=w=>(w+1)*CLAN_WEEK-3*CLAN_DAY;
export function buildingCost(id,level){const d=CLAN_BUILDINGS[id];if(!CLAN_CONSTRUCTION.includes(id)||!Number.isInteger(level)||level<1||level>d.max)throw new RangeError("Invalid construction level");return d.base*level*level;}
export function buildingDuration(id,level){buildingCost(id,level);const fraction=level/CLAN_BUILDINGS[id].max;return CLAN_DAY*(fraction<=.2?1:fraction<=.8?3:5);}
const spent=c=>CLAN_CONSTRUCTION.reduce((n,k)=>{const l=c.levels[k];return n+CLAN_BUILDINGS[k].base*l*(l+1)*(2*l+1)/6;},0)+(c.construction?.cost??0);
export function validAlphaClan(c){
 if(!c||typeof c!=="object"||c.id!==ALPHA_CLAN.id||c.version!==2||!count(c.joinedAtMs)||!count(c.treasury)||!count(c.donated)||!count(c.rewardCursor)||c.rewardCursor>=10||!c.levels||Object.keys(c.levels).length!==5||!Object.keys(CLAN_BUILDINGS).every(k=>count(c.levels[k])&&c.levels[k]<=CLAN_BUILDINGS[k].max)||!CLAN_CONSTRUCTION.includes(c.priority)||!count(c.legacySpent))return false;
 const q=c.construction;
 if(q!==null&&(!q||!CLAN_CONSTRUCTION.includes(q.id)||q.level!==c.levels[q.id]+1||q.level>CLAN_BUILDINGS[q.id].max||!count(q.start)||!count(q.end)||q.cost!==buildingCost(q.id,q.level)||q.end-q.start!==buildingDuration(q.id,q.level)))return false;
 const r=c.raid;
 if(!r||!(r.joinedWeek===null||count(r.joinedWeek))||!(r.lastWeek===null||count(r.lastWeek))||!(r.lastOutcome===null||["victory","defeat"].includes(r.lastOutcome))||(r.lastWeek===null)!==(r.lastOutcome===null)||(r.joinedWeek!==null&&r.lastWeek!==null&&r.joinedWeek<=r.lastWeek)||(r.joinedWeek===null)!==(r.registration===null)||r.registration!==null&&(!r.registration||r.registration.level!==c.levels.portal+1||r.registration.week!==r.joinedWeek))return false;
 return c.donated===c.treasury+spent(c)+c.legacySpent;
}
export function migrateAlphaClan(c){
 if(c?.version!==1)return c;
 // The temporary Academy was never released. Preserve any candidate treasury
 // and contribution cursor; spent test coins remain recorded, not duplicated.
 if(c.id!==ALPHA_CLAN.id||!count(c.joinedAtMs)||!count(c.treasury)||!count(c.donated)||c.treasury>c.donated||!count(c.rewardCursor)||c.rewardCursor>=10)return c;
 return {...freshClan(c.joinedAtMs),treasury:c.treasury,donated:c.donated,rewardCursor:c.rewardCursor,legacySpent:c.donated-c.treasury};
}
function freshClan(t){return {id:ALPHA_CLAN.id,version:2,joinedAtMs:t,treasury:0,donated:0,rewardCursor:0,legacySpent:0,levels:Object.fromEntries(Object.keys(CLAN_BUILDINGS).map(k=>[k,0])),priority:"training",construction:null,raid:{joinedWeek:null,lastWeek:null,lastOutcome:null,registration:null}};}
export function enrollAlphaClan(s){
 if(!s.arenaOnly||!count(s.settledAtMs))throw new RangeError("Invalid clan enrollment");
 if(s.alphaClan!==undefined){if(!validAlphaClan(s.alphaClan))throw new RangeError("Invalid clan save");return s;}
 return {...s,alphaClan:freshClan(s.settledAtMs)};
}
export function clanStatBonuses(level,perLevel){const r=Object.fromEntries(CLAN_STATS.map(k=>[k,0]));for(let i=0;i<level;i++)r[CLAN_STATS[Math.floor(i/5)%5]]+=perLevel;return r;}
export function clanBonuses(c){const levels=c?.levels??{barracks:0,armoury:0,training:0,bank:0,portal:0},armoury=clanStatBonuses(levels.armoury,1),portal=clanStatBonuses(levels.portal,3);return {members:10+5*levels.barracks,xp:levels.training,coins:levels.bank,armoury,portal,combat:Object.fromEntries(CLAN_STATS.map(k=>[k,armoury[k]+portal[k]]))};}
export const clanXpMultiplier=s=>s.arenaOnly&&s.activity==="fighting"?1+(s.alphaClan?.levels.training??0)/100:1;
export const validClanCombat=b=>Boolean(b&&Object.keys(b).length===5&&CLAN_STATS.every(k=>count(b[k])&&b[k]<=50));
export function clanSnapshot(c){if(!c)return null;const b={bank:c.levels.bank,combat:clanBonuses(c).combat};return b.bank||Object.values(b.combat).some(Boolean)?b:null;}
export const validClanSnapshot=b=>Boolean(b&&Object.keys(b).length===2&&count(b.bank)&&b.bank<=20&&validClanCombat(b.combat));
export function setClanPriority(c,id){if(!validAlphaClan(c)||!CLAN_CONSTRUCTION.includes(id))throw new RangeError("Invalid priority");return {...c,priority:id};}
// At most one completion and one new start per observation. New work never
// backdates a start to the offline period or spends projected donations.
export function advanceConstruction(c,now){
 if(!validAlphaClan(c)||!count(now))throw new RangeError("Invalid clan clock");
 let next=c;const q=c.construction;
 if(q&&now>=q.end)next={...c,levels:{...c.levels,[q.id]:q.level},construction:null};
 if(next.construction)return next;
 const order=[next.priority,...CLAN_CONSTRUCTION.filter(k=>k!==next.priority)];
 const id=order.find(k=>next.levels[k]<CLAN_BUILDINGS[k].max&&next.treasury>=buildingCost(k,next.levels[k]+1));
 if(!id)return next;
 const level=next.levels[id]+1,cost=buildingCost(id,level),end=now+buildingDuration(id,level);
 if(!count(end))throw new RangeError("Construction time overflow");
 return {...next,treasury:next.treasury-cost,construction:{id,level,start:now,end,cost}};
}
export function joinClanWeek(c,now,registration){if(!validAlphaClan(c)||!count(now))throw new RangeError("Invalid clan signup");const w=clanWeek(now);if(c.levels.portal===50||c.raid.joinedWeek!==null||c.raid.lastWeek!==null&&c.raid.lastWeek>=w)return c;if(!registration||registration.week!==w||registration.level!==c.levels.portal+1)throw new RangeError("Invalid raid registration");return {...c,raid:{...c.raid,joinedWeek:w,registration}};}
export function completeClanWeek(c,now,outcome){if(!validAlphaClan(c)||!count(now)||!["victory","defeat"].includes(outcome))throw new RangeError("Invalid clan raid outcome");const w=c.raid.joinedWeek;if(w===null||now<clanWeekEnd(w))return c;return {...c,levels:{...c.levels,portal:Math.min(50,c.levels.portal+Number(outcome==="victory"))},raid:{joinedWeek:null,lastWeek:w,lastOutcome:outcome,registration:null}};}
// A settlement segment has one reward grade and one fractional carry. Each
// positive whole-coin payout advances the saved cursor; zero payouts do not.
// The bounded period avoids looping over every win in long offline intervals.
export function applyClanRewards(c,wins,units,ratio,carry=0){
 if(!validAlphaClan(c)||![wins,units,ratio,carry].every(count)||ratio<1||ratio>2000||carry>=ratio||!count(wins*units+carry))throw new RangeError("Invalid clan reward segment");
 const total=Math.floor((wins*units+carry)/ratio),n=units<ratio?total:wins;
 const first=ALPHA_CLAN.rewardInterval-c.rewardCursor,donations=n<first?0:1+Math.floor((n-first)/ALPHA_CLAN.rewardInterval);
 let amount=0;
 if(units<ratio)amount=donations;
 else{
  // Reward at win k: floor((carry+k*units)/ratio)-floor((carry+(k-1)*units)/ratio).
  // After ratio donation positions the fractional phase repeats.
  const value=i=>{const k=first+i*ALPHA_CLAN.rewardInterval;return Math.floor((carry+k*units)/ratio)-Math.floor((carry+(k-1)*units)/ratio);};
  const cycles=Math.floor(donations/ratio),extra=donations%ratio;
  if(cycles)for(let i=0;i<ratio;i++)amount+=cycles*value(i);
  for(let i=0;i<extra;i++)amount+=value(i);
 }
 const next={...c,rewardCursor:(c.rewardCursor+n%ALPHA_CLAN.rewardInterval)%ALPHA_CLAN.rewardInterval,treasury:c.treasury+amount,donated:c.donated+amount};
 if(!validAlphaClan(next)||amount>total)throw new RangeError("Clan reward overflow");
 return {clan:next,donated:amount};
}
