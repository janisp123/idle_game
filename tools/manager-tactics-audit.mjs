// Actual production resolver, S Masterwork only. Screening, not proof of no meta.
import assert from "node:assert/strict";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {TACTIC_IDS} from "../site/play/manager-tactics.mjs";
import {TEAM_SIX_MONTH_BUILD} from "../site/play/alpha-tools.mjs";
import {newTeamGame} from "../site/play/engine.mjs";
import {awardAttributeTime,blankAttributeEffort,effectiveAttributeProgress} from "../site/play/attributes.mjs";
const b=TEAM_SIX_MONTH_BUILD,skills=newTeamGame(0).skills;skills.fighting.level=b.fightingLevel;
const stat=effectiveAttributeProgress(awardAttributeTime(blankAttributeEffort(),"fighting",b.productiveHours*3600000),skills);
const params={grade:7,itemGrade:7,quality:"masterwork",str:stat.STR.value,dex:stat.DEX.value,end:stat.END.value,skill:b.fightingLevel};
const weapons=["sword_shield","bow","spear","hammer","greatsword"],families=["padded","leather","plate"];
const fighters=weapons.flatMap(w=>families.flatMap(a=>TACTIC_IDS.map(t=>({id:[w,a,t].join(":"),snapshot:{...createPlayerSnapshot({...params,loadout:w,armour:a}),tactic:t,tacticLevel:50}}))));
const find=(w,a,t)=>fighters.find(x=>x.id===[w,a,t].join(":"));
const base=[["spear","plate"],["bow","leather"],["greatsword","plate"],["hammer","padded"],["sword_shield","leather"]];
const foes=base.map(([w,a])=>[find(w,a,"balanced").snapshot,find(w,a,"balanced").snapshot]);
const levels={player:50,enemy:50},seed=20261126;
const score=r=>r.outcome==="victory"?1:r.outcome==="double_death"?.5:0;
const tally=()=>({bouts:0,wins:0,draws:0,losses:0,score:0});
const add=(t,r)=>{t.bouts++;t.wins+=+(r.outcome==="victory");t.draws+=+(r.outcome==="double_death");t.losses+=+(r.outcome==="defeat");t.score+=score(r);};
let calls=0;const battle=(p,e,s,a)=>{calls++;return resolveTeamBattle(p,e,s>>>0,a,levels);};
const rows=[];
for(const a of fighters)for(const b of fighters){
  const t=tally();
  for(let i=0;i<foes.length;i++)for(let j=0;j<ARENAS.length;j++)
    add(t,battle([a.snapshot,b.snapshot],foes[i],seed+Math.imul(i+1,0x9e3779b9)+j,ARENAS[j]));
  rows.push({first:a.id,second:b.id,...t});
}
assert.equal(rows.length,2025);
rows.sort((a,b)=>b.score-a.score||a.first.localeCompare(b.first)||a.second.localeCompare(b.second));
const anchors=[["sword_shield","plate","bow","leather"],["spear","plate","bow","leather"],["hammer","padded","spear","leather"],["greatsword","plate","greatsword","plate"],["spear","plate","spear","plate"]];
const validation=[];
for(const [w,a,v,c] of anchors)for(const x of TACTIC_IDS)for(const y of TACTIC_IDS){
 const t=tally();for(let i=0;i<foes.length;i++)for(let j=0;j<ARENAS.length;j++)for(let k=0;k<12;k++){
  const p=[find(w,a,x).snapshot,find(v,c,y).snapshot];if(k%2)p.reverse();
  add(t,battle(p,foes[i],seed+0x40000000+Math.imul(i+1,0x9e3779b9)+j*101+k,ARENAS[j]));
 }
 validation.push({first:[w,a,x].join(":"),second:[v,c,y].join(":"),...t});
}
const result={profile:params,seed,teamwork:50,tacticLevel:50,configs:rows.length,environments:ARENAS.map(a=>a.id),opponents:base,calls,screen:rows,validation,
 caveats:["one seed per screen cell; selected anchors independent holdout only","balanced mirror archetypes, not exhaustive pairwise or NPC balance","no lower grade tests","no damage formula changes"]};
console.log(JSON.stringify(result));
