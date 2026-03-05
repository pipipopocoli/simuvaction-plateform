# SimuVaction Commons Platform

Desktop-first diplomatic simulation platform built with Next.js App Router, TypeScript, Prisma, and Postgres.

## Stack
- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS (neutral grayscale UI)
- `luxon` for timezone conversion (Europe/Paris, Asia/Bangkok, Africa/Nairobi)
- `jose` + signed HttpOnly cookie session for passphrase gate

## Features in V1
- Passphrase unlock screen (no user accounts, no OAuth)
- Signed cookie session (7 days)
- DB-backed rate limit for failed passphrase attempts
- Overview page with:
  - Project summary + team block
  - Locked official deadlines in 3 timezones
  - Weekly plan generation (auto Monday 09:00 Europe/Paris + manual button)
  - Next meeting scheduler with agenda tasks
- Pillars dashboard and full Kanban boards (New / Doing / Done / Archived)
  - Drag-and-drop across columns
  - Reorder within columns
  - Required title/deadline/priority
  - Urgent indicator (red warning marker)
  - Permanent task deletion with confirmation (no undo)
  - Tags, checklist sections/items, attachment links
- Library page (Sources / Drafts) with link-based items
- X Tracker page (coming soon)
- Settings page with WhatsApp placeholders + TODOs (coming soon)
- Storage and notification provider stubs for future cloud storage/WhatsApp integration

## Prerequisites
- Node.js 20+
- npm
- PostgreSQL 14+

## Environment variables
Create your local env file:

```bash
cp .env.example .env
```

Set the following values:

- `DATABASE_URL`: Postgres connection string
- `APP_PASSPHRASE_BCRYPT_HASH`: bcrypt hash of the shared passphrase
- `SESSION_SECRET`: random secret (minimum 32 chars)
- `CRON_SECRET`: optional token for `/api/cron/weekly-plan`
- `NEXT_PUBLIC_COOKIE_CONSENT_ENABLED`: set to `true` to enable consent-gated analytics
- `SURVEY_WAVE_INTERVAL_DAYS`: interval between discernment waves (default `15`)

Important for Next.js `.env` parsing: if a bcrypt hash contains `$` (it always does), escape each `$` as `\$` in `.env`.

Generate a long session secret:

```bash
openssl rand -base64 48
```

Generate the passphrase hash (store hash only, never plain passphrase in code):

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync(process.argv[1],12));" '<shared-passphrase>'
```

## Local setup
1. Install dependencies:
```bash
npm install
```

2. Ensure Postgres is running and create database:
```bash
createdb simuvaction
```

3. Apply migrations:
```bash
npm run prisma:migrate
```

4. Seed base data (pillars, official deadlines, default tags):
```bash
npm run prisma:seed
```

5. Start dev server:
```bash
npm run dev
```

6. Open:
- Public site: http://localhost:3000
- Authenticated dashboard: http://localhost:3000/dashboard
- Unlock with shared passphrase (validated via env hash)

## Prisma notes
- Schema: `prisma/schema.prisma`
- Initial migration: `prisma/migrations/20260220_init/migration.sql`
- Seed script: `prisma/seed.ts`

## Deployment notes (Vercel-first)
1. Use hosted Postgres (Neon/Supabase/Render Postgres/etc.)
2. Add environment variables in Vercel project settings:
   - `DATABASE_URL`
   - `APP_PASSPHRASE_BCRYPT_HASH`
   - `SESSION_SECRET`
   - `CRON_SECRET` (optional)
3. Run migrations in CI or deploy hook:
```bash
npm run prisma:migrate:deploy
```
4. Seed once on initial environment if required:
```bash
npm run prisma:seed
```
5. Deployment checklist (must pass before production rollout):
- [ ] `npm run prisma:migrate:deploy` finished with no errors on the target environment.
- [ ] New columns/tables required by this release exist in production DB.
- [ ] Login works after deploy (valid account returns `200` and session cookie).
- [ ] No Prisma `P2022` errors in runtime logs.

## API surface (v1)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/reset`
- `POST /api/auth/setup`
- `GET /api/public/config`
- `POST /api/consent`
- `POST /api/analytics/event`
- `GET /api/deadlines`
- `GET /api/pillars`
- `GET /api/pillars/[slug]/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/[id]`
- `DELETE /api/tasks/[id]` (permanent delete, no undo)
- `POST /api/tasks/reorder`
- `POST /api/tasks/[id]/move`
- `POST /api/checklist/sections`
- `PATCH|DELETE /api/checklist/sections/[id]`
- `POST /api/checklist/items`
- `PATCH|DELETE /api/checklist/items/[id]`
- `POST /api/attachments`
- `DELETE /api/attachments/[id]`
- `GET|POST|PATCH|DELETE /api/library/items`
- `GET|POST /api/meetings/next`
- `POST /api/weekly-plan/generate`
- `GET|POST /api/cron/weekly-plan` (token-protected)
- `GET|PATCH /api/settings/whatsapp`
- `GET /api/surveys/conferences`
- `POST /api/surveys/conferences/[id]/responses`
- `GET /api/surveys/discernment/current`
- `POST /api/surveys/discernment/responses`
- `GET /api/admin/surveys/insights`

## Kimi 2.5 parallel orchestration (20 agents)
Task manifest:
- `documentation/technical/kimi_tasks.json`

Runbook:
- `documentation/technical/AGENT_PARALLEL_RUNBOOK.md`

Generate API route inventory:
```bash
python3 scripts/generate_api_routes_doc.py
```

Create 20 worktrees/branches:
```bash
bash scripts/setup_kimi_worktrees.sh \
  /Users/oliviercloutier/Desktop/Simuvaction \
  /Users/oliviercloutier/Desktop/Simuvaction-agents \
  main 20 codex/kimi-
```

Run all Kimi agents (collect diffs only):
```bash
OPENROUTER_API_KEY=<your_key> \
python3 scripts/orchestrate_kimi_agents.py \
  --tasks-file documentation/technical/kimi_tasks.json \
  --model moonshotai/kimi-k2.5 \
  --max-workers 20 \
  --expected-task-count 20
```

Apply valid diffs on integration branch:
```bash
OPENROUTER_API_KEY=<your_key> \
python3 scripts/orchestrate_kimi_agents.py \
  --tasks-file documentation/technical/kimi_tasks.json \
  --model moonshotai/kimi-k2.5 \
  --max-workers 20 \
  --expected-task-count 20 \
  --apply-diffs \
  --integration-branch codex/integration-kimi \
  --base-branch main
```

Shortcut wrapper (inventory + run):
```bash
OPENROUTER_API_KEY=<your_key> bash scripts/run_kimi_parallel.sh \
  /Users/oliviercloutier/Desktop/Simuvaction \
  documentation/technical/kimi_tasks.json \
  moonshotai/kimi-k2.5 20 false
```
