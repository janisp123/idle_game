# GitHub Pages artifact discovery: zero on first attempt, duplicates on rerun

**Category:** Operations / CI/CD
**General-purpose benefit:** Diagnose Pages releases that pass build and upload but fail artifact lookup.
**Our-game fit:** [OUR-GAME: FIT] — merged game changes remain invisible when deployment fails.
**Evidence:** [EVIDENCE: TESTED] — observed failure logs; mitigation not yet verified.
**Reviewed:** 2026-11-21

## Problem and intended use

The game's 40-activity update merged in PR #48, but GitHub Pages continued serving an earlier build. This was a **deployment failure**, not a failing game test. Do not conflate source merge, passing CI, successful upload, successful deployment, and live-site verification.

## Exact evidence from the failed run

[Workflow run 44891200055](https://github.com/janisp123/idle_game/actions/runs/44891200055), main commit `d4344a602e17ee1a78ae9806bbf59a9052cd42db`:

1. **First attempt, 2026-11-21 09:47 UTC:** `Validate static site` succeeded. `actions/upload-pages-artifact@v3` successfully finalized `github-pages.zip`, artifact ID **14702211386** (1,386,877 bytes). Immediately afterward, `actions/deploy-pages@v4` reported **"Found 0 artifact(s)"** and **"No artifacts named 'github-pages' were found for this workflow run"**. The upload and artifact lookup disagreed. A transient artifact indexing/visibility issue is plausible, but the underlying GitHub service cause is **not proven**.
2. **Second attempt, 2026-11-21 10:13 UTC:** Rerunning failed workflow jobs under the **same run ID** uploaded another `github-pages` artifact. The deploy step now reported **"Found 2 artifact(s)"** and **"Multiple artifacts named 'github-pages' were unexpectedly found for this workflow run. Artifact count is 2."** The rerun created a distinct duplicate-artifact failure.
3. Both attempts passed validation. No evidence supports the theory that the patch's 20 new activities caused these failures. The earlier successful website workflow belonged to commit `fcf4984def3e4a5df5b19f09a90cf95f84fc9303`.

## How it works and recovery

The Pages workflow validates source, uploads a named `github-pages` artifact, then `deploy-pages` looks it up by workflow run. Deployment requires a uniquely discoverable artifact. **Zero** and **multiple** matching artifacts are both fatal.

- Inspect the failed **job step logs** to distinguish validation, upload, lookup, and actual deployment failures.
- For a successful upload followed by zero artifacts, start a **fresh workflow run ID**, not a rerun that reuploads under the existing ID. A fresh main push or `workflow_dispatch` can create a new run.
- For multiple same-name artifacts, stop retrying that run; use a new run with a single upload.
- A minimal mitigation in our workflow adds **20 seconds between upload and deployment** to allow for possible artifact-indexing delay. This is a heuristic, **not** a proven service-level fix. A bounded metadata poll with diagnostic output would be a stronger follow-up if the issue recurs.
- Verify a successful **main Pages deployment** and then inspect the **public /play/** version before telling players the new content is live.

## Tradeoffs and alternatives

The delay costs 20 seconds per deployment, may reduce timing-related races, and cannot fix persistent upstream outages or permissions errors. Smaller feature PRs help isolate code defects but do **not** resolve artifact lookup problems. Do not blindly rerun upload/deploy jobs in a failed run when the original upload succeeded.

## Test or performance evidence

Actual logs: first attempt **0 artifacts** despite successful upload; second attempt **2 artifacts** after rerun. The workflow mitigation requires fresh-run CI and public-site verification before it can be described as successful.

## Our-game assessment

A release must pass four distinct gates: source merged; code validation green; GitHub Pages publish green; deployed site actually updated. Failed publishing is a release blocker even when all code tests pass.

## Open questions

The first zero-artifact lookup could be delayed artifact visibility or another transient GitHub API issue; logs alone cannot identify the upstream root cause.

## Sources and evidence

- [Exact GitHub Actions run and job logs](https://github.com/janisp123/idle_game/actions/runs/44891200055) — directly inspected, including both attempts.
- [Our Pages workflow](https://github.com/janisp123/idle_game/blob/main/.github/workflows/pages.yml) — inspected from main.
- [Official upload action](https://github.com/actions/upload-pages-artifact) and [official deploy action](https://github.com/actions/deploy-pages) — reference links, not inspected for a definitive upstream explanation.

## Rights and originality

Original explanation based on our own workflow and logs; no third-party source code or artwork copied.
