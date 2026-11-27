// Equal, positive arena weights; pure helpers shared by local and future PvP.
import {GROUP_ARENAS} from "./arenas.mjs?v=bal-002";
export const ARENA_FAVORITE_LIMIT=3;
export const ARENA_PREFERENCE_LOCK_MS=86400000;
const ids=GROUP_ARENAS.map(a=>a.id);
const time=n=>Number.isSafeInteger(n)&&n>=0;
export function validArenaFavorites(favorites){
 return Array.isArray(favorites)&&(favorites.length===0||favorites.length===ARENA_FAVORITE_LIMIT)&&new Set(favorites).size===favorites.length&&favorites.every(id=>ids.includes(id));
}
export function validArenaPreferences(p){
 return Boolean(p&&typeof p==="object"&&!Array.isArray(p)&&Object.keys(p).length===2&&validArenaFavorites(p.favorites)&&p.favorites.length===3&&time(p.changedAtMs)&&p.changedAtMs<=Number.MAX_SAFE_INTEGER-ARENA_PREFERENCE_LOCK_MS);
}
export function preferenceUnlockAt(p){return p?p.changedAtMs+ARENA_PREFERENCE_LOCK_MS:0;}
export function saveArenaPreferences(previous,favorites,now){
 if(previous!==undefined&&!validArenaPreferences(previous)||!validArenaFavorites(favorites)||favorites.length!==3||!time(now)||now>Number.MAX_SAFE_INTEGER-ARENA_PREFERENCE_LOCK_MS)throw new RangeError("Invalid arena preferences");
 if(now<preferenceUnlockAt(previous))throw new RangeError("Arena preferences are locked for 24 hours");
 return {favorites:ids.filter(id=>favorites.includes(id)),changedAtMs:now};
}
// Integer tenths of a percentage point: 125 baseline, 225 favorite, 65 other.
export function arenaPreferenceWeights(favorites=[]){
 if(!validArenaFavorites(favorites))throw new RangeError("Invalid arena favorites");
 return ids.map(id=>favorites.length===0?125:favorites.includes(id)?225:65);
}
// Omit enemy for NPC matchmaking; explicitly [] is a neutral PvP opponent.
export function arenaMatchWeights(player=[],enemy){
 const a=arenaPreferenceWeights(player);
 if(enemy===undefined)return a;
 const b=arenaPreferenceWeights(enemy);
 return a.map((n,i)=>(n+b[i])/2);
}
export function choosePreferredGroupArena(player,random,enemy){
 const weights=arenaMatchWeights(player,enemy),r=random();
 if(!Number.isFinite(r)||r<0||r>=1)throw new RangeError("Invalid arena random roll");
 let ticket=r*1000;
 for(let i=0;i<weights.length;i++){ticket-=weights[i];if(ticket<0)return GROUP_ARENAS[i];}
 return GROUP_ARENAS.at(-1);
}
