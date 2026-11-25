import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, SKILL_IDS, xpToNextLevel, queueStartActivity, queueInsertTimedActivity, queueCapacity, readSave, settle, requestActivityChange, MINUTE_MS, UNTIL_LEVEL_UP, DAY_MS } from "../../site/play/engine.mjs";
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
