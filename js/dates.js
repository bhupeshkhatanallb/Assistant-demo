export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEK_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  if (dayNum <= 15) return 2;
  if (dayNum <= 23) return 3;
  return 4;
}

export const PHASE_INFO = {
  1: { name: "Positioning & Foundations", range: "Days 1-7" },
  2: { name: "Aggressive Build + Apply", range: "Days 8-15" },
  3: { name: "Polish + System Design + Applications", range: "Days 16-23" },
  4: { name: "Launch + Mocks + Referrals + Final Prep", range: "Days 24-30" },
};

export function mondayOnOrBefore(iso) {
  const d = parseISO(iso);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const back = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - back);
  return toISO(d);
}

export function formatLong(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

export function formatShort(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ---- Gym week helpers ----
export function getActiveGymWeek(state, iso) {
  const weeks = Object.values(state.gymPlans).sort((a, b) => a.weekNumber - b.weekNumber);
  if (weeks.length === 0) return null;
  let candidate = weeks[0];
  for (const w of weeks) {
    if (w.startDate <= iso) candidate = w;
  }
  return candidate;
}

export function nextWeekNumber(state) {
  const nums = Object.values(state.gymPlans).map((w) => w.weekNumber);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

export function lastWeek(state) {
  const weeks = Object.values(state.gymPlans).sort((a, b) => b.weekNumber - a.weekNumber);
  return weeks[0] || null;
}
