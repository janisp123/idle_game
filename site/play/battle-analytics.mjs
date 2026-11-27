// BATTLE-ANALYTICS-001: bounded counters; no reward logic.
import {ARENAS} from "./arenas.mjs?v=bal-002";
import {COMBAT_LOADOUTS} from "./combat-skills.mjs?v=gear-a3";
const weapons=Object.keys(COMBAT_LOADOUTS).sort(),zones=ARENAS.map(a=>a.id);
const teams=weapons.flatMap((w,i)=>weapons.slice(i).map(v=>w+"+"+v));
const tactics=["aggressive","balanced","defensive"],armours=["none","padded","leather","plate"];
const count=n=>Number.isSafeInteger(n)&&n>=0;
const add=(a,b)=>{const n=a+b;if(!count(n))throw new RangeError("Analytics overflow");return n;};
const blank=()=>({outcomes:[0,0,0],coins:0,ms:0,zones:{},weapons:{},teams:{},tactics:{},armours:{},cloneOutcomes:[0,0,0]});
export const blankBattleAnalytics=()=>({version:1,all:blank(),latest:null});
const total=r=>r.reduce(add,0);
const validRow=r=>Array.isArray(r)&&r.length===3&&r.every(count)&&Number.isSafeInteger(r[0]+r[1]+r[2]);
const validMap=(m,keys)=>m&&typeof m==="object"&&!Array.isArray(m)&&Object.keys(m).every(k=>keys.includes(k)&&validRow(m[k]));
const matchingMap=(m,r)=>r.every((v,i)=>Object.values(m).reduce((s,row)=>s+row[i],0)===v);
const validCloneStats=s=>s.cloneOutcomes===undefined&&s.tactics===undefined&&s.armours===undefined||validRow(s.cloneOutcomes)&&s.cloneOutcomes.every((n,i)=>n<=s.outcomes[i])&&validMap(s.tactics,tactics)&&validMap(s.armours,armours)&&[s.tactics,s.armours].every(m=>Object.values(m).every(r=>r.every((n,i)=>n<=s.cloneOutcomes[i])));
const validStats=s=>s&&validRow(s.outcomes)&&count(s.coins)&&count(s.ms)&&validMap(s.zones,zones)&&validMap(s.weapons,weapons)&&validMap(s.teams,teams)&&matchingMap(s.zones,s.outcomes)&&matchingMap(s.teams,s.outcomes)&&validCloneStats(s)&&Object.values(s.weapons).every(row=>row.every((n,i)=>n<=s.outcomes[i]));
const validKey=k=>typeof k==="string"&&k.length>0&&k.length<=200&&/^[a-z_+|:]+$/.test(k);
export const validBattleAnalytics=s=>s?.version===1&&validStats(s.all)&&(s.latest===null||(validKey(s.latest?.key)&&validStats(s.latest.stats)&&s.latest.stats.outcomes.every((n,i)=>n<=s.all.outcomes[i])&&s.latest.stats.coins<=s.all.coins&&s.latest.stats.ms<=s.all.ms));
export function strategyKey(players){return Object.values(players).map(p=>{
 const pieces=Object.values(p.trainingKit?.armour??{}),family=new Set(pieces).size===1?pieces[0]:"mixed";
 return [p.loadout,family,p.tactic??"unknown"].join(":");
}).join("|");}
export const newBattleDelta=players=>({...blank(),key:strategyKey(players)});
function rowAdd(m,key,i,n){const row=m[key]??(m[key]=[0,0,0]);row[i]=add(row[i],n);}
export function recordBattleGroup(d,outcome,zone,enemyWeapons,n,clone=null){
 const i=["victory","defeat","double_death"].indexOf(outcome),unique=[...new Set(enemyWeapons)],team=[...enemyWeapons].sort().join("+");
 if(i<0||!zones.includes(zone)||!teams.includes(team)||!count(n)||!unique.every(w=>weapons.includes(w)))throw new RangeError("Invalid analytics group");
 d.outcomes[i]=add(d.outcomes[i],n);rowAdd(d.zones,zone,i,n);rowAdd(d.teams,team,i,n);
 for(const w of unique)rowAdd(d.weapons,w,i,n);
 if(clone){if(!clone.tactics.every(t=>tactics.includes(t))||!clone.armours.every(a=>armours.includes(a)))throw new RangeError("Invalid clone analytics");d.cloneOutcomes[i]=add(d.cloneOutcomes[i],n);for(const t of new Set(clone.tactics))rowAdd(d.tactics,t,i,n);for(const a of new Set(clone.armours))rowAdd(d.armours,a,i,n);}
}
function combine(a,b){
 const next={outcomes:a.outcomes.map((n,i)=>add(n,b.outcomes[i])),coins:add(a.coins,b.coins),ms:add(a.ms,b.ms)};
 next.cloneOutcomes=(a.cloneOutcomes??[0,0,0]).map((n,i)=>add(n,b.cloneOutcomes?.[i]??0));
 for(const k of ["zones","weapons","teams","tactics","armours"]){next[k]={...a[k]};for(const [key,row] of Object.entries(b[k]??{}))next[k][key]=row.map((n,i)=>add(n,a[k]?.[key]?.[i]??0));}
 return next;
}
export function accumulateBattleAnalytics(old,deltas){
 let result=old??blankBattleAnalytics();
 for(const d of deltas){
  if(!total(d.outcomes))continue;
  if(!validStats(d)||!validKey(d.key))throw new RangeError("Invalid analytics delta");
  result={version:1,all:combine(result.all,d),latest:{key:d.key,stats:combine(result.latest?.key===d.key?result.latest.stats:blank(),d)}};
 }
 return result;
}
export function analyticsSummary(stats){const [wins,losses,draws]=stats.outcomes,battles=total(stats.outcomes);return {battles,wins,losses,draws,winRate:battles?wins/battles:null,coinsPerHour:stats.ms?stats.coins/(stats.ms/3600000):null};}
export function analyticsRows(stats,dimension){
 return Object.entries(stats[dimension]??{}).map(([key,row])=>{const [wins,losses,draws]=row,battles=total(row);return {key,wins,losses,draws,battles,winRate:battles?wins/battles:0};}).sort((a,b)=>b.winRate-a.winRate||b.battles-a.battles||a.key.localeCompare(b.key));
}
export function analyticsLabel(key,dimension){return dimension==="zones"?ARENAS.find(a=>a.id===key)?.name:key.split("+").map(w=>COMBAT_LOADOUTS[w]?.name??(w[0].toUpperCase()+w.slice(1))).join(" + ");}
export function strategyLabel(key){return key.split("|").map(part=>part.split(":").map((v,i)=>i===0?COMBAT_LOADOUTS[v]?.name??v:v).join(" / ")).join(" + ");}
