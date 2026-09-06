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

- **Today** — your daily career tasks, demo-project tasks, workout (with warm-up/cool-down), and journal.
- **Plan** — the 30-day roadmap, grouped by phase.
- **Project** — configure your demo project (name, stack, architecture checklist, milestones).
- **Gym** — configure your weekly workout split; create new weeks without losing old ones.
- **Jobs** — application tracker with pipeline metrics.
- **Progress** — streak, sprint completion heatmap, fitness metrics, notes history.

Settings (gear icon, top right) lets you set the sprint start date, streak threshold, warm-up/cool-down items, theme, and export/import a JSON backup of all your data.

Everything is stored only in your browser's `localStorage` — nothing is sent anywhere.
