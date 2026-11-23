import {
  SAVE_KEY, ACTIVITIES, ITEM_KEYS, ITEM_LABELS, ATTRIBUTES, ACTIVITY_STAT_WEIGHTS, allAttributeProgress,
  effectiveAttributeProgress, masteryAwardForNextLevel,
  lootChances, recipeOptions, newGame, readSave, settle,
  enterGame, queueStartActivity, queueInsertTimedActivity, requestActivityChange,
  queueSetDuration, queueSwap, queueRemoveLast,
  MAX_WAGONS, SCHEDULE_BALANCE, MINUTE_MS, HOUR_MS, DAY_MS, TIMING_PROFILE, UNTIL_LEVEL_UP,
  SAME_ZONE_TRAVEL_MS, ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS,
  xpToNextLevel, skillMasterReadiness, skillMasterOffer, learnFromMaster, setCombatLoadout, setArmourChoice,
  GLORY_SCROLL_ID, GLORY_RULES, enchantEquipmentSlot, enchantBonus
} from "./engine.mjs?v=20261123-short-duel1";

import { combatAtTime, COMBAT_BALANCE, COMBAT_LOADOUTS, COMBAT_SKILLS } from "./combat.mjs?v=20261123-short-duel1";
import { combatArtworkForEvent } from "./combat-art.mjs?v=20261122-dice-duels1";
import { combatFlowState } from "./combat-flow.mjs?v=20261123-short-duel1";
import { combatReadoutForEvent, workReadoutForReport } from "./result-readout.mjs?v=20261122-results1";
import { ARMOUR_SLOTS, ARMOUR_SLOT_BY_ID, ARMOUR_CHOICES, WEAPON_PIECES,
  armourOption, armourUnlocked, armourStats }
  from "./armour.mjs?v=20261122-guard-impact1";
import { ALPHA_CLOCK_KEY, ALPHA_DAY_MS, alphaTime, parseAlphaClock,
  setAlphaSpeed, advanceAlphaClock } from "./alpha-tools.mjs?v=20261122-alpha-tools1";
const $ = id => document.getElementById(id);
const ui = {
  playerName: $("character-heading"), nameInput: $("nameInput"), saveName: $("saveName"),
  characterAttributes: $("characterAttributes"),
  weaponSlots: $("weaponSlots"), combatSkillsText: $("combatSkillsText"),
  armourSlots: $("armourSlots"), armourChoice: $("armourChoice"),
  armourChoiceLabel: $("armourChoiceLabel"), armourEditor: $("armourEditor"),
  weaponEditor: $("weaponEditor"), equipmentEditHeading: $("equipmentEditHeading"),
  gearStats: $("gearStats"), gloryWallet: $("gloryWallet"),
  enchantSelected: $("enchantSelected"), enchantChance: $("enchantChance"),
  enchantChanceBreakdown: $("enchantChanceBreakdown"),
  enchantChanceDetails: $("enchantChanceDetails"),
  enchantFeedback: $("enchantFeedback"), enchantTotal: $("enchantTotal"),
  resourceList: $("resourceList"), choices: $("activityChoices"),
  openActivities: $("openActivities"), categories: $("activityCategories"),
  categoryChoices: $("activityCategoryChoices"), listScreen: $("activityListScreen"),
  backToActivities: $("backToActivities"), backToCategories: $("backToCategories"),
  categoryTitle: $("activityCategoryTitle"),
  skillTitle: $("skillTitle"), skillLevel: $("skillLevel"), skillXp: $("skillXp"), skillFill: $("skillFill"),
  masterStatus: $("masterStatus"), visitMaster: $("visitMaster"), masterAudience: $("masterAudience"),
  masterSkills: $("masterSkills"), masterTribute: $("masterTribute"), masterWarning: $("masterWarning"),
  masterConfirm: $("masterConfirm"), masterCancel: $("masterCancel"),
  sceneTag: $("sceneTag"), sceneImage: $("sceneImage"), sceneCaption: $("sceneCaption"),
  combatPanel: $("combatPanel"), combatEventTitle: $("combatEventTitle"),
  combatDice: $("combatDice"), combatTurns: $("combatTurns"),
  combatDiceStage: $("combatDiceStage"),
  combatFlow: $("combatFlow"), combatFlowMeter: $("combatFlowMeter"), combatFlowFill: $("combatFlowFill"),
  combatFlowSteps: Array.from({length:5},(_,i)=>$("combatFlowStep"+i)),
  combatFlowIcons: Array.from({length:5},(_,i)=>$("combatFlowIcon"+i)),
  combatFlowLabels: Array.from({length:5},(_,i)=>$("combatFlowLabel"+i)),
  playerDiceTray: $("playerDiceTray"), enemyDiceTray: $("enemyDiceTray"),
  playerDiceLabel: $("playerDiceLabel"), enemyDiceLabel: $("enemyDiceLabel"),
  playerDiceTotal: $("playerDiceTotal"), enemyDiceTotal: $("enemyDiceTotal"),
  playerDie: [$("playerDie1"), $("playerDie2"), $("playerDie3")],
  enemyDie: [$("enemyDie1"), $("enemyDie2"), $("enemyDie3")],
  heading: $("scene-heading"), description: $("activityDescription"), actionFill: $("actionFill"),
  activityProgress: $("activityProgress"), transitionStatus: $("transitionStatus"),
  transitionPhase: $("transitionPhase"), transitionProgress: $("transitionProgress"), transitionFill: $("transitionFill"),
  wagonQueue: $("wagonQueue"), wagonList: $("wagonList"),
  queuePlanner: $("queuePlanner"), queuePlannerTitle: $("queuePlannerTitle"),
  queuePlannerHint: $("queuePlannerHint"), queueAmountLabel: $("queueAmountLabel"),
  queueAmount: $("queueAmount"), queueUnit: $("queueUnit"),
  queueConfirm: $("queueConfirm"), queueCancel: $("queueCancel"),
  resultCombat: $("combatReadout"), resultWork: $("workReadout"),
  playerResult: $("playerResult"), enemyResult: $("enemyResult"),
  workResultTitle: $("workResultTitle"), workResultTokens: $("workResultTokens"),
  resultNotice: $("resultNotice"),
  banner: $("sceneBanner"), saveStatus: $("saveStatus"),
  alphaReset: $("alphaReset"), alphaDay: $("alphaDay"), alphaSpeed: $("alphaSpeed"),
  alphaStatus: $("alphaStatus")
};
const number = value => new Intl.NumberFormat("en-GB").format(value);
// The planner and editable hourglass draw from the same validated duration
// limits as the engine. No duplicated 1..8 lists in HTML or JS.
for (let n = SCHEDULE_BALANCE.minDurationUnits; n <= SCHEDULE_BALANCE.maxDurationUnits; n++) {
  const option = document.createElement("option");
  option.value = String(n);
  option.textContent = String(n);
  ui.queueAmount.append(option);
}
// The two existing combat styles are real equipment cards like armour slots,
 // not a separate full-width form above the folded equipment panel.
const weaponButtons = new Map();
for (const loadout of Object.values(COMBAT_LOADOUTS)) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "armour-slot weapon-slot";
  button.setAttribute("data-loadout", loadout.id);
  const glyph = document.createElement("span");
  glyph.className = "armour-slot-symbol";
  glyph.textContent = loadout.id === "greatsword" ? "⚔" : "♜";
  const caption = document.createElement("span");
  caption.className = "weapon-slot-name";
  caption.textContent = loadout.name;
  const weight = document.createElement("span");
  weight.className = "weapon-slot-weight";
  weight.textContent = WEAPON_PIECES[loadout.id]
    .reduce((sum,part)=>sum+part.kg,0) + " kg";
  const enchant = document.createElement("span");
  enchant.className = "slot-enchant-rank";
  enchant.hidden = true;
  caption.append(enchant);
  button.append(glyph,caption,weight);
  button.addEventListener("click", () => {
    const selectionChanged = selectEquipmentSlot("weapon");
    if (state.combatLoadout === loadout.id) {
      if (selectionChanged) render();
      return;
    }
    const result = setCombatLoadout(state,loadout.id,gameNow());
    state = result.state;
    reportProgress(result);
    message("Equipped: " + loadout.name);
    writeSave();
    render();
  });
  weaponButtons.set(loadout.id,{button,enchant});
  ui.weaponSlots.append(button);
}
// One shared edit selection across the single weapon slot and all eleven
// independent body slots. Selected is NOT synonymous with worn/equipped.
let selectedEquipmentSlot = "head";
function selectEquipmentSlot(slot) {
  if (slot !== "weapon" && !ARMOUR_SLOT_BY_ID[slot])
    throw new RangeError("Unknown equipment slot");
  const changed=selectedEquipmentSlot !== slot;
  selectedEquipmentSlot=slot;
  if (changed) {
    // Never show the previous slot's warning or success message for this slot.
    ui.enchantChanceBreakdown.hidden=true;
    ui.enchantChance.setAttribute("aria-expanded","false");
    ui.enchantFeedback.hidden=true;
  }
  return changed;
}
let lastArmourOptionsKey = null;
const armourButtons = new Map();
for (const slot of ARMOUR_SLOTS) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "armour-slot";
  button.setAttribute("data-slot", slot.id);
  const glyph = document.createElement("span");
  glyph.className = "armour-slot-symbol";
  glyph.textContent = slot.icon;
  const caption = document.createElement("span");
  caption.className = "armour-slot-caption";
  caption.textContent = slot.short;
  const equipped = document.createElement("span");
  equipped.className = "armour-slot-item";
  const enchant = document.createElement("span");
  enchant.className = "slot-enchant-rank";
  enchant.hidden = true;
  caption.append(enchant);
  button.append(glyph,caption,equipped);
  button.addEventListener("click", () => {
    selectEquipmentSlot(slot.id);
    render();
  });
  armourButtons.set(slot.id, {button, equipped, enchant});
  ui.armourSlots.append(button);
}
const insignia = document.createElement("span");
insignia.className = "armour-insignia";
insignia.textContent = "✣";
insignia.setAttribute("aria-hidden", "true");
ui.armourSlots.append(insignia);

function renderArmour() {
  const editingWeapon = selectedEquipmentSlot === "weapon";
  const slot = editingWeapon ? null : ARMOUR_SLOT_BY_ID[selectedEquipmentSlot];
  const selectedRank=state.enchantments[selectedEquipmentSlot];
  const selectedName=editingWeapon ? "WEAPON" : slot.short;
  ui.equipmentEditHeading.textContent = selectedName +
    (selectedRank > 0 ? " +" + selectedRank : "");
  ui.armourEditor.hidden = editingWeapon;
  ui.weaponEditor.hidden = !editingWeapon;
  ui.weaponEditor.textContent = COMBAT_LOADOUTS[state.combatLoadout].name;

  if (slot) {
    const attributes = effectiveAttributeProgress(state.attributeEffort, state.skills);
    const key = slot.id + ":" + ["STR","DEX","WIL"].map(id => attributes[id].value).join(":") +
      ":" + state.armour[slot.id];
    if (lastArmourOptionsKey !== key) {
      const options = ARMOUR_CHOICES[slot.group].map(piece => {
        const opt = document.createElement("option");
        opt.value = piece.id;
        const eligible = armourUnlocked(attributes,slot.id,piece.id);
        // Already-worn V7 gear survives this stat requirement.
        const legacyEquipped = !eligible && state.armour[slot.id] === piece.id;
        opt.disabled = !eligible && !legacyEquipped;
        const gate = piece.requirement;
        opt.textContent = piece.name + " · " + piece.weightKg + " kg" +
          (gate ? " · " + gate.stat + " " + gate.min : "") +
          (legacyEquipped ? " · Previously equipped" : "");
        return opt;
      });
      ui.armourChoice.replaceChildren(...options);
      lastArmourOptionsKey = key;
    }
    ui.armourChoiceLabel.textContent = slot.name;
    ui.armourChoice.value = state.armour[slot.id];
  }
  const gear = armourStats(state.armour,state.combatLoadout);
  const bonus = enchantBonus(state.enchantments);
  ui.gearStats.textContent = gear.totalKg + " kg  ·  MOVE " + gear.mobilityPct +
    "%  ·  PHYS " + gear.physicalReductionPct + "%  ·  DODGE " +
    (gear.evasionScore >= 0 ? "+" : "") + gear.evasionScore +
    (bonus.attack > 0 ? "  ·  ATK +" + bonus.attack : "") +
    (bonus.defense > 0 ? "  ·  DEF +" + bonus.defense : "") +
    "  ·  MR* " + gear.magicResistancePct + "%";
  const totalRanks = Object.values(state.enchantments).reduce((sum,n)=>sum+n,0);
  ui.enchantTotal.textContent = "✧ +" + totalRanks;
  ui.enchantTotal.hidden = totalRanks === 0;
  for (const [id,parts] of weaponButtons) {
    const equipped = id === state.combatLoadout;
    const selected = editingWeapon && equipped;
    parts.button.setAttribute("aria-pressed",String(selected));
    parts.button.setAttribute("data-equipped",String(equipped));
    const rank = state.enchantments.weapon;
    parts.button.setAttribute("aria-label",COMBAT_LOADOUTS[id].name +
      (rank > 0 ? ", enchanted +" + rank : "") +
      ". " + (selected ? "Selected equipment slot" :
        equipped ? "Equipped; select weapon slot" : "Equip and select weapon slot"));
    parts.enchant.textContent = rank > 0 ? " +" + rank : "";
    parts.enchant.hidden = rank === 0;
  }
  ui.gearStats.title = "Physical reduction, dodge and mobility are active. " +
    "MR is reserved for future magic damage; slot enchants add physical attack or defense.";
  ui.gloryWallet.textContent = "✧ " + number(state.items[GLORY_SCROLL_ID]) + " Glory Scrolls";
  const chancePct=Math.round(GLORY_RULES.enchantSuccessChance*100);
  ui.enchantChance.textContent=chancePct + "% ⓘ";
  ui.enchantChance.title="See the current enchant probability and risk";
  const effect = editingWeapon ? "ATK" : "DEF";
  const successRank=selectedRank+1;
  const hasScroll=state.items[GLORY_SCROLL_ID]>0;
  ui.enchantSelected.disabled = !hasScroll || selectedRank >= GLORY_RULES.maxRank;
  ui.enchantSelected.setAttribute("aria-label","Enchant only " + selectedName +
    (selectedRank>0?" +"+selectedRank:"") +
    "; " + chancePct + "% success, costs one Glory Scroll");
  ui.enchantSelected.title = !hasScroll ? "Requires 1 Glory Scroll" :
    selectedRank>=GLORY_RULES.maxRank ? "Maximum enchantment rank reached" :
    "Chance " + chancePct + "%; failure resets " + selectedName + " to +0";
  const details=[
    "Selected slot: " + selectedName + (selectedRank>0?" +"+selectedRank:""),
    "Base success chance: " + chancePct + "%",
    "Active chance modifiers: none (0 percentage points)",
    "Final success chance: " + chancePct + "%",
    "Cost per attempt: 1 Glory Scroll (success or failure)",
    selectedRank >= GLORY_RULES.maxRank
      ? "At maximum enchant rank: +" + GLORY_RULES.maxRank + " (no further attempts)"
      : "Success: +" + successRank + " on this slot (+" +
        (editingWeapon ? successRank*GLORY_RULES.attackPerRank :
          successRank*GLORY_RULES.defensePerRank) + " " + effect + " total from this slot)",
    "Failure: this slot resets to +0 (lose " + selectedRank + " existing rank" +
      (selectedRank===1?"":"s") + "); other slots stay unchanged",
    "No attributes, skill level, equipment type or current rank change the chance yet."
  ];
  ui.enchantChanceDetails.textContent=details.join("\n");
  for (const part of ARMOUR_SLOTS) {
    const row = armourButtons.get(part.id);
    const picked = armourOption(part.id, state.armour[part.id]);
    row.equipped.textContent = picked?.name ?? "—";
    const rank=state.enchantments[part.id];
    row.enchant.textContent = rank > 0 ? " +" + rank : "";
    row.enchant.hidden = rank === 0;
    row.button.setAttribute("aria-pressed",
      String(part.id === selectedEquipmentSlot));
    row.button.setAttribute("aria-label",part.name +
      (rank > 0 ? " +" + rank : "") + ": " + (picked?.name ?? "none") +
      ". Select this one equipment slot");
  }
}

const FACE_GLYPHS = Object.freeze(["⚀","⚁","⚂","⚃","⚄","⚅"]);
// Animated previews never affect the already-resolved deterministic game dice.
function previewFace(seed, bout, step, frame, index) {
  let n = (seed ^ Math.imul(bout + 1, 2654435761) ^
    Math.imul(step + 1, 2246822519) ^ Math.imul(frame + 1, 3266489917) ^
    Math.imul(index + 1, 668265263)) >>> 0;
  n ^= n >>> 16;
  n = Math.imul(n, 2246822519) >>> 0;
  n ^= n >>> 13;
  return 1 + n % 6;
}
// Two real, independent 3d6 checks: attacker rolls first on screen, then
// defender. The engine already determined both rolls; these are only previews.
function presentDice(combat, event, phase, isRevealed) {
  const initiative = event.type === "initiative";
  const left = initiative ? event.playerDice :
    event.actor === "player" ? event.attackDice : event.defenseDice;
  const right = initiative ? event.enemyDice :
    event.actor === "enemy" ? event.attackDice : event.defenseDice;
  const leftScore = initiative ? event.playerTotal :
    event.actor === "player" ? event.attackTotal : event.defenseTotal;
  const rightScore = initiative ? event.enemyTotal :
    event.actor === "enemy" ? event.attackTotal : event.defenseTotal;
  ui.playerDiceLabel.textContent = initiative ? "YOU · FIRST?" :
    event.actor === "player" ? "YOU · ATTACK" : "YOU · DEFEND";
  ui.enemyDiceLabel.textContent = initiative ? "ENEMY · FIRST?" :
    event.actor === "enemy" ? "ENEMY · ATTACK" : "ENEMY · DEFEND";
  const isPlayerAttacker = event.actor === "player";
  const playerMode = isRevealed ? "done" : initiative ? "rolling" :
    isPlayerAttacker ? (phase === "attack" ? "rolling" : "done") :
      phase === "attack" ? "pending" : "rolling";
  const enemyMode = isRevealed ? "done" : initiative ? "rolling" :
    !isPlayerAttacker ? (phase === "attack" ? "rolling" : "done") :
      phase === "attack" ? "pending" : "rolling";
  const frame = Math.floor(combat.eventElapsedMs / 250);
  for (let i = 0; i < 3; i++) {
    const playerFace = playerMode === "rolling"
      ? previewFace(state.combatSession.seed,combat.bout,combat.step,frame,i) :
      playerMode === "pending" ? 1 : left[i];
    const enemyFace = enemyMode === "rolling"
      ? previewFace(state.combatSession.seed,combat.bout,combat.step,frame,i + 3) :
      enemyMode === "pending" ? 1 : right[i];
    ui.playerDie[i].textContent = FACE_GLYPHS[playerFace - 1];
    ui.enemyDie[i].textContent = FACE_GLYPHS[enemyFace - 1];
    ui.playerDie[i].title = playerMode === "pending" ? "Waiting" : String(playerFace);
    ui.enemyDie[i].title = enemyMode === "pending" ? "Waiting" : String(enemyFace);
  }
  ui.playerDiceTotal.textContent = playerMode === "done" ? String(leftScore) :
    playerMode === "pending" ? "—" : "ROLLING";
  ui.enemyDiceTotal.textContent = enemyMode === "done" ? String(rightScore) :
    enemyMode === "pending" ? "—" : "ROLLING";
  ui.playerDiceTray.classList.toggle("rolling",playerMode === "rolling");
  ui.enemyDiceTray.classList.toggle("rolling",enemyMode === "rolling");
  ui.playerDiceTray.classList.toggle("pending",playerMode === "pending");
  ui.enemyDiceTray.classList.toggle("pending",enemyMode === "pending");
}
function showCombatFlow(flow) {
  ui.combatFlow.hidden = !flow;
  if (!flow) return;
  for (let i = 0; i < ui.combatFlowSteps.length; i++) {
    ui.combatFlowSteps[i].hidden = i >= flow.steps.length;
    if (ui.combatFlowSteps[i].hidden) continue;
    ui.combatFlowIcons[i].textContent = flow.steps[i].icon;
    ui.combatFlowLabels[i].textContent = flow.steps[i].label;
    ui.combatFlowSteps[i].setAttribute("data-state",
      i < flow.current ? "done" : i === flow.current ? "active" : "upcoming");
  }
  ui.combatFlowFill.style.width = flow.percent.toFixed(2) + "%";
  ui.combatFlowMeter.setAttribute("aria-valuenow",String(Math.round(flow.percent)));
  ui.combatFlowMeter.setAttribute("aria-label",
    "Automatic fighting: " + flow.steps[flow.current].label);
}

let state;
let alphaClock = null;
function gameNow() { return alphaTime(alphaClock,Date.now()); }
function persistAlphaClock(clock) {
  if (!storageWorks) return false;
  try {
    localStorage.setItem(ALPHA_CLOCK_KEY,JSON.stringify(clock));
    alphaClock=clock;
    ui.alphaSpeed.checked=clock.speed===10;
    return true;
  } catch {
    ui.alphaStatus.textContent="Alpha speed is unavailable while device storage is blocked.";
    return false;
  }
}
// Readouts are transient observations, never fabricated save fields or history.
let latestWorkResult = null;
const visibleTokenSignatures = new Map();
let lastSavedAt = 0;
let storageWorks = true;
let planningActivity = null;
let planningHint = "";
let lastWagonSignature = null;
const wagonSkillLabels = new Map();
let currentScheduledMeter = null;
let currentScheduledFill = null;
let lastCombatEventKey = null;

const CATEGORY_LABELS = Object.freeze({
  combat: "Fighting", craft: "Honest Work", outlaw: "Outlaw Path", training: "Training & Knowledge", leisure: "Tavern & Leisure", clan: "Clan Activities", other: "Other Activities"
});
const categoryActivities = new Map(Object.keys(CATEGORY_LABELS).map(id => [id, []]));
let selectedCategory = null;

function showActivityScreen(screen, category = selectedCategory) {
  selectedCategory = category;
  ui.categories.hidden = screen !== "categories";
  ui.listScreen.hidden = screen !== "list";
  ui.openActivities.hidden = screen !== "root";
  ui.openActivities.setAttribute("aria-expanded", String(screen !== "root"));
  if (screen === "list") {
    ui.categoryTitle.textContent = CATEGORY_LABELS[category] ?? "Activities";
    ui.choices.replaceChildren(...(categoryActivities.get(category) ?? []));
    if (!ui.choices.children.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "No activities here yet.";
      ui.choices.append(empty);
    }
  }
}
ui.openActivities.addEventListener("click", () => showActivityScreen("categories"));
ui.backToActivities.addEventListener("click", () => showActivityScreen("root", null));
ui.backToCategories.addEventListener("click", () => showActivityScreen("categories"));
for (const [id, label] of Object.entries(CATEGORY_LABELS)) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "activity-nav-button activity-category-button";
  button.textContent = label;
  button.setAttribute("aria-label", "Open " + label);
  button.addEventListener("click", () => showActivityScreen("list", id));
  ui.categoryChoices.append(button);
}
showActivityScreen("root", null);
const activityButtons = new Map();
const activityLevelLabels = new Map();
const activityRewardLabels = new Map();
const attributeValues = new Map();
for (const { id, name } of ATTRIBUTES) {
  const row = document.createElement("div");
  row.className = "character-attribute-row";
  const label = document.createElement("span");
  label.textContent = id;
  label.title = name;
  const value = document.createElement("strong");
  value.textContent = "10";
  row.append(label, value);
  ui.characterAttributes.append(row);
  attributeValues.set(id, value);
}
const resourceValues = {};
const resourceRows = new Map();
for (const [id, task] of Object.entries(ACTIVITIES)) {
  const row = document.createElement("div");
  row.className = "activity";
  const body = document.createElement("span");
  body.className = "activity-copy";
  const titleRow = document.createElement("span");
  titleRow.className = "activity-title-line";
  const name = document.createElement("strong");
  name.textContent = task.title;
  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "activity-start activity-icon-button";
  startButton.textContent = "▶";
  startButton.setAttribute("aria-label", "Start " + task.title + " now");
  startButton.title = "Start " + task.title + " now";
  startButton.addEventListener("click", () => startActivityNow(id));
  const queueButton = document.createElement("button");
  queueButton.type = "button";
  queueButton.className = "activity-start activity-queue-button activity-icon-button";
  queueButton.textContent = "↻";
  queueButton.setAttribute("aria-label", "Schedule " + task.title + " for a chosen duration");
  queueButton.title = "Schedule " + task.title + " for a chosen duration";
  queueButton.addEventListener("click", () => planActivity(id));
  const levelButton = document.createElement("button");
  levelButton.type = "button";
  levelButton.className = "activity-start activity-icon-button activity-levelup-button";
  levelButton.textContent = "↑";
  levelButton.setAttribute("aria-label", "Schedule " + task.title + " until ready to level up");
  levelButton.title = "Schedule " + task.title + " until ready to level up";
  levelButton.addEventListener("click", () => planActivity(id, true));
  const actions = document.createElement("span");
  actions.className = "activity-actions";
  actions.append(startButton, queueButton, levelButton);
  titleRow.append(name, actions);
  const detail = document.createElement("small");
  detail.textContent = task.itemLabel;
  const rank = document.createElement("small");
  rank.className = "skill-rank";
  const statGains = document.createElement("small");
  statGains.className = "activity-stat-gains";
  const weights = Object.entries(ACTIVITY_STAT_WEIGHTS[id])
    .sort((left, right) => right[1] - left[1]);
  statGains.textContent = "Stats · " +
    weights.map(([stat, weight]) => stat + (weight >= 50 ? "++" : "+")).join(" · ");
  statGains.title = "Attribute XP share: " +
    weights.map(([stat, weight]) => stat + " " + weight + "%").join(", ");
  body.append(titleRow, detail, rank, statGains);
  row.append(body);
  activityRewardLabels.set(id, detail);
  activityLevelLabels.set(id, rank);
  categoryActivities.get(task.category in CATEGORY_LABELS ? task.category : "other").push(row);
  activityButtons.set(id, { row, startButton, queueButton, levelButton });
}
for (const item of ITEM_KEYS) {
  const row = document.createElement("div");
  row.className = "item";
  const label = document.createElement("span");
  label.textContent = ITEM_LABELS[item];
  const count = document.createElement("strong");
  count.textContent = "0";
  row.append(label, count);
  ui.resourceList.append(row);
  resourceValues[item] = count;
  resourceRows.set(item, row);
}
const emptyInventory = document.createElement("p");
emptyInventory.className = "hint";
emptyInventory.textContent = "No resources collected yet.";
ui.resourceList.append(emptyInventory);

function writeSave() {
  if (!storageWorks) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    ui.saveStatus.textContent = "Saved on this device";
    lastSavedAt = Date.now();
  } catch {
    storageWorks = false;
    ui.saveStatus.textContent = "Save unavailable";
    ui.saveStatus.title = "Your browser is blocking local storage; progress may be lost when you close this tab.";
  }
}

function message(text) {
  // A single compact notification for actions/errors, not a scrollable history.
  ui.resultNotice.textContent = text;
}

/** Repaint only when the actual resolved values change (no 250ms flashing). */
function drawResultTokens(container, tokens) {
  const signature = JSON.stringify(tokens);
  if (visibleTokenSignatures.get(container) === signature) return;
  visibleTokenSignatures.set(container, signature);
  const nodes = tokens.map(result => {
    const item = document.createElement("span");
    item.className = "result-token";
    item.setAttribute("data-tone", result.tone);
    const value = document.createElement("strong");
    value.textContent = result.value;
    item.append(value);
    if (result.label) {
      const label = document.createElement("small");
      label.textContent = result.label;
      item.append(label);
    }
    return item;
  });
  container.replaceChildren(...nodes);
}

function renderResults(combat, revealed) {
  ui.resultCombat.hidden = !combat;
  ui.resultWork.hidden = Boolean(combat);
  if (combat) {
    // Before actual rolls resolve, retain ONLY the previous known result.
    const actualEvent = revealed ? combat.event :
      combat.events[combat.step - 1];
    const result = combatReadoutForEvent(actualEvent);
    drawResultTokens(ui.playerResult,result.player);
    drawResultTokens(ui.enemyResult,result.enemy);
  } else {
    const last = latestWorkResult?.activity === state.activity &&
      (!state.transition || state.transition.phase === "finishing")
      ? latestWorkResult : null;
    ui.workResultTitle.textContent = last?.title ??
      (state.transition ? "Changing activity" : state.activity
        ? ACTIVITIES[state.activity].title : "Ready");
    drawResultTokens(ui.workResultTokens,last?.tokens ?? []);
  }
}

function reportProgress(outcome) {
  if (!outcome) return false;
  let gained = false;
  for (const report of outcome.reports ?? [outcome.report ?? outcome]) {
    if (!report?.completed && !report?.gainedGlory) continue;
    if (report.gainedGlory)
      message("✧ +" + number(report.gainedGlory) + " Glory Scroll" +
        (report.gainedGlory===1 ? "" : "s"));
    const result = workReadoutForReport(report, ITEM_LABELS, ACTIVITIES);
    if (result) {
      latestWorkResult = result;
      ui.resultNotice.textContent = "";
    }
    gained = true;
  }
  return gained;
}

function announceArrival(priorTransition) {
  if (priorTransition && !state.transition && state.activity === priorTransition.targetActivity)
    message("You begin " + ACTIVITIES[state.activity].title.toLowerCase() + ".");
}


/** Queue-card skill values must refresh while their DOM controls stay mounted.
 * Recreating all three cards every tick would lose focus on duration selects.
 * The comma separates the actual level from XP progress toward its next one:
 * LvL 31,28 means skill level 31 with its current XP bar 28% complete.
 */
function updateWagonSkillLabels() {
  for (const [activity, label] of wagonSkillLabels) {
    const skill = state.skills[activity];
    const percent = Math.min(100, Math.floor(skill.xp / xpToNextLevel(skill.level) * 100));
    const value = ACTIVITIES[activity].title + " LvL " + number(skill.level) +
      "," + String(percent).padStart(2, "0");
    if (label.textContent !== value) label.textContent = value;
    label.setAttribute("aria-label", ACTIVITIES[activity].title + ", skill level " +
      number(skill.level) + ", " + percent + "% toward the next level" +
      (percent === 100 ? "; visit the Skill Master to advance" : ""));
  }
}

/** Keep all queued jobs visible; focused controls are rebuilt only on queue edits. */
const durationUnitMs = unit => unit === "days" ? DAY_MS :
  unit === "hours" ? HOUR_MS : MINUTE_MS;
function renderWagons() {
  const wagons = state.wagons ?? [];
  ui.wagonQueue.hidden = wagons.length < 2;
  const signature = JSON.stringify([wagons, state.transition?.targetActivity, state.activity]);
  if (signature === lastWagonSignature) {
    updateWagonSkillLabels();
    return;
  }
  lastWagonSignature = signature;
  wagonSkillLabels.clear();
  currentScheduledMeter = null;
  currentScheduledFill = null;
  // Unlike the previous scrolling wagon strip, every hourglass fits in view.
  ui.wagonList.style.gridTemplateColumns = "repeat(" + Math.max(1, wagons.length) +
    ", minmax(0, 1fr))";
  const cards = wagons.map((wagon, i) => {
    const card = document.createElement("article");
    card.className = "wagon";
    const label = document.createElement("strong");
    label.className = "wagon-name";
    wagonSkillLabels.set(wagon.activity, label);
    const position = document.createElement("small");
    position.className = "wagon-position";
    position.textContent = i === 0
      ? (state.transition?.targetActivity === wagon.activity ? "Changing to…" : "Current activity")
      : i === wagons.length - 1 ? "Final destination" : "Next activity";
    card.append(label, position);

    // Only the running finite activity needs an in-card progress bar.
    // Scheduled future slots show their chosen duration; Forever has no bar.
    if (i === 0 && wagon.plannedMs !== null) {
      const meter = document.createElement("div");
      meter.className = "hourglass-schedule-progress";
      meter.setAttribute("role", "progressbar");
      meter.setAttribute("aria-label", ACTIVITIES[wagon.activity].title +
        (wagon.plannedMs === UNTIL_LEVEL_UP
          ? " progress toward Skill Master readiness" : " work period progress"));
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", "100");
      meter.setAttribute("aria-valuenow", "0");
      const fill = document.createElement("span");
      fill.className = "hourglass-schedule-progress-fill";
      meter.append(fill);
      card.append(meter);
      currentScheduledMeter = meter;
      currentScheduledFill = fill;
    } else {
      // All cards reserve the same progress row, but only the active timed
      // task renders an actual progressbar. This keeps future/Forever
      // labels and controls aligned without adding fake progress.
      const spacer = document.createElement("div");
      spacer.className = "hourglass-progress-spacer";
      spacer.setAttribute("aria-hidden", "true");
      card.append(spacer);
    }

    if (i === wagons.length - 1) {
      const forever = document.createElement("strong");
      forever.className = "wagon-forever";
      forever.textContent = "FOREVER";
      card.append(forever);
    } else {
      const duration = document.createElement("div");
      duration.className = "wagon-duration";
      const heading = document.createElement("span");
      heading.textContent = wagon.plannedMs === UNTIL_LEVEL_UP ? "Until" : "Scheduled for";
      // One-click correction for an already queued timed task. The saved
      // stop condition, not the planner's temporary selection, is authoritative.
      const readyShortcut = document.createElement("button");
      readyShortcut.type = "button";
      readyShortcut.className = "wagon-mastery-shortcut";
      readyShortcut.textContent = "↑";
      readyShortcut.title = "Change " + ACTIVITIES[wagon.activity].title + " to Until LvL Up";
      readyShortcut.setAttribute("aria-label", readyShortcut.title);
      readyShortcut.hidden = wagon.plannedMs === UNTIL_LEVEL_UP;
      readyShortcut.addEventListener("click", () => {
        applyQueueChange(queueSetDuration(state, i, UNTIL_LEVEL_UP, gameNow()),
          "Now scheduled until ready to level up.");
      });
      heading.append(readyShortcut);
      const amount = document.createElement("select");
      amount.setAttribute("aria-label", "Duration for " + ACTIVITIES[wagon.activity].title);
      const unit = document.createElement("select");
      unit.setAttribute("aria-label", "Duration unit for " + ACTIVITIES[wagon.activity].title);
      for (let n = SCHEDULE_BALANCE.minDurationUnits; n <= SCHEDULE_BALANCE.maxDurationUnits; n++) {
        const option = document.createElement("option");
        option.value = String(n);
        option.textContent = String(n);
        amount.append(option);
      }
      for (const [value, label] of [["minutes", "Min"], ["hours", "Hours"], ["days", "Days"], [UNTIL_LEVEL_UP, "↑ LvL up"]]
        .filter(([value]) => value !== "minutes" || TIMING_PROFILE === "alpha" ||
          wagon.plannedMs < HOUR_MS)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        unit.append(option);
      }
      const selectedUnit = wagon.plannedMs === UNTIL_LEVEL_UP ? UNTIL_LEVEL_UP :
        wagon.plannedMs % DAY_MS === 0 ? "days" :
        wagon.plannedMs % HOUR_MS === 0 ? "hours" : "minutes";
      amount.value = selectedUnit === UNTIL_LEVEL_UP ? String(SCHEDULE_BALANCE.minDurationUnits) :
        String(wagon.plannedMs / durationUnitMs(selectedUnit));
      amount.hidden = selectedUnit === UNTIL_LEVEL_UP;
      unit.value = selectedUnit;
      const apply = () => {
        const plan = unit.value === UNTIL_LEVEL_UP ? UNTIL_LEVEL_UP :
          Number(amount.value) * durationUnitMs(unit.value);
        applyQueueChange(queueSetDuration(state, i, plan, gameNow()),
          "Hourglass stop condition updated.");
      };
      amount.addEventListener("change", apply);
      unit.addEventListener("change", apply);
      duration.append(heading, amount, unit);
      card.append(duration);
    }

    const controls = document.createElement("div");
    controls.className = "wagon-controls";
    const control = (label, title, action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wagon-control";
      button.textContent = label;
      button.setAttribute("aria-label", title);
      button.addEventListener("click", action);
      controls.append(button);
    };
    if (i > 0) control("←", "Move " + ACTIVITIES[wagon.activity].title + " earlier",
      () => applyQueueChange(queueSwap(state, i - 1, gameNow()), "Route rearranged."));
    if (i < wagons.length - 1) control("→", "Move " + ACTIVITIES[wagon.activity].title + " later",
      () => applyQueueChange(queueSwap(state, i, gameNow()), "Route rearranged."));
    if (i === wagons.length - 1 && i > 0) control("Remove", "Remove final future hourglass",
      () => applyQueueChange(queueRemoveLast(state, gameNow()), "Future hourglass removed."));
    card.append(controls);
    return card;
  });
  ui.wagonList.replaceChildren(...cards);
  updateWagonSkillLabels();
}

function applyQueueChange(result, description) {
  const prior = state.transition;
  state = result.state;
  reportProgress(result);
  announceArrival(prior);
  if (description) message(description);
  writeSave();
  render();
}

function hideQueuePlanner() {
  planningActivity = null;
  ui.queuePlanner.hidden = true;
}

function updatePlanningMode() {
  const untilReady = ui.queueUnit.value === UNTIL_LEVEL_UP;
  ui.queueAmount.hidden = untilReady;
  ui.queueAmountLabel.hidden = untilReady;
  ui.queuePlannerHint.textContent = planningHint +
    (untilReady
      ? " Stops only when both XP and Skill Master resources are ready. This does not level up automatically."
      : "");
  ui.queueConfirm.textContent = untilReady
    ? (state.wagons.length === 1 ? "Start until ↑ LvL Up" : "Add until ↑ LvL Up")
    : (state.wagons.length === 1 ? "Start for this time" : "Add timed task");
}
ui.queueUnit.addEventListener("change", updatePlanningMode);
ui.queueCancel.addEventListener("click", () => hideQueuePlanner());
ui.queueConfirm.addEventListener("click", () => {
  if (!planningActivity) return;
  const plan = ui.queueUnit.value === UNTIL_LEVEL_UP ? UNTIL_LEVEL_UP :
    Number(ui.queueAmount.value) * durationUnitMs(ui.queueUnit.value);
  const task = planningActivity;
  hideQueuePlanner();
  const startsImmediately = state.wagons.length === 1;
  applyQueueChange(queueInsertTimedActivity(state, task, plan, gameNow()),
    startsImmediately
      ? "Starting " + ACTIVITIES[task].title.toLowerCase() +
        (plan === UNTIL_LEVEL_UP ? " until ready to level up, then returning to " :
          " for the selected period, then returning to ") +
        ACTIVITIES[state.wagons.at(-1).activity].title.toLowerCase() + "."
      : "Scheduled " + ACTIVITIES[task].title.toLowerCase() +
        (plan === UNTIL_LEVEL_UP ? " until level-up readiness." : " for the selected period."));
});

function renderMaster() {
  const offer = skillMasterOffer(state);
  const count = offer.ready.length;
  ui.masterStatus.hidden = true; // No repeated readiness instructions on the small screen.
  ui.visitMaster.disabled = count === 0;
  ui.visitMaster.title = count === 0 ? "No skills ready to level up" : "";
  if (!count) ui.masterAudience.hidden = true;
  ui.visitMaster.textContent = count ? "Seek the Master · " + number(count) + " ready" : "Seek the Master";
  ui.visitMaster.setAttribute("aria-expanded", String(!ui.masterAudience.hidden));
  if (ui.masterAudience.hidden) return;
  const readyLines = offer.ready.map(id => {
    const item = document.createElement("p");
    const award = masteryAwardForNextLevel(id, state.skills[id].level);
    const bonus = Object.entries(award).map(([stat,points]) =>
      "+" + number(points) + " " + stat).join(", ");
    item.textContent = ACTIVITIES[id].title + ": Level " + number(state.skills[id].level) +
      " → " + number(state.skills[id].level + 1) + " · " + bonus;
    return item;
  });
  if (!readyLines.length) {
    const item = document.createElement("p");
    item.textContent = "No skill can advance yet. Fill its XP bar, then bring the spoils of that work.";
    readyLines.push(item);
  }
  ui.masterSkills.replaceChildren(...readyLines);
  const resources = Object.entries(offer.tribute);
  const tributeLines = resources.map(([id, qty]) => {
    const item = document.createElement("p");
    item.textContent = number(qty) + " " + ITEM_LABELS[id];
    return item;
  });
  if (!tributeLines.length) {
    const item = document.createElement("p");
    item.textContent = "No materials are produced by these skills.";
    tributeLines.push(item);
  }
  ui.masterTribute.replaceChildren(...tributeLines);
  ui.masterWarning.textContent = offer.blocked.length
    ? "Other skills still lack proof of their labour. The Master will leave those unchanged."
    : "Surrendered resources cannot be recovered.";
  ui.masterConfirm.disabled = count === 0;
  ui.masterConfirm.setAttribute("aria-label", "Surrender listed resources and advance " +
    number(count) + " ready skills once");
}

ui.visitMaster.addEventListener("click", () => {
  if (ui.visitMaster.disabled) return;
  ui.masterAudience.hidden = !ui.masterAudience.hidden;
  render();
});
ui.masterCancel.addEventListener("click", () => {
  ui.masterAudience.hidden = true;
  render();
});
ui.masterConfirm.addEventListener("click", () => {
  // Freeze the offer against the settled inventory before asking the player.
  // The next ordinary tick handles the time elapsed during confirmation.
  const outcome = settle(state, gameNow());
  state = outcome.state;
  reportProgress(outcome);
  const offer = skillMasterOffer(state);
  if (!offer.ready.length) {
    message("The Master sees no skill ready for his lessons.");
    writeSave();
    render();
    return;
  }
  const due = Object.entries(offer.tribute).map(([id, qty]) =>
    number(qty) + " " + ITEM_LABELS[id]);
  const warning = "THE MASTER'S DUE\nAdvance " + number(offer.ready.length) +
    " skill(s), one level each?\n\nLose ALL their current-level XP and every resource listed:" +
    (due.length ? "\n" + due.join("\n") : "\nNo material spoils from these skills.") +
    "\n\nThis cannot be undone.";
  if (!window.confirm(warning)) {
    writeSave();
    render();
    return;
  }
  const result = learnFromMaster(state, state.settledAtMs);
  state = result.state;
  ui.masterAudience.hidden = true;
  message("The Master claims his due. " + number(result.mastery.ready.length) +
    " skill" + (result.mastery.ready.length === 1 ? " has" : "s have") +
    " risen. +" + number(result.mastery.ready.length) +
    " permanent attribute " + (result.mastery.ready.length === 1 ? "point" : "points") +
    " allocated.");
  writeSave();
  render();
});

function render() {
  const current = state.activity ? ACTIVITIES[state.activity] : null;
  ui.alphaSpeed.checked = alphaClock?.speed === 10;
  const chosen = COMBAT_LOADOUTS[state.combatLoadout];
  ui.combatSkillsText.textContent = "Attack: " +
    COMBAT_SKILLS[chosen.attackSkill].name + " · Defense: " +
    COMBAT_SKILLS[chosen.defenseSkill].name;
  ui.playerName.textContent = state.name;
  const stats = effectiveAttributeProgress(state.attributeEffort, state.skills);
  for (const { id } of ATTRIBUTES) {
    const value = attributeValues.get(id);
    value.textContent = number(stats[id].value);
    value.title = id + ": " + number(stats[id].baseValue) +
      " from training + " + number(stats[id].masteryBonus) +
      " from claimed activity levels. " + stats[id].progressPercent.toFixed(1) +
      "% toward the next trained point (" + stats[id].progressXP.toFixed(1) +
      " / " + number(stats[id].nextXP) + " XP)";
  }
  if (document.activeElement !== ui.nameInput) ui.nameInput.value = state.name;
  for (const key of ITEM_KEYS) {
    const qty = state.items[key];
    resourceValues[key].textContent = number(qty);
    resourceRows.get(key).hidden = qty === 0;
  }
  emptyInventory.hidden = ITEM_KEYS.some(key => state.items[key] > 0);
  const transition = state.transition;
  renderWagons();
  if (currentScheduledMeter && currentScheduledFill && state.wagons[0]?.plannedMs) {
    const wagon = state.wagons[0];
    const progress = wagon.plannedMs === UNTIL_LEVEL_UP
      ? (() => {
          const readiness = skillMasterReadiness(state, wagon.activity);
          const ratio = 100 * state.skills[wagon.activity].xp / readiness.requiredXP;
          // Full XP alone is not finished if the Skill Master still lacks spoils.
          return readiness.ready ? 100 : Math.min(99, ratio);
        })()
      : 100 * state.productiveElapsedMs / wagon.plannedMs;
    const clamped = Math.max(0, Math.min(100, progress));
    currentScheduledFill.style.width = clamped.toFixed(2) + "%";
    currentScheduledMeter.setAttribute("aria-valuenow", String(Math.round(clamped)));
    currentScheduledMeter.hidden = Boolean(state.transition);
  }
  for (const [id, { row, startButton, queueButton, levelButton }] of activityButtons) {
    const skill = state.skills[id];
    activityLevelLabels.get(id).textContent = "Skill level " + number(skill.level) +
      (skill.xp >= xpToNextLevel(skill.level) ? " · Master ready" : "");
    const available = lootChances(id, skill.level);
    const recipes = recipeOptions(id, skill.level);
    activityRewardLabels.get(id).textContent = recipes.length
      ? recipes.map(t => `${t.label} (uses ${ITEM_LABELS[t.input]})`).join(" · ")
      : available.length ? available.map(t => t.label).join(" · ")
      : ACTIVITIES[id].itemLabel;
    const workingHere = state.activity === id && (!transition || transition.phase === "finishing");
    const destination = transition?.targetActivity === id;
    row.classList.toggle("active", workingHere);
    row.classList.toggle("pending", destination);
    const queuedIndex = state.wagons.findIndex(w => w.activity === id);
    const queueFull = state.wagons.length >= MAX_WAGONS;
    startButton.disabled = queuedIndex === 0;
    startButton.textContent = "▶";
    const startLabel = queuedIndex === 0
      ? "Current route destination: " + ACTIVITIES[id].title
      : "Start " + ACTIVITIES[id].title + " now, replacing the current route";
    startButton.setAttribute("aria-label", startLabel);
    startButton.title = startLabel;
    const canSchedule = Boolean(state.wagons.length) && queuedIndex === -1 && !queueFull;
    queueButton.disabled = !canSchedule;
    queueButton.textContent = "↻";
    const queueLabel = canSchedule
      ? "Schedule " + ACTIVITIES[id].title + " for a selected duration"
      : "Cannot schedule " + ACTIVITIES[id].title;
    queueButton.setAttribute("aria-label", queueLabel);
    queueButton.title = queueLabel;
    levelButton.disabled = !canSchedule;
    levelButton.textContent = "↑";
    const levelLabel = canSchedule
      ? "Schedule " + ACTIVITIES[id].title + " until ready to level up"
      : "Cannot schedule " + ACTIVITIES[id].title + " until level-up readiness";
    levelButton.setAttribute("aria-label", levelLabel);
    levelButton.title = levelLabel;
  }

  const selectedSkill = state.activity ? state.skills[state.activity] : null;
  ui.skillTitle.textContent = current ? current.title : "Choose an activity";
  if (selectedSkill) {
    const required = xpToNextLevel(selectedSkill.level);
    const ready = selectedSkill.xp >= required;
    ui.skillLevel.textContent = "Level " + number(selectedSkill.level);
    ui.skillXp.textContent = ready
      ? "XP full · Seek the Skill Master to advance"
      : number(selectedSkill.xp) + " / " + number(required) + " skill XP";
    ui.skillFill.style.width = Math.min(100, selectedSkill.xp / required * 100).toFixed(2) + "%";
  } else {
    ui.skillLevel.textContent = "—";
    ui.skillXp.textContent = "Each activity has independent XP.";
    ui.skillFill.style.width = "0%";
  }

  renderMaster();
  renderArmour();
  ui.activityProgress.hidden = Boolean(transition);
  ui.transitionStatus.hidden = !transition;
  if (transition) {
    const stageNames = {
      finishing: "Finishing current activity",
      moving: "Moving to new location",
      preparing: "Getting ready to start new activity"
    };
    const phaseName = stageNames[transition.phase];
    if (ui.transitionPhase.textContent !== phaseName) ui.transitionPhase.textContent = phaseName;
    const phaseLength = transition.phase === "finishing" ? ACTIVITIES[state.activity].durationMs :
      transition.phase === "moving"
      ? (ACTIVITIES[state.activity].zone === ACTIVITIES[transition.targetActivity].zone
        ? SAME_ZONE_TRAVEL_MS : ZONE_TRAVEL_MS)
      : (state.activity ? PREPARATION_MS : INITIAL_PREPARATION_MS);
    const phaseElapsed = transition.phase === "finishing" ? state.progressMs : transition.phaseProgressMs;
    const percent = Math.min(100, 100 * phaseElapsed / phaseLength);
    ui.transitionFill.style.width = percent.toFixed(2) + "%";
    ui.transitionProgress.setAttribute("aria-valuenow", String(Math.round(percent)));
    ui.transitionProgress.setAttribute("aria-label", phaseName);
  }
  // The scene stays on the last RESOLVED result while real dice roll.
  // No early damage text, premature artwork or redundant work-cycle bar.
  const combat = current?.category === "combat" && !transition
    ? combatAtTime(state.combatSession) : null;
  ui.activityProgress.hidden = Boolean(transition || current?.category === "combat");
  ui.combatPanel.hidden = !combat;
  showCombatFlow(combat ? combatFlowState(combat,state.combatSession) : null);
  ui.combatDiceStage.hidden = true;
  ui.combatDice.hidden = true;
  let imageEvent = null;
  let combatRevealed = false;
  if (combat) {
    const event = combat.event;
    const rollingPhase = event.type === "initiative" || Boolean(event.attackDice);
    const windup = event.attackDice ? (COMBAT_SKILLS[event.attackSkill].windupMs ?? 0) : 0;
    const revealAt = windup + (event.type === "initiative"
      ? COMBAT_BALANCE.initiativeAnimationMs : COMBAT_BALANCE.attackAnimationMs);
    const revealed = !rollingPhase || combat.eventElapsedMs >= revealAt;
    combatRevealed = revealed;
    const isRolling = rollingPhase && combat.eventElapsedMs >= windup && !revealed;
    const showTray = rollingPhase && combat.eventElapsedMs >= windup &&
      combat.eventElapsedMs < revealAt + 2_000;
    ui.combatDiceStage.hidden = !showTray;
    const halfway = windup + COMBAT_BALANCE.attackAnimationMs / 2;
    const dicePhase = event.type === "initiative" ? "initiative" :
      combat.eventElapsedMs < halfway ? "attack" : "defense";
    if (showTray) presentDice(combat,event,dicePhase,revealed);
    imageEvent = revealed ? event : combat.events[combat.step - 1];
    const finishedTurns = revealed && event.turn ? event.turn :
      (combat.events[combat.step - 1]?.turn ?? 0);
    ui.combatTurns.textContent = Array.from({length:COMBAT_BALANCE.maxHalfTurns},
      (_,i)=>i<finishedTurns?"◆":"◇").join(" ");
    const rollCaption = event.type === "initiative" ? "ROLLING FOR FIRST" :
      combat.eventElapsedMs < halfway ? "ATTACK DICE ROLLING" : "DEFENSE DICE ROLLING";
    ui.combatEventTitle.textContent = "DUEL "+number(combat.bout)+" · "+
      (!revealed ? (combat.eventElapsedMs < windup ? "PREPARING" : rollCaption) :
        event.type === "initiative" ?
          (event.actor === "player" ? "YOU ATTACK FIRST" : "ENEMY ATTACKS FIRST") :
          event.type.toUpperCase());
    ui.combatDice.hidden = !revealed || event.type !== "finisher";
    ui.combatDice.textContent = event.type === "finisher" && revealed ? "6 · 6 · 6" : "";
    ui.combatPanel.classList.toggle("finisher",revealed && event.type === "finisher");
    const key = state.combatSession.seed + ":" + combat.bout + ":" + combat.step;
    if (revealed && key !== lastCombatEventKey) {
      if (!ui.resultNotice.textContent.includes("Glory Scroll"))
        ui.resultNotice.textContent = "";
      lastCombatEventKey = key;
    }
  } else {
    lastCombatEventKey = null;
    ui.combatTurns.textContent = "";
  }
  renderResults(combat,combatRevealed);
  const sceneActivity = transition ? ACTIVITIES[transition.targetActivity] : current;
  if (!sceneActivity) {
    ui.sceneTag.textContent = "WAITING FOR ORDERS";
    ui.banner.textContent = "THE LONG VIGIL";
    ui.heading.textContent = "Choose an activity";
    ui.description.hidden = false;
    ui.description.textContent = "Choose a craft or gathering task. Each cycle includes preparation and hauling.";
    ui.actionFill.style.width = "0%";
    ui.activityProgress.setAttribute("aria-valuenow", "0");
  } else {
    const isHunt = sceneActivity === ACTIVITIES.hunting;
    ui.sceneTag.textContent = transition ? "CHANGING PATH" : sceneActivity.zone.toUpperCase();
    ui.banner.textContent = transition ? "THE JOURNEY" : sceneActivity.title.toUpperCase();
    ui.heading.textContent = transition ? "Changing to " + sceneActivity.title : sceneActivity.title;
    // The arena picture and its short status stay; only factual color-coded
    // results appear in the compact panel below, with no narrative history.
    ui.description.hidden = Boolean(combat);
    ui.description.textContent = combat ? "" : transition
      ? "Your character finishes their work, travels and prepares before the new task begins."
      : sceneActivity.description;
    // Every live turn selects its actual combat event / attacker weapon /
    // defender shield / player outcome. Other activities retain static art.
    const sceneId = transition ? transition.targetActivity : state.activity;
    const combatArt = imageEvent ? combatArtworkForEvent(
      imageEvent, state.combatSession.player.loadout, combat.enemyLoadout) : null;
    const sceneAsset = sceneActivity.item === null
      ? (sceneActivity.category === "training" ? "masonry" : "cooking")
      : sceneId;
    const desiredImage = sceneId === "fighting"
      ? "./assets/combat/" + (combatArt?.asset ?? "fight-engage") + ".webp?v=20261122-dice-duels1"
      : "./assets/" + sceneAsset + ".webp?v=20261122-dice-duels1";
    if (ui.sceneImage.getAttribute("src") !== desiredImage) {
      ui.sceneImage.onerror = () => {
        ui.sceneImage.onerror = null;
        ui.sceneImage.src = sceneId === "fighting"
          ? "./assets/combat/fight-engage.webp?v=20261122-dice-duels1"
          : "./assets/" + (isHunt ? "hunting.webp" : "mining.webp") +
            "?v=20261122-dice-duels1";
      };
      ui.sceneImage.src = desiredImage;
    }
    ui.sceneImage.alt = combatArt?.alt ?? (sceneId === "fighting"
      ? "Two battle-worn warriors in a torchlit fighting pit."
      : "Dark fantasy illustration of " + sceneActivity.title.toLowerCase());
    ui.sceneCaption.textContent = combatArt?.label ??
      (sceneId === "fighting" ? "THE FIGHTING PIT" : sceneActivity.zone.toUpperCase());
    if (!transition) {
      const percentage = Math.min(100, 100 * state.progressMs / sceneActivity.durationMs);
      ui.actionFill.style.width = percentage.toFixed(2) + "%";
      ui.activityProgress.setAttribute("aria-valuenow", String(Math.round(percentage)));
    }
  }
}

function tick() {
  if (document.visibilityState === "hidden") return;
  const before = state.transition;
  const result = settle(state, gameNow());
  state = result.state;
  const gained = reportProgress(result);
  announceArrival(before);
  if (gained || (before && !state.transition) || gameNow() - lastSavedAt > 3000) writeSave();
  render();
}

function returnToGame() {
  const before = state.transition;
  const result = enterGame(state, gameNow());
  state = result.state;
  reportProgress(result);
  announceArrival(before);
  writeSave();
  render();
}

function startActivityNow(kind) {
  const alreadyCurrent = state.wagons[0]?.activity === kind;
  if (alreadyCurrent) return;
  // A deliberate manual override can clear *uncompleted plans* but never
  // inventory/XP. Require confirmation if any future routes are discarded.
  if (state.wagons.length > 1 &&
      !window.confirm("Start " + ACTIVITIES[kind].title +
        " now? This will replace your remaining scheduled route. Earned items and XP stay.")) return;
  hideQueuePlanner();
  showActivityScreen("root", null);
  const result = state.wagons.length
    ? requestActivityChange(state, kind, gameNow())
    : queueStartActivity(state, kind, null, gameNow());
  applyQueueChange(result, "Changing to " + ACTIVITIES[kind].title.toLowerCase() + " now.");
}

function planActivity(kind, untilLevelUp = false) {
  if (!state.wagons.length || state.wagons.some(w => w.activity === kind) ||
      state.wagons.length >= MAX_WAGONS) return;
  showActivityScreen("root", null);
  planningActivity = kind;
  ui.queueAmount.value = String(SCHEDULE_BALANCE.minDurationUnits);
  ui.queueUnit.value = untilLevelUp ? UNTIL_LEVEL_UP :
    (TIMING_PROFILE === "alpha" ? "minutes" : "hours");
  const previous = ACTIVITIES[state.wagons.at(-1).activity].title;
  ui.queuePlannerTitle.textContent = "How long should " + ACTIVITIES[kind].title + " run?";
  planningHint = state.wagons.length === 1
    ? ACTIVITIES[kind].title + " starts after the current work cycle and travel. " +
      previous + " resumes Forever afterwards."
    : ACTIVITIES[kind].title + " runs after " +
      ACTIVITIES[state.wagons[0].activity].title +
      " finishes. " + previous + " remains Forever.";
  updatePlanningMode();
  ui.queuePlanner.hidden = false;
}

function start() {
  let saved = null;
  let clockText = null;
  try {
    saved = localStorage.getItem(SAVE_KEY);
    clockText = localStorage.getItem(ALPHA_CLOCK_KEY);
  } catch { storageWorks = false; }
  state = saved ? readSave(saved) : null;
  alphaClock = state ? parseAlphaClock(clockText) : null;
  if (!state) {
    // Invalid/new character saves must not inherit an old acceleration clock.
    if (storageWorks) {
      try { localStorage.removeItem(ALPHA_CLOCK_KEY); } catch { storageWorks = false; }
    }
    state = newGame(Date.now());
    if (saved) message("The previous save could not be read; a new character was created.");
    else message("Choose an activity. Your character will work without further clicks.");
    writeSave();
  } else {
    const result = enterGame(state, gameNow());
    state = result.state;
    reportProgress(result);
    writeSave();
  }

  // Alpha actions are presented as three switches. Destructive reset and
  // one-day simulation act ONCE then automatically switch themselves off.
  // Only ×10 speed is a persistent on/off mode.
  ui.alphaReset.addEventListener("change", () => {
    if (!ui.alphaReset.checked) return;
    try {
      if (!window.confirm("RESET ALL PROGRESS?\\n\\nDelete this device's character, " +
        "all activity levels and XP, resources, attribute training, equipment, " +
        "enchantments and route. No undo. Skills restart at Lv 1; stats at 10.")) return;
      if (!storageWorks) {
        ui.alphaStatus.textContent="Reset unavailable: device storage is blocked.";
        return;
      }
      localStorage.removeItem(ALPHA_CLOCK_KEY);
      alphaClock=null;
      state=newGame(Date.now());
      latestWorkResult=null;
      lastCombatEventKey=null;
      lastArmourOptionsKey=null;
      lastWagonSignature=null;
      selectedEquipmentSlot="head";
      ui.enchantChanceBreakdown.hidden=true;
      ui.enchantChance.setAttribute("aria-expanded","false");
      ui.enchantFeedback.hidden=true;
      ui.masterAudience.hidden=true;
      hideQueuePlanner();
      showActivityScreen("root",null);
      writeSave();
      render();
      ui.alphaStatus.textContent="Progress reset. Skills Lv 1 · Attributes 10.";
    } catch {
      ui.alphaStatus.textContent="Reset could not be saved. Check device storage.";
    } finally {
      ui.alphaReset.checked=false;
    }
  });
  ui.alphaDay.addEventListener("click", () => {
    try {
      const realNow=Date.now();
      const advanced=advanceAlphaClock(alphaClock,realNow,ALPHA_DAY_MS);
      const result=enterGame(state,alphaTime(advanced,realNow));
      if (!persistAlphaClock(advanced)) return;
      state=result.state;
      reportProgress(result);
      writeSave();
      render();
      ui.alphaStatus.textContent="24 hours of idle activity simulated. No automatic level-ups.";
    } catch {
      ui.alphaStatus.textContent="Idle test could not complete. Save unchanged.";
    }
  });
  ui.alphaSpeed.addEventListener("change", () => {
    const newSpeed=ui.alphaSpeed.checked?10:1;
    try {
      const realNow=Date.now();
      const result=settle(state,gameNow());
      const nextClock=setAlphaSpeed(alphaClock,realNow,newSpeed);
      if (!persistAlphaClock(nextClock)) {
        ui.alphaSpeed.checked=alphaClock?.speed===10;
        return;
      }
      state=result.state;
      reportProgress(result);
      writeSave();
      render();
      ui.alphaStatus.textContent=newSpeed===10?
        "×10 activity speed ON — including movement, fighting and offline time.":
        "Normal activity speed restored.";
    } catch {
      ui.alphaSpeed.checked=alphaClock?.speed===10;
      ui.alphaStatus.textContent="Could not change testing speed.";
    }
  });
  ui.armourChoice.addEventListener("change", () => {
    // Hidden armour editor can never mutate a second slot while weapon editing.
    if (selectedEquipmentSlot === "weapon") return;
    const slot = ARMOUR_SLOT_BY_ID[selectedEquipmentSlot];
    const option = armourOption(slot.id, ui.armourChoice.value);
    if (!option || (state.armour[slot.id] !== option.id &&
      !armourUnlocked(effectiveAttributeProgress(state.attributeEffort,state.skills),slot.id,option.id))) {
      renderArmour();
      return;
    }
    const outcome = setArmourChoice(state,slot.id,option.id,gameNow());
    state = outcome.state;
    reportProgress(outcome);
    writeSave();
    render();
  });
  ui.enchantChance.addEventListener("click", () => {
    const expand=ui.enchantChanceBreakdown.hidden;
    ui.enchantChanceBreakdown.hidden=!expand;
    ui.enchantChance.setAttribute("aria-expanded",String(expand));
  });
  ui.enchantSelected.addEventListener("click", () => {
    // ONE current selection is the sole target. No stale weapon + armour
    // enchant controls or hidden edit state can spend a scroll elsewhere.
    const slot=selectedEquipmentSlot;
    const rank=state.enchantments[slot];
    if (state.items[GLORY_SCROLL_ID]<1 || rank>=GLORY_RULES.maxRank) return;
    const name=slot==="weapon" ?
      COMBAT_LOADOUTS[state.combatLoadout].name : ARMOUR_SLOT_BY_ID[slot].name;
    const effect=slot==="weapon"?"ATK":"DEF";
    const pct=Math.round(GLORY_RULES.enchantSuccessChance*100);
    if (!window.confirm("ENCHANT " + name.toUpperCase() +
      (rank>0?" +"+rank:"") + "?\\n\\nChance: " + pct + "%." +
      "\\nCost: 1 Glory Scroll." +
      "\\nSuccess: +" + (rank+1) + " " + effect + " on this slot." +
      "\\nFailure: this slot resets to +0 (lose " + rank +
        " existing rank" + (rank===1?"":"s") + ")." +
      "\\nOther slots remain unchanged. Continue?")) return;
    const result=enchantEquipmentSlot(state,slot,gameNow());
    state=result.state;
    reportProgress(result);
    const resultText = result.enchantment.success
      ? "SUCCESS · " + name + " is now +" + result.enchantment.rank +
        " " + effect
      : "FAILED · " + name + " enchant reset to +0";
    message("✧ " + resultText);
    ui.enchantFeedback.textContent=resultText;
    ui.enchantFeedback.setAttribute("data-outcome",
      result.enchantment.success?"success":"failure");
    ui.enchantFeedback.hidden=false;
    writeSave();
    render();
  });
  ui.saveName.addEventListener("click", () => {
    const chosen = ui.nameInput.value.trim().replace(/\s+/g, " ");
    if (!chosen || chosen.length > 40) {
      message("Name must contain 1–40 characters.");
      return;
    }
    state = { ...state, name: chosen };
    writeSave();
    render();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") returnToGame();
    else writeSave();
  });
  window.addEventListener("pagehide", writeSave);
  window.addEventListener("storage", event => {
    if (event.key === ALPHA_CLOCK_KEY) {
      alphaClock=parseAlphaClock(event.newValue);
      ui.alphaSpeed.checked=alphaClock?.speed===10;
    }
    if (event.key === SAVE_KEY) {
      const newer = readSave(event.newValue);
      if (newer) {
        state = newer;
        latestWorkResult = null; // another tab's loot cannot be asserted locally
        render();
        message("Save updated from another tab.");
      }
    }
  });
  render();
  window.setInterval(tick, 250);
}

start();
