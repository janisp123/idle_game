import {
  SAVE_KEY, ACTIVITIES, newGame, readSave, settle,
  enterGame, chooseActivity, testOfflineDay, xpForLevel
} from "./engine.mjs";

const $ = id => document.getElementById(id);
const ui = {
  level: $("level"), xp: $("xpText"), xpFill: $("xpFill"),
  hide: $("hideCount"), stone: $("stoneCount"), totalXP: $("lifetimeXp"),
  hunt: $("huntButton"), mine: $("mineButton"),
  sceneTag: $("sceneTag"), sceneImage: $("sceneImage"), sceneCaption: $("sceneCaption"),
  heading: $("scene-heading"), description: $("activityDescription"), rate: $("rateText"),
  progressDescription: $("progressDescription"), countdown: $("countdown"), actionFill: $("actionFill"),
  logList: $("logList"), returnPanel: $("returnPanel"), returnMessage: $("returnMessage"),
  dismissReturn: $("dismissReturn"), testDay: $("testDay"), saveStatus: $("saveStatus")
};
const number = value => new Intl.NumberFormat("en-GB").format(value);
const messages = [];
let state;
let lastSavedAt = 0;
let storageWorks = true;

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
  const verb = report.activity === "hunting" ? "hunted" : "mined";
  const thing = report.activity === "hunting" ? "wolves" : "stone deposits";
  const levelText = gainedLevels > 0 ? " You gained " + number(gainedLevels) + " level" + (gainedLevels === 1 ? "" : "s") + " on returning." : "";
  ui.returnMessage.textContent =
    "During " + duration(report.elapsedMs) + " of " + action.title.toLowerCase() +
    ", you " + verb + " " + number(report.completed) + " " + thing +
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
  ui.hide.textContent = number(state.items.hide);
  ui.stone.textContent = number(state.items.stone);
  ui.totalXP.textContent = number(state.totalXP);
  ui.hunt.classList.toggle("active", state.activity === "hunting");
  ui.mine.classList.toggle("active", state.activity === "mining");
  ui.hunt.setAttribute("aria-pressed", String(state.activity === "hunting"));
  ui.mine.setAttribute("aria-pressed", String(state.activity === "mining"));
  ui.testDay.disabled = !current;

  if (!current) {
    ui.sceneTag.textContent = "WAITING FOR ORDERS";
    ui.heading.textContent = "Choose an activity";
    ui.description.textContent = "The wolf road and the stone mine await. Select your first task.";
    ui.rate.textContent = "IDLE";
    ui.progressDescription.textContent = "Awaiting your orders";
    ui.countdown.textContent = "—";
    ui.actionFill.style.width = "0%";
  } else {
    const isHunt = state.activity === "hunting";
    ui.sceneTag.textContent = isHunt ? "THE WOLF ROAD" : "THE STONE MINE";
    ui.heading.textContent = isHunt ? "Hunting wolves" : "Mining stone";
    ui.description.textContent = isHunt
      ? "Beyond the ruined watchtower, wolves stalk the dead forest. The hunt goes on without your command."
      : "Under the old mountain, stone is split from the cold rock. Every strike brings another fragment home.";
    const file = isHunt ? "hunting.svg" : "mining.svg";
    const desiredImage = "./assets/" + file;
    if (ui.sceneImage.getAttribute("src") !== desiredImage) ui.sceneImage.setAttribute("src", desiredImage);
    ui.sceneImage.alt = isHunt
      ? "Dark-fantasy illustration of a lone hunter confronting wolves beneath dead trees"
      : "Dark-fantasy illustration of a lone miner working a gloomy stone cavern";
    ui.sceneCaption.textContent = isHunt ? "THE WOLF ROAD" : "THE HOLLOW MOUNTAIN";
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
    message(state.activity === "hunting"
      ? number(n) + " wolf" + (n === 1 ? "" : "ves") + " hunted. +" + number(result.report.gainedItems) + " hides, +" + number(result.report.gainedXP) + " XP."
      : number(n) + " rock deposit" + (n === 1 ? "" : "s") + " mined. +" + number(result.report.gainedItems) + " stone, +" + number(result.report.gainedXP) + " XP.");
    writeSave();
  } else if (Date.now() - lastSavedAt > 3000) {
    writeSave();
  }
  render();
}

function returnToGame() {
  const start = state.settledAtMs;
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
  if (changed) message(kind === "hunting" ? "You enter the wolf-haunted woods." : "You descend into the cold stone mine.");
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
    else message("Choose Hunting or Mining. Your character will work without further clicks.");
    writeSave();
  } else {
    const result = enterGame(state, Date.now());
    state = result.state;
    message("Wanderer returns to the world.");
    reportProgress(result.report, result.levelsGained);
    writeSave();
  }
  ui.hunt.addEventListener("click", () => beginActivity("hunting"));
  ui.mine.addEventListener("click", () => beginActivity("mining"));
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
      if (newer) { state = newer; returnToGame(); message("Save updated from another tab."); }
    }
  });
  render();
  window.setInterval(tick, 250);
}

start();
