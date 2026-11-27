import {analyticsSummary,analyticsRows,analyticsLabel,strategyLabel} from "./battle-analytics.mjs?v=npc-parity-001";
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const num=n=>n.toLocaleString("en-GB"),pct=n=>n===null?"—":Math.round(n*100)+"%";
export function renderBattleAnalytics(host,data,scope){
 const latest=scope==="latest",stats=latest?data.latest?.stats:data.all;
 host.replaceChildren();
 if(latest&&data.latest)host.append(node("p","Last fought setup: "+strategyLabel(data.latest.key),"quiet"));
 if(!stats||!analyticsSummary(stats).battles){host.append(node("p","No recorded battles yet. Results will appear after completed fights.","quiet"));return;}
 const s=analyticsSummary(stats),cards=node("div",undefined,"analytics-kpis");
 for(const [label,value] of [["Battles",num(s.battles)],["Win rate",pct(s.winRate)],["Wins",num(s.wins)],["Losses",num(s.losses)],["Draws",num(s.draws)],["Coins / arena hour",s.coinsPerHour===null?"—":num(Math.round(s.coinsPerHour))]]){
  const card=node("div",undefined,"analytics-kpi");card.append(node("span",label),node("strong",value));cards.append(card);
 }
 host.append(cards,node("p","Gross arena coins per completed arena hour, including recovery. All reward tiers; includes earlier legacy opponents where recorded. Rival tactics and armour below cover clone-era battles only.","quiet"));
 for(const [dimension,title] of [["zones","By environment"],["weapons","Against enemy weapons"],["teams","Against enemy team combinations"],["tactics","Against rival tactics"],["armours","Against rival armour"]]){
  host.append(node("h3",title));
  const rows=analyticsRows(stats,dimension);
  if(["tactics","armours"].includes(dimension))host.append(node("p",num((stats.cloneOutcomes??[]).reduce((a,b)=>a+b,0))+" clone-era battles recorded; distinct categories may overlap.","quiet"));
  if(!rows.length)host.append(node("p","No recorded matchups yet.","quiet"));
  for(const r of rows){
   const box=node("div",undefined,"analytics-row"),head=node("div",undefined,"line");
   head.append(node("strong",analyticsLabel(r.key,dimension)),node("span",pct(r.winRate)+" wins"));
   const bar=node("div",undefined,"analytics-bar");bar.setAttribute("aria-hidden","true");
   for(const [n,cls] of [[r.wins,"analytics-win"],[r.losses,"analytics-loss"],[r.draws,"analytics-draw"]]){
    const seg=node("span",undefined,cls);seg.style.width=(100*n/r.battles)+"%";bar.append(seg);
   }
   box.append(head,bar,node("p",num(r.battles)+" battles · "+num(r.wins)+" W · "+num(r.losses)+" L · "+num(r.draws)+" D"+(r.battles<20?" · Small sample":""),"quiet"));host.append(box);
  }
  if(dimension==="weapons")host.append(node("p","A fight is counted once for each distinct enemy weapon present; rows can overlap.","quiet"));
 }
}
