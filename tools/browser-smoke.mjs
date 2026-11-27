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
async function navigate(label,storage=null,beforeStart="",keepReport=false){
  const url=origin+"/play/?legacy=1&smoke="+label;
  // pagehide saves the old running character. Install synthetic fixtures on
  // the NEW document before modules start, not into the departing page.
  const inject=(storage||beforeStart)?await send("Page.addScriptToEvaluateOnNewDocument",{source:
    "if(location.href==="+JSON.stringify(url)+"){for(const [key,value] of Object.entries("+JSON.stringify(storage??{})+")){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}"+beforeStart+"}"}):null;
  const result=await send("Page.navigate",{url});
  assert.equal(result.errorText,undefined);
  await until(()=>evaluate(`location.href===${JSON.stringify(url)}&&document.readyState==="complete"&&document.getElementById("saveStatus")?.getAttribute("data-game-ready")==="true"`),"app loaded "+label);
  if(inject)await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:inject.identifier});
  if(!keepReport)await evaluate('(()=>{if(document.getElementById("loginReport").open)document.getElementById("loginReportDismiss").click();})()');
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
    assert.match(landing.copy,/Coins and combat experience/);assert.match(landing.copy,/may be reset/);
    assert.equal(landing.href,"./play/");assert.ok(landing.width>0&&landing.height>=40&&landing.visible,"Play Now must be visible above the fold");
    assert.equal(landing.artWidth,1672);assert.equal(landing.artHeight,941);assert.equal(landing.artSrc,"./assets/gladiator-shield-clash.png");assert.ok(landing.artFits&&landing.featureFirst&&landing.overflow<=2,"landing artwork sizing, order or overflow");
    await shot("landing-"+width);
    const hobby=await evaluate(`(()=>{const section=document.getElementById("hobby");section.scrollIntoView({block:"start",behavior:"instant"});const box=section.querySelector("h2").getBoundingClientRect();return {copy:section.innerText,items:section.querySelectorAll("li").length,heading:box.top>=0&&box.bottom<=innerHeight,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.match(hobby.copy,/personal hobby project, not a business model/);assert.doesNotMatch(hobby.copy,/It will always be 100% free/);
    assert.match(hobby.copy,/loss of progress are possible/);
    assert.match(hobby.copy,/reliable servers/);
    assert.equal(hobby.items,0);assert.ok(hobby.heading,"hobby heading in viewport: "+JSON.stringify(hobby));assert.ok(hobby.overflow<=2,"hobby horizontal overflow: "+hobby.overflow);
    await shot("hobby-"+width);
    await navigate("clean-"+width,{[saveKey]:null,[clockKey]:null});
    const fresh=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));return {activity:s.activity,route:s.wagons,transition:s.transition,difficulty:s.difficulties.fighting??0,coins:s.coins,level:s.skills.fighting.level,second:s.teamSecond?.combatLoadout,teamwork:s.teamwork,combat:!document.getElementById("teamBattleReadout").hidden};})()`);
    assert.equal(fresh.activity,"fighting");assert.deepEqual(fresh.route,[{activity:"fighting",plannedMs:null}]);assert.equal(fresh.transition,null);assert.equal(fresh.difficulty,0);assert.equal(fresh.level,1);assert.equal(fresh.coins,0);assert.equal(fresh.second,"bow");assert.deepEqual(fresh.teamwork,{level:1,xp:0});// Fixed clock does not create a combat session until positive time elapses.
    await evaluate(`(()=>{Date.now=()=>${fixedNow+1000};document.dispatchEvent(new Event("visibilitychange"));})()`);
    await until(()=>evaluate('!document.getElementById("teamBattleReadout").hidden && document.querySelectorAll(".team-fighter").length===4'),"first automatic team bout "+width);
    const teamView=await evaluate(`(()=>{const $=id=>document.getElementById(id),s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));return {count:document.querySelectorAll(".team-fighter").length,players:document.querySelectorAll(\'.team-fighter[data-fighter^="player"]\').length,overflow:document.documentElement.scrollWidth-innerWidth,teamwork:$("teamworkStatus").textContent};})()`);
    assert.equal(teamView.count,4);assert.equal(teamView.players,2);assert.ok(teamView.overflow<=2);assert.match(teamView.teamwork,/Teamwork Lv 1/);
    const choices=await evaluate(`(()=>{const $=id=>document.getElementById(id);$("armourCabinet").open=true;const selector=$("teamFighterChoice");selector.value="second";selector.dispatchEvent(new Event("change"));document.querySelector(\'[data-loadout="hammer"]\').click();const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));selector.value="first";selector.dispatchEvent(new Event("change"));return {first:s.combatLoadout,second:s.teamSecond.combatLoadout,frozen:s.combatSession.players.second.loadout,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.equal(choices.first,"greatsword");assert.equal(choices.second,"hammer");assert.equal(choices.frozen,"bow");assert.ok(choices.overflow<=2);
    await shot("team-"+width);
    await evaluate(`Date.now=()=>${fixedNow}`);
    const apprentice=await evaluate(`(()=>{const menu=document.getElementById("apprenticeMenu");menu.querySelector("summary").click();const result={open:menu.open,text:menu.innerText,locked:[...menu.querySelectorAll("input")].every(i=>i.disabled),overflow:document.documentElement.scrollWidth-innerWidth};menu.querySelector("summary").click();return result;})()`);
    assert.ok(apprentice.open&&apprentice.locked&&apprentice.overflow<=2);assert.match(apprentice.text,/0 earned levels/i);assert.match(apprentice.text,/Always active/);assert.match(apprentice.text,/upgrades automatically/);assert.match(apprentice.text,/1 \/ 5 activity slots unlocked/);
    const teamMax=await evaluate(`(()=>{const $=id=>document.getElementById(id);$("alphaTools").open=true;$("alphaFamily").value="plate";$("alphaSecondFamily").value="leather";$("alphaMaxStats").click();const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));return {first:s.expertise,second:s.teamSecond.expertise,coins:s.coins};})()`);
    assert.equal(teamMax.first.greatsword,3400*14400000);assert.equal(teamMax.first.plate,3400*14400000);assert.equal(teamMax.second.hammer,3400*14400000);assert.equal(teamMax.second.leather,3400*14400000);assert.equal(teamMax.second.bow,0);assert.equal(teamMax.coins,0);
    const old=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));s.version=16;s.name="Old alpha";return JSON.stringify(s);})()`);
    await navigate("reset-"+width,{[saveKey]:old,[clockKey]:JSON.stringify({version:1,realAnchorMs:0,gameAnchorMs:0,speed:10})});
    const notice=await evaluate('({hidden:document.getElementById("saveResetNotice").hidden,text:document.getElementById("saveResetNotice").textContent})');
    assert.equal(notice.hidden,false);
    assert.match(notice.text,/Alpha progression was reset/);
    assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(clockKey)})`),null);
    assert.equal(await evaluate('document.getElementById("character-heading").textContent'),"Wanderer");
    await evaluate('document.getElementById("dismissSaveReset").click()');
    assert.equal(await evaluate('document.getElementById("saveResetNotice").hidden'),true);
    const compact=await evaluate(`(()=>{const panel=document.getElementById("resourcesPanel"),list=document.getElementById("resourceList"),summary=panel.querySelector("summary");const closed=!panel.open;summary.click();const opened=panel.open&&list.getBoundingClientRect().height>0;summary.click();const folded=!panel.open;const skill=document.querySelector(".skill-focus");return {closed,opened,folded,combined:skill.contains(document.getElementById("masterStatus"))&&skill.contains(document.getElementById("skillXp"))&&!document.getElementById("visitMaster"),overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.ok(compact.closed&&compact.opened&&compact.folded&&compact.combined&&compact.overflow<=2,"compact skill and resources layout");
    const clan=await evaluate(`(()=>{const menu=document.getElementById("clanMenu"),summary=menu.querySelector("summary");const closed=!menu.open;summary.click();menu.scrollIntoView({block:"start"});return {closed,open:menu.open,text:menu.innerText,disabled:[...menu.querySelectorAll("button")].every(b=>b.disabled),count:menu.querySelectorAll("button").length,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.ok(clan.closed&&clan.open&&clan.disabled&&clan.count===2&&clan.overflow<=2);
    assert.match(clan.text,/not available in this browser-only alpha/);
    assert.match(clan.text,/Search clans/);assert.match(clan.text,/Create a clan/);
    await shot("clan-"+width);
    await evaluate('document.getElementById("clanMenu").querySelector("summary").click()');
    // Preserve the original single-fighter economy regression as a legacy
    // save fixture; fresh team behavior is verified separately above.
    const soloFixture=await evaluate(`(async()=>{const e=await import("./engine.mjs?v=team-004");return JSON.stringify(e.chooseActivity(e.newGame(Date.now()),"fighting",Date.now(),()=>.5).state);})()`);
    await navigate("legacy-solo-regression-"+width,{[saveKey]:soloFixture,[clockKey]:null});
    const result=await evaluate(`(()=>{const $=id=>document.getElementById(id);
      $("alphaTools").open=true;$("alphaFamily").value="leather";
      $("alphaMaxStats").click();$("alphaCoins").click();$("alphaCoins").click();
      const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));
      $("alphaTools").scrollIntoView({block:"start"});return {s,hidden:$("alphaTools").hidden,
        status:$("alphaStatus").textContent,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.equal(result.hidden,false);assert.equal(result.s.version,17);assert.equal(result.s.skills.fighting.level,52);
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
    // Online automation now runs while the previous page is open, so a
    // funded selected bow cannot be assumed to remain unupgraded until reload.
    // Explicitly verify the foreground path, then use an independent pristine
    // funded fixture for the login-report debit and no-repeat assertions.
    await evaluate(`(()=>{const key=${JSON.stringify(saveKey)},s=JSON.parse(localStorage.getItem(key));s.coins=200000;s.combatLoadout="bow";s.equipment.bow={grade:0,quality:"poor"};s.equipment.greatsword={grade:0,quality:"poor"};const value=JSON.stringify(s);localStorage.setItem(key,value);dispatchEvent(new StorageEvent("storage",{key,newValue:value}));})()`);
    await until(()=>evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));return s.combatLoadout==="bow"&&s.equipment.bow.grade===6&&s.equipment.bow.quality==="poor"&&s.coins===8750&&s.equipment.greatsword.grade===0;})()`),"foreground exact bow upgrades "+width);
    const fundedBow=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));s.coins=200000;s.combatLoadout="bow";s.equipment.bow={grade:0,quality:"poor"};s.equipment.greatsword={grade:0,quality:"poor"};return JSON.stringify(s);})()`);
    await navigate("persist-"+width,{[saveKey]:fundedBow},"",true);
    const report=await evaluate(`(()=>{const d=document.getElementById("loginReport"),b=d.getBoundingClientRect();return {open:d.open,modal:d.matches(":modal"),width:b.width,height:b.height,viewportW:innerWidth,viewportH:innerHeight,body:document.getElementById("loginReportBody").innerText,countdown:document.getElementById("loginReportCountdown").textContent,overflow:d.scrollWidth-d.clientWidth};})()`);
    assert.ok(report.open&&report.modal&&report.width===report.viewportW&&report.height===report.viewportH&&report.overflow<=2,JSON.stringify(report));
    assert.match(report.body,/Encounters/);assert.match(report.body,/Victories/);assert.match(report.body,/Losses/);assert.match(report.body,/191,250/);assert.match(report.body,/8,750/);assert.match(report.body,/Bow/);assert.match(report.countdown,/Auto-close in (10|9)s/);
    await shot("login-report-"+width);
    await evaluate('document.getElementById("loginReportDismiss").click()');assert.equal(await evaluate('document.getElementById("loginReport").open'),false);
    await evaluate('document.getElementById("loginReportReopen").click()');assert.equal(await evaluate('document.getElementById("loginReport").open'),true);
    assert.match(await evaluate('document.getElementById("loginReportCountdown").textContent'),/Review mode/);
    await evaluate('document.getElementById("loginReportDismiss").click()');
    const upgrade=await evaluate(`(()=>{const $=id=>document.getElementById(id),s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)}));
      $("apprenticeMenu").open=true;document.querySelector('[data-loadout="bow"]').click();const report=$("apprenticeEquipmentReport");
      return {s,report:report.textContent,hidden:report.hidden,status:$("apprenticeEquipmentStatus").textContent,next:$("apprenticeEquipmentNext").textContent,cost:$("apprenticeEquipmentCost").textContent,
        controls:$("apprenticeEquipmentStatus").parentElement.querySelectorAll("input,button,select").length,disabled:$("smithBuy").disabled};})()`);
    assert.equal(upgrade.s.coins,8750);assert.equal(upgrade.s.combatLoadout,"bow");
    assert.equal(upgrade.s.equipment.bow.grade,6);assert.equal(upgrade.s.equipment.bow.quality,"poor");
    assert.equal(upgrade.s.equipment.greatsword.grade,0);
    assert.equal(upgrade.hidden,false);assert.match(upgrade.report,/191,250 coins/);
    assert.match(upgrade.status,/Active/);assert.match(upgrade.next,/Bow/);assert.match(upgrade.cost,/8,750/);
    assert.equal(upgrade.controls,0);assert.equal(upgrade.disabled,true);
    await shot("auto-equipment-"+width);
    await navigate("equipment-repeat-"+width);
    const repeat=await evaluate(`(()=>({s:JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})),hidden:document.getElementById("apprenticeEquipmentReport").hidden}))()`);
    assert.deepEqual(repeat.s.equipment,upgrade.s.equipment);assert.equal(repeat.s.coins,upgrade.s.coins);assert.equal(repeat.hidden,true);
    const failureFixture=await evaluate(`(async()=>{const e=await import("./engine.mjs?v=apprentice-a4");const s=e.newGame(Date.now());s.skills.fighting.level=11;s.coins=1000;return JSON.stringify(s);})()`);
    await navigate("equipment-write-fail-"+width,{[saveKey]:failureFixture,[clockKey]:null},
      "const realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==="+JSON.stringify(saveKey)+")throw new Error('synthetic write failure');return realSet.call(this,k,v);};",true);
    const failReport=await evaluate('document.getElementById("loginReportBody").innerText');
    assert.match(failReport,/Progress could not be saved/);assert.match(failReport,/No upgrades purchased/);
    await evaluate('document.getElementById("loginReportDismiss").click()');
    const failed=await evaluate(`(()=>{const $=id=>document.getElementById(id);return {s:JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})),reportHidden:$("apprenticeEquipmentReport").hidden,notice:$("apprenticeEquipmentStatus").textContent,wallet:$("coinWallet").textContent};})()`);
    assert.equal(failed.s.coins,1000);assert.equal(failed.s.equipment.greatsword.quality,"poor");assert.equal(failed.reportHidden,true);assert.match(failed.notice,/Unavailable/);assert.match(failed.wallet,/1,000 coins/);
    await navigate("equipment-write-recover-"+width,{[saveKey]:failureFixture,[clockKey]:null});
    const recovered=await evaluate(`(()=>({s:JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})),hidden:document.getElementById("apprenticeEquipmentReport").hidden}))()`);
    assert.equal(recovered.s.coins,755);assert.equal(recovered.s.equipment.greatsword.quality,"masterwork");assert.equal(recovered.hidden,false);
    await navigate("equipment-no-lock-"+width,{[saveKey]:failureFixture,[clockKey]:null},"Object.defineProperty(navigator,'locks',{value:undefined});");
    const unavailable=await evaluate(`(()=>({s:JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})),status:document.getElementById("apprenticeEquipmentStatus").textContent,hidden:document.getElementById("apprenticeEquipmentReport").hidden}))()`);
    assert.equal(unavailable.s.coins,755);assert.equal(unavailable.hidden,false);assert.match(unavailable.status,/Active/);
    const analyticsFixture=await evaluate(`(async()=>{const e=await import("./engine.mjs?v=apprentice-a4");const s=e.newGame(Date.now()-3600000);s.skills.fighting.level=11;s.coins=1000;return JSON.stringify(e.chooseActivity(s,"fighting",s.settledAtMs,()=>.5).state);})()`);
    await navigate("analytics-timer-"+width,{[saveKey]:analyticsFixture,[clockKey]:null},"",true);
    const shown=await evaluate(`(()=>({open:document.getElementById("loginReport").open,started:performance.now(),text:document.getElementById("loginReportBody").innerText}))()`);
    assert.ok(shown.open);assert.match(shown.text,/Coin ledger/);assert.match(shown.text,/Equipment expertise/);assert.match(shown.text,/Attributes/);
    await delay(8000);assert.equal(await evaluate('document.getElementById("loginReport").open'),true);
    await until(()=>evaluate('!document.getElementById("loginReport").open'),"10-second auto dismissal");
    const closedAt=await evaluate("performance.now()");assert.ok(closedAt-shown.started>=8000&&closedAt-shown.started<=11500,"timer elapsed "+(closedAt-shown.started));
    console.log(JSON.stringify({width,loginAnalytics:true,autoDismissMs:Math.round(closedAt-shown.started)}));
    const capped=await evaluate(`(async()=>{const e=await import("./engine.mjs?v=cap-001");const start=Date.now()-86400000;
      const s=e.chooseActivity(e.newGame(start),"mining",start,()=>.5).state;return JSON.stringify(e.settle(s,Date.now(),()=>.5).state);})()`);
    await navigate("capped-"+width,{[saveKey]:capped,[clockKey]:null});
    const pause=await evaluate(`(()=>{const key=${JSON.stringify(saveKey)},before=JSON.parse(localStorage.getItem(key));
      document.getElementById("alphaDay").click();const after=JSON.parse(localStorage.getItem(key));
      return {before,after,notice:document.getElementById("skillXp").textContent,reset:document.getElementById("saveResetNotice").hidden};})()`);
    assert.equal(pause.reset,true);assert.ok(pause.before.skills.mining.level>=2);assert.equal(pause.after.skills.mining.level,pause.before.skills.mining.level);assert.equal(pause.after.skills.mining.xp,40*pause.after.skills.mining.level);
    await shot("capped-"+width);
    const veteran=await evaluate(`(async()=>{const e=await import("./engine.mjs?v=apprentice-a2");let s=e.newGame(Date.now());s.skills.fishing.level=51;s.skills.mining.xp=e.xpToNextLevel(1);s.items.stone=12;s.items.log=3;s.coins=44;return JSON.stringify(s);})()`);
    await navigate("master-automatic-"+width,{[saveKey]:veteran,[clockKey]:null});
    const claimed=await evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})),p=document.getElementById("apprenticeMasterReport");return {s,report:p.textContent,hidden:p.hidden,toggle:!!document.getElementById("apprenticeAutoMaster")};})()`);
    assert.equal(claimed.s.skills.mining.level,2);assert.equal(claimed.s.skills.mining.xp,0);assert.equal(claimed.s.items.stone,0);assert.equal(claimed.s.items.log,3);assert.equal(claimed.s.coins,44);assert.equal(claimed.hidden,false);assert.equal(claimed.toggle,false);assert.match(claimed.report,/Mining LvL 2/);assert.match(claimed.report,/12 Stone/i);
    await navigate("master-repeat-"+width);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(saveKey)})).skills.mining.level`),2);
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
          for(const slot of ["head","torso","arms","legs"])s=e.buyEquipment(s,slot+":plate",{grade:0,quality:"poor"},start,()=>.5).state;
          s=e.enterGameWithApprentice(s,start,()=>.5).state;
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
    // Actual public manager route (legacy fixtures above remain independent).
    const managerKey="idle-game-manager-v1";
    const url=origin+"/play/?manager="+width;
    const script=await send("Page.addScriptToEvaluateOnNewDocument",{source:`if(location.href===${JSON.stringify(url)}){localStorage.removeItem(${JSON.stringify(managerKey)});localStorage.removeItem("idle-game-manager-clock-v1");localStorage.removeItem(${JSON.stringify(saveKey)});Date.now=()=>${fixedNow};}`});
    await send("Page.navigate",{url});
    await until(async()=>{const status=await evaluate(`({ready:document.getElementById("saveStatus")?.getAttribute("data-game-ready"),notice:document.getElementById("migrationNotice")?.textContent,status:document.getElementById("saveStatus")?.textContent})`);if(status?.status==="Progress not saved")throw Error(status.notice);if(runtimeErrors.length)throw Error(runtimeErrors.at(-1));return status?.ready==="true";},"manager loaded "+width);
    await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:script.identifier});
    const check=await evaluate(`(()=>({selects:document.querySelectorAll("select").length,counts:["fighterButtons","tacticButtons","raceChoice","mainClassChoice","specialClassChoice"].map(id=>document.getElementById(id).querySelectorAll("button[data-choice]").length),manual:!!document.getElementById("weaponButtons")||!!document.getElementById("armourButtons"),overflow:document.documentElement.scrollWidth-innerWidth,activity:JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)})).activity,arenaOnly:JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)})).arenaOnly,removed:["currentWork","workXP","resourceList","activityLevels"].every(id=>!document.getElementById(id))}))()`);
    assert.equal(check.selects,0);assert.deepEqual(check.counts,[7,3,5,5,2]);assert.equal(check.manual,false);assert.ok(check.overflow<=2);assert.equal(check.activity,"fighting");assert.equal(check.arenaOnly,true);assert.equal(check.removed,true);
    const placement=await evaluate(`(()=>{const grid=document.querySelector(".manager-grid"),arena=grid.querySelector(".arena-card"),rect=arena.getBoundingClientRect();return {first:grid.firstElementChild===arena,full:Math.abs(rect.width-grid.getBoundingClientRect().width)<=2,above:rect.bottom<=document.getElementById("battleGroupPanel").getBoundingClientRect().top};})()`);
    assert.deepEqual(placement,{first:true,full:true,above:true},"arena first and full-width");
    const clan=await evaluate(`(()=>{const p=document.getElementById("alphaClanPanel");p.open=true;const d=document.getElementById("clanDonate"),u=document.getElementById("clanUpgrade"),s=JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)}));return {id:s.alphaClan.id,level:s.alphaClan.academyLevel,bonus:document.getElementById("clanAcademy").textContent,visible:d.checkVisibility()&&u.checkVisibility(),touch:[d,u].every(b=>b.getBoundingClientRect().height>=44),disabled:d.disabled&&u.disabled,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`);
    assert.equal(clan.id,"ashen_covenant");assert.equal(clan.level,1);assert.match(clan.bonus,/\+5% Fighting XP/);assert.ok(clan.visible&&clan.touch&&clan.disabled&&clan.overflow===0);
    await shot("alpha-clan-"+width);await evaluate('document.getElementById("alphaClanPanel").open=false');
    assert.equal(await evaluate('!document.getElementById("battleGroupPanel").open && !document.getElementById("specialClassChoice").checkVisibility()'),true);
    await evaluate('document.querySelector("#battleGroupPanel > summary").click()');
    assert.equal(await evaluate('document.getElementById("battleGroupPanel").open && document.getElementById("specialClassChoice").checkVisibility()'),true);
    assert.equal(await evaluate('document.getElementById("characterStatsPanel")===null && document.querySelectorAll("#selectedClassProgress [data-character-attribute]").length===6'),true,"individual six stats only");
    await evaluate('document.querySelector("#fighterButtons [data-choice=member2]").click();document.querySelector("#raceChoice [data-choice=orc]").click();document.querySelector("#raceChoice [data-choice=human]").click()');
    assert.equal(await evaluate('document.querySelector("#raceChoice [data-choice=human]").getAttribute("aria-pressed")'),"true","race browsing can return to initial race");
    await evaluate('document.querySelector("#raceChoice [data-choice=orc]").click();document.querySelector("#mainClassChoice [data-choice=Raider]").click()');
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)})).battleGroup.member2.selected`),"blademaster","race and main class browsing must not change the active class");
    const guide=await evaluate(`(async()=>{const {GROUP_RACES,groupMainClasses,groupSpecializations}=await import("/play/battle-group-classes.mjs");const {CONTROL_CLASS_KITS:CLASS_KITS}=await import("/play/class-kits.mjs");let count=0;const before=JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)}));for(const race of GROUP_RACES){document.querySelector("#raceChoice [data-choice="+race+"]").click();for(const main of groupMainClasses(race)){document.querySelector("#mainClassChoice [data-choice="+main+"]").click();for(const c of groupSpecializations(race,main)){const b=document.querySelector("[data-class-info="+c.id+"]");if(!b)throw Error("missing info "+c.id);const r=b.getBoundingClientRect();if(r.width<44||r.height<44)throw Error("small info target");b.click();const dialog=document.getElementById("classInfoDialog");if(!dialog.open||document.getElementById("classInfoHeading").textContent!==c.name||!document.getElementById("classInfoEquipment").textContent.includes(c.weaponLabel)||!document.getElementById("classInfoEquipment").textContent.includes(c.armour)||["classInfoAction","classInfoAttributes","classInfoGrowth","classInfoPassiveEffect","classInfoPrimaryEffect","classInfoSecondaryEffect","classInfoStrong","classInfoBest","classInfoWeak","classInfoWorst"].some(id=>!document.getElementById(id).textContent)||document.getElementById("classInfoPassiveName").textContent!==CLASS_KITS[c.id].passive||document.getElementById("classInfoPrimaryName").textContent!==CLASS_KITS[c.id].primary.name||document.getElementById("classInfoSecondaryName").textContent!==CLASS_KITS[c.id].secondary.name||document.getElementById("classInfoPrimaryCooldown").textContent!==CLASS_KITS[c.id].primary.cooldown+" combat rounds"||document.getElementById("classInfoSecondaryCooldown").textContent!==CLASS_KITS[c.id].secondary.cooldown+" combat rounds"||dialog.scrollWidth>dialog.clientWidth+2)throw Error("incorrect class guide "+c.id);document.getElementById("classInfoClose").click();count++;}}}const after=JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)}));return {count,unchanged:JSON.stringify(before.battleGroup)===JSON.stringify(after.battleGroup)&&before.coins===after.coins,overflow:document.documentElement.scrollWidth-innerWidth};})()`);
    assert.equal(guide.count,31);assert.equal(guide.unchanged,true);assert.ok(guide.overflow<=2);
    await evaluate('document.querySelector("#raceChoice [data-choice=orc]").click();document.querySelector("#mainClassChoice [data-choice=Raider]").click();document.querySelector("#specialClassChoice [data-choice=ragebreaker]").click()');
    await until(()=>evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)})).battleGroup.member2.selected==="ragebreaker"`),"manager class");
    await evaluate('document.querySelector("#tacticButtons [data-choice=defensive]").click()');
    await until(()=>evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)}));return s.battleGroup.member2.selected==="ragebreaker"&&s.battleGroup.member2.stance==="defensive"&&s.battleGroup.member1.stance==="balanced";})()`),"manager independent choices");
    await evaluate('document.querySelector("#battleGroupPanel > summary").click()');
    assert.equal(await evaluate('!document.getElementById("battleGroupPanel").open && !document.getElementById("specialClassChoice").checkVisibility()'),true);
    await evaluate(`Date.now=()=>${fixedNow+10000}`);
    await until(()=>evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)})).groupAnalytics.all.outcomes.reduce((a,b)=>a+b,0)===1`),"first ten-second bout committed");
    await evaluate(`Date.now=()=>${fixedNow+20000}`);
    await until(()=>evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)}));if(document.getElementById("saveStatus").textContent==="Progress not saved")throw Error(document.getElementById("migrationNotice").textContent);return s.groupAnalytics.all.outcomes.reduce((a,b)=>a+b,0)===2&&s.arenaOnly&&s.managerWork===undefined&&s.skills.hunting.xp===0&&Object.values(s.items).every(v=>v===0)&&s.skills.fighting.xp>0&&document.querySelectorAll(".battle-fighter").length===14;})()`),"manager combat only");
    const arena=await evaluate(`(()=>({phase:document.getElementById("battleFighters").dataset.phase,percent:document.getElementById("battleCalculation").value,environment:document.getElementById("arenaEnvironment").textContent,bars:document.querySelectorAll(".battle-fighter progress").length,players:document.getElementById("arenaPlayers").children.length,enemies:document.getElementById("arenaEnemies").children.length,icons:document.querySelectorAll(".arena-match svg").length,overflow:document.documentElement.scrollWidth-innerWidth}))()`);
    assert.ok(["calculating","resolved"].includes(arena.phase));assert.ok(arena.percent>=0&&arena.percent<=100);assert.notEqual(arena.environment,"—");assert.equal(arena.bars,0);assert.equal(arena.players,7);assert.equal(arena.enemies,7);assert.ok(arena.icons>=29);assert.ok(arena.overflow<=2);
    await shot("manager-"+width);
    await evaluate('document.getElementById("alphaTools").open=true;document.getElementById("alphaCoins").click()');
    await until(()=>evaluate('document.getElementById("alphaStatus").textContent==="Test credit added."'),"manager test coins");
    await until(()=>evaluate(`(()=>{const s=JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)}));return Object.keys(s.battleGroup.member2.classes.ragebreaker.equipment).length===5;})()`),"manager automatic class armour acquisition");
    await evaluate('document.querySelector("#battleGroupPanel > summary").click()');
    const retained=await evaluate('document.querySelector("#specialClassChoice [data-choice=ragebreaker]").getAttribute("aria-pressed")==="true" && document.querySelector("#raceChoice [data-choice=orc]").getAttribute("aria-pressed")==="true" && document.querySelector("#tacticButtons [data-choice=defensive]").getAttribute("aria-pressed")==="true"');
    assert.equal(retained,true,"selected loadout survives collapse and automation");
    await evaluate('document.querySelector("#battleGroupPanel > summary").click()');
    // Progress remains available and updates while its native disclosure is closed.
    const folded=await evaluate(`(()=>{const p=document.getElementById("progressPanel"),feed=document.getElementById("progressFeed");return {open:p.open,displayed:feed.checkVisibility(),entries:feed.children.length};})()`);
    assert.equal(folded.open,false);assert.equal(folded.displayed,false);assert.ok(folded.entries>0);
    await evaluate('document.querySelector("#progressPanel > summary").click()');
    assert.equal(await evaluate('document.getElementById("progressPanel").open && document.getElementById("progressFeed").checkVisibility()'),true);
    await evaluate('document.getElementById("loginReportReopen").click()');
    assert.equal(await evaluate('document.getElementById("loginReport").open'),true);
    await evaluate('document.getElementById("loginReportDismiss").click()');
    await evaluate('document.querySelector("#progressPanel > summary").click()');
    assert.equal(await evaluate('!document.getElementById("progressPanel").open && !document.getElementById("progressFeed").checkVisibility()'),true);
    assert.ok(await evaluate("document.documentElement.scrollWidth-innerWidth<=2"));
    // Use a valid frozen real bout at 99%, then cross its prize boundary.
    const resultUrl=origin+"/play/?arena-result="+width;
    const setup=await evaluate(`(async()=>{const key=${JSON.stringify(managerKey)},s=JSON.parse(localStorage.getItem(key));
      const m=await import("/play/manager-lanes.mjs"),e=await import("/play/engine.mjs"),t=await import("/play/battle-group-timeline.mjs");
      s.groupAnalytics=(await import("/play/battle-group-analytics.mjs")).blankGroupAnalytics();s.skills.fighting.level=52;s.skills.fighting.xp=0;s.progressMs=0;s.settledAtMs=${fixedNow+20000};
      s.combatSession={...t.startGroupSession(s.battleGroup,e.desiredArenaPlayer(s),s.teamwork.level,73),elapsedMs:t.GROUP_BOUT_MS-100};
      if(!m.readManagerGame(s))throw Error("Invalid fixture");
      const r=t.settleGroupSession(s.combatSession,100);return {save:JSON.stringify(s),outcome:r.victories?"victory":r.defeats?"defeat":"double_death",coins:r.coins};})()`);
    const inject=await send("Page.addScriptToEvaluateOnNewDocument",{source:`if(location.href===${JSON.stringify(resultUrl)}){localStorage.setItem(${JSON.stringify(managerKey)},${JSON.stringify(setup.save)});Date.now=()=>${fixedNow+20000};}`});
    await send("Page.navigate",{url:resultUrl});
    await until(()=>evaluate('document.getElementById("saveStatus")?.getAttribute("data-game-ready")==="true" && document.getElementById("battleCalculation").value===99'),"arena 99% frozen fixture");
    await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:inject.identifier});
    await evaluate(`Date.now=()=>${fixedNow+20100}`);
    await until(()=>evaluate('document.getElementById("battleFighters").dataset.phase==="resolved"'),"arena committed verdict");
    const verdict=await evaluate(`(()=>({outcome:document.getElementById("battleFighters").dataset.outcome,value:document.getElementById("battleCalculation").value,cursor:JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)})).combatSession.prizeCursor,reward:document.getElementById("arenaReward").textContent}))()`);
    assert.equal(verdict.outcome,setup.outcome);assert.equal(verdict.value,100);assert.equal(verdict.cursor,1);if(setup.coins)assert.match(verdict.reward,new RegExp("\\+"+setup.coins));
    await shot("arena-result-"+width);
    // Analytics must count the committed result even while collapsed.
    const analytics=await evaluate(`(()=>{const p=document.getElementById("battleAnalyticsPanel"),a=JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)})).groupAnalytics;return {open:p.open,visible:document.getElementById("battleAnalyticsBody").checkVisibility(),outcomes:a.all.outcomes,coins:a.all.coins};})()`);
    assert.equal(analytics.open,false);assert.equal(analytics.visible,false);assert.equal(analytics.outcomes.reduce((a,b)=>a+b,0),1);assert.equal(analytics.coins,setup.coins);
    await evaluate('document.querySelector("#battleAnalyticsPanel > summary").click()');
    await until(()=>evaluate('document.querySelectorAll("#battleAnalyticsBody .analytics-kpi").length===6'),"analytics metrics");
    assert.ok(await evaluate('document.getElementById("battleAnalyticsBody").textContent.includes("Against enemy classes") && document.documentElement.scrollWidth-innerWidth<=2'));
    await evaluate('document.querySelector("#battleAnalyticsScope [data-choice=latest]").click()');
    assert.ok(await evaluate('document.getElementById("battleAnalyticsBody").textContent.includes("Last fought setup")'));
    await shot("battle-analytics-"+width);
    await evaluate('document.querySelector("#battleAnalyticsPanel > summary").click()');
    assert.equal(await evaluate('!document.getElementById("battleAnalyticsPanel").open'),true);
    await until(()=>evaluate('document.getElementById("battleFighters").dataset.phase==="calculating"'),"arena next bout");
    assert.equal(await evaluate('document.getElementById("battleCalculation").value'),0);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem(${JSON.stringify(managerKey)})).combatSession.prizeCursor`),1);
    await evaluate('document.querySelector("#raidPanel > summary").click()');
    assert.equal(await evaluate('document.querySelectorAll("#raidChoices button[data-raid-level]").length'),5);
    await evaluate('document.getElementById("raidChoices").querySelector("button").click()');
    await until(()=>evaluate('!document.getElementById("raidBattle").hidden && document.querySelectorAll("#raidMinions .raid-fighter").length===6'),"raid encounter rendered");
    assert.ok(await evaluate('document.querySelectorAll("#raidPlayers .raid-fighter").length===7 && document.querySelector("#raidBoss .raid-boss").textContent.includes("Ironjaw") && document.getElementById("battleFighters").hidden && document.documentElement.scrollWidth-innerWidth<=2'));
    await shot("raid-"+width);
    console.log("Manager public route, arena and raid screen passed "+width+"px");

  }
  assert.deepEqual(runtimeErrors,[],"browser runtime errors");
  assert.deepEqual(failures,[],"missing local resources");
  console.log("Real Chromium smoke passed at mobile and desktop widths.");
}finally{
  socket?.close();chrome.kill();
  await new Promise(r=>server.close(r));
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
