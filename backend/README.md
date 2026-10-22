# OKR production backend

Fastify + TypeScript API, PostgreSQL persistence, JWT authentication, organization-scoped data access, audit events, encrypted integration credentials, and a separate scheduled reminder worker.

## Start locally

1. Copy `.env.example` to `.env`; set a random 32+ character `JWT_SECRET`. Generate the integration encryption key with `openssl rand -hex 32`.
2. Run `docker compose up --build` from `backend/`. PostgreSQL initializes from `migrations/001_initial.sql`.
3. Health check: `GET http://localhost:3001/health`.
4. Register a workspace: `POST /api/v1/auth/register` with `organizationName`, `name`, `email`, and a password of at least 12 characters. Login requires email, password and returned organization slug.
5. Send `Authorization: Bearer <accessToken>` on protected API requests.

## Main routes

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/me`
- `GET|POST /api/v1/objectives`
- `POST /api/v1/objectives/:id/key-results`
- `POST|GET /api/v1/key-results/:id/check-ins`
- `GET /api/v1/integrations`, `PUT|DELETE /api/v1/integrations/:provider`, `POST /api/v1/integrations/:provider/test`

All OKR reads/writes are scoped to the authenticated organization. Workspace creation and key writes use transactions where appropriate. Passwords use bcrypt; JWTs expire; API requests are rate limited and use security headers.

## Reminders and notification service

The worker uses `REMINDER_CRON` and `REMINDER_TIMEZONE` (default Monday 09:00 UTC). A unique database key prevents duplicate reminder claims for a user and period. Set `NOTIFICATION_SERVICE_ENABLED=true`, `NOTIFICATION_SERVICE_URL`, and the shared secret to deliver events to the existing Django NotificationService. The worker submits a signed event with `x-okr-timestamp` and `x-okr-signature`; the notification service must validate that signature before accepting it. Delivery is not active until the NotificationService adapter and preferences are configured.

## Slack / Microsoft Teams

Integration secrets are encrypted at rest with AES-256-GCM; configure `INTEGRATION_ENCRYPTION_KEY` as 64 hex characters. Only workspace owners/admins can create, update, or delete integrations. Never commit `.env` or real credentials. The API stores integration credentials but message delivery still depends on configured adapters in the existing NotificationService. Use least-privilege Slack bot scopes and a Teams workflow/webhook endpoint restricted to your tenant.

## Production checklist

Use managed PostgreSQL with TLS, a secret manager, TLS ingress, backups and restore drills, centralized logs/alerts, database migrations in a controlled release job, and separate API/worker processes. Set a specific `CORS_ORIGIN`; do not expose the database or internal notification service publicly. Configure a durable broker/retries in NotificationService. Review retention, privacy, billing/entitlements and load testing before taking paying customers.
