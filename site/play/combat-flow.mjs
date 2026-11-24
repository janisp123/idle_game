/** Progress and phase labels for the resolved physical timeline. */
export function combatFlowState(combat) {
  if (!combat) return null;
  const steps = [
    { icon: "⚑", label: "Engage" },
    { icon: "⚔", label: "Battle" },
    { icon: "◆", label: "Verdict" },
    { icon: "✦", label: combat.playerHP === 0 && combat.recovering ? "Return" : "Recover" }
  ];
  const current = combat.recovering ? 3 :
    combat.step === combat.events.length - 1 ? 2 : combat.step === 0 ? 0 : 1;
  return { steps, current, percent: combat.progress * 100 };
}
