// Developer-only bulk team combat adapter. No alternative combat equations.
import { createPlayerSnapshot } from "../combat-simulator.mjs";
import { makeOpponent, seededCombatRandom } from "../../site/play/combat.mjs";
import { ARENAS } from "../../site/play/arenas.mjs";
import { resolveTeamBattle,TEAM_COMBAT_BALANCE } from "../../site/play/team-combat.mjs";
import { teamworkRequiredXP } from "../../site/play/teamwork.mjs";
export function simulateTeamCombat(options={}){
  const {battles=1000,seed=20261126,grade=0,teamwork=1,enemyTeamwork=1,
    builds=[{loadout:"sword_shield",armour:"plate"},{loadout:"bow",armour:"leather"}],
    opponentBuilds=null,arenaId=null,trace=0}=options;
  if(!Number.isSafeInteger(battles)||battles<1||battles>100000||
    !Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||
    !Number.isInteger(grade)||grade<0||grade>7||!Number.isInteger(trace)||trace<0||trace>Math.min(10,battles)||
    !Array.isArray(builds)||builds.length<1||builds.length>TEAM_COMBAT_BALANCE.maxRoster||
    opponentBuilds!==null&&(!Array.isArray(opponentBuilds)||opponentBuilds.length<1||opponentBuilds.length>TEAM_COMBAT_BALANCE.maxRoster))
    throw new RangeError("Invalid team simulation configuration");
  teamworkRequiredXP(teamwork);teamworkRequiredXP(enemyTeamwork);
  const arena=arenaId===null?null:ARENAS.find(a=>a.id===arenaId);
  if(arenaId!==null&&!arena)throw new RangeError("Unknown arena");
  const snapshots=b=>b.map(x=>createPlayerSnapshot({grade,itemGrade:grade,quality:"common",...x}));
  const players=snapshots(builds),fixed=opponentBuilds===null?null:snapshots(opponentBuilds);
  const rng=seededCombatRandom(seed),outcomes={victory:0,defeat:0,double_death:0},byArena={},samples=[];
  const fighters=Object.fromEntries(players.map((_,i)=>["player:"+i,{damage:0,actions:0,survived:0,intercepts:0}]));
  let rounds=0,intercepts=0;
  for(let i=0;i<battles;i++){
    const s=Math.floor(rng()*2**32),terrain=arena??ARENAS[Math.floor(rng()*ARENAS.length)];
    const enemy=fixed??players.map((_,j)=>makeOpponent(i*players.length+j,grade,seededCombatRandom((s^Math.imul(j+1,0x9e3779b9))>>>0)));
    const result=resolveTeamBattle(players,enemy,s,terrain,{player:teamwork,enemy:enemyTeamwork});
    outcomes[result.outcome]++;rounds+=result.rounds;
    const bucket=byArena[terrain.id]??={battles:0,victory:0,defeat:0,double_death:0};
    bucket.battles++;bucket[result.outcome]++;
    for(const [id,f] of Object.entries(fighters)){f.actions+=result.participation[id];f.survived+=Number(result.survivors[id]>0);}
    for(const event of result.events){
      if(event.type==="intercept")intercepts++;
      if(fighters[event.actor]){fighters[event.actor].damage+=event.damage;fighters[event.actor].intercepts+=Number(event.type==="intercept");}
    }
    if(samples.length<trace)samples.push({seed:s,arena:terrain.id,result});
  }
  return {module:"teamCombat",source:"site/play/team-combat.mjs (candidate, not live)",battles,seed,grade,teamwork,enemyTeamwork,builds,opponentBuilds,
    outcomes,winRatePct:100*outcomes.victory/battles,averageRounds:rounds/battles,intercepts,byArena,fighters,samples};
}
