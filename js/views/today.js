import { icon } from "../icons.js";
import { todayISO, dayOfSprint, weekdayName, formatLong } from "../dates.js";
import { generateCareerTasks, generateDemoTasks, getTodayWorkout, computeDayCompletion, getJobStats, getDemoStats } from "../taskEngine.js";

function taskItemHtml(t, checked, removable) {
  const timeTag = t.minutes ? `<span class="badge muted" style="margin-left:6px;">${t.minutes} min</span>` : "";
  return `
    <div class="task-item ${checked ? "checked" : ""}" data-task-id="${t.id}" data-locked="${t.locked ? "1" : "0"}">
      <div class="checkbox">${icon("check")}</div>
      <div class="task-text">${t.priority ? '<span class="badge priority" style="margin-right:6px;">Priority</span>' : ""}${escapeHtml(t.text)}${timeTag}</div>
      ${removable ? `<button class="task-remove" data-remove-custom="${t.id}">${icon("trash")}</button>` : ""}
    </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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

  const career = generateCareerTasks(state, dayNum, iso);
  const demo = generateDemoTasks(state, dayNum, iso);
  const workout = getTodayWorkout(state, iso);
  const dc = state.dailyCompletion[iso] || { career: {}, demo: {} };
  const gc = state.gymCompletion[iso] || { warmup: {}, exercises: {}, cooldown: {} };
  const comp = computeDayCompletion(state, iso, dayNum);
  const jobStats = getJobStats(state, iso);
  const demoStats = getDemoStats(state, dayNum);
  const note = state.dailyNotes[iso] || { accomplished: "", blocked: "", tomorrow: "" };

  const topCareer = career.find((t) => t.priority);
  const topDemo = demo[0];
  const priorityLines = [];
  if (topCareer) priorityLines.push(topCareer.text);
  if (topDemo && !topDemo.locked) priorityLines.push(topDemo.text);
  if (!workout.rest) priorityLines.push(`Complete today's ${wd} workout`);
  else priorityLines.push("Rest day - light recovery only");

  const plannedHours = (comp.minutes.total / 60).toFixed(1).replace(/\.0$/, "");
  const doneHours = (comp.minutes.done / 60).toFixed(1).replace(/\.0$/, "");

  container.innerHTML = `
    <div class="priority-callout">
      <div class="pc-label">${icon("target")} Today's Priority</div>
      <ol>${priorityLines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ol>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">Job Prep Time</div>
        <span class="badge muted">${doneHours}h of ${plannedHours}h</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${comp.minutes.total > 0 ? Math.round((comp.minutes.done / comp.minutes.total) * 100) : 0}%"></div></div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">Job Search: ${comp.career.done}/${comp.career.total}</div>
      </div>
      <div class="task-list" id="career-list">
        ${career.map((t) => taskItemHtml(t, !!dc.career?.[t.id], !!t.custom)).join("")}
      </div>
      <div class="inline-add">
        <input type="text" id="add-career-input" placeholder="Add a task for today..." />
        <button class="btn secondary sm" id="add-career-btn">${icon("plus")}</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">My Project: ${comp.demo.done}/${comp.demo.total}</div>
        ${demoStats.total > 0 ? `<span class="badge ${demoStats.behindSchedule ? "blocked" : "muted"}">${demoStats.done}/${demoStats.total} milestones done</span>` : ""}
      </div>
      <div class="task-list" id="demo-list">
        ${demo.map((t) => taskItemHtml(t, !!dc.demo?.[t.id], !!t.custom)).join("")}
      </div>
      <div class="inline-add">
        <input type="text" id="add-demo-input" placeholder="Add a demo task for today..." />
        <button class="btn secondary sm" id="add-demo-btn">${icon("plus")}</button>
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
             <div class="task-list" id="rest-list">${workout.optional.map((o) => taskItemHtml(o, !!gc.exercises?.[o.id], false)).join("")}</div>`
          : workout.exercises.length === 0
          ? `<div class="empty-hint">No exercises set for ${wd} yet. <br/>Go to the <b>Gym</b> tab to build this week's plan.</div>`
          : `
            <div class="section-label">Warm-up</div>
            <div class="task-list" id="warmup-list">${workout.warmup.map((w) => taskItemHtml(w, !!gc.warmup?.[w.id], false)).join("")}</div>
            <div class="section-label">Workout</div>
            <div class="task-list" id="exercise-list">${workout.exercises.map((e) => taskItemHtml(e, !!gc.exercises?.[e.id], false)).join("")}</div>
            <div class="section-label">Cool-down / Stretch</div>
            <div class="task-list" id="cooldown-list">${workout.cooldown.map((c) => taskItemHtml(c, !!gc.cooldown?.[c.id], false)).join("")}</div>
          `
      }
    </div>

    <div class="card">
      <div class="card-title-row"><div class="card-title">📝 Daily Notes</div></div>
      <div class="field notes-textarea">
        <label>What did I accomplish today?</label>
        <textarea id="note-accomplished" rows="2">${escapeHtml(note.accomplished)}</textarea>
      </div>
      <div class="field notes-textarea">
        <label>What blocked me?</label>
        <textarea id="note-blocked" rows="2">${escapeHtml(note.blocked)}</textarea>
      </div>
      <div class="field notes-textarea">
        <label>What should I do tomorrow?</label>
        <textarea id="note-tomorrow" rows="2">${escapeHtml(note.tomorrow)}</textarea>
      </div>
      <button class="btn primary block" id="save-notes-btn">Save Notes</button>
    </div>
  `;

  // ---- wire up events ----
  const toggle = (listSel, storeGetter, id, locked) => {
    if (locked === "1") return;
    update((s) => {
      const bucket = storeGetter(s);
      bucket[id] = !bucket[id];
    });
  };

  container.querySelectorAll("#career-list .task-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-remove-custom]")) return;
      const id = el.dataset.taskId;
      update((s) => {
        if (!s.dailyCompletion[iso]) s.dailyCompletion[iso] = { career: {}, demo: {} };
        if (!s.dailyCompletion[iso].career) s.dailyCompletion[iso].career = {};
        s.dailyCompletion[iso].career[id] = !s.dailyCompletion[iso].career[id];
      });
    });
  });
  container.querySelectorAll("#demo-list .task-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-remove-custom]")) return;
      if (el.dataset.locked === "1") return;
      const id = el.dataset.taskId;
      update((s) => {
        if (!s.dailyCompletion[iso]) s.dailyCompletion[iso] = { career: {}, demo: {} };
        if (!s.dailyCompletion[iso].demo) s.dailyCompletion[iso].demo = {};
        s.dailyCompletion[iso].demo[id] = !s.dailyCompletion[iso].demo[id];
      });
    });
  });
  container.querySelectorAll("[data-remove-custom]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.removeCustom.split("-").pop());
      const isCareer = btn.dataset.removeCustom.includes("career");
      update((s) => {
        const arr = s.customTasks[iso]?.[isCareer ? "career" : "demo"];
        if (arr) arr.splice(idx, 1);
      });
    });
  });

  const addBtn = (btnId, inputId, key) => {
    const btn = container.querySelector(`#${btnId}`);
    const input = container.querySelector(`#${inputId}`);
    const submit = () => {
      const val = input.value.trim();
      if (!val) return;
      update((s) => {
        if (!s.customTasks[iso]) s.customTasks[iso] = { career: [], demo: [] };
        if (!s.customTasks[iso][key]) s.customTasks[iso][key] = [];
        s.customTasks[iso][key].push(val);
      });
    };
    btn.addEventListener("click", submit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  };
  addBtn("add-career-btn", "add-career-input", "career");
  addBtn("add-demo-btn", "add-demo-input", "demo");

  if (!workout.rest && workout.exercises.length > 0) {
    container.querySelectorAll("#warmup-list .task-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.taskId;
        update((s) => {
          if (!s.gymCompletion[iso]) s.gymCompletion[iso] = { warmup: {}, exercises: {}, cooldown: {} };
          if (!s.gymCompletion[iso].warmup) s.gymCompletion[iso].warmup = {};
          s.gymCompletion[iso].warmup[id] = !s.gymCompletion[iso].warmup[id];
        });
      });
    });
    container.querySelectorAll("#exercise-list .task-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.taskId;
        update((s) => {
          if (!s.gymCompletion[iso]) s.gymCompletion[iso] = { warmup: {}, exercises: {}, cooldown: {} };
          if (!s.gymCompletion[iso].exercises) s.gymCompletion[iso].exercises = {};
          s.gymCompletion[iso].exercises[id] = !s.gymCompletion[iso].exercises[id];
        });
      });
    });
    container.querySelectorAll("#cooldown-list .task-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.taskId;
        update((s) => {
          if (!s.gymCompletion[iso]) s.gymCompletion[iso] = { warmup: {}, exercises: {}, cooldown: {} };
          if (!s.gymCompletion[iso].cooldown) s.gymCompletion[iso].cooldown = {};
          s.gymCompletion[iso].cooldown[id] = !s.gymCompletion[iso].cooldown[id];
        });
      });
    });
  }
  if (workout.rest) {
    container.querySelectorAll("#rest-list .task-item").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.taskId;
        update((s) => {
          if (!s.gymCompletion[iso]) s.gymCompletion[iso] = { warmup: {}, exercises: {}, cooldown: {} };
          if (!s.gymCompletion[iso].exercises) s.gymCompletion[iso].exercises = {};
          s.gymCompletion[iso].exercises[id] = !s.gymCompletion[iso].exercises[id];
        });
      });
    });
  }

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
