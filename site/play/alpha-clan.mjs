// ALPHA-CLAN-001: local clan, automatic every-tenth positive arena reward.
export const ALPHA_CLAN=Object.freeze({id:"ashen_covenant",name:"The Ashen Covenant",version:1,rewardInterval:10,academyBaseCost:100,maxAcademy:6});
const count=n=>Number.isSafeInteger(n)&&n>=0;
export function validAlphaClan(c){
 return Boolean(c&&typeof c==="object"&&!Array.isArray(c)&&Object.keys(c).length===7&&c.id===ALPHA_CLAN.id&&c.version===ALPHA_CLAN.version&&count(c.joinedAtMs)&&count(c.treasury)&&count(c.donated)&&c.treasury<=c.donated&&Number.isInteger(c.academyLevel)&&c.academyLevel>=1&&c.academyLevel<=ALPHA_CLAN.maxAcademy&&count(c.rewardCursor)&&c.rewardCursor<ALPHA_CLAN.rewardInterval&&c.donated-c.treasury===ALPHA_CLAN.academyBaseCost*(c.academyLevel-1)*c.academyLevel/2);
}
export function enrollAlphaClan(s){
 if(!s.arenaOnly)throw new RangeError("Clan alpha requires arena-only mode");
 if(s.alphaClan!==undefined){if(!validAlphaClan(s.alphaClan))throw new RangeError("Invalid clan save");return s;}
 if(!count(s.settledAtMs))throw new RangeError("Invalid enrollment time");
 return {...s,alphaClan:{id:ALPHA_CLAN.id,version:1,joinedAtMs:s.settledAtMs,treasury:0,donated:0,academyLevel:1,rewardCursor:0}};
}
export function clanXpBonus(c){return c?(4+c.academyLevel)/100:0;}
export const clanXpMultiplier=s=>s.arenaOnly&&s.activity==="fighting"?1+clanXpBonus(s.alphaClan):1;
export const academyCost=c=>c.academyLevel>=ALPHA_CLAN.maxAcademy?null:ALPHA_CLAN.academyBaseCost*c.academyLevel;
export function canUpgradeAcademy(s){const c=s.alphaClan;return Boolean(s.arenaOnly&&validAlphaClan(c)&&academyCost(c)!==null&&c.treasury>=academyCost(c));}
export function upgradeAcademy(s){
 if(!canUpgradeAcademy(s))throw new RangeError("Academy upgrade unavailable");
 const c=s.alphaClan;return {...s,alphaClan:{...c,treasury:c.treasury-academyCost(c),academyLevel:c.academyLevel+1}};
}
// A settlement segment has one reward grade and one fractional carry. Each
// positive whole-coin payout advances the saved cursor; zero payouts do not.
// The bounded period avoids looping over every win in long offline intervals.
export function applyClanRewards(c,wins,units,ratio,carry=0){
 if(!validAlphaClan(c)||![wins,units,ratio,carry].every(count)||ratio<1||ratio>200||carry>=ratio||!count(wins*units+carry))throw new RangeError("Invalid clan reward segment");
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
