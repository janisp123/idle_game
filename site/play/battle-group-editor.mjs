// Button-only three-step selection. A race/main-class draft never spends
// coins or changes the active class until the player chooses a specialization.
import {GROUP_IDS,RECRUIT_LEVELS,MAIN_CLASS_LEVEL,SPECIALIZATION_LEVEL,STANCE_UNLOCK_LEVEL,stanceAllowed,effectiveGroupStance,mainClassUnlocked,specializationUnlocked,basicRace,basicClass} from "./battle-group.mjs?v=individual-stats-001";
import {GROUP_CLASSES,GROUP_RACES,RACE_LABELS,groupMainClasses,groupSpecializations} from "./battle-group-classes.mjs?v=group-001";
import {ROLE_ICONS,renderGroupProgress} from "./battle-group-progress-view.mjs?v=individual-stats-001";
import {MAIN_CLASS_SKILLS} from "./class-kits.mjs";
import {classTacticalInfo} from "./class-tactical-info.mjs?v=class-info-002";
import {CHARACTER_CLASS_PROFILES,CHARACTER_ATTRIBUTE_IDS} from "./character-attributes.mjs";
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
// Basic-stage guidance describes the actual shared skill, not the future specialist kit.
const MAIN_GUIDES=Object.freeze({
 Warrior:["Frontline melee damage. Heavy weapon attacks reward reaching the target.","Strong direct weapon pressure at contact.","Distant enemies and intact defensive frontlines."],
 Knight:["Defensive frontline. Guard provides personal protection when injured.","Surviving incoming attacks and holding close positions.","Limited offensive pressure and mobile ranged enemies."],
 Rogue:["Light-armour weapon fighter. Feint briefly opens enemy guard.","Exploiting vulnerable targets at contact.","Heavy protection and crossing open terrain before reaching a target."],
 Wizard:["Magical damage dealer. Arcane Bolt strengthens a single-target attack.","Magic damage against armoured targets.","Close melee pressure and exposed ranged fire."],
 Cleric:["Healing support. Mend restores one wounded living ally, including yourself.","Sustaining a group through damage.","Focused burst and pressure that prevents healing."],
 Scout:["Mobile light-armour fighter. Quick Strike has short recovery.","Frequent attacks and pressure on exposed targets.","Heavy armour and control."],
 Oracle:["Healing support. Restore heals a wounded living ally, including yourself.","Sustaining allies in prolonged fights.","Focused burst and isolation."],
 Assassin:["Light-armour attacker. Ambush opens the enemy guard on a stronger strike.","Pressure on exposed targets once in reach.","Heavy armour, shields and long approaches."],
 Raider:["Heavy melee attacker. Heavy Blow trades recovery time for impact.","Strong strikes in close combat.","Distant enemies and slow recovery."],
 Monk:["Close-range fighter. Rapid Fist delivers quick attacks.","Repeated pressure at contact.","Ranged opponents and heavy protection."],
 Shaman:["Nearby ally support. War Blessing strengthens or protects depending on stance.","Supporting allied damage or survival within range.","Isolation and concentrated attacks."],
 Scavenger:["Hammer fighter. Crushing Blow briefly opens an enemy guard.","Close-range pressure against defensive targets.","Distant mobile enemies."],
 Artisan:["Durable hammer fighter. Reinforce provides personal protection when injured.","Close-range survival and sustained pressure.","Mobile enemies outside weapon reach."]
});
function openMainInfo(race,id){
 const a=MAIN_CLASS_SKILLS[id],g=MAIN_GUIDES[id],dialog=$("mainInfoDialog"),paths=groupSpecializations(race,id);
 $("mainInfoHeading").textContent=RACE_LABELS[race]+" "+id;
 $("mainInfoRole").textContent=g[0];$("mainInfoStrong").textContent=g[1];$("mainInfoWeak").textContent=g[2];
 $("mainInfoSkill").textContent=a.name;
 $("mainInfoSkillEffect").textContent=a.description;
 $("mainInfoCooldown").textContent=a.cooldown+" combat rounds";
 $("mainInfoPaths").replaceChildren(...paths.map(c=>{
  const row=node("div");row.className="specialization-option main-path";
  const detail=node("div"),name=node("strong",c.name+" · "+c.role),summary=node("p",classTacticalInfo(c.id,8).summary);
  detail.append(name,summary);
  const info=node("button","ⓘ");info.type="button";info.className="class-info-button";info.dataset.pathInfo=c.id;info.setAttribute("aria-label","Information about "+c.name);info.onclick=()=>openClassInfo(c.id);
  row.append(detail,info);return row;
 }));
 if(!dialog.open)dialog.showModal();
}
function mainChoices(host,race,entries,value,onChoice){
 const key=JSON.stringify([race,entries]);
 if(host.dataset.options!==key){
  const active=document.activeElement,restore=host.contains(active),isInfo=!!active?.dataset?.mainInfo,focused=active?.dataset?.mainInfo??active?.dataset?.choice;
  host.replaceChildren(...entries.map(([id,label])=>{
   const wrap=node("div");wrap.className="specialization-option";
   const select=node("button",label);select.type="button";select.dataset.choice=id;
   const info=node("button","ⓘ");info.type="button";info.dataset.mainInfo=id;info.className="class-info-button";
   info.setAttribute("aria-label","Information about "+RACE_LABELS[race]+" "+id);info.onclick=()=>openMainInfo(race,id);
   wrap.append(select,info);return wrap;
  }));
  host.dataset.options=key;
  if(restore)[...host.querySelectorAll(isInfo?"[data-main-info]":"[data-choice]")].find(b=>(isInfo?b.dataset.mainInfo:b.dataset.choice)===focused)?.focus();
 }
 for(const b of host.querySelectorAll("[data-choice]")){b.setAttribute("aria-pressed",String(b.dataset.choice===value));b.onclick=()=>onChoice(b.dataset.choice);}
}
export function createGroupEditor(onClass,onStance){
 $("mainInfoClose").addEventListener("click",()=>$("mainInfoDialog").close());
 $("classInfoClose").addEventListener("click",()=>$("classInfoDialog").close());
 let current=null,selected=GROUP_IDS[0],draft=null,lastProgress="";
 const host=$("fighterButtons");
 for(const id of GROUP_IDS){
  const b=node("button");b.type="button";b.dataset.choice=id;
  b.addEventListener("click",()=>{if(current?.[id]?.recruitment?.active===false)return;selected=id;draft=null;render(current);});host.append(b);
 }
 const race=$("raceChoice"),main=$("mainClassChoice"),special=$("specialClassChoice");
 for(const stance of ["aggressive","balanced","defensive"]){
  const b=node("button",stance[0].toUpperCase()+stance.slice(1));b.type="button";b.dataset.choice=stance;b.addEventListener("click",()=>onStance(selected,stance));$("tacticButtons").append(b);
 }
 function render(group){
  if(!group)return;current=group;
  for(const b of host.children){const id=b.dataset.choice,m=group[id],c=GROUP_CLASSES[m.selected],p=m.classes[c.id];
   const index=GROUP_IDS.indexOf(id),locked=m.recruitment?.active===false,novice=!specializationUnlocked(m);const label=locked?"🔒 "+(index+1)+" · Fighting Lv "+RECRUIT_LEVELS[index]:ROLE_ICONS[c.role]+" "+(index+1)+" · "+(!mainClassUnlocked(m)?RACE_LABELS[c.race]:novice?c.mainClass:c.name)+" · Lv "+(m.recruitment?.level??p.mastery.level);b.disabled=locked;
   if(b.textContent!==label)b.textContent=label;b.setAttribute("aria-pressed",String(id===selected));b.title=label;
  }
  const m=group[selected],c=GROUP_CLASSES[m.selected],r=draft?.race??c.race,k=draft?.main??c.mainClass,novice=!specializationUnlocked(m),raceOnly=!mainClassUnlocked(m);
  choices(race,GROUP_RACES.map(id=>[id,RACE_ICONS[id]+" "+RACE_LABELS[id]]),r,id=>{
   if(id!==r){if(novice){const next=basicRace(id);draft=null;onClass(selected,next);return;}draft={race:id,main:groupMainClasses(id)[0]};render(current);}
  });
  mainChoices(main,r,groupMainClasses(r).map(id=>[id,raceOnly?"🔒 "+id+" · Unlock Lv "+MAIN_CLASS_LEVEL:novice?id+" · "+MAIN_CLASS_SKILLS[id].name:id]),raceOnly?null:k,id=>{if(raceOnly)return;if(novice){const next=basicClass(r,id);draft=null;if(next.id!==m.selected)onClass(selected,next);else render(current);return;}draft={race:r,main:id};render(current);});
  main.dataset.locked=String(raceOnly);
  for(const b of main.querySelectorAll("[data-choice]")){b.disabled=raceOnly;b.dataset.locked=String(raceOnly);const ability=MAIN_CLASS_SKILLS[b.dataset.choice];b.title=ability.name+" — "+ability.description+" Cooldown: "+ability.cooldown+" rounds."; }
  specializationChoices(special,(raceOnly?groupMainClasses(r).flatMap(id=>groupSpecializations(r,id)):groupSpecializations(r,k)).map(x=>[x.id,novice?"🔒 "+x.name+" · Unlock Lv "+SPECIALIZATION_LEVEL:ROLE_ICONS[x.role]+" "+x.name+" · Lv "+(m.classes[x.id]?.mastery.level??1)]),!novice&&c.race===r&&c.mainClass===k?c.id:null,id=>{
   if(novice)return;
   const next=GROUP_CLASSES[id];draft=null;if(id===m.selected){render(current);return;}onClass(selected,next);
  });
  special.dataset.locked=String(novice);
  for(const b of special.querySelectorAll("[data-choice]")){b.disabled=novice;b.dataset.locked=String(novice);b.title=novice?"Unlocks at character level "+SPECIALIZATION_LEVEL:"";}
  const status=raceOnly?"Character level "+m.recruitment.level+" · Choose a race. Main class unlocks at "+MAIN_CLASS_LEVEL+". Specialization unlocks at "+SPECIALIZATION_LEVEL+".":novice?"Character level "+m.recruitment.level+" · Specializations unlock at level "+SPECIALIZATION_LEVEL+". Active class skill: "+MAIN_CLASS_SKILLS[c.mainClass].name+" — "+MAIN_CLASS_SKILLS[c.mainClass].description:draft&&(c.race!==r||c.mainClass!==k)?"Choose a specialization to change class. Active: "+c.name:"Active: "+c.name;
  if($("classChoiceStatus").textContent!==status)$("classChoiceStatus").textContent=status;
  for(const b of $("tacticButtons").children){
   const stance=b.dataset.choice,locked=!stanceAllowed(m,stance),name=stance[0].toUpperCase()+stance.slice(1),label=locked?"🔒 "+name+" · Unlock Lv "+STANCE_UNLOCK_LEVEL:name;
   b.disabled=locked;b.dataset.locked=String(locked);b.title=locked?"Unlocks at character level "+STANCE_UNLOCK_LEVEL:name;
   if(b.textContent!==label)b.textContent=label;
   b.setAttribute("aria-pressed",String(!locked&&stance===effectiveGroupStance(m)));
  }
  const key=JSON.stringify([selected,m]);if(key!==lastProgress){renderGroupProgress($("selectedClassProgress"),group,selected);lastProgress=key;}
 }
 return {render,reset(){selected=GROUP_IDS[0];draft=null;lastProgress="";}};
}
