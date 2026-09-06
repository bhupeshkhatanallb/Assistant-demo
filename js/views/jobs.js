import { icon } from "../icons.js";
import { uid } from "../store.js";
import { todayISO } from "../dates.js";
import { getJobStats } from "../taskEngine.js";

const STATUSES = [
  "Target",
  "Applied",
  "Recruiter contacted",
  "Recruiter screen",
  "Technical interview",
  "System design",
  "Hiring manager",
  "Final",
  "Offer",
  "Rejected",
  "Ghosted",
];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];

const STATUS_COLOR = {
  Target: "muted",
  Applied: "muted",
  "Recruiter contacted": "muted",
  "Recruiter screen": "priority",
  "Technical interview": "priority",
  "System design": "priority",
  "Hiring manager": "priority",
  Final: "priority",
  Offer: "done",
  Rejected: "blocked",
  Ghosted: "blocked",
};

let editingId = null;
let addingNew = false;
let filterStatus = "All";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function render(container, ctx) {
  const { state, update } = ctx;
  const iso = todayISO(state);
  const stats = getJobStats(state, iso);
  const jobs = state.jobs.slice().sort((a, b) => (b.dateApplied || "").localeCompare(a.dateApplied || ""));
  const filtered = filterStatus === "All" ? jobs : jobs.filter((j) => j.status === filterStatus);

  container.innerHTML = `
    <div class="card">
      <div class="card-title">Pipeline Dashboard</div>
      <div class="metric-grid" style="margin-top:8px;">
        <div class="metric-tile"><div class="val">${stats.applicationsThisWeek}</div><div class="lbl">This Week</div></div>
        <div class="metric-tile"><div class="val">${stats.applicationsTotal}</div><div class="lbl">Total Applied</div></div>
        <div class="metric-tile"><div class="val">${stats.interviews}</div><div class="lbl">Interviews</div></div>
        <div class="metric-tile"><div class="val">${stats.activePipelines}</div><div class="lbl">Active</div></div>
        <div class="metric-tile"><div class="val">${stats.referrals}</div><div class="lbl">Referrals</div></div>
        <div class="metric-tile"><div class="val">${stats.offers}</div><div class="lbl">Offers</div></div>
      </div>
    </div>

    <div class="chip-row">
      <div class="chip ${filterStatus === "All" ? "active" : ""}" data-filter="All">All (${jobs.length})</div>
      ${STATUSES.map((s) => `<div class="chip ${filterStatus === s ? "active" : ""}" data-filter="${s}">${s} (${jobs.filter((j) => j.status === s).length})</div>`).join("")}
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">Applications</div>
        <button class="btn primary sm" id="add-job-btn">${icon("plus")} Add</button>
      </div>
      ${addingNew ? `<div class="list-row">${jobForm(null)}</div>` : ""}
      <div id="job-list">
        ${filtered.length === 0 && !addingNew ? `<div class="empty-hint">No applications ${filterStatus === "All" ? "yet" : `with status "${filterStatus}"`}. Add your first target company.</div>` : filtered.map((j) => jobRow(j)).join("")}
      </div>
    </div>
  `;

  container.querySelectorAll("[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      filterStatus = chip.dataset.filter;
      update(() => {});
    });
  });

  container.querySelector("#add-job-btn").addEventListener("click", () => {
    addingNew = !addingNew;
    editingId = null;
    update(() => {});
  });

  container.querySelectorAll("form[data-job-form]").forEach((f) => wireJobForm(container, f.dataset.jobForm, update));

  container.querySelectorAll("[data-edit-job]").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingId = editingId === btn.dataset.editJob ? null : btn.dataset.editJob;
      addingNew = false;
      update(() => {});
    });
  });
  container.querySelectorAll("[data-delete-job]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this application?")) return;
      update((s) => {
        s.jobs = s.jobs.filter((j) => j.id !== btn.dataset.deleteJob);
      });
    });
  });
  container.querySelectorAll("[data-cancel-job]").forEach((btn) => {
    btn.addEventListener("click", () => {
      editingId = null;
      addingNew = false;
      update(() => {});
    });
  });
}

function jobRow(j) {
  if (editingId === j.id) {
    return `<div class="list-row">${jobForm(j)}</div>`;
  }
  return `
    <div class="list-row">
      <div class="list-row-top">
        <div>
          <div class="list-row-title">${escapeHtml(j.role || "Untitled role")}</div>
          <div class="card-sub">${escapeHtml(j.company || "")}${j.location ? " · " + escapeHtml(j.location) : ""}</div>
        </div>
        <span class="status-pill badge ${STATUS_COLOR[j.status] || "muted"}">${j.status}</span>
      </div>
      <div class="list-row-meta">
        ${j.workMode ? `<span class="badge muted">${j.workMode}</span>` : ""}
        ${j.salary ? `<span class="badge muted">${escapeHtml(j.salary)}</span>` : ""}
        ${j.referral ? `<span class="badge done">Referral</span>` : ""}
        ${j.dateApplied ? `<div style="margin-top:4px;">Applied ${j.dateApplied}</div>` : ""}
        ${j.followUpDate ? `<div>Follow up ${j.followUpDate}</div>` : ""}
        ${j.contact ? `<div>Contact: ${escapeHtml(j.contact)}</div>` : ""}
        ${j.url ? `<div><a class="link" href="${escapeHtml(j.url)}" target="_blank" rel="noopener">Job posting ↗</a></div>` : ""}
        ${j.notes ? `<div style="margin-top:4px;">${escapeHtml(j.notes)}</div>` : ""}
      </div>
      <div class="list-row-actions">
        <button class="btn ghost sm" data-edit-job="${j.id}">${icon("edit")} Edit</button>
        <button class="btn danger sm" data-delete-job="${j.id}">${icon("trash")} Delete</button>
      </div>
    </div>`;
}

function jobForm(j) {
  const isEdit = !!j;
  const formId = isEdit ? j.id : "new";
  return `
    <form data-job-form="${formId}">
      <div class="row-2">
        <div class="field"><label>Company</label><input type="text" name="company" value="${escapeHtml(j?.company || "")}" required /></div>
        <div class="field"><label>Role</label><input type="text" name="role" value="${escapeHtml(j?.role || "")}" required /></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Location</label><input type="text" name="location" value="${escapeHtml(j?.location || "")}" /></div>
        <div class="field"><label>Work Mode</label>
          <select name="workMode"><option value="">-</option>${WORK_MODES.map((w) => `<option value="${w}" ${j?.workMode === w ? "selected" : ""}>${w}</option>`).join("")}</select>
        </div>
      </div>
      <div class="row-2">
        <div class="field"><label>Salary / Comp</label><input type="text" name="salary" value="${escapeHtml(j?.salary || "")}" placeholder="e.g. $170-190k" /></div>
        <div class="field"><label>Job URL</label><input type="text" name="url" value="${escapeHtml(j?.url || "")}" /></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Date Applied</label><input type="date" name="dateApplied" value="${j?.dateApplied || ""}" /></div>
        <div class="field"><label>Status</label>
          <select name="status">${STATUSES.map((s) => `<option value="${s}" ${(j?.status || "Target") === s ? "selected" : ""}>${s}</option>`).join("")}</select>
        </div>
      </div>
      <div class="row-2">
        <div class="field"><label>Recruiter / Contact</label><input type="text" name="contact" value="${escapeHtml(j?.contact || "")}" /></div>
        <div class="field"><label>Follow-up Date</label><input type="date" name="followUpDate" value="${j?.followUpDate || ""}" /></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Interview Stage / Round</label><input type="text" name="interviewStage" value="${escapeHtml(j?.interviewStage || "")}" placeholder="e.g. Onsite round 2" /></div>
        <div class="field" style="display:flex; align-items:flex-end;">
          <label style="display:flex; align-items:center; gap:8px; margin-bottom:10px;"><input type="checkbox" name="referral" ${j?.referral ? "checked" : ""} style="width:auto;" /> Referral</label>
        </div>
      </div>
      <div class="field"><label>Notes</label><textarea name="notes" rows="2">${escapeHtml(j?.notes || "")}</textarea></div>
      <div class="list-row-actions">
        <button type="submit" class="btn primary sm">${isEdit ? "Save Changes" : "Add Application"}</button>
        <button type="button" class="btn ghost sm" data-cancel-job="1">Cancel</button>
      </div>
    </form>`;
}

function wireJobForm(container, formId, update) {
  const form = container.querySelector(`form[data-job-form="${formId}"]`);
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      company: fd.get("company")?.trim(),
      role: fd.get("role")?.trim(),
      location: fd.get("location")?.trim(),
      workMode: fd.get("workMode"),
      salary: fd.get("salary")?.trim(),
      url: fd.get("url")?.trim(),
      dateApplied: fd.get("dateApplied"),
      status: fd.get("status"),
      contact: fd.get("contact")?.trim(),
      followUpDate: fd.get("followUpDate"),
      interviewStage: fd.get("interviewStage")?.trim(),
      referral: fd.get("referral") === "on",
      notes: fd.get("notes")?.trim(),
    };
    if (!data.company || !data.role) return;
    update((s) => {
      if (formId === "new") {
        s.jobs.push({ id: uid("job"), ...data });
        addingNew = false;
      } else {
        const j = s.jobs.find((x) => x.id === formId);
        Object.assign(j, data);
        editingId = null;
      }
    });
  });
}
