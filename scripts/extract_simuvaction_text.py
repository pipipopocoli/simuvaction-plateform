#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.simuvaction.com"
PAGE_PATHS = [
    "/",
    "/general-clean",
    "/2023-partners",
    "/2022-partners",
]
TEXT_SELECTORS = "h1,h2,h3,h4,h5,h6,p,li"


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _extract_page(url: str, path: str, timeout_seconds: int) -> dict[str, Any]:
    response = requests.get(url, timeout=timeout_seconds)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    title = _clean_text(soup.title.get_text(" ", strip=True)) if soup.title else path
    seen: set[str] = set()
    blocks: list[str] = []

    for node in soup.select(TEXT_SELECTORS):
        text = _clean_text(node.get_text(" ", strip=True))
        if not text:
            continue
        if text in seen:
            continue
        seen.add(text)
        blocks.append(text)

    return {
        "sourceUrl": url,
        "path": path,
        "title": title,
        "blocks": blocks,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract SimuVaction website text content to JSON.")
    parser.add_argument(
        "--output",
        default="content/simuvaction-site-copy.json",
        help="Output JSON file path.",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=int,
        default=30,
        help="HTTP timeout per page.",
    )
    args = parser.parse_args()

    pages: list[dict[str, Any]] = []
    for path in PAGE_PATHS:
        url = urljoin(BASE_URL, path)
        pages.append(_extract_page(url, path, args.timeout_seconds))

    payload = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "sourceUrl": BASE_URL,
        "pages": pages,
    }

    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
