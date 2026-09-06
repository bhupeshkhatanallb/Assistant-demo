import { CAREER_POOLS, PHASE_CATEGORY_ORDER } from "./data/careerPools.js";
import { dayOfSprint, sprintPhase, todayISO, weekdayName, getActiveGymWeek, isoForSprintDay, parseISO, addDays, dailyBudgetMinutes } from "./dates.js";

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

  let nearInterview = null;
  for (const j of jobs) {
    if (interviewStatuses.includes(j.status) && j.followUpDate) {
      const diff = Math.round((parseISO(j.followUpDate) - parseISO(iso)) / 86400000);
      if (diff >= 0 && diff <= 2) {
        nearInterview = j;
        break;
      }
    }
  }

  return { applicationsThisWeek, applicationsTotal, activePipelines, interviews, referrals, offers, nearInterview };
}

export function getDemoStats(state, dayNum) {
  const ms = state.demoProject.milestones || [];
  const total = ms.length;
  const done = ms.filter((m) => m.done).length;
  const expected = total > 0 ? Math.round((Math.min(dayNum, 30) / 30) * total) : 0;
  const behindSchedule = total > 0 && done < expected - 1;
  return { total, done, expected, behindSchedule };
}

function rotate(arr, n) {
  if (arr.length === 0) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

function splitBudget(totalMinutes) {
  const career = Math.round(totalMinutes * 0.5);
  return { career, demo: totalMinutes - career };
}

export function generateCareerTasks(state, dayNum, iso) {
  const phase = sprintPhase(dayNum);
  const jobStats = getJobStats(state, iso);
  const demoStats = getDemoStats(state, dayNum);
  const { career: careerBudget } = splitBudget(dailyBudgetMinutes(iso));

  const tasks = [];
  const used = new Set();
  let minutesUsed = 0;

  // Pick the one most important task for today
  let topTask = null;
  if (jobStats.nearInterview) {
    const j = jobStats.nearInterview;
    const round = j.interviewStage ? ` (${j.interviewStage})` : "";
    topTask = { id: `interview-${j.id}`, text: `Get ready for your interview at ${j.company}${round}`, category: "interview", minutes: 30, priority: true };
  } else if (demoStats.behindSchedule) {
    topTask = { id: "focus-demo", text: "Your project is behind schedule - spend extra time on it today (see below)", category: "demo", minutes: 10, priority: true };
  } else if (jobStats.applicationsThisWeek < state.meta.weeklyApplicationTarget) {
    const pool = CAREER_POOLS.applications;
    const item = pool[dayNum % pool.length];
    topTask = { id: item.id, text: item.text, category: "applications", minutes: item.minutes, priority: true };
    used.add(`applications:${item.id}`);
  } else {
    const rotatingTop = ["coding", "systemDesign", "rag"];
    const cat = rotatingTop[dayNum % rotatingTop.length];
    const pool = CAREER_POOLS[cat];
    const item = pool[dayNum % pool.length];
    topTask = { id: item.id, text: item.text, category: cat, minutes: item.minutes, priority: true };
    used.add(`${cat}:${item.id}`);
  }
  tasks.push(topTask);
  minutesUsed += topTask.minutes;

  const categories = rotate(PHASE_CATEGORY_ORDER[phase] || Object.keys(CAREER_POOLS), dayNum);
  let categoryIdx = 0;
  while (minutesUsed < careerBudget && categoryIdx < categories.length * 4) {
    const cat = categories[categoryIdx % categories.length];
    categoryIdx++;
    const pool = CAREER_POOLS[cat];
    if (!pool) continue;
    const start = (dayNum + cat.length) % pool.length;
    for (let i = 0; i < pool.length; i++) {
      const item = pool[(start + i) % pool.length];
      const key = `${cat}:${item.id}`;
      if (!used.has(key)) {
        used.add(key);
        tasks.push({ id: item.id, text: item.text, category: cat, minutes: item.minutes, priority: false });
        minutesUsed += item.minutes;
        break;
      }
    }
  }

  const custom = (state.customTasks[iso]?.career || []).map((text, i) => ({ id: `custom-career-${i}`, text, category: "custom", minutes: 15, priority: false, custom: true }));
  return tasks.concat(custom);
}

export function generateDemoTasks(state, dayNum, iso) {
  const ms = state.demoProject.milestones || [];
  const custom = (state.customTasks[iso]?.demo || []).map((text, i) => ({ id: `custom-demo-${i}`, text, minutes: 15, custom: true }));
  if (ms.length === 0) {
    return [{ id: "setup-project", text: "Go to Setup and add your project (name, tech, milestones)", locked: true, minutes: 0 }].concat(custom);
  }
  const { demo: demoBudget } = splitBudget(dailyBudgetMinutes(iso));
  const open = ms
    .filter((m) => !m.done)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

  const tasks = [];
  let minutesUsed = 0;
  for (const m of open) {
    const minutes = m.minutes || 45;
    if (tasks.length > 0 && minutesUsed + minutes > demoBudget) break;
    tasks.push({ id: `ms-${m.id}`, text: m.task, milestoneId: m.id, minutes });
    minutesUsed += minutes;
    if (minutesUsed >= demoBudget) break;
  }
  if (tasks.length === 0) {
    if (open.length > 0) {
      const m = open[0];
      tasks.push({ id: `ms-${m.id}`, text: m.task, milestoneId: m.id, minutes: m.minutes || 45 });
    } else {
      tasks.push({ id: "all-done", text: "All your milestones are done - add the next one in Setup", locked: true, minutes: 0 });
    }
  }
  return tasks.concat(custom);
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
  const week = getActiveGymWeek(state, iso);
  const exercises = week ? week.days[wd] || [] : [];
  return {
    rest: false,
    weekNumber: week ? week.weekNumber : null,
    exercises,
    warmup: state.meta.warmup,
    cooldown: state.meta.cooldown,
  };
}

export function computeDayCompletion(state, iso, dayNum) {
  const career = generateCareerTasks(state, dayNum, iso);
  const demo = generateDemoTasks(state, dayNum, iso);
  const workout = getTodayWorkout(state, iso);
  const dc = state.dailyCompletion[iso] || { career: {}, demo: {} };
  const gc = state.gymCompletion[iso] || { warmup: {}, exercises: {}, cooldown: {} };

  const careerTotal = career.filter((t) => !t.locked).length;
  const careerDone = career.filter((t) => !t.locked && dc.career?.[t.id]).length;

  const demoTotal = demo.filter((t) => !t.locked).length;
  const demoDone = demo.filter((t) => !t.locked && dc.demo?.[t.id]).length;

  let gymTotal = 0;
  let gymDone = 0;
  if (!workout.rest) {
    gymTotal = workout.warmup.length + workout.exercises.length + workout.cooldown.length;
    gymDone =
      workout.warmup.filter((w) => gc.warmup?.[w.id]).length +
      workout.exercises.filter((e) => gc.exercises?.[e.id]).length +
      workout.cooldown.filter((c) => gc.cooldown?.[c.id]).length;
  }

  const sumMinutes = (list) => list.reduce((sum, t) => sum + (t.minutes || 0), 0);
  const minutesTotal = sumMinutes(career.filter((t) => !t.locked)) + sumMinutes(demo.filter((t) => !t.locked));
  const minutesDone =
    sumMinutes(career.filter((t) => !t.locked && dc.career?.[t.id])) + sumMinutes(demo.filter((t) => !t.locked && dc.demo?.[t.id]));

  const total = careerTotal + demoTotal + gymTotal;
  const done = careerDone + demoDone + gymDone;
  const pct = total > 0 ? done / total : 0;

  return {
    career: { done: careerDone, total: careerTotal },
    demo: { done: demoDone, total: demoTotal },
    gym: { done: gymDone, total: gymTotal, isRest: workout.rest },
    minutes: { done: minutesDone, total: minutesTotal },
    overall: { done, total, pct },
  };
}

export function computeStreak(state) {
  const iso0 = todayISO(state);
  const threshold = state.meta.completionThreshold ?? 0.6;
  let streak = 0;
  let cursor = iso0;
  const startDay = dayOfSprint(state, iso0);

  for (let i = 0; i < 60; i++) {
    const dNum = dayOfSprint(state, cursor);
    if (dNum < 1) break;
    const isToday = cursor === iso0;
    const { overall } = computeDayCompletion(state, cursor, dNum);
    const hasRecord = overall.total > 0 && (state.dailyCompletion[cursor] || state.gymCompletion[cursor]);
    if (isToday) {
      if (overall.pct >= threshold) streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (overall.pct >= threshold && hasRecord) {
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
    const { overall } = computeDayCompletion(state, dIso, d);
    if (overall.total > 0) {
      sumPct += overall.pct;
      counted++;
    }
  }
  return counted > 0 ? sumPct / counted : 0;
}
