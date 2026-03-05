#!/usr/bin/env python3
from __future__ import annotations

import argparse
import concurrent.futures
import datetime as dt
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import textwrap
import time
from typing import Any, Dict, Iterable, List, Optional, Tuple

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover
    OpenAI = None  # type: ignore


def _die(message: str, code: int = 1) -> None:
    print(f"Error: {message}", file=sys.stderr)
    raise SystemExit(code)


def _read_json(path: Path) -> Dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        _die(f"Tasks file not found: {path}")
    except json.JSONDecodeError as exc:
        _die(f"Invalid JSON in tasks file {path}: {exc}")


def _as_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        chunks: List[str] = []
        for item in content:
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    chunks.append(text)
        return "\n".join(chunks).strip()
    return str(content)


def _read_file_context(repo_root: Path, relative_path: str, max_chars: int = 16000) -> str:
    path = (repo_root / relative_path).resolve()
    if not path.exists():
        return f"[FILE_MISSING] {relative_path}"
    try:
        content = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return f"[FILE_BINARY_OR_NON_UTF8] {relative_path}"

    if len(content) > max_chars:
        clipped = content[:max_chars]
        return (
            f"[TRUNCATED to first {max_chars} chars] {relative_path}\n"
            f"{clipped}\n"
            f"...[TRUNCATED]"
        )
    return content


def _build_prompt(task: Dict[str, Any], repo_root: Path) -> str:
    task_id = task["id"]
    objective = task["objective"]
    allowed_files = task["allowed_files"]
    reference_files = task.get("reference_files", [])
    acceptance_criteria = task["acceptance_criteria"]
    validation_commands = task["validation_commands"]

    allowed_block = "\n".join(f"- {item}" for item in allowed_files)
    reference_block = "\n".join(f"- {item}" for item in reference_files) if reference_files else "- (none)"
    acceptance_block = "\n".join(f"- {item}" for item in acceptance_criteria)
    validation_block = "\n".join(f"- {item}" for item in validation_commands)
    editable_context_parts: List[str] = []
    for relative_path in allowed_files:
        snapshot = _read_file_context(repo_root, relative_path)
        editable_context_parts.append(
            "\n".join(
                [
                    f"FILE: {relative_path}",
                    "```",
                    snapshot,
                    "```",
                ]
            )
        )
    editable_context_block = "\n\n".join(editable_context_parts)

    reference_context_parts: List[str] = []
    for relative_path in reference_files:
        snapshot = _read_file_context(repo_root, relative_path)
        reference_context_parts.append(
            "\n".join(
                [
                    f"REFERENCE_FILE: {relative_path}",
                    "```",
                    snapshot,
                    "```",
                ]
            )
        )
    reference_context_block = "\n\n".join(reference_context_parts) if reference_context_parts else "(none)"

    return textwrap.dedent(
        f"""
        You are Agent `{task_id}` working on SimuVaction.
        Objective (single scope): {objective}
        Allowed files only:
        {allowed_block}
        Reference files (read-only, never edit):
        {reference_block}

        Repository root:
        - {repo_root}

        Current editable file snapshots (authoritative base; generate diff against these exact contents):
        {editable_context_block}

        Current reference file snapshots (read-only context):
        {reference_context_block}

        Hard constraints:
        - Do not edit files outside allowed list.
        - Never edit reference files.
        - Keep changes minimal and production-safe.
        - Preserve existing API contracts unless explicitly required by objective.
        - Return a valid unified git diff only for your edits.
        - Diff must include full file headers: lines like "diff --git a/<path> b/<path>" and "--- a/<path>" / "+++ b/<path>".
        - Do NOT return hunk-only patches without git file headers.
        - If blocked, return BLOCKED with exact reason and smallest unblocking change.

        Acceptance criteria:
        {acceptance_block}

        Proposed validation commands:
        {validation_block}

        Output format exactly:
        SUMMARY:
        - ...
        ASSUMPTIONS:
        - ...
        UNIFIED_DIFF:
        ```diff
        ...git diff...
        ```
        VALIDATION_COMMANDS:
        - ...
        RISKS:
        - ...
        """
    ).strip()


DIFF_RE = re.compile(r"UNIFIED_DIFF:\s*```(?:diff)?\s*(.*?)```", re.IGNORECASE | re.DOTALL)
DIFF_FALLBACK_RE = re.compile(r"```diff\s*(.*?)```", re.IGNORECASE | re.DOTALL)
DIFF_FILE_RE = re.compile(r"^diff --git a/(.+?) b/(.+?)$", re.MULTILINE)
PLUSPLUS_RE = re.compile(r"^\+\+\+ (.+?)$", re.MULTILINE)
SECTION_HEADERS = ["SUMMARY:", "ASSUMPTIONS:", "UNIFIED_DIFF:", "VALIDATION_COMMANDS:", "RISKS:"]


def _extract_diff(text: str) -> Optional[str]:
    match = DIFF_RE.search(text)
    if match:
        return match.group(1).strip() + "\n"
    fallback = DIFF_FALLBACK_RE.search(text)
    if fallback:
        return fallback.group(1).strip() + "\n"
    return None


def _extract_changed_files(diff: str) -> List[str]:
    files = set()
    for _, target in DIFF_FILE_RE.findall(diff):
        files.add(target.strip())
    for match in PLUSPLUS_RE.findall(diff):
        candidate = match.strip()
        if candidate == "/dev/null":
            continue
        if candidate.startswith("a/") or candidate.startswith("b/"):
            candidate = candidate[2:]
        files.add(candidate)
    return sorted(files)


def _render_progress(done: int, total: int, width: int = 30) -> str:
    if total <= 0:
        return "[------------------------------] 0/0"
    ratio = done / total
    filled = int(width * ratio)
    bar = "#" * filled + "-" * (width - filled)
    return f"[{bar}] {done}/{total} ({ratio * 100:5.1f}%)"


def _diff_has_git_headers(diff: str) -> bool:
    return DIFF_FILE_RE.search(diff) is not None


def _path_matches_rule(path: str, rule: str) -> bool:
    normalized_path = path.lstrip("./")
    normalized_rule = rule.lstrip("./")
    if normalized_rule.endswith("/*"):
        return normalized_path.startswith(normalized_rule[:-1])
    if normalized_rule.endswith("/"):
        return normalized_path.startswith(normalized_rule)
    return normalized_path == normalized_rule


def _validate_allowed_files(files: Iterable[str], allowed_rules: Iterable[str]) -> Tuple[bool, List[str]]:
    violations: List[str] = []
    allowed = list(allowed_rules)
    for path in files:
        if not any(_path_matches_rule(path, rule) for rule in allowed):
            violations.append(path)
    return (len(violations) == 0, violations)


def _validate_task_manifest(
    tasks: List[Dict[str, Any]],
    expected_count: int,
    allow_overlaps: bool,
) -> None:
    if len(tasks) != expected_count:
        _die(f"Task manifest contains {len(tasks)} tasks; expected {expected_count}.")

    seen_ids: set[str] = set()
    file_owners: Dict[str, List[str]] = {}
    for task in tasks:
        task_id = task["id"]
        if task_id in seen_ids:
            _die(f"Duplicate task id found: {task_id}")
        seen_ids.add(task_id)
        for path in task["allowed_files"]:
            file_owners.setdefault(path, []).append(task_id)

    overlaps = {path: owners for path, owners in file_owners.items() if len(owners) > 1}
    if overlaps and not allow_overlaps:
        formatted = "; ".join(f"{path}: {owners}" for path, owners in sorted(overlaps.items()))
        _die(f"Task ownership overlap detected. Use --allow-overlaps to bypass. Details: {formatted}")


def _validate_response_format(text: str) -> Tuple[bool, List[str], bool]:
    missing = [header for header in SECTION_HEADERS if header not in text]
    blocked = "BLOCKED" in text
    format_ok = len(missing) == 0 and not blocked
    return format_ok, missing, blocked


def _run_task(
    client: Any,
    model: str,
    reasoning_enabled: bool,
    task: Dict[str, Any],
    repo_root: Path,
) -> Dict[str, Any]:
    prompt = _build_prompt(task, repo_root)
    extra_body = {"reasoning": {"enabled": True}} if reasoning_enabled else None
    kwargs: Dict[str, Any] = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
    }
    if extra_body is not None:
        kwargs["extra_body"] = extra_body

    response = client.chat.completions.create(**kwargs)
    message = response.choices[0].message
    text = _as_text(getattr(message, "content", ""))
    format_ok, missing_sections, blocked = _validate_response_format(text)

    diff = _extract_diff(text)
    diff_structure_ok = _diff_has_git_headers(diff) if diff else False
    changed_files = _extract_changed_files(diff) if diff and diff_structure_ok else []

    if not diff:
        allowed_ok, violations = (False, [])
    elif not diff_structure_ok:
        allowed_ok, violations = (False, ["DIFF_MISSING_GIT_HEADERS"])
    else:
        allowed_ok, violations = _validate_allowed_files(changed_files, task["allowed_files"])

    ready_for_apply = bool(diff) and diff_structure_ok and bool(changed_files) and allowed_ok and format_ok and not blocked

    return {
        "task_id": task["id"],
        "prompt": prompt,
        "text": text,
        "diff": diff,
        "changed_files": changed_files,
        "allowed_ok": allowed_ok,
        "violations": violations,
        "diff_structure_ok": diff_structure_ok,
        "format_ok": format_ok,
        "missing_sections": missing_sections,
        "blocked": blocked,
        "ready_for_apply": ready_for_apply,
        "response_json": response.model_dump(),
    }


def _ensure_clean_repo(repo_root: Path) -> None:
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        _die("Unable to check git status.")
    if result.stdout.strip():
        _die("Repository is not clean. Commit or stash changes before --apply-diffs.")


def _checkout_integration_branch(repo_root: Path, branch: str, base_branch: str) -> None:
    exists = subprocess.run(
        ["git", "show-ref", "--verify", f"refs/heads/{branch}"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    ).returncode == 0

    if exists:
        cmd = ["git", "checkout", branch]
    else:
        cmd = ["git", "checkout", "-b", branch, base_branch]
    subprocess.run(cmd, cwd=repo_root, check=True)


def _apply_diff(repo_root: Path, diff_path: Path) -> Tuple[bool, str]:
    process = subprocess.run(
        ["git", "apply", "--3way", str(diff_path)],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )
    if process.returncode == 0:
        return True, "applied"
    message = (process.stderr or process.stdout).strip() or "unknown error"
    return False, message


def main() -> None:
    parser = argparse.ArgumentParser(description="Orchestrate Kimi agents and collect unified diffs.")
    parser.add_argument(
        "--tasks-file",
        default="documentation/technical/kimi_tasks.json",
        help="Path to task manifest JSON.",
    )
    parser.add_argument(
        "--repo-root",
        default=".",
        help="Repository root for diff application.",
    )
    parser.add_argument(
        "--output-dir",
        default=".orchestration/kimi",
        help="Directory where raw responses and diffs are saved.",
    )
    parser.add_argument(
        "--model",
        default="moonshotai/kimi-k2.5",
        help="Model id to use.",
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        help="OpenAI-compatible base URL.",
    )
    parser.add_argument(
        "--api-key-env",
        default="OPENROUTER_API_KEY",
        help="Environment variable containing API key.",
    )
    parser.add_argument(
        "--max-workers",
        type=int,
        default=20,
        help="Maximum parallel agents.",
    )
    parser.add_argument(
        "--request-timeout-seconds",
        type=int,
        default=180,
        help="Per-request timeout in seconds for model calls.",
    )
    parser.add_argument(
        "--no-progress",
        action="store_true",
        help="Disable live progress bar output.",
    )
    parser.add_argument(
        "--disable-reasoning",
        action="store_true",
        help="Disable extra_body.reasoning.enabled.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate task manifest and generate prompts without API calls.",
    )
    parser.add_argument(
        "--apply-diffs",
        action="store_true",
        help="Apply valid diffs in task order on integration branch.",
    )
    parser.add_argument(
        "--integration-branch",
        default="codex/integration-kimi",
        help="Integration branch for applying diffs.",
    )
    parser.add_argument(
        "--base-branch",
        default="main",
        help="Base branch when creating integration branch.",
    )
    parser.add_argument(
        "--expected-task-count",
        type=int,
        default=20,
        help="Expected number of tasks in manifest.",
    )
    parser.add_argument(
        "--allow-overlaps",
        action="store_true",
        help="Allow overlapping allowed_files ownership across tasks.",
    )
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    tasks_path = (repo_root / args.tasks_file).resolve() if not Path(args.tasks_file).is_absolute() else Path(args.tasks_file)
    output_root = (repo_root / args.output_dir).resolve()
    task_manifest = _read_json(tasks_path)
    tasks = task_manifest.get("tasks")
    if not isinstance(tasks, list) or not tasks:
        _die("Task manifest must contain a non-empty 'tasks' array.")
    _validate_task_manifest(tasks, args.expected_task_count, args.allow_overlaps)

    now = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    run_dir = output_root / now
    prompts_dir = run_dir / "prompts"
    responses_dir = run_dir / "responses"
    diffs_dir = run_dir / "diffs"
    prompts_dir.mkdir(parents=True, exist_ok=True)
    responses_dir.mkdir(parents=True, exist_ok=True)
    diffs_dir.mkdir(parents=True, exist_ok=True)

    for task in tasks:
        for key in ("id", "objective", "allowed_files", "acceptance_criteria", "validation_commands"):
            if key not in task:
                _die(f"Task missing required key '{key}': {task}")
        if not isinstance(task["allowed_files"], list):
            _die(f"Task '{task['id']}' has invalid allowed_files (expected list).")
        if not isinstance(task["acceptance_criteria"], list):
            _die(f"Task '{task['id']}' has invalid acceptance_criteria (expected list).")
        if not isinstance(task["validation_commands"], list):
            _die(f"Task '{task['id']}' has invalid validation_commands (expected list).")
        if "reference_files" in task and not isinstance(task["reference_files"], list):
            _die(f"Task '{task['id']}' has invalid reference_files (expected list).")
        prompt_text = _build_prompt(task, repo_root)
        (prompts_dir / f"{task['id']}.md").write_text(prompt_text + "\n", encoding="utf-8")

    if args.dry_run:
        print(f"Dry run complete. Prompts generated in: {prompts_dir}")
        return

    if OpenAI is None:
        _die("openai package is not installed. Run: python3 -m pip install openai")

    api_key = os.getenv(args.api_key_env)
    if not api_key:
        _die(f"Missing API key. Export {args.api_key_env}.")

    client = OpenAI(
        base_url=args.base_url,
        api_key=api_key,
        timeout=args.request_timeout_seconds,
    )
    reasoning_enabled = not args.disable_reasoning
    results: List[Dict[str, Any]] = []
    total_tasks = len(tasks)
    completed_tasks = 0
    started_at = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.max_workers) as executor:
        future_map = {
            executor.submit(_run_task, client, args.model, reasoning_enabled, task, repo_root): task["id"]
            for task in tasks
        }
        for future in concurrent.futures.as_completed(future_map):
            task_id = future_map[future]
            try:
                result = future.result()
            except Exception as exc:  # pragma: no cover
                result = {
                    "task_id": task_id,
                    "error": str(exc),
                }
            results.append(result)
            completed_tasks += 1
            if args.no_progress:
                print(f"Finished {task_id} ({completed_tasks}/{total_tasks})")
            else:
                progress = _render_progress(completed_tasks, total_tasks)
                elapsed = time.time() - started_at
                print(
                    f"\r{progress} | elapsed {elapsed:6.1f}s | last: {task_id:<8}",
                    end="",
                    flush=True,
                )
        if not args.no_progress:
            print()

    results_by_id = {item["task_id"]: item for item in results if "task_id" in item}
    ordered_results: List[Dict[str, Any]] = []
    for task in tasks:
        task_id = task["id"]
        result = results_by_id.get(task_id, {"task_id": task_id, "error": "missing result"})
        ordered_results.append(result)
        if "error" in result:
            (responses_dir / f"{task_id}.error.txt").write_text(result["error"] + "\n", encoding="utf-8")
            continue

        text = result["text"]
        (responses_dir / f"{task_id}.md").write_text(text + "\n", encoding="utf-8")
        (responses_dir / f"{task_id}.json").write_text(
            json.dumps(result["response_json"], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        if result.get("diff"):
            (diffs_dir / f"{task_id}.diff").write_text(result["diff"], encoding="utf-8")

    apply_report: List[Dict[str, Any]] = []
    if args.apply_diffs:
        _ensure_clean_repo(repo_root)
        _checkout_integration_branch(repo_root, args.integration_branch, args.base_branch)
        for task in tasks:
            task_id = task["id"]
            diff_path = diffs_dir / f"{task_id}.diff"
            result = results_by_id.get(task_id, {})
            if not diff_path.exists():
                apply_report.append({"task_id": task_id, "status": "skipped", "reason": "missing diff"})
                continue
            if not result.get("ready_for_apply", False):
                apply_report.append(
                    {
                        "task_id": task_id,
                        "status": "skipped",
                        "reason": (
                            f"ready_for_apply={result.get('ready_for_apply')}; "
                            f"diff_structure_ok={result.get('diff_structure_ok')}; "
                            f"allowed_ok={result.get('allowed_ok')}; "
                            f"format_ok={result.get('format_ok')}; "
                            f"blocked={result.get('blocked')}; "
                            f"violations={result.get('violations', [])}; "
                            f"missing_sections={result.get('missing_sections', [])}"
                        ),
                    }
                )
                continue
            ok, message = _apply_diff(repo_root, diff_path)
            apply_report.append(
                {
                    "task_id": task_id,
                    "status": "applied" if ok else "failed",
                    "reason": message,
                }
            )

    report = {
        "run_at": now,
        "model": args.model,
        "base_url": args.base_url,
        "tasks_file": str(tasks_path),
        "expected_task_count": args.expected_task_count,
        "allow_overlaps": args.allow_overlaps,
        "results": ordered_results,
        "apply_report": apply_report,
    }
    report_path = run_dir / "run_report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    success_count = sum(1 for item in ordered_results if item.get("ready_for_apply"))
    print(f"Run complete. Ready diffs: {success_count}/{len(tasks)}")
    print(f"Artifacts: {run_dir}")
    print(f"Report: {report_path}")


if __name__ == "__main__":
    main()
