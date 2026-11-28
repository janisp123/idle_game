// Developer-only real Chrome smoke. No npm dependency, external website,
// user save, credentials or remote browser control. Serve only the site tree.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {mkdtemp,readFile,writeFile,mkdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {resolve,extname,sep,join} from "node:path";
import {setTimeout as delay} from "node:timers/promises";

const root=resolve("site"),output=resolve("stabilization-browser-results");
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
const {now,fresh,maxed}=JSON.parse(await readFile("stabilization-synthetic-fixtures.json","utf8"));
const managerKey="idle-game-manager-v2";
const rows=[];
try {
  const port=await until(async()=>Number((await readFile(join(profile,"DevToolsActivePort"),"utf8")).split("\n")[0]),"Chrome startup");
  const target=await until(async()=>(await (await fetch("http://127.0.0.1:"+port+"/json/list")).json()).find(t=>t.type==="page"),"Chrome tab");
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
  socket.addEventListener("message",message=>{
    const value=JSON.parse(message.data);
    if(value.id){const p=pending.get(value.id);pending.delete(value.id);if(p)value.error?p.reject(Error(value.error.message)):p.resolve(value.result);}
    if(value.method==="Runtime.exceptionThrown")runtimeErrors.push(value.params.exceptionDetails.exception?.description??value.params.exceptionDetails.text);
  });
  await send("Page.enable");await send("Runtime.enable");

 await send("Performance.enable");
 for(const width of [390,1440])for(const [label,fixture] of Object.entries({fresh,maxed})){
  await send("Emulation.setDeviceMetricsOverride",{width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390});
  const url=origin+"/play/?baseline="+width+"-"+label;
  const source="if(location.href==="+JSON.stringify(url)+"){localStorage.setItem("+JSON.stringify(managerKey)+","+JSON.stringify(JSON.stringify(fixture))+");localStorage.removeItem('idle-game-manager-clock-v2');const base=performance.now();Date.now=()=>"+now+"+Math.floor(performance.now()-base);window.__s00={writes:0,writeMs:0,longTasks:[],frames:[]};const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){const t=performance.now();try{return orig.call(this,k,v);}finally{if(k==="+JSON.stringify(managerKey)+"){window.__s00.writes++;window.__s00.writeMs+=performance.now()-t;}}};try{new PerformanceObserver(l=>window.__s00.longTasks.push(...l.getEntries().map(e=>e.duration))).observe({type:'longtask',buffered:true});}catch{};let prev=performance.now();function frame(t){window.__s00.frames.push(t-prev);prev=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);}";
  const injected=await send("Page.addScriptToEvaluateOnNewDocument",{source});
  const t=Date.now();await send("Page.navigate",{url});
  await until(()=>evaluate("location.href==="+JSON.stringify(url)+"&&document.getElementById('saveStatus')?.getAttribute('data-game-ready')==='true'"),"baseline ready");
  const readyMs=Date.now()-t;
  await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:injected.identifier});
  await evaluate("if(document.getElementById('loginReport')?.open)document.getElementById('loginReportDismiss').click();");
  const before=await send("Performance.getMetrics");
  const start=await evaluate("({writes:window.__s00.writes,writeMs:window.__s00.writeMs,longTasks:window.__s00.longTasks.length,frames:window.__s00.frames.length})");
  await delay(15000);
  const after=await send("Performance.getMetrics");
  const result=await evaluate(`(()=>{const b=${JSON.stringify(start)},s=window.__s00,r=performance.getEntriesByType("resource"),frames=s.frames.slice(b.frames).sort((a,b)=>a-b);return {writes:s.writes-b.writes,writeMs:s.writeMs-b.writeMs,longTasks:s.longTasks.slice(b.longTasks),frameP95Ms:frames[Math.ceil(frames.length*.95)-1]??null,resourceCount:r.length,transferBytes:r.reduce((n,x)=>n+x.transferSize,0),decodedBytes:r.reduce((n,x)=>n+x.decodedBodySize,0),saveBytes:new TextEncoder().encode(localStorage.getItem("idle-game-manager-v2")).length,overflow:document.documentElement.scrollWidth-innerWidth,status:document.getElementById("saveStatus").textContent};})()`);
  const a=Object.fromEntries(after.metrics.map(x=>[x.name,x.value])),b=Object.fromEntries(before.metrics.map(x=>[x.name,x.value]));
  const row={width,label,readyMs,intervalMs:15000,...result,heapBytes:a.JSHeapUsedSize,taskDurationSeconds:a.TaskDuration-b.TaskDuration,scriptDurationSeconds:a.ScriptDuration-b.ScriptDuration,layoutCount:a.LayoutCount-b.LayoutCount};
  rows.push(row);console.log("S00_BROWSER "+JSON.stringify(row));
 }
 await writeFile("stabilization-browser.json",JSON.stringify({rows,runtimeErrors,failedRequests:failures},null,2));
 assert.deepEqual(runtimeErrors,[]);assert.deepEqual(failures,[]);
}finally{socket?.close();chrome.kill();server.close();await delay(200);await rm(profile,{recursive:true,force:true}).catch(()=>{});}
