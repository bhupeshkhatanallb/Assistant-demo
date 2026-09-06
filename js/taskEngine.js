import { dayOfSprint, todayISO, weekdayName, isoForSprintDay, addDays, isOfficeDay, dailyBudgetMinutes } from "./dates.js";
import { activeWeek, doneCountOn } from "./weeklyTodos.js";

export function getJobStats(state, iso) {
  const jobs = state.jobs;
  const weekAgo = addDays(iso, -6);
  const applicationsThisWeek = jobs.filter((j) => j.dateApplied && j.dateApplied >= weekAgo && j.dateApplied <= iso).length;
  const applicationsTotal = jobs.filter((j) => j.dateApplied).length;
  const interviewStatuses = ["Interviewing"];
  const activePipelines = jobs.filter((j) => !["Rejected", "Offer"].includes(j.status)).length;
  const interviews = jobs.filter((j) => interviewStatuses.includes(j.status)).length;
  const referrals = jobs.filter((j) => j.referral).length;
  const offers = jobs.filter((j) => j.status === "Offer").length;

  return { applicationsThisWeek, applicationsTotal, activePipelines, interviews, referrals, offers };
}

export function getOpenMilestones(state) {
  return (state.demoProject.milestones || []).filter((m) => !m.done);
}

export function getTodayWorkout(state, iso) {
  const wd = weekdayName(iso);
  if (wd === "Sunday") {
    return {
      rest: true,
      optional: [
        { id: "walk", text: "Easy walk (20-40 min)" },
        { id: "mobility", text: "Mobility / light stretching" },
        { id: "recovery", text: "Recovery - sleep, hydration, foam rolling" },
      ],
    };
  }
  const week = activeWeek(state.gymWeeks, iso);
  return {
    rest: false,
    weekNumber: week ? week.weekNumber : null,
    items: week ? week.items.filter((i) => !i.done) : [],
    warmup: state.meta.warmup,
    cooldown: state.meta.cooldown,
  };
}

export function getDailyLoggedMinutes(state, iso) {
  const log = state.timeLog[iso];
  if (!log) return 0;
  return log.sittings.reduce((sum, s) => sum + (s.minutes || 0), 0);
}

export function computeDayExecution(state, iso) {
  const isRest = weekdayName(iso) === "Sunday";
  const goalMinutes = dailyBudgetMinutes(iso);
  const loggedMinutes = getDailyLoggedMinutes(state, iso);
  const pct = goalMinutes > 0 ? Math.min(1, loggedMinutes / goalMinutes) : 0;
  const jobDoneToday = doneCountOn(state.jobPrepWeeks, iso);
  const gymDoneToday = doneCountOn(state.gymWeeks, iso);

  return { isRest, isOfficeDay: isOfficeDay(iso), goalMinutes, loggedMinutes, pct, jobDoneToday, gymDoneToday };
}

export function computeStreak(state) {
  const iso0 = todayISO(state);
  const threshold = state.meta.completionThreshold ?? 0.6;
  let streak = 0;
  let cursor = iso0;

  for (let i = 0; i < 60; i++) {
    const dNum = dayOfSprint(state, cursor);
    if (dNum < 1) break;
    const isToday = cursor === iso0;
    const { pct } = computeDayExecution(state, cursor);
    if (isToday) {
      if (pct >= threshold) streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (pct >= threshold) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function computeSprintProgress(state) {
  const iso = todayISO(state);
  const currentDay = Math.max(1, Math.min(30, dayOfSprint(state, iso)));
  let sumPct = 0;
  let counted = 0;
  for (let d = 1; d <= currentDay; d++) {
    const dIso = isoForSprintDay(state, d);
    if (dIso > iso) continue;
    const { pct } = computeDayExecution(state, dIso);
    sumPct += pct;
    counted++;
  }
  return counted > 0 ? sumPct / counted : 0;
}
