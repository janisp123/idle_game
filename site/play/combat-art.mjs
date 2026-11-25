import { combatVerdict } from "./combat-verdict.mjs?v=alpha-gear-a5";
/**
 * GAME-011 — single source of truth for original, local combat illustrations.
 * No simulation code or random choice occurs here. Only use images whose
 * weapon/action/outcome matches the real event. Chronicle remains text-only.
 *
 * All images are original, committed under assets/combat/*.webp (960x540).
 * Future weapon variants belong here, never in app.mjs string conditionals.
 */
export const COMBAT_ART = Object.freeze({
  engage: "fight-engage",
  charge: Object.freeze({ greatsword: "greatsword-charge" }),
  miss: Object.freeze({
    greatsword: "greatsword-miss",
    sword_shield: "sword-shield-miss"
  }),
  hit: Object.freeze({
    greatsword: "greatsword-hit",
    sword_shield: "sword-shield-thrust"
  }),
  guard: Object.freeze({
    blade_guard: "greatsword-parry",
    shield_block: "sword-shield-block"
  }),
  victory: Object.freeze({
    greatsword: "greatsword-victory",
    sword_shield: "sword-shield-victory"
  }),
  defeat: Object.freeze({
    greatsword: "greatsword-defeat",
    sword_shield: "sword-shield-defeat"
  })
});

// Activate only after the exact owner-approved WebPs are committed and verified.
// Until then use the truthful existing style-specific verdict art (or neutral).
// See docs/mechanics/OUTCOME_ART_HANDOFF.md for the exact asset names and hashes.
export const DOMINANCE_ART = Object.freeze({impressive_victory:null,humiliation:null});
const STYLE_NAMES = Object.freeze({
  hammer:"Two-handed hammer",
  greatsword: "Two-handed greatsword",
  sword_shield: "Sword and shield"
});
const TYPE_TITLES = Object.freeze({
  engage: "ENGAGE", initiative: "INITIATIVE", charge: "HEAVY SWING · PREPARE",
  miss: "MISSED ATTACK", dodge: "DODGE", parry: "PARRY",
  block: "SHIELD BLOCK", strike: "CLEAN HIT", wound: "BLOODY WOUND",
  collapse: "FINAL BLOW", finisher: "DECISIVE HIT",
  victory: "VICTORY", defeat: "DEFEAT", stalemate: "STALEMATE"
});
const styleOf = (actor, playerLoadout, enemyLoadout) =>
  actor === "player" ? playerLoadout : actor === "enemy" ? enemyLoadout : null;

/**
 * The event's actor is the ATTACKER for misses/strikes/finishers, but the
 * DEFENDER for dodge/parry/block. On dodge, the attacker is event.target.
 * This prevents showing a greatsword strike when a sword actually attacked.
 *
 * `exact=false` means the neutral two-fighter scene is used, not a fake
 * painting of an unavailable action. Assets are never inserted in Chronicle.
 */
export function combatArtworkForEvent(event, playerLoadout, enemyLoadout) {
  if (!event || typeof event !== "object") throw new RangeError("Invalid combat event");
  const type = event.type;
  const verdict=combatVerdict(event);
  const specialAsset=verdict?.dominant?DOMINANCE_ART[verdict.category]:null;
  let asset;
  if (type === "engage" || type === "initiative" || type === "stalemate") asset = COMBAT_ART.engage;
  else if (type === "victory" || type === "defeat")
    asset = COMBAT_ART[type][playerLoadout];
  else if (type === "charge")
    asset = COMBAT_ART.charge[styleOf(event.actor, playerLoadout, enemyLoadout)];
  else if (type === "miss")
    asset = COMBAT_ART.miss[styleOf(event.actor, playerLoadout, enemyLoadout)];
  else if (type === "dodge")
    asset = COMBAT_ART.miss[styleOf(event.target, playerLoadout, enemyLoadout)];
  else if (type === "parry" || type === "block")
    asset = event.defenseSkill ? COMBAT_ART.guard[event.defenseSkill] : null;
  else if (["hit", "strike", "wound", "collapse", "finisher"].includes(type))
    asset = COMBAT_ART.hit[styleOf(event.actor, playerLoadout, enemyLoadout)];
  // Do not fabricate an image for any new, unillustrated event.
  if(specialAsset)asset=specialAsset;
  const exact = Boolean(asset);
  const chosen = asset ?? COMBAT_ART.engage;
  const title = verdict?.label ?? TYPE_TITLES[type] ?? "THE FIGHTING PIT";
  const relevantStyle = ["victory", "defeat"].includes(type) ? playerLoadout :
    ["dodge", "block", "parry"].includes(type)
      ? styleOf(type === "dodge" ? event.target : event.actor, playerLoadout, enemyLoadout)
      : styleOf(event.actor, playerLoadout, enemyLoadout);
  const label = STYLE_NAMES[relevantStyle] ?? "Two warriors";
  return Object.freeze({
    asset: chosen,
    exact,
    label: title,
    alt: specialAsset ? (verdict.category==="impressive_victory"?"Arena victor stands over a defeated opponent.":"Defeated fighter lies beneath the victorious opponent.") : exact ? `Dark fantasy illustration of ${label.toLowerCase()} — ${type === "victory" || type === "defeat" ? type : title.toLowerCase()}.` :
      "Two warriors face off in the fighting pit, neutral arena backdrop."
  });
}
