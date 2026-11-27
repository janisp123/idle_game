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
 assert.equal(n.combatSession.groupCombatRules,4);
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
