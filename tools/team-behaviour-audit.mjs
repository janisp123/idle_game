// Research only. Build temporary variants from exact production resolver.
// No strike, stats, gear, reward or save changes. Separate tactic RNG.
import assert from "node:assert/strict";
import {mkdtemp,readdir,copyFile,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {resolveTeamBattle as live} from "../site/play/team-combat.mjs";
import {ARENAS,chooseArena} from "../site/play/arenas.mjs";
import {makeOpponent,seededCombatRandom} from "../site/play/combat.mjs";
const grade=Number(process.argv[2]??3),mastery=Number(process.argv[3]??1),seed=20261129;
assert.ok([0,3,7].includes(grade)&&[1,25,50].includes(mastery));
const dir=await mkdtemp(join(tmpdir(),"team-behaviour-"));
try{
 const play=fileURLToPath(new URL("../site/play/",import.meta.url));
 for(const n of await readdir(play))if(n.endsWith(".mjs"))await copyFile(join(play,n),join(dir,n));
 const path=join(dir,"team-combat.mjs");let src=await readFile(path,"utf8");
 const rep=(a,b)=>{assert.ok(src.includes(a),a);src=src.replace(a,b);};
 rep('export function resolveTeamBattle(players,enemies,seed,terrain={},levels={player:1,enemy:1}){',`export function resolveTeamBattle(players,enemies,seed,terrain={},levels={player:1,enemy:1},policy={player:"normal",enemy:"normal"},mastery={player:1,enemy:1}){
  const tactical=seededRandom((seed^0x4f7b3241)>>>0);
  const proficiency=side=>.25+.60*(mastery[side]-1)/49;
  const uses=(a,name)=>policy[a.side]===name&&tactical()<proficiency(a.side);`);
 // Focus: prioritize teammate target and wounded enemies, even if it costs movement.
 rep('function chooseTarget(a,actors,coordinated,roll){','function chooseTarget(a,actors,coordinated,roll,focusPolicy=false){');
 rep('TEAM_COMBAT_BALANCE.healthWeight+focus*TEAM_COMBAT_BALANCE.focusWeight:0);','TEAM_COMBAT_BALANCE.healthWeight+focus*TEAM_COMBAT_BALANCE.focusWeight:0)+(focusPolicy?(1-b.hp/b.maxHP)*3+focus*6:0);');
 rep('target=chooseTarget(a,actors,coordinated,decision);','target=chooseTarget(a,actors,coordinated,decision,uses(a,"focus"));');
 // Protect: guard spends ready action approaching vulnerable ally when threatened.
 // Melee only, intact shield; no teleport or damage mitigation.
 rep('const active=activeWeapon(a),bow=bowActive(a);',`const active=activeWeapon(a),bow=bowActive(a);
      if(a.recovery===0&&a.shield.hp>0&&uses(a,"protect")){
        const ward=allies(actors,a).filter(b=>b.shield.hp===0).sort((b,c)=>b.hp/b.maxHP-c.hp/c.maxHP)[0];
        if(ward&&gap(a,ward)>1&&other(actors,a).some(e=>distance(e,ward)<=activeWeapon(e).range+1)){
          const candidates=adjacent(a,actors,height,width,a.side).filter(p=>gap(p,ward)<gap(a,ward))
            .map(p=>({p,d:gap(p,ward),tie:tactical()})).sort((b,c)=>b.d-c.d||b.tie-c.tie);
          if(candidates.length){Object.assign(a,candidates[0].p);a.approach=0;record(a,ward,"protect_move");continue;}
        }
      }
      // Range: spend a ready action on retreat instead of attacking; limited
      // by existing arena retreat budget and mobility; no free movement.
      if(a.recovery===0&&active.range>0&&a.retreats>0&&distance(a,target)<active.range&&
        mobility(a)>=mobility(target)+TACTICS.retreatLead&&uses(a,"range")&&move(a,target,actors,height,width,true,tactical)){
        a.retreats--;a.approach=0;record(a,target,"range_move");continue;
      }`);
 // Higher interception commitment, same adjacent rule and recovery penalty.
 rep('const actual=intercept(a,target,actors,round,chance[target.side],decision);','const actual=intercept(a,target,actors,round,policy[target.side]==="protect"?Math.max(chance[target.side],proficiency(target.side)):chance[target.side],decision);');
 await writeFile(path,src);
 const {resolveTeamBattle:variant}=await import(pathToFileURL(path).href);
 const raw=[
 ["tank_archer",["sword_shield","plate"],["bow","leather"]],
 ["dual_archers",["bow","leather"],["bow","leather"]],
 ["dual_shields",["sword_shield","plate"],["sword_shield","plate"]],
 ["dual_hammers",["hammer","padded"],["hammer","padded"]],
 ["spear_archer",["spear","plate"],["bow","leather"]],
 ["hammer_spear",["hammer","plate"],["spear","leather"]],
 ["dual_greatswords",["greatsword","plate"],["greatsword","plate"]],
 ["dual_spears",["spear","plate"],["spear","plate"]],
 ["shield_spear",["sword_shield","plate"],["spear","leather"]],
 ["shield_hammer",["sword_shield","plate"],["hammer","padded"]],
 ["mixed_blades",["greatsword","plate"],["spear","plate"]],
 ["padded_shield_archer",["sword_shield","padded"],["bow","plate"]]
 ];
 const teams=raw.map(([name,...b])=>({name,builds:b,roster:b.map(([loadout,armour])=>createPlayerSnapshot({loadout,armour,grade,itemGrade:grade,quality:"common"}))}));
 const modes=["normal","protect","focus","range"],rng=seededCombatRandom(seed);
 const seeds=Array.from({length:32},()=>Math.floor(rng()*2**32)),holdout=Array.from({length:64},()=>Math.floor(rng()*2**32)),npcSeeds=Array.from({length:128},()=>Math.floor(rng()*2**32));
 assert.equal(new Set([...seeds,...holdout,...npcSeeds]).size,224);
 const levels={player:25,enemy:25},master={player:mastery,enemy:mastery};
 const tally=()=>({n:0,w:0,l:0,d:0,intercepts:0,protectMoves:0,rangeMoves:0,fallen:0,damage:0,rounds:0});
 let fights=0,parity=0;
 function add(t,r){fights++;t.n++;t.w+=+(r.outcome==="victory");t.l+=+(r.outcome==="defeat");t.d+=+(r.outcome==="double_death");t.fallen+=Object.entries(r.survivors).filter(([id,hp])=>id.startsWith("player:")&&hp===0).length;t.rounds+=r.rounds;
 for(const e of r.events)if(e.actor?.startsWith("player:")){t.intercepts+=+(e.type==="intercept");t.protectMoves+=+(e.type==="protect_move");t.rangeMoves+=+(e.type==="range_move");t.damage+=e.damage;}}
 const merge=ts=>ts.reduce((a,b)=>{for(const k of Object.keys(a))a[k]+=b[k];return a;},tally());
 const score=t=>(t.w+.5*t.d)/t.n;
 const order=(r,i)=>i%2?[...r].reverse():r;
 function battle(p,e,a,s,i,mode){return variant(order(p,i),order(e,Math.floor(i/2)),s,a,levels,{player:mode,enemy:"normal"},master);}
 for(const p of teams)for(const a of ARENAS)for(const s of seeds.slice(0,2)){
  const e=teams[(parity+1)%teams.length];assert.deepEqual(battle(p.roster,e.roster,a,s,0,"normal"),live(p.roster,e.roster,s,a,levels));parity++;
 }
 // 12 player compositions x 8 opponents x 5 terrains x four modes, paired seeds.
 // Held-out comparison evaluates every mode, not only a selected winner.
 const opponents=teams.slice(0,8),cells=[];
 for(const p of teams)for(const e of opponents)for(const arena of ARENAS){
  const train={},test={};
  for(const mode of modes){const a=tally(),b=tally();seeds.forEach((s,i)=>add(a,battle(p.roster,e.roster,arena,s,i,mode)));holdout.forEach((s,i)=>add(b,battle(p.roster,e.roster,arena,s,i,mode)));train[mode]=a;test[mode]=b;}
  const best=[...modes].sort((a,b)=>score(train[b])-score(train[a]))[0];
  cells.push({team:p.name,enemy:e.name,arena:arena.id,best,train,test});
 }
 // Actual random NPC and terrain draw for fixed behaviour choices.
 const npc=[];
 for(const p of teams)for(const mode of modes){const t=tally();npcSeeds.forEach((s,i)=>{
  const roster=order(p.roster,i),enemy=[0,1].map(j=>makeOpponent(i*2+j,grade,seededCombatRandom((s^Math.imul(j+1,0x9e3779b9))>>>0)));
  const roll=seededCombatRandom((s^0x749ae237)>>>0),arena=chooseArena(roster[Math.floor(roll()*2)],enemy[Math.floor(roll()*2)],roll).arena;
  add(t,variant(roster,enemy,s,arena,{player:25,enemy:1},{player:mode,enemy:"normal"},master));
 });npc.push({team:p.name,mode,...t});}
 const fixed=Object.fromEntries(modes.map(m=>[m,merge(cells.map(c=>c.test[m]))]));
 const byTeam=teams.map(p=>{const c=cells.filter(c=>c.team===p.name),a=Object.fromEntries(modes.map(m=>[m,merge(c.map(x=>x.train[m]))]));const best=[...modes].sort((x,y)=>score(a[y])-score(a[x]))[0];return {name:p.name,best,results:Object.fromEntries(modes.map(m=>[m,merge(c.map(x=>x.test[m]))]))};});
 const oracle=merge(cells.map(c=>c.test[c.best]));
 const teamPolicy=merge(byTeam.map(x=>x.results[x.best]));
 const byArena=ARENAS.map(a=>({arena:a.id,results:Object.fromEntries(modes.map(m=>[m,merge(cells.filter(c=>c.arena===a.id).map(c=>c.test[m]))]))}));
 const niches=[];for(const c of cells)for(const mode of modes.slice(1)){
  const delta=score(c.test[mode])-score(c.test.normal);niches.push({team:c.team,enemy:c.enemy,arena:c.arena,mode,delta,trainDelta:score(c.train[mode])-score(c.train.normal),normal:c.test.normal,variant:c.test[mode]});
 }
 const examples=Object.fromEntries(modes.slice(1).map(m=>{const a=niches.filter(x=>x.mode===m);return [m,{good:a.filter(x=>x.trainDelta>.05).sort((x,y)=>y.delta-x.delta).slice(0,5),bad:a.filter(x=>x.trainDelta<-.05).sort((x,y)=>x.delta-y.delta).slice(0,5),positive:a.filter(x=>x.delta>.05).length,negative:a.filter(x=>x.delta<-.05).length}]}));
 console.log(JSON.stringify({grade,mastery,seed,seeds,holdout,npcSeeds,levels,parity,fights,fixed,teamPolicy,oracle,byTeam,byArena,npc,examples,cells}));
}finally{await rm(dir,{recursive:true,force:true});}
