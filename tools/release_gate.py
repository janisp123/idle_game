"""Read-only, fail-closed required PR release gate. Never merges or deploys."""
import json
import os
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen

SUITES = (
    "website", "combat", "endgame", "lab", "baseline", "integrity",
    "team_audit", "sensitivity",
)
RESEARCH_FILES = frozenset({
    "docs/RESEARCH_LIBRARY.md", "docs/USEFUL_EXAMPLES.md", "docs/RESEARCH_MAP.md",
    "docs/RESEARCH_QUEUE.md", "docs/BAD_EXAMPLES.md",
})

def research_only(files):
    """Only the standing, exact research-doc allowlist; no deletions or renames."""
    return bool(files) and all(
        f.get("status") in ("added", "modified")
        and isinstance(f.get("filename"), str)
        and (f["filename"] in RESEARCH_FILES
             or re.fullmatch(r"docs/library/[^/]+\.md", f["filename"]) is not None)
        for f in files
    )

def verify_revision(pr, expected, repo):
    head = pr.get("head") or {}
    base = pr.get("base") or {}
    if (head.get("repo") or {}).get("full_name") != repo:
        raise ValueError("External or unavailable head repository; internal PR required")
    if (base.get("repo") or {}).get("full_name") != repo or base.get("ref") != "main":
        raise ValueError("Unexpected base repository or branch")
    if pr.get("state") != "open" or head.get("sha") != expected["head"]["sha"] or base.get("sha") != expected["base"]["sha"]:
        raise ValueError("PR revision changed; require a fresh check")
    if not isinstance(pr.get("changed_files"), int) or not 1 <= pr["changed_files"] <= 3000:
        raise ValueError("Missing, empty or too-large PR file inventory")

def check_results(results):
    """No implicit success: every known dependency must have its expected result."""
    expected = {"scope", "protocol", *SUITES}
    if not isinstance(results, dict) or set(results) != expected:
        raise ValueError("Missing or unexpected release-gate dependencies")
    if results["scope"].get("result") != "success":
        raise ValueError("Scope check did not succeed")
    scope = results["scope"].get("outputs", {}).get("research_only")
    if scope not in ("true", "false"):
        raise ValueError("Missing or invalid scope classification")
    wanted = {"scope": "success", "protocol": "success"}
    wanted.update({name: ("skipped" if scope == "true" else "success") for name in SUITES})
    errors = [f"{name}: expected {status}, got {results[name].get('result')}"
              for name, status in wanted.items() if results[name].get("result") != status]
    if errors:
        raise ValueError("; ".join(errors))
    return wanted

def read_api(path):
    url = os.environ["GITHUB_API_URL"].rstrip("/") + path
    request = Request(url, headers={
        "Authorization": "Bearer " + os.environ["GH_TOKEN"],
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "idle-game-release-gate",
    })
    with urlopen(request, timeout=20) as response:
        return json.load(response)

def scope_check():
    if os.environ.get("GITHUB_EVENT_NAME") != "pull_request":
        raise ValueError("Release scope requires pull_request event")
    repo = os.environ["GITHUB_REPOSITORY"]
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
    expected = event["pull_request"]
    number = event["number"]
    if not isinstance(number, int) or number < 1:
        raise ValueError("Invalid PR number")
    endpoint = f"/repos/{repo}/pulls/{number}"
    pr = read_api(endpoint)
    verify_revision(pr, expected, repo)
    count = pr["changed_files"]
    files = []
    for page in range(1, (count + 99) // 100 + 1):
        batch = read_api(f"{endpoint}/files?per_page=100&page={page}")
        if not isinstance(batch, list):
            raise ValueError("Invalid PR file response")
        files.extend(batch)
    names = [f.get("filename") for f in files]
    if len(files) != count or any(not isinstance(n, str) for n in names) or len(set(names)) != count:
        raise ValueError("Incomplete or duplicate PR file inventory")
    latest = read_api(endpoint)
    verify_revision(latest, expected, repo)
    if latest["changed_files"] != count:
        raise ValueError("PR file inventory changed")
    value = "true" if research_only(files) else "false"
    with open(os.environ["GITHUB_OUTPUT"], "a", encoding="utf-8") as output:
        output.write("research_only=" + value + "\n")
    print(f"Release scope: internal PR #{number}, {count} files, research_only={value}")

def main():
    if sys.argv[1:] == ["scope"]:
        scope_check()
    elif sys.argv[1:] == ["final"]:
        wanted = check_results(json.loads(os.environ["GATE_RESULTS"]))
        print("Release gate passed: " + json.dumps(wanted, sort_keys=True))
    else:
        raise ValueError("Expected scope or final")

if __name__ == "__main__":
    main()
