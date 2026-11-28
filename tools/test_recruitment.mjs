import test from "node:test";
import assert from "node:assert/strict";
import {newArenaManager,enterArena,readArenaManager,chooseArenaClass} from "../site/play/arena-manager.mjs";
import {GROUP_IDS,activeGroupIds,initialRecruitGroup,syncRecruitment,mainClassUnlocked,specializationUnlocked,basicRace,normalizeRecruitChoices,selectGroupClass,groupSnapshots,awardGroupPractice,activateGroupPractice,previewGroupUpgrade,maxRecruitment} from "../site/play/battle-group.mjs";
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
 const legacy=structuredClone(s);delete legacy.players.member1.recruitLevel;assert.equal(groupCombatAtTime(legacy).enemies[0].recruitLevel,undefined);
});
