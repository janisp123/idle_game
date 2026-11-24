/** Equipment choices and smith purchases use production engine operations. */
import { buyEquipment, setArmourChoice, setCombatLoadout } from '../../site/play/engine.mjs';
import { ARMOUR_SLOTS, ARMOUR_TIERS, armourStats } from '../../site/play/armour.mjs';
import { COMBAT_LOADOUTS } from '../../site/play/combat-skills.mjs';
import { equipmentBonuses, smithQuote } from '../../site/play/smith.mjs';
import { count, choose, sourceSeed, seededState } from './common.mjs';

export function simulateEquipment(options={}) {
  let state = seededState(options);
  state.coins = count(options.coins ?? 0, 'coins', 1_000_000);
  const loadout = choose(options.loadout ?? state.combatLoadout, Object.keys(COMBAT_LOADOUTS), 'weapon style');
  const slot = choose(options.slot ?? 'head', ARMOUR_SLOTS.map(x => x.id), 'armour slot');
  const gear = choose(options.gear ?? 'none', ARMOUR_TIERS, 'armour family');
  const before = armourStats(state.armour, state.combatLoadout);
  state = setCombatLoadout(state, loadout, state.settledAtMs, sourceSeed(options)).state;
  const id = options.weapon === true ? loadout : gear === 'none' ? null : slot + ':' + gear;
  let quote = null, purchased = false;
  if (id) {
    const spec = { grade: options.itemGrade ?? 0, quality: options.quality ?? 'poor' };
    quote = smithQuote(state, id, spec);
    const result = buyEquipment(state, id, spec, state.settledAtMs, sourceSeed(options));
    state = result.state;
    purchased = Boolean(result.purchased);
  } else {
    state = setArmourChoice(state, slot, 'none', state.settledAtMs, sourceSeed(options)).state;
  }
  return { module: 'equipment', requested: { loadout, slot, gear }, quote, purchased,
    coins: state.coins, armourBefore: before, armourAfter: armourStats(state.armour, state.combatLoadout),
    equippedArmour: state.armour, bonuses: equipmentBonuses(state) };
}
