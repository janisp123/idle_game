import test from "node:test";
import assert from "node:assert/strict";
import {initialGroupRank,advanceGroupRank,rankProfile} from "../site/play/battle-group-rank.mjs";
import {initialBattleGroup,selectGroupClass,upgradeBattleGroup} from "../site/play/battle-group.mjs";
import {startGroupSession,groupCombatAtTime,groupPrizeGrade} from "../site/play/battle-group-timeline.mjs";
import {groupProgressRows} from "../site/play/battle-group-progress-view.mjs";
const max={str:141,dex:141,end:129,skill:52,difficulty:7};
test("rank rises on three wins and drops on two defeats; draw resets streak",()=>{
 let r=initialGroupRank(7);r=advanceGroupRank(r,"defeat");assert.equal(r.grade,7);
 r=advanceGroupRank(r,"defeat");assert.equal(r.grade,6);
 for(let i=0;i<3;i++)r=advanceGroupRank(r,"victory");assert.equal(r.grade,7);
 assert.equal(advanceGroupRank({grade:6,streak:-1},"double_death").streak,0);
});
test("new class cannot buy advanced grade even with veteran treasury; old kit retained",()=>{
 let g=initialBattleGroup();g.member3.classes.longshot.mastery.level=50;
 g=upgradeBattleGroup(g,30000000,52).group;const old=structuredClone(g.member3.classes.longshot);
 assert.equal(old.equipment.bow.grade,7);
 g=selectGroupClass(g,"member3","human","Wizard","flameweaver");
 g=upgradeBattleGroup(g,30000000,52).group;
 assert.equal(g.member3.classes.flameweaver.equipment.bow.grade,0);
 assert.deepEqual(g.member3.classes.longshot,old);
 const row=groupProgressRows(g)[2];assert.equal(row.level,1);assert.equal(row.weaponItem.grade,0);assert.equal(row.nextGrade.level,5);
});
test("independent endgame opponent bracket does not weaken after player class switch",()=>{
 const g=initialBattleGroup(),seed=20261127,r=initialGroupRank(7);
 const a=startGroupSession(g,max,50,seed,{rank:r}),b=startGroupSession(selectGroupClass(g,"member3","human","Wizard","flameweaver"),max,50,seed,{rank:r});
 assert.deepEqual(groupCombatAtTime(a).enemies,groupCombatAtTime(b).enemies);
 assert.equal(groupPrizeGrade(a),7);assert.equal(rankProfile(7).shared.skill,52);
 for(const e of groupCombatAtTime(a).enemies){assert.equal(e.classLevel,50);assert.ok(Object.values(e.trainingKit.equipment).every(i=>i.grade===7&&i.quality==="masterwork"));}
});
