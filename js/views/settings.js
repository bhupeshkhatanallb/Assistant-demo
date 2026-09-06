import { icon } from "../icons.js";
import { uid, exportJSON, importJSON, resetState } from "../store.js";

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function listEditor(title, items, prefix) {
  return `
    <div class="section-label">${title}</div>
    <div class="task-list" id="${prefix}-list">
      ${items
        .map(
          (it) => `
        <div class="list-row" style="display:flex; align-items:center; gap:8px; padding:8px 10px;">
          <input type="text" data-${prefix}-rename="${it.id}" value="${escapeHtml(it.text)}" style="flex:1;" />
          <button class="task-remove" data-${prefix}-del="${it.id}">${icon("trash")}</button>
        </div>`
        )
        .join("")}
    </div>
    <div class="inline-add">
      <input type="text" id="${prefix}-new-input" placeholder="Add item..." />
      <button class="btn secondary sm" id="${prefix}-add-btn">${icon("plus")}</button>
    </div>`;
}

export function openSettingsModal(ctx) {
  const { state, update } = ctx;
  const root = document.getElementById("modal-root");

  const close = () => {
    root.innerHTML = "";
  };

  root.innerHTML = `
    <div class="modal-backdrop" id="settings-backdrop">
      <div class="modal-sheet">
        <div class="modal-head">
          <div class="modal-title">Settings</div>
          <button class="icon-btn" id="close-settings">${icon("close")}</button>
        </div>

        <div class="section-label">Sprint</div>
        <div class="field"><label>Sprint Start Date (Day 1)</label><input type="date" id="s-start" value="${state.meta.startDate}" /></div>
        <div class="field"><label>How much of your hour goal counts as a "done" day for your streak?</label>
          <select id="s-threshold">
            ${[0.4, 0.5, 0.6, 0.7, 0.8, 1].map((v) => `<option value="${v}" ${state.meta.completionThreshold === v ? "selected" : ""}>${Math.round(v * 100)}%</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Override "Today" (optional - testing/backfill)</label><input type="date" id="s-override" value="${state.meta.dateOverride || ""}" /></div>

        ${listEditor("Warm-up Checklist", state.meta.warmup, "warmup")}
        ${listEditor("Cool-down Checklist", state.meta.cooldown, "cooldown")}

        <div class="section-label">Backup</div>
        <div style="display:flex; gap:8px; margin-bottom:10px;">
          <button class="btn secondary sm block" id="s-export">Export JSON</button>
          <button class="btn secondary sm block" id="s-import-trigger">Import JSON</button>
        </div>
        <input type="file" id="s-import-file" accept="application/json" style="display:none;" />

        <div class="section-label">Danger Zone</div>
        <button class="btn danger block" id="s-reset">Reset All Data</button>

        <button class="btn primary block" id="s-save" style="margin-top:16px;">Save & Close</button>
      </div>
    </div>
  `;

  document.getElementById("close-settings").addEventListener("click", close);
  document.getElementById("settings-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "settings-backdrop") close();
  });

  const wireListEditor = (prefix, metaKey) => {
    document.getElementById(`${prefix}-add-btn`).addEventListener("click", () => {
      const input = document.getElementById(`${prefix}-new-input`);
      const val = input.value.trim();
      if (!val) return;
      update((s) => {
        s.meta[metaKey].push({ id: uid(prefix), text: val });
      });
      openSettingsModal(ctx);
    });
    root.querySelectorAll(`[data-${prefix}-del]`).forEach((btn) => {
      btn.addEventListener("click", () => {
        update((s) => {
          s.meta[metaKey] = s.meta[metaKey].filter((it) => it.id !== btn.dataset[`${prefix}Del`]);
        });
        openSettingsModal(ctx);
      });
    });
    root.querySelectorAll(`[data-${prefix}-rename]`).forEach((inp) => {
      inp.addEventListener("change", () => {
        update((s) => {
          const it = s.meta[metaKey].find((x) => x.id === inp.dataset[`${prefix}Rename`]);
          if (it) it.text = inp.value.trim() || it.text;
        });
      });
    });
  };
  wireListEditor("warmup", "warmup");
  wireListEditor("cooldown", "cooldown");

  document.getElementById("s-export").addEventListener("click", async () => {
    const filename = `execution-assistant-backup-${state.meta.startDate}.json`;
    const jsonStr = exportJSON(state);

    if (window.claude && typeof window.claude.use === "function") {
      try {
        const downloads = await window.claude.use("downloads");
        if (downloads) {
          await downloads.save({ filename, data: jsonStr });
          return;
        }
      } catch (e) {
        if (e && e.code === "declined") return;
        // otherwise fall through to the classic browser download below
      }
    }

    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  document.getElementById("s-import-trigger").addEventListener("click", () => {
    document.getElementById("s-import-file").click();
  });
  document.getElementById("s-import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importJSON(reader.result);
        update((s) => {
          Object.assign(s, imported);
        });
        close();
      } catch (err) {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("s-reset").addEventListener("click", () => {
    if (!confirm("This will permanently delete all your data (jobs, project, gym plans, notes). Continue?")) return;
    const fresh = resetState();
    update((s) => {
      Object.keys(s).forEach((k) => delete s[k]);
      Object.assign(s, fresh);
    });
    close();
  });

  document.getElementById("s-save").addEventListener("click", () => {
    update((s) => {
      s.meta.startDate = document.getElementById("s-start").value || s.meta.startDate;
      s.meta.completionThreshold = Number(document.getElementById("s-threshold").value);
      const override = document.getElementById("s-override").value;
      s.meta.dateOverride = override || null;
    });
    close();
  });
}
