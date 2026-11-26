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
const grade=Number(process.argv[2]??3),mastery=Number(process.argv[3]??1),seed=20261204;
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
 // Run the production engine's real normal-profile offline settlement,
 // with only the experimental role tags added to frozen team snapshots.
 const ep=join(dir,"engine.mjs");let engine=await readFile(ep,"utf8");
 const er=(a,b)=>{assert.ok(engine.includes(a),a);engine=engine.replace(a,b);};
 er('export const TIMING_PROFILE = "alpha";','export const TIMING_PROFILE = "normal";');
 er('return teamSnapshots(teamFromState(state),p);',`const snapshots=teamSnapshots(teamFromState(state),p);
  if(!state.researchRoles)return snapshots;
  for(const [i,id] of ["first","second"].entries()){snapshots[id].behaviour=state.researchRoles[i];snapshots[id].behaviourMastery=state.researchMastery;}
  return snapshots;`);
 await writeFile(ep,engine);
 const load=n=>import(pathToFileURL(join(dir,n+".mjs")).href);
 const [e,c,team,armour,expertise,attrs,auto,tw,tl]=await Promise.all(["engine","combat","team","armour","expertise","attributes","auto-fight","teamwork","team-timeline"].map(load));
 const previous=JSON.parse(await readFile(fileURLToPath(new URL("../docs/mechanics/TEAM_007_INDIVIDUAL_G"+grade+".json",import.meta.url)),"utf8")).results.find(d=>d.mastery===mastery);
 assert.ok(previous);
 const builds={
 tank_archer:[["sword_shield","plate"],["bow","leather"]],dual_archers:[["bow","leather"],["bow","leather"]],
 dual_shields:[["sword_shield","plate"],["sword_shield","plate"]],dual_hammers:[["hammer","padded"],["hammer","padded"]],
 spear_archer:[["spear","plate"],["bow","leather"]],hammer_spear:[["hammer","plate"],["spear","leather"]],
 dual_greatswords:[["greatsword","plate"],["greatsword","plate"]],dual_spears:[["spear","plate"],["spear","plate"]],
 shield_spear:[["sword_shield","plate"],["spear","leather"]],shield_hammer:[["sword_shield","plate"],["hammer","padded"]],
 mixed_blades:[["greatsword","plate"],["spear","plate"]],padded_shield_archer:[["sword_shield","padded"],["bow","plate"]]};
 const level={0:10,3:25,7:52}[grade],hours={0:120,3:1200,7:3700}[grade],H=3600000;
 const windows=[1,4,8,24],seeds=Array.from({length:48},(_,i)=>(Math.imul(seed^i,2654435761)>>>0));
 const makeFighter=([weapon,family])=>{
  const g=team.initialGladiator(weapon);g.equipment[weapon]={grade,quality:"common"};
  for(const {id} of armour.ARMOUR_SLOTS){g.armour[id]=family;g.equipment[id+":"+family]={grade,quality:"common"};}
  g.expertise=expertise.blankExpertise();g.expertise[weapon]=g.expertise[family]=Math.max(expertise.expertiseThreshold(grade),Math.round(hours*expertise.EXPERTISE_BALANCE.unitsPerHour));
  g.expertiseActive={...g.expertise};return g;
 };
 const fixture=(name,mode,origin,fraction)=>{
  const s=e.newTeamGame(origin),[first,second]=builds[name].map(makeFighter);
  const effort=attrs.awardAttributeTime(s.attributeEffort,"fighting",hours*H);
  return {...s,...first,teamSecond:second,teamwork:{level:25,xp:0},attributeEffort:effort,attributeEffortActive:{...effort},
   skills:{...s.skills,fighting:{...s.skills.fighting,level,xp:Math.floor(e.xpToNextLevel(level)*fraction)}},
   activity:"fighting",autoFight:auto.initialAutoFight(grade),difficulties:{fighting:grade},researchRoles:mode.split("/"),researchMastery:mastery};
 };
 const fields=["coins","victories","bouts","downtimeMs","xp","practiceFirst","practiceSecond","spent","upgrades","activeHours","capped"];
 const rows=[];let sessions=0,bouts=0,parity=0;
 const simulate=(name,mode,origin,duration,fraction)=>{
  const s=fixture(name,mode,origin,fraction),base=e.desiredArenaTeam(s);
  assert.equal(base.first.behaviour,mode.split("/")[0]);
  assert.equal(base.second.behaviour,mode.split("/")[1]);
  const result=e.enterGameWithApprentice(s,origin+duration*H,c.seededCombatRandom((origin^0x3f87a2)>>>0)),next=result.state;
  const a=result.offlineArena??{},coins=a.coins??0,spent=result.autoEquipment?.spent??0;
  assert.equal(next.coins,s.coins+coins-spent);assert.deepEqual(next.autoFight,s.autoFight);
  assert.ok(next.skills.fighting.xp<=e.xpToNextLevel(level));
  const old=team.TEAM_IDS.map(id=>e.teamFromState(s)[id]),now=team.TEAM_IDS.map(id=>e.teamFromState(next)[id]);
  for(let i=0;i<2;i++)for(const key of Object.keys(old[i].expertise))if(![builds[name][i][0],builds[name][i][1]].includes(key))assert.equal(now[i].expertise[key],old[i].expertise[key],"inactive expertise changed");
  const practice=now.map((g,i)=>(g.expertise[builds[name][i][0]]-old[i].expertise[builds[name][i][0]])/expertise.EXPERTISE_BALANCE.unitsPerHour);
  sessions++;bouts+=a.bouts??0;
  return {coins,victories:a.victories??0,bouts:a.bouts??0,downtimeMs:a.downtimeMs??0,xp:next.skills.fighting.xp-s.skills.fighting.xp,practiceFirst:practice[0],practiceSecond:practice[1],spent,upgrades:result.autoEquipment?.upgrades.length??0,activeHours:(next.productiveElapsedMs-s.productiveElapsedMs)/H,capped:+e.activityRewardCapped(next),teamworkXP:next.teamwork.xp,teamworkLevel:next.teamwork.level,stats:[base.first.str,base.first.dex,base.first.end]};
 };
 // Check the experimental normal snapshot is outcome-neutral in actual settlement.
 for(const name of Object.keys(builds)){
  const s=fixture(name,"normal/normal",seeds[0],0),p=e.desiredArenaTeam(s);
  const original={...s};delete original.researchRoles;delete original.researchMastery;
  const a=e.enterGame(s,s.settledAtMs+H,c.seededCombatRandom(42)),b=e.enterGame(original,s.settledAtMs+H,c.seededCombatRandom(42));
  assert.deepEqual(a.offlineArena,b.offlineArena);assert.equal(a.state.skills.fighting.xp,b.state.skills.fighting.xp);parity++;
 }
 for(const name of Object.keys(builds)){
  const prior=previous.npc.find(t=>t.name===name);assert.ok(prior);
  const choices={good:prior.best,normal:"normal/normal",poor:prior.worst};
  if(name==="spear_archer")choices.mixed="defensive/aggressive";
  for(const fraction of [0,.9,1])for(const duration of fraction===1?[24]:windows){
   const samples=[];
   for(const origin of fraction===1?seeds.slice(0,2):seeds){
    const v=Object.fromEntries(Object.entries(choices).map(([k,mode])=>[k,simulate(name,mode,origin,duration,fraction)]));
    if(fraction===1)for(const t of Object.values(v))assert.equal(t.coins+t.bouts+t.xp+t.practiceFirst+t.practiceSecond,0);
    samples.push(v);
   }
   rows.push({name,choices,fraction,duration,samples});
  }
 }
 const mean=(a,k)=>a.reduce((s,v)=>s+v[k],0)/a.length;
 const summarize=(a)=>{
  const good=a.map(v=>v.good),poor=a.map(v=>v.poor),normal=a.map(v=>v.normal);
  const m=x=>Object.fromEntries(fields.map(k=>[k,mean(x,k)]));
  const cmp=(a,b)=>{let more=0,notice15=0,notice30=0,less=0,tie=0;for(let i=0;i<a.length;i++){let x=a[i].coins,y=b[i].coins;more+=+(x>y);less+=+(x<y);tie+=+(x===y);notice15+=+(y>0&&x>=y*1.15);notice30+=+(y>0&&x>=y*1.3);}return {n:a.length,more,less,tie,notice15,notice30};};
  return {good:m(good),normal:m(normal),poor:m(poor),paired:cmp(good,poor),independent:cmp(good,poor.map((_,i)=>poor[(i+1)%poor.length])),vsNormal:cmp(good,normal)};
 };
 const summaries=[];
 for(const fraction of [0,.9,1])for(const duration of fraction===1?[24]:windows){
  const selected=rows.filter(x=>x.fraction===fraction&&x.duration===duration);
  const perTeam=selected.map(x=>({name:x.name,choices:x.choices,...summarize(x.samples),...(x.name==="spear_archer"?{mixed:Object.fromEntries(fields.map(k=>[k,mean(x.samples.map(v=>v.mixed),k)]))}:{})}));
  // Independent comparison is per build, not across distinct equipment.
  const all=selected.flatMap(x=>x.samples),summary=summarize(all);
  summary.independent=perTeam.map(t=>t.independent).reduce((s,t)=>Object.fromEntries(Object.keys(t).map(k=>[k,(s[k]??0)+t[k]])),{});
  summaries.push({fraction,duration,...summary,perTeam});
 }
 console.log(JSON.stringify({grade,mastery,seed,level,hours,windows,seeds,parity,sessions,bouts,summaries,rows}));
}finally{await rm(dir,{recursive:true,force:true});}
