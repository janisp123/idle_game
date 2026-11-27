// RAID-001: provisional encounter and reward tuning. No dependencies on saves.
export const RAID_RULES_VERSION=1;
export const RAID_BUFF_MS=24*60*60*1000;
export const RAID_ROUND_MS=5000;
export const RAID_MAX_ROUNDS=120;
const member=(name,classId)=>Object.freeze({name,classId});
const boss=(name,classId)=>member(name,classId);
const rows=[
 [10,2,"walled_courtyard","physical",.35,9,200,0,0,boss("Ironjaw the Exiled","scrapbreaker"),[
 member("Rustplate Bulwark","oathkeeper"),member("Ashfang Marauder","ragebreaker"),member("Chainbreaker","linebreaker"),member("Soot Hexer","hexchief"),member("Cinder Mendicant","lifekeeper"),member("Ironhide Hound","beastcaller")]],
 [20,3,"ruined_streets","magic",.40,15,500,.02,0,boss("Varkhul the Defiler","gravebinder"),[
 member("Void Warden","dreadguard"),member("Gloom Stalker","nightblade"),member("Dusk Archer","blackbow"),member("Rot Priest","bloodsage"),member("Hollow Familiar","shadebinder"),member("Ashen Chanter","warcaller")]],
 [30,4,"open_field","ranged",.40,16,1000,.04,.02,boss("The Crimson Queen","flameweaver"),[
 member("Ruby Guard","grimwarden"),member("Silkblade","trickblade"),member("Scarlet Huntress","windbow"),member("Crimson Oracle","wellspring"),member("Roseblade Dancer","war_dancer"),member("Ember Hound","beastcaller")]],
 [40,6,"gatehouse_chamber","melee",.40,15,2000,.06,.05,boss("Malakar the Hollow","dreadguard"),[
 member("Crypt Sentinel","grovewarden"),member("Tomb Reaver","blademaster"),member("Wraith Archer","longshot"),member("Frost Revenant","frostweaver"),member("Bone Mender","spiritcaller"),member("Sepulchral Smith","forgecaller")]],
 [50,7,"narrow_bridge","mixed",.20,9,4000,.10,.10,boss("Tharagon the Eternal","blademaster"),[
 member("Grave Sentinel","oathkeeper"),member("Soul Binder","galescourge"),member("Bone Archer","blackbow"),member("Dread Knight","grimwarden"),member("Blood Priest","bloodsage"),member("Crypt Stalker","swiftblade")]]
];
export const RAID_CATALOG=Object.freeze(Object.fromEntries(rows.map(([level,grade,arenaId,resistance,resistFraction,bossHP,coins,damage,defence,b,crew])=>[level,Object.freeze({level,grade,arenaId,resistance,resistFraction,bossHP,coins,bonus:Object.freeze({xp:.10,damage,defence}),boss:b,crew:Object.freeze(crew)})])));
export const RAID_LEVELS=Object.freeze(rows.map(r=>r[0]));
export const RAID_MONSTER_BALANCE=Object.freeze({bossDamage:.65,crewDamage:.55,crewHP:.85,crewGradeOffset:1});
const count=n=>Number.isSafeInteger(n)&&n>=0;
export const raidDefinition=level=>{if(!RAID_LEVELS.includes(level))throw new RangeError("Unknown raid");return RAID_CATALOG[level];};
export const validRaidBuff=b=>b===null||Boolean(b&&RAID_LEVELS.includes(b.level)&&count(b.expiresAtMs));
export function activeRaidBuff(buff,now){if(!validRaidBuff(buff)||!count(now))throw new RangeError("Invalid raid blessing");return buff&&now<buff.expiresAtMs?buff:null;}
export function raidBonus(buff,now){const b=activeRaidBuff(buff,now);return b?raidDefinition(b.level).bonus:Object.freeze({xp:0,damage:0,defence:0});}
export function raidVictoryBuff(current,level,finishedAtMs){
 raidDefinition(level);const active=activeRaidBuff(current,finishedAtMs);
 if(active&&active.level>level)return active;
 const expiresAtMs=finishedAtMs+RAID_BUFF_MS;if(!count(expiresAtMs))throw new RangeError("Raid blessing overflow");
 return {level,expiresAtMs};
}
// Distinguish a bow from a ranged magic spell.
export const raidAttackCategory=attack=>attack.type==="magic"?"magic":attack.ranged?"ranged":"melee";
export function raidResistanceFactor(resistance,fraction,category){
 return 1-((resistance==="mixed"||resistance===category||resistance==="physical"&&category!=="magic")?fraction:0);
}
export const combatDamageFactor=(actor,target,attack)=>(actor.encounterDamage??1)*(1+(actor.raidBonusDamage??0))*(1-(target.raidBonusDefence??0))*raidResistanceFactor(target.encounterResistance??"none",target.encounterResistFraction??0,raidAttackCategory(attack));

export const validRaidCombatBonus=b=>Boolean(b&&Object.keys(b).length===2&&RAID_LEVELS.some(level=>b.damage===RAID_CATALOG[level].bonus.damage&&b.defence===RAID_CATALOG[level].bonus.defence));
export function raidCombatBonus(buff,now){const {damage,defence}=raidBonus(buff??null,now);return damage||defence?{damage,defence}:null;}
export const raidXpMultiplier=s=>s.arenaOnly&&s.activity==="fighting"?1+raidBonus(s.raidBuff??null,s.settledAtMs).xp:1;
