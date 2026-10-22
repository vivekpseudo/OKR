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

> The browser UI remains a prototype and still uses local demo data. A separate backend implementation is now available in backend/ with PostgreSQL persistence, workspace-scoped JWT authentication, objectives/key results/check-ins, scheduled reminders, encrypted Slack/Teams credentials, and a CI build. The static UI is not yet wired to those API endpoints; do not use browser demo storage for sensitive company data.

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
- `.env.example` — server-side configuration notes (never put real secrets in client-side code)
- `backend/` — Fastify + TypeScript API, PostgreSQL migrations, Docker Compose, authentication, reminder worker and Slack/Teams integration adapters

## Run the backend locally

See [backend/README.md](backend/README.md) for configuration and API details. Copy backend/.env.example to .env, set a strong JWT_SECRET, generate INTEGRATION_ENCRYPTION_KEY with openssl rand -hex 32, and run docker compose up --build from the backend/ directory. The API listens on port 3001 and PostgreSQL on port 5433. Configure the companion NotificationService repository and matching event-signing secret to enable notification delivery.

## Remaining production work

1. Wire the static frontend to the backend API and remove browser-local demo persistence for authenticated team workspaces.
2. Provision production secrets, TLS, managed PostgreSQL, backups, alerting, and controlled migrations; do not deploy the development configuration unchanged.
3. Configure the notification service's production WSGI server, durable queue/retry policy, Slack bot token, Teams webhook, and user channel preferences.
4. Add end-to-end tests, billing/plan enforcement, invite and membership management, password reset/MFA, and operational/security review before accepting paying teams.

## Product positioning

Designed for agencies, nonprofits, and startups that want an easy-to-run weekly OKR ritual without enterprise-suite complexity. Possible future differentiation: niche templates, spreadsheet import, and AI-assisted drafting of measurable key results.

## License

No license has been selected yet. Add one before distributing this project as open source.
