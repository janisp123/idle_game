import {
  SAVE_KEY, ACTIVITIES, ITEM_KEYS, ITEM_LABELS, lootChances, PRODUCTION_INPUTS, recipeOptions, newGame, readSave, settle,
  enterGame, queueStartActivity, queueSetDuration, queueSwap, queueRemoveLast,
  MAX_WAGONS, HOUR_MS, DAY_MS,
  SAME_ZONE_TRAVEL_MS, ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS, xpForLevel
} from "./engine.mjs?v=20261121-three-wagons1";

const $ = id => document.getElementById(id);
const ui = {
  playerName: $("character-heading"), nameInput: $("nameInput"), saveName: $("saveName"),
  resourceList: $("resourceList"), choices: $("activityChoices"),
  openActivities: $("openActivities"), categories: $("activityCategories"),
  categoryChoices: $("activityCategoryChoices"), listScreen: $("activityListScreen"),
  backToActivities: $("backToActivities"), backToCategories: $("backToCategories"),
  categoryTitle: $("activityCategoryTitle"),
  skillTitle: $("skillTitle"), skillLevel: $("skillLevel"), skillXp: $("skillXp"), skillFill: $("skillFill"),
  sceneTag: $("sceneTag"), sceneImage: $("sceneImage"), sceneCaption: $("sceneCaption"),
  heading: $("scene-heading"), description: $("activityDescription"), actionFill: $("actionFill"),
  activityProgress: $("activityProgress"), transitionStatus: $("transitionStatus"),
  transitionPhase: $("transitionPhase"), transitionProgress: $("transitionProgress"), transitionFill: $("transitionFill"),
  wagonQueue: $("wagonQueue"), wagonList: $("wagonList"),
  queuePlanner: $("queuePlanner"), queuePlannerTitle: $("queuePlannerTitle"),
  queueAmount: $("queueAmount"), queueUnit: $("queueUnit"),
  queueConfirm: $("queueConfirm"), queueCancel: $("queueCancel"),
  logList: $("logList"),
  banner: $("sceneBanner"), saveStatus: $("saveStatus")
};
const number = value => new Intl.NumberFormat("en-GB").format(value);
const messages = [];
let state;
let lastSavedAt = 0;
let storageWorks = true;
let planningActivity = null;
let lastWagonSignature = null;

const CATEGORY_LABELS = Object.freeze({
  craft: "Honest Work", outlaw: "Outlaw Path", training: "Training & Knowledge", leisure: "Tavern & Leisure", clan: "Clan Activities", other: "Other Activities"
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
const resourceValues = {};
const resourceRows = new Map();
const reserveButtons = new Map();
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
  startButton.className = "activity-start";
  startButton.textContent = "Start";
  startButton.setAttribute("aria-label", "Start " + task.title);
  startButton.addEventListener("click", () => beginActivity(id));
  titleRow.append(name, startButton);
  const detail = document.createElement("small");
  detail.textContent = task.itemLabel;
  const rank = document.createElement("small");
  rank.className = "skill-rank";
  body.append(titleRow, detail, rank);
  row.append(body);
  activityRewardLabels.set(id, detail);
  activityLevelLabels.set(id, rank);
  categoryActivities.get(task.category in CATEGORY_LABELS ? task.category : "other").push(row);
  activityButtons.set(id, { row, startButton });
}
for (const item of ITEM_KEYS) {
  const row = document.createElement("div");
  row.className = "item";
  const label = document.createElement("span");
  label.textContent = ITEM_LABELS[item];
  const count = document.createElement("strong");
  count.textContent = "0";
  row.append(label, count);
  if (PRODUCTION_INPUTS.includes(item)) {
    const reserve = document.createElement("button");
    reserve.type = "button";
    reserve.className = "resource-lock";
    reserve.addEventListener("click", () => {
      const protectedItems = new Set(state.protectedItems ?? []);
      if (protectedItems.has(item)) protectedItems.delete(item);
      else protectedItems.add(item);
      state = { ...state, protectedItems: [...protectedItems] };
      writeSave();
      render();
    });
    row.append(reserve);
    reserveButtons.set(item, reserve);
  }
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


/** Show one to three illustrated wagon cards without rebuilding focused controls every tick. */
function renderWagons() {
  const wagons = state.wagons ?? [];
  ui.wagonQueue.hidden = wagons.length === 0;
  const signature = JSON.stringify([wagons, state.transition?.targetActivity, state.activity]);
  if (signature === lastWagonSignature) return;
  lastWagonSignature = signature;
  const cards = wagons.map((wagon, i) => {
    const card = document.createElement("article");
    card.className = "wagon";
    const picture = document.createElement("div");
    picture.className = "wagon-cart";
    picture.setAttribute("aria-hidden", "true");
    const label = document.createElement("strong");
    label.className = "wagon-name";
    label.textContent = ACTIVITIES[wagon.activity].title;
    const position = document.createElement("small");
    position.className = "wagon-position";
    position.textContent = i === 0
      ? (state.transition?.targetActivity === wagon.activity ? "Changing to…" : "Current activity")
      : i === wagons.length - 1 ? "Final destination" : "Next activity";
    card.append(picture, label, position);

    if (i === wagons.length - 1) {
      const forever = document.createElement("strong");
      forever.className = "wagon-forever";
      forever.textContent = "FOREVER";
      card.append(forever);
    } else {
      const duration = document.createElement("div");
      duration.className = "wagon-duration";
      const heading = document.createElement("span");
      heading.textContent = "Do it for";
      const amount = document.createElement("select");
      amount.setAttribute("aria-label", "Duration for " + ACTIVITIES[wagon.activity].title);
      const unit = document.createElement("select");
      unit.setAttribute("aria-label", "Duration unit for " + ACTIVITIES[wagon.activity].title);
      for (let n = 1; n <= 8; n++) {
        const option = document.createElement("option");
        option.value = String(n);
        option.textContent = String(n);
        amount.append(option);
      }
      for (const [value, label] of [["hours", "Hours"], ["days", "Days"]]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        unit.append(option);
      }
      const days = wagon.plannedMs % DAY_MS === 0;
      amount.value = String(wagon.plannedMs / (days ? DAY_MS : HOUR_MS));
      unit.value = days ? "days" : "hours";
      const apply = () => {
        const ms = Number(amount.value) * (unit.value === "days" ? DAY_MS : HOUR_MS);
        applyQueueChange(queueSetDuration(state, i, ms, Date.now()), "Wagon duration updated.");
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
    if (i === wagons.length - 1 && i > 0) control("Remove", "Remove final future wagon",
      () => applyQueueChange(queueRemoveLast(state, Date.now()), "Future wagon removed."));
    card.append(controls);
    return card;
  });
  ui.wagonList.replaceChildren(...cards);
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

ui.queueCancel.addEventListener("click", () => hideQueuePlanner());
ui.queueConfirm.addEventListener("click", () => {
  if (!planningActivity) return;
  const ms = Number(ui.queueAmount.value) * (ui.queueUnit.value === "days" ? DAY_MS : HOUR_MS);
  const task = planningActivity;
  hideQueuePlanner();
  applyQueueChange(queueStartActivity(state, task, ms, Date.now()), "Added " +
    ACTIVITIES[task].title.toLowerCase() + " to your route.");
});

function render() {
  const current = state.activity ? ACTIVITIES[state.activity] : null;
  ui.playerName.textContent = state.name;
  if (document.activeElement !== ui.nameInput) ui.nameInput.value = state.name;
  for (const key of ITEM_KEYS) {
    const qty = state.items[key];
    resourceValues[key].textContent = number(qty);
    resourceRows.get(key).hidden = qty === 0;
    const reserve = reserveButtons.get(key);
    if (reserve) {
      const isProtected = (state.protectedItems ?? []).includes(key);
      reserve.textContent = isProtected ? "Protected" : "Auto use";
      reserve.setAttribute("aria-label", (isProtected ? "Allow automatic use of " : "Protect ") + ITEM_LABELS[key]);
      reserve.setAttribute("aria-pressed", String(isProtected));
    }
  }
  emptyInventory.hidden = ITEM_KEYS.some(key => state.items[key] > 0);
  const transition = state.transition;
  renderWagons();
  for (const [id, { row, startButton }] of activityButtons) {
    const skill = state.skills[id];
    activityLevelLabels.get(id).textContent = "Skill level " + number(skill.level);
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
    startButton.disabled = queuedIndex !== -1 || queueFull;
    startButton.textContent = destination ? "Changing" : queuedIndex === 0 ? "Working" :
      queuedIndex > 0 ? "Queued" : queueFull ? "Full" : "Start";
    startButton.setAttribute("aria-label", destination ? "Changing to " + ACTIVITIES[id].title :
      queuedIndex === 0 ? "Current wagon: " + ACTIVITIES[id].title :
      queuedIndex > 0 ? "Already queued: " + ACTIVITIES[id].title :
      queueFull ? "Three wagons already queued" : "Start " + ACTIVITIES[id].title);
  }

  const selectedSkill = state.activity ? state.skills[state.activity] : null;
  ui.skillTitle.textContent = current ? current.title : "Choose an activity";
  if (selectedSkill) {
    const baseXP = xpForLevel(selectedSkill.level);
    const nextXP = xpForLevel(selectedSkill.level + 1);
    const earned = Math.max(0, selectedSkill.xp - baseXP);
    const required = nextXP - baseXP;
    const ready = earned >= required;
    ui.skillLevel.textContent = "Level " + number(selectedSkill.level);
    ui.skillXp.textContent = ready
      ? "Level-up ready on return"
      : number(earned) + " / " + number(required) + " skill XP";
    ui.skillFill.style.width = Math.min(100, earned / required * 100).toFixed(2) + "%";
  } else {
    ui.skillLevel.textContent = "—";
    ui.skillXp.textContent = "Each activity has independent XP.";
    ui.skillFill.style.width = "0%";
  }

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
  const sceneActivity = transition ? ACTIVITIES[transition.targetActivity] : current;
  if (!sceneActivity) {
    ui.sceneTag.textContent = "WAITING FOR ORDERS";
    ui.banner.textContent = "THE LONG VIGIL";
    ui.heading.textContent = "Choose an activity";
    ui.description.textContent = "Choose a craft or gathering task. Each cycle includes preparation and hauling.";
    ui.actionFill.style.width = "0%";
    ui.activityProgress.setAttribute("aria-valuenow", "0");
  } else {
    const isHunt = sceneActivity === ACTIVITIES.hunting;
    ui.sceneTag.textContent = transition ? "CHANGING PATH" : sceneActivity.zone.toUpperCase();
    ui.banner.textContent = transition ? "THE JOURNEY" : sceneActivity.title.toUpperCase();
    ui.heading.textContent = transition ? "Changing to " + sceneActivity.title : sceneActivity.title;
    ui.description.textContent = transition
      ? "Your character finishes their work, travels and prepares before the new task begins."
      : sceneActivity.description;
    // Reuse the existing painted scene for the selected destination.
    const sceneId = transition ? transition.targetActivity : state.activity;
    const sceneAsset = sceneActivity.item === null
      ? (sceneActivity.category === "training" ? "masonry" : "cooking")
      : sceneId;
    const desiredImage = "./assets/" + sceneAsset + ".webp?v=20261121-skills-outlaws-v3";
    if (ui.sceneImage.getAttribute("src") !== desiredImage) {
      ui.sceneImage.onerror = () => {
        ui.sceneImage.onerror = null;
        ui.sceneImage.src = "./assets/" + (isHunt ? "hunting.webp" : "mining.webp") + "?v=20261121-skills-outlaws-v3";
      };
      ui.sceneImage.src = desiredImage;
    }
    ui.sceneImage.alt = "Dark fantasy illustration of " + sceneActivity.title.toLowerCase();
    ui.sceneCaption.textContent = sceneActivity.zone.toUpperCase();
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

function beginActivity(kind) {
  if (state.wagons.some(w => w.activity === kind) || state.wagons.length >= MAX_WAGONS) return;
  showActivityScreen("root", null);
  if (!state.wagons.length) {
    hideQueuePlanner();
    applyQueueChange(queueStartActivity(state, kind, null, Date.now()),
      "Preparing to begin " + ACTIVITIES[kind].title.toLowerCase() + ".");
    return;
  }
  // The formerly final Forever wagon must get an explicit duration.
  planningActivity = kind;
  ui.queueAmount.value = "1";
  ui.queueUnit.value = "hours";
  const previous = state.wagons.at(-1).activity;
  ui.queuePlannerTitle.textContent = "Before adding " + ACTIVITIES[kind].title +
    ", how long should " + ACTIVITIES[previous].title + " work?";
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
