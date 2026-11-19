# New project setup

1. Create a separate GitHub repository `janisp123/ai-project-template` containing this starter and enable **Settings → General → Template repository**.
2. For each future project, select **Use this template** and set its own repository name, purpose and limits.
3. Keep the file paths exactly the same; add project-specific constraints in `AGENTS.md` and record decisions in `docs/DECISIONS.md`.
4. Keep `docs/TD_LIST.md` even if it has no pending tasks. Run `python tools/check_project_protocol.py` and ensure the PR workflow passes.
5. If possible, protect `main` and require the preflight check. Approve implementation and merges deliberately; task entries alone do not start work.

A template does not update repositories already created. Update shared conventions across old repositories deliberately and preserve project-specific instructions and attribution.
