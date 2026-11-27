// Compact arena view; no strike log, HP bar, reward mutation or scheduler.
import {battlePreviewKey,battlePercentage,buildBattlePreview,committedBattleResult,battleLabels} from "./arena-presentation.mjs?v=group-005";
const NS="http://www.w3.org/2000/svg";
const icons={
 tank:"M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z",melee:"M3 21 21 3M3 3 21 21M3 15l6 6M15 3l6 6",ranged:"M4 3c15 0 17 16 1 18L4 3ZM2 13l19-5",mage:"M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z",healer:"M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z",support:"M9 18V5l12-2v13M9 18c0 4-7 4-7 0s7-4 7 0M21 16c0 4-7 4-7 0s7-4 7 0",summoner:"M12 2l9 10-9 10L3 12Z M12 7v10M7 12h10",
 heart:"M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
 armour:"M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5L12 2Z",
 padded:"M8 3 4 5 2 10l4 2 1-2v11h10V10l1 2 4-2-2-5-4-2-4 3-4-3Zm0 5 8 9M16 8l-8 9",
 leather:"M8 3 4 5 2 10l4 2 1-2v11h10V10l1 2 4-2-2-5-4-2-4 3-4-3Zm4 3v15M7 12h10M7 17h10",
 plate:"M8 3 4 5 2 10l4 2 1-2v11h10V10l1 2 4-2-2-5-4-2-4 3-4-3Zm4 4v12M8 11l4 3 4-3M8 16l4 3 4-3",
 none:"M4 4l16 16M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5L12 2Z",
 sword_shield:"M3 21 16 8l-1-3 6-2-2 6-3-1M5 12l7 7M7 17l-4 4M15 13l6 2v3l-3 4-3-4v-5",
 greatsword:"M3 21 16 8l-1-3 6-3-3 6-3 1M4 11l9 9M6 17l-3 4",
 spear:"M3 21 16 8l-1-4 7-2-2 7-4-1",
 hammer:"M3 21 14 10M11 4l4-3 8 8-4 4-8-9Z",
 bow:"M4 3c15 0 17 16 1 18L4 3Zm0 0 1 18M2 13l19-5m-4-3 4 3-2 4",
 aggressive:"M12 22c-6 0-9-4-7-9 1-3 4-5 4-9 3 2 5 5 5 8 2-1 3-4 3-6 6 6 5 16-5 16Z",
 balanced:"M12 3v18M4 21h16M4 7h16M7 7l-4 8h8L7 7Zm10 0-4 8h8l-4-8Z",
 defensive:"M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5L12 2Zm-4 10 3 3 5-6",
 open_field:"M2 19h20M2 16l5-5 4 3 5-7 6 9M4 5h.1M7 4h.1M18 3h.1",
 narrow_bridge:"M2 20h20M2 14h20M5 14v6M19 14v6M8 14V9l4-5 4 5v5M9 20a3 3 0 0 1 6 0",
 ruined_streets:"M2 21h20M3 21V8l3-2 3 3V3h4v11l3-3 5 2v8M6 12v3M18 16v3",
 walled_courtyard:"M2 21V5h4v4h4V5h4v4h4V5h4v16H2Zm7 0v-5a3 3 0 0 1 6 0v5",
 gatehouse_chamber:"M3 21V3h18v18M7 21v-9a5 5 0 0 1 10 0v9M9 11v10M15 11v10",
 coin:"M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm3-14h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9m3-10v12"
};
const $=id=>document.getElementById(id);
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function icon(id){
 const svg=document.createElementNS(NS,"svg"),p=document.createElementNS(NS,"path");
 svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("fill","none");svg.setAttribute("stroke","currentColor");
 svg.setAttribute("stroke-width","1.7");svg.setAttribute("stroke-linecap","round");svg.setAttribute("stroke-linejoin","round");svg.setAttribute("aria-hidden","true");
 p.setAttribute("d",icons[id]??icons.armour);svg.append(p);return svg;
}
function token(id,label,value){
 const n=node("span");n.className="arena-token";n.title=label;n.setAttribute("aria-label",label);
 n.append(icon(id));if(value!==undefined)n.append(node("span",String(value)));return n;
}
function fighter(f){
 const card=node("div");card.className="battle-fighter";
 const head=node("div");head.className="arena-fighter-icons";head.append(token(f.className?f.role:f.weapon,f.className??f.weaponName));
 if(f.className){card.classList.add("group-fighter");if(f.tactic)head.append(token(f.tactic,f.tactic));const label=node("span",f.className+" · "+f.classLevel);label.className="group-class-label";card.append(node("strong",String(f.number)),head,label);return card;}
 if(f.family)head.append(token(f.family,f.armourName+" armour"));
 if(f.tactic)head.append(token(f.tactic,f.tactic[0].toUpperCase()+f.tactic.slice(1)+" tactic"));
 const row=node("div");row.className="arena-fighter-stats";
 row.append(token("heart","Health "+f.hp,f.hp),token("armour","Armour "+f.armour,f.armour));
 card.append(node("strong",["I","II"][f.number-1]),head,row);return card;
}
export function createArenaView(){
 let preview=null,shownKey="",reveal=null,last=null;
 const show=(p)=>{
  const key=p?.key??"";
  if(shownKey===key)return;shownKey=key;
  $("arenaPlayers").replaceChildren(...(p?.players??[]).map(fighter));
  $("arenaEnemies").replaceChildren(...(p?.enemies??[]).map(fighter));
  $("arenaEnvironmentIcon").replaceChildren(...(p?[icon(p.environment.id)]:[]));
  $("arenaEnvironment").textContent=p?.environment.name??"—";
 };
 return {
  committed(before,out,entry=false){
   const old=before?.combatSession;
   const prior=old?(preview?.key===battlePreviewKey(old)?preview:buildBattlePreview(old)):null;
   const r=committedBattleResult(before,out,prior);
   if(!r)return;
   last=r;
   reveal=!entry&&r.preview?{r,until:performance.now()+(old?.timelineVersion===5?1000:2000)}:null;
   const label=r.outcome?battleLabels[r.outcome]:r.victories+" W · "+r.defeats+" L · "+r.doubleDeaths+" D";
   $("battleResult").textContent="Last: "+label+(r.coins?" · +"+r.coins+" coins":"");
  },
  render(state){
   const s=state.combatSession,key=battlePreviewKey(s);
   if(key!==(preview?.key??""))preview=buildBattlePreview(s);
   const finished=reveal&&performance.now()<reveal.until?reveal.r:null;
   const p=finished?.preview??preview;show(p);
   const percent=finished?100:battlePercentage(s),phase=finished?"resolved":p?"calculating":"preparing";
   $("battleFighters").dataset.phase=phase;
   $("battleFighters").dataset.outcome=finished?.outcome??"";
   $("battleCalculation").value=percent;$("battlePercent").textContent=percent+"%";
   const status=finished?battleLabels[finished.outcome]:p?"Calculating result…":"Preparing";
   if($("battleEvent").textContent!==status)$("battleEvent").textContent=status;
   const reward=$("arenaReward");reward.hidden=!finished?.coins;
   if(finished?.coins)reward.replaceChildren(token("coin","Coins earned "+finished.coins,"+"+finished.coins));
  },
  reset(){preview=null;shownKey="!";reveal=null;last=null;$("battleResult").textContent="No completed battles yet.";}
 };
}
