import {
  SAVE_KEY, ACTIVITIES, ITEM_KEYS, newGame, readSave, settle,
  enterGame, chooseActivity, xpForLevel
} from "./engine.mjs?v=20261121-skills-v2";

const $ = id => document.getElementById(id);
const ui = {
  playerName: $("character-heading"), nameInput: $("nameInput"), saveName: $("saveName"),
  resourceList: $("resourceList"), choices: $("activityChoices"),
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

const activityButtons = new Map();
const activityLevelLabels = new Map();
const resourceValues = {};
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
  button.append(body);
  activityLevelLabels.set(id, rank);
  button.addEventListener("click", () => beginActivity(id));
  ui.choices.append(button);
  activityButtons.set(id, button);
  const row = document.createElement("div");
  row.className = "item";
  const label = document.createElement("span");
  label.textContent = task.itemLabel;
  const count = document.createElement("strong");
  count.textContent = "0";
  row.append(label, count);
  ui.resourceList.append(row);
  resourceValues[task.item] = count;
}

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
  return "You gathered " + number(report.gainedItems) + " " +
    ACTIVITIES[report.activity].itemLabel.toLowerCase() + ".";
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
  for (const key of ITEM_KEYS) resourceValues[key].textContent = number(state.items[key]);
  for (const [id, button] of activityButtons) {
    const skill = state.skills[id];
    activityLevelLabels.get(id).textContent = "Skill level " + number(skill.level);
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
    const desiredImage = "./assets/" + state.activity + ".webp?v=20261121-art37";
    if (ui.sceneImage.getAttribute("src") !== desiredImage) {
      ui.sceneImage.onerror = () => {
        ui.sceneImage.onerror = null;
        ui.sceneImage.src = "./assets/" + (isHunt ? "hunting.webp" : "mining.webp") + "?v=20261121-art37";
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
    message("Collected " + number(result.report.gainedItems) + " " +
      ACTIVITIES[state.activity].itemLabel.toLowerCase() + ".");
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
  const result = chooseActivity(state, kind, Date.now());
  const changed = state.activity !== kind;
  state = result.state;
  if (result.report.gainedItems) message("Collected " + number(result.report.gainedItems) + " " + ACTIVITIES[result.report.activity].itemLabel.toLowerCase() + ".");
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
    const chosen = ui.nameInput.value.trim().replace(/\\s+/g, " ");
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
