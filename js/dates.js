export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function toISO(date) {
  return date.toISOString().slice(0, 10);
}

export function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function todayISO(state) {
  if (state?.meta?.dateOverride) return state.meta.dateOverride;
  return toISO(new Date());
}

export function weekdayName(iso) {
  return WEEKDAY_NAMES[parseISO(iso).getDay()];
}

export function dayOfSprint(state, iso = null) {
  const t = iso || todayISO(state);
  const start = state.meta.startDate;
  const diff = Math.round((parseISO(t) - parseISO(start)) / 86400000) + 1;
  return diff;
}

export function isoForSprintDay(state, dayNum) {
  return addDays(state.meta.startDate, dayNum - 1);
}

// Office day = Mon-Sat (you're prepping after work). Sunday is the one holiday/rest day.
export function isOfficeDay(iso) {
  return weekdayName(iso) !== "Sunday";
}

export const OFFICE_DAY_MINUTES = 180;
export const HOLIDAY_MINUTES = 480;

export function dailyBudgetMinutes(iso) {
  return isOfficeDay(iso) ? OFFICE_DAY_MINUTES : HOLIDAY_MINUTES;
}

export function sprintPhase(dayNum) {
  if (dayNum <= 7) return 1;
  if (dayNum <= 14) return 2;
  if (dayNum <= 21) return 3;
  return 4;
}

export const PHASE_INFO = {
  1: { name: "Build the RAG Foundation", range: "Days 1-7" },
  2: { name: "Agentic AI + Lead Generation", range: "Days 8-14" },
  3: { name: "Production Engineering + Docker + AWS", range: "Days 15-21" },
  4: { name: "Interview Mode", range: "Days 22-30" },
};

export function formatLong(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function formatShort(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
