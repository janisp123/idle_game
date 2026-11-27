// Three-step selection. Race/main-class changes are drafts until a specialization
// is explicitly selected. No equipment controls, no accidental paid purchases.
import {GROUP_IDS} from "./battle-group.mjs?v=group-001";
import {GROUP_CLASSES,GROUP_RACES,RACE_LABELS,groupMainClasses,groupSpecializations} from "./battle-group-classes.mjs?v=group-001";
import {groupProgressRows,ROLE_ICONS,renderGroupProgress} from "./battle-group-progress-view.mjs?v=group-006";
const $=id=>document.getElementById(id),node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
function options(select,entries,value){
 const key=JSON.stringify(entries);
 if(select.dataset.options!==key){select.replaceChildren(...entries.map(([id,name])=>{const o=node("option",name);o.value=id;return o;}));select.dataset.options=key;}
 select.value=value;
}
export function createGroupEditor(onClass,onStance){
 let current=null,selected=GROUP_IDS[0],draft=null,lastProgress="";
 const host=$("fighterButtons");
 for(const [i,id] of GROUP_IDS.entries()){
  const b=node("button");b.type="button";b.dataset.choice=id;
  b.addEventListener("click",()=>{selected=id;draft=null;render(current);});host.append(b);
 }
 const race=$("raceChoice"),main=$("mainClassChoice"),special=$("specialClassChoice");
 race.addEventListener("change",()=>{draft={race:race.value,main:groupMainClasses(race.value)[0]};render(current);});
 main.addEventListener("change",()=>{draft={race:race.value,main:main.value};render(current);});
 special.addEventListener("change",()=>{if(!special.value)return;const c=GROUP_CLASSES[special.value];draft=null;onClass(selected,c);});
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
  options(race,GROUP_RACES.map(id=>[id,RACE_LABELS[id]]),r);
  options(main,groupMainClasses(r).map(id=>[id,id]),k);
  options(special,[["","Choose specialization…"],...groupSpecializations(r,k).map(x=>[x.id,x.name+" · "+(m.classes[x.id]?.mastery.level??1)])],c.race===r&&c.mainClass===k?c.id:"");
  for(const b of $("tacticButtons").children)b.setAttribute("aria-pressed",String(b.dataset.choice===m.stance));
  const key=JSON.stringify([selected,m]);if(key!==lastProgress){renderGroupProgress($("selectedClassProgress"),group,selected);lastProgress=key;}
 }
 return {render,reset(){selected=GROUP_IDS[0];draft=null;lastProgress="";}};
}
