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
const grade=Number(process.argv[2]??3),mastery=Number(process.argv[3]??1),seed=20261202;
assert.ok([0,3,7].includes(grade)&&[1,25,50].includes(mastery));
const dir=await mkdtemp(join(tmpdir(),"team-behaviour-"));
try{
 const play=fileURLToPath(new URL("../site/play/",import.meta.url));
 for(const n of await readdir(play))if(n.endsWith(".mjs"))await copyFile(join(play,n),join(dir,n));
 const path=join(dir,"team-combat.mjs");let src=await readFile(path,"utf8");
 const rep=(a,b)=>{assert.ok(src.includes(a),a);src=src.replace(a,b);};
 rep('export function resolveTeamBattle(players,enemies,seed,terrain={},levels={player:1,enemy:1}){',`export function resolveTeamBattle(players,enemies,seed,terrain={},levels={player:1,enemy:1},policy={player:"normal",enemy:"normal"},mastery={player:1,enemy:1}){
  const tactical=seededRandom((seed^0x4f7b3241)>>>0);
  const role=a=>a.behaviour??"normal";
  const proficiency=a=>.35+.55*((a.behaviourMastery??1)-1)/49;
  const uses=(a,name)=>role(a)===name&&tactical()<proficiency(a);`);
 // Individual role is carried on each snapshot, not assigned by slot.
 // A stance activates at the start of an eligible turn. No permanent stat boosts.
 rep('const coordinated=decision()<chance[a.side],target=chooseTarget(a,actors,coordinated,decision);',`a.roleActive=role(a)!=="normal"&&tactical()<proficiency(a);
      const coordinated=decision()<chance[a.side],target=chooseTarget(a,actors,coordinated,decision,a.roleActive?role(a):"normal");`);
 rep('function chooseTarget(a,actors,coordinated,roll){','function chooseTarget(a,actors,coordinated,roll,role="normal"){');
 rep('TEAM_COMBAT_BALANCE.healthWeight+focus*TEAM_COMBAT_BALANCE.focusWeight:0);',`TEAM_COMBAT_BALANCE.healthWeight+focus*TEAM_COMBAT_BALANCE.focusWeight:0)+
      (role==="tactical"&&(reachable||!enemies.some(e=>distance(a,e)<=range))?(1-b.hp/b.maxHP)*3+focus*4:0);`);
 // Defensive intercept uses GUARD's role, not ward's. Existing legality and recovery stay.
 rep('function intercept(a,target,actors,round,chance,roll){','function intercept(a,target,actors,round,chance,roll,guardChance=g=>chance){');
 rep('if(!guard||roll()>=chance)return target;','if(!guard||roll()>=guardChance(guard))return target;');
 rep('const actual=intercept(a,target,actors,round,chance[target.side],decision);','const actual=intercept(a,target,actors,round,chance[target.side],decision,g=>role(g)==="defensive"?Math.max(chance[target.side],proficiency(g)):chance[target.side]);');
 rep('const active=activeWeapon(a),bow=bowActive(a);',`const active=activeWeapon(a),bow=bowActive(a);
      // Guard: recovery escort, no sacrifice of an available ready strike.
      if(a.roleActive&&role(a)==="defensive"&&a.shield.hp>0&&!a.guardOpen){
        const ward=allies(actors,a).filter(b=>b.shield.hp===0).sort((b,c)=>b.hp/b.maxHP-c.hp/c.maxHP)[0];
        const threats=ward?other(actors,a).filter(e=>!activeWeapon(e).ranged&&distance(e,ward)<=activeWeapon(e).range+1):[];
        if(ward&&gap(a,ward)>1&&threats.length&&(a.recovery>0||!other(actors,a).some(e=>distance(a,e)<=active.range))){
          const candidates=adjacent(a,actors,height,width,a.side).filter(p=>gap(p,ward)<gap(a,ward))
            .map(p=>({p,d:gap(p,ward),threat:Math.min(...threats.map(e=>gap(p,e))),tie:tactical()})).sort((b,c)=>b.d-c.d||b.threat-c.threat||b.tie-c.tie);
          if(candidates.length){Object.assign(a,candidates[0].p);a.approach=0;a.recovery=Math.max(0,a.recovery-1);record(a,ward,"protect_move");continue;}
        }
      }
      // Keep distance V1: real action and finite terrain retreat budget.
      if(a.roleActive&&role(a)==="range"&&a.recovery===0&&active.range>0&&a.retreats>0&&distance(a,target)<active.range&&
        mobility(a)>=mobility(target)+TACTICS.retreatLead&&move(a,target,actors,height,width,true,tactical)){
        a.retreats--;a.approach=0;record(a,target,"range_move");continue;
      }`);
 // Aggressive presses forward faster when engaged, trades defensive exposure for output.
 rep('a.approach+=mobility(a)>=TACTICS.quickMobility?1:TACTICS.slowApproach;','a.approach+=(mobility(a)>=TACTICS.quickMobility?1:TACTICS.slowApproach)*(a.roleActive&&role(a)==="aggressive"?1.5:1);');
 // Strike-specific explicit attack/defence exchange, active turn until next turn.
 // Equal reciprocal damage factors, not universal buffs. Guard effect only from own stance.
 const strikePath=join(dir,"physical-actions.mjs");let strike=await readFile(strikePath,"utf8");
 const sr=(a,b)=>{assert.ok(strike.includes(a),a);strike=strike.replace(a,b);};
 sr('const damage = wound(actor, target, impact);',`const stance=x=>!x.roleActive?1:x.behaviour==="aggressive"?1.22:x.behaviour==="defensive"?.80:1;
  const exposure=x=>!x.roleActive?1:x.behaviour==="aggressive"?1.25:x.behaviour==="defensive"?.80:1;
  const damage = wound(actor, target, Math.max(1,Math.round(impact*stance(actor)*exposure(target))));`);
 await writeFile(strikePath,strike);
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
 const roles=["aggressive","defensive","tactical","range"];
 const pairs=roles.flatMap(a=>roles.map(b=>a+"/"+b)),modes=["normal/normal",...pairs],rng=seededCombatRandom(seed);
 const seeds=Array.from({length:16},()=>Math.floor(rng()*2**32)),holdout=Array.from({length:32},()=>Math.floor(rng()*2**32)),npcSeeds=Array.from({length:512},()=>Math.floor(rng()*2**32)),npcHoldout=Array.from({length:1024},()=>Math.floor(rng()*2**32));
 assert.equal(new Set([...seeds,...holdout,...npcSeeds,...npcHoldout]).size,1584);
 const levels={player:25,enemy:25};
 const tally=()=>({n:0,w:0,l:0,d:0,intercepts:0,protectMoves:0,rangeMoves:0,damage:[0,0],fallen:[0,0],rounds:0});
 let fights=0,parity=0;
 function add(t,r,flip){fights++;t.n++;t.w+=+(r.outcome==="victory");t.l+=+(r.outcome==="defeat");t.d+=+(r.outcome==="double_death");t.rounds+=r.rounds;
 for(const [id,hp] of Object.entries(r.survivors))if(id.startsWith("player:"))t.fallen[Number(id.split(":")[1])^flip]+=+(hp===0);
 for(const e of r.events)if(e.actor?.startsWith("player:")){t.intercepts+=+(e.type==="intercept");t.protectMoves+=+(e.type==="protect_move");t.rangeMoves+=+(e.type==="range_move");t.damage[Number(e.actor.split(":")[1])^flip]+=e.damage;}}
 const merge=ts=>ts.reduce((a,b)=>{for(const k of Object.keys(a))if(Array.isArray(a[k]))a[k]=a[k].map((x,i)=>x+b[k][i]);else a[k]+=b[k];return a;},tally());
 const score=t=>(t.w+.5*t.d)/t.n;
 const choose=(m,t)=>[...m].sort((a,b)=>score(t[b])-score(t[a]))[0];
 const order=(r,i)=>i%2?[...r].reverse():r;
 const roster=(p,mode,i)=>order(p.map((s,j)=>({...s,behaviour:mode.split("/")[j],behaviourMastery:mastery})),i);
 function battle(p,e,a,s,i,mode){return variant(roster(p,mode,i),order(e,Math.floor(i/2)),s,a,levels);}
 for(const p of teams)for(const a of ARENAS)for(const s of seeds.slice(0,2)){
  const e=teams[(parity+1)%teams.length];assert.deepEqual(battle(p.roster,e.roster,a,s,0,"normal/normal"),live(p.roster,e.roster,s,a,levels));parity++;
 }
 const opponents=teams.slice(0,8),cells=[];
 for(const p of teams)for(const e of opponents)for(const arena of ARENAS){
  const train={},test={};
  for(const mode of modes){const a=tally(),b=tally();seeds.forEach((s,i)=>add(a,battle(p.roster,e.roster,arena,s,i,mode),i%2));holdout.forEach((s,i)=>add(b,battle(p.roster,e.roster,arena,s,i,mode),i%2));train[mode]=a;test[mode]=b;}
  cells.push({team:p.name,enemy:e.name,arena:arena.id,train,test});
 }
 const same=modes.filter(m=>m.split("/")[0]===m.split("/")[1]),mixed=pairs.filter(m=>m.split("/")[0]!==m.split("/")[1]);
 const byTeam=teams.map(p=>{const c=cells.filter(c=>c.team===p.name),a=Object.fromEntries(modes.map(m=>[m,merge(c.map(x=>x.train[m]))])),b=Object.fromEntries(modes.map(m=>[m,merge(c.map(x=>x.test[m]))]));
 return {name:p.name,best:choose(modes,a),same:choose(same,a),mixed:choose(mixed,a),worst:[...pairs].sort((x,y)=>score(a[x])-score(a[y]))[0],results:b};});
 const fixed=Object.fromEntries(modes.map(m=>[m,merge(cells.map(c=>c.test[m]))]));
 const teamPolicy=merge(byTeam.map(x=>x.results[x.best])),samePolicy=merge(byTeam.map(x=>x.results[x.same])),mixedPolicy=merge(byTeam.map(x=>x.results[x.mixed])),poorPolicy=merge(byTeam.map(x=>x.results[x.worst]));
 const npc=[];
 for(const p of teams){
  function evaluate(ss,mode){const t=tally();ss.forEach((s,i)=>{
   const player=roster(p.roster,mode,i),enemy=[0,1].map(j=>makeOpponent(i*2+j,grade,seededCombatRandom((s^Math.imul(j+1,0x9e3779b9))>>>0)));
   const roll=seededCombatRandom((s^0x749ae237)>>>0),arena=chooseArena(player[Math.floor(roll()*2)],enemy[Math.floor(roll()*2)],roll).arena;
   add(t,variant(player,enemy,s,arena,{player:25,enemy:1}),i%2);
  });return t;}
  const train=Object.fromEntries(modes.map(m=>[m,evaluate(npcSeeds,m)])),test=Object.fromEntries(modes.map(m=>[m,evaluate(npcHoldout,m)]));
  npc.push({name:p.name,best:choose(modes,train),same:choose(same,train),mixed:choose(mixed,train),worst:[...pairs].sort((x,y)=>score(train[x])-score(train[y]))[0],train,test});
 }
 console.log(JSON.stringify({grade,mastery,seed,seeds,holdout,npcSeeds,npcHoldout,levels,parity,fights,modes,fixed,teamPolicy,samePolicy,mixedPolicy,poorPolicy,byTeam,npc,cells}));
}finally{await rm(dir,{recursive:true,force:true});}
