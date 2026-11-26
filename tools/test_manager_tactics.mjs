import test from "node:test";
import assert from "node:assert/strict";
import * as m from "../site/play/manager-lanes.mjs";
import * as t from "../site/play/manager-tactics.mjs";
import {desiredArenaTeam} from "../site/play/engine.mjs";
import {BOUT_MS} from "../site/play/combat.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
import {ARENAS} from "../site/play/arenas.mjs";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
const rng=()=>.5;
test("independent choices, valid roundtrip, invalid choice rejected",()=>{
  let s=m.newManagerGame(0);s=m.chooseManagerTactic(s,"first","aggressive").state;
  assert.equal(s.managerTactics.first.selected,"aggressive");assert.equal(s.managerTactics.second.selected,"balanced");
  assert.deepEqual(m.readManagerGame(JSON.stringify(s)),s);
  assert.throws(()=>m.chooseManagerTactic(s,"third","defensive"),RangeError);
  assert.equal(m.readManagerGame({...s,managerTactics:{...s.managerTactics,second:{selected:"bad"}}}),null);
});
test("frozen tactic practice credited to actual choice, inactive capped waits",()=>{
  let t0=t.blankTactics(),snap=t.tacticSnapshots(t0,{first:{},second:{}});
  let selected=t.chooseTactic(t0,"first","defensive");
  let earned=t.awardTacticPractice(selected,snap,{first:BOUT_MS,second:0});
  assert.equal(earned.first.skills.balanced.xp,BOUT_MS);assert.equal(earned.first.skills.defensive.xp,0);
  earned.first.skills.balanced.xp=t.tacticRequiredXP(1);
  assert.equal(t.activateTactics(earned).advances.length,0);
  let a=t.activateTactics(t.chooseTactic(earned,"first","balanced"));
  assert.equal(a.tactics.first.skills.balanced.level,2);assert.equal(a.tactics.first.skills.balanced.xp,0);
  assert.equal(a.tactics.second.skills.balanced.xp,0);
});
test("save selection does not rewrite started bout; next snapshot changes",()=>{
  let s=m.settleManagerLive(m.newManagerGame(0),1,rng).state;
  const before=structuredClone(s.combatSession);
  const out=m.chooseManagerTactic(s,"first","defensive");
  assert.deepEqual(out.state.combatSession,before);
  assert.equal(desiredArenaTeam(out.state).first.tactic,"defensive");
  assert.equal(desiredArenaTeam(out.state).second.tactic,"balanced");
  assert.equal(m.readManagerGame(JSON.stringify(out.state)).combatSession.players.first.tactic,"balanced");
});
test("actual offline practice is frozen and capped; return activates once",()=>{
  let s=m.newManagerGame(0);s.skills.fighting.level=52; // enough cap room for actual complete bouts
  s.managerTactics.first.skills.balanced.xp=t.tacticRequiredXP(1)-1;
  const raw=m.settleManagerOffline(s,BOUT_MS*3,rng);
  assert.equal(raw.state.managerTactics.first.skills.balanced.level,1);
  assert.equal(raw.state.managerTactics.first.skills.balanced.xp,t.tacticRequiredXP(1));
  const a=m.enterManagerGame(raw.state,raw.state.settledAtMs,rng);
  assert.equal(a.state.managerTactics.first.skills.balanced.level,2);
  assert.equal(a.tacticAdvances.length,1);
  assert.equal(m.enterManagerGame(a.state,a.state.settledAtMs,rng).tacticAdvances.length,0);
});
test("max S Masterwork actual resolver distinct behaviour, deterministic, no stat edit",()=>{
  const build=(loadout,armour)=>createPlayerSnapshot({loadout,armour,grade:7,itemGrade:7,quality:"masterwork",str:141,dex:141,end:129,skill:52});
  const p=[build("sword_shield","plate"),build("bow","leather")],e=[build("spear","plate"),build("hammer","padded")];
  let different=0;
  for(const a of ARENAS)for(let seed=1;seed<=12;seed++){
    const roster=(x,y)=>p.map((b,i)=>({...b,tactic:i?y:x,tacticLevel:50}));
    const r=resolveTeamBattle(roster("defensive","aggressive"),e,seed,a,{player:50,enemy:50});
    assert.deepEqual(r,resolveTeamBattle(roster("defensive","aggressive"),e,seed,a,{player:50,enemy:50}));
    const reverse=resolveTeamBattle(roster("aggressive","defensive"),e,seed,a,{player:50,enemy:50});
    if(JSON.stringify(r.events)!==JSON.stringify(reverse.events))different++;
  }
  assert.ok(different>0);
});
