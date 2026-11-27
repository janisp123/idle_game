import test from "node:test";
import assert from "node:assert/strict";
import {GROUP_ARENAS} from "../site/play/arenas.mjs";
import {arenaPreferenceWeights,arenaMatchWeights,choosePreferredGroupArena,saveArenaPreferences,preferenceUnlockAt,ARENA_PREFERENCE_LOCK_MS} from "../site/play/arena-preferences.mjs";
import {newArenaManager,readArenaManager,settleArenaLive,chooseArenaPreferences} from "../site/play/arena-manager.mjs";
import {groupCombatAtTime} from "../site/play/battle-group-timeline.mjs";
const ids=GROUP_ARENAS.map(a=>a.id),a=ids.slice(0,3),b=ids.slice(2,5);
test("exact preference weights and symmetric PvP for every pair of three-zone choices",()=>{
 const combos=[];for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)for(let k=j+1;k<8;k++)combos.push([ids[i],ids[j],ids[k]]);
 assert.deepEqual(arenaPreferenceWeights(),Array(8).fill(125));
 assert.deepEqual(arenaPreferenceWeights(a),[225,225,225,65,65,65,65,65]);
 assert.deepEqual(arenaMatchWeights(a,b),[145,145,225,145,145,65,65,65]);
 for(const x of combos)for(const y of combos){const w=arenaMatchWeights(x,y);assert.deepEqual(w,arenaMatchWeights(y,x));assert.equal(w.reduce((n,v)=>n+v,0),1000);assert.ok(w.every(v=>v>=65&&v<=225));}
 for(const [x,y] of [[a,undefined],[a,b],[[],[]]]){const counts=Object.fromEntries(ids.map(id=>[id,0]));for(let i=0;i<1000;i++)counts[choosePreferredGroupArena(x,()=>(i+.5)/1000,y).id]++;assert.deepEqual(Object.values(counts),arenaMatchWeights(x,y));}
});
test("favorites require exactly three distinct valid IDs; rolling 24h lock",()=>{
 const t=1000000,p=saveArenaPreferences(undefined,a,t);
 for(const invalid of [[],[ids[0],ids[0],ids[1]],ids.slice(0,4),["bad",ids[1],ids[2]]])assert.throws(()=>saveArenaPreferences(undefined,invalid,t));
 assert.throws(()=>saveArenaPreferences(p,b,t-1));assert.throws(()=>saveArenaPreferences(p,b,preferenceUnlockAt(p)-1));
 assert.deepEqual(saveArenaPreferences(p,b,t+ARENA_PREFERENCE_LOCK_MS).favorites,b);
});
test("saved public preferences survive reload and activate only at a live battle boundary",()=>{
 const t=2026112700,rand=()=>.5;let s=settleArenaLive(newArenaManager(t),t+5000,rand).state;
 const old=s.combatSession,preview=groupCombatAtTime(old);
 s=chooseArenaPreferences(s,a,t+5000,1000000,rand).state;
 assert.deepEqual(s.combatSession,old);assert.deepEqual(groupCombatAtTime(s.combatSession),preview);
 assert.deepEqual(readArenaManager(JSON.stringify(s)),s);
 assert.throws(()=>chooseArenaPreferences(s,b,t+5000,1000001,rand));
 const corrupt={...s,arenaPreferences:{favorites:["bad",ids[1],ids[2]],changedAtMs:0}};assert.equal(readArenaManager(JSON.stringify(corrupt)),null);
 const mid=settleArenaLive(s,t+9000,rand).state;assert.deepEqual(mid.combatSession.arenaFavorites,old.arenaFavorites);
 const next=settleArenaLive(mid,t+10001,rand).state;assert.deepEqual(next.combatSession.arenaFavorites,a);
});
