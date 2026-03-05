#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import re
import datetime as dt

METHOD_RE = re.compile(r"export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b")


def to_route(path: Path, repo_root: Path) -> str:
    relative = path.relative_to(repo_root).as_posix()
    route = relative.replace("app/api", "")
    route = route[: -len("/route.ts")]
    if not route:
        return "/"
    return re.sub(r"\[([^\]]+)\]", r":\1", route)


def main() -> None:
    repo_root = Path.cwd().resolve()
    api_root = repo_root / "app" / "api"
    output_path = repo_root / "documentation" / "technical" / "API_ROUTES.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "# API Routes",
        "",
        f"_Generated: {dt.datetime.now().isoformat(timespec='seconds')}_",
        "",
        "| Methods | Route | File |",
        "|---|---|---|",
    ]

    for file_path in sorted(api_root.rglob("route.ts")):
        content = file_path.read_text(encoding="utf-8")
        methods = sorted(set(METHOD_RE.findall(content)))
        methods_text = ", ".join(methods) if methods else "N/A"
        route = to_route(file_path, repo_root)
        relative = file_path.relative_to(repo_root).as_posix()
        lines.append(f"| `{methods_text}` | `{route}` | `{relative}` |")

    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
