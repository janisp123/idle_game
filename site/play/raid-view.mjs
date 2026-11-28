// Read-only raid display; all outcomes come from the persisted combat attempt.
import {RAID_LEVELS,RAID_CATALOG,RAID_ROUND_MS,RAID_MAX_ROUNDS,activeRaidBuff} from "./raid-rules.mjs?v=raid-002";
import {raidResult} from "./raid-session.mjs?v=raid-002";
import {GROUP_CLASSES} from "./battle-group-classes.mjs?v=group-001";
import {GROUP_IDS} from "./battle-group.mjs?v=group-001";
import {weaponIcon} from "./arena-view.mjs?v=raid-002";
import {raidUnlocked,towerProgress} from "./endless-tower.mjs";
const $=id=>document.getElementById(id),node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const pct=n=>Math.round(n*100)+"%";
const time=ms=>{const sec=Math.max(0,Math.ceil(ms/1000));return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");};
const blessingTime=ms=>{const minutes=Math.max(0,Math.ceil(ms/60000));return Math.floor(minutes/60)+"h "+String(minutes%60).padStart(2,"0")+"m";};
const rewards=d=>"+10% Fighting XP"+(d.bonus.damage?" · +"+pct(d.bonus.damage)+" damage":"")+(d.bonus.defence?" · +"+pct(d.bonus.defence)+" defence":"");
function card(p,v,boss=false,monster=false){
 const c=GROUP_CLASSES[p.classId],el=node("div");el.className="battle-fighter raid-fighter"+(boss?" raid-boss":"");
 const label=node("strong",monster?p.name:c.name),weapon=node("span",c.weaponLabel);weapon.className="raid-weapon";
 weapon.prepend(weaponIcon(p.loadout,c.weaponLabel));
 const hp=node("progress");hp.max=v.maxHP;hp.value=v.hp;hp.setAttribute("aria-label",label.textContent+" health");
 el.append(label,weapon,hp,node("small",v.hp+" / "+v.maxHP+" HP"));if(!v.hp)el.classList.add("raid-dead");return el;
}
export function createRaidView(onStart){
 const buttons=RAID_LEVELS.map(level=>{
  const d=RAID_CATALOG[level],b=node("button");b.type="button";b.dataset.raidLevel=String(level);
  b.append(node("strong","Lv "+level+" · "+d.boss.name),node("small","Resists "+d.resistance+" ("+pct(d.resistFraction)+")"),node("small",rewards(d)+" · "+d.coins.toLocaleString()+" coins"));
  b.addEventListener("click",()=>onStart(level));$("raidChoices").append(b);return b;
 });
 let shown="";
 return {render(s){
  const now=s.settledAtMs,run=s.raidRun,buff=activeRaidBuff(s.raidBuff??null,now);
  $("raidBuff").textContent=buff?"Blessing · Lv "+buff.level+" · "+rewards(RAID_CATALOG[buff.level])+" · "+blessingTime(buff.expiresAtMs-now)+" remaining":"No active raid blessing";
  $("raidLast").textContent=s.raidLast?"Last raid: "+RAID_CATALOG[s.raidLast.level].boss.name+" · "+(s.raidLast.outcome==="victory"?"Victory · +"+s.raidLast.coins+" coins":"Defeat"):"No raids completed yet.";
  for(const b of buttons){const level=Number(b.dataset.raidLevel),unlocked=raidUnlocked(s,level);b.disabled=Boolean(run||towerProgress(s).run||!unlocked);b.lastElementChild.textContent=unlocked?rewards(RAID_CATALOG[level])+" · "+RAID_CATALOG[level].coins.toLocaleString()+" coins":"Locked · Clear tower floor "+level;}
  $("raidBattle").hidden=!run;$("battleFighters").hidden=Boolean(run||towerProgress(s).run);$("arenaNext").hidden=Boolean(run||towerProgress(s).run);
  if(!run){shown="";return;}
  const r=raidResult(run),elapsed=Math.min(run.durationMs,Math.max(0,now-run.startedAtMs)),round=Math.min(r.rounds,Math.floor(elapsed/RAID_ROUND_MS)),key=run.startedAtMs+":"+run.level+":"+round;
  $("raidHeading").textContent="Raid · "+RAID_CATALOG[run.level].boss.name;
  $("raidTerrain").textContent=r.terrain.name+" · Lv "+run.level;
  $("raidTimer").textContent=time(elapsed)+" elapsed · "+time(RAID_ROUND_MS*RAID_MAX_ROUNDS-elapsed)+" until limit";
  $("raidProgress").value=Math.min(100,100*elapsed/(RAID_ROUND_MS*RAID_MAX_ROUNDS));
  if(shown===key)return;shown=key;
  const v=r.events.filter(e=>e.round<=round).at(-1).vitals;
  $("raidPlayers").replaceChildren(...GROUP_IDS.map((id,i)=>card(run.frozen.players[id],v["player:"+i])));
  $("raidBoss").replaceChildren(card(r.enemies[0],v["enemy:0"],true,true));
  $("raidMinions").replaceChildren(...r.enemies.slice(1).map((p,i)=>card(p,v["enemy:"+(i+1)],false,true)));
 }};
}
