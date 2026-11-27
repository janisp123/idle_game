import {GROUP_CLASSES,RACE_LABELS} from "./battle-group-classes.mjs?v=group-001";
import {ARENAS} from "./arenas.mjs?v=bal-002";
import {renderBattleAnalytics} from "./analytics-view.mjs?v=npc-parity-001";
const n=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const total=r=>r.reduce((a,b)=>a+b,0),num=x=>x.toLocaleString("en-GB"),title=s=>s[0].toUpperCase()+s.slice(1);
const label=(dim,k)=>dim==="classes"?GROUP_CLASSES[k].name:dim==="races"?RACE_LABELS[k]:dim==="zones"?ARENAS.find(a=>a.id===k).name:title(k);
export function renderGroupAnalytics(host,data,scope,legacy){
 host.replaceChildren();
 const s=scope==="latest"?data.latest?.stats:data.all;
 if(scope==="latest"&&data.latest)host.append(n("p","Last fought setup: "+data.latest.key.split("|").map(x=>GROUP_CLASSES[x.split(":")[0]].name+" ("+x.split(":")[1]+")").join(", "),"quiet"));
 if(s&&total(s.outcomes)){
  const count=total(s.outcomes),cards=n("div",undefined,"analytics-kpis");
  for(const [key,value] of [["Battles",num(count)],["Win rate",Math.round(100*s.outcomes[0]/count)+"%"],["Wins",num(s.outcomes[0])],["Losses",num(s.outcomes[1])],["Draws",num(s.outcomes[2])],["Coins / arena hour",s.ms?num(Math.round(s.coins*3600000/s.ms)):"—"]]){
   const card=n("div",undefined,"analytics-kpi");card.append(n("span",key),n("strong",value));cards.append(card);
  }
  host.append(cards,n("p","Recorded completed fights across arena difficulties. Opponent categories may overlap; each distinct class, race, role or stance counts once per battle.","quiet"));
  for(const [dim,heading] of [["zones","By environment"],["classes","Against enemy classes"],["races","Against enemy races"],["roles","Against enemy roles"],["stances","Against enemy stances"]]){
   const details=n("details");details.open=dim==="zones";details.append(n("summary",heading));
   for(const [key,r] of Object.entries(s[dim]).sort((a,b)=>total(b[1])-total(a[1])||a[0].localeCompare(b[0]))){
    const count=total(r);if(!count)continue;
    const box=n("div",undefined,"analytics-row"),head=n("div",undefined,"line"),bar=n("div",undefined,"analytics-bar");
    head.append(n("strong",label(dim,key)),n("span",Math.round(100*r[0]/count)+"% wins"));
    bar.setAttribute("aria-hidden","true");for(const [i,cls] of ["analytics-win","analytics-loss","analytics-draw"].entries()){const seg=n("span",undefined,cls);seg.style.width=100*r[i]/count+"%";bar.append(seg);}
    box.append(head,bar,n("p",num(count)+" battles · "+r.join(" / ")+" W / L / D"+(count<20?" · Small sample":""),"quiet"));details.append(box);
   }
   host.append(details);
  }
 }else host.append(n("p","No recorded Battle Group battles yet.","quiet"));
 if(scope==="all"&&legacy&&total(legacy.all.outcomes)){
  const d=n("details"),body=n("div");d.append(n("summary","Previous two-character battle history"),body);renderBattleAnalytics(body,legacy,"all");host.append(d);
 }
}
