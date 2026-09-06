import { CAREER_POOLS, PHASE_CATEGORY_ORDER, PHASE_TASK_COUNT } from "./data/careerPools.js";
import { dayOfSprint, sprintPhase, todayISO, weekdayName, getActiveGymWeek, isoForSprintDay, parseISO, addDays } from "./dates.js";

export function getJobStats(state, iso) {
  const jobs = state.jobs;
  const weekAgo = addDays(iso, -6);
  const applicationsThisWeek = jobs.filter((j) => j.dateApplied && j.dateApplied >= weekAgo && j.dateApplied <= iso).length;
  const applicationsTotal = jobs.filter((j) => j.dateApplied).length;
  const interviewStatuses = ["Technical interview", "System design", "Hiring manager", "Final"];
  const activePipelines = jobs.filter((j) => !["Rejected", "Ghosted", "Offer"].includes(j.status)).length;
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
  const done = ms.filter((m) => m.status === "done").length;
  const expected = total > 0 ? Math.round((Math.min(dayNum, 30) / 30) * total) : 0;
  const behindSchedule = total > 0 && done < expected - 1;
  return { total, done, expected, behindSchedule };
}

function rotate(arr, n) {
  if (arr.length === 0) return arr;
  const k = ((n % arr.length) + arr.length) % arr.length;
  return arr.slice(k).concat(arr.slice(0, k));
}

export function generateCareerTasks(state, dayNum, iso) {
  const phase = sprintPhase(dayNum);
  const jobStats = getJobStats(state, iso);
  const demoStats = getDemoStats(state, dayNum);
  const count = PHASE_TASK_COUNT[phase] || 3;
  const tasks = [];
  const used = new Set();

  const pushFromPool = (catId, poolId) => {
    const pool = CAREER_POOLS[catId];
    if (!pool) return false;
    const start = (dayNum + catId.length) % pool.length;
    for (let i = 0; i < pool.length; i++) {
      const item = pool[(start + i) % pool.length];
      const key = `${catId}:${item.id}`;
      if (!used.has(key)) {
        used.add(key);
        tasks.push({ id: item.id, text: item.text, category: catId, priority: false });
        return true;
      }
    }
    return false;
  };

  // Determine top priority
  let topCategory = null;
  let topTask = null;
  if (jobStats.nearInterview) {
    const j = jobStats.nearInterview;
    topTask = { id: `interview-${j.id}`, text: `Prep for ${j.role} @ ${j.company} - ${j.status}`, category: "interview", priority: true };
  } else if (demoStats.behindSchedule) {
    topCategory = "demoFocus";
  } else if (jobStats.applicationsThisWeek < state.meta.weeklyApplicationTarget) {
    topCategory = "applications";
  } else {
    const rotatingTop = ["coding", "systemDesign", "rag"];
    topCategory = rotatingTop[dayNum % rotatingTop.length];
  }

  if (topTask) {
    tasks.push(topTask);
  } else if (topCategory === "demoFocus") {
    tasks.push({ id: "focus-demo", text: "Prioritize demo project work today - it's behind the 30-day pace. See Demo checklist below.", category: "demo", priority: true });
  } else if (topCategory) {
    pushFromPool(topCategory, null);
    if (tasks.length) tasks[0].priority = true;
  }

  const categories = rotate(PHASE_CATEGORY_ORDER[phase] || Object.keys(CAREER_POOLS), dayNum);
  let idx = 0;
  while (tasks.length < count && idx < categories.length * 3) {
    const cat = categories[idx % categories.length];
    pushFromPool(cat, null);
    idx++;
  }

  const custom = (state.customTasks[iso]?.career || []).map((text, i) => ({ id: `custom-career-${i}`, text, category: "custom", priority: false, custom: true }));
  return tasks.slice(0, count).concat(custom);
}

export function generateDemoTasks(state, dayNum, iso) {
  const ms = state.demoProject.milestones || [];
  const custom = (state.customTasks[iso]?.demo || []).map((text, i) => ({ id: `custom-demo-${i}`, text, custom: true }));
  if (ms.length === 0) {
    return [{ id: "setup-project", text: "Open the Project tab and configure your demo project (name, stack, milestones)", locked: true }].concat(custom);
  }
  const phase = sprintPhase(dayNum);
  const count = phase === 2 || phase === 3 ? 3 : 2;
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const open = ms
    .filter((m) => m.status !== "done")
    .sort((a, b) => {
      const pr = (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
      if (pr !== 0) return pr;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  const picked = open.slice(0, count).map((m) => ({ id: `ms-${m.id}`, text: m.task, milestoneId: m.id }));
  if (picked.length === 0) {
    picked.push({ id: "all-done", text: "All current milestones done - add the next milestone in the Project tab", locked: true });
  }
  return picked.concat(custom);
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

  const total = careerTotal + demoTotal + gymTotal;
  const done = careerDone + demoDone + gymDone;
  const pct = total > 0 ? done / total : 0;

  return {
    career: { done: careerDone, total: careerTotal },
    demo: { done: demoDone, total: demoTotal },
    gym: { done: gymDone, total: gymTotal, isRest: workout.rest },
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
