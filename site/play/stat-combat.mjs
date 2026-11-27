// Individual stats combat v4 only. Central tuning; no save mutations.
import {CHARACTER_ATTRIBUTE_IDS} from "./character-attributes.mjs";
export const INDIVIDUAL_RULES_VERSION=4;
export const STAT_COMBAT_BALANCE=Object.freeze({damagePerPoint:.30,aimPerDEX:.012,speedMax:.45,speedHalf:90,critMax:.20,critHalf:90,evasionMax:.12,evasionHalf:100,mobilityMax:12,mobilityHalf:90,magicGuardMax:.45,magicGuardHalf:90,statusResistMax:.40,statusResistHalf:90,healingBase:.75,healingMaxBonus:.65,healingHalf:60});
const B=STAT_COMBAT_BALANCE,saturate=(n,max,half)=>max*n/(half+n);
export const validCombatAttributes=a=>Boolean(a&&typeof a==="object"&&!Array.isArray(a)&&Object.keys(a).length===6&&CHARACTER_ATTRIBUTE_IDS.every(k=>Number.isSafeInteger(a[k])&&a[k]>0&&a[k]<=1e6));
export const individualActor=a=>[INDIVIDUAL_RULES_VERSION,5,6].includes(a?.groupCombatRules)&&validCombatAttributes(a.attributes);
export const statAttack=(a,type)=>individualActor(a)?a.attributes[type==="magic"?"INT":"STR"]*B.damagePerPoint:a.str*.3;
export const statAim=(a,b,type)=>individualActor(a)?(type==="magic"?0:(a.attributes.DEX-b.attributes.DEX)*B.aimPerDEX):(a.dex-b.dex)*.012;
export const statSpeed=(a,type)=>individualActor(a)?saturate(a.attributes[type==="magic"?"WIT":"DEX"],B.speedMax,B.speedHalf):0;
export const statCrit=(a,type)=>individualActor(a)?saturate(a.attributes[type==="magic"?"WIT":"DEX"],B.critMax,B.critHalf):0;
export const statEvasion=a=>individualActor(a)?saturate(a.attributes.DEX,B.evasionMax,B.evasionHalf):0;
export const statMobility=a=>individualActor(a)?saturate(a.attributes.DEX,B.mobilityMax,B.mobilityHalf):0;
export const statMagicDamageFactor=(a,type)=>individualActor(a)&&type==="magic"?1-saturate(a.attributes.MEN,B.magicGuardMax,B.magicGuardHalf):1;
export const statHealing=a=>individualActor(a)?B.healingBase+saturate(a.attributes.INT,B.healingMaxBonus,B.healingHalf):1;
export const statStatusResistance=(a,type)=>individualActor(a)?saturate(a.attributes[type==="magic"?"MEN":"CON"],B.statusResistMax,B.statusResistHalf):0;
export const statStatusLands=(a,type,roll)=>!individualActor(a)||roll()>=statStatusResistance(a,type);
export const statInitiative=(a,type)=>individualActor(a)&&type==="magic"?a.attributes.WIT:a.dex;
