import test from "node:test";
import assert from "node:assert/strict";
import {newArenaManager,enterArena,readArenaManager,chooseArenaClass,chooseArenaStance} from "../site/play/arena-manager.mjs";
import {GROUP_IDS,activeGroupIds,initialRecruitGroup,syncRecruitment,mainClassUnlocked,specializationUnlocked,basicRace,normalizeRecruitChoices,selectGroupClass,selectGroupStance,stanceUnlocked,groupSnapshots,awardGroupPractice,activateGroupPractice,previewGroupUpgrade,maxRecruitment} from "../site/play/battle-group.mjs";
import {startGroupSession,groupCombatAtTime,settleGroupSession,GROUP_BOUT_MS} from "../site/play/battle-group-timeline.mjs";
import {tacticRequiredXP} from "../site/play/manager-tactics.mjs";
const shared={difficulty:0,str:1,dex:1,end:1,skill:1},now=1800000000000,rand=()=>.5;
test("recruit thresholds, permanent availability, matching enemy counts and no locked practice",()=>{
 let g=initialRecruitGroup();for(const [i,l] of [1,5,10,15,20,25,30].entries()){
  g=syncRecruitment(g,l);assert.equal(activeGroupIds(g).length,i+1);assert.equal(activeGroupIds(syncRecruitment(g,1)).length,i+1);
  const session=startGroupSession(g,shared,1,123,{rules:10}),r=groupCombatAtTime(session);assert.equal(Object.keys(session.players).length,i+1);assert.equal(r.enemies.length,i+1);assert.ok(r.enemies.every(e=>e.novice));assert.ok(Object.values(session.players).every(e=>e.novice));
  const result=settleGroupSession(session,GROUP_BOUT_MS),trained=awardGroupPractice(g,session.players,result.practiceMs);
  for(const id of GROUP_IDS.slice(i+1)){assert.equal(result.practiceMs[id],0);assert.deepEqual(trained[id],g[id]);}
 }
 const fresh=initialRecruitGroup();assert.throws(()=>selectGroupClass(fresh,"member2","human","Warrior","blademaster"));assert.equal(previewGroupUpgrade(fresh,10000000,1).member,"member1");
});
test("character specialization gate remains unlocked on switching, max benchmark unchanged",()=>{
 let g=initialRecruitGroup();assert.throws(()=>selectGroupClass(g,"member1","human","Knight","grimwarden"));
 g=selectGroupClass(g,"member1","orc","Raider","ragebreaker");assert.equal(g.member1.recruitment.level,1);
 assert.throws(()=>selectGroupClass(g,"member1","orc","Monk","ironfist"));
 g.member1.recruitment={active:true,level:19,xp:tacticRequiredXP(19)};g=activateGroupPractice(g);assert.ok(mainClassUnlocked(g.member1));assert.ok(!specializationUnlocked(g.member1));
 g=selectGroupClass(g,"member1","human","Warrior","blademaster");assert.throws(()=>selectGroupClass(g,"member1","human","Knight","grimwarden"));
 const prior=groupCombatAtTime(startGroupSession(g,shared,1,123,{rules:10}));assert.equal(prior.enemies[0].recruitLevel,20);assert.ok(prior.enemies[0].novice);
 g.member1.recruitment={active:true,level:29,xp:tacticRequiredXP(29)};g=activateGroupPractice(g);assert.ok(specializationUnlocked(g.member1));
 g=selectGroupClass(g,"member1","human","Knight","grimwarden");assert.equal(g.member1.recruitment.level,30);assert.equal(g.member1.classes.grimwarden.mastery.level,1);
 assert.equal(groupSnapshots(g,shared,10).member1.novice,undefined);assert.equal(activeGroupIds(maxRecruitment(g)).length,7);
});
test("public new recruit save roundtrip and historical full-roster save retained",()=>{
 const s=enterArena(newArenaManager(now,true),now,rand,now).state;
 assert.equal(activeGroupIds(s.battleGroup).length,1);assert.deepEqual(readArenaManager(JSON.stringify(s)),s);
 const end=enterArena(s,now+GROUP_BOUT_MS,rand,now).state;assert.equal(activeGroupIds(end.battleGroup).length,1);assert.deepEqual(readArenaManager(JSON.stringify(end)),end);assert.deepEqual(end.battleGroup.member2,s.battleGroup.member2);
 const old=enterArena(newArenaManager(now),now,rand,now).state;assert.equal(activeGroupIds(readArenaManager(JSON.stringify(old)).battleGroup).length,7);
});

test("race stage normalizes old selections without deleting progress; frozen legacy opponents retain old rule",()=>{
 let g=initialRecruitGroup();const old=structuredClone(g.member1.classes.oathkeeper);
 g.member1.recruitment.level=20;g=selectGroupClass(g,"member1","human","Warrior","blademaster");g.member1.recruitment.level=19;
 const retained=structuredClone(g.member1.classes.blademaster);g=normalizeRecruitChoices(g);
 assert.equal(g.member1.selected,basicRace("human").id);assert.deepEqual(g.member1.classes.oathkeeper,old);assert.deepEqual(g.member1.classes.blademaster,retained);
 const s=startGroupSession(g,shared,1,123,{rules:10});const r=groupCombatAtTime(s);assert.equal(r.enemies[0].recruitLevel,19);assert.equal(r.enemies[0].classId,basicRace(r.enemies[0].race).id);
 const legacy=structuredClone(s);delete legacy.players.member1.recruitLevel;delete legacy.stanceGate;assert.equal(groupCombatAtTime(legacy).enemies[0].recruitLevel,undefined);
});

import {GROUP_CLASSES} from "../site/play/battle-group-classes.mjs";
import {MAIN_CLASS_SKILLS,mainClassSkill,pilotKit} from "../site/play/class-kits.mjs";
import {resolveTeamBattle} from "../site/play/team-combat.mjs";
import {GROUP_ARENAS} from "../site/play/arenas.mjs";
test("every main class has one distinct automatic skill, exclusively at character levels 20–29",()=>{
 const classes=[...new Set(Object.values(GROUP_CLASSES).map(c=>c.mainClass))];
 assert.equal(Object.keys(MAIN_CLASS_SKILLS).length,classes.length);
 assert.equal(new Set(Object.values(MAIN_CLASS_SKILLS).map(a=>a.id)).size,classes.length);
 for(const c of Object.values(GROUP_CLASSES))for(const level of [1,19,20,29,30,50]){
  const a={classId:c.id,groupCombatRules:10,recruitLevel:level,novice:level<30};
  assert.equal(mainClassSkill(a),level>=20&&level<30?MAIN_CLASS_SKILLS[c.mainClass]:null);
  assert.equal(Boolean(pilotKit(a)),level>=30);
 }
 assert.equal(mainClassSkill({classId:"oathkeeper",groupCombatRules:10,novice:true}),null);
});
test("main-class strike is executed by both sides, obeys cooldown, and is replaced by specialist kit",()=>{
 let g=initialRecruitGroup();g.member1.recruitment.level=20;g=selectGroupClass(g,"member1","human","Warrior","blademaster");
 const a=groupSnapshots(g,shared,10).member1,terrain=GROUP_ARENAS.find(x=>x.id==="gatehouse_chamber"),levels={player:1,enemy:1,groupCombatRules:10};
 const result=resolveTeamBattle([a],[a],123,terrain,levels);
 const actions=result.events.filter(e=>e.type==="class_ability");
 assert.ok(actions.some(e=>e.actor==="player:0"));assert.ok(actions.some(e=>e.actor==="enemy:0"));
 assert.ok(actions.every(e=>e.ability==="basic_power_strike"));
 for(const side of ["player:0","enemy:0"]){const events=actions.filter(e=>e.actor===side);for(let i=1;i<events.length;i++)assert.ok(events[i].round-events[i-1].round>=MAIN_CLASS_SKILLS.Warrior.cooldown);}
 const novice={...a,recruitLevel:19},specialist={...a,recruitLevel:30};delete specialist.novice;
 assert.ok(resolveTeamBattle([novice],[novice],123,terrain,levels).events.every(e=>e.type!=="class_ability"));
 const specialistActions=resolveTeamBattle([specialist],[specialist],123,terrain,levels).events.filter(e=>e.type==="class_ability");
 assert.ok(specialistActions.length);assert.ok(specialistActions.every(e=>!e.ability.startsWith("basic_")));
});

import {beginTower} from "../site/play/endless-tower.mjs";
test("stance unlock is individual Lv 10, not Fighting level or class mastery",()=>{
 let g=syncRecruitment(initialRecruitGroup(),30);
 g.member1.recruitment.level=9;g.member1.classes[g.member1.selected].mastery.level=50;
 assert.equal(stanceUnlocked(g.member1),false);
 for(const stance of ["aggressive","defensive"])assert.throws(()=>selectGroupStance(g,"member1",stance),/locked stance/);
 assert.equal(selectGroupStance(g,"member1","balanced").member1.stance,"balanced");
 assert.throws(()=>selectGroupStance(initialRecruitGroup(),"member2","balanced"),/locked stance/);
 g.member1.stance="defensive";g.member1.stances.defensive={level:5,xp:10};
 const earned=structuredClone(g.member1.stances.defensive);
 assert.equal(groupSnapshots(g,shared,10).member1.tactic,"balanced");
 g=normalizeRecruitChoices(g);
 assert.equal(g.member1.stance,"balanced");assert.deepEqual(g.member1.stances.defensive,earned);
 g.member1.recruitment.xp=tacticRequiredXP(9);g=activateGroupPractice(g);
 assert.equal(g.member1.recruitment.level,10);assert.equal(stanceUnlocked(g.member1),true);
 for(const stance of ["aggressive","defensive","balanced"]){g=selectGroupStance(g,"member1",stance);assert.equal(groupSnapshots(g,shared,10).member1.tactic,stance);}
 assert.throws(()=>selectGroupStance(g,"member2","defensive"),/locked stance/);
 g=selectGroupStance(g,"member1","defensive");
 g=selectGroupClass(g,"member1","orc","Raider","ragebreaker");
 assert.equal(g.member1.stance,"defensive");assert.deepEqual(g.member1.stances.defensive,earned);
});
test("arena and tower rivals share stance gate; already frozen old bouts keep their choices",()=>{
 let g=initialRecruitGroup();g.member1.recruitment.level=9;
 let oldNonBalanced=0,unlockedNonBalanced=0;
 for(let seed=0;seed<16;seed++){
  const s=startGroupSession(g,shared,1,seed,{rules:10}),legacy={...s};delete legacy.stanceGate;
  const old=groupCombatAtTime(legacy),fresh=groupCombatAtTime(s);
  assert.equal(s.players.member1.tactic,"balanced");assert.equal(fresh.enemies[0].tactic,"balanced");
  oldNonBalanced+=Number(old.enemies[0].tactic!=="balanced");
  assert.deepEqual(groupCombatAtTime(structuredClone(legacy)),old);
  const ten=structuredClone(g);ten.member1.recruitment.level=10;
  const open=groupCombatAtTime(startGroupSession(ten,shared,1,seed,{rules:10}));
  unlockedNonBalanced+=Number(open.enemies[0].tactic!=="balanced");
 }
 assert.ok(oldNonBalanced>0&&unlockedNonBalanced>0);
 const s=enterArena(newArenaManager(now,true),now,rand,now).state;
 s.battleGroup=g;const tower=beginTower(s).tower.run;
 assert.equal(tower.frozen.players.member1.tactic,"balanced");
 assert.equal(tower.enemies[0].tactic,"balanced");
});
test("public stance gate survives save and reload at levels 9 and 10",()=>{
 let s=enterArena(newArenaManager(now,true),now,rand,now).state;
 s.battleGroup.member1.recruitment.level=9;
 assert.throws(()=>chooseArenaStance(s,"member1","aggressive",now,rand),/locked stance/);
 s.battleGroup.member1.recruitment.level=10;
 s=chooseArenaStance(s,"member1","aggressive",now,rand).state;
 assert.equal(readArenaManager(JSON.stringify(s)).battleGroup.member1.stance,"aggressive");
 assert.equal(readArenaManager(JSON.stringify(s)).battleGroup.member1.recruitment.level,10);
});
