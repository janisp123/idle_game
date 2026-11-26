// STRATEGY-001: developer-only candidate experiments, no public runtime import.
// Transform a pristine production resolver in memory; fail closed on changed anchors.
export function candidateSource(source){
  const sub=(a,b)=>{if(source.split(a).length!==2)throw Error("Candidate anchor changed: "+a.slice(0,100));source=source.replace(a,b);};
  sub("function fighter(snapshot, side) {", `const STRATEGY = Object.freeze({
    balanced:{damage:1,taken:1,approach:1},
    assault:{damage:1.12,taken:1.12,approach:1.45},
    guard:{damage:.85,taken:.80,approach:.8},
    skirmish:{damage:.90,taken:1,approach:1}
  });
  function fighter(snapshot, side) {`);
  sub("side, hp: maxHP", "side, strategy: STRATEGY[snapshot.tactic??'balanced'], companionUses:0, hp: maxHP");
  sub('if(actor.guardOpen>0)actor.guardOpen--;',`if(actor.guardOpen>0)actor.guardOpen--;
      // Swarm: three scheduled bursts, scaled to intact plate coverage proxy.
      if(actor.companion==="swarm"&&[2,5,8].includes(turn)){
        const plates=target.armour.filter(p=>p.hp>0&&p.itemId?.endsWith(":plate")).length;
        const raw=Math.max(1,Math.round(target.maxHP*(.018+.009*plates)));
        const capped=Math.min(raw,Math.max(1,Math.round(attackComponents(actor,WEAPONS[actor.loadout],actor.weapon).base/(1+intactArmourSum(target,"resistance"))*.40)));
        const damage=wound(actor,target,capped);
        record(actor,target,"companion_swarm",{damage});
        if(!target.hp)break;
      }`);
  sub('if (bow && distance < 2 && retreatsLeft > 0 && mobility(actor) >= mobility(target)+TACTICS.retreatLead)', 'if ((bow || actor.tactic==="skirmish"&&actor.loadout==="spear") && distance < (bow?2:1) && retreatsLeft > 0 && mobility(actor) >= mobility(target)+TACTICS.retreatLead)');
  sub("approachProgress+=mobility(actor)>=TACTICS.quickMobility?1:TACTICS.slowApproach;",`const targetRange=target.loadout==="bow"&&(!target.arrows||!target.weapon.hp)?0:WEAPONS[target.loadout].range;
        if(target.companion==="hound"&&target.companionUses<3&&targetRange>active.range){
          target.companionUses++;record(target,actor,"companion_hound");continue;
        }
        approachProgress+=(mobility(actor)>=TACTICS.quickMobility?1:TACTICS.slowApproach)*actor.strategy.approach;`);
  sub("const aim = AIM.base",`const blinded=target.companion==="raven"&&target.companionUses<3;
      if(blinded){target.companionUses++;record(target,actor,"companion_raven");}
      const aim = AIM.base - (blinded?.22:0)`);
  sub("const impact = Math.max(1, Math.round(base * shotImpact","let impact = Math.max(1, Math.round(base * actor.strategy.damage * shotImpact");
  sub("const damage = wound(actor, target, impact);",`impact=Math.max(1,Math.round(impact*target.strategy.taken));
      if(target.companion==="sentinel"&&target.companionUses<2){
        target.companionUses++;impact=Math.max(1,Math.round(impact*.55));record(target,actor,"companion_sentinel");
      }
      const damage = wound(actor, target, impact);`);
  return source;
}

export function screen({baseline,candidate,createPlayerSnapshot,ARENAS,seededCombatRandom},grade,seed=20261126,repeats=12){
  const styles=["bow","spear","sword_shield","greatsword","hammer"],families=["padded","leather","plate"];
  const options=[["balanced","none"],["assault","none"],["guard","none"],["skirmish","none"],["balanced","hound"],["balanced","raven"],["balanced","swarm"],["balanced","sentinel"]];
  const rng=seededCombatRandom(seed),seeds=Array.from({length:repeats},()=>Math.floor(rng()*2**32));
  const rows=[];let parity=0;
  for(const [i,style] of styles.entries())for(const [j,family] of families.entries()){
    const p=createPlayerSnapshot({grade,itemGrade:grade,quality:"common",loadout:style,armour:family});
    for(const [k,enemyStyle] of styles.entries())for(const [l,arena] of ARENAS.entries()){
      const enemyFamily=families[(k+l)%families.length];
      const e=createPlayerSnapshot({grade,itemGrade:grade,quality:"common",loadout:enemyStyle,armour:enemyFamily});
      for(const [tactic,companion] of options){
        const row={style,family,enemyStyle,enemyFamily,arena:arena.id,tactic,companion,wins:0,defeats:0,draws:0,activations:0,companionDamage:0,bouts:repeats};
        for(const s of seeds){
          const r=candidate({...p,tactic,companion},e,s,arena);
          if(tactic==="balanced"&&companion==="none"){
            const original=baseline(p,e,s,arena);
            // Neutral strategy must reproduce every original event and outcome.
            if(JSON.stringify(r)!==JSON.stringify(original))throw Error("Neutral mismatch "+JSON.stringify({grade,style,family,enemyStyle,arena:arena.id,s}));
            parity++;
          }
          row.wins+=Number(r.outcome==="victory");row.defeats+=Number(r.outcome==="defeat");row.draws+=Number(r.outcome==="double_death");
          for(const ev of r.events)if(ev.type.startsWith("companion_")){row.activations++;row.companionDamage+=ev.damage;}
        }
        rows.push(row);
      }
    }
  }
  return {grade,seed,repeats,bouts:rows.length*repeats,neutralParity:parity,rows};
}
