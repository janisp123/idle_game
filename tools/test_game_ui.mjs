import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACTIVITIES, ITEM_KEYS, SAVE_KEY, ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS, MINUTE_MS, HOUR_MS } from "../site/play/engine.mjs";

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
  const queueCss = readFileSync(new URL("../site/play/iron-ui.css", import.meta.url), "utf8");
  assert.match(queueCss, /\.wagon-list\s*\{[^}]*display:grid/s,
    "the hourglass strip must be a grid, not a horizontally scrolling row");
  assert.doesNotMatch(queueCss, /\.wagon-list\s*\{[^}]*overflow-x:auto/s);
  const appSource = readFileSync(new URL("../site/play/app.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(appSource, /wagon-hourglass|hourglass-amber\.webp/,
    "the route no longer renders image elements");
  const queueStyles = queueCss.slice(queueCss.indexOf("/* QUEUE-002:"));
  assert.ok(queueStyles.length > 100, "queue CSS contract must be present");
  assert.doesNotMatch(queueStyles, /wagon-hourglass|hourglass-amber\.webp|background-image:\s*url/,
    "the queue must not reserve illustration space or use a new card background image");
  assert.match(queueCss, /\.hourglass-schedule-progress/);
  assert.match(queueCss, /grid-template-rows:54px 22px 12px 91px 40px/,
    "five compact aligned rows: name, status, meter, duration, controls");
  assert.match(queueCss, /\.hourglass-progress-spacer\s*\{visibility:hidden\}/,
    "future jobs have only an invisible meter spacer");
  assert.match(queueCss, /\.wagon-name\s*\{[^}]*grid-row:1/s);
  assert.match(queueCss, /\.wagon-controls\s*\{[^}]*grid-row:5/s);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const elements = new Map(ids.map(id => [id, new FakeElement()]));
  // Mirror the hidden HTML attribute in the minimal fake DOM.
  elements.get("masterAudience").hidden = true;
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
  let allowRouteOverride = false;
  let overrideConfirmations = 0;
  let allowMasterTribute = false;
  let masterConfirmations = 0;
  globalThis.window = {
    addEventListener() {},
    setInterval(handler) { tick = handler; },
    confirm(prompt) {
      if (prompt.startsWith("THE MASTER'S DUE")) {
        masterConfirmations++;
        return allowMasterTribute;
      }
      overrideConfirmations++;
      return allowRouteOverride;
    }
  };
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
    const miningStart = mining.children[0].children[0].children[1].children[0];
    assert.equal(miningStart.textContent, "Start now");
    assert.equal(mining.children[0].children[0].children[1].children[1].textContent, "Schedule");
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
    let miningQueueLabel = elements.get("wagonList").children[0].children[0];
    assert.equal(miningQueueLabel.textContent, "Mining LvL 1,00",
      "each queue title includes the current skill level and XP percent");
    assert.match(miningQueueLabel.getAttribute("aria-label"), /skill level 1, 0% toward/);
    assert.equal(elements.get("wagonList").children[0].children[3].textContent, "FOREVER");
    assert.deepEqual(elements.get("wagonList").children[0].children.map(c => c.className), [
      "wagon-name", "wagon-position", "hourglass-progress-spacer",
      "wagon-forever", "wagon-controls"
    ], "the Forever card has five compact rows and no illustration");
    now += INITIAL_PREPARATION_MS;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining");
    assert.equal(state.transition, null);
    assert.equal(elements.get("transitionStatus").hidden, true);
    assert.equal(elements.get("activityProgress").hidden, false);
    assert.equal(elements.get("skillTitle").textContent, "Mining");
    // The first preparation completion legitimately rebuilds the queue card.
    // Capture the mounted Mining label after that transition, then verify
    // productive XP ticks update the same element without remounting.
    miningQueueLabel = elements.get("wagonList").children[0].children[0];
    assert.equal(miningQueueLabel.textContent, "Mining LvL 1,00");
    openActivities.fire("click");
    categories[0].fire("click");
    elements.get("backToCategories").fire("click");
    elements.get("backToActivities").fire("click");
    assert.equal(openActivities.hidden, false);
    assert.equal(JSON.parse(store.get(SAVE_KEY)).activity, "mining",
      "back navigation must not interrupt the active task");

    now += 4 * ACTIVITIES.mining.durationMs;
    tick();
    assert.equal(miningQueueLabel.textContent, "Mining LvL 1,20",
      "queue skill progress updates on every ordinary work tick");
    assert.equal(elements.get("wagonList").children[0].children[0], miningQueueLabel,
      "refresh the title in-place, not the entire card or its focused controls");
    now += 26 * ACTIVITIES.mining.durationMs;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.skills.mining.xp, 40, "the XP bar stops at one level");
    assert.equal(state.skills.mining.level, 1);
    assert.equal(elements.get("skillXp").textContent, "XP full · Seek the Skill Master to advance");
    assert.equal(miningQueueLabel.textContent, "Mining LvL 1,100",
      "at the Master gate show 100% rather than hiding or exceeding the cap");
    assert.match(miningQueueLabel.getAttribute("aria-label"), /visit the Skill Master to advance/);

    document.visibilityState = "hidden";
    handlers.get("visibilitychange")();
    now += ACTIVITIES.mining.durationMs * 2;
    document.visibilityState = "visible";
    handlers.get("visibilitychange")();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.skills.mining.level, 1, "returning never upgrades skills automatically");
    assert.equal(state.skills.mining.xp, 40);
    assert.equal(state.skills.hunting.level, 1);
    assert.doesNotMatch(mining.children[0].children[1].textContent, /Copper ore/,
      "rarer ore must remain locked until the Master teaches the new level");
    const visitMaster = elements.get("visitMaster");
    assert.match(visitMaster.textContent, /1 ready/);
    visitMaster.fire("click");
    assert.equal(elements.get("masterAudience").hidden, false);
    assert.equal(visitMaster.getAttribute("aria-expanded"), "true");
    assert.ok(elements.get("masterSkills").children.some(row => /Mining: Level 1/.test(row.textContent)));
    const originalStone = state.items.stone;
    assert.ok(elements.get("masterTribute").children.some(row =>
      row.textContent === originalStone.toLocaleString("en-GB") + " Stone"),
      "trainer previews exact material cost before irreversible sacrifice");
    elements.get("masterConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(masterConfirmations, 1);
    assert.equal(state.skills.mining.level, 1, "declining must not sacrifice inventory");
    assert.equal(state.items.stone, originalStone);
    allowMasterTribute = true;
    elements.get("masterConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(masterConfirmations, 2);
    assert.deepEqual(state.skills.mining, {level:2,xp:0});
    assert.equal(miningQueueLabel.textContent, "Mining LvL 2,00",
      "Master advancement updates the queue level and clears percent without rebuilding");
    assert.equal(state.items.stone, 0, "Master takes every stone");
    assert.equal(state.items.hide, 8, "hunting resources stay untouched");
    assert.equal(elements.get("masterAudience").hidden, true);
    assert.match(mining.children[0].children[1].textContent, /Copper ore/,
      "the Master's lesson activates new mineral types");
    const rows = elements.get("resourceList").children.filter(row => row.className === "item");
    assert.equal(rows.length, ITEM_KEYS.length);
    assert.ok(rows.every(row => row.children.length === 3 &&
      row.children[2].className === "resource-lock"),
      "every resource, not only recipe ingredients, has a protection toggle");
    const hidesRow = rows.find(row => row.children[0]?.textContent === "Wolf hides");
    assert.ok(hidesRow, "hunting spoil must have an inventory row");
    const hidesReserve = hidesRow.children[2];
    assert.equal(hidesReserve.textContent, "Unprotected");
    assert.equal(hidesReserve.getAttribute("aria-pressed"), "false");
    hidesReserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["hide"]);
    assert.equal(hidesReserve.textContent, "Protected");
    assert.equal(hidesReserve.getAttribute("aria-pressed"), "true");
    assert.match(hidesReserve.title, /Reserved for future use/);
    // A completely unused item category can also be protected when empty.
    const stolenRow = rows.find(row => row.children[0]?.textContent === "Stolen purses");
    assert.ok(stolenRow);
    assert.equal(stolenRow.children[2].textContent, "Unprotected");
    stolenRow.children[2].fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["hide", "stolen_purse"]);
    assert.equal(stolenRow.children[2].textContent, "Protected");
    stolenRow.children[2].fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["hide"]);
    const copperRow = elements.get("resourceList").children.find(row =>
      row.children[0]?.textContent === "Copper ore");
    assert.ok(copperRow, "rare resources must have inventory rows");
    assert.equal(copperRow.hidden, true, "zero inventory quantities remain hidden");
    const reserve = copperRow.children[2];
    assert.ok(reserve, "smelting inputs must have a protection toggle");
    assert.equal(reserve.textContent, "Auto use");
    reserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["hide", "copper_ore"]);
    assert.equal(reserve.textContent, "Protected");
    reserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["hide"]);
    assert.equal(reserve.textContent, "Auto use");
    const stoneRow = elements.get("resourceList").children.find(row =>
      row.children[0]?.textContent === "Stone");
    assert.ok(stoneRow, "masonry ingredients have inventory rows");
    const stoneReserve = stoneRow.children[2];
    assert.ok(stoneReserve, "masonry ingredients can be protected");
    stoneReserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["hide", "stone"]);
    assert.equal(stoneReserve.textContent, "Protected");
    stoneReserve.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.protectedItems, ["hide"]);
    assert.equal(elements.has("returnPanel"), false, "no welcome-back report panel");
    assert.equal(elements.has("dismissReturn"), false, "no popup dismiss control");
    const chronicle = elements.get("logList").children.map(node => node.textContent);
    assert.ok(chronicle.some(line => /^You gathered \d+ stone\.$/.test(line)),
      "return loot is recorded in the chronicle");
    assert.ok(chronicle.every(line => !/Welcome back|seconds|hours|XP|actions|cycles/i.test(line)),
      "no duplicated welcome messages or timers");

    // The chosen activity receives the requested duration, not Mining.
    openActivities.fire("click");
    categories[2].fire("click");
    const meditation = elements.get("activityChoices").children.find(
      b => b.children[0]?.children[0]?.children[0]?.textContent === "Meditation");
    const meditationActions = meditation.children[0].children[0].children[1];
    const meditationStart = meditationActions.children[0];
    const meditationSchedule = meditationActions.children[1];
    assert.equal(meditationStart.textContent, "Start now");
    assert.equal(meditationSchedule.textContent, "Schedule");
    meditationSchedule.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining");
    assert.equal(state.transition, null, "planning alone does not interrupt mining");
    assert.equal(elements.get("queuePlanner").hidden, false);
    assert.match(elements.get("queuePlannerTitle").textContent,
      /how long should Meditation run/i, "new duration is for selected task");
    assert.match(elements.get("queuePlannerHint").textContent,
      /Mining resumes Forever/);
    elements.get("queueAmount").value = "1";
    elements.get("queueUnit").value = "minutes";
    elements.get("queueConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [
      { activity: "meditation", plannedMs: MINUTE_MS },
      { activity: "mining", plannedMs: null }
    ]);
    assert.equal(state.transition.targetActivity, "meditation");
    assert.equal(elements.get("queuePlanner").hidden, true);
    assert.equal(elements.get("wagonList").children.length, 2);
    const changingCard = elements.get("wagonList").children[0];
    const pendingMeter = changingCard.children.find(child =>
      child.className === "hourglass-schedule-progress");
    assert.ok(pendingMeter, "only current finite activity has a progress meter");
    assert.equal(pendingMeter.hidden, true, "do not show work progress while travelling");
    assert.ok(!elements.get("wagonList").children[1].children.some(child =>
      child.className === "hourglass-schedule-progress"), "Forever has no meter");
    assert.deepEqual(elements.get("wagonList").children[1].children.map(c => c.className), [
      "wagon-name", "wagon-position", "hourglass-progress-spacer",
      "wagon-forever", "wagon-controls"
    ], "Forever fallback keeps the compact five-row layout");

    now += ACTIVITIES.mining.durationMs;
    tick();
    assert.equal(elements.get("transitionPhase").textContent, "Moving to new location");
    now += ZONE_TRAVEL_MS + PREPARATION_MS;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "meditation");
    assert.equal(state.productiveElapsedMs, 0);
    const activeMeditationMeter = elements.get("wagonList").children[0].children.find(
      c => c.className === "hourglass-schedule-progress");
    assert.equal(activeMeditationMeter.hidden, false);
    now += MINUTE_MS / 2;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.productiveElapsedMs, MINUTE_MS / 2);
    assert.equal(activeMeditationMeter.getAttribute("aria-valuenow"), "50");
    assert.equal(activeMeditationMeter.children[0].style.width, "50.00%");
    now += MINUTE_MS / 2;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [{ activity: "mining", plannedMs: null }]);
    assert.equal(state.transition.phase, "moving");
    assert.ok(state.skills.meditation.xp > 0);
    now += ZONE_TRAVEL_MS + PREPARATION_MS;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining", "Mining resumes Forever only after Meditation's minute");
    assert.equal(state.transition, null);
    assert.ok(elements.get("logList").children.some(x => x.textContent ===
      "Practised meditation."));

    // Build a three-hourglass route: Hunting now (1 minute), Masonry next
    // (2 minutes), Mining Forever. Future schedule must not stop Hunting.
    openActivities.fire("click");
    categories[0].fire("click");
    const hunting = elements.get("activityChoices").children.find(
      b => b.children[0]?.children[0]?.children[0]?.textContent === "Hunting");
    hunting.children[0].children[0].children[1].children[1].fire("click");
    elements.get("queueConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons.map(w => w.activity), ["hunting", "mining"]);
    now += ACTIVITIES.mining.durationMs + ZONE_TRAVEL_MS + PREPARATION_MS;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "hunting");
    assert.equal(state.transition, null);

    openActivities.fire("click");
    categories[0].fire("click");
    const masonry = elements.get("activityChoices").children.find(
      b => b.children[0]?.children[0]?.children[0]?.textContent === "Masonry");
    const masonryActions = masonry.children[0].children[0].children[1];
    masonryActions.children[1].fire("click");
    assert.match(elements.get("queuePlannerTitle").textContent, /Masonry run/);
    assert.match(elements.get("queuePlannerHint").textContent,
      /after Hunting finishes/);
    elements.get("queueAmount").value = "2";
    elements.get("queueUnit").value = "minutes";
    elements.get("queueConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [
      { activity: "hunting", plannedMs: MINUTE_MS },
      { activity: "masonry", plannedMs: 2 * MINUTE_MS },
      { activity: "mining", plannedMs: null }
    ]);
    assert.equal(state.activity, "hunting", "adding future task does not stop current work");
    assert.equal(state.transition, null);
    assert.equal(elements.get("wagonList").style.gridTemplateColumns,
      "repeat(3, minmax(0, 1fr))", "all three hourglasses fit in the same row");
    const rendered = elements.get("wagonList").children;
    assert.ok(rendered[0].children.some(c => c.className === "hourglass-schedule-progress"));
    assert.ok(!rendered[1].children.some(c => c.className === "hourglass-schedule-progress"));
    assert.ok(!rendered[2].children.some(c => c.className === "hourglass-schedule-progress"));
    assert.deepEqual(rendered.map(card => card.children.length), [5, 5, 5],
      "all three cards share five compact rows, with no artwork row");
    assert.deepEqual(rendered.map(card => card.children[0].className),
      ["wagon-name", "wagon-name", "wagon-name"],
      "titles start together without a blank image area");
    assert.deepEqual(rendered.map(card => card.children[0].textContent.replace(/ LvL .*/, "")),
      ["Hunting", "Masonry", "Mining"]);
    for (const card of rendered) {
      assert.match(card.children[0].textContent, / LvL [1-9]\d*,(?:\d{2}|100)$/,
        "all three cards show the current XP fraction, even queued and Forever slots");
    }
    assert.deepEqual(rendered.map(card => card.children[2].className),
      ["hourglass-schedule-progress", "hourglass-progress-spacer", "hourglass-progress-spacer"],
      "only the running finite task has a real meter");
    assert.deepEqual(rendered.map(card => card.children[3].className),
      ["wagon-duration", "wagon-duration", "wagon-forever"],
      "schedule fields and Forever share one compact row");
    assert.deepEqual(rendered.map(card => card.children[4].className),
      ["wagon-controls", "wagon-controls", "wagon-controls"],
      "all bottom controls remain aligned");
    assert.equal(masonryActions.children[1].textContent, "Queued");

    now += MINUTE_MS / 2;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "hunting");
    assert.equal(state.productiveElapsedMs, MINUTE_MS / 2);
    const activeMeter = elements.get("wagonList").children[0].children.find(
      c => c.className === "hourglass-schedule-progress");
    assert.equal(activeMeter.getAttribute("aria-valuenow"), "50");

    // Only future slots swap freely and inherit the destination's slot length.
    const secondCard = elements.get("wagonList").children[1];
    const secondControls = secondCard.children[secondCard.children.length - 1];
    secondControls.children[1].fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons.map(w => w.activity), ["hunting", "mining", "masonry"]);
    assert.equal(state.wagons[1].plannedMs, 2 * MINUTE_MS);
    assert.equal(state.activity, "hunting");
    assert.equal(state.transition, null);
    assert.equal(state.productiveElapsedMs, MINUTE_MS / 2);

    // Editing current duration resets its *planned* window from the edit.
    const firstCard = elements.get("wagonList").children[0];
    const durationControls = firstCard.children.find(c => c.className === "wagon-duration");
    durationControls.children[1].value = "2";
    durationControls.children[1].fire("change");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.wagons[0].plannedMs, 2 * MINUTE_MS);
    assert.equal(state.productiveElapsedMs, 0);
    assert.equal(elements.get("wagonList").children.length, 3);

    // Removing only the last future task leaves the current one untouched.
    const finalCard = elements.get("wagonList").children[2];
    finalCard.children[finalCard.children.length - 1].children[1].fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons.map(w => w.activity), ["hunting", "mining"]);
    assert.equal(state.wagons[1].plannedMs, null);
    assert.equal(state.activity, "hunting");

    // Start now is available even when a route exists. Declining the explicit
    // replacement confirmation keeps the whole schedule intact.
    openActivities.fire("click");
    categories[0].fire("click");
    const savedRoute = JSON.stringify(state.wagons);
    masonryActions.children[0].fire("click");
    assert.equal(overrideConfirmations, 1);
    assert.equal(JSON.stringify(JSON.parse(store.get(SAVE_KEY)).wagons), savedRoute);
    const earnedHuntingXP = state.skills.hunting.xp;
    const previousItems = { ...state.items };
    allowRouteOverride = true;
    masonryActions.children[0].fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [{ activity: "masonry", plannedMs: null }]);
    assert.equal(state.transition.targetActivity, "masonry");
    assert.equal(state.skills.hunting.xp, earnedHuntingXP);
    assert.deepEqual(state.items, previousItems);
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
