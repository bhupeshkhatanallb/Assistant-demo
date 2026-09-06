import { icon } from "../icons.js";
import { uid } from "../store.js";
import { WEEK_ORDER, nextWeekNumber, lastWeek, todayISO, weekdayName, addDays } from "../dates.js";

let selectedWeek = null;
let selectedDay = null;

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function emptyWeekDays() {
  return { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
}

export function render(container, ctx) {
  const { state, update } = ctx;
  const iso = todayISO(state);
  const weeks = Object.values(state.gymPlans).sort((a, b) => a.weekNumber - b.weekNumber);

  if (selectedWeek === null || !state.gymPlans[selectedWeek]) {
    const active = weeks.find((w) => w.startDate <= iso) || weeks[weeks.length - 1];
    selectedWeek = active ? active.weekNumber : weeks[0]?.weekNumber;
  }
  if (selectedDay === null) {
    const wd = weekdayName(iso);
    selectedDay = wd === "Sunday" ? "Monday" : wd;
  }

  const week = state.gymPlans[selectedWeek];

  container.innerHTML = `
    <div class="card">
      <div class="card-title">${icon("gym")} Weekly Gym Plan</div>
      <div class="card-sub" style="margin-bottom:10px;">Configure exercises per weekday. Sunday is always rest. Create a new week whenever your split changes - past weeks and their completion history stay intact.</div>
      <div class="chip-row" id="week-chips">
        ${weeks.map((w) => `<div class="chip week-chip ${w.weekNumber === selectedWeek ? "active" : ""}" data-week="${w.weekNumber}">Week ${w.weekNumber}${weeks.length > 1 ? ` <span class="del-week" data-del-week="${w.weekNumber}">${icon("trash")}</span>` : ""}</div>`).join("")}
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn secondary sm" id="new-week-btn">${icon("plus")} New Week</button>
        <button class="btn secondary sm" id="copy-week-btn">${icon("copy")} Copy Last Week</button>
      </div>
      <div class="field" style="margin-top:12px;">
        <label>Week ${selectedWeek} starts</label>
        <input type="date" id="week-start" value="${week?.startDate || ""}" />
      </div>
    </div>

    <div class="card">
      <div class="day-tabs">
        ${WEEK_ORDER.map((d) => `<div class="day-tab ${d === selectedDay ? "active" : ""} ${d === "Sunday" ? "is-rest" : ""}" data-day="${d}">${d.slice(0, 3)}</div>`).join("")}
      </div>
      ${selectedDay === "Sunday" ? restDayBlock() : exerciseBlock(week, selectedDay)}
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
      if (!confirm(`Delete Week ${btn.dataset.delWeek}? This removes its exercise plan (completion history for past days is kept separately).`)) return;
      update((s) => {
        delete s.gymPlans[btn.dataset.delWeek];
      });
      selectedWeek = null;
    });
  });

  container.querySelector("#new-week-btn").addEventListener("click", () => {
    update((s) => {
      const num = nextWeekNumber(s);
      const last = lastWeek(s);
      const startDate = last ? addDays(last.startDate, 7) : iso;
      s.gymPlans[num] = { weekNumber: num, startDate, days: emptyWeekDays() };
      selectedWeek = num;
    });
  });
  container.querySelector("#copy-week-btn").addEventListener("click", () => {
    update((s) => {
      const num = nextWeekNumber(s);
      const last = lastWeek(s);
      const startDate = last ? addDays(last.startDate, 7) : iso;
      const days = emptyWeekDays();
      if (last) {
        for (const d of WEEK_ORDER) {
          days[d] = (last.days[d] || []).map((ex) => ({ id: uid("ex"), name: ex.name }));
        }
      }
      s.gymPlans[num] = { weekNumber: num, startDate, days };
      selectedWeek = num;
    });
  });
  container.querySelector("#week-start").addEventListener("change", (e) => {
    update((s) => {
      s.gymPlans[selectedWeek].startDate = e.target.value;
    });
  });

  container.querySelectorAll("[data-day]").forEach((tab) => {
    tab.addEventListener("click", () => {
      selectedDay = tab.dataset.day;
      update(() => {});
    });
  });

  if (selectedDay !== "Sunday") wireExerciseBlock(container, ctx, week, selectedDay);
}

function restDayBlock() {
  return `<div class="empty-hint"><div class="big">😴</div>Sunday is always a rest day. No exercises can be added here.</div>`;
}

function exerciseBlock(week, day) {
  const list = week?.days?.[day] || [];
  return `
    <div class="section-label">${day} Exercises</div>
    ${list.length === 0 ? `<div class="empty-hint">No exercises yet for ${day}.</div>` : `
    <div class="task-list" id="exercise-editor-list">
      ${list
        .map(
          (ex, i) => `
        <div class="list-row" style="display:flex; align-items:center; gap:8px; padding:8px 10px;" data-ex-id="${ex.id}">
          <div class="reorder-btns">
            <button data-move-up="${ex.id}" ${i === 0 ? "disabled" : ""}>${icon("up")}</button>
            <button data-move-down="${ex.id}" ${i === list.length - 1 ? "disabled" : ""}>${icon("down")}</button>
          </div>
          <div style="flex:1;">
            <input type="text" data-rename="${ex.id}" value="${escapeHtml(ex.name)}" />
          </div>
          <button class="task-remove" data-del-ex="${ex.id}">${icon("trash")}</button>
        </div>`
        )
        .join("")}
    </div>`}
    <div class="inline-add">
      <input type="text" id="new-exercise-input" placeholder="Add exercise (e.g. Bench Press)" />
      <button class="btn secondary sm" id="add-exercise-btn">${icon("plus")}</button>
    </div>
  `;
}

function wireExerciseBlock(container, ctx, week, day) {
  const { update } = ctx;
  const addBtn = container.querySelector("#add-exercise-btn");
  const input = container.querySelector("#new-exercise-input");
  const submit = () => {
    const val = input.value.trim();
    if (!val) return;
    update((s) => {
      s.gymPlans[selectedWeek].days[day].push({ id: uid("ex"), name: val });
    });
  };
  addBtn?.addEventListener("click", submit);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  container.querySelectorAll("[data-del-ex]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        s.gymPlans[selectedWeek].days[day] = s.gymPlans[selectedWeek].days[day].filter((e) => e.id !== btn.dataset.delEx);
      });
    });
  });
  container.querySelectorAll("[data-rename]").forEach((inp) => {
    inp.addEventListener("change", () => {
      update((s) => {
        const ex = s.gymPlans[selectedWeek].days[day].find((e) => e.id === inp.dataset.rename);
        if (ex) ex.name = inp.value.trim() || ex.name;
      });
    });
  });
  container.querySelectorAll("[data-move-up]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        const arr = s.gymPlans[selectedWeek].days[day];
        const idx = arr.findIndex((e) => e.id === btn.dataset.moveUp);
        if (idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      });
    });
  });
  container.querySelectorAll("[data-move-down]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        const arr = s.gymPlans[selectedWeek].days[day];
        const idx = arr.findIndex((e) => e.id === btn.dataset.moveDown);
        if (idx < arr.length - 1) [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
      });
    });
  });
}
