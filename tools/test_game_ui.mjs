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
    const buttons = elements.get("activityChoices").children.filter(node => node.type === "button");
    assert.equal(buttons.length, Object.keys(ACTIVITIES).length);
    assert.ok(buttons.every(b => b.children[0].children[2].textContent === "Skill level 1"));
    assert.equal(elements.get("character-heading").textContent, "Marauder");
    let state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.unattributedXP, 85);
    assert.equal(state.items.hide, 8);
    assert.equal(Object.hasOwn(state, "level"), false);
    assert.equal(Object.hasOwn(state, "totalXP"), false);

    const mining = buttons.find(b => b.children[0].children[0].textContent === "Mining");
    assert.ok(mining);
    mining.fire("click");
    assert.equal(elements.get("skillTitle").textContent, "Mining");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining");

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
    assert.match(elements.get("returnMessage").textContent, /^You gathered \d+ stone\.$/);
    assert.doesNotMatch(elements.get("returnMessage").textContent, /seconds|hours|XP|actions|cycles/i);

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
