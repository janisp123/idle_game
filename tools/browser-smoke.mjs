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
  await until(()=>evaluate(`location.href===${JSON.stringify(url)}&&document.readyState==="complete"&&document.getElementById("saveStatus")?.getAttribute("data-game-ready")==="true"`),"app loaded "+label);
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
    const landingUrl=origin+"/?smoke=landing-"+width;
    const landingNav=await send("Page.navigate",{url:landingUrl});
    assert.equal(landingNav.errorText,undefined);
    await until(()=>evaluate(`location.href===${JSON.stringify(landingUrl)}&&document.readyState==="complete"&&document.querySelector(".hero-art img")?.naturalWidth>0`),"landing page loaded "+width);
    const landing=await evaluate(`(()=>{const play=document.querySelector(".button-play"),art=document.querySelector(".hero-art img"),box=play.getBoundingClientRect();
      return {title:document.title,heading:document.querySelector("h1").textContent,copy:document.body.innerText,href:play.getAttribute("href"),width:box.width,height:box.height,visible:box.top>=0&&box.bottom<=innerHeight,
        artWidth:art.naturalWidth,artHeight:art.naturalHeight,artSrc:art.getAttribute("src"),artFits:art.getBoundingClientRect().width<=innerWidth&&Math.abs(art.getBoundingClientRect().width/art.getBoundingClientRect().height-1672/941)<.02,featureFirst:!!(document.getElementById("vision").compareDocumentPosition(document.getElementById("hobby"))&Node.DOCUMENT_POSITION_FOLLOWING),overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.match(landing.title,/The Long Vigil/);assert.match(landing.heading,/The world is cruel/);
    assert.match(landing.copy,/Life beyond the arena/);assert.match(landing.copy,/may be reset/);
    assert.equal(landing.href,"./play/");assert.ok(landing.width>0&&landing.height>=40&&landing.visible,"Play Now must be visible above the fold");
    assert.equal(landing.artWidth,1672);assert.equal(landing.artHeight,941);assert.equal(landing.artSrc,"./assets/gladiator-shield-clash.png");assert.ok(landing.artFits&&landing.featureFirst&&landing.overflow<=2,"landing artwork sizing, order or overflow");
    await shot("landing-"+width);
    const hobby=await evaluate(`(()=>{const section=document.getElementById("hobby");section.scrollIntoView({block:"start",behavior:"instant"});const box=section.querySelector("h2").getBoundingClientRect();return {copy:section.innerText,items:section.querySelectorAll("li").length,heading:box.top>=0&&box.bottom<=innerHeight,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.match(hobby.copy,/It will always be 100% free/);
    assert.match(hobby.copy,/loss of progress are possible/);
    assert.match(hobby.copy,/No donations or financial contributions/);
    assert.equal(hobby.items,5);assert.ok(hobby.heading,"hobby heading in viewport: "+JSON.stringify(hobby));assert.ok(hobby.overflow<=2,"hobby horizontal overflow: "+hobby.overflow);
    await shot("hobby-"+width);
    await navigate("clean-"+width,{[saveKey]:null,[clockKey]:null});
    const fresh=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));return {activity:s.activity,route:s.wagons,transition:s.transition,difficulty:s.difficulties.fighting??0,coins:s.coins,level:s.skills.fighting.level,combat:!document.getElementById("combatFlow").hidden};})()`);
    assert.equal(fresh.activity,"fighting");assert.deepEqual(fresh.route,[{activity:"fighting",plannedMs:null}]);assert.equal(fresh.transition,null);assert.equal(fresh.difficulty,0);assert.equal(fresh.level,1);assert.equal(fresh.coins,0);// Fixed clock does not create a combat session until positive time elapses.
    await evaluate(`(()=>{Date.now=()=>${fixedNow+1000};document.dispatchEvent(new Event("visibilitychange"));})()`);
    await until(()=>evaluate('!document.getElementById("combatFlow").hidden'),"first automatic bout "+width);
    await evaluate(`Date.now=()=>${fixedNow}`);
    const apprentice=await evaluate(`(()=>{const menu=document.getElementById("apprenticeMenu");menu.querySelector("summary").click();const result={open:menu.open,text:menu.innerText,locked:[...menu.querySelectorAll("input")].every(i=>i.disabled),overflow:document.documentElement.scrollWidth-innerWidth};menu.querySelector("summary").click();return result;})()`);
    assert.ok(apprentice.open&&apprentice.locked&&apprentice.overflow<=2);assert.match(apprentice.text,/0 earned levels/i);assert.match(apprentice.text,/Unlocks at LvL 50/);assert.match(apprentice.text,/1 \/ 5 activity slots unlocked/);
    const old=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));s.version=15;s.name="Old alpha";return JSON.stringify(s);})()`);
    await navigate("reset-"+width,{[saveKey]:old,[clockKey]:JSON.stringify({version:1,realAnchorMs:0,gameAnchorMs:0,speed:10})});
    const notice=await evaluate('({hidden:document.getElementById("saveResetNotice").hidden,text:document.getElementById("saveResetNotice").textContent})');
    assert.equal(notice.hidden,false);
    assert.match(notice.text,/Alpha progression was reset/);
    assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(clockKey)})`),null);
    assert.equal(await evaluate('document.getElementById("character-heading").textContent'),"Wanderer");
    await evaluate('document.getElementById("dismissSaveReset").click()');
    assert.equal(await evaluate('document.getElementById("saveResetNotice").hidden'),true);
    const compact=await evaluate(`(()=>{const panel=document.getElementById("resourcesPanel"),list=document.getElementById("resourceList"),summary=panel.querySelector("summary");const closed=!panel.open;summary.click();const opened=panel.open&&list.getBoundingClientRect().height>0;summary.click();const folded=!panel.open;const skill=document.querySelector(".skill-focus");return {closed,opened,folded,combined:skill.contains(document.getElementById("visitMaster"))&&skill.contains(document.getElementById("skillXp"))&&skill.contains(document.getElementById("masterAudience")),overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.ok(compact.closed&&compact.opened&&compact.folded&&compact.combined&&compact.overflow<=2,"compact skill and resources layout");
    const clan=await evaluate(`(()=>{const menu=document.getElementById("clanMenu"),summary=menu.querySelector("summary");const closed=!menu.open;summary.click();menu.scrollIntoView({block:"start"});return {closed,open:menu.open,text:menu.innerText,disabled:[...menu.querySelectorAll("button")].every(b=>b.disabled),count:menu.querySelectorAll("button").length,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.ok(clan.closed&&clan.open&&clan.disabled&&clan.count===2&&clan.overflow<=2);
    assert.match(clan.text,/not available in this browser-only alpha/);
    assert.match(clan.text,/Search clans/);assert.match(clan.text,/Create a clan/);
    await shot("clan-"+width);
    await evaluate('document.getElementById("clanMenu").querySelector("summary").click()');
    const result=await evaluate(`(()=>{const $=id=>document.getElementById(id);
      $("alphaTools").open=true;$("alphaFamily").value="leather";
      $("alphaMaxStats").click();$("alphaCoins").click();$("alphaCoins").click();
      const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));
      $("alphaTools").scrollIntoView({block:"start"});return {s,hidden:$("alphaTools").hidden,
        status:$("alphaStatus").textContent,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.equal(result.hidden,false);assert.equal(result.s.version,16);assert.equal(result.s.skills.fighting.level,52);
    assert.equal(result.s.coins,200000);assert.equal(result.s.expertise.greatsword,4235*14400000);
    assert.equal(result.s.expertise.leather,4213*14400000);assert.equal(result.s.expertise.plate,0);
    assert.match(result.status,/100,000/);assert.ok(result.overflow<=2,"horizontal page overflow: "+result.overflow);
    await shot("alpha-"+width);
    const statView=await evaluate(`(()=>{
      const panel=document.getElementById("characterStatsPanel"),equipment=document.getElementById("armourCabinet");
      panel.open=true;equipment.open=true;panel.dispatchEvent(new Event("toggle"));
      const sheet=document.getElementById("characterStatsBreakdown");
      const count=sheet.querySelectorAll("details").length,initiallyClosed=sheet.querySelectorAll("details[open]").length===0;
      sheet.querySelector('details[data-stat-key="primary-attack"]').open=true;
      const before=sheet.textContent;
      document.querySelector('[data-loadout="bow"]').click();
      const after=sheet.textContent;
      return {open:panel.open,equipment:equipment.open,before,after,count,initiallyClosed,
        keptOpen:sheet.querySelector('details[data-stat-key="primary-attack"]').open,
        othersClosed:sheet.querySelectorAll("details[open]").length===1,overflow:document.documentElement.scrollWidth-innerWidth};
    })()`);
    assert.ok(statView.open&&statView.equipment);
    assert.ok(statView.initiallyClosed&&statView.count>=20&&statView.keptOpen&&statView.othersClosed);
    assert.match(statView.before,/Attack power · swing/);
    assert.match(statView.after,/Attack power · shot/);
    assert.match(statView.after,/Attack power · dagger/);
    assert.match(statView.after,/Activity modifiers/);
    assert.match(statView.after,/No direct gear bonus/i);
    assert.notEqual(statView.before,statView.after);
    assert.ok(statView.overflow<=2,"stat sheet horizontal overflow");
    await shot("stats-"+width);
    await navigate("persist-"+width);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})).coins`),200000);
    const capped=await evaluate(`(async()=>{const e=await import("./engine.mjs?v=cap-001");const start=Date.now()-86400000;
      const s=e.chooseActivity(e.newGame(start),"mining",start,()=>.5).state;return JSON.stringify(e.settle(s,Date.now(),()=>.5).state);})()`);
    await navigate("capped-"+width,{[saveKey]:capped,[clockKey]:null});
    const pause=await evaluate(`(()=>{const key=${JSON.stringify(saveKey)},before=JSON.parse(localStorage.getItem(key));
      document.getElementById("alphaDay").click();const after=JSON.parse(localStorage.getItem(key));
      return {before,after,notice:document.getElementById("skillXp").textContent,reset:document.getElementById("saveResetNotice").hidden};})()`);
    assert.match(pause.notice,/All rewards paused/);assert.equal(pause.reset,true);
    for(const key of ["items","attributeEffort","expertise","coins","skills"])assert.deepEqual(pause.before[key],pause.after[key]);
    await shot("capped-"+width);
    const veteran=await evaluate(`(async()=>{const e=await import("./engine.mjs?v=apprentice-a2");let s=e.newGame(Date.now());s.skills.fishing.level=51;s.skills.mining.xp=e.xpToNextLevel(1);s.items.stone=12;s.items.log=3;s.coins=50;return JSON.stringify(s);})()`);
    await navigate("master-opt-in-"+width,{[saveKey]:veteran,[clockKey]:null});
    const optIn=await evaluate(`(()=>{const el=document.getElementById("apprenticeAutoMaster"),key=${JSON.stringify(saveKey)};window.confirm=()=>false;el.click();const cancelled=!el.checked&&JSON.parse(localStorage.getItem(key)).apprenticeMasterConsent===0;window.confirm=()=>true;el.click();document.dispatchEvent(new Event("visibilitychange"));const s=JSON.parse(localStorage.getItem(key));return {cancelled,enabled:el.checked,disabled:el.disabled,s};})()`);
    assert.ok(optIn.cancelled&&optIn.enabled&&!optIn.disabled);assert.equal(optIn.s.apprenticeMasterConsent,1);assert.equal(optIn.s.skills.mining.level,1);assert.equal(optIn.s.items.stone,12);
    await navigate("master-claim-"+width);
    const claimed=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})),p=document.getElementById("apprenticeMasterReport");return {s,report:p.textContent,hidden:p.hidden};})()`);
    assert.equal(claimed.s.skills.mining.level,2);assert.equal(claimed.s.skills.mining.xp,0);assert.equal(claimed.s.items.stone,0);assert.equal(claimed.s.items.log,3);assert.equal(claimed.s.coins,50);assert.equal(claimed.hidden,false);assert.match(claimed.report,/Mining LvL 2/);assert.match(claimed.report,/12 Stone/i);
    await navigate("master-repeat-"+width);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})).skills.mining.level`),2);
    assert.equal(await evaluate('document.getElementById("apprenticeMasterReport").hidden'),true);
    await evaluate('document.getElementById("apprenticeAutoMaster").click()');
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})).apprenticeMasterConsent`),0);
    for(const mode of ["impressive_victory","humiliation"]){
      // Only synthetic saves created by production functions in this temporary
      // browser. Pick an actual resolved qualifying final event, never fake it.
      const setup=await evaluate(`(async()=>{
        const e=await import("./engine.mjs?v=cap-001");
        const a=await import("./alpha-tools.mjs?v=cap-001");
        const c=await import("./combat.mjs?v=bal-002");
        const v=await import("./combat-verdict.mjs?v=alpha-gear-a5");
        const mode=${JSON.stringify(mode)},now=Date.now(),start=now-c.BOUT_MS+1;
        let s=e.newGame(start);
        if(mode==="impressive_victory"){
          s=a.alphaMaxStats(s,"plate",start,()=>.5).state;s={...s,coins:4000000};
          s=e.buyEquipment(s,"greatsword",{grade:7,quality:"masterwork"},start,()=>.5).state;
          for(const slot of ["head","torso","arms","legs"])s=e.buyEquipment(s,slot+":plate",{grade:7,quality:"masterwork"},start,()=>.5).state;
        }else{s.skills.fighting.level=2;s.difficulties.fighting=7;s.autoFight.stage=7;}
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

    // Real production winning bout at a known boundary; no synthetic verdicts.
    const autoFixture=await evaluate(`(async()=>{
      const e=await import("./engine.mjs?v=auto-fight-03"),c=await import("./combat.mjs?v=gear-a3");
      const now=Date.now();let s=e.chooseActivity(e.newGame(now),"fighting",now,()=>.5).state;
      s.skills.fighting={level:50,xp:0};s.autoFight={stage:0,streak:9,blocked:1,highest:0};
      const player=e.desiredArenaPlayer(s);
      for(let seed=1;seed<2000;seed++){
        const session={...c.startCombatSession(player,seed),elapsedMs:c.BOUT_MS-500,prizeCursor:0};
        if(c.combatAtTime(session).outcome==="victory"){s.combatSession=session;break;}
      }
      if(!s.combatSession||!e.readSave(s))throw Error("Invalid auto-fight fixture");
      return JSON.stringify(s);
    })()`);
    await navigate("auto-fight-online-"+width,{[saveKey]:autoFixture,[clockKey]:null});
    const initial=await evaluate(`(()=>{const $=id=>document.getElementById(id),p=$("autoFightProgress");
      p.scrollIntoView({block:"center"});return {hidden:p.hidden,stage:$("autoFightStage").textContent,highest:$("autoFightHighest").textContent,next:$("autoFightNext").textContent,
      meter:$("autoFightMeter").getAttribute("aria-valuenow"),controls:p.querySelectorAll("button,input,select").length,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.equal(initial.hidden,false);assert.equal(initial.stage,"Non-grade");assert.equal(initial.highest,"Non-grade");
    assert.match(initial.next,/Retry F.*9 \/ 10/);assert.equal(initial.meter,"90");assert.equal(initial.controls,0);assert.ok(initial.overflow<=2);
    await shot("auto-fight-retry-"+width);
    // No player input: a normal visible tick completes the tenth retry win.
    await evaluate("new Promise(resolve=>setTimeout(resolve,550))");
    await evaluate(`Date.now=()=>${fixedNow+500}`);
    await until(()=>evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})).autoFight.stage===1`),"automatic live advance "+width);
    const passive=await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}))`);
    assert.equal(passive.coins,12);assert.equal(passive.autoFight.highest,0);
    assert.equal(passive.combatLoadout,"greatsword");assert.equal(passive.autoFight.streak,0);
    await navigate("auto-fight-gear-"+width,{[saveKey]:autoFixture,[clockKey]:null});
    // Wait for the ordinary real foreground heartbeat, then make the next
    // gear action cross the bout boundary synchronously in the same task.
    await evaluate("new Promise(resolve=>setTimeout(resolve,550))");
    const online=await evaluate(`(()=>{const key=${JSON.stringify(saveKey)},before=JSON.parse(localStorage.getItem(key));
      Date.now=()=>${fixedNow+500};document.querySelector('[data-loadout="bow"]').click();
      const after=JSON.parse(localStorage.getItem(key));return {before,after,stage:document.getElementById("autoFightStage").textContent,next:document.getElementById("autoFightNext").textContent};})()`);
    assert.equal(online.after.autoFight.stage,1);assert.equal(online.after.autoFight.streak,0);
    assert.equal(online.after.coins-online.before.coins,12);assert.equal(online.after.combatLoadout,"bow");
    assert.equal(online.stage,"F");assert.match(online.next,/Next: E.*0 \/ 3/);
    await navigate("auto-fight-reload-"+width);
    const reload=await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}))`);
    assert.deepEqual(reload.autoFight,online.after.autoFight);assert.equal(reload.coins,online.after.coins);
    // Returning from an absent interval pays the same old-grade reward but
    // never completes the retry, including visibility catch-up.
    await navigate("auto-fight-offline-"+width,{[saveKey]:autoFixture,[clockKey]:null});
    const hidden=await evaluate(`(()=>{const key=${JSON.stringify(saveKey)},before=JSON.parse(localStorage.getItem(key));
      Object.defineProperty(document,"visibilityState",{configurable:true,value:"hidden"});
      document.dispatchEvent(new Event("visibilitychange"));Date.now=()=>${fixedNow+500};
      Object.defineProperty(document,"visibilityState",{configurable:true,value:"visible"});
      document.dispatchEvent(new Event("visibilitychange"));delete document.visibilityState;
      const after=JSON.parse(localStorage.getItem(key));return {before,after,next:document.getElementById("autoFightNext").textContent};})()`);
    assert.deepEqual(hidden.after.autoFight,hidden.before.autoFight);assert.equal(hidden.after.coins-hidden.before.coins,12);
    assert.match(hidden.next,/Retry F.*9 \/ 10/);
    const idle=await evaluate(`(()=>{const key=${JSON.stringify(saveKey)},before=JSON.parse(localStorage.getItem(key));document.getElementById("alphaDay").click();return {before,after:JSON.parse(localStorage.getItem(key))};})()`);
    assert.deepEqual(idle.before.autoFight,idle.after.autoFight);
    console.log(JSON.stringify({width,autoFight:true,liveStage:online.after.autoFight.stage,offlineStage:hidden.after.autoFight.stage,liveCoins:online.after.coins,offlineCoins:hidden.after.coins}));
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
