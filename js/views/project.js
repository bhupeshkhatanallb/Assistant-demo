import { icon } from "../icons.js";
import { uid } from "../store.js";

const ARCH_LABELS = {
  ingestion: "Data Ingestion",
  chunking: "Chunking",
  embeddings: "Embeddings",
  vectorDb: "Vector DB",
  retrieval: "Retrieval",
  reranking: "Reranking",
  llm: "LLM",
  agent: "Agent",
  tools: "Tools",
  memory: "Memory / State",
  evaluation: "Evaluation",
  observability: "Observability",
  api: "API",
  ui: "UI",
  deployment: "Deployment",
};

const STATUS_OPTIONS = ["backlog", "in_progress", "blocked", "done"];
const STATUS_LABELS = { backlog: "Backlog", in_progress: "In Progress", blocked: "Blocked", done: "Done" };
const PRIORITY_OPTIONS = ["high", "medium", "low"];

let editingId = null; // module-scoped UI-only state

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function render(container, ctx) {
  const { state, update } = ctx;
  const p = state.demoProject;
  const milestones = p.milestones || [];
  const total = milestones.length;
  const done = milestones.filter((m) => m.status === "done").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  container.innerHTML = `
    <div class="card">
      <div class="card-title">${icon("project")} Demo Project</div>
      <div class="card-sub" style="margin-bottom:10px;">Your project — enter it once, execute it daily. Nothing here is invented for you.</div>
      <div class="field"><label>Project Name</label><input type="text" id="p-name" value="${escapeHtml(p.name)}" placeholder="e.g. Judgment RAG Assistant v2" /></div>
      <div class="field"><label>Description</label><textarea id="p-desc" rows="3" placeholder="What it does, who it's for...">${escapeHtml(p.description)}</textarea></div>
      <div class="field"><label>Tech Stack</label><input type="text" id="p-stack" value="${escapeHtml(p.techStack)}" placeholder="e.g. FastAPI, ChromaDB, sentence-transformers, Ollama" /></div>
      <div class="row-2">
        <div class="field"><label>GitHub URL</label><input type="text" id="p-github" value="${escapeHtml(p.githubUrl)}" placeholder="https://github.com/..." /></div>
        <div class="field"><label>Demo URL</label><input type="text" id="p-demo" value="${escapeHtml(p.demoUrl)}" placeholder="https://..." /></div>
      </div>
      <div class="field"><label>Notes</label><textarea id="p-notes" rows="3" placeholder="Design decisions, open questions...">${escapeHtml(p.notes)}</textarea></div>
      <button class="btn primary block" id="save-project-btn">Save Project Details</button>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">Milestone Progress</div>
        <span class="badge muted">${done}/${total} done</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>

    <div class="card">
      <div class="card-title">Architecture Checklist</div>
      <div class="card-sub" style="margin-bottom:10px;">Track each component's build status.</div>
      <div class="arch-grid">
        ${Object.keys(ARCH_LABELS)
          .map((key) => {
            const item = p.architecture[key] || { status: "backlog" };
            return `
            <div class="arch-cell">
              <div class="name">${ARCH_LABELS[key]}</div>
              <select data-arch="${key}">
                ${STATUS_OPTIONS.map((s) => `<option value="${s}" ${item.status === s ? "selected" : ""}>${STATUS_LABELS[s]}</option>`).join("")}
              </select>
            </div>`;
          })
          .join("")}
      </div>
    </div>

    <div class="card">
      <div class="card-title">Milestones</div>
      <div id="milestone-list">
        ${milestones.length === 0 ? `<div class="empty-hint">No milestones yet. Add your first one below - break your project into daily-executable chunks.</div>` : milestones.map((m) => milestoneRow(m)).join("")}
      </div>
      <div class="section-label">Add Milestone</div>
      ${milestoneForm(null)}
    </div>
  `;

  // project fields
  const saveProjectFields = () => {
    update((s) => {
      s.demoProject.name = container.querySelector("#p-name").value;
      s.demoProject.description = container.querySelector("#p-desc").value;
      s.demoProject.techStack = container.querySelector("#p-stack").value;
      s.demoProject.githubUrl = container.querySelector("#p-github").value;
      s.demoProject.demoUrl = container.querySelector("#p-demo").value;
      s.demoProject.notes = container.querySelector("#p-notes").value;
    });
  };
  container.querySelector("#save-project-btn").addEventListener("click", saveProjectFields);

  container.querySelectorAll("[data-arch]").forEach((sel) => {
    sel.addEventListener("change", () => {
      update((s) => {
        s.demoProject.architecture[sel.dataset.arch].status = sel.value;
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
  container.querySelectorAll("[data-cycle-status]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        const m = s.demoProject.milestones.find((x) => x.id === btn.dataset.cycleStatus);
        const idx = STATUS_OPTIONS.indexOf(m.status);
        m.status = STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length];
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
        <div class="list-row-title">${escapeHtml(m.task)}</div>
        <button class="task-remove" data-cycle-status="${m.id}" title="Cycle status">${icon("check")}</button>
      </div>
      <div class="list-row-meta">
        <span class="badge ${m.status === "done" ? "done" : m.status === "blocked" ? "blocked" : "muted"}">${STATUS_LABELS[m.status]}</span>
        <span class="badge muted">${m.priority || "medium"} priority</span>
        ${m.effort ? `<span class="badge muted">${escapeHtml(m.effort)}</span>` : ""}
        ${m.dueDate ? `<span class="badge muted">due ${m.dueDate}</span>` : ""}
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
      <div class="field"><label>Task</label><input type="text" name="task" value="${escapeHtml(m?.task || "")}" placeholder="e.g. Wire retrieval evaluation harness" required /></div>
      <div class="row-2">
        <div class="field"><label>Priority</label>
          <select name="priority">${PRIORITY_OPTIONS.map((o) => `<option value="${o}" ${m?.priority === o ? "selected" : ""}>${o}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Status</label>
          <select name="status">${STATUS_OPTIONS.map((o) => `<option value="${o}" ${m?.status === o ? "selected" : ""}>${STATUS_LABELS[o]}</option>`).join("")}</select>
        </div>
      </div>
      <div class="row-2">
        <div class="field"><label>Estimated Effort</label><input type="text" name="effort" value="${escapeHtml(m?.effort || "")}" placeholder="e.g. 2 hrs" /></div>
        <div class="field"><label>Due Date</label><input type="date" name="dueDate" value="${m?.dueDate || ""}" /></div>
      </div>
      <div class="field"><label>Notes</label><textarea name="notes" rows="2">${escapeHtml(m?.notes || "")}</textarea></div>
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
      priority: fd.get("priority"),
      status: fd.get("status"),
      effort: fd.get("effort")?.trim(),
      dueDate: fd.get("dueDate"),
      notes: fd.get("notes")?.trim(),
    };
    if (!data.task) return;
    update((s) => {
      if (formId === "new") {
        s.demoProject.milestones.push({ id: uid("ms"), ...data });
      } else {
        const m = s.demoProject.milestones.find((x) => x.id === formId);
        Object.assign(m, data);
        editingId = null;
      }
    });
  });
  const cancel = form.querySelector("[data-cancel-edit]");
  if (cancel) {
    cancel.addEventListener("click", () => {
      editingId = null;
      // trigger a no-op update purely to rerender
      update(() => {});
    });
  }
}
