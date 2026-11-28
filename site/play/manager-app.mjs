import {xpToNextLevel} from "./engine.mjs?v=raid-001";
import {newArenaManager,readArenaManager,enterArena,settleArenaLive,chooseArenaClass,chooseArenaStance,startArenaRaid,startArenaTower,chooseArenaPreferences,chooseClanPriority,chooseClanRaid,testClanRaid} from "./arena-manager.mjs?v=raid-001";
import {createGroupEditor} from "./battle-group-editor.mjs?v=individual-stats-001";
import {renderGroupAnalytics} from "./battle-group-analytics-view.mjs?v=group-006";
import {GROUP_CLASSES} from "./battle-group-classes.mjs?v=group-001";
import {MANAGER_SAVE_KEY,MANAGER_CLOCK_KEY,RETIRED_MANAGER_KEYS} from "./manager-migration.mjs?v=individual-stats-001";
import {ITEM_GRADES} from "./smith.mjs?v=gear-a3";
import {createArenaView} from "./arena-view.mjs?v=raid-002";
import {createRaidView} from "./raid-view.mjs?v=raid-002";
import {cloneRewardGrade} from "./clone-opponents.mjs?v=npc-parity-001";
import {ALPHA_TOOLS_ENABLED,alphaTime,parseAlphaClock,setAlphaSpeed,advanceAlphaClock,alphaMaxStats,alphaGrantCoins,ALPHA_DAY_MS} from "./alpha-tools.mjs?v=individual-stats-001";

import {renderGroupProgress} from "./battle-group-progress-view.mjs?v=individual-stats-001";
import {GROUP_ARENAS} from "./arenas.mjs?v=bal-002";
import {preferenceUnlockAt} from "./arena-preferences.mjs";
import {ALPHA_CLAN,CLAN_BUILDINGS,CLAN_CONSTRUCTION,CLAN_STATS,clanBonuses,buildingCost,buildingDuration,clanWeek,clanWeekEnd} from "./alpha-clan.mjs";
let analyticsScope="all",lastAnalytics=null,lastAnalyticsScope=null;
const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString("en-GB"),title=s=>s[0].toUpperCase()+s.slice(1);
let state,stored=null,clock=null,lastVisible=false,chain=Promise.resolve(),feed=[],loginLines=[],loginSummary="No return rewards yet.",blocked=false;
const now=()=>alphaTime(clock,Date.now());
const arenaView=createArenaView();
import {towerProgress,TOWER_ATTEMPT_MS} from "./endless-tower.mjs";
const raidView=createRaidView(level=>choose((s,t)=>startArenaRaid(s,level,t)));
const editor=createGroupEditor((id,c)=>choose((s,t)=>chooseArenaClass(s,id,c.race,c.mainClass,c.id,t)),(id,stance)=>choose((s,t)=>chooseArenaStance(s,id,stance,t)));
const node=(tag,content)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;return n;};
function text(id,value){$(id).textContent=value;}
function meter(id,skill){const p=$(id);p.max=xpToNextLevel(skill.level);p.value=skill.xp;}
function choice(host,entries,value,handler){for(const [id,label] of entries){const b=node("button",label);b.type="button";b.dataset.choice=id;b.setAttribute("aria-pressed",String(value===id));b.addEventListener("click",()=>handler(id));host.append(b);}}
function pressed(host,id){for(const b of host.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.choice===id));}
function renderList(host,rows){host.replaceChildren(...rows.flatMap(([a,b])=>[node("span",a),node("strong",String(b))]));}
function reportLines(out){
 const lines=[];if(out.towerFinished){const r=out.towerFinished;lines.push("Tower floor "+r.floor+" · "+r.outcome+(r.coins?" · +"+fmt(r.coins)+" coins":""));}if(out.clanRaidResult){const r=out.clanRaidResult;lines.push("Clan Raid "+r.level+" · "+r.outcome+" · "+r.groups+" groups ("+r.simulatedAllies+" simulated)");}if(out.raidFinished){const r=out.raidFinished;lines.push("Raid Lv "+r.level+" · "+(r.outcome==="victory"?"Victory · +"+fmt(r.coins)+" coins · blessing awarded or refreshed if eligible":"Defeat"));}const sum={bouts:0,victories:0,defeats:0,doubleDeaths:0,coins:0};
 for(const r of out.reports??[])for(const k of Object.keys(sum))sum[k]+=r?.arena?.[k]??0;
 const clanDonation=(out.reports??[]).reduce((n,r)=>n+(r?.clanDonation??0),0);
 if(sum.bouts)lines.push(sum.bouts+" battles · "+sum.victories+" wins · "+sum.defeats+" losses · "+sum.doubleDeaths+" draws · +"+fmt(sum.coins-clanDonation)+" coins");
 if(clanDonation)lines.push("Clan warehouse +"+fmt(clanDonation)+" coins (automatic contribution)");
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
let preferenceDraft=null,preferenceSavedKey=null;
function renderPreferences(){
 const saved=state.arenaPreferences, key=JSON.stringify(saved??null);
 if(key!==preferenceSavedKey){preferenceDraft=[...(saved?.favorites??[])];preferenceSavedKey=key;}
 const left=Math.max(0,preferenceUnlockAt(saved)-Date.now()),locked=left>0;
 for(const b of $("arenaPreferenceChoices").querySelectorAll("button")){const chosen=preferenceDraft.includes(b.dataset.zone);b.setAttribute("aria-pressed",String(chosen));b.textContent=(chosen?"★ ":"☆ ")+GROUP_ARENAS.find(a=>a.id===b.dataset.zone).name;b.disabled=locked||(!chosen&&preferenceDraft.length===3);}
 $("arenaPreferenceSave").disabled=locked||preferenceDraft.length!==3||JSON.stringify([...preferenceDraft].sort())===JSON.stringify([...(saved?.favorites??[])].sort());
 text("arenaPreferenceStatus",locked?"Locked for "+Math.ceil(left/60000)+" min · 3 saved":preferenceDraft.length+"/3 selected"+(saved?" · change and save":""));
}
for(const arena of GROUP_ARENAS){const b=node("button");b.type="button";b.dataset.zone=arena.id;b.style.minHeight="44px";b.addEventListener("click",()=>{if(!state||Date.now()<preferenceUnlockAt(state.arenaPreferences))return;const i=preferenceDraft.indexOf(arena.id);if(i>=0)preferenceDraft.splice(i,1);else if(preferenceDraft.length<3)preferenceDraft.push(arena.id);renderPreferences();});$("arenaPreferenceChoices").append(b);}
$("arenaPreferenceSave").addEventListener("click",()=>{const selected=[...preferenceDraft];choose((s,t)=>Date.now()<preferenceUnlockAt(s.arenaPreferences)?{state:s,reports:[]}:chooseArenaPreferences(s,selected,t));});
const clanCards={};
for(const [id,b] of Object.entries(CLAN_BUILDINGS)){
 const card=node("section"),heading=node("h3",b.name),description=node("p"),meter=node("progress"),action=node("button");
 card.className="clan-building";description.className="quiet";meter.max=b.max;meter.value=0;meter.setAttribute("aria-label",b.name+" level");card.append(heading,meter,description);
 if(CLAN_CONSTRUCTION.includes(id)){action.type="button";action.textContent="Set priority";action.disabled=true;action.addEventListener("click",()=>choose((s,t)=>chooseClanPriority(s,id,t)));card.append(action);}
 $("clanBuildings").append(card);clanCards[id]={heading,description,meter,action};
}
function renderClan(){
 const c=state.alphaClan;if(!c)return;
 const b=clanBonuses(c),now=Date.now(),w=clanWeek(now),q=c.construction;
 text("clanMembership","Member · 1 local tester · "+b.members+" available member slots");
 text("clanTreasury",fmt(c.treasury)+" coins");text("clanDonated","Your total contributions: "+fmt(c.donated)+" coins");
 text("clanDonationStatus",c.rewardCursor+"/10 rewards · next donation in "+(ALPHA_CLAN.rewardInterval-c.rewardCursor)+" positive coin rewards.");$("clanDonationProgress").value=c.rewardCursor;
 for(const [id,d] of Object.entries(CLAN_BUILDINGS)){
  const level=c.levels[id],card=clanCards[id],max=level===d.max;
  card.heading.textContent=d.name+" · "+level+"/"+d.max;card.meter.value=level;
  const effect=id==="barracks"?b.members+" member slots":id==="bank"?"+"+b.coins+"% arena coins":id==="training"?"+"+b.xp+"% Fighting XP":id==="portal"?level+" raids cleared":"Permanent combat bonuses";
  card.description.textContent=effect+(id==="portal"||max?"": " · Next: "+fmt(buildingCost(id,level+1))+" coins / "+buildingDuration(id,level+1)/86400000+"d");
  if(CLAN_CONSTRUCTION.includes(id)){card.action.disabled=max;card.action.setAttribute("aria-pressed",String(c.priority===id));card.action.textContent=c.priority===id?"Priority selected":"Set priority";}
 }
 text("clanConstruction",q?CLAN_BUILDINGS[q.id].name+" → Lv "+q.level+" · "+Math.max(0,Math.ceil((q.end-now)/3600000))+"h left":"Construction idle · waiting for treasury funds or all buildings complete");
 renderList($("clanBonuses"),CLAN_STATS.map(k=>[title(k)+" (Armoury + Portal)","+"+b.armoury[k]+"% + "+b.portal[k]+"%"]));
 const raid=c.raid;
 text("clanRaidStatus",c.levels.portal===50?"All 50 raids cleared": "Raid "+(c.levels.portal+1)+"/50 · "+(raid.joinedWeek!==null?"Registered · "+Math.max(0,Math.ceil((clanWeekEnd(raid.joinedWeek)-now)/3600000))+"h to cutoff":raid.lastWeek!==null&&raid.lastWeek>=w?"Attempt completed this week":"Registration open")+(raid.lastOutcome?" · Last: "+raid.lastOutcome:""));
 $("clanJoinRaid").disabled=Object.values(state.battleGroup).some(m=>m.recruitment?.active===false)||c.levels.portal===50||raid.joinedWeek!==null||raid.lastWeek!==null&&raid.lastWeek>=w;
 $("alphaClanRaid").disabled=raid.joinedWeek===null;
}
$("clanJoinRaid").addEventListener("click",()=>choose((s,t)=>chooseClanRaid(s,t)));
$("alphaClanRaid").addEventListener("click",()=>{if(ALPHA_TOOLS_ENABLED)alpha(s=>testClanRaid(s,s.settledAtMs),"Registered local clan raid simulated.");});
$("towerAttempt").addEventListener("click",()=>choose((s,t)=>startArenaTower(s,t)));
function renderTower(){const t=towerProgress(state),run=t.run,next=t.highest+1; text("towerHighest","Highest cleared floor: "+t.highest);text("towerNext","Next floor: "+next+" · "+(next<=50?"Raid unlocks every 10 floors":"Endless challenge"));text("towerLast",t.last?"Floor "+t.last.floor+" · "+t.last.outcome+(t.last.coins?" · +"+fmt(t.last.coins)+" coins":""):"No tower attempts yet.");$("towerAttempt").disabled=Boolean(run||state.raidRun);$("towerAttempt").textContent=run?"Fighting floor "+run.floor:"Attempt floor "+next;$("towerFight").hidden=!run;const left=run?Math.max(0,run.startedAtMs+TOWER_ATTEMPT_MS-state.settledAtMs):0;text("towerFightStatus",run?"Tower floor "+run.floor+" · "+Math.ceil(left/1000)+"s remaining":"");$("towerFightProgress").value=run?100*(1-left/TOWER_ATTEMPT_MS):0;}
function render(){
 if(!state)return;
 text("character-heading",state.name==="Wanderer"?"Your Battle Group":state.name);
 text("coinWallet",fmt(state.coins)+" coins");
 editor.render(state.battleGroup);renderPreferences();renderClan();
 text("arenaStage","Arena difficulty: "+ITEM_GRADES[state.combatSession?.rank?.grade??cloneRewardGrade(state.skills.fighting.level)]);text("fightingLevel","Fighting Lv "+state.skills.fighting.level);meter("fightingXP",state.skills.fighting);
 text("arenaNext", "Automatic matchmaking · Teamwork Lv "+state.teamwork.level);
 $("groupProgressOverview").hidden=false;if($("progressPanel").open)renderGroupProgress($("groupProgressOverview"),state.battleGroup);
 if(!state.raidRun&&!towerProgress(state).run)arenaView.render(state);
 raidView.render(state);renderTower();
 $("alphaCoins").disabled=Boolean(state.raidRun||towerProgress(state).run);$("alphaMaxStats").disabled=Boolean(state.raidRun||towerProgress(state).run);
 for(const b of document.querySelectorAll("#raceChoice button[data-choice],#mainClassChoice button[data-choice],#specialClassChoice button[data-choice],#tacticButtons button"))b.disabled=Boolean(state.raidRun||towerProgress(state).run||b.dataset.locked==="true");
 if($("battleAnalyticsPanel").open&&(lastAnalytics!==state.groupAnalytics||lastAnalyticsScope!==analyticsScope)){
  renderGroupAnalytics($("battleAnalyticsBody"),state.groupAnalytics,analyticsScope,state.battleAnalytics);lastAnalytics=state.groupAnalytics;lastAnalyticsScope=analyticsScope;
 }
 $("alphaSpeed").setAttribute("aria-pressed",String(clock?.speed===10));
}
function lock(fn){return navigator.locks?.request?navigator.locks.request(MANAGER_SAVE_KEY,fn):Promise.resolve().then(fn);}
function enqueue(fn){chain=chain.then(()=>lock(fn)).catch(err=>{text("saveStatus","Progress not saved");text("migrationNotice",String(err.message??err));$("migrationNotice").hidden=false;lastVisible=false;});return chain;}
// A single localStorage value is the commit boundary for progress and test time.
// Older v2 saves may have a separate clock; read it only when no embedded clock exists.
function savedClock(raw){
 if(raw===null)return null;
 const value=JSON.parse(raw);
 if(!Object.hasOwn(value,"managerClock"))return parseAlphaClock(localStorage.getItem(MANAGER_CLOCK_KEY));
 if(value.managerClock===null)return null;
 const c=parseAlphaClock(value.managerClock);if(!c)throw Error("Manager clock is unreadable; original save retained.");
 return c;
}
function commit(out,entry=false,newClock=clock){
 if(blocked)throw Error("Save cannot be read. Original data retained.");
 const current=localStorage.getItem(MANAGER_SAVE_KEY);
 if(current!==stored){const newer=readArenaManager(current);if(!newer)throw Error("Save changed in another tab");const nextClock=savedClock(current);state=newer;arenaView.reset();stored=current;clock=nextClock;lastVisible=false;render();return false;}
 const serialized=JSON.stringify({...out.state,managerClock:newClock});
 if(!out.state.arenaOnly||!readArenaManager(serialized))throw Error("Candidate save failed validation");
 if(newClock!==null&&!parseAlphaClock(newClock))throw Error("Candidate clock failed validation");
 // No separate clock write: quota failure leaves both old values intact.
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
$("alphaReset").addEventListener("click",()=>{if(confirm("Reset this manager save?"))enqueue(()=>{stored=localStorage.getItem(MANAGER_SAVE_KEY);blocked=false;feed=[];loginLines=[];editor.reset();arenaView.reset();$("progressFeed").replaceChildren();const t=Date.now();commit(enterArena(newArenaManager(t,true),t),false,null);});});
function tick(){if(document.visibilityState==="hidden"){lastVisible=false;return;}enqueue(()=>{if(!state||blocked)return;const out=settleForAction();if(commit(out,!lastVisible))lastVisible=true;});}
document.addEventListener("visibilitychange",()=>{lastVisible=false;if(document.visibilityState!=="hidden")tick();});
window.addEventListener("pagehide",()=>{lastVisible=false;});
window.addEventListener("storage",e=>{if(e.key===MANAGER_SAVE_KEY){lastVisible=false;}});
enqueue(()=>{
 stored=localStorage.getItem(MANAGER_SAVE_KEY);
 if(stored){state=readArenaManager(stored);if(!state){blocked=true;throw Error("Manager save is unreadable; no data has been overwritten.");}try{clock=savedClock(stored);}catch(error){blocked=true;throw error;}}
 else{clock=null;state=newArenaManager(Date.now(),true);}
 if(!stored||!state.alphaClan||state.settledAtMs<now()){if(!commit(enterArena(state,now()),true))return;}else render();
 // Only remove this game's retired keys after a valid new-epoch save exists.
 for(const key of RETIRED_MANAGER_KEYS)localStorage.removeItem(key);
 lastVisible=document.visibilityState!=="hidden";$("saveStatus").setAttribute("data-game-ready","true");text("saveStatus","Saved locally");
});
setInterval(tick,500);
