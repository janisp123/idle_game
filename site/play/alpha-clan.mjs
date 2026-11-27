// ALPHA-CLAN-001: explicitly local, disposable clan test state. No shared authority.
export const ALPHA_CLAN=Object.freeze({id:"ashen_covenant",name:"The Ashen Covenant",version:1,donation:100,lockMs:86400000,maxAcademy:6});
const count=n=>Number.isSafeInteger(n)&&n>=0;
export function validAlphaClan(c){
 return Boolean(c&&typeof c==="object"&&!Array.isArray(c)&&Object.keys(c).length===7&&c.id===ALPHA_CLAN.id&&c.version===ALPHA_CLAN.version&&count(c.joinedAtMs)&&count(c.treasury)&&count(c.donated)&&c.treasury<=c.donated&&Number.isInteger(c.academyLevel)&&c.academyLevel>=1&&c.academyLevel<=ALPHA_CLAN.maxAcademy&&(c.lastDonationAtMs===null||count(c.lastDonationAtMs)&&c.lastDonationAtMs<=Number.MAX_SAFE_INTEGER-ALPHA_CLAN.lockMs)&&c.donated%ALPHA_CLAN.donation===0&&c.donated-c.treasury===ALPHA_CLAN.donation*(c.academyLevel-1)*c.academyLevel/2&&(c.donated===0)===(c.lastDonationAtMs===null));
}
export function enrollAlphaClan(s){
 if(!s.arenaOnly)throw new RangeError("Clan alpha requires arena-only mode");
 if(s.alphaClan!==undefined){if(!validAlphaClan(s.alphaClan))throw new RangeError("Invalid clan save");return s;}
 if(!count(s.settledAtMs))throw new RangeError("Invalid enrollment time");
 return {...s,alphaClan:{id:ALPHA_CLAN.id,version:1,joinedAtMs:s.settledAtMs,treasury:0,donated:0,academyLevel:1,lastDonationAtMs:null}};
}
export function clanXpBonus(c){return c?(4+c.academyLevel)/100:0;}
export const clanXpMultiplier=s=>s.arenaOnly&&s.activity==="fighting"?1+clanXpBonus(s.alphaClan):1;
export const donationUnlockAt=c=>c.lastDonationAtMs===null?0:c.lastDonationAtMs+ALPHA_CLAN.lockMs;
export const academyCost=c=>c.academyLevel>=ALPHA_CLAN.maxAcademy?null:ALPHA_CLAN.donation*c.academyLevel;
export function canDonateClan(s,wallNow){const c=s.alphaClan;return Boolean(s.arenaOnly&&validAlphaClan(c)&&count(wallNow)&&wallNow<=Number.MAX_SAFE_INTEGER-ALPHA_CLAN.lockMs&&wallNow>=donationUnlockAt(c)&&count(s.coins)&&s.coins>=ALPHA_CLAN.donation&&count(c.donated+ALPHA_CLAN.donation));}
export function donateClan(s,wallNow){
 if(!canDonateClan(s,wallNow))throw new RangeError("Clan donation unavailable");
 const c=s.alphaClan,n=ALPHA_CLAN.donation;
 return {...s,coins:s.coins-n,alphaClan:{...c,treasury:c.treasury+n,donated:c.donated+n,lastDonationAtMs:wallNow}};
}
export function canUpgradeAcademy(s){const c=s.alphaClan;return Boolean(s.arenaOnly&&validAlphaClan(c)&&academyCost(c)!==null&&c.treasury>=academyCost(c));}
export function upgradeAcademy(s){
 if(!canUpgradeAcademy(s))throw new RangeError("Academy upgrade unavailable");
 const c=s.alphaClan;return {...s,alphaClan:{...c,treasury:c.treasury-academyCost(c),academyLevel:c.academyLevel+1}};
}
