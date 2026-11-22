import {
  SAVE_KEY, ACTIVITIES, ITEM_KEYS, ITEM_LABELS, ATTRIBUTES, ACTIVITY_STAT_WEIGHTS, allAttributeProgress,
  lootChances, recipeOptions, newGame, readSave, settle,
  enterGame, queueStartActivity, queueInsertTimedActivity, requestActivityChange,
  queueSetDuration, queueSwap, queueRemoveLast,
  MAX_WAGONS, SCHEDULE_BALANCE, MINUTE_MS, HOUR_MS, DAY_MS, TIMING_PROFILE, UNTIL_LEVEL_UP,
  SAME_ZONE_TRAVEL_MS, ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS,
  xpToNextLevel, skillMasterReadiness, skillMasterOffer, learnFromMaster, setCombatLoadout
} from "./engine.mjs?v=20261122-compact1";

import { combatAtTime, COMBAT_LOADOUTS, COMBAT_SKILLS } from "./combat.mjs?v=20261122-combat-scenes1";
import { combatArtworkForEvent } from "./combat-art.mjs?v=20261122-combat-scenes1";
const $ = id => document.getElementById(id);
const ui = {
  playerName: $("character-heading"), nameInput: $("nameInput"), saveName: $("saveName"),
  characterAttributes: $("characterAttributes"),
  combatLoadout: $("combatLoadout"), combatSkillsText: $("combatSkillsText"),
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
  combatDice: $("combatDice"),
  heading: $("scene-heading"), description: $("activityDescription"), actionFill: $("actionFill"),
  activityProgress: $("activityProgress"), transitionStatus: $("transitionStatus"),
  transitionPhase: $("transitionPhase"), transitionProgress: $("transitionProgress"), transitionFill: $("transitionFill"),
  wagonQueue: $("wagonQueue"), wagonList: $("wagonList"),
  queuePlanner: $("queuePlanner"), queuePlannerTitle: $("queuePlannerTitle"),
  queuePlannerHint: $("queuePlannerHint"), queueAmountLabel: $("queueAmountLabel"),
  queueAmount: $("queueAmount"), queueUnit: $("queueUnit"),
  queueConfirm: $("queueConfirm"), queueCancel: $("queueCancel"),
  logList: $("logList"),
  banner: $("sceneBanner"), saveStatus: $("saveStatus")
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
for (const loadout of Object.values(COMBAT_LOADOUTS)) {
  const option = document.createElement("option");
  option.value = loadout.id;
  option.textContent = loadout.name;
  ui.combatLoadout.append(option);
}
// Combat descriptions, actual rolled values and numeric damage belong ONLY
// in the Chronicle. The image panel is a cinematic illustration + short label.
export function combatChronicleLine(event) {
  const parts = [event.text];
  if (event.attackRoll !== undefined) {
    parts.push("ATK " + (Math.floor(event.attackRoll * 100) + 1));
    parts.push(event.defenseRoll === null ? "DEF —" :
      "DEF " + (Math.floor(event.defenseRoll * 100) + 1));
  }
  if (event.dice && event.type !== "finisher")
    parts.push("SKULLS " + event.dice.join("–"));
  return parts.join(" · ");
}
const messages = [];
let state;
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
  messages.unshift(text);
  if (messages.length > 7) messages.length = 7;
  ui.logList.replaceChildren(...messages.map(line => {
    const item = document.createElement("li");
    item.textContent = line;
    return item;
  }));
}

function lootSummary(report) {
  if (!report || !report.activity) return "No new resources collected.";
  if (report.activity === "fighting") return ""; // Real combat steps own the chronicle.
  if (ACTIVITIES[report.activity].item === null)
    return report.completed ? "Practised " + ACTIVITIES[report.activity].title.toLowerCase() + "." : "";
  if (!report.gainedItems) return "No new resources collected.";
  const amounts = report.items ?? { [report.item]: report.gainedItems };
  const found = Object.entries(amounts)
    .filter(([, amount]) => amount > 0)
    .map(([item, amount]) => number(amount) + " " + ITEM_LABELS[item].toLowerCase());
  return found.length ? "You gathered " + found.join(", ") + "." : "No new resources collected.";
}

function reportProgress(outcome) {
  if (!outcome) return false;
  let gained = false;
  for (const report of outcome.reports ?? [outcome.report ?? outcome]) {
    if (!report?.completed) continue;
    const summary = lootSummary(report);
    if (summary) message(summary);
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
        applyQueueChange(queueSetDuration(state, i, UNTIL_LEVEL_UP, Date.now()),
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
        applyQueueChange(queueSetDuration(state, i, plan, Date.now()),
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
      () => applyQueueChange(queueSwap(state, i - 1, Date.now()), "Route rearranged."));
    if (i < wagons.length - 1) control("→", "Move " + ACTIVITIES[wagon.activity].title + " later",
      () => applyQueueChange(queueSwap(state, i, Date.now()), "Route rearranged."));
    if (i === wagons.length - 1 && i > 0) control("Remove", "Remove final future hourglass",
      () => applyQueueChange(queueRemoveLast(state, Date.now()), "Future hourglass removed."));
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
  applyQueueChange(queueInsertTimedActivity(state, task, plan, Date.now()),
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
    item.textContent = ACTIVITIES[id].title + ": Level " + number(state.skills[id].level) +
      " → " + number(state.skills[id].level + 1);
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
  const outcome = settle(state, Date.now());
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
    " risen. Your next lesson begins.");
  writeSave();
  render();
});

function render() {
  const current = state.activity ? ACTIVITIES[state.activity] : null;
  ui.combatLoadout.value = state.combatLoadout;
  const chosen = COMBAT_LOADOUTS[state.combatLoadout];
  ui.combatSkillsText.textContent = "Attack: " +
    COMBAT_SKILLS[chosen.attackSkill].name + " · Defense: " +
    COMBAT_SKILLS[chosen.defenseSkill].name;
  ui.playerName.textContent = state.name;
  const stats = allAttributeProgress(state.attributeEffort);
  for (const { id } of ATTRIBUTES) {
    const value = attributeValues.get(id);
    value.textContent = number(stats[id].value);
    value.title = id + ": " + stats[id].progressPercent.toFixed(1) +
      "% toward the next point (" + stats[id].progressXP.toFixed(1) +
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
  // The simulator returns one real typed event every 20 seconds. We present
  // only that event, never invented victory/kill counts for long offline gaps.
  const combat = current?.category === "combat" && !transition
    ? combatAtTime(state.combatSession) : null;
  ui.combatPanel.hidden = !combat;
  ui.combatDice.hidden = !combat || !combat.event.dice;
  if (combat) {
    const event = combat.event;
    const key = state.combatSession.seed + ":" + combat.bout + ":" + combat.step;
    ui.combatEventTitle.textContent = "DUEL " + number(combat.bout) +
      " · " + event.type.toUpperCase();
    ui.combatDice.hidden = !event.dice;
    ui.combatDice.textContent = event.dice ? event.dice.join(" · ") : "";
    ui.combatPanel.classList.toggle("finisher", event.type === "finisher");
    if (key !== lastCombatEventKey) {
      message(combatChronicleLine(event));
      lastCombatEventKey = key;
    }
  } else {
    lastCombatEventKey = null;
  }
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
    // No misleading prototype explanation or repeated combat narrative above
    // the Chronicle. The arena art and short outcome label stand on their own.
    ui.description.hidden = Boolean(combat);
    ui.description.textContent = combat ? "" : transition
      ? "Your character finishes their work, travels and prepares before the new task begins."
      : sceneActivity.description;
    // Every live turn selects its actual combat event / attacker weapon /
    // defender shield / player outcome. Other activities retain static art.
    const sceneId = transition ? transition.targetActivity : state.activity;
    const combatArt = combat ? combatArtworkForEvent(
      combat.event, state.combatSession.player.loadout, combat.enemyLoadout) : null;
    const sceneAsset = sceneActivity.item === null
      ? (sceneActivity.category === "training" ? "masonry" : "cooking")
      : sceneId;
    const desiredImage = sceneId === "fighting"
      ? "./assets/combat/" + (combatArt?.asset ?? "fight-engage") + ".webp?v=20261122-combat-scenes1"
      : "./assets/" + sceneAsset + ".webp?v=20261122-combat-scenes1";
    if (ui.sceneImage.getAttribute("src") !== desiredImage) {
      ui.sceneImage.onerror = () => {
        ui.sceneImage.onerror = null;
        ui.sceneImage.src = sceneId === "fighting"
          ? "./assets/combat/fight-engage.webp?v=20261122-combat-scenes1"
          : "./assets/" + (isHunt ? "hunting.webp" : "mining.webp") +
            "?v=20261122-combat-scenes1";
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
  const result = settle(state, Date.now());
  state = result.state;
  const gained = reportProgress(result);
  announceArrival(before);
  if (gained || (before && !state.transition) || Date.now() - lastSavedAt > 3000) writeSave();
  render();
}

function returnToGame() {
  const before = state.transition;
  const result = enterGame(state, Date.now());
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
    ? requestActivityChange(state, kind, Date.now())
    : queueStartActivity(state, kind, null, Date.now());
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
  try { saved = localStorage.getItem(SAVE_KEY); } catch { storageWorks = false; }
  state = saved ? readSave(saved) : null;
  if (!state) {
    state = newGame();
    if (saved) message("The previous save could not be read; a new character was created.");
    else message("Choose an activity. Your character will work without further clicks.");
    writeSave();
  } else {
    const result = enterGame(state, Date.now());
    state = result.state;
    reportProgress(result);
    writeSave();
  }

  ui.combatLoadout.addEventListener("change", () => {
    const result = setCombatLoadout(state, ui.combatLoadout.value, Date.now());
    state = result.state;
    reportProgress(result);
    message("Combat style equipped: " + COMBAT_LOADOUTS[state.combatLoadout].name +
      ". Two skills: " + ui.combatSkillsText.textContent +
      ". A fresh duel begins if you were fighting.");
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
    if (event.key === SAVE_KEY) {
      const newer = readSave(event.newValue);
      if (newer) { state = newer; render(); message("Save updated from another tab."); }
    }
  });
  render();
  window.setInterval(tick, 250);
}

start();
