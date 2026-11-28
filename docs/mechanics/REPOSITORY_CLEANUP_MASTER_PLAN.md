# REPO-CLEANUP-002 — repository hygiene master plan

Owner approved 2026-11-28. Freeze new gameplay features, balance retuning and unrelated development until cleanup completion and independent final review. Stabilization correctness fixes necessary for cleanup may be separately scoped. Preserve useful engineering research even if the game never uses it. Current baseline main ea49cec28939ba0dcd75e6a2b6f150f6801b79cc: 410 tracked files, 19,119,016 bytes; docs 12,249,618 bytes, including 62 mechanics JSON files totaling 10,659,473 bytes; public site 5,137,221 bytes. Prior #242 removed 757,994 bytes from site (archived assets); full 28/28 gates and Pages 46166609963 success. These are tracked bytes, not browser transfer or compressed Git history.

## Ordered phases and acceptance

1. **Git hygiene.** Enumerate branches and all-state PRs, exact heads, merged vs unmerged, protected refs, unique unfinished work. Verify each removal against main and durable archival reachability (tag or retained evidence), no open dependency and exact expected SHA. Keep main and active branches; no deletion by name alone. No history rewrite. [Branch inventory](BRANCH_INVENTORY_20261128.md).
2. **Agent instructions.** Inventory every active rule, resolve contradictory historical instructions against latest approved decisions and current code. One canonical location per rule. Preserve approval, security, research persistence, test and release requirements. Separate explicit owner review and protected manual merge for governance edits. No invented mechanics.
3. **Documentation.** Separate current specification, backlog and checkpoint from historical plans, decisions and release journals. Preserve exact historical references; remove completed tasks from active list after verified integration. Check links and reconcile status and attribution.
4. **Knowledge library.** Keep Useful Examples, Bad Examples, Research Library, Research Map, Research Queue and valuable articles, sources and discoveries. Consolidate duplicates, preserve technical context and negative evidence, fix stale game-specific fit tags and claims (offline caps, retired activities). Keep optional task-specific lookup; research is not implementation authority.
5. **Simulation evidence.** Review each of 62 baseline JSON files, reproducible harnesses and dependencies. Keep unique evidence, exact seeds/configs/commands, meaningful outcomes including failures and source revision. Replace redundant bulk output with compact indexed summaries and durable exact revision references only after recovery verification. No deletion of required fixtures or irreplaceable results.
6. **Source cleanup.** Enumerate all public entry points, static/dynamic imports and runtime paths, test imports and shared helpers. Separate obsolete app/activity code, historical fixtures and live mechanics; remove proven dead code or obsolete compatibility only through isolated regression-tested changes. Alpha reset permissible if needed but disclose and require appropriate save/release checks. Raid rule 5 still active; do not blindly delete historical combat paths.
7. **Website.** Remove proven-unused art, CSS, scripts and HTML; optimize 2,665,574-byte landing PNG only with visual parity checks; simplify cache/import map (previous 79 entries) with cold/warm browser verification, current entry points and full mobile/desktop smoke. Measure tracked, deployed and actual transfer separately.
8. **Tests/infrastructure.** Identify duplicate/stale coverage, generated files and workflow waste; preserve current behavioral coverage, useful historical fixtures, full required CI and security protections. Test changes against real resolver; no weakening checks or changing permissions without separate owner approval.
9. **Final audit.** Fresh checkout, independent reviewer (prefer Codex if available), inspect entire tree and docs, confirm all removal manifests and useful knowledge preserved. Full required CI, browser smoke, save integrity, public Pages verification; compare inventory and performance to baseline. Report exceptions and unresolved risks. Owner verifies final gate before feature work resumes.

## Execution rules
One implementation PR at a time; remote main TD first, fresh branch, exact scope, STARTED journal and checkpoint, final reviewed head, full applicable tests, protected merge and deployment verification before next phase. Do not erase Git history, weaken tests, or delete unique research. Avoid arbitrary size targets. Prefer main as active project and indexed useful knowledge, not a museum of obsolete runnable prototypes. Research may remain available without being required reading. Historical archive retention must be verified before destructive cleanup; exact SHA links alone are not a permanent retention guarantee for unreachable commits. No new gameplay features until final acceptance.

## Exit checklist
- All obsolete refs classified and safely disposed or explicitly retained with reason; no abandoned PRs.
- No contradictory active rules or misleading current specs; one authoritative backlog.
- Research and significant evidence retained, indexed and recoverable.
- All public files/dependencies justified; no known unused production artifacts.
- Full CI, save and browser tests pass; website published and checked.
- Independent final audit and owner acceptance; record before/after metrics and any exceptions.

Phase 01 ref actions were applied through authenticated Git. The [verified manifest](REPO_CLEANUP_002_REF_MANIFEST.md) records 216 removed branches, 194 archive tags and 22 retained branches. Next is phase 02, with separate Owner review of the governance diff.

## Codex handoff (#244)

Follow the detailed REPO-CLEANUP-002 block in [TD_LIST](../TD_LIST.md). #243 merged 153962ef, both 28/28 gates and protocol passed. [Ancestry manifest](https://github.com/janisp123/idle_game/pull/243#issuecomment-7242566717) verifies 213 merge commits, 19 direct heads, 194 nonancestor heads; [instruction audit](https://github.com/janisp123/idle_game/pull/243#issuecomment-7242585835) identifies nine conflict groups. Reuse findings; verify changed facts and execute. Codex uses authenticated local Git for guarded ref actions unavailable to Chat. Chat stops overlapping implementation. Feature freeze until independent audit and Owner acceptance.
