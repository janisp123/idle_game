/** Presentation only: derive a verdict label from the actual final event.
 * Never import this module into the resolver, wallet or progression engine.
 */
export const DOMINANCE_HP_FRACTION=0.8;
export function combatVerdict(event){
  if(!event||!["victory","defeat","double_death"].includes(event.type))return null;
  if(event.type==="double_death")return {category:"double_death",label:"BOTH FIGHTERS EXECUTED",dominant:false};
  const won=event.type==="victory",winner=event.vitals?.[won?"player":"enemy"],
    loser=event.vitals?.[won?"enemy":"player"];
  // Timeout also sets the loser's HP to zero. Require an actual knockout,
  // not that artificial verdict HP, and use the same criterion on both sides.
  const dominant=event.reason==="knockout"&&loser?.hp===0&&
    Number.isFinite(winner?.hp)&&Number.isFinite(winner?.maxHP)&&winner.maxHP>0&&
    winner.hp<=winner.maxHP&&winner.hp>=winner.maxHP*DOMINANCE_HP_FRACTION;
  return {category:dominant?(won?"impressive_victory":"humiliation"):event.type,
    label:dominant?(won?"IMPRESSIVE VICTORY":"HUMILIATION"):won?"VICTORY":"DEFEAT",
    dominant};
}
