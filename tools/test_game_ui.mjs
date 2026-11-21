import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACTIVITIES, SAVE_KEY, ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS, HOUR_MS } from "../site/play/engine.mjs";

class FakeElement {
  children = [];
  listeners = new Map();
  attributes = new Map();
  style = {};
  value = "";
  textContent = "";
  hidden = false;
  classList = { toggle() {} };
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(event, handler) { this.listeners.set(event, handler); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  fire(event) { this.listeners.get(event)?.(); }
}

test("real browser-app entrypoint renders skill UI and migrates old saved character", async () => {
  const html = readFileSync(new URL("../site/play/index.html", import.meta.url), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const elements = new Map(ids.map(id => [id, new FakeElement()]));
  const originalNow = Date.now;
  const originalRandom = Math.random;
  Math.random = () => 0.5; // avoid stochastic 0-item single-cycle rewards in UI assertions
  let now = 2_000_000_000_000;
  let tick = null;
  const store = new Map([[SAVE_KEY, JSON.stringify({
    version: 1, name: "Marauder", level: 2, totalXP: 85,
    items: { hide: 8, stone: 4 }, activity: null,
    progressMs: 0, settledAtMs: now
  })]]);
  const handlers = new Map();
  globalThis.document = {
    activeElement: null,
    visibilityState: "visible",
    getElementById: id => elements.get(id) ?? null,
    createElement: () => new FakeElement(),
    addEventListener: (event, handler) => handlers.set(event, handler)
  };
  globalThis.localStorage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value))
  };
  globalThis.window = { addEventListener() {}, setInterval(handler) { tick = handler; } };
  Date.now = () => now;
  try {
    await import("../site/play/app.mjs?smoke-test");
    assert.ok(tick, "game tick must start");
    const openActivities = elements.get("openActivities");
    const categoryScreen = elements.get("activityCategories");
    const listScreen = elements.get("activityListScreen");
    const categories = elements.get("activityCategoryChoices").children;
    assert.equal(openActivities.hidden, false, "only the compact entrypoint appears initially");
    assert.equal(categoryScreen.hidden, true);
    assert.equal(listScreen.hidden, true);
    assert.deepEqual(categories.map(b => b.textContent),
      ["Honest Work", "Outlaw Path", "Training & Knowledge", "Tavern & Leisure", "Clan Activities", "Other Activities"]);
    openActivities.fire("click");
    assert.equal(openActivities.hidden, true);
    assert.equal(categoryScreen.hidden, false);
    categories[2].fire("click");
    assert.equal(elements.get("activityCategoryTitle").textContent, "Training & Knowledge");
    assert.equal(elements.get("activityChoices").children.length, 10);
    assert.ok(elements.get("activityChoices").children.some(b => b.children[0]?.children[0]?.children[0]?.textContent === "Meditation"));
    elements.get("backToCategories").fire("click");
    categories[3].fire("click");
    assert.equal(elements.get("activityCategoryTitle").textContent, "Tavern & Leisure");
    assert.equal(elements.get("activityChoices").children.length, 10);
    assert.ok(elements.get("activityChoices").children.some(b => b.children[0]?.children[0]?.children[0]?.textContent === "Drinking ale with friends"));
    elements.get("backToCategories").fire("click");
    categories[4].fire("click");
    assert.equal(elements.get("activityCategoryTitle").textContent, "Clan Activities");
    assert.equal(elements.get("activityChoices").children[0].textContent, "No activities here yet.");
    elements.get("backToCategories").fire("click");
    assert.equal(categoryScreen.hidden, false);
    categories[1].fire("click");
    let buttons = elements.get("activityChoices").children.filter(node => node.className === "activity");
    assert.equal(buttons.length, 10, "outlaw activities live in their own category");
    assert.equal(buttons.some(b => b.children[0].children[0].children[0].textContent === "Highway robbery"), true);
    elements.get("backToCategories").fire("click");
    categories[0].fire("click");
    buttons = elements.get("activityChoices").children.filter(node => node.className === "activity");
    assert.equal(buttons.length, 10, "honest activities live in their own category");
    assert.equal(buttons.some(b => b.children[0].children[0].children[0].textContent === "Highway robbery"), false,
      "outlaw tasks must not leak into Honest Work");
    assert.equal(buttons.every(b => !/\\d+\\s*(min|sec)|per cycle/i.test(
      b.children[0].children[1].textContent
    )), true, "activity buttons must not reveal cycle rates");
    assert.ok(buttons.every(b => b.children[0].children[2].textContent === "Skill level 1"));
    const alchemy = buttons.find(b => b.children[0].children[0].children[0].textContent === "Potion making");
    const cooking = buttons.find(b => b.children[0].children[0].children[0].textContent === "Cooking");
    assert.ok(alchemy.children[0].children[1].textContent.includes("Potions (uses Herbs)"));
    assert.ok(cooking.children[0].children[1].textContent.includes("Meals (uses Fish)"));
    assert.equal(elements.get("character-heading").textContent, "Marauder");
    let state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.unattributedXP, 85);
    assert.equal(state.items.hide, 8);
    assert.equal(Object.hasOwn(state, "level"), false);
    assert.equal(Object.hasOwn(state, "totalXP"), false);

    const mining = buttons.find(b => b.children[0].children[0].children[0].textContent === "Mining");
    assert.ok(mining);
    elements.get("backToCategories").fire("click");
    assert.equal(categoryScreen.hidden, false);
    categories[0].fire("click");
    const miningStart = mining.children[0].children[0].children[1];
    assert.equal(miningStart.textContent, "Start");
    mining.fire("click");
    assert.equal(JSON.parse(store.get(SAVE_KEY)).activity, null,
      "clicking activity card alone never starts work");
    miningStart.fire("click");
    assert.equal(openActivities.hidden, false, "Start closes the picker");
    assert.equal(listScreen.hidden, true);
    assert.equal(elements.get("scene-heading").textContent, "Changing to Mining");
    assert.equal(elements.get("transitionPhase").textContent, "Getting ready to start new activity");
    assert.equal(elements.get("transitionStatus").hidden, false);
    assert.equal(elements.get("activityProgress").hidden, true);
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, null, "first Start must not instantly work");
    assert.equal(state.transition.targetActivity, "mining");
    assert.deepEqual(state.wagons, [{ activity: "mining", plannedMs: null }]);
    assert.equal(elements.get("wagonQueue").hidden, false);
    assert.equal(elements.get("wagonList").children.length, 1);
    assert.equal(elements.get("wagonList").children[0].children[3].textContent, "FOREVER");
    now += INITIAL_PREPARATION_MS;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining");
    assert.equal(state.transition, null);
    assert.equal(elements.get("transitionStatus").hidden, true);
    assert.equal(elements.get("activityProgress").hidden, false);
    assert.equal(elements.get("skillTitle").textContent, "Mining");
    openActivities.fire("click");
    categories[0].fire("click");
    elements.get("backToCategories").fire("click");
    elements.get("backToActivities").fire("click");
    assert.equal(openActivities.hidden, false);
    assert.equal(JSON.parse(store.get(SAVE_KEY)).activity, "mining",
      "back navigation must not interrupt the active task");

    now += 30 * ACTIVITIES.mining.durationMs;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.ok(state.skills.mining.xp >= 40);
    assert.equal(state.skills.mining.level, 1, "ordinary ticks must not activate new levels");
    assert.equal(elements.get("skillXp").textContent, "Level-up ready on return");

    document.visibilityState = "hidden";
    handlers.get("visibilitychange")();
    now += ACTIVITIES.mining.durationMs * 2;
    document.visibilityState = "visible";
    handlers.get("visibilitychange")();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.ok(state.skills.mining.level > 1, "return activates skill levels");
    assert.equal(state.skills.hunting.level, 1);
    assert.match(mining.children[0].children[1].textContent, /Copper ore/,
      "rare ores become visible only after a skill unlocks them");
    const copperRow = elements.get("resourceList").children.find(row =>
      row.children[0]?.textContent === "Copper ore");
    assert.ok(copperRow, "rare resources must have inventory rows");
    assert.equal(copperRow.hidden, true, "zero inventory quantities remain hidden");
    const reserve = copperRow.children[2];
    assert.ok(reserve, "smelting inputs must have a protection toggle");
    assert.equal(reserve.textContent, "Auto use");
    reserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["copper_ore"]);
    assert.equal(reserve.textContent, "Protected");
    reserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, []);
    assert.equal(reserve.textContent, "Auto use");
    const stoneRow = elements.get("resourceList").children.find(row =>
      row.children[0]?.textContent === "Stone");
    assert.ok(stoneRow, "masonry ingredients have inventory rows");
    const stoneReserve = stoneRow.children[2];
    assert.ok(stoneReserve, "masonry ingredients can be protected");
    stoneReserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["stone"]);
    assert.equal(stoneReserve.textContent, "Protected");
    stoneReserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, []);
    assert.equal(elements.has("returnPanel"), false, "no welcome-back report panel");
    assert.equal(elements.has("dismissReturn"), false, "no popup dismiss control");
    const chronicle = elements.get("logList").children.map(node => node.textContent);
    assert.ok(chronicle.some(line => /^You gathered \d+ stone\.$/.test(line)),
      "return loot is recorded in the chronicle");
    assert.ok(chronicle.every(line => !/Welcome back|seconds|hours|XP|actions|cycles/i.test(line)),
      "no duplicated welcome messages or timers");

    openActivities.fire("click");
    categories[2].fire("click");
    const meditation = elements.get("activityChoices").children.find(
      b => b.children[0]?.children[0]?.children[0]?.textContent === "Meditation");
    const meditationStart = meditation.children[0].children[0].children[1];
    meditationStart.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining");
    assert.equal(state.transition, null, "adding a future wagon does not abandon current work");
    assert.equal(elements.get("queuePlanner").hidden, false);
    assert.match(elements.get("queuePlannerTitle").textContent, /how long should Mining work/);
    elements.get("queueAmount").value = "1";
    elements.get("queueUnit").value = "hours";
    elements.get("queueConfirm").fire("click");
    assert.equal(elements.get("queuePlanner").hidden, true);
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [
      { activity: "mining", plannedMs: HOUR_MS },
      { activity: "meditation", plannedMs: null }
    ]);
    assert.equal(elements.get("wagonList").children.length, 2);
    assert.equal(elements.get("wagonList").children[1].children[3].textContent, "FOREVER");
    const previousStone = state.items.stone;
    const previousMiningXP = state.skills.mining.xp;
    now += HOUR_MS;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.ok(state.items.stone >= previousStone, "scheduled mining never removes previous stone");
    assert.equal(state.skills.mining.xp - previousMiningXP,
      HOUR_MS / ACTIVITIES.mining.durationMs * ACTIVITIES.mining.xp,
      "finite mining performs exactly the configured number of full work cycles");
    assert.equal(state.transition.phase, "moving");
    assert.equal(elements.get("transitionPhase").textContent, "Moving to new location");
    assert.deepEqual(state.wagons, [{ activity: "meditation", plannedMs: null }]);
    now += ZONE_TRAVEL_MS;
    tick();
    assert.equal(elements.get("transitionPhase").textContent, "Getting ready to start new activity");
    now += PREPARATION_MS;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "meditation");
    assert.equal(state.transition, null);
    const stoneAfterTravel = state.items.stone;
    now += ACTIVITIES.meditation.durationMs * 2;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.ok(state.skills.meditation.xp > 0);
    assert.equal(state.items.stone, stoneAfterTravel, "meditation does not create resources");
    assert.ok(elements.get("logList").children.some(x => x.textContent === "Practised meditation."));

    // Add a third wagon, reorder only future wagons, and edit a finite slot.
    openActivities.fire("click");
    categories[0].fire("click");
    const hunting = elements.get("activityChoices").children.find(
      b => b.children[0]?.children[0]?.children[0]?.textContent === "Hunting");
    hunting.children[0].children[0].children[1].fire("click");
    elements.get("queueConfirm").fire("click");
    openActivities.fire("click");
    categories[0].fire("click");
    const masonry = elements.get("activityChoices").children.find(
      b => b.children[0]?.children[0]?.children[0]?.textContent === "Masonry");
    masonry.children[0].children[0].children[1].fire("click");
    elements.get("queueConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.wagons.length, 3);
    assert.equal(elements.get("wagonList").children.length, 3);
    assert.equal(hunting.children[0].children[0].children[1].textContent, "Queued");
    assert.equal(masonry.children[0].children[0].children[1].textContent, "Queued");
    const secondCard = elements.get("wagonList").children[1];
    const secondControls = secondCard.children[secondCard.children.length - 1];
    secondControls.children[1].fire("click"); // move hunting later (future-only swap)
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons.map(w => w.activity), ["meditation", "masonry", "hunting"]);
    assert.equal(state.activity, "meditation");
    assert.equal(state.transition, null, "future-only swap does not restart travel");

    // The first visible finite slot can be edited via touch-friendly selects.
    const firstCard = elements.get("wagonList").children[0];
    const durationControls = firstCard.children[3];
    durationControls.children[1].value = "2";
    durationControls.children[1].fire("change");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.wagons[0].plannedMs, 2 * HOUR_MS);
    assert.equal(state.productiveElapsedMs, 0);
    assert.equal(elements.get("wagonList").children.length, 3);

    // Removing the final future wagon does not interrupt the current activity.
    const finalCard = elements.get("wagonList").children[2];
    finalCard.children[finalCard.children.length - 1].children[0].fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons.map(w => w.activity), ["meditation", "masonry"]);
    assert.equal(state.wagons[1].plannedMs, null);
    assert.equal(state.activity, "meditation");
    elements.get("nameInput").value = "The Black Rider";
    elements.get("saveName").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.name, "The Black Rider");
    assert.equal(elements.get("character-heading").textContent, "The Black Rider");
  } finally {
    Date.now = originalNow;
    Math.random = originalRandom;
    delete globalThis.document;
    delete globalThis.localStorage;
    delete globalThis.window;
  }
});
