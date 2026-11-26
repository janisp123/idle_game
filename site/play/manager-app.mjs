import {ACTIVITIES,ITEM_LABELS,ITEM_KEYS,SAVE_KEY,xpToNextLevel,desiredArenaTeam,teamFromState,enterGame} from "./engine.mjs?v=manager-lanes-001";
import {newManagerGame,readManagerGame,enterManagerGame,settleManagerLive,chooseManagerArmour,chooseManagerWeapon,chooseManagerTactic} from "./manager-lanes.mjs?v=manager-ui-001";
import {MANAGER_SAVE_KEY,MANAGER_CLOCK_KEY,migrateLegacyManager} from "./manager-migration.mjs?v=manager-ui-001";
import {MANAGER_ARMOUR_FAMILIES,equippedArmourFamily,quoteArmourSet,managerEquipmentPreview} from "./manager-equipment.mjs?v=manager-gear-001";
import {TACTIC_IDS,tacticRequiredXP} from "./manager-tactics.mjs?v=manager-tactics-001";
import {WORK_ROTATION,nextRotationActivity,ingredientReserve} from "./activity-rotation.mjs?v=manager-rotation-001";
import {COMBAT_LOADOUTS} from "./combat-skills.mjs?v=gear-a3";
import {ITEM_GRADES} from "./smith.mjs?v=gear-a3";
import {teamCombatAtTime} from "./team-timeline.mjs?v=manager-tactics-001";
import {requiredAutoFightWins} from "./auto-fight.mjs?v=auto-fight-03";
import {characterStats} from "./character-stats.mjs?v=apprentice-a4";
import {ALPHA_TOOLS_ENABLED,ALPHA_CLOCK_KEY,alphaTime,parseAlphaClock,setAlphaSpeed,advanceAlphaClock,alphaMaxStats,alphaGrantCoins,ALPHA_DAY_MS} from "./alpha-tools.mjs?v=team-004";

const $=id=>document.getElementById(id),fmt=n=>Number(n).toLocaleString("en-GB"),title=s=>s[0].toUpperCase()+s.slice(1),label=id=>ITEM_LABELS[id]??id;
const descriptions={aggressive:"Presses forward and focuses vulnerable enemies.",balanced:"Uses opportunities and normal protection.",defensive:"Protects allies and keeps distance where possible."};
let state,stored=null,clock=null,selected="first",lastVisible=false,chain=Promise.resolve(),feed=[],loginLines=[],loginSummary="No return rewards yet.",battleKey="",lastBattle=null,blocked=false;
const now=()=>alphaTime(clock,Date.now());
const node=(tag,content)=>{const n=document.createElement(tag);if(content!==undefined)n.textContent=content;return n;};
function text(id,value){$(id).textContent=value;}
function meter(id,skill){const p=$(id);p.max=xpToNextLevel(skill.level);p.value=skill.xp;}
function choice(host,entries,value,handler){for(const [id,label] of entries){const b=node("button",label);b.type="button";b.dataset.choice=id;b.setAttribute("aria-pressed",String(value===id));b.addEventListener("click",()=>handler(id));host.append(b);}}
function pressed(host,id){for(const b of host.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.choice===id));}
function renderList(host,rows){host.replaceChildren(...rows.flatMap(([a,b])=>[node("span",a),node("strong",String(b))]));}
function reportLines(out){
 const lines=[],sum={bouts:0,victories:0,defeats:0,doubleDeaths:0,coins:0},items={},consumed={};
 for(const r of out.reports??[]){if(!r)continue;for(const k of Object.keys(sum))sum[k]+=r.arena?.[k]??0;
   for(const [k,n] of Object.entries(r.items??{}))items[k]=(items[k]??0)+n;
   for(const [k,n] of Object.entries(r.consumed??{}))consumed[k]=(consumed[k]??0)+n;}
 if(sum.bouts)lines.push(sum.bouts+" battles · "+sum.victories+" wins · "+sum.defeats+" losses · "+sum.doubleDeaths+" draws · +"+fmt(sum.coins)+" coins");
 for(const [id,n] of Object.entries(out.levelsGained??{}))lines.push(ACTIVITIES[id].title+" +"+n+" level"+(n===1?"":"s"));
 if(out.teamworkLevelGained)lines.push("Teamwork +"+out.teamworkLevelGained+" level(s)");
 for(const a of out.tacticAdvances??[])lines.push("Gladiator "+(a.fighterId==="first"?1:2)+" · "+title(a.tactic)+" Lv "+a.level);
 if(Object.keys(items).length)lines.push("Gathered / crafted: "+Object.entries(items).map(([k,n])=>label(k)+" +"+fmt(n)).join(", "));
 if(Object.keys(consumed).length)lines.push("Used: "+Object.entries(consumed).map(([k,n])=>label(k)+" −"+fmt(n)).join(", "));
 if(Object.keys(out.mastery?.tribute??{}).length)lines.push("Master tribute: "+Object.entries(out.mastery.tribute).map(([k,n])=>label(k)+" −"+fmt(n)).join(", "));
 for(const a of out.autoEquipment?.equipped??[])lines.push("Gladiator "+(a.fighterId==="first"?1:2)+" equipped "+title(a.family)+" set · "+fmt(a.cost)+" coins");
 const upgrades=out.autoEquipment?.upgrades??[];
 if(upgrades.length){const grouped=new Map();for(const u of upgrades)grouped.set(u.fighterId+":"+u.id,u);
  for(const u of grouped.values())lines.push("Gladiator "+(u.fighterId==="first"?1:2)+" · "+(COMBAT_LOADOUTS[u.id]?.name??u.id.replace(":"," "))+" → "+ITEM_GRADES[u.to.grade]+" "+title(u.to.quality));}
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
 text("character-heading",state.name==="Wanderer"?"Your gladiators":state.name);
 text("coinWallet",fmt(state.coins)+" coins");
 const team=teamFromState(state),g=team[selected],t=state.managerTactics[selected],family=equippedArmourFamily(g),pending=state.armourRequests[selected];
 pressed($("fighterButtons"),selected);pressed($("weaponButtons"),g.combatLoadout);pressed($("armourButtons"),pending??family);pressed($("tacticButtons"),t.selected);
 text("teamLoadouts",["first","second"].map((id,i)=>"G"+(i+1)+" · "+COMBAT_LOADOUTS[team[id].combatLoadout].name+" / "+title(equippedArmourFamily(team[id])??"mixed")).join("  |  "));
 const q=pending?quoteArmourSet(state,selected,pending):null;
 text("armourStatus",q?"Saving for "+title(pending)+" · "+fmt(q.cost)+" coins needed in total. Current: "+title(family??"mixed")+".":family==="none"?"No armour equipped. Choose a set.":family===null?"Legacy mixed armour retained until you choose a complete set.":title(family)+" set equipped.");
 const sk=t.skills[t.selected];text("tacticStatus",descriptions[t.selected]+" · Lv "+sk.level+(sk.level===50?" · Mastered":" · "+fmt(Math.floor(sk.xp/tacticRequiredXP(sk.level)*100))+"%"));
 text("arenaStage",ITEM_GRADES[state.difficulties.fighting??0]);text("fightingLevel","Fighting Lv "+state.skills.fighting.level);meter("fightingXP",state.skills.fighting);
 const af=state.autoFight;let required=requiredAutoFightWins(af.stage);text("arenaNext",required?"Next difficulty: "+af.streak+" / "+required+" wins · Teamwork Lv "+state.teamwork.level:"Teamwork Lv "+state.teamwork.level);
 if(state.combatSession){const s=state.combatSession,key=JSON.stringify([s.seed,s.elapsedMs,s.players,s.teamworkLevel]);
   if(key!==battleKey){battleKey=key;lastBattle=teamCombatAtTime(s);}
   const ev=lastBattle.event,names={"player:0":"Gladiator I","player:1":"Gladiator II","enemy:0":"Opponent I","enemy:1":"Opponent II"};
   text("battleEvent","Battle "+lastBattle.bout+" · "+ev.type.replaceAll("_"," ")+(ev.actor?" · "+names[ev.actor]:"")+(ev.target?" → "+names[ev.target]:"")+(ev.damage?" · "+ev.damage+" damage":""));
   const roster=[...Object.values(s.players),...lastBattle.enemies];
   $("battleFighters").replaceChildren(...Object.entries(names).map(([id,name],i)=>{const v=ev.vitals[id],card=node("div");card.className="battle-fighter"+(i>=2?" enemy":"");const p=node("progress");p.max=v.maxHP;p.value=v.hp;p.setAttribute("aria-label",name+" health");card.append(node("strong",name),node("small",COMBAT_LOADOUTS[roster[i].loadout].name),p,node("small","HP "+v.hp+"/"+v.maxHP+" · Armour "+v.armour+"/"+v.maxArmour));return card;}));
 }else{$("battleFighters").replaceChildren();text("battleEvent","Preparing the arena");}
 const w=state.managerWork,id=w.activity,skill=state.skills[id];text("currentWork",ACTIVITIES[id].title);text("workLevel","Lv "+skill.level);meter("workXP",skill);
 text("workStatus",w.travelMs?"Travelling and preparing · Fighting continues.":"Working automatically until the next level.");
 const after=nextRotationActivity(state,id);text("nextWork","Next: "+(after?ACTIVITIES[after].title:"Waiting for materials"));
 renderList($("activityLevels"),WORK_ROTATION.map(id=>[ACTIVITIES[id].title,"Lv "+state.skills[id].level]));
 const reserve=ingredientReserve(state);renderList($("resourceList"),ITEM_KEYS.filter(k=>state.items[k]>0).map(k=>[label(k),fmt(state.items[k])+(reserve[k]?" · "+fmt(reserve[k])+" reserved":"")]));
 if($("characterStatsPanel").open){const stats=characterStats({...state,...g}),host=$("characterStats");host.replaceChildren(...stats.sections.map(s=>{const d=node("details");d.className="stat-section";d.append(node("summary",s.title+" · "+s.total));const list=node("div");list.className="skill-list";renderList(list,s.rows.map(r=>[r.label,r.value]));d.append(list);return d;}));}
 $("alphaSpeed").setAttribute("aria-pressed",String(clock?.speed===10));
}
function lock(fn){return navigator.locks?.request?navigator.locks.request(MANAGER_SAVE_KEY,fn):Promise.resolve().then(fn);}
function enqueue(fn){chain=chain.then(()=>lock(fn)).catch(err=>{text("saveStatus","Progress not saved");text("migrationNotice",String(err.message??err));$("migrationNotice").hidden=false;lastVisible=false;});return chain;}
function commit(out,entry=false,newClock=clock){
 if(blocked)throw Error("Save cannot be read. Original data retained.");
 const current=localStorage.getItem(MANAGER_SAVE_KEY);
 if(current!==stored){const newer=readManagerGame(current);if(!newer)throw Error("Save changed in another tab");state=newer;stored=current;clock=parseAlphaClock(localStorage.getItem(MANAGER_CLOCK_KEY));lastVisible=false;render();return false;}
 const serialized=JSON.stringify(out.state);
 if(!readManagerGame(serialized))throw Error("Candidate save failed validation");
 // One atomic storage write for the state. Clock changes are explicit test
 // controls; normal play never modifies the companion clock.
 if(newClock!==clock){if(newClock)localStorage.setItem(MANAGER_CLOCK_KEY,JSON.stringify(newClock));else localStorage.removeItem(MANAGER_CLOCK_KEY);}
 localStorage.setItem(MANAGER_SAVE_KEY,serialized);stored=serialized;
 const opening=state?.coins??0;state=out.state;clock=newClock;
 publish(out,entry,opening);render();text("saveStatus","Saved locally");return true;
}
function settleForAction(){return lastVisible&&document.visibilityState!=="hidden"?settleManagerLive(state,now()):enterManagerGame(state,now());}
function choose(action){enqueue(()=>{if(!state||blocked)return;const out=action(state,now());commit(out);lastVisible=document.visibilityState!=="hidden";});}
choice($("fighterButtons"),[["first","Gladiator I"],["second","Gladiator II"]],"first",id=>{selected=id;render();});
choice($("weaponButtons"),Object.entries(COMBAT_LOADOUTS).map(([id,w])=>[id,w.name]),"greatsword",id=>choose((s,t)=>chooseManagerWeapon(s,selected,id,t)));
choice($("armourButtons"),MANAGER_ARMOUR_FAMILIES.map(id=>[id,title(id)]),null,id=>choose((s,t)=>chooseManagerArmour(s,selected,id,t)));
choice($("tacticButtons"),TACTIC_IDS.map(id=>[id,title(id)]),"balanced",id=>choose((s,t)=>chooseManagerTactic(s,selected,id,t)));
$("characterStatsPanel").addEventListener("toggle",render);
$("loginReportReopen").addEventListener("click",()=>{text("loginReportSummary",loginSummary);$("loginReportBody").replaceChildren(...loginLines.map(x=>node("li",x)));$("loginReport").showModal();});
$("loginReportDismiss").addEventListener("click",()=>$("loginReport").close());
$("alphaTools").hidden=!ALPHA_TOOLS_ENABLED;
function alpha(fn,description){enqueue(()=>{if(!state||blocked)return;const base=settleForAction();if(!commit(base))return;const out=fn(state);if(commit(out,Boolean(out.entry),out.clock??clock))text("alphaStatus",description);});}
$("alphaCoins").addEventListener("click",()=>alpha(s=>{const r=alphaGrantCoins(s,s.settledAtMs);return {state:r.state};},"Test credit added."));
$("alphaMaxStats").addEventListener("click",()=>alpha(s=>{const team=teamFromState(s),a=equippedArmourFamily(team.first)??"none",b=equippedArmourFamily(team.second)??"none";return alphaMaxStats(s,a,s.settledAtMs,Math.random,b);},"Six-month benchmark applied to selected equipment."));
$("alphaDay").addEventListener("click",()=>alpha(s=>{const c=advanceAlphaClock(clock,Date.now(),ALPHA_DAY_MS);return {...enterManagerGame(s,alphaTime(c,Date.now())),clock:c,entry:true};},"24 hours simulated."));
$("alphaSpeed").addEventListener("click",()=>alpha(s=>({state:s,clock:setAlphaSpeed(clock,Date.now(),clock?.speed===10?1:10)}),"Test speed changed."));
$("alphaReset").addEventListener("click",()=>{if(confirm("Reset this manager save?"))enqueue(()=>{stored=localStorage.getItem(MANAGER_SAVE_KEY);blocked=false;feed=[];loginLines=[];$("progressFeed").replaceChildren();commit({state:newManagerGame(Date.now())},false,null);});});
function tick(){if(document.visibilityState==="hidden"){lastVisible=false;return;}enqueue(()=>{if(!state||blocked)return;const out=settleForAction();if(commit(out,!lastVisible))lastVisible=true;});}
document.addEventListener("visibilitychange",()=>{lastVisible=false;if(document.visibilityState!=="hidden")tick();});
window.addEventListener("pagehide",()=>{lastVisible=false;});
window.addEventListener("storage",e=>{if(e.key===MANAGER_SAVE_KEY){lastVisible=false;}});
enqueue(()=>{
 stored=localStorage.getItem(MANAGER_SAVE_KEY);clock=parseAlphaClock(localStorage.getItem(MANAGER_CLOCK_KEY));
 if(stored){state=readManagerGame(stored);if(!state){blocked=true;throw Error("Manager save is unreadable; no data has been overwritten.");}}
 else{
  const legacy=localStorage.getItem(SAVE_KEY);
  if(legacy){clock=parseAlphaClock(localStorage.getItem(ALPHA_CLOCK_KEY));const migration=migrateLegacyManager(legacy,now());
   if(migration){state=migration.state;const entered=enterManagerGame(state,state.settledAtMs);entered.reports=[...migration.reports,...(entered.reports??[])];commit(entered,true);if(clock)localStorage.setItem(MANAGER_CLOCK_KEY,JSON.stringify(clock));text("migrationNotice","Previous progress preserved. Manual route replaced by automatic work; original save retained.");$("migrationNotice").hidden=false;}
   else{clock=null;state=newManagerGame(Date.now());text("migrationNotice","Old alpha save could not be migrated; original data retained. New manager save started.");$("migrationNotice").hidden=false;}
  }else{clock=null;state=newManagerGame(Date.now());}
 }
 if(!stored||state.settledAtMs<now())commit(enterManagerGame(state,now()),true);else render();
 lastVisible=document.visibilityState!=="hidden";$("saveStatus").setAttribute("data-game-ready","true");text("saveStatus","Saved locally");
});
setInterval(tick,500);
