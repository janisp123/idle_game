// BATTLE-GROUP-001: original class data, candidate initial physical adapters.
// The only selection inputs are race, main class, specialization and stance.
// Cooldown descriptors are executed in the candidate shared team resolver; not public yet.
export const GROUP_RACES=Object.freeze(["human","elf","dark_elf","orc","dwarf"]);
export const GROUP_ROLES=Object.freeze(["tank","melee","ranged","mage","healer","support","summoner"]);
const raceNames=["Human","Elf","Dark Elf","Orc","Dwarf"];
export const RACE_LABELS=Object.freeze(Object.fromEntries(GROUP_RACES.map((r,i)=>[r,raceNames[i]])));
// id, name, race, main class, role, current weapon adapter, armour,
// actual intended equipment label, signature effect, cooldown rounds.
const rows=[
 ["blademaster","Blademaster","human","Warrior","melee","greatsword","plate","Twin swords","burst",4],
 ["linebreaker","Linebreaker","human","Warrior","melee","spear","plate","Polearm","sweep",5],
 ["oathkeeper","Oathkeeper","human","Knight","tank","sword_shield","plate","Sword and shield","guard",4],
 ["grimwarden","Grimwarden","human","Knight","tank","sword_shield","plate","Sword and shield","counter",4],
 ["trickblade","Trickblade","human","Rogue","melee","sword_shield","leather","Dagger","feint",4],
 ["longshot","Longshot","human","Rogue","ranged","bow","leather","Bow","aimed",4],
 ["flameweaver","Flameweaver","human","Wizard","mage","bow","padded","Staff","blast",5],
 ["gravebinder","Gravebinder","human","Wizard","mage","bow","padded","Staff","curse",5],
 ["beastcaller","Beastcaller","human","Wizard","summoner","bow","padded","Wand","familiar",4],
 ["lifekeeper","Lifekeeper","human","Cleric","healer","bow","padded","Scepter","heal",4],
 ["runesage","Runesage","human","Cleric","support","bow","padded","Scepter","blessing",5],
 ["grovewarden","Grovewarden","elf","Knight","tank","sword_shield","plate","Sword and shield","ward",4],
 ["wardchanter","Wardchanter","elf","Knight","support","sword_shield","plate","Sword","ward_song",5],
 ["swiftblade","Swiftblade","elf","Scout","melee","sword_shield","leather","Dagger","dash",3],
 ["windbow","Windbow","elf","Scout","ranged","bow","leather","Bow","mobile_shot",3],
 ["frostweaver","Frostweaver","elf","Wizard","mage","bow","padded","Staff","slow",4],
 ["spiritcaller","Spiritcaller","elf","Wizard","summoner","bow","padded","Wand","spirit",5],
 ["wellspring","Wellspring","elf","Oracle","healer","bow","padded","Scepter","cleanse_heal",4],
 ["dreadguard","Dreadguard","dark_elf","Knight","tank","sword_shield","plate","Sword and shield","weaken",4],
 ["war_dancer","War Dancer","dark_elf","Knight","support","greatsword","plate","Twin swords","war_song",5],
 ["nightblade","Nightblade","dark_elf","Assassin","melee","sword_shield","leather","Dagger","flank",4],
 ["blackbow","Blackbow","dark_elf","Assassin","ranged","bow","leather","Bow","pierce",5],
 ["galescourge","Galescourge","dark_elf","Wizard","mage","bow","padded","Staff","gust",5],
 ["shadebinder","Shadebinder","dark_elf","Wizard","summoner","bow","padded","Wand","shade",4],
 ["bloodsage","Bloodsage","dark_elf","Oracle","healer","bow","padded","Scepter","battle_heal",4],
 ["ragebreaker","Ragebreaker","orc","Raider","melee","hammer","plate","Great axe","rage_strike",5],
 ["ironfist","Ironfist","orc","Monk","melee","sword_shield","leather","Gauntlets","rush",3],
 ["hexchief","Hexchief","orc","Shaman","support","bow","padded","Mace","hex",5],
 ["warcaller","Warcaller","orc","Shaman","support","bow","padded","Mace","chant",5],
 ["scrapbreaker","Scrapbreaker","dwarf","Scavenger","melee","hammer","plate","Hammer","break_guard",4],
 ["forgecaller","Forgecaller","dwarf","Artisan","summoner","hammer","plate","Hammer","construct",5]
];
export const GROUP_CLASSES=Object.freeze(Object.fromEntries(rows.map(([id,name,race,mainClass,role,loadout,armour,weaponLabel,effect,cooldown])=>[id,Object.freeze({id,name,race,mainClass,role,loadout,armour,weaponLabel,ability:Object.freeze({effect,cooldown})})])));
export const GROUP_CLASS_IDS=Object.freeze(Object.keys(GROUP_CLASSES));
export const isGroupClass=id=>typeof id==="string"&&Object.hasOwn(GROUP_CLASSES,id);
export function groupMainClasses(race){
 if(!GROUP_RACES.includes(race))throw new RangeError("Unknown race");
 return [...new Set(Object.values(GROUP_CLASSES).filter(c=>c.race===race).map(c=>c.mainClass))];
}
export function groupSpecializations(race,mainClass){
 if(!groupMainClasses(race).includes(mainClass))throw new RangeError("Unknown main class");
 return Object.values(GROUP_CLASSES).filter(c=>c.race===race&&c.mainClass===mainClass);
}
export function resolveGroupClass(race,mainClass,id){
 if(!isGroupClass(id)||GROUP_CLASSES[id].race!==race||GROUP_CLASSES[id].mainClass!==mainClass)throw new RangeError("Invalid class path");
 return GROUP_CLASSES[id];
}
export const DEFAULT_GROUP_CLASSES=Object.freeze(["oathkeeper","blademaster","longshot","flameweaver","lifekeeper","wardchanter","war_dancer"]);
