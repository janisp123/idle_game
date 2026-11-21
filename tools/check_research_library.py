#!/usr/bin/env python3
"""Validate public research Markdown without running any researched code."""
from collections import Counter
from pathlib import Path
from urllib.parse import unquote
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "docs" / "RESEARCH_LIBRARY.md"
CATALOG = ROOT / "docs" / "USEFUL_EXAMPLES.md"
MAP = ROOT / "docs" / "RESEARCH_MAP.md"
QUEUE = ROOT / "docs" / "RESEARCH_QUEUE.md"
BAD = ROOT / "docs" / "BAD_EXAMPLES.md"
ARTICLES = sorted((ROOT / "docs" / "library").glob("*.md"))
DOCUMENTS = [INDEX, CATALOG, MAP, QUEUE, BAD, *ARTICLES]

# External HTTPS citations are allowed; this validator does not fetch them.
LINK = re.compile(r'(?<!!)\[[^\]]+\]\((<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\)')
HEADING = re.compile(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$")
FENCE = re.compile(r"^\s*((?:\x60){3,}|~{3,})")
SECTION_ID = re.compile(r"^## (P\d{2})\s+[—-]", re.M)
ROW_ID = re.compile(r"^\|\s*(P\d{2})\s*\|", re.M)
QUESTION_ID = re.compile(r"^\|\s*(RQ-\d{3})\s*\|", re.M)
BAD_ID = re.compile(r"^\|\s*(BAD-\d{3})\s*\|", re.M)


def prose_lines(content):
    fence = None
    for line in content.splitlines():
        marker = FENCE.match(line)
        if marker:
            char = marker.group(1)[0]
            if fence is None:
                fence = char
            elif fence == char:
                fence = None
            continue
        if fence is None:
            yield line


def slug(title):
    """GitHub-like anchor generation for simple Markdown headings."""
    title = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", title)
    title = re.sub(r"<[^>]*>", "", title)
    title = re.sub(r"[\x60*_~]", "", title).lower()
    title = re.sub(r"[^\w\s-]", "", title)
    return re.sub(r"\s", "-", title.strip())


def anchors(content):
    counts = Counter()
    found = set()
    for line in prose_lines(content):
        match = HEADING.match(line)
        if match:
            base = slug(match.group(1))
            suffix = f"-{counts[base]}" if counts[base] else ""
            found.add(base + suffix)
            counts[base] += 1
    return found


def main():
    errors = []
    contents = {}
    for path in DOCUMENTS:
        if not path.is_file():
            errors.append(f"Missing: {path.relative_to(ROOT)}")
        else:
            contents[path] = path.read_text(encoding="utf-8")

    if INDEX not in contents or CATALOG not in contents or MAP not in contents or QUEUE not in contents or BAD not in contents:
        return errors

    if len(contents[MAP].encode("utf-8")) > 3500:
        errors.append("Research map exceeds 3.5 KB; keep it a short lookup, not an article")

    headings = {path: anchors(content) for path, content in contents.items()}
    titles = Counter()
    for path, content in contents.items():
        short = path.relative_to(ROOT)
        if path in ARTICLES and path.name != "ENTRY_TEMPLATE.md":
            first_heading = next((line for line in prose_lines(content) if line.startswith("# ")), "")
            titles[slug(first_heading[2:])] += 1
        for line in prose_lines(content):
            for link in LINK.finditer(line):
                value = unquote(link.group(1).strip("<>"))
                relative, sep, fragment = value.partition("#")
                if re.match(r"^https://[^/\\s]+", value, re.I):
                    continue  # External HTTPS citation; never fetch remote content here.
                if ":" in relative or relative.startswith("//"):
                    errors.append(f"{short}: unsafe or non-HTTPS link: {value}")
                    continue
                target = (path.parent / relative).resolve() if relative else path
                if not target.is_relative_to(ROOT) or not target.is_file():
                    errors.append(f"{short}: broken local link: {value}")
                    continue
                if sep:
                    if target not in headings:
                        headings[target] = anchors(target.read_text(encoding="utf-8"))
                    if fragment not in headings[target]:
                        errors.append(f"{short}: missing anchor: {value}")

    for title, count in titles.items():
        if count > 1:
            errors.append(f"Duplicate article title: {title} ({count})")
    catalog = contents[CATALOG]
    sections = SECTION_ID.findall(catalog)
    rows = ROW_ID.findall(catalog)
    for label, values in (("section", sections), ("index row", rows)):
        for key, count in Counter(values).items():
            if count != 1:
                errors.append(f"Duplicate {label} ID: {key} ({count})")
    if set(sections) != set(rows):
        errors.append("Catalog quick-index IDs differ from article section IDs")
    questions = QUESTION_ID.findall(contents[QUEUE])
    if len(questions) > 12:
        errors.append("Research queue exceeds 12 active questions")
    for key, count in Counter(questions).items():
        if count != 1:
            errors.append(f"Duplicate research question ID: {key} ({count})")
    if len(contents[QUEUE].encode("utf-8")) > 6500:
        errors.append("Research queue exceeds 6.5 KB; prune or consolidate questions")
    bad_ids = BAD_ID.findall(contents[BAD])
    if len(bad_ids) > 20:
        errors.append("Bad examples exceeds 20 active entries; consolidate rather than add more")
    for key, count in Counter(bad_ids).items():
        if count != 1:
            errors.append(f"Duplicate bad example ID: {key} ({count})")


    for article in ARTICLES:
        if article.name != "ENTRY_TEMPLATE.md":
            if article.name not in contents[INDEX] and article.name not in catalog:
                errors.append(f"Unindexed article: {article.relative_to(ROOT)}")

    return errors


if __name__ == "__main__":
    problems = main()
    if problems:
        for problem in problems:
            print("FAIL:", problem, file=sys.stderr)
        sys.exit(1)
    print("PASS: research links, index IDs, active queue IDs, article titles and source-neutrality")
