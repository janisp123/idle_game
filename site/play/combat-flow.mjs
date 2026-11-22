/**
 * Display-only combat flow: every attack has an attack dice animation, a
 * defense dice animation, then one revealed move. No RNG or saved data here.
 * The real combat engine remains the authority for opponents, roles and time.
 */
import { COMBAT_BALANCE, COMBAT_SKILLS, BOUT_MS } from "./combat.mjs?v=20261122-dice-duels1";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const step = (icon, label) => ({ icon, label });
const NEXT_WINDOW_MS = 2_000;

/** Pure, deterministic labels/progress for the currently observable duel. */
export function combatFlowState(combat, session) {
  if (!combat || !session || !Number.isFinite(session.elapsedMs)) return null;
  const elapsedMs = session.elapsedMs;
  const event = combat.event;
  const t = clamp(combat.eventElapsedMs, 0, COMBAT_BALANCE.eventMs);
  const nextEvent = combat.events[combat.step + 1];
  const nextIsAttack = Boolean(nextEvent?.attackDice);
  let steps, current, percent;

  if (event.attackDice) {
    const windup = COMBAT_SKILLS[event.attackSkill]?.windupMs ?? 0;
    // The individual attack and defense rolls share the existing total
    // animation duration; neither changes the predetermined game result.
    const midpoint = windup + COMBAT_BALANCE.attackAnimationMs / 2;
    const revealedAt = windup + COMBAT_BALANCE.attackAnimationMs;
    steps = [
      step("✦", windup ? "Wind-up" : "Ready"),
      step("⚄", "Attack dice"),
      step("⚄", "Defense dice"),
      step("⚔", event.actor === "player" ? "Your attack" : "Enemy attack"),
      step("⌛", nextIsAttack ? "Next move" : "Duel result")
    ];
    current = t < windup ? 0 : t < midpoint ? 1 : t < revealedAt ? 2 :
      t < COMBAT_BALANCE.eventMs - NEXT_WINDOW_MS ? 3 : 4;
    percent = t / COMBAT_BALANCE.eventMs * 100;
  } else if (event.type === "initiative") {
    steps = [
      step("✦", "Face off"),
      step("⚄", "Roll dice"),
      step("⚑", event.actor === "player" ? "You go first" : "Enemy first"),
      step("⚔", "Get ready"),
      step("⌛", "Next move")
    ];
    current = t < COMBAT_BALANCE.initiativeAnimationMs ? 1 :
      t < COMBAT_BALANCE.eventMs - 8_000 ? 2 :
      t < COMBAT_BALANCE.eventMs - NEXT_WINDOW_MS ? 3 : 4;
    percent = t / COMBAT_BALANCE.eventMs * 100;
  } else if (event.type === "engage") {
    steps = [
      step("✦", "Enter arena"),
      step("⚔", "Face off"),
      step("⚄", "Roll dice"),
      step("⚑", "First move"),
      step("⌛", "Next duel")
    ];
    current = t < NEXT_WINDOW_MS ? 0 : 1;
    percent = t / COMBAT_BALANCE.eventMs * 100;
  } else {
    // Some duels end before six attacks. Their outcome stays on screen for
    // all remaining slots; never restart the next-battle meter each slot.
    const outcomeStartMs = (combat.events.length - 1) * COMBAT_BALANCE.eventMs;
    const elapsedInBout = ((elapsedMs % BOUT_MS) + BOUT_MS) % BOUT_MS;
    const outcomeFraction = clamp((elapsedInBout - outcomeStartMs) /
      (BOUT_MS - outcomeStartMs), 0, 1);
    const outcomeLabel = event.type === "victory" ? "Victory" :
      event.type === "defeat" ? "Defeat" : "Draw";
    steps = [
      step("⚑", "Duel ended"),
      step("◆", outcomeLabel),
      step("✦", "Recover"),
      step("⌛", "Prepare"),
      step("⚔", "Next battle")
    ];
    current = outcomeFraction < .15 ? 1 : outcomeFraction < .3 ? 2 :
      outcomeFraction < .7 ? 3 : 4;
    percent = outcomeFraction * 100;
  }
  return { steps, current, percent: clamp(percent, 0, 100) };
}
