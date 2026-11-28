import test from "node:test";
import assert from "node:assert/strict";
import {newArenaManager,enterArena,settleArenaLive,readArenaManager,startArenaTower,startArenaRaid,chooseArenaClass} from "../site/play/arena-manager.mjs";
import {towerProgress,towerDifficulty,raidUnlocked,resolveTower,TOWER_ATTEMPT_MS} from "../site/play/endless-tower.mjs";
const now=1800000000000,rand=()=>.5;
const fresh=()=>enterArena(newArenaManager(now),now,rand,now).state;
test("tower unlocks raids at exact permanent milestones and difficulty continues after 50",()=>{
 const s=fresh();assert.equal(s.tower.highest,0);for(const level of [10,20,30,40,50]){
  const locked={...s,tower:{...s.tower,highest:level-1}},unlocked={...s,tower:{...s.tower,highest:level}};
  assert.equal(raidUnlocked(locked,level),false);assert.deepEqual(startArenaRaid(locked,level,now,rand).state,locked);assert.equal(raidUnlocked(unlocked,level),true);
 }
 assert.equal(towerDifficulty(50).grade,7);assert.ok(towerDifficulty(100).factor>towerDifficulty(50).factor);
 const old={...s,raidBuff:{level:30,expiresAtMs:now+86400000}};delete old.tower;
 assert.equal(towerProgress(old).highest,0);assert.equal(raidUnlocked(old,30),true);assert.equal(raidUnlocked(old,40),false);
 assert.equal(enterArena(old,now,rand,now).state.tower.legacyAccess,30);
});
test("tower floor attempt freezes and persists, settles exactly once, pauses normal combat and cannot overlap raids",()=>{
 const s=fresh(),start=startArenaTower(s,now,rand).state,r=start.tower.run;assert.equal(r.floor,1);
 assert.deepEqual(startArenaTower(start,now,rand).state,start);
 assert.deepEqual(startArenaRaid(start,10,now,rand).state,start);
 assert.deepEqual(chooseArenaClass(start,"member1","human","Rogue","longshot",now,rand).state,start);
 const mid=settleArenaLive(start,now+TOWER_ATTEMPT_MS/2,rand,now).state;
 assert.deepEqual(mid.combatSession,start.combatSession);assert.equal(mid.coins,start.coins);
 const restored=readArenaManager(JSON.stringify(mid));assert.deepEqual(restored,mid);
 const result=resolveTower(r),end=now+TOWER_ATTEMPT_MS,done=enterArena(restored,end,rand,now);
 assert.equal(done.towerFinished.outcome,result.outcome);assert.equal(done.state.tower.highest,Number(result.outcome==="victory"));assert.equal(done.state.tower.run,null);
 assert.equal(done.towerFinished.coins,result.outcome==="victory"?5:0);
 assert.equal(done.state.coins+(done.autoEquipment?.spent??0),mid.coins+done.towerFinished.coins);
 const repeat=enterArena(readArenaManager(JSON.stringify(done.state)),end,rand,now);assert.equal(repeat.towerFinished,undefined);assert.equal(repeat.state.coins,done.state.coins);
 const next=startArenaTower(repeat.state,end,rand).state;assert.equal(next.tower.run.floor,done.state.tower.highest+1);
 const broken=structuredClone(next);broken.tower.run.floor+=2;assert.equal(readArenaManager(JSON.stringify(broken)),null);
});
