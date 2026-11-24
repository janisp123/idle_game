// Pure provisional arena rules. Distances, injuries and wear are game abstractions.
export const PHYSICAL_RULES = Object.freeze({ turnLimit: 32, arrows: 4 });
const WEAPONS = Object.freeze({
  bow: { move: "shot", type: "piercing", range: 2, power: 7, recovery: 2 },
  dagger: { move: "dagger", type: "piercing", range: 0, power: 4, recovery: 2 },
  spear: { move: "thrust", type: "piercing", range: 1, power: 9, recovery: 2 },
  sword_shield: { move: "cut", type: "slashing", range: 0, power: 8, recovery: 2 },
  greatsword: { move: "swing", type: "slashing", range: 1, power: 12, recovery: 3 },
  hammer: { move: "hammer", type: "blunt", range: 0, power: 17, recovery: 4 }
});
const BASH = Object.freeze({ move: "shield_bash", type: "blunt", range: 0, power: 4, recovery: 3 });
const BANDS = Object.freeze(["Close", "Reach", "Far"]);
const ARMOUR_FACTOR = Object.freeze({ piercing: 0.8, slashing: 1.15, blunt: 0.45 });

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function piece(profile, fallback) {
  return { hp: profile?.maxHP ?? fallback, maxHP: profile?.maxHP ?? fallback,
    breakable: profile?.breakable ?? true };
}

function fighter(snapshot, side) {
  const maxHP = Math.max(1, Math.round(28 + snapshot.end * 1.6));
  const equipment = snapshot.condition ?? {};
  return { ...snapshot, side, hp: maxHP, maxHP, inflicted: 0, recovery: 0, stagger: 0,
    bleed: 0, counter: false, arrows: snapshot.loadout === "bow" ? PHYSICAL_RULES.arrows : 0,
    weapon: piece(equipment.weapon, 24), shield: piece(equipment.shield, snapshot.loadout === "sword_shield" ? 24 : 0),
    armour: Object.entries(equipment.armour ?? {}).map(([id, profile]) =>
      ({ ...piece(profile, 24), id, protection: profile.protection })) };
}

export function timeoutVerdict(player, enemy) {
  if (player.hp > enemy.hp && player.inflicted > 0) return "victory";
  if (enemy.hp > player.hp && enemy.inflicted > 0) return "defeat";
  return "double_death";
}

function wound(actor, target, amount) {
  const damage = Math.min(target.hp, amount);
  target.hp -= damage;
  actor.inflicted += damage;
  return damage;
}

function wear(target, amount) {
  if (!target.breakable || target.hp === 0) return false;
  target.hp = Math.max(0, target.hp - amount);
  return target.hp === 0;
}

function protection(target) {
  if (!target.armour.length) return target.gear?.physicalReductionPct ?? 0;
  return target.armour.reduce((sum, item) =>
    sum + (item.hp > 0 ? item.protection : 0), 0);
}

function vitals(target) {
  return { hp: target.hp, maxHP: target.maxHP, arrows: target.arrows, shield: target.shield.hp,
    shieldMax: target.shield.maxHP, weapon: target.weapon.hp, weaponMax: target.weapon.maxHP,
    armour: target.armour.reduce((sum, item) => sum + item.hp, 0),
    maxArmour: target.armour.reduce((sum, item) => sum + item.maxHP, 0) };
}

export function resolvePhysicalDuel(player, enemy, seed, terrain = {}) {
  const actors = [fighter(player, "player"), fighter(enemy, "enemy")];
  const [you, foe] = actors;
  const roll = seededRandom(seed);
  const events = [];
  let distance = Math.min(2, Math.max(0, terrain.startDistance ?? 2));
  const mobility = actor => actor.gear?.mobilityPct ?? 95;
  const record = (actor, target, type, extra = {}) => {
    events.push({ type, actor: actor?.side ?? null, target: target?.side ?? null, distance: BANDS[distance],
      damage: 0, ...extra, vitals: { player: vitals(you), enemy: vitals(foe) } });
  };

  record(null, null, "engage");

  for (let turn = 0; turn < PHYSICAL_RULES.turnLimit && you.hp && foe.hp; turn++) {
    const lead = (you.dex + mobility(you) / 10 + roll() * 5 >= foe.dex + mobility(foe) / 10 + roll() * 5) ? 0 : 1;
    for (const index of [lead, 1 - lead]) {
      const actor = actors[index], target = actors[1 - index];
      if (!actor.hp || !target.hp) break;
      if (actor.bleed > 0) {
        actor.bleed--;
        const damage = wound(target, actor, 2);
        record(target, actor, "bleed", { damage });
        if (!actor.hp) break;
      }
      if (actor.stagger > 0) {
        actor.stagger--;
        record(actor, target, "stagger");
        continue;
      }
      const bow = actor.loadout === "bow" && actor.arrows > 0 && actor.weapon.hp > 0;
      const active = actor.loadout === "bow" && !bow ? WEAPONS.dagger : WEAPONS[actor.loadout];
      if (actor.recovery > 0) {
        actor.recovery--;
        if (bow && distance < 2 && terrain.retreat !== false && mobility(actor) > mobility(target)) {
          distance++;
          record(actor, target, "retreat");
        }
        continue;
      }
      if (distance > active.range) {
        distance--;
        record(actor, target, "approach");
        continue;
      }
      const attack = actor.counter && actor.shield.hp > 0 ? BASH : active;
      const counter = actor.counter;
      actor.counter = false;
      actor.recovery = attack.recovery - 1;
      if (attack.move === "shot") actor.arrows--;
      const shortSpear = actor.loadout === "spear" && distance === 0;
      const aim = 0.72 + (actor.dex - target.dex) * 0.012 + (actor.skill - target.skill) * 0.004 +
        (distance === 0 && bow ? -0.16 : 0) + (shortSpear ? -0.14 : 0);
      if (roll() >= Math.max(0.19, Math.min(0.96, aim))) {
        record(actor, target, "miss", { move: attack.move });
        continue;
      }
      const guardRoll = roll();
      const block = target.shield.hp > 0 && guardRoll < (attack.type === "blunt" ? 0.50 : 0.40);
      const parry = !block && target.loadout === "greatsword" && target.weapon.hp > 0 &&
        target.recovery === 0 && guardRoll < 0.32;
      const intact = actor.weapon.hp > 0 || attack.move === "dagger" || attack === BASH;
      const base = (attack.power + actor.str * 0.3 + (actor.gearAttack ?? 0) * 0.65) *
        (intact ? 1 : 0.55) * (shortSpear ? 0.82 : 1) * (counter && attack !== BASH ? 1.18 : 1);
      const vital = !block && !parry && guardRoll > 0.96;
      const impact = Math.max(1, Math.round(base * (vital ? 1.65 : 1) *
        (block ? attack.type === "blunt" ? 0.94 : 0.27 : parry ? 0.35 : 1) *
        (1 - Math.min(80, protection(target) * ARMOUR_FACTOR[attack.type]) / 100) -
        (target.gear?.gearDefense ?? 0) * 0.35));
      const damage = wound(actor, target, impact);
      const broken = [];
      if (block && wear(target.shield, attack.type === "blunt" ? 24 : 5)) broken.push("shield");
      else if (parry && wear(target.weapon, 4)) broken.push("guard weapon");
      else if (!block && !parry) {
        const armour = target.armour.find(item => item.hp > 0);
        if (armour && wear(armour, attack.type === "blunt" ? 9 : 5)) broken.push(armour.id);
      }
      if (intact && attack.move !== "dagger" && attack !== BASH && wear(actor.weapon, 3)) broken.push("attack weapon");
      if (block && target.shield.hp > 0) target.counter = attack.type !== "blunt" && guardRoll < 0.30;
      if (!block && !parry && damage >= 8 && attack.type !== "blunt") target.bleed = Math.max(target.bleed, 2);
      if (attack.type === "blunt" && (damage >= 8 || attack === BASH)) target.stagger = 1;
      record(actor, target, block ? "block" : parry ? "parry" : vital ? "finisher" : "hit",
        { damage, move: attack.move, broken, defenseSkill: block ? "shield_block" : parry ? "blade_guard" : null });
    }
  }

  const reason = foe.hp && you.hp ? "timeout" : "knockout";
  const outcome = !foe.hp ? "victory" : !you.hp ? "defeat" : timeoutVerdict(you, foe);
  if (outcome !== "victory") you.hp = 0;
  if (outcome !== "defeat") foe.hp = 0;
  record(null, null, outcome, { reason });
  return { events, outcome, reason, playerHP: you.hp, enemyHP: foe.hp, enemy: enemy.name };
}
