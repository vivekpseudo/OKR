# Compass OKR

A lightweight, mobile-friendly OKR and goal-tracking MVP for small teams. Built to replace brittle spreadsheets with a focused dashboard for objectives, measurable key results, weekly check-ins, and alignment.

## MVP included

- Dashboard with team progress, status, and completion overview
- Create objectives and measurable key results
- Update progress and add weekly check-in notes
- Team directory and ownership assignment
- Alignment view and simple progress reporting
- Reminder settings UI and integration-ready Slack/Teams webhook configuration points
- Local demo data persisted in the browser so the prototype works without a database

> This repository starts as a front-end MVP/prototype. Authentication, multi-tenant persistence, email/Slack/Teams delivery, and production authorization are not configured yet. Do not use demo local storage for sensitive company data.

## Run locally

No build step or package install is required. Open `index.html` in a browser, or serve the repository using any static HTTP server, for example:

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

## Project structure

- `index.html` — application shell and accessible dialogs
- `styles.css` — responsive visual system
- `app.js` — demo data, rendering, and interactions
- `.env.example` — documented future integration configuration (never put real secrets in client-side code)

## Suggested next production steps

1. Add an API (for example, Node.js/TypeScript or Next.js route handlers) and PostgreSQL schema for organizations, memberships, objectives, key results, and check-ins.
2. Add authentication and tenant-level authorization before exposing team data.
3. Move reminders to a scheduled server-side job and send Slack/Teams notifications from a server-side integration using encrypted secrets.
4. Add import/export for CSV and spreadsheet onboarding, plus automated tests and CI.

## Product positioning

Designed for agencies, nonprofits, and startups that want an easy-to-run weekly OKR ritual without enterprise-suite complexity. Possible future differentiation: niche templates, spreadsheet import, and AI-assisted drafting of measurable key results.

## License

No license has been selected yet. Add one before distributing this project as open source.
