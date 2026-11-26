// Team geometry and decisions; all damage and durability use physical-actions.
import { PHYSICAL_RULES,WEAPONS,TACTICS,seededRandom,fighter,wound,vitals,mobility,resolveStrike } from "./physical-actions.mjs?v=team-002";
import { coordinationChance } from "./teamwork.mjs?v=team-002";
export const TEAM_COMBAT_BALANCE=Object.freeze({maxRoster:6,maxRounds:PHYSICAL_RULES.turnLimit,
  width:9,interceptRecovery:1,focusWeight:2,healthWeight:1.5});
const alive=a=>a.hp>0;
const gap=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const distance=(a,b)=>Math.max(0,gap(a,b)-1);
const activeWeapon=a=>a.loadout==="bow"&&(!a.arrows||!a.weapon.hp)?WEAPONS.dagger:WEAPONS[a.loadout];
const bowActive=a=>activeWeapon(a)===WEAPONS.bow;
const other=(actors,a)=>actors.filter(b=>b.side!==a.side&&alive(b));
const allies=(actors,a)=>actors.filter(b=>b.side===a.side&&b!==a&&alive(b));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const validRoster=r=>Array.isArray(r)&&r.length>0&&r.length<=TEAM_COMBAT_BALANCE.maxRoster&&r.every(a=>a&&Object.hasOwn(WEAPONS,a.loadout)&&a.loadout!=="dagger"&&["str","dex","end","skill"].every(k=>Number.isFinite(a[k])&&a[k]>=0&&a[k]<=1e6));
function makeActors(roster,side,terrain){
  const start=clamp(terrain.startDistance??2,0,2)+1;
  return roster.map((snapshot,i)=>{
    // Front-line melee, rear-line ranged. Symmetric coordinates, no class lock.
    const rear=snapshot.loadout==="bow"&&roster.some(x=>x.loadout!=="bow")?1:0;
    const x=side==="player"?3-rear:3+start+rear;
    return {...fighter(snapshot,side),id:side+":"+i,x,y:i,approach:0,
      retreats:terrain.retreatSpace??(terrain.retreat===false?0:3),intercepted:-1,targetId:null,bleedSource:null,actions:0};
  });
}
function adjacent(a,actors,height){
  return [[a.x-1,a.y],[a.x+1,a.y],[a.x,a.y-1],[a.x,a.y+1]]
    .filter(([x,y])=>x>=0&&x<TEAM_COMBAT_BALANCE.width&&y>=0&&y<height&&
      !actors.some(b=>alive(b)&&b!==a&&b.x===x&&b.y===y)).map(([x,y])=>({x,y}));
}
function chooseTarget(a,actors,coordinated,roll){
  const enemies=other(actors,a),range=activeWeapon(a).range;
  const peers=allies(actors,a);
  return enemies.map(b=>{
    const d=distance(a,b),reachable=d<=range;
    const focus=peers.filter(c=>c.targetId===b.id).length;
    const score=-(Math.max(0,d-range)*3+d*.25)+(coordinated?
      (1-b.hp/b.maxHP)*TEAM_COMBAT_BALANCE.healthWeight+focus*TEAM_COMBAT_BALANCE.focusWeight:0);
    return {b,score:score+(reachable?1:0),tie:roll()};
  }).sort((a,b)=>b.score-a.score||a.tie-b.tie)[0]?.b;
}
function move(a,target,actors,height,retreat,roll){
  const opponents=other(actors,a);
  const nearest=p=>Math.min(...opponents.map(e=>gap(p,e)));
  const before=retreat?nearest(a):gap(a,target);
  const best=adjacent(a,actors,height).map(p=>({p,score:retreat?nearest(p)-before:before-gap(p,target),tie:roll()}))
    .filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.tie-b.tie)[0];
  if(!best)return false;
  Object.assign(a,best.p);return true;
}
function intercept(a,target,actors,round,chance,roll){
  // A nearby shield bearer can step into a reachable attack, never teleport.
  // At most once per round, costs recovery, and cannot protect when staggered,
  // guard-open, broken or in worse health than the ally.
  if(activeWeapon(a).ranged)return target;
  const guard=allies(actors,target).filter(g=>g.shield.hp>0&&!g.stagger&&!g.guardOpen&&g.intercepted!==round&&
    gap(g,target)===1&&g.hp/g.maxHP>=target.hp/target.maxHP)
    .sort((a,b)=>b.hp/b.maxHP-a.hp/a.maxHP)[0];
  if(!guard||roll()>=chance)return target;
  // Swap adjacent allies: the protector occupies the originally reachable tile.
  const {x,y}=guard;guard.x=target.x;guard.y=target.y;target.x=x;target.y=y;
  guard.approach=0;target.approach=0;
  guard.intercepted=round;guard.recovery=Math.max(guard.recovery,TEAM_COMBAT_BALANCE.interceptRecovery);return guard;
}
export function resolveTeamBattle(players,enemies,seed,terrain={},levels={player:1,enemy:1}){
  if(!validRoster(players)||!validRoster(enemies)||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)
    throw new RangeError("Invalid team combat input");
  const chance={player:coordinationChance(levels.player),enemy:coordinationChance(levels.enemy)};
  const actors=[...makeActors(players,"player",terrain),...makeActors(enemies,"enemy",terrain)];
  const height=Math.max(players.length,enemies.length),roll=seededRandom(seed),speedRoll=seededRandom((seed^0x85ebca6b)>>>0),
    initiative=seededRandom((seed^0x9e3779b9)>>>0),decision=seededRandom((seed^0x517cc1b7)>>>0);
  const events=[];let round=0;
  const record=(a,b,type,extra={})=>{
    events.push({type,round,actor:a?.id??null,target:b?.id??null,damage:0,...extra,
      vitals:Object.fromEntries(actors.map(c=>[c.id,{...vitals(c),x:c.x,y:c.y}]))});
  };
  const has=side=>actors.some(a=>a.side===side&&alive(a));
  record(null,null,"engage");
  for(round=1;round<=TEAM_COMBAT_BALANCE.maxRounds&&has("player")&&has("enemy");round++){
    // Random jitter on existing DEX/mobility initiative, no slot-order priority.
    const order=actors.filter(alive).map(a=>({a,score:a.dex+mobility(a)/10+initiative()*10}))
      .sort((a,b)=>b.score-a.score);
    for(const {a} of order){
      if(!alive(a)||!has("player")||!has("enemy"))continue;
      a.actions++;
      if(a.guardOpen>0)a.guardOpen--;
      if(a.bleed>0){
        a.bleed--;
        const source=actors.find(b=>b.id===a.bleedSource)??other(actors,a)[0];
        const damage=wound(source,a,2);record(source,a,"bleed",{damage});
        if(!alive(a))continue;
      }
      if(a.stagger>0){a.stagger--;record(a,null,"stagger");continue;}
      const coordinated=decision()<chance[a.side],target=chooseTarget(a,actors,coordinated,decision);
      if(!target)continue;
      a.targetId=target.id;
      const active=activeWeapon(a),bow=bowActive(a);
      if(a.recovery>0){
        a.recovery--;
        if(bow&&a.retreats>0&&distance(a,target)<2&&mobility(a)>=mobility(target)+TACTICS.retreatLead&&move(a,target,actors,height,true,decision)){
          a.retreats--;a.approach=0;record(a,target,"retreat");
        }
        continue;
      }
      if(distance(a,target)>active.range){
        a.approach+=mobility(a)>=TACTICS.quickMobility?1:TACTICS.slowApproach;
        if(a.approach>=(terrain.approachSteps??1)){
          a.approach=0;move(a,target,actors,height,false,decision);
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
