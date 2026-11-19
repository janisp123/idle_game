#!/usr/bin/env python3
"""Check structural AI-agent protocol conventions (Python stdlib only)."""
from pathlib import Path
import sys

root = Path(__file__).resolve().parents[1]
required = (
    "AGENTS.md", "docs/TD_LIST.md", "docs/WORK_CHECKPOINT.md",
    "docs/CHANGELOG.md", "docs/DECISIONS.md", "docs/PROJECT_PLAYBOOK.md",
    "docs/AGENT_PROTOCOL.md", "docs/NEW_PROJECT_SETUP.md",
    ".github/workflows/project-protocol.yml", ".github/pull_request_template.md",
)
errors = [f"Missing file: {p}" for p in required if not (root / p).is_file()]
agent = root / "AGENTS.md"
if agent.is_file():
    content = agent.read_text(encoding="utf-8")
    for token in ("Project protocol v1.0", "docs/TD_LIST.md", "chat", "cw", "codex"):
        if token not in content:
            errors.append(f"AGENTS.md missing: {token}")
    if "docs/TD.learn.md" in content or "docs/TD.question.md" in content:
        errors.append("AGENTS.md still refers to a legacy active TD path")
for old in ("docs/TD.learn.md", "docs/TD.question.md"):
    if (root / old).exists():
        errors.append(f"Legacy active TD file exists: {old}")
td = root / "docs/TD_LIST.md"
if td.is_file() and not td.read_text(encoding="utf-8").lstrip().startswith("#"):
    errors.append("TD_LIST.md must start with a Markdown heading")
if errors:
    for e in errors:
        print("FAIL:", e, file=sys.stderr)
    raise SystemExit(1)
print("PASS: Shared AI-agent project protocol v1.0 layout")
