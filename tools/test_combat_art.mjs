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
