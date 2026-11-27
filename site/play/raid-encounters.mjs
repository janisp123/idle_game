// RAID-001: deterministic encounters use the real group resolver and class kits.
import {RAID_RULES_VERSION,RAID_ROUND_MS,RAID_MAX_ROUNDS,RAID_MONSTER_BALANCE as B,raidDefinition,raidBonus} from "./raid-rules.mjs";
import {GROUP_IDS,initialBattleGroup,selectGroupClass,groupSnapshots} from "./battle-group.mjs?v=group-001";
import {GROUP_CLASSES} from "./battle-group-classes.mjs?v=group-001";
import {ARMOUR_SLOTS} from "./armour.mjs?v=bal-002";
import {expertiseThreshold} from "./expertise.mjs?v=alpha-gear-a3";
import {blankCharacterEffort,awardCharacterEffort} from "./character-attributes.mjs";
import {ARENAS} from "./arenas.mjs?v=bal-002";
import {resolveTeamBattle} from "./team-combat.mjs?v=raid-001";
const count=n=>Number.isSafeInteger(n)&&n>=0;
export function raidMonsters(level){
 const d=raidDefinition(level),roster=[d.boss,...d.crew];
 let g=initialBattleGroup();
 for(const [i,id] of GROUP_IDS.entries()){
  const c=GROUP_CLASSES[roster[i].classId],grade=Math.max(0,d.grade-(i?B.crewGradeOffset:0));
  g=selectGroupClass(g,id,c.race,c.mainClass,c.id);
  const m=g[id],p=m.classes[c.id],quality=grade===7?"masterwork":"common",item={grade,quality};
  p.equipment=Object.fromEntries([c.loadout,...ARMOUR_SLOTS.map(s=>s.id+":"+c.armour)].map(k=>[k,{...item}]));
  p.mastery={level,xp:0};m.stances.balanced={level,xp:0};
  p.expertise[c.loadout]=expertiseThreshold(grade);p.expertise[c.armour]=expertiseThreshold(grade);p.expertiseActive={...p.expertise};
  p.attributeEffort=awardCharacterEffort(blankCharacterEffort(),c.id,Math.floor(p.expertise[c.loadout]/4));p.attributeEffortActive={...p.attributeEffort};
 }
 const s=groupSnapshots(g,{difficulty:d.grade,str:1,dex:1,end:1,skill:level},4);
 return GROUP_IDS.map((id,i)=>({...s[id],name:roster[i].name}));
}
export function resolveRaid(players,level,seed,teamworkLevel,buff=null,startedAtMs=0){
 if(!count(seed)||seed>0xffffffff||!count(startedAtMs)||!Number.isInteger(teamworkLevel)||teamworkLevel<1||teamworkLevel>50)throw new RangeError("Invalid raid encounter");
 const d=raidDefinition(level),enemies=raidMonsters(level),terrain=ARENAS.find(a=>a.id===d.arenaId),bonus=raidBonus(buff,startedAtMs);
 const result=resolveTeamBattle(players,enemies,seed,terrain,{player:teamworkLevel,enemy:level,groupCombatRules:4,raid:{version:RAID_RULES_VERSION,level},playerBonus:{damage:bonus.damage,defence:bonus.defence}});
 const durationMs=Math.max(RAID_ROUND_MS,result.rounds*RAID_ROUND_MS);
 return {...result,enemies,terrain,level,durationMs};
}
