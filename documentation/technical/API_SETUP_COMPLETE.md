# SimuVaction API Setup (Complete)

## Scope
This setup document covers:
- API security baseline
- Consent-gated analytics
- Conference surveys + discernment progression APIs
- Kimi 2.5 multi-agent orchestration workflow

## Environment variables
Set in local `.env` and Vercel project settings:

- `DATABASE_URL`
- `APP_PASSPHRASE_BCRYPT_HASH`
- `SESSION_SECRET` (minimum 32 chars)
- `CRON_SECRET`
- `OPENAI_API_KEY` (optional for OpenAI-native tooling)
- `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `OPENROUTER_API_KEY` (required for Kimi orchestration)
- `NEXT_PUBLIC_COOKIE_CONSENT_ENABLED=true`
- `SURVEY_WAVE_INTERVAL_DAYS=15`

## API contract to preserve
- `GET /api/public/config`
- `POST /api/consent`
- `POST /api/analytics/event`
- `GET /api/surveys/conferences`
- `POST /api/surveys/conferences/:id/responses`
- `GET /api/surveys/discernment/current`
- `POST /api/surveys/discernment/responses`
- `GET /api/admin/surveys/insights`

## Activation (local)
```bash
cd /Users/oliviercloutier/Desktop/Simuvaction
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Validation baseline
```bash
npm run prisma:generate
npm run lint
npm run build
```

## Kimi orchestration quick start
```bash
cd /Users/oliviercloutier/Desktop/Simuvaction
python3 scripts/orchestrate_kimi_agents.py \
  --tasks-file documentation/technical/kimi_tasks.json \
  --model moonshotai/kimi-k2.5 \
  --max-workers 20 \
  --expected-task-count 20
```

To apply only valid diffs on integration branch:
```bash
python3 scripts/orchestrate_kimi_agents.py \
  --tasks-file documentation/technical/kimi_tasks.json \
  --model moonshotai/kimi-k2.5 \
  --max-workers 20 \
  --expected-task-count 20 \
  --apply-diffs \
  --integration-branch codex/integration-kimi \
  --base-branch main
```

## Guardrails enforced by orchestrator
- Rejects task manifests that do not contain exactly 20 tasks (unless overridden).
- Rejects overlapping ownership in `allowed_files` (unless `--allow-overlaps` is explicitly used).
- Marks a task as apply-ready only when:
  - response contains required sections,
  - unified diff exists,
  - diff touches only allowed files,
  - response is not flagged `BLOCKED`.
