import test from "node:test";
import assert from "node:assert/strict";
import {GROUP_CLASSES,usesStaff} from "../site/play/battle-group-classes.mjs";
import {initialBattleGroup,GROUP_IDS,selectGroupClass,validBattleGroup,migrateGroupWeapons,groupSnapshots,awardGroupPractice} from "../site/play/battle-group.mjs";
import {classWeapon} from "../site/play/battle-group-actions.mjs";
import {startGroupSession,groupCombatAtTime,validGroupSession} from "../site/play/battle-group-timeline.mjs";
import {newArenaManager,enterArena,readArenaManager} from "../site/play/arena-manager.mjs";
import {fighter} from "../site/play/physical-actions.mjs";
import {WEAPON_PIECES} from "../site/play/armour.mjs";
const shared={str:1,dex:1,end:1,skill:1,difficulty:0};
const casters=["flameweaver","gravebinder","beastcaller","lifekeeper","runesage","frostweaver","spiritcaller","wellspring","galescourge","shadebinder","bloodsage","hexchief","warcaller"];
test("all 13 magical classes use one actual two-handed staff; physical classes unchanged",()=>{
 assert.deepEqual(Object.keys(GROUP_CLASSES).filter(usesStaff),casters);
 assert.equal(WEAPON_PIECES.staff.length,1);assert.equal(GROUP_CLASSES.forgecaller.loadout,"hammer");assert.equal(GROUP_CLASSES.longshot.loadout,"bow");
 for(const id of casters){const c=GROUP_CLASSES[id],g=selectGroupClass(initialBattleGroup(),"member1",c.race,c.mainClass,id),s=groupSnapshots(g,shared,10).member1;
  assert.equal(c.weaponLabel,"Two-handed staff");assert.equal(s.loadout,"staff");assert.equal(s.condition.weapon.itemId,"staff");assert.equal(s.condition.shield,null);assert.equal(fighter(s,"player").arrows,0);assert.equal(classWeapon(s).type,"magic");assert.ok(validBattleGroup(g));assert.ok(g.member1.classes[id].equipment.staff);
 }
});
test("existing caster gear and active/pending practice migrate exactly once; legacy snapshots retained",()=>{
 const g=initialBattleGroup(),p=g.member4.classes.flameweaver;p.equipment={bow:{grade:3,quality:"fine"}};delete p.expertise.staff;delete p.expertiseActive.staff;p.expertise.bow=123456;p.expertiseActive.bow=100000;
 assert.ok(validBattleGroup(g));const migrated=migrateGroupWeapons(g),m=migrated.member4.classes.flameweaver;
 assert.deepEqual(m.equipment.staff,p.equipment.bow);assert.equal(m.expertise.staff,123456);assert.equal(m.expertiseActive.staff,100000);assert.equal(m.expertise.bow,0);assert.deepEqual(migrated.member3,g.member3);assert.equal(migrateGroupWeapons(migrated),migrated);
 const old=startGroupSession(g,shared,1,123,{rules:10,staffEquipment:false});assert.equal(old.players.member4.loadout,"bow");assert.ok(validGroupSession(old));const before=groupCombatAtTime(old),after=groupCombatAtTime(structuredClone(old));assert.deepEqual(before,after);assert.equal(old.staffEquipment,undefined);
 const practiced=awardGroupPractice(migrated,old.players,Object.fromEntries(GROUP_IDS.map(id=>[id,id==="member4"?100:0])));assert.equal(practiced.member4.classes.flameweaver.expertise.staff,123856);
 const next=startGroupSession(practiced,shared,1,123,{rules:10});assert.equal(next.staffEquipment,true);assert.equal(next.players.member4.loadout,"staff");
 const s=enterArena(newArenaManager(1000),1000,()=>.5,1000).state;const save={...s,battleGroup:g,combatSession:old,coins:9876};
 const read=readArenaManager(JSON.stringify(save));assert.ok(read);assert.equal(read.coins,9876);assert.deepEqual(read.combatSession,old);assert.deepEqual(read.battleGroup,migrated);
});
