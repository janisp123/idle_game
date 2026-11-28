// Developer-only real Chrome smoke. No npm dependency, external website,
// user save, credentials or remote browser control. Serve only the site tree.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {mkdtemp,readFile,writeFile,mkdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {resolve,extname,sep,join} from "node:path";
import {setTimeout as delay} from "node:timers/promises";

const root=resolve("site"),output=resolve("stabilization-save-browser-results");
const profile=await mkdtemp(join(tmpdir(),"idle-chrome-"));
await mkdir(output,{recursive:true});
const types={".html":"text/html",".mjs":"text/javascript",".js":"text/javascript",".css":"text/css",
  ".svg":"image/svg+xml",".webp":"image/webp",".png":"image/png",".woff2":"font/woff2"};
const failures=[];
const server=createServer(async(req,res)=>{
  try{
    let pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
    if(pathname.endsWith("/"))pathname+="index.html";
    const file=resolve(root,"."+pathname);
    if(!file.startsWith(root+sep))throw Error("outside site");
    const bytes=await readFile(pathname==="/play/index.html"&&new URL(req.url,"http://127.0.0.1").searchParams.has("legacy")?resolve("tools/fixtures/legacy-play.html"):file);
    res.writeHead(200,{"Content-Type":types[extname(file)]??"application/octet-stream","Cache-Control":"no-store"});
    res.end(bytes);
  }catch{failures.push(req.url);res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const origin="http://127.0.0.1:"+server.address().port;
const chrome=spawn(process.env.CHROME_BIN||"google-chrome",[
  "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-background-networking",
  "--disable-component-update","--no-first-run","--no-default-browser-check",
  "--remote-debugging-address=127.0.0.1","--remote-debugging-port=0","--user-data-dir="+profile,"about:blank"
],{stdio:"ignore"});
let socket,spawnError;
chrome.on("error",error=>spawnError=error);
async function until(fn,label){
  let last;
  for(let i=0;i<160;i++){
    if(spawnError)throw spawnError;
    try{last=await fn();if(last)return last;}catch(error){last=String(error);}
    await delay(100);
  }
  throw Error("Timed out: "+label+" ("+String(last)+")");
}
const pending=new Map(),runtimeErrors=[];
let seq=0;
function send(method,params={}){
  const id=++seq;
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{pending.delete(id);reject(Error("CDP timeout "+method));},15000);
    pending.set(id,{resolve:value=>{clearTimeout(timeout);resolve(value);},reject:error=>{clearTimeout(timeout);reject(error);}});
    socket.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression){
  const result=await send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true,userGesture:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);
  return result.result.value;
}
import {newArenaManager,enterArena,readArenaManager} from "../site/play/arena-manager.mjs";
const now=1800000000000,day=86400000,key="idle-game-manager-v2",clockKey="idle-game-manager-clock-v2",rand=()=>.5;
const fresh=enterArena(newArenaManager(now,true),now,rand,now).state;
const results=[],sockets=[];
let port;
async function connect(target){
 const ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 ws.addEventListener("message",message=>{
  const value=JSON.parse(message.data);
  if(value.id){const p=pending.get(value.id);if(p)value.error?p.reject(Error(value.error.message)):p.resolve(value.result);}
  if(value.method==="Runtime.exceptionThrown")runtimeErrors.push(value.params.exceptionDetails.exception?.description??value.params.exceptionDetails.text);
 });
 sockets.push(ws);socket=ws;await send("Page.enable");await send("Runtime.enable");return ws;
}
const status=()=>evaluate("({status:document.getElementById('saveStatus')?.textContent,ready:document.getElementById('saveStatus')?.getAttribute('data-game-ready'),notice:document.getElementById('migrationNotice')?.textContent})");
const read=()=>evaluate("localStorage.getItem("+JSON.stringify(key)+")");
const readClock=()=>evaluate("(()=>{const raw=JSON.parse(localStorage.getItem("+JSON.stringify(key)+"));return Object.hasOwn(raw,'managerClock')?JSON.stringify(raw.managerClock):JSON.stringify(JSON.parse(localStorage.getItem("+JSON.stringify(clockKey)+")));})()");
const snapshot=async()=>{const raw=await read(),s=readArenaManager(raw);assert.ok(s,"invalid persisted save");return {raw,settledAtMs:s.settledAtMs,coins:s.coins,cursor:s.combatSession?.prizeCursor,analytics:s.groupAnalytics.all.outcomes.reduce((a,b)=>a+b,0)};};
async function nav(label,fixture=fresh,resetClock=true,extra=""){
 const url=origin+"/play/?s01="+label;
 const setup="if(location.href==="+JSON.stringify(url)+"){Date.now=()=>"+now+";Math.random=()=>.5;Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});"+(fixture===undefined?"":"localStorage.setItem("+JSON.stringify(key)+","+JSON.stringify(typeof fixture==="string"?fixture:JSON.stringify(fixture))+");")+(resetClock?"localStorage.removeItem("+JSON.stringify(clockKey)+");":"")+extra+"}";
 const i=await send("Page.addScriptToEvaluateOnNewDocument",{source:setup});
 await send("Page.navigate",{url});
 await until(async()=>{const s=await status();return await evaluate("location.href")===url&&(s.ready==="true"||s.status==="Progress not saved");},"navigation "+label);
 await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:i.identifier});
 return status();
}
async function healthy(label){await until(async()=>{const s=await status();return s.ready==="true"&&s.status==="Saved locally";},label);}
async function tick(t){await evaluate("Date.now=()=>"+t+";document.dispatchEvent(new Event('visibilitychange'));");}
async function test(id,fn){try{const evidence=await fn();results.push({id,pass:true,evidence});}catch(e){results.push({id,pass:false,error:String(e.message)});}console.log("S01_BROWSER "+JSON.stringify(results.at(-1)));}
try{
 port=await until(async()=>Number((await readFile(join(profile,"DevToolsActivePort"),"utf8")).split("\n")[0]),"Chrome startup");
 const list=async()=>await (await fetch("http://127.0.0.1:"+port+"/json/list")).json();
 const target=await until(async()=>(await list()).find(t=>t.type==="page"),"Chrome tab");
 const first=await connect(target);
 await send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await test("ordinary save write failure preserves last valid state and recovers once",async()=>{
  await nav("quota");await healthy("quota ready");const before=await snapshot();
  await evaluate("window.__origSet=Storage.prototype.setItem;window.__failSave=true;Storage.prototype.setItem=function(k,v){if(k==="+JSON.stringify(key)+"&&window.__failSave)throw new DOMException('S01 injected quota','QuotaExceededError');return window.__origSet.call(this,k,v)};");
  await tick(now+10000);
  await until(async()=>(await status()).status==="Progress not saved","quota reported");
  assert.equal(await read(),before.raw,"failed write overwrote save");
  await evaluate("window.__failSave=false;");
  await tick(now+10000);
  await until(async()=>(await status()).status==="Saved locally"&&(await snapshot()).cursor===1,"quota recovered");
  const after=await snapshot();assert.equal(after.analytics-before.analytics,1);assert.equal(after.settledAtMs,now+10000);
  await tick(now+10000);await delay(650);const replay=await snapshot();
  assert.equal(replay.cursor,after.cursor);assert.equal(replay.coins,after.coins);assert.equal(replay.analytics,after.analytics);
  return {preserved:true,afterCursor:after.cursor,afterAnalytics:after.analytics,replayedOnce:true};
 });
 await test("alpha clock and state atomicity after second write fails",async()=>{
  await nav("partial-clock");await healthy("clock ready");const before=await snapshot(),oldClock=await readClock();
  await evaluate("window.__origSet=Storage.prototype.setItem;window.__sawClock=false;Storage.prototype.setItem=function(k,v){if(k==="+JSON.stringify(clockKey)+"){const r=window.__origSet.call(this,k,v);window.__sawClock=true;return r;}if(k==="+JSON.stringify(key)+"&&(window.__sawClock||JSON.parse(v).managerClock?.gameAnchorMs>="+(now+day)+"))throw new DOMException('S01 injected clock transaction','QuotaExceededError');return window.__origSet.call(this,k,v)};");
  await evaluate("document.getElementById('alphaDay').click()");
  await until(async()=>(await status()).status==="Progress not saved","clock partial failure reported");
  const after=await snapshot(),nextClock=await readClock();
  const evidence={oldClock,nextClock,beforeSettled:before.settledAtMs,afterSettled:after.settledAtMs,unchangedState:before.raw===after.raw,clockAdvanced:nextClock!==oldClock,notice:(await status()).notice};
  console.log("S01_CLOCK_PARTIAL "+JSON.stringify(evidence));
  assert.equal(after.settledAtMs,before.settledAtMs,"state unexpectedly committed");
  assert.equal(nextClock,oldClock,"clock persisted despite failed state commit");
  await evaluate("Storage.prototype.setItem=window.__origSet;");
  await nav("clock-reload",after.raw,false);await healthy("failed clock reload");
  assert.equal((await snapshot()).settledAtMs,now);
  await evaluate("document.getElementById('alphaDay').click()");
  await until(async()=>{const s=await snapshot();return s.settledAtMs===now+day&&(await status()).status==="Saved locally";},"atomic day retry");
  const committed=await snapshot(),committedClock=await readClock();
  assert.equal(JSON.parse(committedClock).gameAnchorMs,now+day);
  await nav("clock-success-reload",committed.raw,false);await healthy("successful clock reload");
  const restored=await snapshot();assert.equal(restored.settledAtMs,committed.settledAtMs);assert.equal(restored.coins,committed.coins);assert.equal(restored.analytics,committed.analytics);
  return {...evidence,reloadPreserved:true,retrySettledAt:committed.settledAtMs,successfulClock:committedClock};
 });
 await test("legacy companion clock and explicit reset",async()=>{
  const legacy={version:1,realAnchorMs:now,gameAnchorMs:now+day,speed:1};
  await nav("legacy-clock",fresh,true,"localStorage.setItem("+JSON.stringify(clockKey)+","+JSON.stringify(JSON.stringify(legacy))+");");
  await healthy("legacy clock loaded");
  const imported=await snapshot();assert.equal(imported.settledAtMs,now+day);assert.deepEqual(JSON.parse(imported.raw).managerClock,legacy);
  await evaluate("window.confirm=()=>true;document.getElementById('alphaReset').click()");
  await until(async()=>{const s=await snapshot();return s.settledAtMs===now&&JSON.parse(s.raw).managerClock===null;},"explicit clock reset");
  const reset=await snapshot();await nav("reset-reload",reset.raw,false);await healthy("reset persisted");
  assert.equal((await snapshot()).settledAtMs,now);assert.equal(await readClock(),"null");
  return {legacyImported:true,resetPersisted:true};
 });
 await test("unreadable save retained on reload",async()=>{
  const bad="{not-json";const st=await nav("corrupt",bad);
  assert.equal(st.status,"Progress not saved");assert.equal(await read(),bad);
  await tick(now+10000);await delay(650);assert.equal(await read(),bad);
  return {retained:true,notice:st.notice};
 });
 await test("two tabs with Web Locks settle shared boundary once",async()=>{
  await nav("tab-a");await healthy("tab A ready");assert.equal(await evaluate("typeof navigator.locks?.request"),"function");
  const before=await snapshot();
  const secondId=(await send("Target.createTarget",{url:"about:blank"})).targetId;
  const secondTarget=await until(async()=>(await list()).find(t=>t.id===secondId),"second target");
  const second=await connect(secondTarget);
  // Install the same valid state, then both tabs see the same persisted value.
  await nav("tab-b",JSON.parse(before.raw));await healthy("tab B ready");
  await tick(now+10000);
  socket=first;await tick(now+10000);
  await until(async()=>{const s=await snapshot();return s.cursor===1&&s.settledAtMs===now+10000;},"tab A shared save");
  await delay(1200);const a=await snapshot();
  socket=second;await delay(650);const b=await snapshot();
  assert.equal(a.analytics-before.analytics,1);assert.equal(b.analytics,a.analytics);assert.equal(a.cursor,1);assert.equal(b.cursor,1);assert.equal(b.coins,a.coins);
  return {cursor:b.cursor,analytics:b.analytics,coins:b.coins,webLocks:true};
 });
 assert.deepEqual(runtimeErrors,[]);assert.deepEqual(failures,[]);
}finally{
 await writeFile("stabilization-save-browser.json",JSON.stringify({results,runtimeErrors,failedRequests:failures},null,2)+"\n");
 for(const ws of sockets)ws.close();chrome.kill();server.close();await delay(200);await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
console.log("S01_BROWSER_SUMMARY "+JSON.stringify({passed:results.filter(x=>x.pass).length,total:results.length}));
if(results.some(x=>!x.pass))process.exitCode=1;
