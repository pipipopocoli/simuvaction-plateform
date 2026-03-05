# SimuVaction Public Copy Source

## Purpose
This document defines the extraction source and rules used to build `content/simuvaction-site-copy.json`.

## Source pages (locked)
- `https://www.simuvaction.com/`
- `https://www.simuvaction.com/general-clean`
- `https://www.simuvaction.com/2023-partners`
- `https://www.simuvaction.com/2022-partners`

## Extraction script
- Script: `scripts/extract_simuvaction_text.py`
- Output: `content/simuvaction-site-copy.json`

## Extraction rules
1. Parse pages in DOM order.
2. Extract textual blocks from: `h1..h6`, `p`, `li`.
3. Normalize whitespace only (no translation, no paraphrase).
4. De-duplicate strictly per page (not cross-page).
5. Keep source fidelity, including legacy placeholder text.

## JSON shape
- `generatedAt`
- `sourceUrl`
- `pages[]`:
  - `sourceUrl`
  - `path`
  - `title`
  - `blocks[]`

## Regenerate command
```bash
cd /Users/oliviercloutier/Desktop/Simuvaction
python3 scripts/extract_simuvaction_text.py
```
