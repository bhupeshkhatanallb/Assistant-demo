import * as store from "./store.js";
import * as dbSync from "./dbSync.js";
import { icon } from "./icons.js";
import { todayISO, dayOfSprint, formatLong } from "./dates.js";
import { computeStreak, computeDayExecution } from "./taskEngine.js";
import { openSettingsModal } from "./views/settings.js";

import * as todayView from "./views/today.js";
import * as setupView from "./views/setup.js";
import * as progressView from "./views/progress.js";

const TABS = [
  { id: "today", label: "Today", icon: "today" },
  { id: "setup", label: "Setup", icon: "project" },
  { id: "progress", label: "Progress", icon: "progress" },
];

const VIEWS = {
  today: todayView,
  setup: setupView,
  progress: progressView,
};

let state = store.load();
let currentTab = state.meta.lastTab && VIEWS[state.meta.lastTab] ? state.meta.lastTab : "today";

const headerEl = document.getElementById("app-header");
const mainEl = document.getElementById("app-main");
const navEl = document.getElementById("app-nav");

function update(mutator) {
  mutator(state);
  store.save(state);
  renderAll();
  dbSync.saveToDb(state);
}

const ctx = { get state() { return state; }, update };

function renderHeader() {
  const iso = todayISO(state);
  const dayNum = dayOfSprint(state, iso);
  const clampedDay = Math.max(1, Math.min(30, dayNum));
  const streak = computeStreak(state);
  const exec = computeDayExecution(state, iso);
  const todayPct = Math.round(exec.pct * 100);
  const hoursDone = (exec.loggedMinutes / 60).toFixed(1).replace(/\.0$/, "");
  const hoursGoal = (exec.goalMinutes / 60).toFixed(1).replace(/\.0$/, "");

  headerEl.innerHTML = `
    <div class="header-top">
      <div>
        <div class="header-title">Day ${clampedDay} / 30</div>
        <div class="header-date">${formatLong(iso)}</div>
      </div>
      <button class="icon-btn" id="settings-btn">${icon("settings")}</button>
    </div>
    <div class="stat-row">
      <div class="stat-chip streak"><div class="val">🔥${streak}</div><div class="lbl">Streak</div></div>
      <div class="stat-chip"><div class="val">${hoursDone}h/${hoursGoal}h</div><div class="lbl">Hours Today</div></div>
      <div class="stat-chip"><div class="val">${todayPct}%</div><div class="lbl">Of Goal</div></div>
    </div>
  `;

  document.getElementById("settings-btn").addEventListener("click", () => openSettingsModal(ctx));
}

function renderNav() {
  navEl.innerHTML = TABS.map(
    (t) => `
    <button class="nav-btn ${t.id === currentTab ? "active" : ""}" data-tab="${t.id}">
      ${icon(t.icon)}
      <span>${t.label}</span>
    </button>`
  ).join("");

  navEl.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTab = btn.dataset.tab;
      update((s) => {
        s.meta.lastTab = currentTab;
      });
    });
  });
}

function renderAll() {
  renderHeader();
  renderNav();
  const view = VIEWS[currentTab];
  view.render(mainEl, ctx);
}

renderAll();

// Reconcile with the durable store once it's reachable: adopt it if it
// already has data, otherwise seed it with what we've got so the store
// exists for next time (and for other devices/tabs).
(async () => {
  const remote = await dbSync.loadFromDb();
  if (remote) {
    state = remote;
    store.save(state);
    currentTab = state.meta.lastTab && VIEWS[state.meta.lastTab] ? state.meta.lastTab : currentTab;
    renderAll();
  } else {
    dbSync.saveToDb(state);
  }

  dbSync.subscribe((remoteState) => {
    state = remoteState;
    store.save(state);
    renderAll();
  });
})();
