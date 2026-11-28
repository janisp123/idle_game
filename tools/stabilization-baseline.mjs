// S00: developer-only observational baseline. No player data or production edits.
import {execFileSync} from "node:child_process";
import {readFileSync,statSync,existsSync,writeFileSync} from "node:fs";
import {posix as path} from "node:path";
import {createHash} from "node:crypto";
import {performance} from "node:perf_hooks";
import assert from "node:assert/strict";
import {isDeepStrictEqual} from "node:util";
import {newArenaManager,enterArena,readArenaManager,settleArenaLive,startArenaTower,startArenaRaid,chooseClanRaid} from "../site/play/arena-manager.mjs";
import {alphaMaxStats} from "../site/play/alpha-tools.mjs";
import {GROUP_IDS,syncRecruitment,activeGroupIds,upgradeBattleGroup} from "../site/play/battle-group.mjs";
import {startGroupSession,groupCombatAtTime,settleGroupSession} from "../site/play/battle-group-timeline.mjs";
import {initialGroupRank} from "../site/play/battle-group-rank.mjs";
import {clanWeekEnd} from "../site/play/alpha-clan.mjs";
import {TOWER_ATTEMPT_MS} from "../site/play/endless-tower.mjs";
const sha=x=>createHash("sha256").update(typeof x==="string"||Buffer.isBuffer(x)?x:JSON.stringify(x)).digest("hex");
const git=(...args)=>execFileSync("git",args,{encoding:"utf8",maxBuffer:32*1024*1024}).trim();
const tracked=git("ls-files","-z").split("\0").filter(Boolean);
const rows=tracked.filter(p=>existsSync(p)&&statSync(p).isFile()).map(p=>({path:p,bytes:statSync(p).size,hash:sha(readFileSync(p))}));
const total=a=>a.reduce((n,x)=>n+x.bytes,0);
const groups={};for(const r of rows){const key=r.path.split("/")[0];(groups[key]??=[]).push(r);}
const hashes=new Map();for(const r of rows){const a=hashes.get(r.hash)??[];a.push(r);hashes.set(r.hash,a);}
const duplicates=[...hashes.values()].filter(a=>a.length>1).map(a=>({bytes:a[0].bytes,paths:a.map(x=>x.path)}));
const html=readFileSync("site/play/index.html","utf8");
const map=JSON.parse(html.match(/<script type="importmap">\s*([\s\S]*?)<\/script>/)[1]).imports;
const graph=new Map(),unresolved=[],dynamicUnknown=[];
function visit(url){
 if(graph.has(url))return;
 const filename=url.split("?")[0];
 if(!existsSync(filename)){unresolved.push(url);return;}
 const src=readFileSync(filename,"utf8"),edges=[];
 graph.set(url,{file:filename,edges});
 // Literal static imports/reexports and literal dynamic imports. Not a proof of dead code.
 const re=/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+)["']/g;
 for(const m of src.matchAll(re)){
  const spec=m[1];if(!spec.startsWith("."))continue;
  const canonical=path.normalize(path.join(path.dirname(filename),spec));
  const key="./"+path.relative("site/play",canonical);
  const resolved=map[key]?path.normalize(path.join("site/play",map[key])):canonical;
  edges.push(resolved);visit(resolved);
 }
 if(/\bimport\s*\(\s*[^"'\s]/.test(src))dynamicUnknown.push(filename);
}
for(const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g))if(m[1].startsWith("."))visit(path.normalize(path.join("site/play",m[1])));
const physical=[...new Set([...graph.values()].map(x=>x.file))];
const inventory={trackedFiles:rows.length,trackedBytes:total(rows),siteFiles:rows.filter(r=>r.path.startsWith("site/")).length,siteBytes:total(rows.filter(r=>r.path.startsWith("site/"))),groups:Object.fromEntries(Object.entries(groups).map(([k,a])=>[k,{files:a.length,bytes:total(a)}])),largest:rows.slice().sort((a,b)=>b.bytes-a.bytes).slice(0,20),duplicates,publicModuleGraph:{aliasCount:Object.keys(map).length,moduleURLs:graph.size,physicalModules:physical.length,bytes:physical.reduce((n,p)=>n+statSync(p).size,0),unresolved,dynamicUnknown,modules:[...graph.entries()],unreachedCandidates:rows.filter(r=>r.path.startsWith("site/play/")&&r.path.endsWith(".mjs")&&!physical.includes(r.path)).map(r=>r.path)}};
const now=1800000000000,seed=20261128,rand=()=>.5,day=86400000;
const fresh=()=>enterArena(newArenaManager(now,true),now,rand,now).state;
function session(s,grade=0){return startGroupSession(s.battleGroup,{difficulty:grade,str:1,dex:1,end:1,skill:s.skills.fighting.level},s.teamwork.level,seed,{rules:10,rank:initialGroupRank(grade),arenaFavorites:[]});}
function stage(level){const s=fresh();s.battleGroup.member1.recruitment.level=level;s.combatSession=session(s);return s;}
function maxed(){let s=alphaMaxStats(fresh(),"none",now,rand).state;s={...s,battleGroup:upgradeBattleGroup(s.battleGroup,100000000,52).group};s.combatSession=session(s,7);return s;}
const fixtures={fresh:fresh(),level19:stage(19),level20:stage(20),level29:stage(29),level30:stage(30)};
const seven=fresh();seven.battleGroup=syncRecruitment(seven.battleGroup,30);seven.skills.fighting={level:30,xp:0};seven.combatSession=session(seven);fixtures.sevenRecruits=seven;fixtures.maxed=maxed();
const tower=startArenaTower(fixtures.fresh,now,rand).state;fixtures.towerPending=tower;fixtures.towerFinished=enterArena(tower,now+TOWER_ATTEMPT_MS,rand,now).state;
const raidBase={...fixtures.maxed,tower:{...fixtures.maxed.tower,highest:10}};
const raid=startArenaRaid(raidBase,10,now,rand).state;assert.ok(raid.raidRun);fixtures.raidPending=raid;fixtures.raidFinished=enterArena(raid,now+raid.raidRun.durationMs,rand,now).state;
const clan=chooseClanRaid(fixtures.maxed,now,now,rand).state;assert.ok(clan.alphaClan.raid.registration);fixtures.clanPending=clan;fixtures.clanFinished=enterArena(clan,now,rand,clanWeekEnd(clan.alphaClan.raid.registration.week)).state;
const legacy=structuredClone(fixtures.fresh);for(const a of Object.values(legacy.combatSession.players))delete a.recruitLevel;fixtures.legacyFrozen=legacy;
function differences(a,b,p="",out=[]){
 if(isDeepStrictEqual(a,b)||out.length>=30)return out;
 if(a&&b&&typeof a==="object"&&typeof b==="object"&&Array.isArray(a)===Array.isArray(b)){
  for(const key of new Set([...Object.keys(a),...Object.keys(b)])){differences(a[key],b[key],p+"/"+key,out);if(out.length>=30)break;}
 }else out.push(p||"/");
 return out;
}
const summaries={};for(const [id,s] of Object.entries(fixtures)){const serialized=JSON.stringify(s);const restored=readArenaManager(serialized);summaries[id]={sha256:sha(serialized),bytes:Buffer.byteLength(serialized),roster:activeGroupIds(s.battleGroup).length,valid:!!restored,roundtripIdentical:!!restored&&JSON.stringify(restored)===serialized,structuralEqual:!!restored&&isDeepStrictEqual(s,restored),changedPaths:restored?differences(s,restored):["unreadable"]};}
writeFileSync("stabilization-synthetic-fixtures.json",JSON.stringify({now,fresh:fixtures.fresh,maxed:fixtures.maxed}));
const metrics=[];
function bench(id,fn,n=10){
 fn();const times=[],digests=[];for(let i=0;i<n;i++){const t=performance.now();const out=fn();times.push(performance.now()-t);digests.push(sha(out));}
 const sorted=times.slice().sort((a,b)=>a-b);metrics.push({id,repeats:n,medianMs:(sorted[Math.floor((n-1)/2)]+sorted[Math.ceil((n-1)/2)])/2,p95Ms:sorted[Math.ceil(.95*n)-1],timesMs:times,stable:new Set(digests).size===1,resultHash:digests[0]});
}
for(const name of ["fresh","level20","maxed"]){
 const s=fixtures[name];
 bench(name+"-save-parse",()=>readArenaManager(JSON.stringify(s)));
 bench(name+"-combat-preview",()=>groupCombatAtTime(s.combatSession));
 bench(name+"-10sec-settlement",()=>settleGroupSession(s.combatSession,10000));
 bench(name+"-500ms-live",()=>settleArenaLive(s,now+500,rand,now).state);
}
bench("fresh-24h-offline",()=>enterArena(fixtures.fresh,now+day,rand,now+day).state);
bench("fresh-30d-offline",()=>enterArena(fixtures.fresh,now+30*day,rand,now+30*day).state);
bench("maxed-24h-offline",()=>enterArena(fixtures.maxed,now+day,rand,now+day).state,3);
const report={commit:git("rev-parse","HEAD"),node:process.version,platform:process.platform,arch:process.arch,seed,now,inventory,fixtures:summaries,metrics,limitations:["Synthetic fixtures, not natural progression or a real player save.","Node timings only, no browser CPU/memory or transferred bytes yet.","Three repeats for expensive maxed offline path; descriptive, not a reliable p95.","Literal imports only; candidates are not safe-to-delete findings.","No balance assessment."]};
writeFileSync("stabilization-baseline.json",JSON.stringify(report,null,2)+"\n");
console.log("S00_INVENTORY "+JSON.stringify({trackedFiles:inventory.trackedFiles,trackedBytes:inventory.trackedBytes,siteFiles:inventory.siteFiles,siteBytes:inventory.siteBytes,modules:physical.length,aliasCount:Object.keys(map).length,duplicateGroups:duplicates.length,unresolved,dynamicUnknown}));
console.log("S00_FIXTURES "+JSON.stringify(summaries));
for(const m of metrics)console.log("S00_METRIC "+JSON.stringify(m));
