import {SAVE_KEY,xpToNextLevel} from "./engine.mjs?v=individual-stats-001";
import {newArenaManager,enableArenaOnly,readArenaManager,enterArena,settleArenaLive,chooseArenaClass,chooseArenaStance} from "./arena-manager.mjs?v=individual-stats-001";
import {createGroupEditor} from "./battle-group-editor.mjs?v=individual-stats-001";
import {renderGroupAnalytics} from "./battle-group-analytics-view.mjs?v=group-006";
import {GROUP_CLASSES} from "./battle-group-classes.mjs?v=group-001";
import {MANAGER_SAVE_KEY,MANAGER_CLOCK_KEY,migrateLegacyManager} from "./manager-migration.mjs?v=individual-stats-001";
import {ITEM_GRADES} from "./smith.mjs?v=gear-a3";
import {createArenaView} from "./arena-view.mjs?v=individual-stats-001";
import {cloneRewardGrade} from "./clone-opponents.mjs?v=npc-parity-001";
import {ALPHA_TOOLS_ENABLED,ALPHA_CLOCK_KEY,alphaTime,parseAlphaClock,setAlphaSpeed,advanceAlphaClock,alphaMaxStats,alphaGrantCoins,ALPHA_DAY_MS} from "./alpha-tools.mjs?v=individual-stats-001";

import {renderGroupProgress} from "./battle-group-progress-view.mjs?v=individual-stats-001";
let analyticsScope="all",lastAnalytics=null,lastAnalyticsScope=null;
const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString("en-GB"),title=s=>s[0].toUpperCase()+s.slice(1);
let state,stored=null,clock=null,lastVisible=false,chain=Promise.resolve(),feed=[],loginLines=[],loginSummary="No return rewards yet.",blocked=false;
const now=()=>alphaTime(clock,Date.now());
const arenaView=createArenaView();
const editor=createGroupEditor((id,c)=>choose((s,t)=>chooseArenaClass(s,id,c.race,c.mainClass,c.id,t)),(id,stance)=>choose((s,t)=>chooseArenaStance(s,id,stance,t)));
const node=(tag,content)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;return n;};
function text(id,value){$(id).textContent=value;}
function meter(id,skill){const p=$(id);p.max=xpToNextLevel(skill.level);p.value=skill.xp;}
function choice(host,entries,value,handler){for(const [id,label] of entries){const b=node("button",label);b.type="button";b.dataset.choice=id;b.setAttribute("aria-pressed",String(value===id));b.addEventListener("click",()=>handler(id));host.append(b);}}
function pressed(host,id){for(const b of host.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.choice===id));}
function renderList(host,rows){host.replaceChildren(...rows.flatMap(([a,b])=>[node("span",a),node("strong",String(b))]));}
function reportLines(out){
 const lines=[],sum={bouts:0,victories:0,defeats:0,doubleDeaths:0,coins:0};
 for(const r of out.reports??[])for(const k of Object.keys(sum))sum[k]+=r?.arena?.[k]??0;
 if(sum.bouts)lines.push(sum.bouts+" battles · "+sum.victories+" wins · "+sum.defeats+" losses · "+sum.doubleDeaths+" draws · +"+fmt(sum.coins)+" coins");
 if(out.levelsGained?.fighting)lines.push("Fighting +"+out.levelsGained.fighting+" level(s)");
 if(out.teamworkLevelGained)lines.push("Teamwork +"+out.teamworkLevelGained+" level(s)");
 const grouped=new Map();
 for(const u of out.autoEquipment?.upgrades??[])grouped.set(u.member+":"+u.classId+":"+u.itemId,u);
 for(const u of grouped.values()){const c=GROUP_CLASSES[u.classId];lines.push(u.member+" · "+c.name+" · "+(u.itemId===c.loadout?c.weaponLabel:u.itemId.replace(":"," "))+" → "+ITEM_GRADES[u.to.grade]+" "+title(u.to.quality));}
 if(out.autoEquipment?.spent)lines.push("Equipment spent "+fmt(out.autoEquipment.spent)+" coins");
 return lines;
}
function publish(out,entry=false,opening=state?.coins??0){
 const lines=reportLines(out);
 if(lines.length){feed=[...lines.reverse(),...feed].slice(0,30);text("latestProgress",feed[0]);$("progressFeed").replaceChildren(...feed.map(x=>node("li",x)));}
 if(entry){loginLines=reportLines(out);loginSummary="Coins: "+fmt(opening)+" → "+fmt(out.state.coins)+". "+(loginLines.length?"Committed progress since last save.":"No new completed rewards.");}
}
function render(){
 if(!state)return;
 text("character-heading",state.name==="Wanderer"?"Your Battle Group":state.name);
 text("coinWallet",fmt(state.coins)+" coins");
 editor.render(state.battleGroup);
 text("arenaStage","Arena difficulty: "+ITEM_GRADES[state.combatSession?.rank?.grade??cloneRewardGrade(state.skills.fighting.level)]);text("fightingLevel","Fighting Lv "+state.skills.fighting.level);meter("fightingXP",state.skills.fighting);
 text("arenaNext", "Automatic matchmaking · Teamwork Lv "+state.teamwork.level);
 $("groupProgressOverview").hidden=false;if($("progressPanel").open)renderGroupProgress($("groupProgressOverview"),state.battleGroup);
 arenaView.render(state);
 if($("battleAnalyticsPanel").open&&(lastAnalytics!==state.groupAnalytics||lastAnalyticsScope!==analyticsScope)){
  renderGroupAnalytics($("battleAnalyticsBody"),state.groupAnalytics,analyticsScope,state.battleAnalytics);lastAnalytics=state.groupAnalytics;lastAnalyticsScope=analyticsScope;
 }
 $("alphaSpeed").setAttribute("aria-pressed",String(clock?.speed===10));
}
function lock(fn){return navigator.locks?.request?navigator.locks.request(MANAGER_SAVE_KEY,fn):Promise.resolve().then(fn);}
function enqueue(fn){chain=chain.then(()=>lock(fn)).catch(err=>{text("saveStatus","Progress not saved");text("migrationNotice",String(err.message??err));$("migrationNotice").hidden=false;lastVisible=false;});return chain;}
function commit(out,entry=false,newClock=clock){
 if(blocked)throw Error("Save cannot be read. Original data retained.");
 const current=localStorage.getItem(MANAGER_SAVE_KEY);
 if(current!==stored){const newer=readArenaManager(current);if(!newer)throw Error("Save changed in another tab");state=newer;arenaView.reset();stored=current;clock=parseAlphaClock(localStorage.getItem(MANAGER_CLOCK_KEY));lastVisible=false;render();return false;}
 const serialized=JSON.stringify(out.state);
 if(!out.state.arenaOnly||!readArenaManager(serialized))throw Error("Candidate save failed validation");
 // One atomic storage write for the state. Clock changes are explicit test
 // controls; normal play never modifies the companion clock.
 if(newClock!==clock){if(newClock)localStorage.setItem(MANAGER_CLOCK_KEY,JSON.stringify(newClock));else localStorage.removeItem(MANAGER_CLOCK_KEY);}
 localStorage.setItem(MANAGER_SAVE_KEY,serialized);stored=serialized;
 const before=state,opening=state?.coins??0;state=out.state;clock=newClock;
 arenaView.committed(before,out,entry);publish(out,entry,opening);render();text("saveStatus","Saved locally");return true;
}
function settleForAction(){return lastVisible&&document.visibilityState!=="hidden"?settleArenaLive(state,now()):enterArena(state,now());}
function choose(action){enqueue(()=>{if(!state||blocked)return;if(!lastVisible){if(!commit(enterArena(state,now()),true))return;}const out=action(state,now());if(commit(out))lastVisible=document.visibilityState!=="hidden";});}
$("progressPanel").addEventListener("toggle",render);
$("battleAnalyticsPanel").addEventListener("toggle",render);
choice($("battleAnalyticsScope"),[["all","All recorded"],["latest","Latest setup"]],"all",id=>{analyticsScope=id;pressed($("battleAnalyticsScope"),id);render();});
$("loginReportReopen").addEventListener("click",()=>{text("loginReportSummary",loginSummary);$("loginReportBody").replaceChildren(...loginLines.map(x=>node("li",x)));$("loginReport").showModal();});
$("loginReportDismiss").addEventListener("click",()=>$("loginReport").close());
$("alphaTools").hidden=!ALPHA_TOOLS_ENABLED;
function alpha(fn,description){enqueue(()=>{if(!state||blocked)return;const base=settleForAction();if(!commit(base))return;const out=fn(state);if(commit(out,Boolean(out.entry),out.clock??clock))text("alphaStatus",description);});}
$("alphaCoins").addEventListener("click",()=>alpha(s=>{const r=alphaGrantCoins(s,s.settledAtMs);return {state:r.state};},"Test credit added."));
$("alphaMaxStats").addEventListener("click",()=>alpha(s=>{return alphaMaxStats(s,"none",s.settledAtMs,Math.random,"none");},"Six-month benchmark applied to selected character attributes and equipment."));
$("alphaDay").addEventListener("click",()=>alpha(s=>{const c=advanceAlphaClock(clock,Date.now(),ALPHA_DAY_MS);return {...enterArena(s,alphaTime(c,Date.now())),clock:c,entry:true};},"24 hours simulated."));
$("alphaSpeed").addEventListener("click",()=>alpha(s=>({state:s,clock:setAlphaSpeed(clock,Date.now(),clock?.speed===10?1:10)}),"Test speed changed."));
$("alphaReset").addEventListener("click",()=>{if(confirm("Reset this manager save?"))enqueue(()=>{stored=localStorage.getItem(MANAGER_SAVE_KEY);blocked=false;feed=[];loginLines=[];editor.reset();arenaView.reset();$("progressFeed").replaceChildren();commit({state:newArenaManager(Date.now())},false,null);});});
function tick(){if(document.visibilityState==="hidden"){lastVisible=false;return;}enqueue(()=>{if(!state||blocked)return;const out=settleForAction();if(commit(out,!lastVisible))lastVisible=true;});}
document.addEventListener("visibilitychange",()=>{lastVisible=false;if(document.visibilityState!=="hidden")tick();});
window.addEventListener("pagehide",()=>{lastVisible=false;});
window.addEventListener("storage",e=>{if(e.key===MANAGER_SAVE_KEY){lastVisible=false;}});
enqueue(()=>{
 stored=localStorage.getItem(MANAGER_SAVE_KEY);clock=parseAlphaClock(localStorage.getItem(MANAGER_CLOCK_KEY));
 if(stored){state=readArenaManager(stored);if(!state){blocked=true;throw Error("Manager save is unreadable; no data has been overwritten.");}}
 else{
  const legacy=localStorage.getItem(SAVE_KEY);
  if(legacy){clock=parseAlphaClock(localStorage.getItem(ALPHA_CLOCK_KEY));const migration=migrateLegacyManager(legacy,0);
   if(migration){state=enableArenaOnly(migration.state);if(clock)localStorage.setItem(MANAGER_CLOCK_KEY,JSON.stringify(clock));text("migrationNotice","Previous combat progress retained. Only fighting remains; old materials are retired.");$("migrationNotice").hidden=false;}
   else{clock=null;state=newArenaManager(Date.now());text("migrationNotice","Old alpha save could not be migrated; original data retained. New manager save started.");$("migrationNotice").hidden=false;}
  }else{clock=null;state=newArenaManager(Date.now());}
 }
 if(stored&&JSON.parse(stored).arenaOnly!==true){commit(enterArena(state,now()),true);text("migrationNotice","Coins, earned stats and combat progress retained. Noncombat activities and materials retired.");$("migrationNotice").hidden=false;}
 else if(!stored||state.settledAtMs<now())commit(enterArena(state,now()),true);else render();
 lastVisible=document.visibilityState!=="hidden";$("saveStatus").setAttribute("data-game-ready","true");text("saveStatus","Saved locally");
});
setInterval(tick,500);
