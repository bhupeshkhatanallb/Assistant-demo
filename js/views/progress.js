import { icon } from "../icons.js";
import { todayISO, dayOfSprint, isoForSprintDay } from "../dates.js";
import { computeStreak, computeSprintProgress, computeDayCompletion } from "../taskEngine.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function render(container, ctx) {
  const { state, update } = ctx;
  const iso = todayISO(state);
  const currentDay = Math.max(1, Math.min(30, dayOfSprint(state, iso)));
  const streak = computeStreak(state);
  const sprintPct = Math.round(computeSprintProgress(state) * 100);

  const heatCells = [];
  for (let d = 1; d <= 30; d++) {
    const dIso = isoForSprintDay(state, d);
    if (dIso > iso) {
      heatCells.push(`<div class="heat-cell" title="Day ${d}"></div>`);
      continue;
    }
    const { overall } = computeDayCompletion(state, dIso, d);
    let cls = "";
    if (overall.total > 0) {
      if (overall.pct >= 0.85) cls = "l3";
      else if (overall.pct >= 0.4) cls = "l2";
      else if (overall.pct > 0) cls = "l1";
    }
    heatCells.push(`<div class="heat-cell ${cls}" title="Day ${d}: ${Math.round(overall.pct * 100)}%"></div>`);
  }

  const metricDefs = state.metricDefs || [];
  const todayMetrics = state.fitnessMetrics[iso] || {};

  const noteEntries = Object.entries(state.dailyNotes)
    .filter(([, n]) => n.accomplished || n.blocked || n.tomorrow)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30);

  container.innerHTML = `
    <div class="card">
      <div class="card-title-row">
        <div class="card-title">${icon("fire")} Execution Streak</div>
        <span class="badge priority">${streak}-day streak</span>
      </div>
      <div class="card-sub" style="margin-bottom:10px;">Day ${currentDay}/30 · ${sprintPct}% overall sprint completion</div>
      <div class="progress-track" style="margin-bottom:12px;"><div class="progress-fill" style="width:${sprintPct}%"></div></div>
      <div class="heatmap">${heatCells.join("")}</div>
    </div>

    <div class="card">
      <div class="card-title-row">
        <div class="card-title">Fitness Metrics</div>
        <button class="btn secondary sm" id="add-metric-btn">${icon("plus")} Track a metric</button>
      </div>
      <div id="add-metric-form" style="display:none; margin-bottom:10px;">
        <div class="row-2">
          <input type="text" id="metric-label" placeholder="Metric name (e.g. Bench 1RM)" />
          <input type="text" id="metric-unit" placeholder="Unit (e.g. kg)" />
        </div>
        <button class="btn primary sm block" id="save-metric-btn" style="margin-top:8px;">Add Metric</button>
      </div>
      ${metricDefs.length === 0 ? `<div class="empty-hint">No metrics tracked yet. Add whatever matters to you - weight, waist, steps, sleep, lift numbers.</div>` : ""}
      ${metricDefs
        .map((m) => {
          const history = Object.entries(state.fitnessMetrics)
            .filter(([, v]) => v[m.key] !== undefined && v[m.key] !== "")
            .sort((a, b) => b[0].localeCompare(a[0]))
            .slice(0, 5);
          return `
          <div class="list-row">
            <div class="list-row-top">
              <div class="list-row-title">${escapeHtml(m.label)}${m.unit ? ` <span class="card-sub">(${escapeHtml(m.unit)})</span>` : ""}</div>
              <button class="task-remove" data-del-metric="${m.key}">${icon("trash")}</button>
            </div>
            <div class="inline-add" style="margin-top:8px;">
              <input type="text" inputmode="decimal" data-metric-input="${m.key}" placeholder="Today's value" value="${escapeHtml(todayMetrics[m.key] ?? "")}" />
              <button class="btn secondary sm" data-log-metric="${m.key}">Log</button>
            </div>
            ${history.length > 0 ? `<div class="card-sub" style="margin-top:6px;">${history.map(([d, v]) => `${d}: ${escapeHtml(v[m.key])}`).join(" · ")}</div>` : ""}
          </div>`;
        })
        .join("")}
    </div>

    <div class="card">
      <div class="card-title">Notes History</div>
      ${noteEntries.length === 0 ? `<div class="empty-hint">No journal entries yet. Save daily notes from the Today tab.</div>` : noteEntries
        .map(
          ([d, n]) => `
        <div class="notes-history-item">
          <div class="nd">${d}</div>
          ${n.accomplished ? `<div class="nb"><b>Did:</b> ${escapeHtml(n.accomplished)}</div>` : ""}
          ${n.blocked ? `<div class="nb"><b>Blocked:</b> ${escapeHtml(n.blocked)}</div>` : ""}
          ${n.tomorrow ? `<div class="nb"><b>Next:</b> ${escapeHtml(n.tomorrow)}</div>` : ""}
        </div>`
        )
        .join("")}
    </div>
  `;

  container.querySelector("#add-metric-btn").addEventListener("click", () => {
    const form = container.querySelector("#add-metric-form");
    form.style.display = form.style.display === "none" ? "block" : "none";
  });
  container.querySelector("#save-metric-btn").addEventListener("click", () => {
    const label = container.querySelector("#metric-label").value.trim();
    const unit = container.querySelector("#metric-unit").value.trim();
    if (!label) return;
    update((s) => {
      const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 24) + "_" + Date.now().toString(36).slice(-4);
      s.metricDefs.push({ key, label, unit });
    });
  });
  container.querySelectorAll("[data-del-metric]").forEach((btn) => {
    btn.addEventListener("click", () => {
      update((s) => {
        s.metricDefs = s.metricDefs.filter((m) => m.key !== btn.dataset.delMetric);
      });
    });
  });
  container.querySelectorAll("[data-log-metric]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.logMetric;
      const input = container.querySelector(`[data-metric-input="${key}"]`);
      const val = input.value.trim();
      update((s) => {
        if (!s.fitnessMetrics[iso]) s.fitnessMetrics[iso] = {};
        s.fitnessMetrics[iso][key] = val;
      });
    });
  });
}
