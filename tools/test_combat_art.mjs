import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { combatArtworkForEvent, COMBAT_ART } from "../site/play/combat-art.mjs";

const player="greatsword", enemy="sword_shield";
const E=(type,actor=null,target=null,defenseSkill=null) => ({
  type, actor, target, defenseSkill
});

test("every combat action and real victory/defeat chooses the appropriate weapon art",()=>{
  const cases=[
    [E("engage"),"fight-engage"],
    [E("initiative"),"fight-engage"],
    [E("charge","player","enemy"),"greatsword-charge"],
    [E("charge","enemy","player"),"fight-engage"],
    [E("miss","player","enemy"),"greatsword-miss"],
    [E("miss","enemy","player"),"sword-shield-miss"],
    [E("dodge","enemy","player"),"greatsword-miss"],
    [E("dodge","player","enemy"),"sword-shield-miss"],
    [E("parry","player","enemy","blade_guard"),"greatsword-parry"],
    [E("block","enemy","player","shield_block"),"sword-shield-block"],
    [E("strike","player","enemy"),"greatsword-hit"],
    [E("wound","player","enemy"),"greatsword-hit"],
    [E("collapse","enemy","player"),"sword-shield-thrust"],
    [E("finisher","enemy","player"),"sword-shield-thrust"],
    [E("victory"),"greatsword-victory"],
    [E("defeat"),"greatsword-defeat"],
    [E("stalemate"),"fight-engage"]
  ];
  for(const [event,expected] of cases) {
    const output=combatArtworkForEvent(event,player,enemy);
    assert.equal(output.asset,expected,event.type+" "+(event.actor??""));
    assert.ok(output.label);
    assert.ok(output.alt);
  }
  assert.equal(combatArtworkForEvent(E("victory"),"sword_shield","greatsword").asset,
    "sword-shield-victory");
  assert.equal(combatArtworkForEvent(E("defeat"),"sword_shield","greatsword").asset,
    "sword-shield-defeat");
  assert.equal(combatArtworkForEvent(E("strike","enemy","player"),"sword_shield","greatsword").asset,
    "greatsword-hit");
});

test("untrained defense never displays a trained shield or parry image",()=>{
  const untrained=combatArtworkForEvent(E("parry","enemy","player",null),player,enemy);
  assert.equal(untrained.asset,"fight-engage");
  assert.equal(untrained.exact,false);
  assert.match(untrained.alt,/neutral arena backdrop/);
  assert.throws(()=>combatArtworkForEvent(null,player,enemy),RangeError);
});

test("every registered image is an actual committed WebP file, not a dead URL",()=>{
  const values=[];
  for(const entry of Object.values(COMBAT_ART))
    if(typeof entry==="string") values.push(entry);
    else values.push(...Object.values(entry));
  const unique=new Set(values);
  assert.equal(unique.size,12,"four outcomes and eight other unique action images");
  for(const asset of unique) {
    assert.match(asset,/^[a-z0-9-]+$/);
    const file=new URL("../site/play/assets/combat/"+asset+".webp",import.meta.url);
    assert.ok(statSync(file).size>=20_000,asset+" should be real high-quality art");
    const bytes=readFileSync(file);
    assert.equal(bytes.toString("ascii",0,4),"RIFF",asset);
    assert.equal(bytes.toString("ascii",8,12),"WEBP",asset);
  }
});

import { combatVerdict, DOMINANCE_HP_FRACTION } from "../site/play/combat-verdict.mjs";
import { DOMINANCE_ART } from "../site/play/combat-art.mjs";
const terminal=(type,reason,hp,maxHP=100)=>{
  const winner={hp,maxHP},loser={hp:0,maxHP:100};
  return {type,reason,vitals:type==="victory"?{player:winner,enemy:loser}:{player:loser,enemy:winner}};
};
test("A5 dominance uses identical knockout and remaining-HP criteria for both sides",()=>{
  assert.equal(DOMINANCE_HP_FRACTION,.8);
  for(const [type,special] of [["victory","impressive_victory"],["defeat","humiliation"]]){
    assert.equal(combatVerdict(terminal(type,"knockout",80)).category,special);
    assert.equal(combatVerdict(terminal(type,"knockout",79)).category,type);
    assert.equal(combatVerdict(terminal(type,"timeout",100)).category,type);
    assert.equal(combatVerdict(terminal(type,"knockout",160,200)).category,special);
    assert.equal(combatVerdict(terminal(type,"knockout",101)).category,type);
    assert.equal(combatVerdict({type,reason:"knockout"}).category,type);
  }
  assert.equal(combatVerdict({type:"hit"}),null);
  assert.equal(combatVerdict(terminal("double_death","timeout",100)).category,"double_death");
});
test("A5 verdict labels are visible while artwork only references available local assets",()=>{
  for(const [type,category,label,fallback] of [["victory","impressive_victory","IMPRESSIVE VICTORY","greatsword-victory"],["defeat","humiliation","HUMILIATION","greatsword-defeat"]]){
    const event=terminal(type,"knockout",90);
    const before=structuredClone(event);
    const art=combatArtworkForEvent(event,player,enemy);
    assert.equal(art.label,label);
    assert.equal(art.asset,DOMINANCE_ART[category]??fallback);
    assert.deepEqual(event,before);
    if(DOMINANCE_ART[category]){
      const bytes=readFileSync(new URL("../site/play/assets/combat/"+art.asset+".webp",import.meta.url));
      assert.equal(bytes.toString("ascii",8,12),"WEBP");
    }
    assert.equal(combatArtworkForEvent(terminal(type,"timeout",100),player,enemy).asset,fallback);
  }
});