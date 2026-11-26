import {loginReport} from "./login-report.mjs?v=apprentice-a5";
import {ACTIVITIES,ITEM_LABELS} from "./engine.mjs?v=apprentice-a4";
import {COMBAT_LOADOUTS} from "./combat-skills.mjs?v=gear-a3";
import {ITEM_GRADES} from "./smith.mjs?v=gear-a3";
const $=id=>document.getElementById(id),num=n=>new Intl.NumberFormat("en-GB",{maximumFractionDigits:2}).format(n);
const title=s=>s[0].toUpperCase()+s.slice(1);
const duration=ms=>{const sec=Math.floor(ms/1000);return sec<60?sec+"s":sec<3600?Math.floor(sec/60)+"m "+sec%60+"s":Math.floor(sec/3600)+"h "+Math.floor(sec%3600/60)+"m";};
const name=id=>COMBAT_LOADOUTS[id]?.name??(id==="none"?"Unarmoured":id.split(":").reverse().map(title).join(" "));
const spec=i=>ITEM_GRADES[i.grade]+" "+title(i.quality);
const activity=id=>ACTIVITIES[id]?.title??"None";
let latest=null,timer=null,deadline=0;
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function table(body,heading,headers,rows,empty){
  const section=node("section",undefined,"login-report-section");section.append(node("h3",heading));
  if(!rows.length)section.append(node("p",empty,"login-report-muted"));
  else{const t=node("table"),head=node("thead"),tr=node("tr");
    for(const h of headers){const cell=node("th",h);cell.scope="col";tr.append(cell);}head.append(tr);t.append(head);
    const tb=node("tbody");for(const row of rows){const r=node("tr");row.forEach((v,i)=>{const c=node(i?"td":"th",String(v));if(!i)c.scope="row";r.append(c);});tb.append(r);}t.append(tb);section.append(t);}
  body.append(section);
}
function paint(r){
  const body=$("loginReportBody");body.replaceChildren();
  $("loginReportElapsed").textContent="Time since last settlement · "+duration(r.elapsedMs);
  const cards=node("div",undefined,"login-report-kpis");
  for(const [label,value,style] of [["Encounters",num(r.arena.bouts),""],["Victories",num(r.arena.victories),"positive"],["Losses",num(r.arena.losses),"negative"],["Win rate",r.arena.winRate===null?"—":num(r.arena.winRate*100)+"%",""],["Coins earned","+"+num(r.wallet.earned),"positive"],["Upgrades",num(r.upgradeCount),""]]){
    const card=node("div",undefined,"login-report-kpi "+style);card.append(node("span",label),node("strong",value));cards.append(card);
  }body.append(cards);
  if(!r.saved)body.append(node("p","Progress could not be saved. The figures below are local, uncommitted results; no automatic purchases or tribute are reported.","login-report-warning"));
  else if(r.automationUnavailable)body.append(node("p","Automatic chores unavailable: safe login coordination or storage is required.","login-report-warning"));
  body.append(node("p","Arena outcomes use the game's settled offline schedule. Defeats: "+num(r.arena.defeats)+" · Double deaths: "+num(r.arena.doubleDeaths)+" · Recovery: "+duration(r.arena.downtimeMs)+" · Difficulty: "+ITEM_GRADES[r.stage]+".","login-report-muted"));
  table(body,"Coin ledger",["Movement","Coins"],[["Opening balance",num(r.wallet.before)],["Arena rewards","+"+num(r.wallet.earned)],["Assistant purchases","−"+num(r.wallet.spent)],["Closing balance",num(r.wallet.after)]],"");
  table(body,"Assistant · equipment",["Equipment","Previous → new","Spent"],r.upgrades.map(x=>[name(x.id),spec(x.from)+" → "+spec(x.to)+" ("+x.steps+")",num(x.cost)]),"No upgrades purchased.");
  table(body,"Skill progression · "+r.levels+" automatic levels",["Activity","Actions / XP gained","Level"],r.skills.map(x=>[activity(x.id),num(x.completed)+" / +"+num(x.xp),x.from===x.to?String(x.to)+(x.ready?" · Ready":""):x.from+" → "+x.to]),"No completed activity or skill advancement.");
  const flow=Object.keys({...r.gained,...r.consumed,...r.tribute}).map(id=>[ITEM_LABELS[id]??id,"+"+num(r.gained[id]??0),"−"+num(r.consumed[id]??0),"−"+num(r.tribute[id]??0)]);
  table(body,"Resources & Master tribute",["Resource","Earned","Used","Tribute"],flow,"No materials earned, used or surrendered.");
  table(body,"Attributes",["Attribute","Value","Training XP"],r.attributes.map(x=>[x.id,x.from===x.to?String(x.to):x.from+" → "+x.to,"+"+num(x.xp)]),"");
  table(body,"Equipment expertise",["Track","Practice gained"],r.expertise.map(x=>[name(x.id),duration(x.hours*3600000)]),"No additional equipment practice.");
  body.append(node("p","Current activity: "+activity(r.transition??r.activity)+". Route: "+r.route.map(activity).join(" → ")+(r.capped.length?". XP ready: "+r.capped.map(activity).join(", ")+".":".") ,"login-report-muted"));
}
function stop(){if(timer!==null){clearInterval(timer);timer=null;}}
function close(){stop();const d=$("loginReport");if(d.open)d.close();}
function open(auto){
  if(!latest)return;const d=$("loginReport");stop();paint(latest);
  $("loginReportBody").scrollTop=0;
  const update=()=>{const remain=Math.max(0,deadline-performance.now());$("loginReportCountdown").textContent=auto?"Auto-close in "+Math.ceil(remain/1000)+"s":"Review mode · close when ready";if(auto&&remain===0)close();};
  deadline=performance.now()+10000;update();
  if(!d.open)d.showModal();$("loginReportDismiss").focus();
  if(auto)timer=setInterval(update,100);
}
export function initLoginReport(){
  $("loginReportDismiss").addEventListener("click",close);
  $("loginReport").addEventListener("close",stop);
  $("loginReport").addEventListener("cancel",e=>{e.preventDefault();close();});
  $("loginReportReopen").addEventListener("click",()=>open(false));
}
export function showLoginReport(before,outcome,options){latest=loginReport(before,outcome,options);$("loginReportReopen").hidden=false;open(true);}
export function clearLoginReport(){close();latest=null;$("loginReportReopen").hidden=true;}
