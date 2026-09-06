import { icon } from "../icons.js";
import { uid } from "../store.js";

let editingId = null; // module-scoped UI-only state

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function render(container, ctx) {
  const { state, update } = ctx;
  const p = state.demoProject;
  const milestones = p.milestones || [];
  const total = milestones.length;
  const done = milestones.filter((m) => m.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  container.innerHTML = `
    <div class="card">
      <div class="card-title">${icon("project")} My Project</div>
      <div class="card-sub" style="margin-bottom:10px;">Type in your own project. Nothing here is made up for you.</div>
      <div class="field"><label>Project Name</label><input type="text" id="p-name" value="${escapeHtml(p.name)}" placeholder="e.g. Judgment RAG Assistant v2" /></div>
      <div class="field"><label>What is it?</label><textarea id="p-desc" rows="3" placeholder="What it does, who it's for...">${escapeHtml(p.description)}</textarea></div>
      <div class="field"><label>Tools You're Using</label><input type="text" id="p-stack" value="${escapeHtml(p.techStack)}" placeholder="e.g. FastAPI, ChromaDB, Ollama" /></div>
      <div class="row-2">
        <div class="field"><label>GitHub Link</label><input type="text" id="p-github" value="${escapeHtml(p.githubUrl)}" placeholder="https://github.com/..." /></div>
        <div class="field"><label>Demo Link</label><input type="text" id="p-demo" value="${escapeHtml(p.demoUrl)}" placeholder="https://..." /></div>
      </div>
      <div class="field"><label>Notes</label><textarea id="p-notes" rows="3" placeholder="Anything you want to remember...">${escapeHtml(p.notes)}</textarea></div>
      <div class="card-sub">Saved automatically as you type.</div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">Progress</div>
        <span class="badge muted">${done}/${total} done</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>

    <div class="card">
      <div class="card-title">Milestones (Your To-Do List)</div>
      <div id="milestone-list">
        ${milestones.length === 0 ? `<div class="empty-hint">No milestones yet. Add your first one below - break your project into small steps you can do in a day or two.</div>` : milestones.map((m) => milestoneRow(m)).join("")}
      </div>
      <div class="section-label">Add a Milestone</div>
      ${milestoneForm(null)}
    </div>
  `;

  // Autosave project identity fields as you type / on blur
  const autosaveFields = [
    ["p-name", "name"],
    ["p-desc", "description"],
    ["p-stack", "techStack"],
    ["p-github", "githubUrl"],
    ["p-demo", "demoUrl"],
    ["p-notes", "notes"],
  ];
  autosaveFields.forEach(([elId, key]) => {
    const el = container.querySelector(`#${elId}`);
    el.addEventListener("blur", () => {
      update((s) => {
        s.demoProject[key] = el.value;
      });
    });
  });

  container.querySelectorAll("[data-edit-ms]").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingId = editingId === btn.dataset.editMs ? null : btn.dataset.editMs;
      update(() => {});
    });
  });
  container.querySelectorAll("[data-delete-ms]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        s.demoProject.milestones = s.demoProject.milestones.filter((m) => m.id !== btn.dataset.deleteMs);
      });
    });
  });
  container.querySelectorAll("[data-toggle-done]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        const m = s.demoProject.milestones.find((x) => x.id === btn.dataset.toggleDone);
        m.done = !m.done;
      });
    });
  });
  container.querySelectorAll("form[data-edit-form]").forEach((form) => {
    wireMilestoneForm(container, form.dataset.editForm, update);
  });
}

function milestoneRow(m) {
  if (editingId === m.id) {
    return `<div class="list-row">${milestoneForm(m)}</div>`;
  }
  return `
    <div class="list-row">
      <div class="list-row-top">
        <div class="task-item ${m.done ? "checked" : ""}" data-toggle-done="${m.id}" style="background:none; border:none; padding:0; flex:1;">
          <div class="checkbox">${icon("check")}</div>
          <div class="task-text">${escapeHtml(m.task)}</div>
        </div>
      </div>
      <div class="list-row-meta">
        ${m.minutes ? `<span class="badge muted">about ${m.minutes} min</span>` : ""}
        ${m.dueDate ? `<span class="badge muted">by ${m.dueDate}</span>` : ""}
        ${m.notes ? `<div style="margin-top:4px;">${escapeHtml(m.notes)}</div>` : ""}
      </div>
      <div class="list-row-actions">
        <button class="btn ghost sm" data-edit-ms="${m.id}">${icon("edit")} Edit</button>
        <button class="btn danger sm" data-delete-ms="${m.id}">${icon("trash")} Delete</button>
      </div>
    </div>`;
}

function milestoneForm(m) {
  const isEdit = !!m;
  const formId = isEdit ? m.id : "new";
  return `
    <form data-edit-form="${formId}" style="margin-top:${isEdit ? "8" : "10"}px;">
      <div class="field"><label>What needs to get done?</label><input type="text" name="task" value="${escapeHtml(m?.task || "")}" placeholder="e.g. Get search working" required /></div>
      <div class="row-2">
        <div class="field"><label>About how long? (minutes)</label><input type="number" name="minutes" value="${m?.minutes ?? 45}" min="5" max="600" /></div>
        <div class="field"><label>Due Date (optional)</label><input type="date" name="dueDate" value="${m?.dueDate || ""}" /></div>
      </div>
      <div class="field"><label>Notes (optional)</label><textarea name="notes" rows="2">${escapeHtml(m?.notes || "")}</textarea></div>
      ${isEdit ? `<label style="display:flex; align-items:center; gap:8px; margin-bottom:10px;"><input type="checkbox" name="done" ${m?.done ? "checked" : ""} style="width:auto;" /> Done</label>` : ""}
      <div class="list-row-actions">
        <button type="submit" class="btn primary sm">${isEdit ? "Save Changes" : "Add Milestone"}</button>
        ${isEdit ? `<button type="button" class="btn ghost sm" data-cancel-edit="1">Cancel</button>` : ""}
      </div>
    </form>`;
}

function wireMilestoneForm(container, formId, update) {
  const form = container.querySelector(`form[data-edit-form="${formId}"]`);
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      task: fd.get("task")?.trim(),
      minutes: Number(fd.get("minutes")) || 45,
      dueDate: fd.get("dueDate"),
      notes: fd.get("notes")?.trim(),
    };
    if (!data.task) return;
    update((s) => {
      if (formId === "new") {
        s.demoProject.milestones.push({ id: uid("ms"), done: false, ...data });
      } else {
        const m = s.demoProject.milestones.find((x) => x.id === formId);
        Object.assign(m, data, { done: fd.get("done") === "on" });
        editingId = null;
      }
    });
  });
  const cancel = form.querySelector("[data-cancel-edit]");
  if (cancel) {
    cancel.addEventListener("click", () => {
      editingId = null;
      update(() => {});
    });
  }
}
