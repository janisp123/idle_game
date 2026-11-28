import {GROUP_CLASS_IDS,GROUP_RACES,GROUP_ROLES} from "./battle-group-classes.mjs?v=group-001";
import {TACTIC_IDS} from "./manager-tactics.mjs?v=manager-tactics-001";
import {GROUP_ARENAS} from "./arenas.mjs?v=bal-002";
const dims={zones:GROUP_ARENAS.map(a=>a.id),classes:GROUP_CLASS_IDS,races:GROUP_RACES,roles:GROUP_ROLES,stances:TACTIC_IDS};
const count=n=>Number.isSafeInteger(n)&&n>=0;
const plus=(a,b)=>{const n=a+b;if(!count(n))throw new RangeError("Group analytics overflow");return n;};
const row=r=>Array.isArray(r)&&r.length===3&&r.every(count)&&count(r[0]+r[1]+r[2]);
const blank=()=>({outcomes:[0,0,0],coins:0,ms:0,...Object.fromEntries(Object.keys(dims).map(k=>[k,{}]))});
const validKey=k=>typeof k==="string"&&k.split("|").length>=1&&k.split("|").length<=7&&k.split("|").every(x=>{const [c,t,...rest]=x.split(":");return !rest.length&&GROUP_CLASS_IDS.includes(c)&&TACTIC_IDS.includes(t);});
function validStats(s){
 if(!s||!row(s.outcomes)||!count(s.coins)||!count(s.ms))return false;
 return Object.entries(dims).every(([d,keys])=>s[d]&&typeof s[d]==="object"&&!Array.isArray(s[d])&&Object.entries(s[d]).every(([k,r])=>keys.includes(k)&&row(r)&&r.every((n,i)=>n<=s.outcomes[i]))&&
  (d!=="zones"||s.outcomes.every((n,i)=>Object.values(s[d]).reduce((a,r)=>a+r[i],0)===n)));
}
export const blankGroupAnalytics=()=>({version:1,all:blank(),latest:null});
export const validGroupAnalytics=a=>Boolean(a?.version===1&&validStats(a.all)&&(a.latest===null||validKey(a.latest?.key)&&validStats(a.latest.stats)&&a.latest.stats.outcomes.every((n,i)=>n<=a.all.outcomes[i])&&a.latest.stats.coins<=a.all.coins&&a.latest.stats.ms<=a.all.ms));
function combine(a,b){
 const out={outcomes:a.outcomes.map((n,i)=>plus(n,b.outcomes[i])),coins:plus(a.coins,b.coins),ms:plus(a.ms,b.ms)};
 for(const d of Object.keys(dims))out[d]=Object.fromEntries([...new Set([...Object.keys(a[d]),...Object.keys(b[d])])].map(k=>[k,[0,1,2].map(i=>plus(a[d][k]?.[i]??0,b[d][k]?.[i]??0))]));
 return out;
}
export function accumulateGroupAnalytics(a,deltas){
 if(!validGroupAnalytics(a)||!Array.isArray(deltas))throw new RangeError("Invalid group analytics");
 let next=a;
 for(const d of deltas){
  if(!validKey(d.key)||!validStats(d))throw new RangeError("Invalid group delta");
  if(!d.outcomes.some(Boolean))continue;
  next={version:1,all:combine(next.all,d),latest:{key:d.key,stats:combine(next.latest?.key===d.key?next.latest.stats:blank(),d)}};
 }
 return next;
}
