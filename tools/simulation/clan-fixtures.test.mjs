import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulateClan } from './clan-fixtures.mjs';
const create=(id,extra={})=>({op:'createPlayer',id:'test-'+id,...extra});
const found=(actor,id)=>({op:'createClan',actor:'test-'+actor,id:'test-'+id});
const join=(actor,clan)=>({op:'join',actor:'test-'+actor,clanId:'test-'+clan});
const donate=(actor,items)=>({op:'donate',actor:'test-'+actor,items});
const run=(actions,capacity=25,dailyCap=10)=>simulateClan({policy:{capacity,dailyCap},actions});
test('fixture roster, capacity, founding, single membership and seven-day cooldown',()=>{
  const r=run([create('young',{playedDays:6}),found('young','premature'),
    create('leader',{playedDays:7}),found('leader','castle'),create('other',{playedDays:7}),found('other','second'),
    join('young','castle'),join('young','second'),create('spare'),join('spare','castle'),
    {op:'leave',actor:'test-young'},join('young','second'),{op:'advanceDays',days:6},join('young','second'),
    {op:'advanceDays',days:1},join('young','second')],2);
  assert.deepEqual(r.results.map(x=>x.ok),[true,false,true,true,true,true,true,false,true,false,true,false,true,false,true,true]);
  assert.deepEqual(r.clans.map(c=>c.members),[['test-leader'],['test-other','test-young']]);
});
test('fake members give bounded real resources once per day; no stock lost on rejection',()=>{
  const r=run([create('leader',{playedDays:7}),found('leader','castle'),
    create('miner',{stock:{stone:1000000,log:15}}),join('miner','castle'),
    donate('miner',{stone:11}),donate('miner',{stone:8,log:3}),
    donate('miner',{stone:8,log:2}),donate('miner',{stone:1}),
    {op:'advanceDays',days:1},{op:'online',actor:'test-miner',value:false},
    donate('miner',{stone:10}),{op:'online',actor:'test-miner',value:true},
    donate('miner',{stone:10}),{op:'advanceDays',days:1},
    donate('miner',{stone:1,unknown:1}),donate('miner',{stone:-1}),donate('miner',{stone:1.5}),
    donate('miner',{log:14}),donate('miner',{stone:10}),
    {op:'leave',actor:'test-miner'}]);
  assert.deepEqual(r.results.map(x=>x.ok),[true,true,true,true,false,false,true,false,true,true,false,true,true,true,false,false,false,false,true,true]);
  assert.deepEqual(r.clans[0].warehouse,{stone:28,log:2});
  assert.equal(r.clans[0].ledger.length,3);
  assert.equal(r.players[1].stock.stone,999972);
  assert.equal(r.players[1].stock.log,13);
  assert.equal(r.players[1].clanId,null);
});
test('leader-only ranks and permanent leadership, including all slot limits',()=>{
  const actions=[create('leader',{playedDays:7}),found('leader','castle')];
  for(let i=0;i<24;i++)actions.push(create('member-'+i),join('member-'+i,'castle'));
  const assign=(n,rank,actor='leader')=>({op:'assignRank',actor:'test-'+actor,target:'test-member-'+n,rank});
  actions.push(assign(0,'vice'),assign(1,'vice'));
  for(let i=1;i<=5;i++)actions.push(assign(i,'general'));
  actions.push(assign(6,'general'));
  for(let i=6;i<=20;i++)actions.push(assign(i,'officer'));
  actions.push(assign(21,'officer'),assign(21,'member','member-0'),
    {op:'leave',actor:'test-leader'},{op:'advanceDays',days:365},
    {op:'transfer',actor:'test-member-0',target:'test-member-1'},
    {op:'transfer',actor:'test-leader',target:'test-member-0'},
    {op:'leave',actor:'test-leader'});
  const r=run(actions);
  assert.equal(r.rejected,6);
  assert.equal(r.clans[0].leader,'test-member-0');
  assert.equal(r.players.filter(p=>p.rank==='leader').length,1);
  assert.equal(r.players.filter(p=>p.rank==='general').length,5);
  assert.equal(r.players.filter(p=>p.rank==='officer').length,15);
});
test('large repeatable scenario, no private or live save access',()=>{
  const actions=[create('leader',{playedDays:7}),found('leader','castle')];
  for(let i=0;i<100;i++)actions.push(create('member-'+i,{stock:{stone:1000}}),join('member-'+i,'castle'));
  for(let d=0;d<30;d++){
    for(let i=0;i<100;i++)actions.push(donate('member-'+i,{stone:10}));
    actions.push({op:'advanceDays',days:1});
  }
  const r=run(actions,101);
  assert.equal(r.rejected,0);
  assert.equal(r.clans[0].warehouse.stone,30000);
  assert.equal(r.clans[0].ledger.length,3000);
  assert.deepEqual(r,run(actions,101));
  assert.equal(run([{op:'createPlayer',id:'real-account'}]).rejected,1);
  assert.throws(()=>simulateClan({actions:[]}),/Invalid integer/);
});
