// TEAM-003: display only resolved team events, never future damage.
import {COMBAT_LOADOUTS} from "./combat-skills.mjs?v=glad-002";
import {teamworkRequiredXP} from "./teamwork.mjs?v=team-002";
const labels={"player:0":"Gladiator 1","player:1":"Gladiator 2","enemy:0":"Opponent 1","enemy:1":"Opponent 2"};
export function teamBattleView(combat,session){
  const event=combat.event,players=Object.values(session.players),fighters=[...players,...combat.enemies];
  const ids=Object.keys(labels);
  return {title:"TEAM BATTLE "+combat.bout+" · "+event.type.replaceAll("_"," "),
    detail:[event.actor?labels[event.actor]:null,event.target?"→ "+labels[event.target]:null,event.damage?event.damage+" HP damage":null].filter(Boolean).join(" "),
    fighters:ids.map((id,i)=>({id,name:labels[id],weaponName:COMBAT_LOADOUTS[fighters[i].loadout].name,...event.vitals[id]}))};
}
export function renderTeamBattle(host,combat,session){
  host.hidden=!combat;
  if(!combat)return;
  const view=teamBattleView(combat,session);
  const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  const grid=el("div");grid.className="team-vitals";
  for(const f of view.fighters){
    const card=el("section");card.className="team-fighter";card.setAttribute("data-fighter",f.id);
    const hp=el("progress");hp.max=f.maxHP;hp.value=f.hp;hp.setAttribute("aria-label",f.name+" health");
    card.append(el("strong",f.name+" · "+f.weaponName),el("small","HP "+f.hp+"/"+f.maxHP),hp,
      el("small","Weapon "+f.weapon+"/"+f.weaponMax+" · Armour "+f.armour+"/"+f.maxArmour+
      (f.shieldMax?" · Shield "+f.shield+"/"+f.shieldMax:"")+(f.arrows?" · Arrows "+f.arrows:"")));
    grid.append(card);
  }
  host.replaceChildren(el("p",view.detail||"Automatic team combat"),grid);
}
export function teamworkText(t){
  const max=teamworkRequiredXP(t.level);
  return "Teamwork Lv "+t.level+" · "+(max===0?"Mastered":t.xp===max?"Ready on next login":t.xp+" / "+max+" XP");
}
