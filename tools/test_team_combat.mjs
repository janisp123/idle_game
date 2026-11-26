import assert from "node:assert/strict";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {resolvePhysicalDuel} from "../site/play/physical-duel.mjs";
import {resolveTeamBattle,TEAM_COMBAT_BALANCE,teamArenaWidth} from "../site/play/team-combat.mjs";
import {initialTeamwork,awardTeamwork,activateTeamworkOnLogin,coordinationChance,validTeamwork,teamworkRequiredXP} from "../site/play/teamwork.mjs";
import {seededCombatRandom} from "../site/play/combat.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {simulateTeamCombat} from "./simulation/team-combat.mjs";
import {runLab} from "./system-lab.mjs";
import {readFileSync} from "node:fs";
const expected=JSON.parse(readFileSync(new URL("../docs/mechanics/TEAM_002_PILOT.json",import.meta.url),"utf8"));
const styles=["bow","spear","sword_shield","greatsword","hammer"],families=["padded","leather","plate"];
const rng=seededCombatRandom(20261126),seeds=Array.from({length:8},()=>Math.floor(rng()*2**32));
let parity=0,hash=2166136261;
for(const grade of [0,3,7])for(const [i,a] of styles.entries())for(const [j,b] of styles.entries())for(const terrain of ARENAS){
  const p=createPlayerSnapshot({grade,itemGrade:grade,quality:"common",loadout:a,armour:families[i%3]});
  const e=createPlayerSnapshot({grade,itemGrade:grade,quality:"common",loadout:b,armour:families[j%3]});
  for(const seed of seeds){
    const raw=JSON.stringify(resolvePhysicalDuel(p,e,seed,terrain));parity++;
    for(let k=0;k<raw.length;k++)hash=Math.imul(hash^raw.charCodeAt(k),16777619)>>>0;
  }
}
assert.equal(parity,expected.parity);assert.equal(hash,expected.hash);
const novice=initialTeamwork(),ready=awardTeamwork(novice,100000000);
assert.deepEqual(novice,{level:1,xp:0});assert.deepEqual(ready,{level:1,xp:100});
assert.deepEqual(activateTeamworkOnLogin(ready),{level:2,xp:0});
assert.deepEqual(activateTeamworkOnLogin(novice),novice);
assert.deepEqual(awardTeamwork({level:50,xp:0},1000000),{level:50,xp:0});
assert.equal(validTeamwork({level:1,xp:101}),false);
assert.throws(()=>awardTeamwork(novice,-1));assert.throws(()=>coordinationChance(51));
assert.equal(teamworkRequiredXP(2),200);
assert.ok(coordinationChance(1)<coordinationChance(25)&&coordinationChance(25)<coordinationChance(50));
let checks=0,survivorContinued=0,interceptions=0;
for(const n of [1,2,3,6]){
  const a=Array.from({length:n},(_,i)=>createPlayerSnapshot({loadout:styles[i%5],armour:families[i%3]}));
  const b=Array.from({length:n},(_,i)=>createPlayerSnapshot({loadout:styles[(i+2)%5],armour:families[(i+1)%3]}));
  const original=JSON.stringify([a,b]);
  for(const arena of ARENAS)for(const seed of seeds){
    const r=resolveTeamBattle(a,b,seed,arena,{player:50,enemy:50});
    assert.deepEqual(r,resolveTeamBattle(a,b,seed,arena,{player:50,enemy:50}));
    assert.equal(JSON.stringify([a,b]),original);
    assert.ok(r.rounds<=TEAM_COMBAT_BALANCE.maxRounds);
    assert.equal(Object.keys(r.survivors).length,2*n);
    let prev=r.events[0].vitals;
    for(const ev of r.events.slice(1)){
      const current=ev.vitals;
      const lost=Object.keys(prev).reduce((sum,id)=>sum+prev[id].hp-current[id].hp,0);
      assert.equal(lost,ev.damage,"HP damage conservation");
      const occupied=new Set();
      for(const [id,v] of Object.entries(current)){
        assert.ok(v.hp>=0&&v.hp<=v.maxHP&&v.arrows>=0);
        assert.ok(v.x>=0&&v.x<teamArenaWidth(arena));
        if(v.hp){const pos=v.x+":"+v.y;assert.ok(!occupied.has(pos));occupied.add(pos);}
        if(prev[id].hp===0&&ev.actor===id)assert.equal(ev.type,"bleed","only already-applied bleed persists after death");
      }
      if(ev.actor&&ev.damage&&Object.entries(prev).some(([id,v])=>id!==ev.actor&&id.split(":")[0]===ev.actor.split(":")[0]&&v.hp===0))survivorContinued++;
      if(ev.type==="intercept")interceptions++;
      prev=current;
    }
    checks++;
  }
}
assert.ok(survivorContinued>0);assert.ok(interceptions>0);
assert.throws(()=>resolveTeamBattle([],[],0));
for(const {name,...report} of expected.results){
  const actual=simulateTeamCombat({battles:report.battles,seed:report.seed,grade:report.grade,builds:report.builds,teamwork:report.teamwork});
  assert.deepEqual(actual,simulateTeamCombat({battles:report.battles,seed:report.seed,grade:report.grade,builds:report.builds,teamwork:report.teamwork}),"deterministic centered pilot "+name);
  assert.equal(Object.values(actual.outcomes).reduce((n,x)=>n+x,0),report.battles);
}
const lab=runLab({module:"teamCombat",battles:10,seed:20261126});
assert.equal(lab.results[0].battles,10);assert.equal(lab.results[0].module,"teamCombat");
console.log(JSON.stringify({legacyTraceParity:parity,hash,rosterFixtures:checks,survivorContinued,interceptions,pilotBouts:expected.results.reduce((n,r)=>n+r.battles,0),teamworkCap:"PASS",lab:"PASS"}));
