import { icon } from "../icons.js";
import { todayISO, addDays } from "../dates.js";
import { activeWeek, lastWeekOf, createWeek, copyWeek, addItem, toggleItemDone, deleteItem } from "../weeklyTodos.js";

let selectedWeek = null;

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function render(container, ctx) {
  const { state, update } = ctx;
  const iso = todayISO(state);
  const weeks = Object.values(state.jobPrepWeeks).sort((a, b) => a.weekNumber - b.weekNumber);

  if (selectedWeek === null || !state.jobPrepWeeks[selectedWeek]) {
    const active = activeWeek(state.jobPrepWeeks, iso);
    selectedWeek = active ? active.weekNumber : weeks[0]?.weekNumber;
  }
  const week = state.jobPrepWeeks[selectedWeek];
  const items = week?.items || [];
  const done = items.filter((i) => i.done).length;

  container.innerHTML = `
    <div class="card">
      <div class="card-title">📋 This Week's Prep Tasks</div>
      <div class="card-sub" style="margin-bottom:10px;">Add whatever job-prep tasks you want to get done this week (apply to jobs, practice coding, message people, work on your project...). Do them in whatever order you like. Start a new week whenever you want a fresh list; old weeks are kept.</div>
      <div class="chip-row">
        ${weeks.map((w) => `<div class="chip week-chip ${w.weekNumber === selectedWeek ? "active" : ""}" data-week="${w.weekNumber}">Week ${w.weekNumber}${weeks.length > 1 ? ` <span class="del-week" data-del-week="${w.weekNumber}">${icon("trash")}</span>` : ""}</div>`).join("")}
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn secondary sm" id="jp-new-week-btn">${icon("plus")} New Week</button>
        <button class="btn secondary sm" id="jp-copy-week-btn">${icon("copy")} Copy Last Week</button>
      </div>
      <div class="field" style="margin-top:12px;">
        <label>Week ${selectedWeek} starts</label>
        <input type="date" id="jp-week-start" value="${week?.startDate || ""}" />
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">Tasks</div>
        <span class="badge muted">${done}/${items.length} done</span>
      </div>
      <div class="task-list" id="jp-item-list">
        ${items.length === 0 ? `<div class="empty-hint">No tasks added yet for this week.</div>` : items.map((it, i) => itemRow(it, i, items.length)).join("")}
      </div>
      <div class="inline-add">
        <input type="text" id="jp-new-input" placeholder="Add a task (e.g. Apply to 3 jobs)" />
        <button class="btn secondary sm" id="jp-add-btn">${icon("plus")}</button>
      </div>
    </div>
  `;

  container.querySelectorAll("[data-week]").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      if (e.target.closest("[data-del-week]")) return;
      selectedWeek = Number(chip.dataset.week);
      update(() => {});
    });
  });
  container.querySelectorAll("[data-del-week]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (weeks.length <= 1) return;
      if (!confirm(`Delete Week ${btn.dataset.delWeek}? This removes its task list.`)) return;
      update((s) => {
        delete s.jobPrepWeeks[btn.dataset.delWeek];
      });
      selectedWeek = null;
    });
  });

  container.querySelector("#jp-new-week-btn").addEventListener("click", () => {
    update((s) => {
      const last = lastWeekOf(s.jobPrepWeeks);
      const startDate = last ? addDays(last.startDate, 7) : iso;
      selectedWeek = createWeek(s.jobPrepWeeks, startDate);
    });
  });
  container.querySelector("#jp-copy-week-btn").addEventListener("click", () => {
    update((s) => {
      const last = lastWeekOf(s.jobPrepWeeks);
      const startDate = last ? addDays(last.startDate, 7) : iso;
      selectedWeek = copyWeek(s.jobPrepWeeks, startDate);
    });
  });
  container.querySelector("#jp-week-start").addEventListener("change", (e) => {
    update((s) => {
      s.jobPrepWeeks[selectedWeek].startDate = e.target.value;
    });
  });

  const addBtn = container.querySelector("#jp-add-btn");
  const input = container.querySelector("#jp-new-input");
  const submit = () => {
    const val = input.value.trim();
    if (!val) return;
    update((s) => {
      addItem(s.jobPrepWeeks[selectedWeek], val);
    });
  };
  addBtn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  container.querySelectorAll("[data-toggle-item]").forEach((el) => {
    el.addEventListener("click", () => {
      update((s) => {
        toggleItemDone(s.jobPrepWeeks[selectedWeek], el.dataset.toggleItem, todayISO(s));
      });
    });
  });
  container.querySelectorAll("[data-del-item]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        deleteItem(s.jobPrepWeeks[selectedWeek], btn.dataset.delItem);
      });
    });
  });
  container.querySelectorAll("[data-move-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        const arr = s.jobPrepWeeks[selectedWeek].items;
        const idx = arr.findIndex((i) => i.id === btn.dataset.moveUp);
        if (idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      });
    });
  });
  container.querySelectorAll("[data-move-down]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        const arr = s.jobPrepWeeks[selectedWeek].items;
        const idx = arr.findIndex((i) => i.id === btn.dataset.moveDown);
        if (idx < arr.length - 1) [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      });
    });
  });
}

function itemRow(it, i, total) {
  return `
    <div class="list-row" style="display:flex; align-items:center; gap:8px; padding:8px 10px;">
      <div class="reorder-btns">
        <button data-move-up="${it.id}" ${i === 0 ? "disabled" : ""}>${icon("up")}</button>
        <button data-move-down="${it.id}" ${i === total - 1 ? "disabled" : ""}>${icon("down")}</button>
      </div>
      <div class="task-item ${it.done ? "checked" : ""}" data-toggle-item="${it.id}" style="background:none; border:none; padding:0; flex:1;">
        <div class="checkbox">${icon("check")}</div>
        <div class="task-text">${escapeHtml(it.text)}</div>
      </div>
      <button class="task-remove" data-del-item="${it.id}">${icon("trash")}</button>
    </div>`;
}
