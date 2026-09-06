import { PHASE_INFO, sprintPhase, isoForSprintDay, dayOfSprint, todayISO, formatShort } from "../dates.js";
import { ROADMAP_THEMES } from "../data/roadmapThemes.js";
import { computeDayCompletion } from "../taskEngine.js";

export function render(container, ctx) {
  const { state } = ctx;
  const iso = todayISO(state);
  const currentDay = dayOfSprint(state, iso);

  const phases = { 1: [], 2: [], 3: [], 4: [] };
  for (let d = 1; d <= 30; d++) {
    phases[sprintPhase(d)].push(d);
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-title">30-Day Career Roadmap</div>
      <div class="card-sub">Job + Demo + Interview readiness. Structured in four phases, optimized for your backend-to-applied-AI transition.</div>
    </div>
    ${Object.keys(phases)
      .map((p) => {
        const info = PHASE_INFO[p];
        return `
        <div class="phase-block">
          <div class="phase-head">
            <div class="phase-name">Phase ${p}: ${info.name}</div>
            <div class="phase-range">${info.range}</div>
          </div>
          <div class="card" style="padding:4px 10px;">
            ${phases[p]
              .map((d) => {
                const dIso = isoForSprintDay(state, d);
                const isToday = d === currentDay;
                const isPast = dIso < iso;
                const comp = computeDayCompletion(state, dIso, d);
                const pctLabel = comp.overall.total > 0 ? `${Math.round(comp.overall.pct * 100)}%` : "";
                return `
                <div class="roadmap-day ${isToday ? "today" : ""} ${isPast ? "past" : ""}">
                  <div class="dnum">D${d}</div>
                  <div class="rtext">
                    ${ROADMAP_THEMES[d] || ""}
                    <div class="card-sub" style="margin-top:3px;">${formatShort(dIso)}${pctLabel ? ` · ${pctLabel} done` : ""}</div>
                  </div>
                </div>`;
              })
              .join("")}
          </div>
        </div>`;
      })
      .join("")}
  `;
}
