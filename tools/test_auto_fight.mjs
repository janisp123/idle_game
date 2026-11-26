import * as policy from "../site/play/auto-fight.mjs";
function runTests(api) {
 const {initialAutoFight,validAutoFight,requiredAutoFightWins,finishAutoFightBout}=api;
 let checks=0;
 function check(ok,label){checks++;if(!ok)throw new Error(label);}
 function equal(a,b,label){check(JSON.stringify(a)===JSON.stringify(b),label);}
 const online=(p,o)=>finishAutoFightBout(p,o,true);
 let p=initialAutoFight();
 equal(p,{stage:0,streak:0,blocked:-1,highest:-1},"fresh");
 p=online(p,"victory");p=online(p,"victory");check(p.stage===0&&p.streak===2,"two wins");
 p=online(p,"victory");check(p.stage===1&&p.streak===0&&p.highest===0,"advance after three, no false highest");
 p=online(p,"defeat");check(p.stage===0&&p.blocked===1&&requiredAutoFightWins(p)===10,"retreat and retry");
 const locked=p;
 for(let i=0;i<100;i++)for(const o of ["victory","defeat","double_death"])check(finishAutoFightBout(p,o,false)===locked,"offline lock");
 for(let i=0;i<9;i++)p=online(p,"victory");check(p.stage===0&&p.streak===9,"nine retry wins");
 p=online(p,"double_death");check(p.stage===0&&p.streak===0&&p.blocked===1,"loss resets streak at floor");
 for(let i=0;i<10;i++)p=online(p,"victory");check(p.stage===1&&p.streak===0,"ten retry wins");
 for(let i=0;i<18;i++)p=online(p,"victory");check(p.stage===7&&p.highest===6,"reach S");
 for(let i=0;i<20;i++)p=online(p,"victory");check(p.stage===7&&p.highest===7&&p.streak===0,"S ceiling");
 p=online(p,"double_death");check(p.stage===6&&p.blocked===7&&p.highest===7,"S retreat/history");
 for(const bad of [null,{},[],{...p,stage:8},{...p,streak:10},{...p,blocked:0},{...p,highest:8},{...p,streak:NaN}])check(!validAutoFight(bad),"reject malformed state");
 // Enumerate every reachable policy state from every allowed starting grade;
 // compare each transition with the explicit decision contract and immutability.
 const seen=new Map(),queue=Array.from({length:8},(_,i)=>initialAutoFight(i));
 for(let i=0;i<queue.length;i++){
  const s=queue[i],key=JSON.stringify(s);if(seen.has(key))continue;seen.set(key,s);Object.freeze(s);
  check(validAutoFight(s),"reachable valid");
  for(const o of ["victory","defeat","double_death"]){
   check(finishAutoFightBout(s,o)===s,"default offline");const n=online(s,o);
   check(validAutoFight(n),"transition valid");
   check(Math.abs(n.stage-s.stage)<=1,"single grade");
   check(n.highest===(o==="victory"?Math.max(s.highest,s.stage):s.highest),"history");
   if(o!=="victory")check(n.stage===Math.max(0,s.stage-1)&&n.streak===0&&n.blocked===(s.stage>0?s.stage:s.blocked),"retreat");
   else {const threshold=requiredAutoFightWins(s);check(n.stage===s.stage+Number(threshold!==null&&s.streak+1>=threshold),"advance threshold");}
   if(!seen.has(JSON.stringify(n)))queue.push(n);
  }
 }
 return {checks,reachableStates:seen.size};
}
console.log(JSON.stringify(runTests(policy)));
