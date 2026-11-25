// Developer-only real Chrome smoke. No npm dependency, external website,
// user save, credentials or remote browser control. Serve only the site tree.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {mkdtemp,readFile,writeFile,mkdir,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {resolve,extname,sep,join} from "node:path";
import {setTimeout as delay} from "node:timers/promises";

const root=resolve("site"),output=resolve("browser-smoke-results");
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
    const bytes=await readFile(file);
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
async function navigate(label,storage=null){
  const url=origin+"/play/?smoke="+label;
  // pagehide saves the old running character. Install synthetic fixtures on
  // the NEW document before modules start, not into the departing page.
  const inject=storage?await send("Page.addScriptToEvaluateOnNewDocument",{source:
    "if(location.href==="+JSON.stringify(url)+"){for(const [key,value] of Object.entries("+JSON.stringify(storage)+")){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}}"}):null;
  const result=await send("Page.navigate",{url});
  assert.equal(result.errorText,undefined);
  await until(()=>evaluate(`location.href===${JSON.stringify(url)}&&document.readyState==="complete"&&document.getElementById("weaponSlots")?.children.length>0`),"app loaded "+label);
  if(inject)await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:inject.identifier});
}
async function shot(name){
  const r=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
  await writeFile(join(output,name+".png"),Buffer.from(r.data,"base64"));
}
const fixedNow=1800000000000;
const saveKey="idle-game-prototype-v1";
const clockKey="idle-game-alpha-clock-v1";
try{
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
  await send("Page.addScriptToEvaluateOnNewDocument",{source:"Date.now=()=>"+fixedNow+";"});
  for(const width of [390,1440]){
    await send("Emulation.setDeviceMetricsOverride",{width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390});
    await navigate("clean-"+width,{[saveKey]:null,[clockKey]:null});
    const old=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));s.version=11;s.name="Old alpha";return JSON.stringify(s);})()`);
    await navigate("reset-"+width,{[saveKey]:old,[clockKey]:JSON.stringify({version:1,realAnchorMs:0,gameAnchorMs:0,speed:10})});
    const notice=await evaluate('({hidden:document.getElementById("saveResetNotice").hidden,text:document.getElementById("saveResetNotice").textContent})');
    assert.equal(notice.hidden,false);
    assert.match(notice.text,/Alpha progression was reset/);
    assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(clockKey)})`),null);
    assert.equal(await evaluate('document.getElementById("character-heading").textContent'),"Wanderer");
    await evaluate('document.getElementById("dismissSaveReset").click()');
    assert.equal(await evaluate('document.getElementById("saveResetNotice").hidden'),true);
    const result=await evaluate(`(()=>{const $=id=>document.getElementById(id);
      $("alphaTools").open=true;$("alphaFamily").value="leather";
      $("alphaMaxStats").click();$("alphaCoins").click();$("alphaCoins").click();
      const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));
      $("alphaTools").scrollIntoView({block:"start"});return {s,hidden:$("alphaTools").hidden,
        status:$("alphaStatus").textContent,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.equal(result.hidden,false);assert.equal(result.s.version,15);assert.equal(result.s.skills.fighting.level,52);
    assert.equal(result.s.coins,200000);assert.equal(result.s.expertise.greatsword,4235*14400000);
    assert.equal(result.s.expertise.leather,4213*14400000);assert.equal(result.s.expertise.plate,0);
    assert.match(result.status,/100,000/);assert.ok(result.overflow<=2,"horizontal page overflow: "+result.overflow);
    await shot("alpha-"+width);
    await navigate("persist-"+width);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})).coins`),200000);
    for(const mode of ["impressive_victory","humiliation"]){
      // Only synthetic saves created by production functions in this temporary
      // browser. Pick an actual resolved qualifying final event, never fake it.
      const setup=await evaluate(`(async()=>{
        const e=await import("./engine.mjs?v=alpha-gear-a8");
        const a=await import("./alpha-tools.mjs?v=alpha-gear-a9");
        const c=await import("./combat.mjs?v=alpha-gear-a8");
        const v=await import("./combat-verdict.mjs?v=alpha-gear-a5");
        const mode=${JSON.stringify(mode)},now=Date.now(),start=now-c.BOUT_MS+1;
        let s=e.newGame(start);
        if(mode==="impressive_victory"){
          s=a.alphaMaxStats(s,"plate",start,()=>.5).state;s={...s,coins:4000000};
          s=e.buyEquipment(s,"greatsword",{grade:7,quality:"masterwork"},start,()=>.5).state;
          for(const slot of ["head","torso","arms","legs"])s=e.buyEquipment(s,slot+":plate",{grade:7,quality:"masterwork"},start,()=>.5).state;
        }else{s=e.setDifficulty(s,"fighting",7,start,()=>.5).state;}
        s=e.chooseActivity(s,"fighting",start,()=>.5).state;
        s=e.settle(s,now,()=>.5).state;
        const expected=v.combatVerdict(c.combatAtTime(s.combatSession).event);
        if(expected?.category!==mode)throw Error("Fixture did not resolve desired verdict "+JSON.stringify(expected));
        if(!e.readSave(JSON.stringify(s)))throw Error("Fixture save invalid");
        return {save:JSON.stringify(s),label:expected.label};
      })()`);
      await navigate(mode+"-"+width,{[saveKey]:setup.save,[clockKey]:null});
      await until(()=>evaluate('document.getElementById("sceneImage").complete&&document.getElementById("sceneImage").naturalWidth>0'),"verdict image loaded");
      const view=await evaluate(`(()=>{const $=id=>document.getElementById(id);$("combatPanel").scrollIntoView({block:"center"});
        return {title:$("combatEventTitle").textContent,result:$("playerResult").textContent,src:$("sceneImage").getAttribute("src"),
        overflow:document.documentElement.scrollWidth-innerWidth};})()`);
      assert.equal(new URL(view.src,origin+"/play/").pathname,"/play/assets/combat/"+(mode==="impressive_victory"?"impressive-victory":"humiliation")+".webp");
      assert.equal(await evaluate('document.getElementById("sceneImage").naturalWidth'),960);
      assert.equal(await evaluate('document.getElementById("sceneImage").naturalHeight'),640);
      assert.ok(view.title.includes(setup.label),JSON.stringify(view));
      assert.ok(view.result.includes(setup.label),JSON.stringify(view));
      assert.ok(view.overflow<=2,"verdict horizontal overflow");
      await shot(mode+"-"+width);
      console.log(JSON.stringify({width,mode,...view}));
    }
    console.log("Browser smoke passed at "+width+"px: reset notice, alpha controls, persistence and real verdicts.");
  }
  assert.deepEqual(runtimeErrors,[],"browser runtime errors");
  assert.deepEqual(failures,[],"missing local resources");
  console.log("Real Chromium smoke passed at mobile and desktop widths.");
}finally{
  socket?.close();chrome.kill();
  await new Promise(r=>server.close(r));
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
