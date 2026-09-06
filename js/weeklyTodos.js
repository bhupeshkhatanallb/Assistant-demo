// Shared data helpers for a self-managed weekly to-do list (used by both
// job-prep to-dos and the gym workout pool). No auto-generation, no
// auto-picking - the user adds items for the week and checks them off
// whenever they actually do them.
import { uid } from "./store.js";

export function activeWeek(weeksMap, iso) {
  const weeks = Object.values(weeksMap).sort((a, b) => a.weekNumber - b.weekNumber);
  if (weeks.length === 0) return null;
  let candidate = weeks[0];
  for (const w of weeks) {
    if (w.startDate <= iso) candidate = w;
  }
  return candidate;
}

export function nextWeekNumber(weeksMap) {
  const nums = Object.values(weeksMap).map((w) => w.weekNumber);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

export function lastWeekOf(weeksMap) {
  const weeks = Object.values(weeksMap).sort((a, b) => b.weekNumber - a.weekNumber);
  return weeks[0] || null;
}

export function createWeek(weeksMap, startIso) {
  const num = nextWeekNumber(weeksMap);
  weeksMap[num] = { weekNumber: num, startDate: startIso, items: [] };
  return num;
}

export function copyWeek(weeksMap, startIso) {
  const last = lastWeekOf(weeksMap);
  const num = nextWeekNumber(weeksMap);
  const items = last ? last.items.map((it) => ({ id: uid("wt"), text: it.text, done: false, doneDate: null, milestoneId: it.milestoneId || null })) : [];
  weeksMap[num] = { weekNumber: num, startDate: startIso, items };
  return num;
}

export function addItem(week, text, milestoneId = null) {
  week.items.push({ id: uid("wt"), text, done: false, doneDate: null, milestoneId });
}

export function setItemMilestone(week, itemId, milestoneId) {
  const it = week.items.find((i) => i.id === itemId);
  if (it) it.milestoneId = milestoneId || null;
}

export function toggleItemDone(week, itemId, iso) {
  const it = week.items.find((i) => i.id === itemId);
  if (!it) return;
  it.done = !it.done;
  it.doneDate = it.done ? iso : null;
}

export function deleteItem(week, itemId) {
  week.items = week.items.filter((i) => i.id !== itemId);
}

export function doneCountOn(weeksMap, iso) {
  return Object.values(weeksMap).reduce((sum, w) => sum + w.items.filter((i) => i.doneDate === iso).length, 0);
}
