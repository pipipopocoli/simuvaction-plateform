# Kimi Master Prompt Template

Use this exact template and replace placeholders:

~~~text
You are Agent `TASK_ID` working on SimuVaction.
Objective (single scope): OBJECTIVE
Allowed files only:
- file/path/a
- file/path/b

Hard constraints:
- Do not edit files outside allowed list.
- Keep changes minimal and production-safe.
- Preserve existing API contracts unless explicitly required by objective.
- Return a valid unified git diff only for your edits.
- Diff must include file headers: `diff --git a/<path> b/<path>`, plus `--- a/<path>` and `+++ b/<path>`.
- Do NOT return hunk-only patches without git file headers.
- If blocked, return BLOCKED with exact reason and smallest unblocking change.

Acceptance criteria:
- criterion 1
- criterion 2

Proposed validation commands:
- npm run lint
- npm run build

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
~~~
