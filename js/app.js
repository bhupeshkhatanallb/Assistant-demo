import * as store from "./store.js";
import { icon } from "./icons.js";
import { todayISO, dayOfSprint, formatLong } from "./dates.js";
import { computeStreak, computeSprintProgress, computeDayCompletion } from "./taskEngine.js";
import { openSettingsModal, applyTheme } from "./views/settings.js";

import * as todayView from "./views/today.js";
import * as planView from "./views/plan.js";
import * as projectView from "./views/project.js";
import * as gymView from "./views/gym.js";
import * as jobsView from "./views/jobs.js";
import * as progressView from "./views/progress.js";

const TABS = [
  { id: "today", label: "Today", icon: "today" },
  { id: "plan", label: "Plan", icon: "plan" },
  { id: "project", label: "Project", icon: "project" },
  { id: "gym", label: "Gym", icon: "gym" },
  { id: "jobs", label: "Jobs", icon: "jobs" },
  { id: "progress", label: "Progress", icon: "progress" },
];

const VIEWS = {
  today: todayView,
  plan: planView,
  project: projectView,
  gym: gymView,
  jobs: jobsView,
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
}

const ctx = { get state() { return state; }, update };

function renderHeader() {
  const iso = todayISO(state);
  const dayNum = dayOfSprint(state, iso);
  const clampedDay = Math.max(1, Math.min(30, dayNum));
  const streak = computeStreak(state);
  const sprintPct = Math.round(computeSprintProgress(state) * 100);
  const todayComp = computeDayCompletion(state, iso, clampedDay);
  const todayPct = todayComp.overall.total > 0 ? Math.round(todayComp.overall.pct * 100) : 0;

  headerEl.innerHTML = `
    <div class="header-top">
      <div>
        <div class="header-title">Day ${clampedDay} / 30</div>
        <div class="header-date">${formatLong(iso)}</div>
      </div>
      <button class="icon-btn" id="settings-btn">${icon("settings")}</button>
    </div>
    <div class="stat-row">
      <div class="stat-chip"><div class="val">${sprintPct}%</div><div class="lbl">Sprint</div></div>
      <div class="stat-chip"><div class="val">${todayPct}%</div><div class="lbl">Today</div></div>
      <div class="stat-chip streak"><div class="val">🔥${streak}</div><div class="lbl">Streak</div></div>
      <div class="stat-chip"><div class="val">${todayComp.career.done}/${todayComp.career.total}</div><div class="lbl">Career</div></div>
      <div class="stat-chip"><div class="val">${todayComp.demo.done}/${todayComp.demo.total}</div><div class="lbl">Demo</div></div>
      <div class="stat-chip"><div class="val">${todayComp.gym.isRest ? "Rest" : `${todayComp.gym.done}/${todayComp.gym.total}`}</div><div class="lbl">Gym</div></div>
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
  window.scrollTo({ top: window.scrollY }); // no-op, keeps scroll position stable across rerenders
}

applyTheme(state.meta.theme);
renderAll();
