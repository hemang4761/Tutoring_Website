# BCLearns CRM

Tutoring website plus an internal CRM for BCLearns: public onboarding, tutor applications, lead claiming, assignments, schedule, team chat, family portal, and reports.

## Local setup

1. Copy `.env.example` to `.env` and fill in at least `AUTH_SECRET`.
2. Start a local Mongo replica set (needed for live chat):

```bash
npm run db:dev
```

3. In another terminal, seed the first admin (and optional demo data):

```bash
npm run seed
npm run seed -- --demo
```

Default seed admin is `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`. Demo tutors use `password123`.

4. Run the app:

```bash
npm run dev
```

- Public site: http://localhost:3000
- Onboarding: `/get-started`
- Tutor apply: `/apply`
- Login: `/login`

## Deploy (Render)

Create a MongoDB Atlas cluster (M0 is fine; enable replica set, which Atlas does by default). Create a Resend API key for email. Then create a Render Blueprint from `render.yaml`, or a Web Service with:

- Build: `npm ci && npm run build`
- Start: `npm start`
- Env: `MONGODB_URI`, `AUTH_SECRET`, `APP_URL`, `RESEND_API_KEY`, `CRON_SECRET`

After the first deploy, run `npm run seed` once against production (or use a one-off Render shell) so the first admin and onboarding templates exist.

Hourly cron hits `/api/cron/reminders`. Monday cron hits `/api/cron/digest`.
