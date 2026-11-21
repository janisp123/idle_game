import {
  SAVE_KEY, ACTIVITIES, ITEM_KEYS, newGame, readSave, settle,
  enterGame, chooseActivity, testOfflineDay, xpForLevel
} from "./engine.mjs";

const $ = id => document.getElementById(id);
const ui = {
  level: $("level"), xp: $("xpText"), xpFill: $("xpFill"),
  resourceList: $("resourceList"), choices: $("activityChoices"), totalXP: $("lifetimeXp"),
  sceneTag: $("sceneTag"), sceneImage: $("sceneImage"), sceneCaption: $("sceneCaption"),
  heading: $("scene-heading"), description: $("activityDescription"), rate: $("rateText"),
  progressDescription: $("progressDescription"), countdown: $("countdown"), actionFill: $("actionFill"),
  logList: $("logList"), returnPanel: $("returnPanel"), returnMessage: $("returnMessage"),
  banner: $("sceneBanner"), actionCount: $("actionCount"), timeInvested: $("timeInvested"), experienceCount: $("experienceCount"),
  dismissReturn: $("dismissReturn"), testDay: $("testDay"), saveStatus: $("saveStatus")
};
const number = value => new Intl.NumberFormat("en-GB").format(value);
const messages = [];
let state;
let lastSavedAt = 0;
let storageWorks = true;

const activityButtons = new Map();
const resourceValues = {};
for (const [id, task] of Object.entries(ACTIVITIES)) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "activity";
  button.setAttribute("aria-pressed", "false");
  const name = document.createElement("strong");
  name.textContent = task.title;
  const detail = document.createElement("small");
  detail.textContent = task.itemLabel + " · " + task.baseMinutes + "m per cycle";
  const body = document.createElement("span");
  body.append(name, detail);
  button.append(body);
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
  messages.unshift("[" + new Date().toLocaleTimeString("en-GB", { hour12: false }) + "]  " + text);
  if (messages.length > 7) messages.length = 7;
  ui.logList.replaceChildren(...messages.map(line => {
    const item = document.createElement("li");
    item.textContent = line;
    return item;
  }));
}

function duration(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  if (seconds < 60) return seconds + "s";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return [days && days + "d", hours && hours + "h", mins && mins + "m"].filter(Boolean).join(" ") || "under 1m";
}

function reportProgress(report, gainedLevels = 0) {
  if (!report || !report.completed || !report.activity) return;
  const action = ACTIVITIES[report.activity];
  const thing = action.subject.toLowerCase();
  const levelText = gainedLevels > 0 ? " You gained " + number(gainedLevels) + " level" + (gainedLevels === 1 ? "" : "s") + " on returning." : "";
  ui.returnMessage.textContent =
    "During " + duration(report.elapsedMs) + " of " + action.title.toLowerCase() +
    ", you completed " + number(report.completed) + " work cycles involving " + thing +
    ". Gained " + number(report.gainedItems) + " " + action.itemLabel.toLowerCase() +
    " and " + number(report.gainedXP) + " XP." + levelText;
  ui.returnPanel.hidden = false;
  message("Welcome back. " + number(report.completed) + " actions settled; " + number(report.gainedXP) + " XP earned.");
  if (gainedLevels > 0) message("You advanced " + number(gainedLevels) + " level(s) on return.");
}

function render() {
  const current = state.activity ? ACTIVITIES[state.activity] : null;
  const thisLevelXp = xpForLevel(state.level);
  const nextLevelXp = xpForLevel(state.level + 1);
  const toward = state.totalXP - thisLevelXp;
  const required = nextLevelXp - thisLevelXp;
  const ready = state.totalXP >= nextLevelXp;
  ui.level.textContent = number(state.level);
  ui.xp.textContent = ready ? "ADVANCE ON RETURN" : number(toward) + " / " + number(required) + " XP";
  ui.xpFill.style.width = Math.min(100, 100 * toward / required) + "%";
  for (const key of ITEM_KEYS) resourceValues[key].textContent = number(state.items[key]);
  ui.totalXP.textContent = number(state.totalXP);
  ui.experienceCount.textContent = number(state.totalXP);
  const completed = ITEM_KEYS.reduce((sum, key) => sum + state.items[key], 0);
  ui.actionCount.textContent = number(completed);
  ui.timeInvested.textContent = "Work continues"; // resource totals are not action counts under +/-10% rewards
  for (const [id, button] of activityButtons) {
    button.classList.toggle("active", state.activity === id);
    button.setAttribute("aria-pressed", String(state.activity === id));
  }
  ui.testDay.disabled = !current;

  if (!current) {
    ui.sceneTag.textContent = "WAITING FOR ORDERS";
    ui.banner.textContent = "THE LONG VIGIL";
    ui.heading.textContent = "Choose an activity";
    ui.description.textContent = "Choose a craft or gathering task. Each cycle includes preparation and hauling.";
    ui.rate.textContent = "IDLE";
    ui.progressDescription.textContent = "Awaiting your orders";
    ui.countdown.textContent = "—";
    ui.actionFill.style.width = "0%";
  } else {
    const isHunt = state.activity === "hunting";
    ui.sceneTag.textContent = current.zone.toUpperCase();
    ui.banner.textContent = current.title.toUpperCase();
    ui.heading.textContent = current.title;
    ui.description.textContent = current.description;
    // Existing paintings serve as temporary shared scenes until new original art is approved.
    const desiredImage = "./assets/" + (isHunt || ["gathering", "woodcutting", "fishing"].includes(state.activity) ? "hunting.webp" : "mining.webp");
    if (ui.sceneImage.getAttribute("src") !== desiredImage) ui.sceneImage.setAttribute("src", desiredImage);
    ui.sceneImage.alt = "Temporary dark-fantasy work illustration";
    ui.sceneCaption.textContent = current.zone.toUpperCase();
    ui.rate.textContent = (current.durationMs / 1000) + " SEC / ACTION";
    ui.progressDescription.textContent = "Auto-running · " + current.title;
    ui.countdown.textContent = ((current.durationMs - state.progressMs) / 1000).toFixed(1) + "s";
    ui.actionFill.style.width = (state.progressMs / current.durationMs * 100).toFixed(2) + "%";
  }
}

function tick() {
  if (document.visibilityState === "hidden") return;
  const result = settle(state, Date.now());
  state = result.state;
  if (result.report.completed) {
    const n = result.report.completed;
    const current = ACTIVITIES[state.activity];
    message(number(n) + " " + current.title.toLowerCase() + " cycles completed. +" +
      number(result.report.gainedItems) + " " + current.itemLabel.toLowerCase() + ", +" +
      number(result.report.gainedXP) + " XP.");
    writeSave();
  } else if (Date.now() - lastSavedAt > 3000) {
    writeSave();
  }
  render();
}

function returnToGame() {
  const result = enterGame(state, Date.now());
  state = result.state;
  if (result.report.completed && (result.report.elapsedMs > 8000 || result.levelsGained)) {
    reportProgress(result.report, result.levelsGained);
  } else if (result.levelsGained) {
    message("You gained " + result.levelsGained + " level(s) on return.");
  }
  writeSave();
  render();
}

function beginActivity(kind) {
  const result = chooseActivity(state, kind, Date.now());
  const changed = state.activity !== kind;
  state = result.state;
  if (result.report.completed) message(number(result.report.completed) + " prior actions completed before switching.");
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
    message("Wanderer returns to the world.");
    reportProgress(result.report, result.levelsGained);
    writeSave();
  }

  ui.dismissReturn.addEventListener("click", () => { ui.returnPanel.hidden = true; });
  ui.testDay.addEventListener("click", () => {
    if (!state.activity) return;
    state = settle(state, Date.now()).state;
    const result = testOfflineDay(state, Date.now());
    state = result.state;
    reportProgress(result.report, result.levelsGained);
    message("Testing shortcut: 1 day added using the frozen character level.");
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
