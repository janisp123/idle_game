// Research only. Build temporary variants from exact production resolver.
// Experimental individual behaviours plus material durability, snapshot-only. No runtime changes.
import assert from "node:assert/strict";
import {mkdtemp,readdir,copyFile,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {resolveTeamBattle as live} from "../site/play/team-combat.mjs";
import {ARENAS,chooseArena} from "../site/play/arenas.mjs";
import {makeOpponent,seededCombatRandom} from "../site/play/combat.mjs";
const grade=Number(process.argv[2]??3),candidate=Number(process.argv[3]??0),mastery=50,seed=20261205;
assert.ok([0,3,7].includes(grade)&&[0,1,2].includes(candidate));
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
 const families=["padded","leather","plate"],weapons=["sword_shield","bow","spear","hammer","greatsword"],roles=["normal","aggressive","defensive","tactical","range"];
 const factors=[{padded:1,leather:1,plate:1},{padded:.8,leather:1,plate:1.25},{padded:.65,leather:1,plate:1.5}][candidate];
 const make=(weapon,family,quality="common",role="normal")=>{
  const s=createPlayerSnapshot({loadout:weapon,armour:family,grade,itemGrade:grade,quality});
  const condition={...s.condition,armour:Object.fromEntries(Object.entries(s.condition.armour).map(([id,p])=>[id,{...p,maxHP:Math.max(1,Math.round(p.maxHP*factors[p.itemId.split(":")[1]]))}]))};
  return {...s,condition,behaviour:role,behaviourMastery:mastery};
 };
 const kits=weapons.flatMap(w=>families.map(a=>({w,a,id:w+":"+a})));
 const gear= kits.flatMap((a,i)=>kits.slice(i).map(b=>[a,b]));
 const fighters=kits.flatMap(k=>roles.map(role=>({...k,role,id:k.id+":"+role,snapshot:make(k.w,k.a,"common",role)})));
 const configs=fighters.flatMap((a,i)=>fighters.slice(i).map(b=>({id:a.id+"/"+b.id,first:a,second:b,roster:[a.snapshot,b.snapshot]})));
 assert.equal(gear.length,120);assert.equal(configs.length,2850);
 const allOpp=kits.map(k=>({id:k.id,roster:[make(k.w,k.a),make(k.w,k.a)]}));
 const screenOpp=[0,4,8,9,13].map(i=>allOpp[i]); // one representative per weapon, all armour families
 const rng=seededCombatRandom(seed),train=Array.from({length:4},()=>Math.floor(rng()*2**32)),held=Array.from({length:16},()=>Math.floor(rng()*2**32));
 const levels={player:25,enemy:25};
 const tally=()=>({n:0,w:0,l:0,d:0,armourBreaks:0,armourLost:0,armourStart:0,rounds:0});
 let calls=0,parity=0;
 function add(t,r){calls++;t.n++;t.w+=+(r.outcome==="victory");t.l+=+(r.outcome==="defeat");t.d+=+(r.outcome==="double_death");t.rounds+=r.rounds;
  const a=r.events[0].vitals,b=r.events.at(-1).vitals;
  for(const id of Object.keys(a).filter(k=>k.startsWith("player:"))){t.armourStart+=a[id].armour;t.armourLost+=a[id].armour-b[id].armour;}
  for(const ev of r.events)if(ev.target?.startsWith("player:"))t.armourBreaks+=(ev.broken??[]).filter(k=>["head","torso","arms","legs"].includes(k)).length;
 }
 const reverse=(a,i)=>i%2?[...a].reverse():a;
 const evaluate=(roster,opps,arenas,seeds)=>{
  const all=tally(),byArena={},byEnemy={};
  for(const a of arenas){byArena[a.id]=tally();for(const e of opps){byEnemy[e.id]??=tally();for(const [i,s] of seeds.entries()){
   const r=variant(reverse(roster,i),reverse(e.roster,Math.floor(i/2)),s,a,levels);
   add(all,r);add(byArena[a.id],r);add(byEnemy[e.id],r);calls-=2;
  }}}
  return {all,byArena,byEnemy};
 };
 const score=t=>(t.w+.5*t.d)/t.n;
 const clean=r=>({outcome:r.outcome,rounds:r.rounds,events:r.events.map(({vitals,...e})=>({...e,vitals:Object.fromEntries(Object.entries(vitals).map(([k,{armour,maxArmour,...v}])=>[k,v]))}))});
 for(const k of kits)for(const a of ARENAS){
  const base=createPlayerSnapshot({loadout:k.w,armour:k.a,grade,itemGrade:grade,quality:"masterwork"});
  const altered=make(k.w,k.a,"masterwork");
  const e=createPlayerSnapshot({loadout:"hammer",armour:"plate",grade,itemGrade:grade,quality:"masterwork"}),other=make("hammer","plate","masterwork");
  assert.ok(Object.values(altered.condition.armour).every(p=>!p.breakable));assert.deepEqual(altered.condition.weapon,base.condition.weapon);
  assert.deepEqual(clean(variant([altered,altered],[other,other],train[0],a,levels)),clean(live([base,base],[e,e],train[0],a,levels)));parity++;
  if(candidate===0){const b=createPlayerSnapshot({loadout:k.w,armour:k.a,grade,itemGrade:grade,quality:"common"}),e=make(k.w,k.a);
   assert.deepEqual(variant([e,e],[e,e],train[1],a,levels),live([b,b],[b,b],train[1],a,levels));parity++;}
 }
 // All 120 unordered gear teams, normal policies, against all 15 uniform opponent builds.
 const equipment=gear.map(([a,b])=>({id:a.id+"/"+b.id,first:a.id,second:b.id,...evaluate([make(a.w,a.a),make(b.w,b.a)],allOpp,ARENAS,held.slice(0,8))}));
 // All 2,850 unordered full-set/role configurations, both fighters may use Normal.
 const screened=configs.map(x=>({id:x.id,first:x.first.id,second:x.second.id,...evaluate(x.roster,screenOpp,ARENAS,train)}));
 const byId=new Map(configs.map(x=>[x.id,x]));
 const select=(list,key="all",arena=null)=>[...list].sort((a,b)=>score(arena?a.byArena[arena]:a[key])-score(arena?b.byArena[arena]:b[key])).slice(0,3);
 const selected=new Set();const policies={};
 function pick(key,list,arena=null){const top=select(list,"all",arena);policies[key]=top.map(t=>t.id);for(const t of top)selected.add(t.id);}
 pick("global",screened);
 for(const w of weapons){const l=screened.filter(t=>[t.first,t.second].some(id=>id.startsWith(w+":")));pick("weapon:"+w,l);}
 for(const a of families)pick("armour:"+a,screened.filter(t=>[t.first,t.second].some(id=>id.split(":")[1]===a)));
 for(const role of roles)pick("role:"+role,screened.filter(t=>[t.first,t.second].some(id=>id.endsWith(":"+role))));
 for(const a of ARENAS)pick("arena:"+a.id,screened,a.id);
 // Re-evaluate selected candidates on independent seeds and all weapon/armour enemy archetypes.
 const finalists=[...selected].map(id=>({id,...evaluate(byId.get(id).roster,allOpp,ARENAS,held)}));
 // Explicit cross-play of the selected global leaders and best weapon candidates:
 // opponent also uses tactics; pairwise counters, not exhaustive PvP equilibrium.
 const rivals=[...new Set(["global",...weapons.map(w=>"weapon:"+w)].map(k=>policies[k][0]))];
 const cross=rivals.map(id=>({id,results:rivals.map(enemy=>({enemy,...evaluate(byId.get(id).roster,[{id:enemy,roster:byId.get(enemy).roster}],ARENAS,held)}))}));
 const compact=t=>({id:t.id,first:t.first,second:t.second,all:t.all,byArena:t.byArena,byEnemy:t.byEnemy});
 console.log(JSON.stringify({grade,candidate,mastery,seed,factors,train,held,screenOpp:screenOpp.map(x=>x.id),calls,parity,policies,equipment,screened:screened.map(compact),finalists,cross}));
}finally{await rm(dir,{recursive:true,force:true});}
