import test from "node:test";
import assert from "node:assert/strict";
import {GROUP_CLASSES,GROUP_CLASS_IDS,GROUP_RACES,groupMainClasses,groupSpecializations,resolveGroupClass} from "../site/play/battle-group-classes.mjs";
import {GROUP_IDS,initialBattleGroup,validBattleGroup,selectGroupClass,selectGroupStance,groupSnapshots,awardGroupPractice,activateGroupPractice,upgradeBattleGroup} from "../site/play/battle-group.mjs";
import {tacticRequiredXP} from "../site/play/manager-tactics.mjs";
import {equipmentPrice,SMITH_BALANCE} from "../site/play/smith.mjs";
const max={str:141,dex:141,end:129,skill:52,difficulty:7};
const change=(g,id,c)=>selectGroupClass(g,id,GROUP_CLASSES[c].race,GROUP_CLASSES[c].mainClass,c);
const practice=ms=>Object.fromEntries(GROUP_IDS.map(id=>[id,ms]));
test("five races, 31 unique paths, class-assigned kit, seven independent slots",()=>{
 assert.equal(GROUP_CLASS_IDS.length,31);assert.deepEqual(GROUP_RACES.map(r=>groupMainClasses(r).flatMap(c=>groupSpecializations(r,c)).length),[11,7,7,4,2]);
 const g=initialBattleGroup();assert.ok(validBattleGroup(g));assert.equal(Object.keys(g).length,7);
 for(const c of Object.values(GROUP_CLASSES)){
  assert.equal(resolveGroupClass(c.race,c.mainClass,c.id),c);assert.ok(Number.isInteger(c.ability.cooldown)&&c.ability.cooldown>0);
  const n=change(g,"member1",c.id);assert.ok(validBattleGroup(n));assert.equal(groupSnapshots(n,max).member1.classId,c.id);
  assert.deepEqual(n.member2,g.member2);
 }
 assert.throws(()=>selectGroupClass(g,"member1","elf","Warrior","blademaster"));
 assert.throws(()=>selectGroupStance(g,"member8","balanced"));
 assert.ok(validBattleGroup(JSON.parse(JSON.stringify(g))));
});
test("switches retain independent progress; credit frozen old class and stance only",()=>{
 let g=initialBattleGroup();const old=groupSnapshots(g,max);g=change(g,"member1","blademaster");g=selectGroupStance(g,"member1","defensive");
 const p=awardGroupPractice(g,old,practice(tacticRequiredXP(1)));assert.equal(p.member1.classes.oathkeeper.mastery.xp,tacticRequiredXP(1));
 assert.equal(p.member1.classes.blademaster.mastery.xp,0);assert.equal(p.member1.stances.defensive.xp,0);
 const active=activateGroupPractice(p);assert.equal(active.member1.classes.oathkeeper.mastery.level,1);
 assert.equal(active.member1.classes.oathkeeper.expertiseActive.sword_shield,0);
 const restored=activateGroupPractice(change(selectGroupStance(active,"member1","balanced"),"member1","oathkeeper"));
 assert.equal(restored.member1.classes.oathkeeper.mastery.level,2);assert.equal(restored.member1.stances.balanced.level,2);
 assert.ok(restored.member1.classes.oathkeeper.expertiseActive.sword_shield>0);
 assert.ok(validBattleGroup(restored));
});
test("max-grade automatic class equipment uses existing prices, no inactive upgrades",()=>{
 let g=change(initialBattleGroup(),"member1","blademaster");const treasury=7*(5*equipmentPrice({grade:7,quality:"masterwork"})+4*SMITH_BALANCE.firstArmourCost);
 for(const m of Object.values(g))m.classes[m.selected].mastery.level=50;
 const u=upgradeBattleGroup(g,treasury,52);assert.equal(u.coins,0);assert.equal(u.spent,treasury);
 assert.equal(u.upgrades.reduce((n,p)=>n+p.cost,0),treasury);assert.equal(u.pending,null);assert.ok(validBattleGroup(u.group));
 const s=groupSnapshots(u.group,max);
 for(const id of GROUP_IDS){assert.equal(Object.keys(s[id].trainingKit.equipment).length,5);assert.ok(Object.values(s[id].trainingKit.equipment).every(i=>i.grade===7&&i.quality==="masterwork"));}
 assert.deepEqual(u.group.member1.classes.oathkeeper,g.member1.classes.oathkeeper);assert.equal(g.member1.classes.blademaster.equipment.greatsword.grade,0);
});
test("no unaffordable or invalid equipment mutation",()=>{
 const g=initialBattleGroup(),u=upgradeBattleGroup(g,23,52);
 assert.equal(u.coins,23);assert.deepEqual(u.group,g);assert.equal(u.upgrades.length,0);
 const broken=structuredClone(g);broken.member1.selected="not_a_class";assert.equal(validBattleGroup(broken),false);
});
