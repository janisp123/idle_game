import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACTIVITIES, SAVE_KEY } from "../site/play/engine.mjs";

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
      ["Honest Work", "Outlaw Path", "Clan Activities", "Other Activities"]);
    openActivities.fire("click");
    assert.equal(openActivities.hidden, true);
    assert.equal(categoryScreen.hidden, false);
    categories[2].fire("click");
    assert.equal(elements.get("activityCategoryTitle").textContent, "Clan Activities");
    assert.equal(elements.get("activityChoices").children[0].textContent, "No activities here yet.");
    elements.get("backToCategories").fire("click");
    assert.equal(categoryScreen.hidden, false);
    categories[1].fire("click");
    let buttons = elements.get("activityChoices").children.filter(node => node.type === "button");
    assert.equal(buttons.length, 10, "outlaw activities live in their own category");
    assert.equal(buttons.some(b => b.children[0].children[0].textContent === "Highway robbery"), true);
    elements.get("backToCategories").fire("click");
    categories[0].fire("click");
    buttons = elements.get("activityChoices").children.filter(node => node.type === "button");
    assert.equal(buttons.length, 10, "honest activities live in their own category");
    assert.equal(buttons.some(b => b.children[0].children[0].textContent === "Highway robbery"), false,
      "outlaw tasks must not leak into Honest Work");
    assert.equal(buttons.every(b => !/\\d+\\s*(min|sec)|per cycle/i.test(
      b.children[0].children[1].textContent
    )), true, "activity buttons must not reveal cycle rates");
    assert.ok(buttons.every(b => b.children[0].children[2].textContent === "Skill level 1"));
    assert.equal(elements.get("character-heading").textContent, "Marauder");
    let state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.unattributedXP, 85);
    assert.equal(state.items.hide, 8);
    assert.equal(Object.hasOwn(state, "level"), false);
    assert.equal(Object.hasOwn(state, "totalXP"), false);

    const mining = buttons.find(b => b.children[0].children[0].textContent === "Mining");
    assert.ok(mining);
    elements.get("backToCategories").fire("click");
    assert.equal(categoryScreen.hidden, false);
    categories[0].fire("click");
    mining.fire("click");
    assert.equal(openActivities.hidden, false, "choosing work closes the picker");
    assert.equal(listScreen.hidden, true);
    assert.equal(elements.get("skillTitle").textContent, "Mining");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining");
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
    assert.equal(elements.has("returnPanel"), false, "no welcome-back report panel");
    assert.equal(elements.has("dismissReturn"), false, "no popup dismiss control");
    const chronicle = elements.get("logList").children.map(node => node.textContent);
    assert.ok(chronicle.some(line => /^You gathered \d+ stone\.$/.test(line)),
      "return loot is recorded in the chronicle");
    assert.ok(chronicle.every(line => !/Welcome back|seconds|hours|XP|actions|cycles/i.test(line)),
      "no duplicated welcome messages or timers");

    elements.get("nameInput").value = "The Black Rider";
    elements.get("saveName").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.name, "The Black Rider");
    assert.equal(elements.get("character-heading").textContent, "The Black Rider");
  } finally {
    Date.now = originalNow;
    delete globalThis.document;
    delete globalThis.localStorage;
    delete globalThis.window;
  }
});
