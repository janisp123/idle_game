import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, SKILL_IDS, xpToNextLevel, enterGame, enterGameWithApprentice, setAutoMasterConsent, learnFromMaster, chooseActivity, queueStartActivity, queueInsertTimedActivity, queueCapacity, readSave, settle, requestActivityChange, MINUTE_MS, UNTIL_LEVEL_UP, DAY_MS } from "../../site/play/engine.mjs";
import { earnedActivityLevels, apprenticeProgress } from "../../site/play/apprentice.mjs";
test("only activated levels count, fresh characters have one slot",()=>{
  const s=newGame(0);
  for(const id of SKILL_IDS)s.skills[id].xp=xpToNextLevel(1);
  s.skills.forged={level:9999,xp:0};
  assert.equal(earnedActivityLevels(s,SKILL_IDS),0);
  assert.deepEqual(apprenticeProgress(s,SKILL_IDS),{earnedLevels:0,slots:1,nextSlotAt:10,autoMasterUnlocked:false,autoMasterAt:50});
});
test("boundary unlocks, no starting levels counted, no slot growth beyond five",()=>{
  for(const [earned,slots,next,master] of [[0,1,10,false],[9,1,10,false],[10,2,20,false],[19,2,20,false],[20,3,30,false],[29,3,30,false],[30,4,40,false],[39,4,40,false],[40,5,null,false],[49,5,null,false],[50,5,null,true],[500,5,null,true]]){
    const s=newGame(0);
    s.skills.fighting.level=earned+1;
    assert.deepEqual(apprenticeProgress(s,SKILL_IDS),{earnedLevels:earned,slots,nextSlotAt:next,autoMasterUnlocked:master,autoMasterAt:50});
  }
});
test("distributed earned levels count equally and policy does not mutate the save",()=>{
  const s=newGame(0);
  s.skills.mining.level=6;s.skills.fishing.level=6;
  const before=JSON.stringify(s);
  assert.equal(apprenticeProgress(s,SKILL_IDS).slots,2);
  assert.equal(JSON.stringify(s),before);
  s.skills.mining.level=0;
  assert.throws(()=>earnedActivityLevels(s,SKILL_IDS),RangeError);
});

test("actual scheduling gates reject both add paths until required earned levels",()=>{
  for(const [earned,slots] of [[0,1],[9,1],[10,2],[19,2],[20,3],[29,3],[30,4],[39,4],[40,5],[100,5]]){
    let s=newGame(0);s.skills.fishing.level=earned+1;
    const ids=["mining","hunting","foraging","woodcutting","training","construction"];
    s=queueStartActivity(s,ids[0],null,0,()=>.5).state;
    assert.equal(queueCapacity(s),slots);
    for(let i=1;i<slots;i++)s=queueStartActivity(s,ids[i],MINUTE_MS,0,()=>.5).state;
    assert.equal(s.wagons.length,slots);
    assert.throws(()=>queueStartActivity(s,ids[slots],MINUTE_MS,0,()=>.5),RangeError);
    assert.throws(()=>queueInsertTimedActivity(s,ids[slots],MINUTE_MS,0,()=>.5),RangeError);
    assert.deepEqual(readSave(JSON.stringify(s)),s);
    const override=requestActivityChange(s,"cooking",0,()=>.5).state;
    assert.equal(override.wagons.length,1);
  }
});
test("five slots settle chronologically to capped final activity without lost offline time",()=>{
  let s=newGame(0);s.skills.fishing.level=41;
  const ids=["mining","hunting","foraging","woodcutting","training"];
  for(const [i,id] of ids.entries())s=queueStartActivity(s,id,i?UNTIL_LEVEL_UP:null,0,()=>.5).state;
  const out=settle(readSave(JSON.stringify(s)),DAY_MS*365*20,()=>.5);
  assert.equal(out.state.settledAtMs,DAY_MS*365*20);
  assert.equal(out.state.activity,"training");
  assert.deepEqual(out.state.wagons,[{activity:"training",plannedMs:null}]);
  for(const id of ids)assert.equal(out.state.skills[id].xp,xpToNextLevel(1));
  assert.deepEqual(out.reports.map(r=>r.activity),ids);
  assert.equal(settle(out.state,out.state.settledAtMs,()=>.5).report.completed,0);
});
test("legacy valid over-capacity route survives; additional slots are denied",()=>{
  let s=newGame(0);s.skills.fishing.level=21;
  for(const [i,id] of ["mining","hunting","training"].entries())s=queueStartActivity(s,id,i?UNTIL_LEVEL_UP:null,0,()=>.5).state;
  s.skills.fishing.level=1;
  const restored=readSave(JSON.stringify(s));
  assert.equal(queueCapacity(restored),1);
  assert.deepEqual(restored.wagons,s.wagons);
  assert.throws(()=>queueInsertTimedActivity(restored,"foraging",MINUTE_MS,0,()=>.5),RangeError);
  const out=settle(restored,DAY_MS,()=>.5);
  assert.equal(out.state.activity,"training");
  assert.equal(out.state.wagons.length,1);
});

test("auto-Master requires earned 50 and explicit current-policy consent",()=>{
  let s=newGame(0);s.skills.fishing.level=50;s.skills.mining.xp=xpToNextLevel(1);s.items.stone=9;
  assert.throws(()=>setAutoMasterConsent(s,true),RangeError);
  assert.equal(enterGameWithApprentice({...s,apprenticeMasterConsent:1},0,()=>.5).state.skills.mining.level,1);
  s.skills.fishing.level=51;
  assert.equal(enterGameWithApprentice(s,0,()=>.5).state.skills.mining.level,1);
  const old={...s};delete old.apprenticeMasterConsent;
  assert.equal(readSave(old).apprenticeMasterConsent,0);
  for(const invalid of [true,2,"1",null,{}])assert.equal(readSave({...s,apprenticeMasterConsent:invalid}).apprenticeMasterConsent,0);
  s=setAutoMasterConsent(s,true);
  assert.equal(readSave(JSON.stringify(s)).apprenticeMasterConsent,1);
  assert.equal(setAutoMasterConsent(s,false).apprenticeMasterConsent,0);
  assert.equal(enterGame(s,0,()=>.5).state.skills.mining.level,1);
});
test("login auto-Master uses identical tribute and claims each ready skill once",()=>{
  let s=newGame(0);s.skills.fishing.level=51;
  s.skills.mining.xp=xpToNextLevel(1);s.skills.training.xp=xpToNextLevel(1);
  s.items.stone=25;s.items.iron_ore=4;s.items.log=12;s.coins=44;
  s=setAutoMasterConsent(s,true);
  const manual=learnFromMaster(s,0,()=>.5);
  const out=enterGameWithApprentice(s,0,()=>.5);
  assert.deepEqual(out.state,manual.state);
  assert.deepEqual(out.mastery,manual.mastery);
  assert.deepEqual(out.levelsGained,{mining:1,training:1});
  assert.equal(out.state.items.stone,0);assert.equal(out.state.items.iron_ore,0);
  assert.equal(out.state.items.log,12);assert.equal(out.state.coins,44); // insufficient for the first mandatory upgrade
  const again=enterGameWithApprentice(readSave(JSON.stringify(out.state)),0,()=>.5);
  assert.equal(again.mastery,undefined);assert.deepEqual(again.state,out.state);
});
test("long offline catch-up settles at old cap, then claims without retroactive work",()=>{
  let s=newGame(0);s.skills.fishing.level=51;s=setAutoMasterConsent(s,true);
  s=chooseActivity(s,"mining",0,()=>.5).state;
  const ordinary=enterGame(s,20*365*DAY_MS,()=>.5);
  const out=enterGameWithApprentice(s,20*365*DAY_MS,()=>.5);
  assert.equal(out.state.skills.mining.level,2);assert.equal(out.state.skills.mining.xp,0);
  assert.equal(out.state.settledAtMs,ordinary.state.settledAtMs);
  assert.deepEqual(out.reports,ordinary.reports);
  assert.deepEqual(out.state.attributeEffort,ordinary.state.attributeEffort);
  assert.equal(out.mastery.tribute.stone,ordinary.state.items.stone);
  assert.equal(out.state.items.stone,0);
  assert.deepEqual(out.state.wagons,ordinary.state.wagons);
});
