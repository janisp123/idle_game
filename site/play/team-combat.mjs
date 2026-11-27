// Team geometry and decisions; all damage and durability use physical-actions.
import { PHYSICAL_RULES,WEAPONS,TACTICS,seededRandom,fighter,wound,vitals,mobility,resolveStrike } from "./physical-actions.mjs?v=kits-001";
import {COUNTERS,GROUP_COMBAT_RULES_VERSION,SUPPORTED_GROUP_COMBAT_RULES,tacticalActor,intactTank} from "./group-counter-rules.mjs";
import {kitActor,pilotKit} from "./class-kits.mjs";
import {prepareKitActor,expireKitEffects,markKitMovement,kitApproach,kitTargetDisrupted} from "./class-effects.mjs";
import {tryKitAction} from "./class-ability-policy.mjs";
import { coordinationChance } from "./teamwork.mjs?v=team-002";
import {TACTIC_BALANCE,tacticActivation,validTacticSnapshot} from "./manager-tactics.mjs?v=manager-tactics-001";
import {validGroupSnapshot,classWeapon,prepareClassActor,expireClassEffects,tryClassAction} from "./battle-group-actions.mjs?v=terrain-003";
export const TEAM_COMBAT_BALANCE=Object.freeze({maxRoster:7,maxRounds:PHYSICAL_RULES.turnLimit,
  rearSpace:3,interceptRecovery:1,focusWeight:2,healthWeight:1.5});
const alive=a=>a.hp>0;
const gap=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const distance=(a,b)=>Math.max(0,gap(a,b)-1);
const activeWeapon=a=>(a.classId&&classWeapon(a))||(a.loadout==="bow"&&(!a.arrows||!a.weapon.hp)?WEAPONS.dagger:WEAPONS[a.loadout]);
const bowActive=a=>activeWeapon(a)===WEAPONS.bow;
const other=(actors,a)=>actors.filter(b=>b.side!==a.side&&alive(b));
const allies=(actors,a)=>actors.filter(b=>b.side===a.side&&b!==a&&alive(b));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export const teamArenaWidth=terrain=>2*TEAM_COMBAT_BALANCE.rearSpace+clamp(terrain.startDistance??2,0,2)+2;
const validRoster=r=>Array.isArray(r)&&r.length>0&&r.length<=TEAM_COMBAT_BALANCE.maxRoster&&r.every(a=>a&&Object.hasOwn(WEAPONS,a.loadout)&&a.loadout!=="dagger"&&(!a.classId||validGroupSnapshot(a))&&validTacticSnapshot(a)&&["str","dex","end","skill"].every(k=>Number.isFinite(a[k])&&a[k]>=0&&a[k]<=1e6));
function makeActors(roster,side,terrain,rules){
  const start=clamp(terrain.startDistance??2,0,2)+1;
  const tactical=[2,3].includes(rules)&&roster.every(x=>x.classId);
  const frontline=roster.map((s,i)=>({s,i})).filter(({s})=>!classWeapon(s)?.ranged).sort((a,b)=>Number(b.s.role==="tank")-Number(a.s.role==="tank"));
  const backline=roster.map((s,i)=>({s,i})).filter(({i})=>!frontline.some(x=>x.i===i));
  const lanes=Array.from({length:roster.length},(_,i)=>i).sort((a,b)=>Math.abs(a-(roster.length-1)/2)-Math.abs(b-(roster.length-1)/2)||a-b);
  return roster.map((snapshot,i)=>{
    // Front-line melee, rear-line ranged. Symmetric coordinates, no class lock.
    const rear=tactical?Number(frontline.length>0&&backline.some(x=>x.i===i)):snapshot.loadout==="bow"&&roster.some(x=>x.loadout!=="bow")?1:0;
    const front=TEAM_COMBAT_BALANCE.rearSpace;
    const x=side==="player"?front-rear:front+start+rear;
    const y=tactical?lanes[(rear?backline:frontline.length?frontline:backline).findIndex(x=>x.i===i)]:i;
    return prepareKitActor(prepareClassActor({...fighter(snapshot,side),...(tactical?{groupCombatRules:rules}:{}),id:side+":"+i,x,y,approach:0,
      retreats:terrain.retreatSpace??(terrain.retreat===false?0:3),intercepted:-1,targetId:null,bleedSource:null,actions:0}));
  });
}
function adjacent(a,actors,height,width,side,terrain={}){
  const d=side==="player"?1:-1;
  return [[a.x-d,a.y],[a.x+d,a.y],[a.x,a.y-1],[a.x,a.y+1]]
    .filter(([x,y])=>x>=0&&x<width&&y>=0&&y<height&&
      !actors.some(b=>alive(b)&&b!==a&&b.x===x&&b.y===y)&&
      !(tacticalActor(a)&&terrain.id==="narrow_bridge"&&x>TEAM_COMBAT_BALANCE.rearSpace&&x<TEAM_COMBAT_BALANCE.rearSpace+3&&Math.abs(y-(height-1)/2)>(COUNTERS.bridgeWidth-1)/2)).map(([x,y])=>({x,y}));
}
function chooseTarget(a,actors,coordinated,roll){
  const enemies=other(actors,a),range=activeWeapon(a).range;
  const disrupted=kitTargetDisrupted(a);if(disrupted)coordinated=false;
  const peers=allies(actors,a),tactical=tacticalActor(a),anyReachable=enemies.some(e=>distance(a,e)<=range);
  return enemies.map(b=>{
    const d=distance(a,b),reachable=d<=range;
    const focus=peers.filter(c=>c.targetId===b.id).length;
    const eligible=reachable||!anyReachable;
    const score=-(Math.max(0,d-range)*3+d*.25)+(coordinated&&(!tactical||eligible)?
      (1-b.hp/b.maxHP)*TEAM_COMBAT_BALANCE.healthWeight+focus*TEAM_COMBAT_BALANCE.focusWeight:0);
    // Only take extra focus opportunities if already reachable or no foe is.
    // Actual reachability prevents coordinated fighters chasing unreachable focus while another foe is in range.
    const role=disrupted?null:a.activeTactic,bonus=eligible?(role==="aggressive"?
      (1-b.hp/b.maxHP)*TACTIC_BALANCE.aggressiveHealth+focus*TACTIC_BALANCE.aggressiveFocus:
      role==="balanced"&&!coordinated?(1-b.hp/b.maxHP)*TACTIC_BALANCE.balancedHealth+focus*TACTIC_BALANCE.balancedFocus:0):0;
    const counter=tactical&&eligible?COUNTERS.targetCounterPriority*(a.role==="ranged"?(intactTank(b)?-1:["mage","healer","summoner"].includes(b.role)?1:0):a.role==="mage"&&b.role==="tank"?1:a.role==="melee"&&["ranged","mage","healer"].includes(b.role)?1:0):0;
    return {b,score:score+bonus+counter+(reachable?1:0),tie:roll()};
  }).sort((a,b)=>b.score-a.score||a.tie-b.tie)[0]?.b;
}
function move(a,target,actors,height,width,retreat,roll,terrain){
  const opponents=other(actors,a);
  const nearest=p=>Math.min(...opponents.map(e=>gap(p,e)));
  const steps=adjacent(a,actors,height,width,a.side,terrain);
  if(retreat){
    const before=nearest(a);
    const best=steps.map(p=>({p,score:nearest(p)-before,tie:roll()}))
      .filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.tie-b.tie)[0];
    if(!best)return false;Object.assign(a,best.p);markKitMovement(a);return true;
  }
  // Find the shortest walkable route to a legal attack tile, including
  // lateral detours around either team. Small bounded grid; no teleport.
  const key=p=>p.x+":"+p.y,seen=new Set([key(a)]);
  const queue=steps.map(p=>({p,first:p,tie:roll()})).sort((a,b)=>a.tie-b.tie);
  for(const {p} of queue)seen.add(key(p));
  const range=activeWeapon(a).range;
  for(let i=0;i<queue.length;i++){
    const {p,first}=queue[i];
    if(distance(p,target)<=range){Object.assign(a,first);markKitMovement(a);return true;}
    for(const next of adjacent({...p,classId:a.classId,groupCombatRules:a.groupCombatRules},actors,height,width,a.side,terrain)){
      const k=key(next);if(seen.has(k))continue;seen.add(k);queue.push({p:next,first});
    }
  }
  return false;
}
function intercept(a,target,actors,round,chance,roll,range=activeWeapon(a).range){
  if(tacticalActor(a)&&tacticalActor(target)&&activeWeapon(a).move==="shot"){
    if(intactTank(target))return target;
    const d=a.side==="player"?1:-1;
    const guard=allies(actors,target).filter(g=>intactTank(g)&&!g.stagger&&!g.guardOpen&&g.activeTactic!=="aggressive"&&gap(g,target)<=COUNTERS.interceptRange&&distance(a,g)<=range&&(target.x-g.x)*d>=0&&(g.arrowInterceptRound!==round||(g.arrowInterceptCount??0)<COUNTERS.arrowInterceptions)).sort((x,y)=>gap(x,target)-gap(y,target)||y.hp/y.maxHP-x.hp/x.maxHP)[0];
    if(!guard||roll()>=(guard.activeTactic==="defensive"?Math.max(chance,tacticActivation(guard.tacticLevel)):chance))return target;
    guard.arrowInterceptCount=guard.arrowInterceptRound===round?(guard.arrowInterceptCount??0)+1:1;guard.arrowInterceptRound=round;
    // Shield covers the adjacent lane without swapping into the arrow path or teleporting.
    return guard;
  }
  // A nearby shield bearer can step into a reachable attack, never teleport.
  // At most once per round, costs recovery, and cannot protect when staggered,
  // guard-open, broken or in worse health than the ally.
  if(activeWeapon(a).ranged)return target;
  const guard=allies(actors,target).filter(g=>g.shield.hp>0&&!g.stagger&&!g.guardOpen&&g.intercepted!==round&&
    gap(g,target)===1&&(tacticalActor(g)||g.hp/g.maxHP>=target.hp/target.maxHP)&&g.activeTactic!=="aggressive")
    .sort((a,b)=>b.hp/b.maxHP-a.hp/a.maxHP)[0];
  if(!guard||roll()>=(guard.activeTactic==="defensive"?Math.max(chance,tacticActivation(guard.tacticLevel)):chance))return target;
  // Swap adjacent allies: the protector occupies the originally reachable tile.
  const {x,y}=guard;guard.x=target.x;guard.y=target.y;target.x=x;target.y=y;
  guard.approach=0;target.approach=0;markKitMovement(guard);markKitMovement(target);
  guard.intercepted=round;guard.recovery=Math.max(guard.recovery,TEAM_COMBAT_BALANCE.interceptRecovery);return guard;
}
export function resolveTeamBattle(players,enemies,seed,terrain={},levels={player:1,enemy:1}){
  if(!validRoster(players)||!validRoster(enemies)||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)
    throw new RangeError("Invalid team combat input");
  const chance={player:coordinationChance(levels.player),enemy:coordinationChance(levels.enemy)};
  const rules=levels.groupCombatRules??GROUP_COMBAT_RULES_VERSION;
  if(!SUPPORTED_GROUP_COMBAT_RULES.includes(rules))throw new RangeError("Unknown group combat rules");
  const actors=[...makeActors(players,"player",terrain,rules),...makeActors(enemies,"enemy",terrain,rules)];
  const height=Math.max(players.length,enemies.length),width=teamArenaWidth(terrain),roll=seededRandom(seed),speedRoll=seededRandom((seed^0x85ebca6b)>>>0),
    initiative=seededRandom((seed^0x9e3779b9)>>>0),decision=seededRandom((seed^0x517cc1b7)>>>0);
  const tactical=seededRandom((seed^0x4f7b3241)>>>0);
  const events=[];let round=0;
  const record=(a,b,type,extra={})=>{
    events.push({type,round,actor:a?.id??null,target:b?.id??null,damage:0,...extra,
      vitals:Object.fromEntries(actors.map(c=>[c.id,{...vitals(c),x:c.x,y:c.y}]))});
  };
  const has=side=>actors.some(a=>a.side===side&&alive(a));
  record(null,null,"engage");
  for(round=1;round<=TEAM_COMBAT_BALANCE.maxRounds&&has("player")&&has("enemy");round++){
    for(const a of actors){expireClassEffects(a,round);expireKitEffects(a,round);if(kitActor(a))a.kitRound=round;}
    // Random jitter on existing DEX/mobility initiative, no slot-order priority.
    const order=actors.filter(alive).map(a=>({a,score:a.dex+mobility(a)/10+initiative()*10}))
      .sort((a,b)=>b.score-a.score);
    for(const {a} of order){
      if(!alive(a)||!has("player")||!has("enemy"))continue;
      a.actions++;if(kitActor(a))a.kitStationary++;
      if(a.guardOpen>0)a.guardOpen--;
      if(a.bleed>0){
        a.bleed--;
        const source=actors.find(b=>b.id===a.bleedSource)??other(actors,a)[0];
        const damage=wound(source,a,2);record(source,a,"bleed",{damage});
        if(!alive(a))continue;
      }
      a.activeTactic=null;
      if(a.stagger>0){a.stagger--;record(a,null,"stagger");continue;}
      if(a.tactic!==undefined&&tactical()<tacticActivation(a.tacticLevel))a.activeTactic=a.tactic;
      const coordinated=decision()<chance[a.side],target=chooseTarget(a,actors,coordinated,decision);
      if(!target)continue;
      a.targetId=target.id;
      const active=activeWeapon(a),bow=bowActive(a);
      const ctx={terrain,roll,speedRoll,record,intercept:(x,y,range)=>intercept(x,y,actors,round,chance[y.side],decision,range),move:(x,y,retreat)=>move(x,y,actors,height,width,retreat,decision,terrain)};
      if(pilotKit(a)?tryKitAction(a,target,actors,round,active,ctx):a.classId&&tryClassAction(a,target,actors,round,ctx))continue;
      // Defensive fighters may escort threatened allies only when they
      // cannot take a ready attack. Real tile movement and turn cost.
      if(a.activeTactic==="defensive"&&a.shield.hp>0&&!a.guardOpen){
        const ward=allies(actors,a).filter(b=>b.shield.hp===0).sort((b,c)=>b.hp/b.maxHP-c.hp/c.maxHP)[0];
        const threats=ward?other(actors,a).filter(e=>!activeWeapon(e).ranged&&distance(e,ward)<=activeWeapon(e).range+1):[];
        if(ward&&gap(a,ward)>1&&threats.length&&(a.recovery>0||!other(actors,a).some(e=>distance(a,e)<=active.range))){
          const candidates=adjacent(a,actors,height,width,a.side,terrain).filter(p=>gap(p,ward)<gap(a,ward))
            .map(p=>({p,d:gap(p,ward),threat:Math.min(...threats.map(e=>gap(p,e))),tie:tactical()})).sort((b,c)=>b.d-c.d||b.threat-c.threat||b.tie-c.tie);
          if(candidates.length){Object.assign(a,candidates[0].p);markKitMovement(a);a.approach=0;a.recovery=Math.max(0,a.recovery-1);record(a,ward,"approach",{tactic:"escort"});continue;}
        }
      }
      // Defensive reach weapons preserve space at the cost of a ready turn.
      if(a.activeTactic==="defensive"&&a.recovery===0&&active.range>0&&a.retreats>0&&distance(a,target)<active.range&&
        mobility(a)>=mobility(target)+TACTICS.retreatLead&&move(a,target,actors,height,width,true,tactical,terrain)){
        a.retreats--;a.approach=0;record(a,target,"retreat",{tactic:"maintain_range"});continue;
      }
      if(a.recovery>0){
        a.recovery--;
        if(bow&&!tacticalActor(a)&&a.activeTactic!=="aggressive"&&a.retreats>0&&distance(a,target)<2&&mobility(a)>=mobility(target)+TACTICS.retreatLead&&move(a,target,actors,height,width,true,decision,terrain)){
          a.retreats--;a.approach=0;record(a,target,"retreat");
        }
        continue;
      }
      if(distance(a,target)>active.range){
        const pursuit=tacticalActor(a)&&a.role==="melee"?(a.trainingKit?.armour?.torso==="leather"?COUNTERS.lightMeleeApproach:COUNTERS.heavyMeleeApproach):1;
        a.approach+=(mobility(a)>=TACTICS.quickMobility?1:TACTICS.slowApproach)*pursuit*kitApproach(a)*(a.activeTactic==="aggressive"?TACTIC_BALANCE.aggressiveApproach:1);
        if(a.approach>=(terrain.approachSteps??1)){
          a.approach=0;move(a,target,actors,height,width,false,decision,terrain);
        }
        record(a,target,"approach");continue;
      }
      const actual=intercept(a,target,actors,round,chance[target.side],decision);
      if(actual!==target)record(actual,a,"intercept",{protected:target.id});
      resolveStrike(a,actual,{active,bow,distance:Math.min(2,distance(a,actual)),terrain,roll,speedRoll,record,
        interruptApproach:b=>{b.approach=0;},onBleed:(source,b)=>{b.bleedSource=source.id;}});
    }
  }
  const totals=side=>actors.filter(a=>a.side===side).reduce((r,a)=>({hp:r.hp+a.hp,maxHP:r.maxHP+a.maxHP,inflicted:r.inflicted+a.inflicted}),{hp:0,maxHP:0,inflicted:0});
  const p=totals("player"),e=totals("enemy"),timeout=p.hp>0&&e.hp>0;
  const outcome=!e.hp&&p.hp?"victory":!p.hp&&e.hp?"defeat":
    timeout&&p.hp/p.maxHP>e.hp/e.maxHP&&p.inflicted>0?"victory":
    timeout&&e.hp/e.maxHP>p.hp/p.maxHP&&e.inflicted>0?"defeat":"double_death";
  const survivors=Object.fromEntries(actors.map(a=>[a.id,a.hp]));
  record(null,null,outcome,{reason:timeout?"timeout":"knockout"});
  return {outcome,reason:timeout?"timeout":"knockout",rounds:Math.min(round-1,TEAM_COMBAT_BALANCE.maxRounds),
    events,survivors,participation:Object.fromEntries(actors.map(a=>[a.id,a.actions]))};
}
