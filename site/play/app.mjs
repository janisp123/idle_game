import {
  SAVE_KEY, ACTIVITIES, ITEM_KEYS, ITEM_LABELS, lootChances, PRODUCTION_INPUTS, recipeOptions, newGame, readSave, settle,
  enterGame, chooseActivity, xpForLevel
} from "./engine.mjs?v=20261121-production1";

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
  activityProgress: $("activityProgress"),
  logList: $("logList"), returnPanel: $("returnPanel"), returnMessage: $("returnMessage"),
  banner: $("sceneBanner"), dismissReturn: $("dismissReturn"), saveStatus: $("saveStatus")
};
const number = value => new Intl.NumberFormat("en-GB").format(value);
const messages = [];
let state;
let lastSavedAt = 0;
let storageWorks = true;

const CATEGORY_LABELS = Object.freeze({
  craft: "Honest Work", outlaw: "Outlaw Path", clan: "Clan Activities", other: "Other Activities"
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
  const button = document.createElement("button");
  button.type = "button";
  button.className = "activity";
  button.setAttribute("aria-pressed", "false");
  const name = document.createElement("strong");
  name.textContent = task.title;
  const detail = document.createElement("small");
  detail.textContent = task.itemLabel;
  const body = document.createElement("span");
  const rank = document.createElement("small");
  rank.className = "skill-rank";
  body.append(name, detail, rank);
  activityRewardLabels.set(id, detail);
  button.append(body);
  activityLevelLabels.set(id, rank);
  button.addEventListener("click", () => beginActivity(id));
  categoryActivities.get(task.category in CATEGORY_LABELS ? task.category : "other").push(button);
  activityButtons.set(id, button);
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
  if (!report || !report.activity || !report.gainedItems) return "No new resources collected.";
  const amounts = report.items ?? { [report.item]: report.gainedItems };
  const found = Object.entries(amounts)
    .filter(([, amount]) => amount > 0)
    .map(([item, amount]) => number(amount) + " " + ITEM_LABELS[item].toLowerCase());
  return found.length ? "You gathered " + found.join(", ") + "." : "No new resources collected.";
}

function reportProgress(report) {
  if (!report || !report.activity) return;
  const summary = lootSummary(report);
  ui.returnMessage.textContent = summary;
  ui.returnPanel.hidden = false;
  message("Welcome back. " + summary);
}

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
  for (const [id, button] of activityButtons) {
    const skill = state.skills[id];
    activityLevelLabels.get(id).textContent = "Skill level " + number(skill.level);
    const available = lootChances(id, skill.level);
    const recipes = recipeOptions(id, skill.level);
    activityRewardLabels.get(id).textContent = recipes.length
      ? recipes.map(t => t.label).join(" · ")
      : available.length ? available.map(t => t.label).join(" · ")
      : ACTIVITIES[id].itemLabel;
    button.classList.toggle("active", state.activity === id);
    button.setAttribute("aria-pressed", String(state.activity === id));
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

  if (!current) {
    ui.sceneTag.textContent = "WAITING FOR ORDERS";
    ui.banner.textContent = "THE LONG VIGIL";
    ui.heading.textContent = "Choose an activity";
    ui.description.textContent = "Choose a craft or gathering task. Each cycle includes preparation and hauling.";
    ui.actionFill.style.width = "0%";
    ui.activityProgress.setAttribute("aria-valuenow", "0");
  } else {
    const isHunt = state.activity === "hunting";
    ui.sceneTag.textContent = current.zone.toUpperCase();
    ui.banner.textContent = current.title.toUpperCase();
    ui.heading.textContent = current.title;
    ui.description.textContent = current.description;
    // Each activity has its own painted scene. Existing paintings remain fallbacks
    // until the new self-hosted WebP assets are uploaded alongside this change.
    const desiredImage = "./assets/" + state.activity + ".webp?v=20261121-skills-outlaws-v3";
    if (ui.sceneImage.getAttribute("src") !== desiredImage) {
      ui.sceneImage.onerror = () => {
        ui.sceneImage.onerror = null;
        ui.sceneImage.src = "./assets/" + (isHunt ? "hunting.webp" : "mining.webp") + "?v=20261121-skills-outlaws-v3";
      };
      ui.sceneImage.src = desiredImage;
    }
    ui.sceneImage.alt = "Dark fantasy illustration of " + current.title.toLowerCase();
    ui.sceneCaption.textContent = current.zone.toUpperCase();
    const percentage = Math.min(100, 100 * state.progressMs / current.durationMs);
    ui.actionFill.style.width = percentage.toFixed(2) + "%";
    ui.activityProgress.setAttribute("aria-valuenow", String(Math.round(percentage)));
  }
}

function tick() {
  if (document.visibilityState === "hidden") return;
  const result = settle(state, Date.now());
  state = result.state;
  if (result.report.completed) {
    message(lootSummary(result.report));
    writeSave();
  } else if (Date.now() - lastSavedAt > 3000) {
    writeSave();
  }
  render();
}

function returnToGame() {
  const result = enterGame(state, Date.now());
  state = result.state;
  if (result.report.activity) reportProgress(result.report);
  writeSave();
  render();
}

function beginActivity(kind) {
  showActivityScreen("root", null);
  const result = chooseActivity(state, kind, Date.now());
  const changed = state.activity !== kind;
  state = result.state;
  if (result.report.gainedItems) message(lootSummary(result.report));
  if (changed) message("You begin " + ACTIVITIES[kind].title.toLowerCase() + ".");
  ui.returnPanel.hidden = true;
  writeSave();
  render();
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
    reportProgress(result.report);
    writeSave();
  }

  ui.dismissReturn.addEventListener("click", () => { ui.returnPanel.hidden = true; });
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
