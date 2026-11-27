// Button-only three-step selection. A race/main-class draft never spends
// coins or changes the active class until the player chooses a specialization.
import {GROUP_IDS} from "./battle-group.mjs?v=group-001";
import {GROUP_CLASSES,GROUP_RACES,RACE_LABELS,groupMainClasses,groupSpecializations} from "./battle-group-classes.mjs?v=group-001";
import {ROLE_ICONS,renderGroupProgress} from "./battle-group-progress-view.mjs?v=group-006";
const RACE_ICONS=Object.freeze({"human":"●","elf":"❋","dark_elf":"☾","orc":"◆","dwarf":"⬢"});
const $=id=>document.getElementById(id),node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
function choices(host,entries,value,onChoice){
 const key=JSON.stringify(entries);
 if(host.dataset.options!==key){
  const focused=document.activeElement?.dataset?.choice;
  const restore=host.contains(document.activeElement);
  host.replaceChildren(...entries.map(([id,label])=>{
   const b=node("button",label);b.type="button";b.dataset.choice=id;return b;
  }));
  host.dataset.options=key;
  if(restore){[...host.children].find(b=>b.dataset.choice===focused)?.focus();}
 }
 for(const b of host.children){b.setAttribute("aria-pressed",String(b.dataset.choice===value));b.onclick=()=>onChoice(b.dataset.choice);}
}
export function createGroupEditor(onClass,onStance){
 let current=null,selected=GROUP_IDS[0],draft=null,lastProgress="";
 const host=$("fighterButtons");
 for(const id of GROUP_IDS){
  const b=node("button");b.type="button";b.dataset.choice=id;
  b.addEventListener("click",()=>{selected=id;draft=null;render(current);});host.append(b);
 }
 const race=$("raceChoice"),main=$("mainClassChoice"),special=$("specialClassChoice");
 for(const stance of ["aggressive","balanced","defensive"]){
  const b=node("button",stance[0].toUpperCase()+stance.slice(1));b.type="button";b.dataset.choice=stance;b.addEventListener("click",()=>onStance(selected,stance));$("tacticButtons").append(b);
 }
 function render(group){
  if(!group)return;current=group;
  for(const b of host.children){const id=b.dataset.choice,m=group[id],c=GROUP_CLASSES[m.selected],p=m.classes[c.id];
   const label=ROLE_ICONS[c.role]+" "+(GROUP_IDS.indexOf(id)+1)+" · "+c.name+" · Lv "+p.mastery.level;
   if(b.textContent!==label)b.textContent=label;b.setAttribute("aria-pressed",String(id===selected));b.title=label;
  }
  const m=group[selected],c=GROUP_CLASSES[m.selected],r=draft?.race??c.race,k=draft?.main??c.mainClass;
  choices(race,GROUP_RACES.map(id=>[id,RACE_ICONS[id]+" "+RACE_LABELS[id]]),r,id=>{
   if(id!==r){draft={race:id,main:groupMainClasses(id)[0]};render(current);}
  });
  choices(main,groupMainClasses(r).map(id=>[id,id]),k,id=>{draft={race:r,main:id};render(current);});
  choices(special,groupSpecializations(r,k).map(x=>[x.id,ROLE_ICONS[x.role]+" "+x.name+" · Lv "+(m.classes[x.id]?.mastery.level??1)]),c.race===r&&c.mainClass===k?c.id:null,id=>{
   const next=GROUP_CLASSES[id];draft=null;if(id===m.selected){render(current);return;}onClass(selected,next);
  });
  const status=draft&&(c.race!==r||c.mainClass!==k)?"Choose a specialization to change class. Active: "+c.name:"Active: "+c.name;
  if($("classChoiceStatus").textContent!==status)$("classChoiceStatus").textContent=status;
  for(const b of $("tacticButtons").children)b.setAttribute("aria-pressed",String(b.dataset.choice===m.stance));
  const key=JSON.stringify([selected,m]);if(key!==lastProgress){renderGroupProgress($("selectedClassProgress"),group,selected);lastProgress=key;}
 }
 return {render,reset(){selected=GROUP_IDS[0];draft=null;lastProgress="";}};
}
