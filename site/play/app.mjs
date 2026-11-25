import { characterStats } from "./character-stats.mjs?v=apprentice-a2";
import { MASTER_CONSENT_VERSION } from "./apprentice.mjs?v=apprentice-a2";
import { combatVerdict } from "./combat-verdict.mjs?v=alpha-gear-a5";
import { expertiseProgress,proficiency } from "./expertise.mjs?v=alpha-gear-a3";
import { GRADES as difficultyGrades, benchmark, arenaBenchmark, canSelectDifficulty } from "./difficulty.mjs?v=alpha-gear-a2";
import { ITEM_GRADES, ITEM_QUALITIES, STARTER_ITEM, equipmentBonuses, smithQuote, equipmentUnlockLevel } from "./smith.mjs?v=bal-002";
import {
  setDifficulty, buyEquipment, activateExpertise, arenaBoutProgress, SAVE_KEY, ACTIVITIES, ITEM_KEYS, ITEM_LABELS, ATTRIBUTES, ACTIVITY_STAT_WEIGHTS, allAttributeProgress,
  effectiveAttributeProgress, masteryAwardForNextLevel,
  lootChances, recipeOptions, newGame, chooseActivity, readSave, settle,
  enterGame, enterGameWithApprentice, setAutoMasterConsent, queueStartActivity, queueInsertTimedActivity, requestActivityChange,
  queueSetDuration, queueSwap, queueRemoveLast,
  getApprenticeProgress, queueCapacity, SCHEDULE_BALANCE, MINUTE_MS, HOUR_MS, DAY_MS, TIMING_PROFILE, UNTIL_LEVEL_UP,
  SAME_ZONE_TRAVEL_MS, ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS,
  xpToNextLevel, activityRewardCapped, skillMasterReadiness, skillMasterOffer, learnFromMaster, setCombatLoadout, setArmourChoice
} from "./engine.mjs?v=apprentice-a2";

import { combatAtTime, COMBAT_LOADOUTS, COMBAT_SKILLS, BOUT_MS } from "./combat.mjs?v=bal-002";
import { combatArtworkForEvent } from "./combat-art.mjs?v=alpha-art-001";
import { combatFlowState } from "./combat-flow.mjs?v=glad-003";
import { combatReadoutForEvent, workReadoutForReport } from "./result-readout.mjs?v=alpha-gear-a5";
import { ARMOUR_SLOTS, ARMOUR_SLOT_BY_ID, ARMOUR_CHOICES,
  armourOption, armourStats, dodgeChance }
  from "./armour.mjs?v=bal-002";
import { ALPHA_CLOCK_KEY, ALPHA_DAY_MS, alphaTime, parseAlphaClock,
  setAlphaSpeed, advanceAlphaClock, ALPHA_TOOLS_ENABLED, alphaMaxStats, alphaGrantCoins } from "./alpha-tools.mjs?v=apprentice-a2";
const $ = id => document.getElementById(id);
const ui = {
  playerName: $("character-heading"), nameInput: $("nameInput"), saveName: $("saveName"),
  characterAttributes: $("characterAttributes"),
  weaponSlots: $("weaponSlots"), combatSkillsText: $("combatSkillsText"),
  armourSlots: $("armourSlots"), armourChoice: $("armourChoice"),
  armourEditor: $("armourEditor"),
  equipmentEditHeading: $("equipmentEditHeading"), gearStats: $("gearStats"), expertiseStats:$("expertiseStats"),
  coinWallet: $("coinWallet"), itemGrade: $("itemGrade"), itemQuality: $("itemQuality"),
  smithBuy: $("smithBuy"), smithEquip: $("smithEquip"), smithStatus: $("smithStatus"),
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
  combatTurns: $("combatTurns"),
  combatFlow: $("combatFlow"), combatFlowMeter: $("combatFlowMeter"), combatFlowFill: $("combatFlowFill"),
  combatFlowSteps: Array.from({length:5},(_,i)=>$("combatFlowStep"+i)),
  combatFlowIcons: Array.from({length:5},(_,i)=>$("combatFlowIcon"+i)),
  combatFlowLabels: Array.from({length:5},(_,i)=>$("combatFlowLabel"+i)),
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
  alphaTools:$("alphaTools"), alphaMax:$("alphaMaxStats"), alphaCoins:$("alphaCoins"),
  alphaFamily:$("alphaFamily"), alphaStatus: $("alphaStatus")
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
let selectedEquipmentSlot = "head";
let selectedFamily = "padded";
const weaponButtons = new Map();
const armourButtons = new Map();
const titleCase = value => value[0].toUpperCase() + value.slice(1);

function addOption(select, value, label) {
  const option = document.createElement("option");
  option.value = String(value);
  option.textContent = label;
  select.append(option);
}

function shopTarget() {
  return selectedEquipmentSlot === "weapon" ? state.combatLoadout :
    selectedFamily === "none" ? null : selectedEquipmentSlot + ":" + selectedFamily;
}

function resetSmithSelection() {
  const item = state.equipment[shopTarget()] ?? STARTER_ITEM;
  ui.itemGrade.value = String(item.grade);
  ui.itemQuality.value = item.quality;
  ui.smithStatus.textContent = "";
}

function equipmentButton(parent, label, className, activate) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", activate);
  parent.append(button);
  return button;
}

for (const [id, loadout] of Object.entries(COMBAT_LOADOUTS)) {
  const button = equipmentButton(ui.weaponSlots, loadout.name, "weapon-slot", () => {
    const result = setCombatLoadout(state, id, gameNow());
    state = result.state;
    selectedEquipmentSlot = "weapon";
    resetSmithSelection();
    reportProgress(result);
    writeSave();
    render();
  });
  button.setAttribute("data-loadout", id);
  weaponButtons.set(id, button);
}
for (const slot of ARMOUR_SLOTS) {
  const button = equipmentButton(ui.armourSlots, slot.name, "armour-slot", () => {
    selectedEquipmentSlot = slot.id;
    selectedFamily = state.armour[slot.id];
    resetSmithSelection();
    render();
  });
  button.setAttribute("data-slot", slot.id);
  armourButtons.set(slot.id, button);
}
for (const { id, name } of ARMOUR_CHOICES.head) addOption(ui.armourChoice, id, name);
ITEM_GRADES.forEach((grade, index) => addOption(ui.itemGrade, index,
  index ? grade + " · Fighting " + equipmentUnlockLevel(index) : grade));
ITEM_QUALITIES.forEach(quality => addOption(ui.itemQuality, quality, titleCase(quality)));
const selectedSpec = () => ({ grade: Number(ui.itemGrade.value), quality: ui.itemQuality.value });

function renderArmour() {
  const slot = ARMOUR_SLOT_BY_ID[selectedEquipmentSlot];
  const id = shopTarget();
  const item = state.equipment[id];
  const quote = id ? smithQuote(state, id, selectedSpec()) : null;
  const name = slot ? slot.name : COMBAT_LOADOUTS[state.combatLoadout].name;
  ui.equipmentEditHeading.textContent = name + (item ?
    " · " + ITEM_GRADES[item.grade] + " " + titleCase(item.quality) : "");
  ui.armourEditor.hidden = !slot;
  ui.armourChoice.value = selectedFamily;
  ui.itemGrade.disabled = !id;
  ui.itemQuality.disabled = !id;
  ui.smithBuy.disabled = !quote?.available;
  const quotedCost=quote?.cost ? number(quote.cost) + " coins" : "";
  ui.smithBuy.textContent = quote?.reason==="fighting_level" ?
    "Fighting " + quote.requiredFightingLevel + " required · " + quotedCost :
    quote?.reason==="coins" ? "Need " + quotedCost :
    quote?.available ? (item ? "Improve" : "Buy and equip") + " · " + quotedCost :
    "Choose an improvement";
  ui.smithEquip.hidden = !slot || (id && !item);
  ui.smithEquip.disabled = !slot || state.armour[slot.id] === selectedFamily;
  ui.smithEquip.textContent = selectedFamily === "none" ? "Unequip" : "Equip owned armour";
  ui.coinWallet.textContent = number(state.coins) + " coins";

  const track=slot?selectedFamily:state.combatLoadout;
  const practice=expertiseProgress(state.expertise[track]);
  const effectiveness=proficiency(state.expertiseActive[track],id?selectedSpec().grade:0);
  ui.expertiseStats.textContent=(slot?(track==="none"?"Unarmoured":titleCase(track)):COMBAT_LOADOUTS[track].name)+
    " expertise · "+practice.hours.toFixed(1)+" h · "+ITEM_GRADES[practice.rank]+
    (practice.nextHours===null?" mastered":" · Next "+ITEM_GRADES[practice.rank+1]+": "+number(practice.nextHours)+" h")+
    (id?" · Selected gear bonus "+Math.round(effectiveness*100)+"% (−"+Math.round((1-effectiveness)*100)+"% penalty)":"")+
    " · Applies next bout";
  const gear = armourStats(state.armour, state.combatLoadout);
  const bonus = equipmentBonuses(state);
  ui.gearStats.textContent = gear.totalKg + " kg · Move " + Math.min(100,Math.round(gear.mobilityPct+bonus.mobility)) +
    "% · Base armour " + gear.physicalReductionPct + "% · Attack +" + bonus.attack +
    " ×" + bonus.damageMultiplier.toFixed(2) + " · Guard +" + bonus.defense +
    " · Resistance +" + Math.round(bonus.resistance*100) + "% · Aim +" + Math.round(bonus.accuracy*100) +
    "% · Pierce +" + Math.round(bonus.penetration*100) + "% · Dodge " + Math.round(dodgeChance(Math.min(100,gear.mobilityPct+bonus.mobility),bonus.dodge)*100) + "%";
  for (const [style, button] of weaponButtons) {
    button.setAttribute("data-equipped", String(style === state.combatLoadout));
    button.setAttribute("aria-pressed", String(!slot && style === state.combatLoadout));
  }
  for (const part of ARMOUR_SLOTS) {
    const button = armourButtons.get(part.id);
    button.textContent = part.name + " · " + armourOption(part.id, state.armour[part.id]).name;
    button.setAttribute("aria-pressed", String(part.id === selectedEquipmentSlot));
  }
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
let lastStoredText = null;
let autoLoginSupported = false;
let planningActivity = null;
let planningHint = "";
let lastWagonSignature = null;
const wagonSkillLabels = new Map();
let currentScheduledMeter = null;
let currentScheduledFill = null;
let lastCombatEventKey = null;

const CATEGORY_LABELS = Object.freeze({
  combat: "Combat", craft: "Survival Work"
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
  const difficulty = document.createElement("select");
  difficulty.setAttribute("aria-label", task.title + " difficulty");
  difficulty.className = "activity-difficulty";
  difficultyGrades.forEach((grade,tier) => {
    const option = document.createElement("option");
    option.value = String(tier);
    const target=id==="fighting"?arenaBenchmark(tier):benchmark(tier);
    option.textContent = tier ? grade + (id === "fighting" ? " · Target skill " : " · Requires level ") + target.skill + " · Target stat " + target.stat : "0 · Non-grade";
    difficulty.append(option);
  });
  difficulty.addEventListener("change", () => {
    const result = setDifficulty(state,id,Number(difficulty.value),gameNow());
    state = result.state;
    reportProgress(result);
    writeSave();
    render();
  });
  body.append(titleRow, detail, rank, statGains, difficulty);
  row.append(body);
  activityRewardLabels.set(id, detail);
  activityLevelLabels.set(id, rank);
  categoryActivities.get(task.category === "training" ? "combat" : task.category).push(row);
  activityButtons.set(id, { row, startButton, queueButton, levelButton, difficulty });
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

// Reject writes based on a snapshot we already know has been superseded.
// Browser storage is still not an authoritative multi-client database.
function persistState(next) {
  if (!storageWorks) return false;
  try {
    const actual = localStorage.getItem(SAVE_KEY);
    if (actual !== lastStoredText) {
      const newer = readSave(actual);
      if (newer) {
        state = newer;
        lastStoredText = actual;
        latestWorkResult = null;
        $("apprenticeMasterReport").hidden = true;
        message("Save updated in another tab. Please retry your action.");
      } else {
        storageWorks = false;
        ui.saveStatus.textContent = "Save changed elsewhere";
      }
      return false;
    }
    const serialized = JSON.stringify(next);
    localStorage.setItem(SAVE_KEY, serialized);
    lastStoredText = serialized;
    ui.saveStatus.textContent = "Saved on this device";
    lastSavedAt = Date.now();
    return true;
  } catch {
    storageWorks = false;
    ui.saveStatus.textContent = "Save unavailable";
    ui.saveStatus.title = "Your browser is blocking local storage; progress may be lost when you close this tab.";
    return false;
  }
}
function writeSave() { return persistState(state); }

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

function renderVitals(side,current,previous,recovering) {
  const labels=[["HP","Health",current.hp,current.maxHP],["Armour","Armour",current.armour,current.maxArmour]];
  for(const [key,name,end,max] of labels) {
    const value=recovering?max:end;
    $(side+key).max=Math.max(1,max);
    $(side+key).value=value;
    $(side+key+"Text").textContent=name+" "+value+"/"+max+(recovering && value>end?" (+"+(value-end)+")":"");
  }
  const changes=[];
  for(const [key,label] of [["weapon","Weapon"],["shield","Shield"]]) {
    const max=current[key+"Max"];
    if(!max) continue;
    const diff=recovering?max-current[key]:current[key]-(previous?.[key]??current[key]);
    if(diff) changes.push(label+" "+(diff>0?"+":"")+diff+" · "+(recovering?max:current[key])+"/"+max);
  }
  $(side+"Wear").textContent=changes.join(" / ");
}
function renderResults(combat, revealed, recovering) {
  ui.resultCombat.hidden = !combat;
  ui.resultWork.hidden = Boolean(combat);
  if (combat) {
    // Before actual rolls resolve, retain ONLY the previous known result.
    const actualEvent = revealed ? combat.event :
      combat.events[combat.step - 1];
    const visibleIndex=Math.max(0,combat.step-(revealed?0:1));
    for(const side of ["player","enemy"])
      renderVitals(side,combat.events[visibleIndex].vitals[side],combat.events[visibleIndex-1]?.vitals[side],recovering);
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
    if (!report?.completed && !report?.gainedCoins) continue;
    if (report.gainedCoins) message("Arena winnings: +" + number(report.gainedCoins) + " coins");
    const result = workReadoutForReport(report, ITEM_LABELS, ACTIVITIES);
    if (result) {
      latestWorkResult = result;
      if (!report.gainedCoins) ui.resultNotice.textContent = "";
    }
    gained = true;
  }
  if (outcome.offlineArena?.bouts) {
    const { bouts, victories, coins } = outcome.offlineArena;
    message("Offline arena estimate: " + number(victories) + " wins in " + number(bouts) +
      " bouts · +" + number(coins) + " coins");
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
  ui.wagonList.style.gridTemplateColumns = "repeat(" + Math.max(1, Math.min(3, wagons.length)) +
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
          ? " progress toward full XP" : " work period progress"));
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
      ? " Stops at the full XP bar. Claim the level with the Skill Master yourself."
      : "");
  ui.queueConfirm.textContent = untilReady
    ? (state.wagons.length === 1 ? "Start until ↑ LvL Up" : "Add until ↑ LvL Up")
    : (state.wagons.length === 1 ? "Start for this time" : "Add timed task");
}
ui.queueUnit.addEventListener("change", updatePlanningMode);
ui.queueCancel.addEventListener("click", () => hideQueuePlanner());
ui.queueConfirm.addEventListener("click", () => {
  if (!planningActivity) return;
  if (state.wagons.length >= queueCapacity(state)) { hideQueuePlanner(); return; }
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

let previousStatsMarkup="";
function renderCharacterStats(){
  if(!$("characterStatsPanel").open)return;
  const model=characterStats(state),signature=JSON.stringify(model);
  if(signature===previousStatsMarkup)return;
  previousStatsMarkup=signature;
  $("characterStatsNotice").textContent=model.notice;
  const host=$("characterStatsBreakdown");
  const expanded=new Set(Array.from(host.querySelectorAll("details[data-stat-key][open]"),el=>el.dataset.statKey));
  const groups=[];
  let currentGroup;
  for(const section of model.overview){
    if(section.group!==currentGroup){
      currentGroup=section.group;
      const heading=document.createElement("h3");heading.className="stat-overview-heading";heading.textContent=currentGroup;groups.push(heading);
    }
    const group=document.createElement("details");group.className="stat-breakdown-group";group.dataset.statKey=section.key;
    group.open=expanded.has(section.key);
    const title=document.createElement("summary");title.className="stat-overview-summary";
    const labels=document.createElement("span"),name=document.createElement("span"),value=document.createElement("strong");
    name.textContent=section.title;labels.append(name);
    if(section.subtitle){const sub=document.createElement("small");sub.textContent=section.subtitle;labels.append(sub);}
    value.textContent=section.summary;
    if(section.summary.startsWith("−"))value.className="stat-negative";
    title.append(labels,value);group.append(title);
    const body=document.createElement("div");body.className="stat-overview-sources";
    for(const {label,value} of section.rows){
      const line=document.createElement("div");line.className="stat-breakdown-line";
      const name=document.createElement("span"),amount=document.createElement("strong");
      name.textContent=label;amount.textContent=value;
      if(value.startsWith("−"))amount.className="stat-negative";
      line.append(name,amount);body.append(line);
    }
    if(section.note){const note=document.createElement("p");note.className="stat-breakdown-note";note.textContent=section.note;body.append(note);}
    group.append(body);groups.push(group);
  }
  $("characterStatsBreakdown").replaceChildren(...groups);
}
$("characterStatsPanel").addEventListener("toggle",()=>{if(state)renderCharacterStats();});
function renderApprentice() {
  const progress = getApprenticeProgress(state);
  const used = state.wagons.length;
  $("apprenticeLevel").textContent = number(progress.earnedLevels) + " earned levels";
  $("apprenticeSlots").textContent = number(progress.slots) + " / 5 activity slots unlocked";
  $("apprenticeNext").textContent = progress.nextSlotAt === null
    ? "All activity slots unlocked."
    : "Next activity slot unlocks at LvL " + number(progress.nextSlotAt) + ".";
  const autoMaster = $("apprenticeAutoMaster");
  autoMaster.checked = state.apprenticeMasterConsent === MASTER_CONSENT_VERSION;
  autoMaster.disabled = !progress.autoMasterUnlocked || !storageWorks || !autoLoginSupported;
  $("apprenticeMaster").textContent = !progress.autoMasterUnlocked
    ? "Unlocks at LvL " + number(progress.autoMasterAt)
    : !autoLoginSupported || !storageWorks
      ? "Unavailable · This browser requires safe local save and login coordination."
      : autoMaster.checked
        ? "Enabled · On next login, advance ready skills and pay their full tribute."
        : "Optional · On login, advance ready skills and surrender ALL their produced resources.";
  $("apprenticeLegacy").hidden = used <= progress.slots;
  $("queueUnlockHint").textContent = progress.nextSlotAt === null
    ? "All activity slots unlocked."
    : "Activity slots: " + progress.slots + " · Next unlock at LvL " + progress.nextSlotAt;
}

function render() {
  renderApprentice();
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
  renderCharacterStats();
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
          return readiness.ready ? 100 : Math.min(99, ratio);
        })()
      : 100 * state.productiveElapsedMs / wagon.plannedMs;
    const clamped = Math.max(0, Math.min(100, progress));
    currentScheduledFill.style.width = clamped.toFixed(2) + "%";
    currentScheduledMeter.setAttribute("aria-valuenow", String(Math.round(clamped)));
    currentScheduledMeter.hidden = Boolean(state.transition);
  }
  for (const [id, { row, startButton, queueButton, levelButton, difficulty }] of activityButtons) {
    const skill = state.skills[id];
    Array.from(difficulty.children).forEach((option,tier) => { option.disabled = !canSelectDifficulty(id,skill.level,tier); });
    difficulty.value = String(state.difficulties[id] ?? 0);
    activityLevelLabels.get(id).textContent = "Skill level " + number(skill.level) +
      (skill.xp >= xpToNextLevel(skill.level) ? " · Rewards paused" : "");
    const available = lootChances(id, skill.level);
    const recipes = recipeOptions(id, skill.level);
    activityRewardLabels.get(id).textContent = recipes.length
      ? [...new Set(recipes.map(t => `${t.label} (uses ${t.inputs.map(id => ITEM_LABELS[id]).join(" + ")})`))].join(" · ")
      : available.length ? available.map(t => t.label).join(" · ")
      : ACTIVITIES[id].itemLabel;
    const workingHere = state.activity === id && (!transition || transition.phase === "finishing");
    const destination = transition?.targetActivity === id;
    row.classList.toggle("active", workingHere);
    row.classList.toggle("pending", destination);
    const queuedIndex = state.wagons.findIndex(w => w.activity === id);
    const queueFull = state.wagons.length >= queueCapacity(state);
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
      ? "XP full · All rewards paused · Seek the Skill Master"
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
    const arenaFinishing=transition.phase==="finishing"&&state.activity==="fighting";
    const phaseLength = transition.phase === "finishing" ? (arenaFinishing?BOUT_MS:ACTIVITIES[state.activity].durationMs) :
      transition.phase === "moving"
      ? (ACTIVITIES[state.activity].zone === ACTIVITIES[transition.targetActivity].zone
        ? SAME_ZONE_TRAVEL_MS : ZONE_TRAVEL_MS)
      : (state.activity ? PREPARATION_MS : INITIAL_PREPARATION_MS);
    const phaseElapsed = transition.phase === "finishing" ? (arenaFinishing?arenaBoutProgress(state)*BOUT_MS:state.progressMs) : transition.phaseProgressMs;
    const percent = Math.min(100, 100 * phaseElapsed / phaseLength);
    ui.transitionFill.style.width = percent.toFixed(2) + "%";
    ui.transitionProgress.setAttribute("aria-valuenow", String(Math.round(percent)));
    ui.transitionProgress.setAttribute("aria-label", phaseName);
  }
  const capped=activityRewardCapped(state);
  const combat = current?.category === "combat" && !transition && !capped
    ? combatAtTime(state.combatSession) : null;
  ui.activityProgress.hidden = Boolean(transition || capped || current?.category === "combat");
  ui.combatPanel.hidden = !combat;
  const flow=combat ? combatFlowState(combat,state.combatSession) : null;
  showCombatFlow(flow);
  let imageEvent = null;
  let combatRevealed = false;
  if (combat) {
    const event = combat.event;
    combatRevealed = true;
    imageEvent = event;
    ui.combatTurns.textContent = combat.recovering
      ? (combat.playerHP === 0 ? "Resurrection and return" : "Arena recovery")
      : event.distance;
    const action = event.move ?? event.type;
    const verdict=combatVerdict(event);
    const status = verdict?.label ?? (event.type === "finisher" ? "Decisive hit" : action.replaceAll("_", " "));
    ui.combatEventTitle.textContent = "DUEL " + number(combat.bout) + " · " +
      (event.actor === "player" ? "You · " : event.actor === "enemy" ? "Opponent · " : "") + status;
    const { positioning, terrain } = combat;
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const showRoll = dice => dice.map(face => faces[face - 1]).join(" ");
    const beforeMoves = event.type === "engage";
    $("arenaPositioning").hidden = !beforeMoves;
    $("playerPositioning").textContent = "You " + showRoll(positioning.playerDice) + " · " + positioning.playerTotal;
    $("enemyPositioning").textContent = "Opponent " + showRoll(positioning.enemyDice) + " · " + positioning.enemyTotal;
    $("positioningResult").textContent = !positioning.higher ? "Tied roll · neutral selection" :
      (positioning.higher === "player" ? "Your higher roll favoured your arena preference" :
        "The opponent's higher roll favoured their arena preference");
    ui.combatPanel.setAttribute("data-arena", terrain.id);
    $("combatGround").textContent = difficultyGrades[state.combatSession.player.difficulty ?? 0] + " · " +
      terrain.name + " · " + terrain.detail;
    ui.combatPanel.classList.toggle("finisher", event.type === "finisher");
    const broken = event.broken?.join(", ");
    const key = state.combatSession.seed + ":" + combat.bout + ":" + combat.step;
    if (key !== lastCombatEventKey) {
      if (broken) message("Broken equipment: " + broken);
      else if (!/^(Arena winnings:|Offline arena estimate:)/.test(ui.resultNotice.textContent)) ui.resultNotice.textContent = "";
      lastCombatEventKey = key;
    }
  } else {
    lastCombatEventKey = null;
    ui.combatTurns.textContent = "";
  }
  renderResults(combat, combatRevealed, false);
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
      : capped ? "All rewards paused: this skill has a full XP bar. Visit the Skill Master to resume, or choose another activity." : sceneActivity.description;
    // Every live turn selects its actual combat event / attacker weapon /
    // defender shield / player outcome. Other activities retain static art.
    const sceneId = transition ? transition.targetActivity : state.activity;
    const combatArt = imageEvent ? combatArtworkForEvent(
      imageEvent, state.combatSession.player.loadout, combat.enemyLoadout) : null;
    const sceneAsset = ({ foraging: "gathering", smithing: "smelting",
      construction: "masonry", farming: "gathering", training: "masonry" })[sceneId] ?? sceneId;
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
      const percentage = capped ? 0 : Math.min(100, 100 * state.progressMs / sceneActivity.durationMs);
      ui.actionFill.style.width = percentage.toFixed(2) + "%";
      ui.activityProgress.setAttribute("aria-valuenow", String(Math.round(percentage)));
    }
  }
}

function tick() {
  if (document.visibilityState === "hidden") return;
  const before = state.transition;
  const result = settle(state, gameNow());
  state = activateExpertise(result.state);
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

// Only genuinely new or explicitly reset characters start in the arena.
function newStartingCharacter(now) {
  return chooseActivity(newGame(now), "fighting", now).state;
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
      state.wagons.length >= queueCapacity(state)) return;
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

function showApprenticeMasterReport(result) {
  const target = $("apprenticeMasterReport");
  const levels = result.mastery.ready.map(id => ACTIVITIES[id].title + " LvL " + number(result.state.skills[id].level));
  const tribute = Object.entries(result.mastery.tribute).map(([id, qty]) => number(qty) + " " + ITEM_LABELS[id]);
  target.textContent = "Apprentice advanced: " + levels.join(", ") + ". Tribute: " +
    (tribute.length ? tribute.join(", ") : "no materials") + ".";
  target.hidden = false;
  message(target.textContent);
}

function start(coordinatedLogin = false) {
  autoLoginSupported = coordinatedLogin;
  let saved = null;
  let clockText = null;
  try {
    saved = localStorage.getItem(SAVE_KEY);
    lastStoredText = saved;
    clockText = localStorage.getItem(ALPHA_CLOCK_KEY);
  } catch { storageWorks = false; }
  state = saved ? readSave(saved) : null;
  alphaClock = state ? parseAlphaClock(clockText) : null;
  // A normal-timing build cannot run the testing clock at accelerated speed.
  // Preserve the existing logical offset at 1x for a current-build save.
  if(!ALPHA_TOOLS_ENABLED&&alphaClock)alphaClock=setAlphaSpeed(alphaClock,Date.now(),1);
  ui.alphaTools.hidden=!ALPHA_TOOLS_ENABLED;
  ui.alphaFamily.value="plate";
  if (!state) {
    // Invalid/new character saves must not inherit an old acceleration clock.
    if (storageWorks) {
      try { localStorage.removeItem(ALPHA_CLOCK_KEY); } catch { storageWorks = false; }
    }
    state = newStartingCharacter(Date.now());
    if (saved) $("saveResetNotice").hidden=false;
    else message("Your first arena fight has begun. Fighting continues automatically.");
    writeSave();
  } else {
    const now = gameNow();
    const result = autoLoginSupported && storageWorks
      ? enterGameWithApprentice(state, now)
      : enterGame(state, now);
    if (result.mastery) {
      // No success notification or applied sacrifice until the new save is committed.
      if (persistState(result.state)) {
        state = result.state;
        reportProgress(result);
        showApprenticeMasterReport(result);
      } else {
        const ordinary = enterGame(state, now);
        state = ordinary.state;
        reportProgress(ordinary);
        writeSave();
        message("Apprentice skipped: automatic advancement could not be safely saved.");
      }
    } else {
      state = result.state;
      reportProgress(result);
      writeSave();
    }
  }

  $("apprenticeAutoMaster").addEventListener("change", () => {
    const control = $("apprenticeAutoMaster");
    if (control.disabled) { render(); return; }
    const enabled = control.checked;
    if (enabled && !window.confirm("AUTOMATIC SKILL MASTER\n\nOn future game entries, advance every ready skill once and surrender ALL owned resources produced by those skills. Coins and unrelated materials remain. No additional confirmation each login. Enable?")) {
      render(); return;
    }
    try {
      const next = setAutoMasterConsent(state, enabled);
      if (persistState(next)) {
        state = next;
        message(enabled ? "Apprentice enabled for future logins." : "Automatic Skill Master disabled.");
      }
    } catch { message("Automatic Skill Master is unavailable."); }
    render();
  });

  $("dismissSaveReset").addEventListener("click",()=>{$("saveResetNotice").hidden=true;});
  // All alpha controls are visibly local test actions, absent in normal mode.
  // Only ×10 speed is a persistent on/off mode.
  if(ALPHA_TOOLS_ENABLED){
  const applyTest=(action,description)=>{
    if(!storageWorks){ui.alphaStatus.textContent="Alpha test unavailable: device storage is blocked.";return;}
    try{
      const result=action();
      // Persist before replacing live state, so a failed write cannot report success.
      if (!persistState(result.state)) { ui.alphaStatus.textContent="Alpha test could not be saved.";render();return; }
      state=result.state;
      lastSavedAt=Date.now();
      ui.saveStatus.textContent="Saved on this device";
      latestWorkResult=null;
      lastCombatEventKey=null;
      ui.masterAudience.hidden=true;
      reportProgress(result);
      render();
      ui.alphaStatus.textContent=description;
    }catch{ui.alphaStatus.textContent="Alpha test could not complete or be saved.";}
  };
  ui.alphaMax.addEventListener("click",()=>{
    const weapon=COMBAT_LOADOUTS[state.combatLoadout].name;
    const family=ui.alphaFamily.value;
    applyTest(()=>alphaMaxStats(state,family,gameNow()),
      "TEST ONLY · Six-month benchmark applied: "+weapon+" + "+family+". Fighting Lv 52 minimum; no free gear or coins.");
  });
  ui.alphaCoins.addEventListener("click",()=>applyTest(()=>alphaGrantCoins(state,gameNow()),
    "TEST ONLY · Added 100,000 arena coins."));
  ui.alphaReset.addEventListener("change", () => {
    if (!ui.alphaReset.checked) return;
    try {
      if (!window.confirm("RESET ALL PROGRESS?\\n\\nDelete this device's character, " +
        "all activity levels and XP, resources, attribute training, equipment, " +
        "coins and route. No undo. Skills restart at Lv 1; stats at 10.")) return;
      if (!storageWorks) {
        ui.alphaStatus.textContent="Reset unavailable: device storage is blocked.";
        return;
      }
      localStorage.removeItem(ALPHA_CLOCK_KEY);
      alphaClock=null;
      state=newStartingCharacter(Date.now());
      $("apprenticeMasterReport").hidden=true;
      latestWorkResult=null;
      lastCombatEventKey=null;
      lastWagonSignature=null;
      selectedEquipmentSlot = "head";
      selectedFamily = "padded";
      resetSmithSelection();
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
  }
  resetSmithSelection();
  ui.armourChoice.addEventListener("change", () => {
    if (!armourOption(selectedEquipmentSlot, ui.armourChoice.value)) return;
    selectedFamily = ui.armourChoice.value;
    resetSmithSelection();
    renderArmour();
  });
  ui.itemGrade.addEventListener("change", renderArmour);
  ui.itemQuality.addEventListener("change", renderArmour);
  ui.smithEquip.addEventListener("click", () => {
    if (ui.smithEquip.disabled) return;
    const result = setArmourChoice(state, selectedEquipmentSlot, selectedFamily, gameNow());
    state = result.state;
    reportProgress(result);
    writeSave();
    render();
  });
  ui.smithBuy.addEventListener("click", () => {
    if (ui.smithBuy.disabled) return;
    const result = buyEquipment(state, shopTarget(), selectedSpec(), gameNow());
    state = result.state;
    reportProgress(result);
    ui.smithStatus.textContent = result.purchased ? "Equipment ready." : "Purchase unavailable.";
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
    if (event.key === ALPHA_CLOCK_KEY && ALPHA_TOOLS_ENABLED) {
      alphaClock=parseAlphaClock(event.newValue);
      ui.alphaSpeed.checked=alphaClock?.speed===10;
    }
    if (event.key === SAVE_KEY) {
      let current;
      try { current = localStorage.getItem(SAVE_KEY); } catch { storageWorks=false;return; }
      const newer = readSave(current);
      if (newer) {
        state = newer;
        lastStoredText = current;
        $("apprenticeMasterReport").hidden=true;
        latestWorkResult = null; // another tab's loot cannot be asserted locally
        render();
        message("Save updated from another tab.");
      }
    }
  });
  render();
  window.setInterval(tick, 250);
}

// Serialize page-entry chores between cooperating tabs. Without Web Locks,
// normal manual play is still available; destructive automatic claims stay off.
if (globalThis.navigator?.locks?.request) {
  let began = false;
  navigator.locks.request("long-vigil-login", () => { began = true; start(true); })
    .catch(error => { if (!began) start(false); else throw error; });
} else start(false);
