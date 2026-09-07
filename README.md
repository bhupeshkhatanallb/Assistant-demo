# 30-Day AI Career + Physique Execution Assistant

A mobile-first personal execution assistant for a 30-day sprint toward a high-paying AI/Backend role while building your physique. No backend, no build step — plain HTML/CSS/JS. State always writes to `localStorage` for an instant load and as a fallback; when hosted as a Claude Artifact (`js/dbSync.js`), it also persists to the artifact's own durable document store, so your data survives reloads/republishes/tab or device switches instead of depending only on this browser's local storage.

## Run it

Any static file server works, e.g.:

```
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL on your phone or desktop. Opening `index.html` directly by double-clicking also works in most browsers.

## Tabs

- **Today** — log your actual hours worked (goal: 3h on office days Mon-Sat, 8h on Sunday - you can log more or less), check off this week's job-prep to-dos and workouts (added yourself, done in whatever order you like), your open project milestones, warm-up/cool-down, and a daily journal.
- **Setup** — one scrollable page with four sections: **Your Project** (name, tools, milestones), **Job Prep To-Dos** (a weekly list you write yourself), **Gym Plan** (a weekly pool of workouts you pick from day to day - Sunday is always rest), and **Your Job Applications** (tracker with at-a-glance stats). Both weekly lists support New Week / Copy Last Week, and old weeks are kept.
- **Progress** — streak, a heatmap of how much of your daily hour goal you hit, a collapsible full 30-day plan (loose inspiration, not an assignment), fitness metrics, and notes history.

Settings (gear icon, top right) lets you set the sprint start date, the streak threshold, warm-up/cool-down items, and export/import a JSON backup of all your data. The app is light-mode only.

Data stays private to this artifact/browser — nothing is sent to any third-party service.
