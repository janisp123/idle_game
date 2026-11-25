import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame, SKILL_IDS, xpToNextLevel } from "../../site/play/engine.mjs";
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
