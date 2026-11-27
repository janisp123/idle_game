// Read-only adapter. Real frozen team timeline remains the sole combat authority.
import {teamCombatAtTime,teamWinPrize,teamBoutMs} from "./team-timeline.mjs?v=group-004";
import {groupCombatAtTime,groupWinPrize,GROUP_TIMELINE_VERSION} from "./battle-group-timeline.mjs?v=raid-001";
import {GROUP_CLASSES} from "./battle-group-classes.mjs?v=group-001";
import {COMBAT_LOADOUTS} from "./combat-skills.mjs?v=gear-a3";
const title=s=>s[0].toUpperCase()+s.slice(1);
export const battleLabels=Object.freeze({victory:"Victory",defeat:"Defeat",double_death:"Draw"});
export function battlePreviewKey(s){
  return s?JSON.stringify([s.timelineVersion,s.seed,Math.floor(s.elapsedMs/teamBoutMs(s)),s.players,s.teamworkLevel,s.coinRemainder??0,s.cloneEnvelope??null,s.rank?.grade??null,s.groupCombatRules??1,s.raidBonus??null]):"";
}
export function battlePercentage(s){
  return s?Math.min(99,Math.floor(100*(s.elapsedMs%teamBoutMs(s))/teamBoutMs(s))):0;
}
function fighter(snapshot,v,index){
  const pieces=snapshot.trainingKit?.armour;
  const family=typeof snapshot.armour==="string"?snapshot.armour:pieces?
    new Set(Object.values(pieces)).size===1?Object.values(pieces)[0]:"mixed":null;
  return {number:index+1,className:GROUP_CLASSES[snapshot.classId]?.name,role:snapshot.role,classLevel:snapshot.classLevel,weapon:snapshot.loadout,weaponName:COMBAT_LOADOUTS[snapshot.loadout].name,
    family,armourName:family?title(family):null,tactic:snapshot.tactic??null,
    hp:v.maxHP,armour:v.maxArmour};
}
export function buildBattlePreview(session){
  if(!session)return null;
  const group=session.timelineVersion===GROUP_TIMELINE_VERSION,r=group?groupCombatAtTime(session):teamCombatAtTime(session),start=r.events[0].vitals;
  return {key:battlePreviewKey(session),bout:r.bout,environment:{id:r.terrain.id,name:r.terrain.name},
    players:Object.values(session.players).map((s,i)=>fighter(s,start["player:"+i],i)),
    enemies:r.enemies.map((s,i)=>fighter(s,start["enemy:"+i],i)),
    outcome:r.outcome,reward:r.outcome==="victory"?(group?groupWinPrize(session):teamWinPrize(session)):0};
}
// Only called after a successful save. Never infer victory from elapsed time.
// Match the exact old in-flight bout to the single committed arena prize.
export function committedBattleResult(before,out,preview){
  const sum={bouts:0,victories:0,defeats:0,doubleDeaths:0,coins:0};
  for(const r of out.reports??[])for(const key of Object.keys(sum))sum[key]+=r?.arena?.[key]??0;
  if(!sum.bouts)return null;
  const outcome=sum.bouts===1?(sum.victories===1?"victory":sum.defeats===1?"defeat":"double_death"):null;
  const old=before?.combatSession,next=out.state?.combatSession;
  const exact=Boolean(outcome&&old&&next&&old.elapsedMs%teamBoutMs(old)>0&&
    next.prizeCursor===old.prizeCursor+1&&old.seed===next.seed&&preview?.key===battlePreviewKey(old)&&
    preview.outcome===outcome&&preview.reward===sum.coins);
  return {...sum,outcome,preview:exact?preview:null};
}
