import test from "node:test";
import assert from "node:assert/strict";
import {newArenaManager,newBattleGroupManager,enableArenaOnly,readManagerGame,settleManagerLive,settleManagerOffline,enterManagerGame,assignManagerWork,chooseManagerGroupClass} from "../site/play/manager-lanes.mjs";
import {xpToNextLevel} from "../site/play/engine.mjs";
const now=2026112700,rand=()=>.5;
const noWork=s=>{assert.equal(s.arenaOnly,true);assert.equal(s.managerWork,undefined);assert.equal(s.overlapParity,undefined);assert.ok(Object.values(s.items).every(v=>v===0));};
test("new arena-only game earns only fighting effort, experience and actual prizes",()=>{
 let s=newArenaManager(now);noWork(s);
 const a=settleManagerLive(s,now+20000,rand),n=a.state;noWork(n);
 assert.equal(n.groupAnalytics.all.ms,20000);
 assert.ok(n.skills.fighting.xp>0);assert.equal(n.skills.hunting.xp,0);
 assert.deepEqual(n.attributeEffort,s.attributeEffort);
 assert.deepEqual(n.attributeEffortActive,s.attributeEffortActive);
 assert.equal(n.combatSession.groupCombatRules,10);
 for(const m of Object.values(n.battleGroup)){const p=m.classes[m.selected];const total=Object.values(p.attributeEffort).reduce((a,b)=>a+b,0);assert.ok(total>0&&total<=20000*100);assert.deepEqual(p.attributeEffort,p.attributeEffortActive);}
 assert.ok(Object.values(n.combatSession.players).every(p=>p.attributes&&p.skill===p.classLevel));
 assert.deepEqual(readManagerGame(JSON.stringify(n)),n);
 assert.throws(()=>assignManagerWork(n,"mining"),/retired/);
});
test("migration preserves frozen bout, coins, earned stats, gear, analytics and historical skill levels; no resource conversion",()=>{
 let old=settleManagerLive(newBattleGroupManager(now),now+5000,rand).state;
 old={...old,coins:1234,items:{...old.items,hide:99},skills:{...old.skills,hunting:{level:9,xp:xpToNextLevel(9)}}};
 const s=enableArenaOnly(old);noWork(s);
 for(const k of ["coins","attributeEffort","skills","battleGroup","combatSession","groupAnalytics"])assert.deepEqual(s[k],old[k],k);
 assert.deepEqual(enableArenaOnly(s),s);
 const a=enterManagerGame(s,now+20000,rand).state;noWork(a);
 assert.deepEqual(a.skills.hunting,old.skills.hunting);
 assert.equal(a.groupAnalytics.all.ms,20000);assert.ok(readManagerGame(JSON.stringify(a)));
});
test("offline cap freezes earned rewards, no noncombat catch-up and automatic fighting claim",()=>{
 const s=newArenaManager(now),a=settleManagerOffline(s,now+86400000,rand).state;noWork(a);
 assert.equal(a.skills.fighting.xp,xpToNextLevel(a.skills.fighting.level));
 assert.equal(a.skills.hunting.xp,0);assert.ok(a.groupAnalytics.all.ms>0);
 const b=enterManagerGame(a,a.settledAtMs,rand).state;noWork(b);
 assert.equal(b.skills.fighting.level,a.skills.fighting.level+1);
 assert.equal(b.groupAnalytics.all.ms,a.groupAnalytics.all.ms);
 const c=chooseManagerGroupClass(b,"member1","human","Rogue","trickblade",b.settledAtMs,rand).state;noWork(c);assert.ok(readManagerGame(JSON.stringify(c)));
});

import {readArenaManager,settleArenaLive,enterArena} from "../site/play/arena-manager.mjs";
test("public arena adapter migrates old saves and refuses legacy work settlement",()=>{const old=newBattleGroupManager(now);assert.throws(()=>settleArenaLive(old,now+10000,rand),/arena-only/);const s=readArenaManager(JSON.stringify(old));noWork(s);const n=enterArena(s,now+20000,rand).state;noWork(n);assert.equal(n.skills.hunting.xp,0);assert.equal(n.groupAnalytics.all.ms,20000);});

import {startArenaRaid} from "../site/play/arena-manager.mjs";
import {RAID_BUFF_MS,raidBonus,raidVictoryBuff} from "../site/play/raid-rules.mjs";
import {raidResult} from "../site/play/raid-session.mjs";
import {alphaMaxStats} from "../site/play/alpha-tools.mjs";
import {upgradeBattleGroup} from "../site/play/battle-group.mjs";
import {RAID_CATALOG} from "../site/play/raid-rules.mjs";
test("raid pause, persisted frozen attempt, completion once, and resumed arena",()=>{
 let s=newArenaManager(now);s=alphaMaxStats(s,"none",now,rand).state;s={...s,battleGroup:upgradeBattleGroup(s.battleGroup,100000000,52).group};
 const out=startArenaRaid(s,10,now,rand),run=out.state.raidRun,end=run.startedAtMs+run.durationMs,r=raidResult(run);
 assert.ok(run);assert.deepEqual(startArenaRaid(out.state,20,now,rand).state,out.state);
 const mid=settleArenaLive(out.state,now+Math.floor(run.durationMs/2),rand).state;
 assert.deepEqual(mid.combatSession,out.state.combatSession);assert.equal(mid.coins,out.state.coins);
 assert.deepEqual(mid.battleGroup,out.state.battleGroup);
 const restored=readArenaManager(JSON.stringify(mid));assert.deepEqual(restored,mid);
 const finish=enterArena(restored,end,rand);assert.equal(finish.state.raidRun,null);assert.equal(finish.raidFinished.outcome,r.outcome);
 assert.equal(finish.raidFinished.coins,r.outcome==="victory"?RAID_CATALOG[10].coins:0);
 assert.equal(finish.state.coins,mid.coins+finish.raidFinished.coins);
 if(r.outcome==="victory")assert.equal(finish.state.raidBuff.expiresAtMs,end+RAID_BUFF_MS);
 const replay=enterArena(readArenaManager(JSON.stringify(finish.state)),end,rand);assert.equal(replay.raidFinished,undefined);assert.equal(replay.state.coins,finish.state.coins);
 const later=enterArena(replay.state,end+20000,rand).state;assert.ok(later.groupAnalytics.all.ms>finish.state.groupAnalytics.all.ms);
});
test("active raid blessing multiplies actual fighting XP and frozen combat bonus expires",()=>{
 const s=newArenaManager(now),base={...s,skills:{...s.skills,fighting:{level:30,xp:0}}};
 // Isolate XP from any change in combat downtime and use multiple reward cycles.
 const xpOnly={...base,raidBuff:raidVictoryBuff(null,10,now)},end=now+100000;
 const a=settleManagerOffline(base,end,rand).state,x=settleManagerOffline(xpOnly,end,rand).state;
 assert.ok(a.skills.fighting.xp>0);assert.ok(x.skills.fighting.xp>a.skills.fighting.xp);
 assert.equal(x.coins,a.coins);assert.deepEqual(x.groupAnalytics,a.groupAnalytics);
 const boosted={...base,raidBuff:raidVictoryBuff(null,50,now)},b=settleManagerOffline(boosted,end,rand).state;
 assert.deepEqual(b.combatSession.raidBonus,{damage:.1,defence:.1});
 assert.deepEqual(readArenaManager(JSON.stringify(b)).raidBuff,b.raidBuff);
 const expired={...b,raidBuff:{level:50,expiresAtMs:end+1000}};
 const c=settleManagerOffline(expired,end+20000,rand).state;assert.equal(c.combatSession.raidBonus,undefined);
 assert.equal(raidBonus(c.raidBuff,c.settledAtMs).xp,0);
});

import "./test_range_geometry_v6.mjs";

import "./test_interlude_control_v7.mjs";

import "./test_eight_arenas_v8.mjs";

import "./test_class_mastery_v9.mjs";

import "./test_elimination_v10.mjs";

import "./test_arena_preferences.mjs";

import "./test_alpha_clan.mjs";

import "./test_clan_progression.mjs";
