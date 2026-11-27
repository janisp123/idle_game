import {GROUP_IDS} from "./battle-group.mjs?v=group-001";
import {GROUP_CLASSES,RACE_LABELS} from "./battle-group-classes.mjs?v=group-001";
import {ARMOUR_SLOTS} from "./armour.mjs?v=bal-002";
import {ITEM_GRADES,equipmentUnlockLevel} from "./smith.mjs?v=gear-a3";
import {tacticRequiredXP} from "./manager-tactics.mjs?v=manager-tactics-001";
export const ROLE_ICONS=Object.freeze({tank:"🛡",melee:"⚔",ranged:"🏹",mage:"✦",healer:"✚",support:"♫",summoner:"◇"});
const title=s=>s[0].toUpperCase()+s.slice(1);
export function groupProgressRows(group){
 return GROUP_IDS.map((id,i)=>{
  const m=group[id],c=GROUP_CLASSES[m.selected],p=m.classes[m.selected],weapon=p.equipment[c.loadout],pieces=ARMOUR_SLOTS.map(s=>({name:s.id,item:p.equipment[s.id+":"+c.armour]??null})),nextGrade=ITEM_GRADES.findIndex((_,g)=>g>weapon.grade&&equipmentUnlockLevel(g)>p.mastery.level);
  return {id,number:i+1,name:c.name,icon:ROLE_ICONS[c.role],race:RACE_LABELS[c.race],level:p.mastery.level,xp:p.mastery.xp,maxXP:tacticRequiredXP(p.mastery.level),stance:m.stance,weapon:c.weaponLabel,weaponItem:weapon,armour:c.armour,pieces,nextGrade:nextGrade<0?null:{name:ITEM_GRADES[nextGrade],level:equipmentUnlockLevel(nextGrade)}};
 });
}
const n=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
const gear=i=>i?ITEM_GRADES[i.grade]+" "+title(i.quality):"Not owned";
export function renderGroupProgress(host,group,selected=null){
 host.replaceChildren(...groupProgressRows(group).filter(r=>selected===null||r.id===selected).map(r=>{
  const d=n("div");d.className="stat-section";const head=n("div");head.className="line";
  head.append(n("strong",r.icon+" "+r.number+" · "+r.name),n("span","Lv "+r.level));const bar=n("progress");bar.max=r.maxXP||1;bar.value=r.maxXP?r.xp:1;bar.setAttribute("aria-label",r.name+" class experience");
  d.append(head,bar,n("p",r.race+" · "+title(r.stance)+" · "+(r.maxXP?Math.floor(100*r.xp/r.maxXP)+"% XP":"Mastered")),n("p",r.weapon+" · "+gear(r.weaponItem)),n("p",title(r.armour)+" · "+r.pieces.map(p=>p.name+": "+gear(p.item)).join(" · ")));
  if(r.nextGrade)d.append(n("p","Next locked grade: "+r.nextGrade.name+" · class Lv "+r.nextGrade.level));
  return d;
 }));
}
