// Empirical policy screening only, not physical duel simulation.
import { readFileSync } from "node:fs";
function screen(data){
 const policies=[{up:1,down:1,retry:0},{up:3,down:1,retry:3},{up:3,down:1,retry:10},{up:3,down:2,retry:3},{up:3,down:3,retry:3},{up:5,down:2,retry:3}];
 const seed=20261126,replicas=256,bouts=180,prizes=data.prize.prizes;
 const rows=[];
 for(const policy of policies)for(const row of data.rows){
  let cash=0,off=0,loss=0,changes=0,top=0,shortOff=0,shortCash=0;
  const p=row.opts.map(o=>o.wins/o.n),best=Math.max(...p.map((x,i)=>x*prizes[i]));
  for(let j=0;j<replicas;j++){
   let rng=(seed+Math.imul(j+1,2654435761))>>>0,stage=0,w=0,l=0,blocked=-1,coins=0;
   for(let b=1;b<=bouts;b++){
    rng=(Math.imul(rng,1664525)+1013904223)>>>0;
    const win=rng/4294967296<p[stage],old=stage;
    if(win){coins+=prizes[stage];w++;l=0;if(stage<7&&w>=Math.max(policy.up,blocked===stage+1?policy.retry:0)){stage++;w=0;}}
    else{loss++;w=0;l++;if(stage>0&&l>=policy.down){blocked=stage;stage--;l=0;}}
    if(stage!==old)changes++;
    if(b===18){shortOff+=p[stage]*prizes[stage]/best;shortCash+=coins/(18*best);}
   }
   cash+=coins/(bouts*best);off+=p[stage]*prizes[stage]/best;top+=Number(stage===row.bestArena);
  }
  rows.push({policy:`${policy.up}/${policy.down}/${policy.retry}`,day:row.day,style:row.style,family:row.family,online:cash/replicas,offline:off/replicas,oneHourOnline:shortCash/replicas,oneHourOffline:shortOff/replicas,lossRate:loss/(replicas*bouts),changesPerHour:changes/(replicas*bouts/18),endBest:top/replicas});
 }
 const summary=policies.map(policy=>{const id=`${policy.up}/${policy.down}/${policy.retry}`;const subset=rows.filter(r=>r.policy===id);const avg=(rs,key)=>Number((rs.reduce((s,r)=>s+r[key],0)/rs.length).toFixed(4));return{policy:id,online:avg(subset,"online"),offline:avg(subset,"offline"),oneHourOnline:avg(subset,"oneHourOnline"),oneHourOffline:avg(subset,"oneHourOffline"),lossRate:avg(subset,"lossRate"),changesPerHour:avg(subset,"changesPerHour"),endBest:avg(subset,"endBest"),day180Offline:avg(subset.filter(r=>r.day===180),"offline")};});
 return{seed,replicas,bouts,simulatedPolicyBouts:policies.length*data.rows.length*replicas*bouts,summary,rows};
}
const input=JSON.parse(readFileSync(new URL("../docs/mechanics/GEAR_COMBINED_ARENA_VALIDATION.json",import.meta.url),"utf8"));
console.log(JSON.stringify(screen(input),null,2));
