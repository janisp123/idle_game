// Research only. Build temporary variants from exact production resolver.
// Research: moderate material durability plus scaled armour wear and broad opponent validation.
import assert from "node:assert/strict";
import {mkdtemp,readdir,copyFile,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {createPlayerSnapshot} from "./combat-simulator.mjs";
import {resolveTeamBattle as live} from "../site/play/team-combat.mjs";
import {ARENAS,chooseArena} from "../site/play/arenas.mjs";
import {makeOpponent,seededCombatRandom} from "../site/play/combat.mjs";
const grade=Number(process.argv[2]??3),candidate=Number(process.argv[3]??0),mastery=50,seed=20261206;
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
 // Same moderate durability in all candidates. Isolate grade-scaled wear, then material-specific wear.
 // Only actual unblocked/unparried landed hits wear armour; weapon/shield wear unchanged.
 if(candidate>0)sr('const armour = target.armour.find(item => item.hp > 0);\n    if (armour && wear(armour, attack.type === "blunt" ? 9 : 5)) broken.push(armour.id);',`const armour = target.armour.find(item => item.hp > 0 && item.breakable);
    if(armour){
      const family=armour.itemId?.split(":")[1];
      const multiplier=equipped?Math.max(1,activePiece.damageMultiplier??1):1;
      const material={padded:{piercing:1.15,slashing:1.35,blunt:.75},leather:{piercing:1.1,slashing:1,blunt:1},plate:{piercing:.8,slashing:.75,blunt:1.5}};
      const wearFactor=${candidate===2?"(material[family]?.[attack.type]??1)":"1"};
      if(wear(armour,Math.max(1,Math.round((attack.type==="blunt"?9:5)*Math.sqrt(multiplier)*wearFactor))))broken.push(armour.id);
    }`);
 await writeFile(strikePath,strike);
 await writeFile(path,src);
 const {resolveTeamBattle:variant}=await import(pathToFileURL(path).href);
 const families=["padded","leather","plate"],weapons=["sword_shield","bow","spear","hammer","greatsword"],roles=["normal","aggressive","defensive","tactical","range"];
 const factors={padded:.8,leather:1,plate:1.25};
 const make=(weapon,family,quality="common",role="normal",slots={})=>{
  const s=createPlayerSnapshot({loadout:weapon,armour:family,armourSlots:slots,grade,itemGrade:grade,quality});
  const condition={...s.condition,armour:Object.fromEntries(Object.entries(s.condition.armour).map(([id,p])=>[id,{...p,maxHP:Math.max(1,Math.round(p.maxHP*factors[p.itemId.split(":")[1]]))}]))};
  return {...s,condition,behaviour:role,behaviourMastery:mastery};
 };
 const kits=weapons.flatMap(w=>families.map(a=>({w,a,id:w+":"+a})));
 const fighters=kits.flatMap(k=>roles.map(role=>({...k,role,id:k.id+":"+role,snapshot:make(k.w,k.a,"common",role)})));
 const configs=fighters.flatMap((a,i)=>fighters.slice(i).map(b=>({id:a.id+"/"+b.id,first:a,second:b,roster:[a.snapshot,b.snapshot]})));
 assert.equal(configs.length,2850);
 const rng=seededCombatRandom(seed);
 const train=Array.from({length:8},()=>Math.floor(rng()*2**32)),validation=Array.from({length:24},()=>Math.floor(rng()*2**32)),held=Array.from({length:32},()=>Math.floor(rng()*2**32));
 const crossSeeds=Array.from({length:48},()=>Math.floor(rng()*2**32));
 assert.equal(new Set([...train,...validation,...held,...crossSeeds]).size,112);
 // Broad deterministic pools. All 15 weapon/armour kits occur once in each balanced
 // mixed opponent pool; each opponent is a two-member team, roles vary in holdout.
 const pool=(shift,withRoles,quality="common")=>kits.map((a,i)=>{
  const b=kits[(i+shift)%kits.length],ra=withRoles?roles[i%roles.length]:"normal",rb=withRoles?roles[(i+2)%roles.length]:"normal";
  return {id:a.id+":"+ra+"/"+b.id+":"+rb,roster:[make(a.w,a.a,quality,ra),make(b.w,b.a,quality,rb)]};
 });
 const screenOpp=[...pool(0,false).filter((_,i)=>i%3===0),...pool(4,false),...pool(7,false).filter((_,i)=>i%3===1)];
 const valOpp=[...pool(0,false),...pool(6,true)];
 const testOpp=[...pool(0,false),...pool(2,true),...pool(8,true)];
 const levels={player:25,enemy:25};
 const tally=()=>({n:0,w:0,l:0,d:0,armourBreaks:0,armourLost:0,armourStart:0,rounds:0,damage:[0,0],fallen:[0,0],anyBreak:0});
 let calls=0,parity=0;
 function add(t,r,flip){t.n++;t.w+=+(r.outcome==="victory");t.l+=+(r.outcome==="defeat");t.d+=+(r.outcome==="double_death");t.rounds+=r.rounds;
  const a=r.events[0].vitals,b=r.events.at(-1).vitals;let broken=0;
  for(const id of Object.keys(a).filter(k=>k.startsWith("player:"))){t.armourStart+=a[id].armour;t.armourLost+=a[id].armour-b[id].armour;t.fallen[Number(id.split(":")[1])^flip]+=+(b[id].hp===0);}
  for(const ev of r.events){if(ev.target?.startsWith("player:"))broken+=(ev.broken??[]).filter(k=>["head","torso","arms","legs"].includes(k)).length;
   if(ev.actor?.startsWith("player:"))t.damage[Number(ev.actor.split(":")[1])^flip]+=ev.damage??0;}
  t.armourBreaks+=broken;t.anyBreak+=+(broken>0);
 }
 const reverse=(a,i)=>i%2?[...a].reverse():a;
 const evaluate=(roster,opps,arenas,seeds,detail=false)=>{
  const all=tally(),byArena={},byEnemy={};
  for(const a of arenas){byArena[a.id]=tally();for(const e of opps){if(detail)byEnemy[e.id]??=tally();for(const [i,s] of seeds.entries()){
   const r=variant(reverse(roster,i),reverse(e.roster,Math.floor(i/2)),s,a,levels);calls++;
   add(all,r,i%2);add(byArena[a.id],r,i%2);if(detail)add(byEnemy[e.id],r,i%2);
  }}}
  return {all,byArena,...(detail?{byEnemy}:{})};
 };
 const score=t=>(t.w+.5*t.d)/t.n;
 const clean=r=>({outcome:r.outcome,rounds:r.rounds,events:r.events.map(({vitals,...e})=>({...e,vitals:Object.fromEntries(Object.entries(vitals).map(([k,{armour,maxArmour,...v}])=>[k,v]))}))});
 for(const k of kits)for(const a of ARENAS){
  const base=createPlayerSnapshot({loadout:k.w,armour:k.a,grade,itemGrade:grade,quality:"masterwork"});
  const altered=make(k.w,k.a,"masterwork");
  const e=createPlayerSnapshot({loadout:"hammer",armour:"plate",grade,itemGrade:grade,quality:"masterwork"}),other=make("hammer","plate","masterwork");
  assert.ok(Object.values(altered.condition.armour).every(p=>!p.breakable));assert.deepEqual(altered.condition.weapon,base.condition.weapon);
  assert.deepEqual(clean(variant([altered,altered],[other,other],train[0],a,levels)),clean(live([base,base],[e,e],train[0],a,levels)));parity++;
 }
 // Test all 2,850 role/gear teams on 25 opposing teams, all five environments.
 const screened=configs.map(x=>({id:x.id,first:x.first.id,second:x.second.id,...evaluate(x.roster,screenOpp,ARENAS,train)}));
 const byId=new Map(configs.map(x=>[x.id,x]));
 const categories={global:()=>true};
 for(const w of weapons){categories["weapon:"+w]=t=>[t.first,t.second].some(id=>id.startsWith(w+":"));categories["both:"+w]=t=>[t.first,t.second].every(id=>id.startsWith(w+":"));}
 for(const a of families)categories["armour:"+a]=t=>[t.first,t.second].some(id=>id.split(":")[1]===a);
 for(const role of roles)categories["role:"+role]=t=>[t.first,t.second].some(id=>id.endsWith(":"+role));
 for(const a of ARENAS)categories["arena:"+a.id]=()=>true;
 const metric=(k,t)=>score(k.startsWith("arena:")?t.byArena[k.slice(6)]:t.all);
 const candidateIds=new Set(),shortlist={};
 for(const [key,pred] of Object.entries(categories)){const ids=screened.filter(pred).sort((a,b)=>metric(key,b)-metric(key,a)).slice(0,5).map(t=>t.id);shortlist[key]=ids;ids.forEach(id=>candidateIds.add(id));}
 const validated=[...candidateIds].map(id=>({id,...evaluate(byId.get(id).roster,valOpp,ARENAS,validation)}));
 const byVal=new Map(validated.map(t=>[t.id,t]));
 // Selection uses validation only; held data never ranks the finalists.
 const policies=Object.fromEntries(Object.entries(shortlist).map(([k,ids])=>[k,ids.sort((a,b)=>metric(k,byVal.get(b))-metric(k,byVal.get(a)))[0]]));
 const winners=[...new Set(Object.values(policies))];
 const finalists=winners.map(id=>({id,...evaluate(byId.get(id).roster,testOpp,ARENAS,held,true)}));
 // Fixed anchor configurations common to every candidate, including poor
 // and reversed role assignments, for direct matched-seed comparison.
 const anchors=[
 ["spear:plate:defensive","bow:leather:aggressive"],["spear:plate:aggressive","bow:leather:defensive"],
 ["sword_shield:plate:defensive","bow:leather:aggressive"],["sword_shield:plate:aggressive","bow:leather:defensive"],
 ...weapons.flatMap(w=>families.map(a=>[w+":"+a+":normal",w+":"+a+":normal"]))
 ].map(pair=>{const x=configs.find(t=>pair.includes(t.first.id)&&pair.includes(t.second.id)&&(pair[0]===pair[1]||t.first.id!==t.second.id));assert.ok(x,pair.join("/"));return {id:x.id,...evaluate(x.roster,testOpp,ARENAS,held)};});
 // Real mixed-slot experiments with identical weapons/roles. All alternatives
 // are evaluated, not selected on held data; these are specific sample builds.
 const mixes=[{name:"padded_head_plate_torso_leather_limbs",base:"leather",slots:{head:"padded",torso:"plate"}},
 {name:"plate_head_padded_torso_leather_limbs",base:"leather",slots:{head:"plate",torso:"padded"}},
 {name:"plate_torso_padded_rest",base:"padded",slots:{torso:"plate"}}];
 const mixed=weapons.flatMap(w=>[...families.map(a=>({name:a,base:a,slots:{}})),...mixes].map(m=>{
 const s=make(w,m.base,"common","normal",m.slots);return {weapon:w,armour:m.name,...evaluate([s,s],testOpp,ARENAS,held)};}));
 // Cross-play independently selected leaders, both sides using roles.
 const rivals=[...new Set(["global",...weapons.map(w=>"both:"+w),...ARENAS.map(a=>"arena:"+a.id)].map(k=>policies[k]))];
 const cross=rivals.map(id=>({id,results:rivals.map(enemy=>({enemy,...evaluate(byId.get(id).roster,[{id:enemy,roster:byId.get(enemy).roster}],ARENAS,crossSeeds)}))}));
 const masterwork=winners.map(id=>{const x=byId.get(id),roster=[x.first,x.second].map(t=>make(t.w,t.a,"masterwork",t.role));return {id,...evaluate(roster,pool(2,true,"masterwork"),ARENAS,held)};});
 console.log(JSON.stringify({grade,candidate,mastery,seed,factors,train,validation,held,crossSeeds,screenOpp:screenOpp.map(x=>x.id),valOpp:valOpp.map(x=>x.id),testOpp:testOpp.map(x=>x.id),calls,parity,policies,screened,validated,finalists,anchors,mixed,cross,masterwork}));
}finally{await rm(dir,{recursive:true,force:true});}
