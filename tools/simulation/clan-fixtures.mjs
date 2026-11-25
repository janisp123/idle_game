/** CLAN-TEST-001: isolated, synthetic scenario harness, NOT production multiplayer.
 * No file writes, network, live saves, implicit clocks or public admin endpoints.
 * All undecided policies are explicitly fixture inputs. No production economy tuning.
 */
import { ITEM_KEYS, SKILL_IDS } from '../../site/play/engine.mjs';

const DAY=86_400_000;
const RANK_LIMITS=Object.freeze({vice:1,general:5,officer:15});
const fail=message=>{throw new RangeError(message);};
const int=(value,min,max=Number.MAX_SAFE_INTEGER)=>{
  if(!Number.isSafeInteger(value)||value<min||value>max)fail('Invalid integer');
  return value;
};
const id=value=>{
  if(typeof value!=='string'||!/^test-[a-z0-9-]{1,60}$/.test(value))fail('Synthetic test-* ID required');
  return value;
};
const knownItems=new Set(ITEM_KEYS);
function quantities(input,allowEmpty=false){
  if(!input||typeof input!=='object'||Array.isArray(input))fail('Invalid resources');
  const entries=Object.entries(input);
  if(!allowEmpty&&!entries.length)fail('Empty donation');
  return Object.fromEntries(entries.map(([key,value])=>{
    if(!knownItems.has(key))fail('Unknown resource');
    return [key,int(value,1)];
  }));
}
const sum=(a,b)=>int(a+b,0);

/** Replays synthetic operations with explicitly supplied test capacity and unit cap.
 * Founding uses fixture playedDays; UTC day and aggregate unit cap are TEST choices.
 * Join is a fixture admission operation, not a proposed public recruitment policy.
 */
export function simulateClan(config){
  const policy=config.policy??{};
  const capacity=int(policy.capacity,1,1000);
  const dailyCap=int(policy.dailyCap,1);
  let now=int(config.startMs??0,0,Number.MAX_SAFE_INTEGER-7*DAY);
  if(!Array.isArray(config.actions)||config.actions.length>10000)fail('Expected at most 10000 actions');
  const players=new Map(),clans=new Map(),results=[];
  const player=key=>players.get(id(key))??fail('Unknown test player');
  const clan=key=>clans.get(id(key))??fail('Unknown test clan');
  const member=p=>p.clanId?clan(p.clanId):fail('Not a clan member');
  const leader=p=>{const c=member(p);if(c.leader!==p.id)fail('Leader required');return c;};
  function admission(p,c){
    if(p.clanId)fail('Already in a clan');
    if(now<p.cooldownUntil)fail('Seven-day cooldown');
    if(c.members.size>=capacity)fail('Clan full');
  }
  function execute(a){
    switch(a.op){
      case 'createPlayer':{
        const key=id(a.id);
        if(players.has(key))fail('Duplicate test player');
        const activity=a.activity??'mining';
        if(!SKILL_IDS.includes(activity))fail('Unknown activity');
        if(a.online!==undefined&&typeof a.online!=='boolean')fail('Invalid online flag');
        const p={id:key,activity,playedDays:int(a.playedDays??0,0),online:a.online??true,
          stock:quantities(a.stock??{},true),clanId:null,rank:null,cooldownUntil:0,lastDonationDay:null};
        players.set(key,p);return {id:key};
      }
      case 'createClan':{
        const p=player(a.actor),key=id(a.id);
        if(clans.has(key))fail('Duplicate test clan');
        if(p.playedDays<7)fail('Seven played days required');
        const c={id:key,leader:p.id,members:new Set(),warehouse:{},ledger:[]};
        admission(p,c);
        clans.set(key,c);c.members.add(p.id);p.clanId=key;p.rank='leader';
        return {clanId:key};
      }
      case 'join':{
        const p=player(a.actor),c=clan(a.clanId);admission(p,c);
        c.members.add(p.id);p.clanId=c.id;p.rank='member';return {clanId:c.id};
      }
      case 'leave':{
        const p=player(a.actor),c=member(p);
        if(c.leader===p.id)fail('Transfer leadership first');
        const until=sum(now,7*DAY);
        c.members.delete(p.id);p.clanId=null;p.rank=null;p.cooldownUntil=until;
        return {cooldownUntil:until};
      }
      case 'online':{
        const p=player(a.actor);
        if(typeof a.value!=='boolean')fail('Invalid online flag');
        p.online=a.value;return {online:p.online};
      }
      case 'advanceDays':{
        const days=int(a.days,0,36500);
        now=int(now+days*DAY,0,Number.MAX_SAFE_INTEGER-7*DAY);
        return {now};
      }
      case 'assignRank':{
        const c=leader(player(a.actor)),p=player(a.target);
        if(p.clanId!==c.id||p.id===c.leader)fail('Invalid rank target');
        if(a.rank!=='member'&&!Object.hasOwn(RANK_LIMITS,a.rank))fail('Invalid rank');
        const used=[...c.members].filter(key=>key!==p.id&&player(key).rank===a.rank).length;
        if(a.rank!=='member'&&used>=RANK_LIMITS[a.rank])fail('Rank slots full');
        p.rank=a.rank;return {rank:p.rank};
      }
      case 'transfer':{
        const old=player(a.actor),c=leader(old),next=player(a.target);
        if(next.clanId!==c.id||next.id===old.id)fail('Invalid successor');
        // Fixture choice: former leader becomes ordinary member, not a product decision.
        old.rank='member';next.rank='leader';c.leader=next.id;return {leader:next.id};
      }
      case 'donate':{
        const p=player(a.actor),c=member(p);
        if(!p.online)fail('Online member required');
        const day=Math.floor(now/DAY);
        if(p.lastDonationDay===day)fail('Already donated today');
        const items=quantities(a.items);
        let total=0;
        const credits={};
        for(const [key,n] of Object.entries(items)){
          total=sum(total,n);
          if((p.stock[key]??0)<n)fail('Insufficient personal stock');
          credits[key]=sum(c.warehouse[key]??0,n);
        }
        if(total>dailyCap)fail('Daily cap exceeded');
        for(const [key,n] of Object.entries(items)){
          p.stock[key]-=n;c.warehouse[key]=credits[key];
        }
        p.lastDonationDay=day;
        c.ledger.push({actor:p.id,day,items});
        return {total,items};
      }
      default:fail('Unknown test operation');
    }
  }
  for(const [index,a] of config.actions.entries()){
    if(!a||typeof a!=='object'||Array.isArray(a))fail('Invalid action');
    try{results.push({index,op:a.op,ok:true,...execute(a)});}
    catch(error){
      if(!(error instanceof RangeError))throw error;
      results.push({index,op:a.op,ok:false,reason:error.message});
    }
  }
  return {module:'clan',synthetic:true,policy:{capacity,dailyCap,dayBoundary:'UTC fixture',capMode:'aggregate units fixture',
    founding:'playedDays fixture',recruitment:'direct admission fixture',formerLeader:'ordinary member fixture'},
    now,accepted:results.filter(r=>r.ok).length,rejected:results.filter(r=>!r.ok).length,
    players:[...players.values()],clans:[...clans.values()].map(c=>({...c,members:[...c.members]})),results,
    note:'Synthetic in-memory clan scenario only. Policies are not production defaults. No live player data or save access.'};
}
