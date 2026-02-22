# Simuvaction War Room V1

Desktop-first private web app for two teammates (Olivier + Yvette), built with Next.js App Router, TypeScript, Prisma, and Postgres.

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
- App: http://localhost:3000
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

## API surface (v1)
- `POST /api/auth/unlock`
- `POST /api/auth/logout`
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
