// Button-only three-step selection. A race/main-class draft never spends
// coins or changes the active class until the player chooses a specialization.
import {GROUP_IDS} from "./battle-group.mjs?v=individual-stats-001";
import {GROUP_CLASSES,GROUP_RACES,RACE_LABELS,groupMainClasses,groupSpecializations} from "./battle-group-classes.mjs?v=group-001";
import {ROLE_ICONS,renderGroupProgress} from "./battle-group-progress-view.mjs?v=individual-stats-001";
import {classTacticalInfo} from "./class-tactical-info.mjs?v=class-info-002";
import {CHARACTER_CLASS_PROFILES,CHARACTER_ATTRIBUTE_IDS} from "./character-attributes.mjs";
import {stanceInfo} from "./stance-info.mjs";
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
function openClassInfo(id){
 const c=classTacticalInfo(id,8),dialog=$("classInfoDialog");
 $("classInfoHeading").textContent=c.name;
 $("classInfoEquipment").textContent=c.race+" · "+c.role+" · "+c.weapon+" · "+c.armour+" armour";
 $("classInfoAction").textContent="Abilities activate automatically when conditions and cooldowns permit.";
 const profile=CHARACTER_CLASS_PROFILES[id];
 $("classInfoAttributes").textContent="Starting attributes: "+CHARACTER_ATTRIBUTE_IDS.map(k=>k+" "+profile.base[k]).join(" · ");
 $("classInfoGrowth").textContent="Training distribution: "+CHARACTER_ATTRIBUTE_IDS.map(k=>k+" "+profile.growth[k]+"%").join(" · ");
 $("classInfoPassiveName").textContent=c.passive.name;
 $("classInfoPassiveEffect").textContent=c.passive.effect;
 for(const [i,a] of c.abilities.entries()){const prefix=i===0?"classInfoPrimary":"classInfoSecondary";$(prefix+"Name").textContent=a.name;$(prefix+"Effect").textContent=a.effect;$(prefix+"Cooldown").textContent=a.cooldown+" combat rounds";}
 $("classInfoStrong").textContent=c.strong;$("classInfoBest").textContent=c.best;
 $("classInfoWeak").textContent=c.weak;$("classInfoWorst").textContent=c.worst;
 if(!dialog.open)dialog.showModal();
}
function specializationChoices(host,entries,value,onChoice){
 const key=JSON.stringify(entries);
 if(host.dataset.options!==key){
  const focused=document.activeElement?.dataset?.choice??document.activeElement?.dataset?.classInfo;
  const isInfo=Boolean(document.activeElement?.dataset?.classInfo),restore=host.contains(document.activeElement);
  host.replaceChildren(...entries.map(([id,label])=>{
   const wrap=node("div");wrap.className="specialization-option";
   const select=node("button",label);select.type="button";select.dataset.choice=id;
   const info=node("button","ⓘ");info.type="button";info.dataset.classInfo=id;info.className="class-info-button";
   info.setAttribute("aria-label","Information about "+GROUP_CLASSES[id].name);info.onclick=()=>openClassInfo(id);
   wrap.append(select,info);return wrap;
  }));
  host.dataset.options=key;
  if(restore)[...host.querySelectorAll(isInfo?"[data-class-info]":"[data-choice]")].find(b=>(isInfo?b.dataset.classInfo:b.dataset.choice)===focused)?.focus();
 }
 for(const b of host.querySelectorAll("[data-choice]")){b.setAttribute("aria-pressed",String(b.dataset.choice===value));b.onclick=()=>onChoice(b.dataset.choice);}
}
export function createGroupEditor(onClass,onStance){
 $("classInfoClose").addEventListener("click",()=>$("classInfoDialog").close());
 $("stanceInfoClose").addEventListener("click",()=>$("stanceInfoDialog").close());
 let current=null,selected=GROUP_IDS[0],draft=null,lastProgress="";
 const host=$("fighterButtons");
 for(const id of GROUP_IDS){
  const b=node("button");b.type="button";b.dataset.choice=id;
  b.addEventListener("click",()=>{selected=id;draft=null;render(current);});host.append(b);
 }
 const race=$("raceChoice"),main=$("mainClassChoice"),special=$("specialClassChoice");
 for(const stance of ["aggressive","balanced","defensive"]){
  const label=stance[0].toUpperCase()+stance.slice(1),wrap=node("div");wrap.className="specialization-option stance-option";
  const b=node("button",label);b.type="button";b.dataset.choice=stance;b.addEventListener("click",()=>onStance(selected,stance));
  const info=node("button","ⓘ");info.type="button";info.dataset.stanceInfo=stance;info.className="class-info-button";info.setAttribute("aria-label","Information about "+label+" stance");
  info.addEventListener("click",()=>{
   const m=current?.[selected];if(!m)return;
   const data=stanceInfo(stance,m.stances[stance].level),dialog=$("stanceInfoDialog");
   $("stanceInfoHeading").textContent=data.name;
   $("stanceInfoMastery").textContent=data.mastery;
   $("stanceInfoBehaviour").textContent=data.behaviour;
   $("stanceInfoStrengths").textContent=data.strengths;
   $("stanceInfoTradeoffs").textContent=data.tradeoffs;
   $("stanceInfoShared").textContent=data.shared;
   if(!dialog.open)dialog.showModal();
  });
  wrap.append(b,info);$("tacticButtons").append(wrap);
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
  specializationChoices(special,groupSpecializations(r,k).map(x=>[x.id,ROLE_ICONS[x.role]+" "+x.name+" · Lv "+(m.classes[x.id]?.mastery.level??1)]),c.race===r&&c.mainClass===k?c.id:null,id=>{
   const next=GROUP_CLASSES[id];draft=null;if(id===m.selected){render(current);return;}onClass(selected,next);
  });
  const status=draft&&(c.race!==r||c.mainClass!==k)?"Choose a specialization to change class. Active: "+c.name:"Active: "+c.name;
  if($("classChoiceStatus").textContent!==status)$("classChoiceStatus").textContent=status;
  for(const b of $("tacticButtons").querySelectorAll("button[data-choice]"))b.setAttribute("aria-pressed",String(b.dataset.choice===m.stance));
  const key=JSON.stringify([selected,m]);if(key!==lastProgress){renderGroupProgress($("selectedClassProgress"),group,selected);lastProgress=key;}
 }
 return {render,reset(){selected=GROUP_IDS[0];draft=null;lastProgress="";}};
}
