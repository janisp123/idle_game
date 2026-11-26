import * as m0 from "../site/play/armour.mjs";
import * as m1 from "../site/play/difficulty.mjs";
import * as m2 from "../site/play/combat-skills.mjs";
import * as m3 from "../site/play/expertise.mjs";
import * as m4 from "../site/play/arenas.mjs";
import * as m5 from "../site/play/smith.mjs";
import * as m6 from "../site/play/physical-duel.mjs";
import * as m7 from "../site/play/combat-verdict.mjs";
import * as m8 from "../site/play/combat-art.mjs";
import * as m9 from "../site/play/combat.mjs";
import * as m10 from "../site/play/arena-wallet.mjs";
import * as m11 from "../site/play/attributes.mjs";
import * as m12 from "../site/play/loot.mjs";
import * as m13 from "../site/play/production.mjs";
import * as m14 from "../site/play/apprentice.mjs";
import * as m15 from "../site/play/auto-fight.mjs";
import * as m16 from "../site/play/engine.mjs";
const modules={"armour":m0,"difficulty":m1,"combat-skills":m2,"expertise":m3,"arenas":m4,"smith":m5,"physical-duel":m6,"combat-verdict":m7,"combat-art":m8,"combat":m9,"arena-wallet":m10,"attributes":m11,"loot":m12,"production":m13,"apprentice":m14,"auto-fight":m15,"engine":m16};
function test(modules){
 const {engine:e,combat:c,expertise:x,"auto-fight":p,"arena-wallet":w}=modules;
 let checks=0;const check=(ok,label)=>{checks++;if(!ok)throw Error(label)};
 const eq=(a,b,label)=>check(JSON.stringify(a)===JSON.stringify(b),label);
 const r=()=>.5;
 function fixture(stage,outcome,streak=0,blocked=-1,strong=false){
  let s=e.chooseActivity(e.newGame(0),"fighting",0,r).state;
  s={...s,skills:{...s.skills,fighting:{level:50,xp:0}},difficulties:{fighting:stage},autoFight:{...p.initialAutoFight(stage),streak,blocked}};
  if(strong){const gear=Object.fromEntries(Object.keys(s.equipment).map(k=>[k,{grade:7,quality:"masterwork"}]));s={...s,equipment:gear,expertise:x.fullExpertise(),expertiseActive:x.fullExpertise()};}
  const player=e.desiredArenaPlayer(s);
  for(let seed=1;seed<2000;seed++){
   const session={...c.startCombatSession(player,seed),elapsedMs:c.BOUT_MS-500,prizeCursor:0};
   const o=c.combatAtTime(session).outcome;
   if(o===outcome||outcome==="loss"&&o!=="victory")return {...s,combatSession:session};
  }throw Error("no fixture "+stage+"/"+outcome);
 }
 const f=fixture(0,"victory",2);
 const a=e.settleLive(f,499,r);eq(a.state.autoFight,f.autoFight,"partial no progression");check(a.state.coins===f.coins,"partial no payout");
 const b=e.settleLive(a.state,501,r);check(b.state.autoFight.stage===1&&b.state.autoFight.highest===0&&b.state.autoFight.streak===0,"online advance");check(b.state.coins-f.coins===w.arenaReward(0),"old grade prize");check(b.state.combatSession.player.difficulty===1&&b.state.combatSession.elapsedMs===c.BOUT_MS+1,"next grade remainder");
 const saved=e.readSave(JSON.stringify(b.state));check(saved!==null,"live save read");eq(saved.autoFight,b.state.autoFight,"persist policy");
 const again=e.settleLive(saved,501,r);eq(again.state.autoFight,saved.autoFight,"same clock no repeat");check(again.state.coins===saved.coins,"no duplicate prize");
 const offline=e.enterGame(f,501,r);eq(offline.state.autoFight,f.autoFight,"offline streak frozen");check(offline.state.coins-f.coins===w.arenaReward(0)&&offline.state.combatSession.player.difficulty===0,"offline fixed prize");
 const long=e.settleLive(f,10001,r);eq(long.state.autoFight,f.autoFight,"oversized live fallback");
 const lost=fixture(1,"loss",0,-1);
 const l=e.settleLive(lost,500,r);check(l.state.autoFight.stage===0&&l.state.autoFight.blocked===1&&l.state.coins===lost.coins,"live loss retreat");check(l.state.combatSession.player.difficulty===0,"next stage snapshot");
 const lo=e.enterGame(lost,500,r);eq(lo.state.autoFight,lost.autoFight,"offline loss cannot retreat");
 const retry=fixture(0,"victory",9,1);
 check(e.settleLive(retry,500,r).state.autoFight.stage===1,"retry tenth");
 const capped={...f,skills:{...f.skills,fighting:{level:50,xp:e.xpToNextLevel(50)}}};
 const cap=e.settleLive(capped,1000,r);eq(cap.state.autoFight,capped.autoFight,"cap no policy");check(cap.state.coins===capped.coins&&cap.state.combatSession.elapsedMs===capped.combatSession.elapsedMs,"cap no payout");
 const close={...f,progressMs:e.ACTIVITIES.fighting.durationMs-100,skills:{...f.skills,fighting:{level:50,xp:e.xpToNextLevel(50)-1}}};
 const cp=e.settleLive(close,500,r);check(e.activityRewardCapped(cp.state),"probe reaches cap");eq(cp.state.autoFight,f.autoFight,"discarded cap probe no advance");check(cp.state.coins===f.coins,"discarded cap probe no payout");
 const legacy={...lost,difficulties:{fighting:2}};delete legacy.autoFight;const migrated=e.readSave(JSON.stringify(legacy));check(migrated?.autoFight.stage===1&&migrated.difficulties.fighting===1,"legacy in-flight grade");
 check(e.readSave({...f,autoFight:{...f.autoFight,streak:10}})===null,"invalid save policy");
 check(e.readSave({...f,difficulties:{fighting:1}})===null,"stage mismatch rejected");
 let threw=false;try{e.setDifficulty(f,"fighting",1,0,r)}catch{threw=true}check(threw,"manual fighting blocked");
 const multi=e.enterGame(lost,365*86400000,r);eq(multi.state.autoFight,lost.autoFight,"year offline frozen");check(multi.offlineArena.sampledBouts<=256&&e.activityRewardCapped(multi.state),"bounded long offline cap");
 const leave=e.requestActivityChange(f,"training",0,r).state;
 const q=e.settleLive(leave,500,r);check(q.state.autoFight.stage===1&&q.state.transition?.phase==="moving","live finishing queue advances");const qo=e.enterGame(leave,500,r);eq(qo.state.autoFight,f.autoFight,"offline finishing queue frozen");
 return {checks};
}
console.log(JSON.stringify(test(modules)));
