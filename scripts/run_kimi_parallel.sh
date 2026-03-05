#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-/Users/oliviercloutier/Desktop/Simuvaction}"
TASKS_FILE="${2:-documentation/technical/kimi_tasks.json}"
MODEL="${3:-moonshotai/kimi-k2.5}"
WORKERS="${4:-20}"
APPLY="${5:-false}"
BASE_URL="${OPENROUTER_BASE_URL:-https://openrouter.ai/api/v1}"
REQUEST_TIMEOUT_SECONDS="${KIMI_REQUEST_TIMEOUT_SECONDS:-180}"

cd "$ROOT_DIR"

if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "Error: OPENROUTER_API_KEY is not set."
  exit 1
fi

python3 scripts/generate_api_routes_doc.py

if [ "$APPLY" = "true" ]; then
  python3 scripts/orchestrate_kimi_agents.py \
    --tasks-file "$TASKS_FILE" \
    --model "$MODEL" \
    --base-url "$BASE_URL" \
    --max-workers "$WORKERS" \
    --request-timeout-seconds "$REQUEST_TIMEOUT_SECONDS" \
    --expected-task-count 20 \
    --apply-diffs \
    --integration-branch codex/integration-kimi \
    --base-branch main
else
  python3 scripts/orchestrate_kimi_agents.py \
    --tasks-file "$TASKS_FILE" \
    --model "$MODEL" \
    --base-url "$BASE_URL" \
    --max-workers "$WORKERS" \
    --request-timeout-seconds "$REQUEST_TIMEOUT_SECONDS" \
    --expected-task-count 20
fi
