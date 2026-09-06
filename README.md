# 30-Day AI Career + Physique Execution Assistant

A mobile-first personal execution assistant for a 30-day sprint toward a high-paying AI/Backend role while building your physique. No backend, no build step — plain HTML/CSS/JS with all data stored locally in your browser (`localStorage`).

## Run it

Any static file server works, e.g.:

```
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed URL on your phone or desktop. Opening `index.html` directly by double-clicking also works in most browsers.

## Tabs

- **Today** — your job-prep tasks and project tasks for today (in plain English, each with a time estimate), your workout (with warm-up/cool-down), and a daily journal. Tasks are sized to fit 3 hours on office days (Mon-Sat) or 8 hours on your one holiday (Sunday).
- **Setup** — one scrollable page with three sections: **Your Project** (name, tools, milestones), **Your Gym Plan** (exercises per weekday, with new weeks you can create without losing old ones), and **Your Job List** (application tracker with at-a-glance stats).
- **Progress** — streak, sprint completion heatmap, a collapsible full 30-day plan, fitness metrics, and notes history.

Settings (gear icon, top right) lets you set the sprint start date, streak threshold, warm-up/cool-down items, and export/import a JSON backup of all your data. The app is light-mode only.

Everything is stored only in your browser's `localStorage` — nothing is sent anywhere.
