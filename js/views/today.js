import { icon } from "../icons.js";
import { todayISO, dayOfSprint, weekdayName, formatLong, isOfficeDay, dailyBudgetMinutes } from "../dates.js";
import { getTodayWorkout, getOpenMilestones, getDailyLoggedMinutes } from "../taskEngine.js";
import { activeWeek, addItem, toggleItemDone } from "../weeklyTodos.js";
import { uid } from "../store.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function checklistItemHtml(id, text, checked, badge) {
  return `
    <div class="task-item ${checked ? "checked" : ""}" data-item-id="${id}">
      <div class="checkbox">${icon("check")}</div>
      <div class="task-text">${escapeHtml(text)}${badge ? `<span class="badge muted" style="margin-left:6px;">For: ${escapeHtml(badge)}</span>` : ""}</div>
    </div>`;
}

function fmtHours(minutes) {
  return (minutes / 60).toFixed(1).replace(/\.0$/, "");
}

export function render(container, ctx) {
  const { state, update } = ctx;
  const iso = todayISO(state);
  const dayNum = dayOfSprint(state, iso);
  const wd = weekdayName(iso);

  if (dayNum > 30) {
    container.innerHTML = `<div class="card"><div class="empty-hint"><div class="big">🏁</div>Your 30-day sprint is complete!<br/>Check the Progress tab for your full history, or update the sprint start date in Settings to begin a new cycle.</div></div>`;
    return;
  }
  if (dayNum < 1) {
    container.innerHTML = `<div class="card"><div class="empty-hint">Your sprint starts on ${formatLong(state.meta.startDate)}. Adjust the start date in Settings if needed.</div></div>`;
    return;
  }

  const office = isOfficeDay(iso);
  const goalMinutes = dailyBudgetMinutes(iso);
  const loggedMinutes = getDailyLoggedMinutes(state, iso);
  const sittings = state.timeLog[iso]?.sittings || [];
  const pct = goalMinutes > 0 ? Math.min(100, Math.round((loggedMinutes / goalMinutes) * 100)) : 0;

  const jpWeek = activeWeek(state.jobPrepWeeks, iso);
  const jpItems = jpWeek ? jpWeek.items.filter((i) => !i.done) : [];
  const jpDone = jpWeek ? jpWeek.items.filter((i) => i.done).length : 0;
  const jpTotal = jpWeek ? jpWeek.items.length : 0;

  const workout = getTodayWorkout(state, iso);
  const gc = state.gymCompletion[iso] || { warmup: {}, cooldown: {}, rest: {} };

  const milestones = getOpenMilestones(state);
  const milestoneById = Object.fromEntries((state.demoProject.milestones || []).map((m) => [m.id, m]));

  container.innerHTML = `
    <div class="priority-callout">
      <div class="pc-label">${icon("target")} ${office ? "Office Day" : "Holiday"}</div>
      <div style="font-size:14px; margin-top:6px;">${office ? "Goal: 3 hours of job prep after work." : "Goal: 8 hours of job prep. Also your one rest day from the gym."}</div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">${icon("progress")} Your Hours Today</div>
        <span class="badge muted">${fmtHours(loggedMinutes)}h of ${fmtHours(goalMinutes)}h</span>
      </div>
      <div class="progress-track" style="margin-bottom:12px;"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="task-list" id="sitting-list" style="margin-bottom:10px;">
        ${sittings.length === 0 ? `<div class="card-sub">No hours logged yet today.</div>` : sittings.map((s) => sittingRow(s)).join("")}
      </div>
      <div class="inline-add">
        <input type="number" id="sitting-input" placeholder="Hours (e.g. 1.5)" step="0.25" min="0.25" />
        <button class="btn primary sm" id="sitting-add-btn">${icon("plus")} Log</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">Job Prep To-Dos</div>
        <span class="badge muted">${jpDone}/${jpTotal} done this week</span>
      </div>
      <div class="task-list" id="jp-list">
        ${jpItems.length === 0 ? `<div class="empty-hint">${jpTotal === 0 ? "No to-dos yet. Add one below, or add a batch in Setup." : "Everything for this week is done!"}</div>` : jpItems.map((it) => checklistItemHtml(it.id, it.text, false, milestoneById[it.milestoneId]?.task)).join("")}
      </div>
      <div class="inline-add">
        <input type="text" id="jp-new-input" placeholder="Add a to-do for this week..." />
        <button class="btn secondary sm" id="jp-add-btn">${icon("plus")}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">${icon("gym")} Fitness - ${wd}</div>
        ${workout.rest ? '<span class="badge rest">Rest Day</span>' : `<span class="badge muted">Week ${workout.weekNumber ?? "?"}</span>`}
      </div>
      ${
        workout.rest
          ? `<div class="card-sub" style="margin-bottom:8px;">Sunday is a scheduled rest day. Optional light activity:</div>
             <div class="task-list" id="rest-list">${workout.optional.map((o) => checklistItemHtml(o.id, o.text, !!gc.rest?.[o.id])).join("")}</div>`
          : `
            <div class="section-label">Warm-up</div>
            <div class="task-list" id="warmup-list">${workout.warmup.map((w) => checklistItemHtml(w.id, w.text, !!gc.warmup?.[w.id])).join("")}</div>
            <div class="section-label">This Week's Workouts</div>
            <div class="task-list" id="gym-item-list">
              ${workout.items.length === 0 ? `<div class="empty-hint">No workouts left this week. Add more in Setup, or enjoy the extra rest.</div>` : workout.items.map((it) => checklistItemHtml(it.id, it.text, false)).join("")}
            </div>
            <div class="inline-add" style="margin-bottom:14px;">
              <input type="text" id="gym-new-input" placeholder="Add a workout for this week..." />
              <button class="btn secondary sm" id="gym-add-btn">${icon("plus")}</button>
            </div>
            <div class="section-label">Cool-down / Stretch</div>
            <div class="task-list" id="cooldown-list">${workout.cooldown.map((c) => checklistItemHtml(c.id, c.text, !!gc.cooldown?.[c.id])).join("")}</div>
          `
      }
    </div>

    <div class="card">
      <div class="card-title">My Project</div>
      <div class="task-list" id="milestone-list">
        ${milestones.length === 0 ? `<div class="empty-hint">No open milestones. Add some in Setup to break your project into steps.</div>` : milestones.map((m) => checklistItemHtml(m.id, m.task, false)).join("")}
      </div>
    </div>

    <div class="card">
      <div class="card-title-row"><div class="card-title">📝 Daily Notes</div></div>
      <div class="field notes-textarea">
        <label>What did I accomplish today?</label>
        <textarea id="note-accomplished" rows="2">${escapeHtml(state.dailyNotes[iso]?.accomplished || "")}</textarea>
      </div>
      <div class="field notes-textarea">
        <label>What blocked me?</label>
        <textarea id="note-blocked" rows="2">${escapeHtml(state.dailyNotes[iso]?.blocked || "")}</textarea>
      </div>
      <div class="field notes-textarea">
        <label>What should I do tomorrow?</label>
        <textarea id="note-tomorrow" rows="2">${escapeHtml(state.dailyNotes[iso]?.tomorrow || "")}</textarea>
      </div>
      <button class="btn primary block" id="save-notes-btn">Save Notes</button>
    </div>
  `;

  // ---- Hours ----
  container.querySelector("#sitting-add-btn").addEventListener("click", () => {
    const input = container.querySelector("#sitting-input");
    const hours = parseFloat(input.value);
    if (!hours || hours <= 0) return;
    update((s) => {
      if (!s.timeLog[iso]) s.timeLog[iso] = { sittings: [] };
      s.timeLog[iso].sittings.push({ id: uid("sit"), minutes: Math.round(hours * 60) });
    });
  });
  container.querySelectorAll("[data-del-sitting]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        s.timeLog[iso].sittings = s.timeLog[iso].sittings.filter((x) => x.id !== btn.dataset.delSitting);
      });
    });
  });

  // ---- Job Prep to-dos ----
  container.querySelectorAll("#jp-list .task-item").forEach((el) => {
    el.addEventListener("click", () => {
      update((s) => {
        toggleItemDone(activeWeek(s.jobPrepWeeks, iso), el.dataset.itemId, iso);
      });
    });
  });
  wireAdd(container, "#jp-add-btn", "#jp-new-input", (s, val) => addItem(activeWeek(s.jobPrepWeeks, iso), val), update);

  // ---- Gym workouts / rest ----
  if (!workout.rest) {
    container.querySelectorAll("#gym-item-list .task-item").forEach((el) => {
      el.addEventListener("click", () => {
        update((s) => {
          toggleItemDone(activeWeek(s.gymWeeks, iso), el.dataset.itemId, iso);
        });
      });
    });
    wireAdd(container, "#gym-add-btn", "#gym-new-input", (s, val) => addItem(activeWeek(s.gymWeeks, iso), val), update);

    container.querySelectorAll("#warmup-list .task-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.itemId;
        update((s) => {
          if (!s.gymCompletion[iso]) s.gymCompletion[iso] = { warmup: {}, cooldown: {}, rest: {} };
          if (!s.gymCompletion[iso].warmup) s.gymCompletion[iso].warmup = {};
          s.gymCompletion[iso].warmup[id] = !s.gymCompletion[iso].warmup[id];
        });
      });
    });
    container.querySelectorAll("#cooldown-list .task-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.itemId;
        update((s) => {
          if (!s.gymCompletion[iso]) s.gymCompletion[iso] = { warmup: {}, cooldown: {}, rest: {} };
          if (!s.gymCompletion[iso].cooldown) s.gymCompletion[iso].cooldown = {};
          s.gymCompletion[iso].cooldown[id] = !s.gymCompletion[iso].cooldown[id];
        });
      });
    });
  } else {
    container.querySelectorAll("#rest-list .task-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.itemId;
        update((s) => {
          if (!s.gymCompletion[iso]) s.gymCompletion[iso] = { warmup: {}, cooldown: {}, rest: {} };
          if (!s.gymCompletion[iso].rest) s.gymCompletion[iso].rest = {};
          s.gymCompletion[iso].rest[id] = !s.gymCompletion[iso].rest[id];
        });
      });
    });
  }

  // ---- Milestones ----
  container.querySelectorAll("#milestone-list .task-item").forEach((el) => {
    el.addEventListener("click", () => {
      update((s) => {
        const m = s.demoProject.milestones.find((x) => x.id === el.dataset.itemId);
        if (m) m.done = !m.done;
      });
    });
  });

  // ---- Notes ----
  container.querySelector("#save-notes-btn").addEventListener("click", () => {
    update((s) => {
      s.dailyNotes[iso] = {
        accomplished: container.querySelector("#note-accomplished").value,
        blocked: container.querySelector("#note-blocked").value,
        tomorrow: container.querySelector("#note-tomorrow").value,
      };
    });
  });
}

function sittingRow(s) {
  return `
    <div class="list-row" style="display:flex; align-items:center; justify-content:space-between; padding:8px 11px;">
      <span>${fmtHours(s.minutes)}h</span>
      <button class="task-remove" data-del-sitting="${s.id}">${icon("trash")}</button>
    </div>`;
}

function wireAdd(container, btnSel, inputSel, onAdd, update) {
  const btn = container.querySelector(btnSel);
  const input = container.querySelector(inputSel);
  const submit = () => {
    const val = input.value.trim();
    if (!val) return;
    update((s) => onAdd(s, val));
  };
  btn.addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}
