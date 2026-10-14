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

## Deploy

See [docs/go-live.md](docs/go-live.md) for the full walkthrough (Atlas, Resend, Render, moving bclearns.com). `render.yaml` is the Render blueprint and `npm run seed:prod` creates the real accounts in the production database.
