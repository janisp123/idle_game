import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { combatAtTime, BOUT_MS } from "../site/play/combat.mjs";
import { combatArtworkForEvent } from "../site/play/combat-art.mjs";
import { combatFlowState } from "../site/play/combat-flow.mjs";
import { combatReadoutForEvent, workReadoutForReport } from "../site/play/result-readout.mjs";
import { newGame, SCHEDULE_BALANCE, ACTIVITIES, ITEM_KEYS, SAVE_KEY, ZONE_TRAVEL_MS, PREPARATION_MS, INITIAL_PREPARATION_MS, MINUTE_MS, HOUR_MS, UNTIL_LEVEL_UP, xpToNextLevel } from "../site/play/engine.mjs";

test("the final recovery tick leads into a fresh arena bout", () => {
  const session = { seed: 42, elapsedMs: BOUT_MS - 1,
    player: { name: "Knight", loadout: "greatsword", str: 10, dex: 10, end: 10, skill: 1 } };
  const finalBout = combatAtTime(session);
  assert.equal(combatFlowState(finalBout).current, 3);
  const next = combatAtTime({ ...session, elapsedMs: BOUT_MS });
  assert.equal(next.event.type, "engage");
  assert.equal(combatFlowState(next).current, 0);
});
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

test("compact results use only real event/report values and correct combat side", () => {
  assert.deepEqual(combatReadoutForEvent({type:"strike",actor:"player",target:"enemy",damage:24}),
    {player:[],enemy:[{value:"-24",tone:"damage",label:"HP"}]});
  assert.deepEqual(combatReadoutForEvent({type:"wound",actor:"enemy",target:"player",damage:17}),
    {player:[{value:"-17",tone:"damage",label:"HP"}],enemy:[]});
  for (const [type,value] of [["dodge","DODGED"],["parry","PARRIED"],["block","BLOCKED"]]) {
    assert.deepEqual(combatReadoutForEvent({type,actor:"enemy",target:"player",damage:0}),
      {player:[{value,tone:"guard",label:""}],enemy:[]});
  }
  for(const [type,label] of [["block","BLOCKED"],["parry","PARRIED"]]) {
    assert.deepEqual(combatReadoutForEvent({type,actor:"enemy",target:"player",
      damage:6,hpAfter:24}),{
      player:[{value:label,tone:"guard",label:""},
        {value:"-6",tone:"damage",label:"HP"}],
      enemy:[]},type+" chip damage must show both defense and red HP on the defender");
    assert.deepEqual(combatReadoutForEvent({type,actor:"player",target:"enemy",
      damage:2,hpAfter:28}),{
      player:[],enemy:[{value:label,tone:"guard",label:""},
        {value:"-2",tone:"damage",label:"HP"}]
    },type+" damage goes on opponent side, not the attacker");
  }
  assert.deepEqual(combatReadoutForEvent({type:"dodge",actor:"enemy",
    target:"player",damage:0}),{
    player:[{value:"DODGED",tone:"guard",label:""}],enemy:[]},
    "dodge remains zero damage");
  assert.deepEqual(combatReadoutForEvent({type:"miss",actor:"enemy",target:"player",damage:0}),
    {player:[],enemy:[{value:"MISSED",tone:"guard",label:""}]});
  assert.deepEqual(combatReadoutForEvent({type:"finisher",actor:"player",target:"enemy",hpAfter:0,damage:0}),
    {player:[],enemy:[{value:"FINISHED",tone:"damage",label:""}]},
    "finisher has no quantified damage: never invent a -HP number");
  assert.deepEqual(combatReadoutForEvent({type:"strike",actor:"player",target:"enemy",
    damage:20,heals:{player:8}}),{
    player:[{value:"+8",tone:"gain",label:"HP"}],
    enemy:[{value:"-20",tone:"damage",label:"HP"}]
  },"future genuine damage+healing events fit on independent sides");
  assert.deepEqual(combatReadoutForEvent({type:"engage",damage:0}),{player:[],enemy:[]});
  assert.deepEqual(combatReadoutForEvent({type:"strike",target:"enemy",damage:0}),
    {player:[],enemy:[]},"never invent zero or unsuccessful damage");

  const labels={stone:"Stone",copper_ore:"Copper ore",log:"Logs"};
  const tasks={mining:{title:"Mining"},carpentry:{title:"Carpentry"}};
  assert.deepEqual(workReadoutForReport({activity:"mining",completed:1,items:{stone:23,copper_ore:2},
    gainedXP:4,consumed:{}},labels,tasks),{activity:"mining",title:"Mining",tokens:[
    {value:"+23",tone:"gain",label:"Stone"},
    {value:"+2",tone:"gain",label:"Copper ore"},
    {value:"+4",tone:"gain",label:"XP"}
  ]});
  assert.deepEqual(workReadoutForReport({activity:"carpentry",completed:1,
    items:{},consumed:{log:3},gainedXP:0},labels,tasks).tokens,
    [{value:"-3",tone:"damage",label:"Logs"}]);
  assert.deepEqual(workReadoutForReport({activity:"mining",completed:1,items:{},gainedXP:0},
    labels,tasks).tokens,[{value:"NO NEW GAINS",tone:"neutral",label:""}],
    "no drops is not falsely labelled a failed mining action");
  assert.equal(workReadoutForReport({activity:"mining",completed:0,items:{},gainedXP:0},
    labels,tasks),null,"a cycle with no resolved output is not an invented failure");
  assert.equal(workReadoutForReport({activity:"fighting",completed:1,gainedXP:2},labels,tasks),null,
    "fighting uses the real combat event result, not a fake loot readout");
});

test("real browser-app entrypoint renders skill UI and reloads a current saved character", async () => {
  const html = readFileSync(new URL("../site/play/index.html", import.meta.url), "utf8");
  const queueCss = readFileSync(new URL("../site/play/iron-ui.css", import.meta.url), "utf8");
  assert.match(html, /id="characterAttributes"/, "three visible stats belong to the character panel");
  assert.match(html, /id="combatPanel"/, "only combat receives a dedicated event panel");
  for (const oldCopy of ["Early prototype.", "Use ▶ to start now", "Attribute growth is uncapped",
    "STR Strength · DEX Dexterity", "No overall character level"]) {
    assert.ok(!html.includes(oldCopy), "remove redundant mobile tutorial text: " + oldCopy);
  }
  assert.doesNotMatch(html, /id="combatDice|id="playerDie/);
  assert.match(html, /id="combatFlow"/, "the fighting action timeline sits below the illustration");
  assert.ok(html.indexOf('id="combatFlow"') > html.indexOf('id="sceneImage"'));
  assert.ok(html.indexOf('id="combatFlow"') < html.indexOf('id="scene-heading"'));
  assert.match(queueCss, /\.combat-flow-step\[data-state="active"\]/,
    "current combat action has a distinct highlighted state");
  assert.match(html, /id="weaponSlots"/,
    "weapon selection is now an engraved two-card equipment group");
  assert.doesNotMatch(html,/id="combatLoadout"/,
    "remove the old separate weapon dropdown that did not display enchant ranks");
  assert.match(html, /<details id="alphaTools"/,
    "alpha tools must fold away rather than occupy normal phone space");
  for(const id of ["alphaReset","alphaDay","alphaSpeed","alphaStatus","alphaMaxStats","alphaCoins","alphaFamily"])
    assert.ok(html.includes('id="' + id + '"'),"alpha control target: "+id);
  assert.match(html, /<button type="button" id="alphaDay" class="alpha-day-button">Test 24 hours idle<\/button>/,
    "24h action is a real button, not a switch");
  assert.doesNotMatch(html, /<input[^>]*id="alphaDay"/,
    "the one-day action must not be a checkbox");
  assert.match(queueCss,/\.alpha-toggle input:checked/,
    "the reset and speed switches retain visible checked states");
  assert.match(queueCss,/\.alpha-day-button\s*\{/,
    "the one-day button has its own compact style");
  assert.match(html, /id="combatSkillsText"/, "the two equipped skills are visible");
  for (const id of ["resultPanel","combatReadout","playerResult","enemyResult",
    "workReadout","workResultTokens","resultNotice"])
    assert.ok(html.includes('id="' + id + '"'),"compact result DOM: " + id);
  assert.doesNotMatch(html,/id="logList"|THE CHRONICLE/,"never retain a scrollable battle log");
  assert.match(queueCss,/\.result-token\[data-tone="damage"\]/);
  assert.match(queueCss,/\.result-token\[data-tone="gain"\]/);
  assert.match(html, /<details id="characterStatsPanel"/);
  assert.match(html, /<details id="armourCabinet"/, "equipment folds away on narrow screens");
  assert.match(html, /id="armourSlots"/);
  assert.match(html, /id="armourChoice"/, "one equipment dropdown handles the active slot");
  assert.match(html,/id="gearStats"/,"aggregate loadout stats appear inside existing compact armour panel");
  for (const id of ["equipmentEditor","itemGrade","itemQuality","smithBuy","coinWallet"])
    assert.ok(html.includes('id="' + id + '"'), id);
  assert.doesNotMatch(html, /Glory Scroll|Enchant/);
  assert.doesNotMatch(html, /id="combatRolls"|id="combatEventText"/,
    "repeated fighting narration and rolls must not appear above Chronicle");
  assert.doesNotMatch(html, /Event-specific illustrations are being commissioned/,
    "real event art is in git, not a future placeholder");
  assert.match(queueCss, /\.combat-panel\.finisher \.combat-event-title/);
  assert.match(queueCss, /\.character-attributes\s*\{[^}]*display:grid/s);
  assert.match(queueCss, /\.activity-choices \.activity-stat-gains/);
  assert.match(queueCss, /\.wagon-list\s*\{[^}]*display:grid/s,
    "the hourglass strip must be a grid, not a horizontally scrolling row");
  assert.doesNotMatch(queueCss, /\.wagon-list\s*\{[^}]*overflow-x:auto/s);
  const appSource = readFileSync(new URL("../site/play/app.mjs", import.meta.url), "utf8");
  assert.match(html, /app\.mjs\?v=cap-001/,
    "new stat UI must invalidate cached app JavaScript");
  assert.doesNotMatch(appSource, /queueMasteryMode/,
    "the app must not reference a removed planner control");
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
  assert.match(queueCss, /\.activity-choices \.activity-title-line\s*\{[^}]*flex-direction:column/s,
    "controls and names must stack vertically");
  assert.match(queueCss, /\.activity-choices \.activity-title-line > strong\s*\{[^}]*order:2/s,
    "name is beneath controls");
  assert.match(queueCss, /\.activity-choices \.activity-actions\s*\{[^}]*order:1/s,
    "controls are first");
  assert.match(queueCss, /\.activity-choices \.activity-actions \.activity-icon-button\s*\{[^}]*width:30px/s,
    "desktop icons remain compact");
  assert.match(html, /iron-ui\.css\?v=char-stats-002/,
    "stat UI stylesheet cache version is changed");
  assert.match(queueCss, /\.activity-choices \.activity-title-line > strong\s*\{[^}]*overflow-wrap:break-word/s,
    "long skill names may wrap rather than be hidden behind controls");
  assert.doesNotMatch(html, /id="queueMasteryMode"/,
    "planner uses only the dropdown, not a duplicate mastery button");
  assert.match(html, /<option value="untilLevelUp">↑ Until LvL Up!<\/option>/,
    "mastery readiness remains available in the planner dropdown");
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
    ...newGame(now), name: "Marauder", unattributedXP: 85,
    items: { ...newGame(now).items, hide: 8, stone: 4 }
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
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key)
  };
  let allowRouteOverride = false;
  let overrideConfirmations = 0;
  let allowMasterTribute = false;
  let masterConfirmations = 0;
  let allowAlphaReset = false;
  let alphaResetConfirmations = 0;
  globalThis.window = {
    addEventListener(event, handler) { handlers.set("window:" + event, handler); },
    setInterval(handler) { tick = handler; },
    confirm(prompt) {
      if (prompt.startsWith("THE MASTER'S DUE")) {
        masterConfirmations++;
        return allowMasterTribute;
      }
      if (prompt.startsWith("RESET ALL PROGRESS?")) {
        alphaResetConfirmations++;
        return allowAlphaReset;
      }
      overrideConfirmations++;
      return allowRouteOverride;
    }
  };
  Date.now = () => now;
  try {
    await import("../site/play/app.mjs?smoke-test");
    assert.deepEqual(elements.get("queueAmount").children.map(option => Number(option.value)),
      Array.from({ length: SCHEDULE_BALANCE.maxDurationUnits - SCHEDULE_BALANCE.minDurationUnits + 1 },
        (_, i) => i + SCHEDULE_BALANCE.minDurationUnits),
      "planner amounts must be populated from engine SCHEDULE_BALANCE");
    assert.doesNotMatch(html, /<option value="8">8<\/option>/,
      "planner must not carry a duplicated static 1..8 range");
    assert.ok(tick, "game tick must start");
    const weaponChoices = elements.get("weaponSlots").children;
    assert.deepEqual(weaponChoices.map(x => x.getAttribute("data-loadout")),
      ["greatsword","sword_shield","hammer","bow","spear"]);
    const armourButtons = elements.get("armourSlots").children;
    assert.deepEqual(armourButtons.map(x => x.getAttribute("data-slot")), ["head","torso","arms","legs"]);
    const selectedCount = () => [...weaponChoices, ...armourButtons]
      .filter(button => button.getAttribute("aria-pressed") === "true").length;
    assert.equal(selectedCount(), 1);
    assert.equal(elements.get("smithBuy").disabled, true);
    assert.equal(elements.get("coinWallet").textContent, "0 coins");
    elements.get("itemGrade").value="7";
    elements.get("itemGrade").fire("change");
    assert.equal(elements.get("smithBuy").disabled,true);
    assert.match(elements.get("smithBuy").textContent,/Fighting 50 required/);
    assert.match(elements.get("expertiseStats").textContent,/40%.*60% penalty/);
    elements.get("itemGrade").value="0";
    elements.get("itemGrade").fire("change");

    const openActivities = elements.get("openActivities");
    const categoryScreen = elements.get("activityCategories");
    const listScreen = elements.get("activityListScreen");
    const categories = elements.get("activityCategoryChoices").children;
    assert.equal(openActivities.hidden, false, "only the compact entrypoint appears initially");
    assert.equal(categoryScreen.hidden, true);
    assert.equal(listScreen.hidden, true);
    assert.deepEqual(categories.map(b => b.textContent),
      ["Fighting", "Survival Work", "Training"]);
    assert.doesNotMatch(html, />Choose a path<|CHOOSE YOUR PATH/i,
      "the redundant choose-a-path heading is removed");
    openActivities.fire("click");
    assert.equal(openActivities.hidden, true);
    assert.equal(categoryScreen.hidden, false);
    categories[0].fire("click");
    assert.equal(elements.get("activityCategoryTitle").textContent, "Fighting");
    const fightingCards = elements.get("activityChoices").children;
    assert.equal(fightingCards.length, 1);
    assert.equal(fightingCards[0].children[0].children[4].children[7].disabled,false,
      "even a fresh player may challenge S opponents");
    assert.equal(elements.get("combatPanel").hidden, true,
      "ordinary activity selection has no simulated fight");
    assert.equal(fightingCards[0].children[0].children[0].children[0].textContent, "Fighting");
    assert.match(fightingCards[0].children[0].children[3].textContent, /STR.*DEX|DEX.*STR/,
      "Fighting shows its stat bonuses");
    elements.get("backToCategories").fire("click");
    categories[2].fire("click");
    assert.equal(elements.get("activityCategoryTitle").textContent, "Training");
    assert.equal(elements.get("activityChoices").children.length, 1);
    assert.equal(elements.get("activityChoices").children[0].children[0].children[0].children[0].textContent, "Training");
    elements.get("backToCategories").fire("click");
    categories[1].fire("click");
    const buttons = elements.get("activityChoices").children.filter(node => node.className === "activity");
    assert.equal(buttons.length, 9, "nine survival activities plus Fighting and Training");
    assert.equal(buttons.every(b => !/\\d+\\s*(min|sec)|per cycle/i.test(
      b.children[0].children[1].textContent
    )), true, "activity buttons must not reveal cycle rates");
    assert.ok(buttons.every(b => b.children[0].children[2].textContent === "Skill level 1"));
    assert.ok(buttons.every(b => b.children[0].children[4].children[7].disabled),"work difficulty remains locked");
    const smithing = buttons.find(b => b.children[0].children[0].children[0].textContent === "Smithing");
    const cooking = buttons.find(b => b.children[0].children[0].children[0].textContent === "Cooking");
    assert.ok(smithing.children[0].children[1].textContent.includes("Iron ingots (uses Iron ore)"));
    assert.ok(cooking.children[0].children[1].textContent.includes("Rations (uses Fish)"));
    assert.equal(elements.get("character-heading").textContent, "Marauder");
    assert.equal(elements.get("visitMaster").disabled, true,
      "Skill Master stays visibly dim until an actual skill can advance");
    assert.equal(elements.get("masterStatus").hidden, true,
      "no readiness tutorial appears above disabled Skill Master");
    const statRows = elements.get("characterAttributes").children;
    assert.equal(statRows.length, 3, "all three attributes render on the character");
    assert.deepEqual(statRows.map(row => row.children[0].textContent),
      ["STR", "DEX", "END"]);
    assert.deepEqual(statRows.map(row => row.children[1].textContent),
      ["10", "10", "10"], "old save starts at baseline stats");
    assert.ok(buttons.every(b => b.children[0].children[3].className === "activity-stat-gains"),
      "every activity displays attribute rewards");
    assert.match(buttons.find(b => b.children[0].children[0].children[0].textContent === "Mining")
      .children[0].children[3].textContent, /STR\+\+.*END\+/,
      "mining displays its configured stat distribution");
    let state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.unattributedXP, 85);
    assert.equal(state.items.hide, 8);
    assert.equal(Object.hasOwn(state, "level"), false);
    assert.equal(Object.hasOwn(state, "totalXP"), false);

    const mining = buttons.find(b => b.children[0].children[0].children[0].textContent === "Mining");
    assert.ok(mining);
    elements.get("backToCategories").fire("click");
    assert.equal(categoryScreen.hidden, false);
    categories[1].fire("click");
    const miningStart = mining.children[0].children[0].children[1].children[0];
    const miningActions = mining.children[0].children[0].children[1];
    assert.deepEqual(miningActions.children.map(button => button.textContent), ["▶","↻","↑"]);
    assert.match(miningStart.getAttribute("aria-label"), /^Start Mining now/);
    assert.match(miningActions.children[1].getAttribute("aria-label"), /Cannot schedule Mining/);
    assert.equal(miningActions.children[1].disabled, true,
      "the first activity must start before future scheduling is available");
    assert.match(miningActions.children[2].getAttribute("aria-label"), /Cannot schedule Mining until level-up readiness/);
    assert.equal(miningActions.children[2].disabled, true);
    assert.equal(mining.children[0].children[0].children[0].textContent, "Mining",
      "full skill name stays in a separate text element");
    assert.equal(mining.children[0].children[2].textContent, "Skill level 1");
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
    assert.equal(elements.get("wagonQueue").hidden, true,
      "a single Forever activity should not waste screen space with a route");
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
    assert.equal(elements.get("combatReadout").hidden,true);
    assert.equal(elements.get("workReadout").hidden,false);
    assert.equal(elements.get("workResultTitle").textContent,"Mining");
    // The first preparation completion legitimately rebuilds the queue card.
    // Capture the mounted Mining label after that transition, then verify
    // productive XP ticks update the same element without remounting.
    miningQueueLabel = elements.get("wagonList").children[0].children[0];
    assert.equal(miningQueueLabel.textContent, "Mining LvL 1,00");
    openActivities.fire("click");
    categories[1].fire("click");
    elements.get("backToCategories").fire("click");
    elements.get("backToActivities").fire("click");
    assert.equal(openActivities.hidden, false);
    assert.equal(JSON.parse(store.get(SAVE_KEY)).activity, "mining",
      "back navigation must not interrupt the active task");

    now += 4 * ACTIVITIES.mining.durationMs;
    tick();
    const miningTokens = elements.get("workResultTokens").children;
    assert.ok(miningTokens.some(t => t.getAttribute("data-tone")==="gain" &&
      t.children[1]?.textContent==="Stone" && /^\+\d+$/.test(t.children[0].textContent)),
      "real gathered stone is displayed in green");
    assert.ok(miningTokens.some(t => t.children[1]?.textContent==="XP" &&
      t.children[0].textContent==="+8"),"four productive mining cycles earn 8 actual XP");
    assert.equal(miningQueueLabel.textContent, "Mining LvL 1,20",
      "queue skill progress updates on every ordinary work tick");
    assert.equal(elements.get("wagonList").children[0].children[0], miningQueueLabel,
      "refresh the title in-place, not the entire card or its focused controls");
    now += 26 * ACTIVITIES.mining.durationMs;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.skills.mining.xp, 40, "the XP bar stops at one level");
    assert.equal(state.skills.mining.level, 1);
    assert.equal(elements.get("skillXp").textContent, "XP full · All rewards paused · Seek the Skill Master");
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
    assert.equal(visitMaster.disabled, false, "a ready skill unlocks the Master");
    visitMaster.fire("click");
    assert.equal(elements.get("masterAudience").hidden, false);
    assert.equal(visitMaster.getAttribute("aria-expanded"), "true");
    assert.ok(elements.get("masterSkills").children.some(row =>
      /Mining: Level 1/.test(row.textContent) && /\+1 STR/.test(row.textContent)),
      "Master previews the exact permanent stat gained by claiming Mining");
    const originalStone = state.items.stone;
    assert.ok(elements.get("masterTribute").children.some(row =>
      row.textContent === originalStone.toLocaleString("en-GB") + " Stone"),
      "trainer previews exact material cost before irreversible sacrifice");
    elements.get("masterConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(masterConfirmations, 1);
    assert.equal(state.skills.mining.level, 1, "declining must not sacrifice inventory");
    assert.equal(elements.get("characterAttributes").children[0].children[1].textContent,
      "10","declining does not award any permanent stat");
    assert.equal(state.items.stone, originalStone);
    allowMasterTribute = true;
    elements.get("masterConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(masterConfirmations, 2);
    assert.deepEqual(state.skills.mining, {level:2,xp:0});
    const firstStat = elements.get("characterAttributes").children.find(row=>
      row.children[0].textContent === "STR");
    assert.ok(firstStat,"character displays STR");
    assert.equal(firstStat.children[1].textContent,"11",
      "confirmed Master claim adds one permanent STR");
    assert.match(firstStat.children[1].title,/\+ 1 from claimed activity levels/,
      "visible stat includes the actual claimed Master bonus");
    assert.equal(miningQueueLabel.textContent, "Mining LvL 2,00",
      "Master advancement updates the queue level and clears percent without rebuilding");
    assert.equal(state.items.stone, 0, "Master takes every stone");
    assert.equal(state.items.hide, 8, "hunting resources stay untouched");
    assert.equal(elements.get("masterAudience").hidden, true);
    assert.equal(visitMaster.disabled, true, "Master dims again after advancement");
    assert.match(mining.children[0].children[1].textContent, /Iron ore/,
      "mining lists its working smithing input");
    const rows = elements.get("resourceList").children.filter(row => row.className === "item");
    assert.equal(rows.length, ITEM_KEYS.length);
    assert.ok(rows.every(row => row.children.length === 2),
      "all resource rows contain only the item name and quantity, with no protection controls");
    assert.ok(rows.every(row => row.children.every(child => child.className !== "resource-lock")));
    assert.equal(Object.hasOwn(state, "protectedItems"), false, "new saves contain no resource locks");
    const hidesRow = rows.find(row => row.children[0]?.textContent === "Hides");
    assert.ok(hidesRow, "hunting spoil must have an inventory row");
    const copperRow = rows.find(row => row.children[0]?.textContent === "Iron ore");
    assert.ok(copperRow, "rare resources must have an inventory row");
    assert.equal(copperRow.hidden, true, "zero inventory quantities remain hidden");
    const stoneRow = rows.find(row => row.children[0]?.textContent === "Stone");
    assert.ok(stoneRow, "construction ingredients still have visible quantities");
    assert.equal(elements.has("returnPanel"), false, "no welcome-back report panel");
    assert.equal(elements.has("dismissReturn"), false, "no popup dismiss control");
    assert.ok(elements.get("workResultTokens").children.some(node =>
      node.getAttribute("data-tone") === "gain" &&
      node.children[1]?.textContent === "Stone"),
      "real mining gains stay compact, not historical sentences");
    assert.equal(elements.has("logList"),false,"no hidden Chronicle survives");

    // The chosen activity receives the requested duration, not Mining.
    openActivities.fire("click");
    categories[2].fire("click");
    const training = elements.get("activityChoices").children.find(
      b => b.children[0]?.children[0]?.children[0]?.textContent === "Training");
    const trainingActions = training.children[0].children[0].children[1];
    const trainingStart = trainingActions.children[0];
    const trainingSchedule = trainingActions.children[1];
    const trainingLevelUp = trainingActions.children[2];
    assert.equal(trainingStart.textContent, "▶");
    assert.equal(trainingSchedule.textContent, "↻");
    assert.equal(trainingLevelUp.textContent, "↑");
    assert.equal(trainingLevelUp.disabled, false);
    // A visible ↑ opens the existing scheduler with mastery readiness selected.
    const routeBeforePlanning = store.get(SAVE_KEY);
    trainingLevelUp.fire("click");
    assert.equal(elements.get("queuePlanner").hidden, false);
    assert.equal(elements.get("queueUnit").value, UNTIL_LEVEL_UP);
    assert.equal(elements.get("queueAmount").hidden, true);
    assert.match(elements.get("queueConfirm").textContent, /LvL Up/);
    // Selecting another dropdown option and then returning to readiness remains safe.
    elements.get("queueUnit").value = "minutes";
    elements.get("queueUnit").fire("change");
    assert.equal(elements.get("queueAmount").hidden, false);
    elements.get("queueUnit").value = UNTIL_LEVEL_UP;
    elements.get("queueUnit").fire("change");
    assert.equal(elements.get("queueAmount").hidden, true);
    elements.get("queueCancel").fire("click");
    assert.equal(elements.get("queuePlanner").hidden, true);
    assert.equal(store.get(SAVE_KEY), routeBeforePlanning,
      "cancelling a proposed level-up schedule never changes the actual queue");
    openActivities.fire("click");
    categories[2].fire("click");
    trainingSchedule.fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining");
    assert.equal(state.transition, null, "planning alone does not interrupt mining");
    assert.equal(elements.get("queuePlanner").hidden, false);
    assert.match(elements.get("queuePlannerTitle").textContent,
      /how long should Training run/i, "new duration is for selected task");
    assert.match(elements.get("queuePlannerHint").textContent,
      /Mining resumes Forever/);
    // Planner offers mastery readiness without a meaningless numeric count.
    elements.get("queueUnit").value = UNTIL_LEVEL_UP;
    elements.get("queueUnit").fire("change");
    assert.equal(elements.get("queueAmount").hidden, true);
    assert.equal(elements.get("queueAmountLabel").hidden, true);
    assert.match(elements.get("queuePlannerHint").textContent, /full XP bar/);
    assert.match(elements.get("queueConfirm").textContent, /LvL Up/);
    elements.get("queueUnit").value = "minutes";
    elements.get("queueUnit").fire("change");
    assert.equal(elements.get("queueAmount").hidden, false);
    assert.equal(elements.get("queueAmountLabel").hidden, false);
    elements.get("queueAmount").value = "1";
    elements.get("queueConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [
      { activity: "training", plannedMs: MINUTE_MS },
      { activity: "mining", plannedMs: null }
    ]);
    assert.equal(state.transition.targetActivity, "training");
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
    assert.equal(state.activity, "training");
    assert.equal(state.productiveElapsedMs, 0);
    const activeTrainingMeter = elements.get("wagonList").children[0].children.find(
      c => c.className === "hourglass-schedule-progress");
    assert.equal(activeTrainingMeter.hidden, false);
    now += MINUTE_MS / 2;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.productiveElapsedMs, MINUTE_MS / 2);
    assert.equal(activeTrainingMeter.getAttribute("aria-valuenow"), "50");
    assert.equal(activeTrainingMeter.children[0].style.width, "50.00%");
    now += MINUTE_MS / 2;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [{ activity: "mining", plannedMs: null }]);
    assert.equal(state.transition.phase, "moving");
    assert.ok(state.skills.training.xp > 0);
    now += ZONE_TRAVEL_MS + PREPARATION_MS;
    tick();
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.activity, "mining", "Mining resumes Forever only after Training's minute");
    assert.equal(state.transition, null);
    assert.equal(elements.get("workResultTitle").textContent,"Mining",
      "after returning to Mining, do not display an old Training result");

    // Build a three-hourglass route: Hunting now (1 minute), Construction next
    // (2 minutes), Mining Forever. Future schedule must not stop Hunting.
    openActivities.fire("click");
    categories[1].fire("click");
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
    categories[1].fire("click");
    const construction = elements.get("activityChoices").children.find(
      b => b.children[0]?.children[0]?.children[0]?.textContent === "Construction");
    const constructionActions = construction.children[0].children[0].children[1];
    constructionActions.children[1].fire("click");
    assert.match(elements.get("queuePlannerTitle").textContent, /Construction run/);
    assert.match(elements.get("queuePlannerHint").textContent,
      /after Hunting finishes/);
    elements.get("queueAmount").value = "2";
    elements.get("queueUnit").value = "minutes";
    elements.get("queueConfirm").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [
      { activity: "hunting", plannedMs: MINUTE_MS },
      { activity: "construction", plannedMs: 2 * MINUTE_MS },
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
      ["Hunting", "Construction", "Mining"]);
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
    assert.equal(constructionActions.children[1].textContent, "↻");
    assert.equal(constructionActions.children[1].disabled, true);
    assert.equal(constructionActions.children[2].textContent, "↑");
    assert.equal(constructionActions.children[2].disabled, true);

    // Mastery condition is selectable directly on a future compact queue card.
    const futureDuration = elements.get("wagonList").children[1].children[3];
    futureDuration.children[2].value = UNTIL_LEVEL_UP;
    futureDuration.children[2].fire("change");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.wagons[1].plannedMs, UNTIL_LEVEL_UP);
    const masteryDuration = elements.get("wagonList").children[1].children[3];
    assert.equal(masteryDuration.children[1].hidden, true);
    assert.equal(masteryDuration.children[2].value, UNTIL_LEVEL_UP);
    assert.equal(masteryDuration.children[0].textContent, "Until");
    // A timed slot can be corrected to readiness directly in its queue card,
    // and its persisted plan is the readiness sentinel (never a time estimate).
    const masteryChoice = elements.get("wagonList").children[1].children[3];
    masteryChoice.children[2].value = "minutes";
    masteryChoice.children[2].fire("change");
    const timedChoice = elements.get("wagonList").children[1].children[3];
    assert.equal(timedChoice.children[0].children[0].hidden, false);
    timedChoice.children[0].children[0].fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.wagons[1].plannedMs, UNTIL_LEVEL_UP);
    const updatedMastery = elements.get("wagonList").children[1].children[3];
    assert.equal(updatedMastery.children[0].textContent, "Until");
    assert.equal(updatedMastery.children[0].children[0].hidden, true);
    assert.equal(updatedMastery.children[1].hidden, true);
    assert.equal(updatedMastery.children[2].value, UNTIL_LEVEL_UP);
    // Return the future task to its original two-minute duration for regression coverage.
    masteryDuration.children[2].value = "minutes";
    masteryDuration.children[2].fire("change");
    const restoredDuration = elements.get("wagonList").children[1].children[3];
    restoredDuration.children[1].value = "2";
    restoredDuration.children[1].fire("change");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.wagons[1].plannedMs, 2 * MINUTE_MS);

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
    assert.deepEqual(state.wagons.map(w => w.activity), ["hunting", "mining", "construction"]);
    assert.equal(state.wagons[1].plannedMs, 2 * MINUTE_MS);
    assert.equal(state.activity, "hunting");
    assert.equal(state.transition, null);
    assert.equal(state.productiveElapsedMs, MINUTE_MS / 2);

    // Editing current duration resets its *planned* window from the edit.
    const firstCard = elements.get("wagonList").children[0];
    const durationControls = firstCard.children.find(c => c.className === "wagon-duration");
    durationControls.children[2].value = UNTIL_LEVEL_UP;
    durationControls.children[2].fire("change");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.wagons[0].plannedMs, UNTIL_LEVEL_UP);
    const masteryMeter = elements.get("wagonList").children[0].children[2];
    assert.match(masteryMeter.getAttribute("aria-label"), /Skill Master readiness/);
    assert.equal(state.productiveElapsedMs, 0);
    // Restore a finite window: changing the stop type takes effect immediately.
    const afterMastery = elements.get("wagonList").children[0].children[3];
    afterMastery.children[2].value = "minutes";
    afterMastery.children[2].fire("change");
    const afterMinutes = elements.get("wagonList").children[0].children[3];
    afterMinutes.children[1].value = "2";
    afterMinutes.children[1].fire("change");
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
    categories[1].fire("click");
    const savedRoute = JSON.stringify(state.wagons);
    constructionActions.children[0].fire("click");
    assert.equal(overrideConfirmations, 1);
    assert.equal(JSON.stringify(JSON.parse(store.get(SAVE_KEY)).wagons), savedRoute);
    const earnedHuntingXP = state.skills.hunting.xp;
    const previousItems = { ...state.items };
    allowRouteOverride = true;
    constructionActions.children[0].fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(state.wagons, [{ activity: "construction", plannedMs: null }]);
    assert.equal(state.transition.targetActivity, "construction");
    assert.equal(state.skills.hunting.xp, earnedHuntingXP);
    assert.deepEqual(state.items, previousItems);
    elements.get("nameInput").value = "The Black Rider";
    elements.get("saveName").fire("click");
    state = JSON.parse(store.get(SAVE_KEY));
    assert.equal(state.name, "The Black Rider");
    assert.equal(elements.get("character-heading").textContent, "The Black Rider");

    // A real running Fighting session (rather than a selected activity card)
    // displays the simulated result after productive time has passed.
    const fighting = newGame(now);
    fighting.name = "The Black Rider";
    fighting.activity = "fighting";
    fighting.wagons = [{ activity: "fighting", plannedMs: null }];
    const json = JSON.stringify(fighting);
    store.set(SAVE_KEY, json);
    handlers.get("window:storage")({ key: SAVE_KEY, newValue: json });
    assert.equal(elements.get("combatPanel").hidden, true,
      "no combat events are shown before the first fighting interval");
    now += 1;
    tick();
    handlers.get("window:pagehide")();
    const arena = JSON.parse(store.get(SAVE_KEY));
    assert.ok(arena.combatSession && arena.combatSession.elapsedMs === 1);
    assert.equal(elements.get("combatPanel").hidden,false);
    assert.equal(elements.get("combatFlow").hidden,false,
      "real fighting progress is visible immediately beneath the arena picture");
    assert.equal(elements.get("combatFlowLabel0").textContent,"Engage");
    assert.equal(elements.get("activityProgress").hidden,true);
    assert.equal(elements.get("wagonQueue").hidden,true);
    assert.match(elements.get("sceneImage").src,/fight-engage\.webp/);
    now += 8_000;
    tick();
    const resolved = combatAtTime(JSON.parse(store.get(SAVE_KEY)).combatSession);
    const picture = combatArtworkForEvent(resolved.event, "greatsword", resolved.enemyLoadout);
    assert.ok(elements.get("sceneImage").src.includes("/assets/combat/" + picture.asset + ".webp"));
    const displayed = combatReadoutForEvent(resolved.event);
    for (const [side,id] of [["player","playerResult"],["enemy","enemyResult"]]) {
      assert.deepEqual(elements.get(id).children.map(node => ({
        value:node.children[0].textContent, tone:node.getAttribute("data-tone"),
        label:node.children[1]?.textContent ?? ""
      })), displayed[side]);
    }
    assert.equal(arena.skills.fighting.level, 1);
    assert.equal(arena.combatSession.player.loadout,"greatsword");
    const shieldWeapon=weaponChoices.find(x=>x.getAttribute("data-loadout")==="sword_shield");
    shieldWeapon.fire("click");
    const swapped = JSON.parse(store.get(SAVE_KEY));
    assert.equal(swapped.combatLoadout,"sword_shield");
    assert.equal(swapped.combatSession.player.loadout,"greatsword","current bout keeps its style");
    assert.equal(shieldWeapon.getAttribute("aria-pressed"),"true");
    assert.equal(weaponChoices[0].getAttribute("aria-pressed"),"false");
    assert.equal(armourButtons[0].getAttribute("aria-pressed"),"false",
      "choosing weapon clears the previously selected armour slot");
    assert.equal(selectedCount(),1,"one selected slot across both equipment categories");
    assert.equal(elements.get("armourEditor").hidden,true,
      "armour item selector is unavailable while editing weapon");
    assert.match(elements.get("equipmentEditHeading").textContent,/Sword & Shield/);
    assert.match(elements.get("combatSkillsText").textContent,/Thrust.*Shield Block/);
    now += BOUT_MS;
    tick();
    const shieldDuel = JSON.parse(store.get(SAVE_KEY));
    assert.equal(shieldDuel.combatSession.player.loadout,"sword_shield");
    assert.equal(shieldDuel.items.stone,arena.items.stone);
    assert.deepEqual(arena.items, fighting.items,
      "visual combat creates no fabricated loot before an eligible victory completes");
    const wallet = JSON.stringify({ ...shieldDuel, coins: 500 });
    store.set(SAVE_KEY, wallet);
    handlers.get("window:storage")({key:SAVE_KEY,newValue:wallet});
    elements.get("itemQuality").value = "fine";
    elements.get("itemQuality").fire("change");
    elements.get("smithBuy").fire("click");
    const bought = JSON.parse(store.get(SAVE_KEY));
    assert.equal(bought.coins, 380);
    assert.equal(bought.equipment.sword_shield.quality, "fine");
    assert.equal(bought.equipment.greatsword.quality, "poor");
    elements.get("smithBuy").fire("click");
    assert.equal(JSON.parse(store.get(SAVE_KEY)).coins, 380);
    assert.equal(selectedCount(), 1);

    // Alpha Tools: a reset and one-day test are momentary switches, while
    // ×10 is sticky and its companion virtual clock survives reloads.
    assert.equal(elements.get("alphaSpeed").checked,false);
    const mine={...newGame(now),activity:"mining",
      wagons:[{activity:"mining",plannedMs:null}]};
    const mineJson=JSON.stringify(mine);
    store.set(SAVE_KEY,mineJson);
    handlers.get("window:storage")({key:SAVE_KEY,newValue:mineJson});
    elements.get("alphaSpeed").checked=true;
    elements.get("alphaSpeed").fire("change");
    assert.equal(elements.get("alphaSpeed").checked,true);
    assert.equal(JSON.parse(store.get("idle-game-alpha-clock-v1")).speed,10);
    const beforeFast=JSON.parse(store.get(SAVE_KEY)).settledAtMs;
    now+=1000;
    tick();
    const afterFast=JSON.parse(store.get(SAVE_KEY));
    assert.equal(afterFast.settledAtMs-beforeFast,10_000,
      "all mining work must accrue ten times faster while switched on");
    assert.equal(afterFast.skills.mining.level,1);
    elements.get("alphaSpeed").checked=false;
    elements.get("alphaSpeed").fire("change");
    assert.equal(elements.get("alphaSpeed").checked,false);
    assert.equal(JSON.parse(store.get("idle-game-alpha-clock-v1")).speed,1);
    now+=4000;
    tick();
    const afterNormal=JSON.parse(store.get(SAVE_KEY));
    assert.equal(afterNormal.settledAtMs-afterFast.settledAtMs,4000,
      "normal-speed toggle must restore exactly 1x without rewinding");

    elements.get("alphaDay").fire("click");
    const afterDay=JSON.parse(store.get(SAVE_KEY));
    assert.equal(afterDay.settledAtMs-afterNormal.settledAtMs,86_400_000);
    assert.equal(afterDay.skills.mining.level,1,
      "one-day testing may fill but never auto-level the skill");
    assert.equal(afterDay.skills.mining.xp,xpToNextLevel(1),
      "XP must still obey the original per-skill Skill Master cap");
    assert.ok(afterDay.items.stone>0,"one day makes real mine loot");
    assert.equal(JSON.parse(store.get("idle-game-alpha-clock-v1")).speed,1);
    assert.match(elements.get("alphaStatus").textContent,/24 hours/);
    elements.get("alphaDay").fire("click");
    const afterSecondDay=JSON.parse(store.get(SAVE_KEY));
    assert.equal(afterSecondDay.settledAtMs-afterDay.settledAtMs,86_400_000,
      "each button click simulates exactly one additional day");
    assert.equal(afterSecondDay.skills.mining.level,1,
      "repeated 24h clicks still cannot level up automatically");
    assert.equal(elements.get("alphaTools").hidden,false);
    elements.get("alphaFamily").value="leather";
    elements.get("alphaMaxStats").fire("click");
    const benchmark=JSON.parse(store.get(SAVE_KEY));
    assert.equal(benchmark.skills.fighting.level,52);
    assert.equal(benchmark.skills.mining.level,1);
    assert.ok(benchmark.expertise.greatsword>0&&benchmark.expertise.leather>0);
    assert.equal(benchmark.expertise.plate,0);
    assert.equal(benchmark.coins,afterSecondDay.coins);
    assert.deepEqual(benchmark.equipment,afterSecondDay.equipment);
    assert.match(elements.get("alphaStatus").textContent,/TEST ONLY.*six-month/i);
    elements.get("alphaCoins").fire("click");
    elements.get("alphaCoins").fire("click");
    assert.equal(JSON.parse(store.get(SAVE_KEY)).coins,benchmark.coins+200000);
    assert.match(elements.get("alphaStatus").textContent,/TEST ONLY.*100,000/);
    const savedBeforeCancelledReset=store.get(SAVE_KEY);
    elements.get("alphaReset").checked=true;
    elements.get("alphaReset").fire("change");
    assert.equal(elements.get("alphaReset").checked,false);
    assert.equal(alphaResetConfirmations,1);
    assert.equal(store.get(SAVE_KEY),savedBeforeCancelledReset,
      "cancel cannot delete any progress");
    allowAlphaReset=true;
    elements.get("alphaReset").checked=true;
    elements.get("alphaReset").fire("change");
    assert.equal(alphaResetConfirmations,2);
    assert.equal(elements.get("alphaReset").checked,false);
    assert.equal(store.has("idle-game-alpha-clock-v1"),false,
      "full reset removes acceleration and virtual-time offset");
    const reset=JSON.parse(store.get(SAVE_KEY));
    assert.deepEqual(reset,newGame(now),
      "reset restores every starting default including levels, stats, coins and route");
    assert.equal(reset.skills.mining.level,1);
    assert.equal(reset.items.stone,0);
    assert.equal(reset.coins,0);
    assert.equal(elements.get("alphaSpeed").checked,false);
    assert.match(elements.get("alphaStatus").textContent,/Progress reset/);
  } finally {
    Date.now = originalNow;
    Math.random = originalRandom;
    delete globalThis.document;
    delete globalThis.localStorage;
    delete globalThis.window;
  }
});

test("mobile recovery keeps both vital labels and bars aligned at equal widths", {skip:!process.env.GITHUB_ACTIONS}, async()=>{
  const {execFileSync}=await import("node:child_process");
  const fs=await import("node:fs");
  const {tmpdir}=await import("node:os");
  const {join}=await import("node:path");
  const dir=fs.mkdtempSync(join(tmpdir(),"arena-layout-"));
  try {
    const source=fs.readFileSync("site/play/index.html","utf8");
    const panel=source.slice(source.indexOf('<div id="combatReadout"'),source.indexOf('<div id="workReadout"')).replace(' hidden','');
    const css=fs.readFileSync("site/play/iron-ui.css","utf8");
    const page=join(dir,"arena.html");
    fs.writeFileSync(page,`<style>${css}</style>${panel}<script>
      enemyHPText.textContent="Health 129/129 (+129)";
      enemyArmourText.textContent="Armour 118/118 (+118)";
      playerHPText.textContent="Health 82/82";playerArmourText.textContent="Armour 26/26";
      playerWear.textContent="Weapon +8 · 16/16";playerResult.textContent="VICTORY";
      for (const width of [280,320,390]) {
        combatReadout.style.width=width+"px";
        for (const id of ["HP","Armour","HPText","ArmourText"]) {
          const box=side=>document.getElementById(side+id).getBoundingClientRect();
          const a=box("player"), b=box("enemy");
          if(a.width<20 || Math.abs(a.y-b.y)>1 || Math.abs(a.width-b.width)>1) throw Error(id+" misaligned at "+width);
        }
      }
      document.documentElement.dataset.passed="yes";
    </script>`);
    const dom=execFileSync("google-chrome",["--headless","--no-sandbox","--disable-dev-shm-usage","--disable-gpu",
      "--user-data-dir="+join(dir,"profile"),"--dump-dom","file://"+page],{encoding:"utf8",stdio:["ignore","pipe","pipe"],timeout:30000});
    assert.match(dom,/<html data-passed="yes">/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});

test("A5 readout distinguishes actual dominant outcomes without changing events",()=>{
  const event={type:"victory",reason:"knockout",vitals:{player:{hp:85,maxHP:100},enemy:{hp:0,maxHP:100}}};
  const before=structuredClone(event);
  assert.deepEqual(combatReadoutForEvent(event),{player:[{value:"IMPRESSIVE VICTORY",tone:"gain",label:""}],enemy:[]});
  assert.deepEqual(event,before);
  const defeat={...event,type:"defeat",vitals:{player:event.vitals.enemy,enemy:event.vitals.player}};
  assert.deepEqual(combatReadoutForEvent(defeat),{player:[{value:"HUMILIATION",tone:"damage",label:""}],enemy:[]});
  assert.equal(combatReadoutForEvent({...event,reason:"timeout"}).player[0].value,"VICTORY");
});