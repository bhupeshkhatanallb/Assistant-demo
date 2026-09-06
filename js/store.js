const STORAGE_KEY = "aicareer_assistant_v1";

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_WARMUP = [
  { id: "w1", text: "5-10 min light cardio (bike/row/incline walk)" },
  { id: "w2", text: "Dynamic mobility (leg swings, arm circles, hip openers)" },
  { id: "w3", text: "Joint-specific warm-up for today's movements" },
  { id: "w4", text: "Ramp-up sets on the first compound lift" },
];

const DEFAULT_COOLDOWN = [
  { id: "c1", text: "5-8 min easy cool-down walk" },
  { id: "c2", text: "Stretch today's trained muscle groups" },
  { id: "c3", text: "Controlled breathing / down-regulation" },
];

const DEFAULT_METRIC_DEFS = [
  { key: "weight", label: "Body Weight", unit: "kg" },
  { key: "waist", label: "Waist", unit: "cm" },
  { key: "steps", label: "Steps", unit: "" },
  { key: "sleep", label: "Sleep", unit: "hrs" },
];

function emptyWeekDays() {
  return { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
}

export function defaultState() {
  const todayISO = new Date().toISOString().slice(0, 10);
  return {
    version: 1,
    meta: {
      startDate: todayISO,
      theme: "system",
      completionThreshold: 0.6,
      weeklyApplicationTarget: 5,
      lastTab: "today",
      dateOverride: null,
      warmup: DEFAULT_WARMUP,
      cooldown: DEFAULT_COOLDOWN,
    },
    demoProject: {
      name: "",
      description: "",
      techStack: "",
      githubUrl: "",
      demoUrl: "",
      notes: "",
      architecture: {
        ingestion: { status: "backlog", notes: "" },
        chunking: { status: "backlog", notes: "" },
        embeddings: { status: "backlog", notes: "" },
        vectorDb: { status: "backlog", notes: "" },
        retrieval: { status: "backlog", notes: "" },
        reranking: { status: "backlog", notes: "" },
        llm: { status: "backlog", notes: "" },
        agent: { status: "backlog", notes: "" },
        tools: { status: "backlog", notes: "" },
        memory: { status: "backlog", notes: "" },
        evaluation: { status: "backlog", notes: "" },
        observability: { status: "backlog", notes: "" },
        api: { status: "backlog", notes: "" },
        ui: { status: "backlog", notes: "" },
        deployment: { status: "backlog", notes: "" },
      },
      milestones: [],
    },
    gymPlans: {
      1: { weekNumber: 1, startDate: todayISO, days: emptyWeekDays() },
    },
    gymCompletion: {},
    jobs: [],
    dailyCompletion: {},
    dailyNotes: {},
    customTasks: {},
    fitnessMetrics: {},
    metricDefs: DEFAULT_METRIC_DEFS,
  };
}

function deepMerge(base, incoming) {
  if (Array.isArray(base)) return incoming !== undefined ? incoming : base;
  if (typeof base === "object" && base !== null) {
    const out = { ...base };
    if (incoming && typeof incoming === "object") {
      for (const k of Object.keys(incoming)) {
        out[k] = k in base ? deepMerge(base[k], incoming[k]) : incoming[k];
      }
    }
    return out;
  }
  return incoming !== undefined ? incoming : base;
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return deepMerge(defaultState(), parsed);
  } catch (e) {
    console.warn("Failed to load state, resetting.", e);
    return defaultState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save state", e);
  }
}

export function exportJSON(state) {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  return deepMerge(defaultState(), parsed);
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return defaultState();
}
