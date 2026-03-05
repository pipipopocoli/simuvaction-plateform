# Kimi 2.5 Parallel Runbook (20 Agents, deterministic)

## Scope and guarantees
- 20 agents exactly (`kimi-01` ... `kimi-20`).
- Model: `moonshotai/kimi-k2.5` with reasoning enabled.
- Ownership policy: one file owner per task, no overlap.
- Integration target: `codex/integration-kimi`.

## Preconditions
- Repo path: `/Users/oliviercloutier/Desktop/Simuvaction`
- Git clean state required before `--apply-diffs`.
- `OPENROUTER_API_KEY` exported.
- Optional override: `OPENROUTER_BASE_URL` (defaults to `https://openrouter.ai/api/v1`).
- Python package `openai` installed.

## Ownership matrix (locked)
- Lot A Security: `kimi-01..04`
- Lot B Consent/Analytics: `kimi-05..08`
- Lot C Data/Prisma: `kimi-09..12`
- Lot D API Surveys: `kimi-13..16`
- Lot E UX+Docs+Runbook: `kimi-17..20`

The manifest source of truth is `documentation/technical/kimi_tasks.json`.

## 1) Baseline freeze
```bash
cd /Users/oliviercloutier/Desktop/Simuvaction
git status --short
```
If non-empty, commit/stash before integration mode.

## 2) Create worktrees and branches
```bash
cd /Users/oliviercloutier/Desktop/Simuvaction
bash scripts/setup_kimi_worktrees.sh \
  /Users/oliviercloutier/Desktop/Simuvaction \
  /Users/oliviercloutier/Desktop/Simuvaction-agents \
  main 20 codex/kimi-
```

## 3) Generate route inventory (before agent execution)
```bash
cd /Users/oliviercloutier/Desktop/Simuvaction
python3 scripts/generate_api_routes_doc.py
```

## 4) Execute 20 agents in parallel (collect only)
```bash
cd /Users/oliviercloutier/Desktop/Simuvaction
python3 scripts/orchestrate_kimi_agents.py \
  --tasks-file documentation/technical/kimi_tasks.json \
  --model moonshotai/kimi-k2.5 \
  --max-workers 20 \
  --expected-task-count 20
```

Artifacts:
- `.orchestration/kimi/<timestamp>/prompts`
- `.orchestration/kimi/<timestamp>/responses`
- `.orchestration/kimi/<timestamp>/diffs`
- `.orchestration/kimi/<timestamp>/run_report.json`

The orchestrator rejects apply candidates unless:
- unified diff exists
- changed files are within `allowed_files`
- required sections exist (`SUMMARY`, `ASSUMPTIONS`, `UNIFIED_DIFF`, `VALIDATION_COMMANDS`, `RISKS`)
- response is not `BLOCKED`

## 5) Apply valid diffs in task order (01→20)
```bash
cd /Users/oliviercloutier/Desktop/Simuvaction
python3 scripts/orchestrate_kimi_agents.py \
  --tasks-file documentation/technical/kimi_tasks.json \
  --model moonshotai/kimi-k2.5 \
  --max-workers 20 \
  --expected-task-count 20 \
  --apply-diffs \
  --integration-branch codex/integration-kimi \
  --base-branch main
```

## 6) Validation gates by lot
- Lot A (01–04): `npm run lint && npm run build`
- Lot B (05–08): `npm run lint && npm run build`
- Lot C (09–12): `npm run prisma:generate && npm run build`
- Lot D (13–16): `npm run build`
- Lot E (17–20): `npm run lint && npm run build`
- Final: `npm run prisma:generate && npm run lint && npm run build`

## 7) Failure and conflict policy
1. Out-of-scope diff => status `skipped`, relaunch same `TASK_ID`.
2. Conflict on apply => open mini corrective task with owner’s `allowed_files` only.
3. Build broken after a lot => rollback latest applied diff, relaunch targeted corrective task.
4. No manual cross-owner edits without explicit corrective task.

## 8) Acceptance checklist
- Consent:
  - without consent: `/api/analytics/event` persists nothing
  - with consent: `page_view` + dwell persisted
- Security:
  - private API without valid session -> `401`
  - reset tokens are stored hash-only
  - invalid/missing `SESSION_SECRET` fails explicitly
- Surveys:
  - 7 conference surveys seeded
  - one response per user/survey
  - required answers enforced
- Discernment:
  - active wave/fallback correct
  - one response per user/wave
  - admin aggregates contain no NaN
- Navigation:
  - `/` public
  - `/dashboard` and `/surveys` protected
  - login/setup/reset flow coherent
