// Pure provisional arena rules. Distances, injuries and wear are game abstractions.
export const PHYSICAL_RULES = Object.freeze({ turnLimit: 32, arrows: 4 });
const WEAPONS = Object.freeze({
  bow: { move: "shot", ranged: true, type: "piercing", range: 2, power: 7, recovery: 2 },
  dagger: { move: "dagger", type: "piercing", range: 0, power: 4, recovery: 2 },
  spear: { move: "thrust", clearance: 1, type: "piercing", range: 1, power: 9, recovery: 2 },
  sword_shield: { move: "cut", type: "slashing", range: 0, power: 8, recovery: 2 },
  greatsword: { move: "swing", clearance: 2, type: "slashing", range: 1, power: 12, recovery: 3 },
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
    breakable: profile?.breakable ?? true,
    flatAttack:profile?.flatAttack,damageMultiplier:profile?.damageMultiplier,
    accuracy:profile?.accuracy??0,penetration:profile?.penetration??0,proficiency:profile?.proficiency??1,
    guard:profile?.guard,resistance:profile?.resistance??0,
    mobility:profile?.mobility??0,dodge:profile?.dodge??0 };
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

const intactArmourSum=(target,key)=>target.armour.reduce((sum,piece)=>
  sum+(piece.hp>0?(piece[key]??0):0),0);
function flatGuard(target) {
  // Legacy synthetic fixtures can omit detailed profiles. Real new snapshots
  // carry per-piece guard, which disappears as each piece breaks.
  if(target.armour.some(p=>p.guard!==undefined))return intactArmourSum(target,"guard");
  if(target.armour.length)return (target.gear?.gearDefense??0)*
    target.armour.filter(p=>p.hp>0).length/target.armour.length;
  return target.gear?.gearDefense??0;
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
  let approachProgress = 0;
  let retreatsLeft = terrain.retreatSpace ?? (terrain.retreat === false ? 0 : 3);
  let distance = Math.min(2, Math.max(0, terrain.startDistance ?? 2));
  const mobility = actor => Math.min(100,(actor.gear?.mobilityPct ?? 95)+intactArmourSum(actor,"mobility"));
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
        if (bow && distance < 2 && retreatsLeft > 0 && mobility(actor) > mobility(target)) {
          distance++;
          approachProgress = 0;
          retreatsLeft--;
          record(actor, target, "retreat");
        }
        continue;
      }
      if (distance > active.range) {
        approachProgress++;
        if (approachProgress >= (terrain.approachSteps ?? 1)) {
          distance--;
          approachProgress = 0;
        }
        record(actor, target, "approach");
        continue;
      }
      const attack = actor.counter && actor.shield.hp > 0 ? BASH : active;
      const counter = actor.counter;
      actor.counter = false;
      actor.recovery = attack.recovery - 1 + Math.max(0, (attack.clearance ?? 0) - (terrain.clearance ?? 2));
      if (attack.move === "shot") actor.arrows--;
      const shortSpear = actor.loadout === "spear" && distance === 0;
      const constriction = Math.max(0, (attack.clearance ?? 0) - (terrain.clearance ?? 2));
      const obscuredShot = attack.ranged && distance > 0
        ? (2 - (terrain.lineOfSight ?? 2)) * 0.15 +
          (terrain.cover ?? 0) * (target.shield.hp > 0 ? 0.10 : 0.04) : 0;
      const activePiece=attack===BASH?actor.shield:actor.weapon;
      const equipped=activePiece.hp>0;
      const aim = 0.72 + (equipped?activePiece.accuracy:0) - intactArmourSum(target,"dodge") + (actor.dex - target.dex) * 0.012 + (actor.skill - target.skill) * 0.004 +
        (distance === 0 && bow ? -0.16 : 0) + (shortSpear ? -0.14 : 0) - obscuredShot - constriction * 0.12;
      if (roll() >= Math.max(0.19, Math.min(0.96, aim))) {
        record(actor, target, "miss", { move: attack.move });
        continue;
      }
      const guardRoll = roll();
      const block = target.shield.hp > 0 && guardRoll < (attack.type === "blunt" ? 0.50 : 0.40)*target.shield.proficiency;
      const parry = !block && target.loadout === "greatsword" && target.weapon.hp > 0 &&
        target.recovery === 0 && guardRoll < 0.32*target.weapon.proficiency;
      const intact = actor.weapon.hp > 0 || attack.move === "dagger" || attack === BASH;
      // Broken weapons retain only improvised base damage, never their grade
      // or flat bonus. The bow's backup dagger retains the kit's bonus only
      // while the kit is intact; the shield bash uses the actual shield.
      const flat=equipped?(activePiece.flatAttack??actor.gearAttack??0):0;
      const multiplier=equipped?(activePiece.damageMultiplier??1):1;
      const base = (attack.power + actor.str * 0.3 + flat * 0.65) * multiplier *
        (intact ? 1 : 0.55) * (shortSpear ? 0.82 : 1) * (counter && attack !== BASH ? 1.18 : 1);
      const vital = !block && !parry && guardRoll > 0.96;
      const penetration=equipped?activePiece.penetration:0;
      const armourFactor=ARMOUR_FACTOR[attack.type]*(1-penetration);
      // Separate material protection from grade resistance: equal-grade
      // equipment approximately cancels scaling, lower-grade armour does not.
      const resistance=intactArmourSum(target,"resistance");
      const impact = Math.max(1, Math.round(base * (vital ? 1.65 : 1) *
        (block ? attack.type === "blunt" ? 0.94 : 0.27 : parry ? 0.35 : 1) *
        (1 - Math.min(80, protection(target) * armourFactor) / 100) /
        (1+resistance*(1-penetration)) - flatGuard(target) * 0.35));
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
