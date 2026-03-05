#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-/Users/oliviercloutier/Desktop/Simuvaction}"
WORKTREE_ROOT="${2:-/Users/oliviercloutier/Desktop/Simuvaction-agents}"
BASE_BRANCH="${3:-main}"
COUNT="${4:-20}"
PREFIX="${5:-codex/kimi-}"

cd "$ROOT_DIR"
mkdir -p "$WORKTREE_ROOT"

for n in $(seq -w 1 "$COUNT"); do
  BRANCH="${PREFIX}${n}"
  TARGET="$WORKTREE_ROOT/agent-${n}"

  if [ -d "$TARGET/.git" ] || [ -f "$TARGET/.git" ]; then
    echo "Skip existing worktree: $TARGET"
    continue
  fi

  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git worktree add "$TARGET" "$BRANCH"
  else
    git worktree add -b "$BRANCH" "$TARGET" "$BASE_BRANCH"
  fi
done

echo "Worktrees ready under: $WORKTREE_ROOT"
