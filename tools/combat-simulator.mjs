import { arenaReward } from '../site/play/arena-wallet.mjs';
import { equippedCondition, equipmentBonuses, STARTER_ITEM } from '../site/play/smith.mjs';
/**
 * SIM-001: developer-only, zero-delay, deterministic combat harness.
 * This file lives in tools/, outside the GitHub Pages ./site deployment.
 * NEVER fork combat formulas here; combatAtTime is the playable resolver.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOUT_MS, startCombatSession, combatAtTime } from '../site/play/combat.mjs';
import { COMBAT_LOADOUTS } from '../site/play/combat-skills.mjs';
import { ARMOUR_SLOTS, ARMOUR_TIERS, armourStats } from '../site/play/armour.mjs';
import { GRADES, benchmark } from '../site/play/difficulty.mjs';

const DEFAULT_SEED = 20261124;
const DEFAULT_BATTLES = 10000;
const MAX_BATTLES = 1000000;
const MAX_TRACES = 100;
const ARMOUR_IDS = ARMOUR_SLOTS.map(slot => slot.id);
const intIn = (value, low, high, name) => {
  if (!Number.isSafeInteger(value) || value < low || value > high)
    throw new RangeError(name + ' must be an integer from ' + low + ' to ' + high);
  return value;
};
const rankEntries = (values, allowed, ceiling, name) => {
  if (!values || typeof values !== 'object' || Array.isArray(values))
    throw new RangeError('Invalid ' + name);
  for (const [key, value] of Object.entries(values)) {
    if (!allowed.includes(key)) throw new RangeError('Unknown ' + name + ' slot: ' + key);
    intIn(value, 0, ceiling, name + ' ' + key);
  }
  return values;
};
const parseGrade = grade => {
  if (Number.isInteger(grade) && grade >= 0 && grade < GRADES.length) return grade;
  const found = GRADES.findIndex(g => g.toLowerCase() === String(grade).toLowerCase());
  if (found < 0) throw new RangeError('Unknown difficulty: ' + grade);
  return found;
};
const uniform = (armour, slots = {}) => {
  if (!ARMOUR_TIERS.includes(armour)) throw new RangeError('Unknown armour: ' + armour);
  rankEntries(Object.fromEntries(Object.keys(slots).map(k => [k, 0])), ARMOUR_IDS, 0, 'armour');
  const all = Object.fromEntries(ARMOUR_IDS.map(id => [id, armour]));
  for (const [slot, tier] of Object.entries(slots)) {
    if (!ARMOUR_TIERS.includes(tier)) throw new RangeError('Unknown armour on ' + slot);
    all[slot] = tier;
  }
  return all;
};

/** Build the SAME frozen fighter fields as engine.mjs's startCombatSession. */
export function createPlayerSnapshot(options = {}) {
  const difficulty = parseGrade(options.grade ?? 'Non-grade');
  const target = benchmark(difficulty);
  const skill = intIn(options.skill ?? target.skill, 1, 100000, 'Fighting skill');
  const str = intIn(options.str ?? target.stat, 0, 100000, 'STR');
  const dex = intIn(options.dex ?? target.stat, 0, 100000, 'DEX');
  const end = intIn(options.end ?? target.stat, 0, 100000, 'END');
  const loadout = options.loadout ?? 'greatsword';
  if (!Object.hasOwn(COMBAT_LOADOUTS, loadout)) throw new RangeError('Unknown loadout');
  const armour = uniform(options.armour ?? 'none', options.armourSlots ?? {});
  const spec = { grade: options.itemGrade ?? STARTER_ITEM.grade, quality: options.quality ?? STARTER_ITEM.quality };
  const equipment = Object.fromEntries([
    [loadout, spec],
    ...Object.entries(armour).filter(([, family]) => family !== 'none')
      .map(([slot, family]) => [slot + ':' + family, spec])
  ]);
  const bonus = equipmentBonuses({ combatLoadout: loadout, armour, equipment });
  return { name:'Wanderer', difficulty, loadout, skill, str, dex, end,
    gear: { ...armourStats(armour, loadout), gearDefense: bonus.defense },
    gearAttack: bonus.attack, condition: equippedCondition(armour, loadout, equipment) };

}
const increment = (obj, key, n = 1) => { obj[key] = (obj[key] ?? 0) + n; };
const bucket = (obj, key) => obj[key] ??= { battles:0, victories:0, defeats:0, draws:0 };
const average = (sum, n) => n ? Math.round(sum / n * 100) / 100 : 0;
const resultGroup = (group, outcome) => {
  group.battles++;
  increment(group, outcome === 'victory' ? 'victories' :
    outcome === 'defeat' ? 'defeats' : 'draws');
};

/**
 * Resolve exactly one production bout per index. elapsedMs selects a seeded
 * duel, NOT a real-world wait. Each game duel starts fully recovered.
 * A snapshot may be a player object, {player}, or a saved combatSession.
 */
export function simulateBatch(options = {}) {
  const battles = intIn(options.battles ?? DEFAULT_BATTLES, 1, MAX_BATTLES, 'battles');
  const traces = intIn(options.trace ?? 0, 0, Math.min(MAX_TRACES, battles), 'trace');
  const saved = options.snapshot;
  const combatSession = saved?.combatSession ?? saved?.state?.combatSession ??
    (saved?.player && saved.seed !== undefined ? saved : null);
  const player = saved ? (combatSession?.player ?? saved.player ?? saved) : createPlayerSnapshot(options);
  const seed = intIn(options.seed ?? combatSession?.seed ?? DEFAULT_SEED, 0, 0xffffffff, 'seed');
  const startBout = intIn(options.startBout ??
    (combatSession ? Math.floor(combatSession.elapsedMs / BOUT_MS) : 0),
    0, Math.floor(Number.MAX_SAFE_INTEGER / BOUT_MS) - battles, 'start bout');
  const session = startCombatSession(player, seed); // production validation
  const generatedBuild = saved ? null : {
    armourSlots:uniform(options.armour ?? 'none', options.armourSlots ?? {}),
    itemGrade: options.itemGrade ?? 0, quality: options.quality ?? "poor"
  };
  const summary = {
    source:'site/play/combat.mjs:combatAtTime',
    mode:'Developer-only; no animation, timers, save mutation, or balance overrides',
    battles, seed, startBout, difficulty:GRADES[player.difficulty ?? 0],
    playerBuild:generatedBuild,
    player: {
      loadout:player.loadout, skill:player.skill,
      stats:{STR:player.str, DEX:player.dex, END:player.end},
      gear:player.gear ?? null,
      gearAttack:player.gearAttack ?? 0,
      condition:player.condition ?? null
    },
    outcomes:{victory:0,defeat:0,double_death:0},
    knockout:{player:0,enemy:0}, judge:{player:0,enemy:0,draw:0},
    byTerrain:{}, byEnemyRole:{}, byEnemyLoadout:{},
    attacks:{player:0,enemy:0,types:{},finisher:0},
    averages:{
      attackEvents:0,playerRemainingHPpct:0,enemyRemainingHPpct:0,
      playerHPLost:0,enemyHPLost:0,playerArmourConditionLost:0,
      enemyArmourConditionLost:0,playerWeaponConditionLost:0,
      enemyWeaponConditionLost:0
    },
    samples:[]
  };
  const totals = {turns:0,playerPct:0,enemyPct:0,playerLoss:0,enemyLoss:0,
    playerArmourLoss:0,enemyArmourLoss:0,playerWeaponLoss:0,enemyWeaponLoss:0};
  for (let i = 0; i < battles; i++) {
    const index = startBout + i;
    // The same seeded opponent, terrain and physical resolver as the playable app.
    const duel = combatAtTime({...session, elapsedMs:index * BOUT_MS});
    if (!duel) throw new Error('Production resolver returned no duel at ' + index);
    const outcome = duel.outcome;
    increment(summary.outcomes, outcome);
    resultGroup(bucket(summary.byTerrain, duel.terrain.name), outcome);
    resultGroup(bucket(summary.byEnemyRole, duel.enemyRole), outcome);
    resultGroup(bucket(summary.byEnemyLoadout, duel.enemyLoadout), outcome);
    const first = duel.events[0], final = duel.events.at(-1);
    const start = first.vitals, finish = final.vitals;
    const lostHP = side => start[side].hp - finish[side].hp;
    if (outcome === 'victory') {
      if (duel.reason === "knockout") summary.knockout.enemy++;
      else summary.judge.player++;
    } else if (outcome === 'defeat') {
      if (duel.reason === "knockout") summary.knockout.player++;
      else summary.judge.enemy++;
    } else increment(summary.judge, 'draw');
    totals.playerPct += finish.player.hp / finish.player.maxHP * 100;
    totals.enemyPct += finish.enemy.hp / finish.enemy.maxHP * 100;
    totals.playerLoss += lostHP('player');
    totals.enemyLoss += lostHP('enemy');
    totals.playerArmourLoss += start.player.armour - finish.player.armour;
    totals.enemyArmourLoss += start.enemy.armour - finish.enemy.armour;
    totals.playerWeaponLoss += start.player.weapon - finish.player.weapon;
    totals.enemyWeaponLoss += start.enemy.weapon - finish.enemy.weapon;
    for (const event of duel.events) {
      if (!event.move) continue;
      totals.turns++;
      increment(summary.attacks, event.actor);
      increment(summary.attacks.types, event.type);
      if (event.type === 'finisher') summary.attacks.finisher++;
    }
    if (i < traces) summary.samples.push({
      bout:index + 1, outcome, enemyRole:duel.enemyRole,
      enemyLoadout:duel.enemyLoadout, enemyArmour:duel.enemyArmour,
      terrain:duel.terrain.name,
      // Actual events include condition changes and the final verdict.
      events:duel.events
    });
  }
  for (const groups of [summary.byTerrain,summary.byEnemyRole,summary.byEnemyLoadout])
    for (const group of Object.values(groups))
      group.winRatePct = average(group.victories * 100, group.battles);
  summary.winRatePct = average(summary.outcomes.victory * 100, battles);
  summary.drawRatePct = average(summary.outcomes.double_death * 100, battles);
  summary.averages = {
    attackEvents:average(totals.turns, battles),
    playerRemainingHPpct:average(totals.playerPct, battles),
    enemyRemainingHPpct:average(totals.enemyPct, battles),
    playerHPLost:average(totals.playerLoss, battles),
    enemyHPLost:average(totals.enemyLoss, battles),
    playerArmourConditionLost:average(totals.playerArmourLoss, battles),
    enemyArmourConditionLost:average(totals.enemyArmourLoss, battles),
    playerWeaponConditionLost:average(totals.playerWeaponLoss, battles),
    enemyWeaponConditionLost:average(totals.enemyWeaponLoss, battles)
  };
  summary.coins = summary.outcomes.victory * arenaReward(player.difficulty ?? 0);
  return summary;
}
const pairList = (raw, name, asInteger = false) => {
  const out = {};
  if (!raw) return out;
  for (const part of raw.split(',')) {
    const at = part.indexOf(':');
    if (at <= 0 || at === part.length - 1) throw new RangeError('Invalid ' + name + ' pair: ' + part);
    const slot = part.slice(0, at).trim(), val = part.slice(at + 1).trim();
    if (Object.hasOwn(out, slot)) throw new RangeError('Duplicate ' + name + ' slot: ' + slot);
    out[slot] = asInteger ? Number(val) : val;
  }
  return out;
};
export function parseCliArgs(args) {
  if (args[0] === '--config') {
    if (args.length !== 2) throw new RangeError('--config must be the only option');
    const raw = JSON.parse(readFileSync(resolve(args[1]), 'utf8'));
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw new RangeError('Config must contain a JSON object');
    return raw;
  }
  const flags = {
    '--battles':'battles','--seed':'seed','--start-bout':'startBout',
    '--grade':'grade','--loadout':'loadout','--armour':'armour',
    '--armour-slots':'armourSlots','--item-grade':'itemGrade','--quality':'quality',
    '--skill':'skill','--str':'str',
    '--dex':'dex','--end':'end',
    '--trace':'trace',
    '--snapshot':'snapshot'
  };
  const numeric = new Set(['battles','seed','startBout','skill','str','dex','end','trace','itemGrade']);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {out.help=true;continue;}
    const key = flags[arg];
    if (!key || i + 1 >= args.length || args[i+1].startsWith('--'))
      throw new RangeError('Unknown or incomplete option: ' + arg);
    if (Object.hasOwn(out, key)) throw new RangeError('Repeated option: ' + arg);
    const value = args[++i];
    out[key] = numeric.has(key) ? Number(value) :
      key === 'armourSlots' ? pairList(value, 'armour', false) :
      key === 'snapshot' ? JSON.parse(readFileSync(resolve(value), 'utf8')) : value;
  }
  if (out.snapshot && ['grade','loadout','armour','armourSlots','itemGrade','quality','skill',
      'str','dex','end'].some(k => Object.hasOwn(out,k)))
    throw new RangeError('--snapshot supplies the frozen fighter; do not mix build options');
  return out;
}
export const HELP = [
  'Developer-only combat simulator (exact game resolver; no animation or delays).',
  'Run from repository root: node tools/combat-simulator.mjs --battles 10000',
  'Options:',
  ' --battles N              number of duels (default 10000; max 1000000)',
  ' --grade Non-grade|F|E|D|C|B|A|S  opponent difficulty (default Non-grade)',
  ' --loadout greatsword|sword_shield|hammer|bow|spear',
  ' --armour none|padded|leather|plate   all 11 body slots (default none)',
  ' --armour-slots head:plate,torso:leather   overrides individual body slots',
  ' --skill N --str N --dex N --end N  default: grade benchmarks',
  ' --seed N                  live combat session RNG seed (default 20261124)',
  ' --start-bout N            zero-based live bout index (default 0)',
  ' --snapshot FILE.json     local frozen combatSession/player JSON; no uploads',
  ' --config FILE.json       load scenario options from local JSON; cannot mix flags',
  ' --trace N                include N full event traces (max 100)',
  ' --help                   this guide',
  'Write JSON to a file with shell redirection: ... > combat-report.json',
  'IMPORTANT: Grade/stat build benchmarks are synthetic, not player progression.',
  'Saved snapshots use real frozen player stats; synthetic builds may attempt any arena grade.'
].join('\n');
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    console.log(args.help ? HELP : JSON.stringify(simulateBatch(args), null, 2));
  } catch (err) {
    console.error('Combat simulator:', err.message);
    process.exitCode = 1;
  }
}
