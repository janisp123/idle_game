# Coherent browser game releases — cache keys, offline assets and safe updates

**Category:** Browser UI / PWA / operations / reliability  
**General-purpose benefit:** Prevent a browser game from mixing old HTML, new scripts and stale artwork during deployments, including when users return after a long absence.  
**Our-game fit:** `[OUR-GAME: FIT]` for release coherence; `[OUR-GAME: ADAPT]` for optional service-worker offline installation.  
**Evidence:** `[EVIDENCE: DESIGN-NOTE]` — source-informed synthesis, not implemented or benchmarked here.  
**Reviewed:** 2026-11-21

## Problem and intended use

A successful upload is not a coherent client release. HTML, CSS, JavaScript, images, service workers and persistent saves may be served from different cache generations. For example, an old fixed-height image frame can crop a newly deployed portrait illustration. A worse failure is new JavaScript reading an incompatible old save or old JavaScript writing a save that the new version cannot interpret.

Separate three concerns: (1) immutable asset identity, (2) consistent deployment and activation, and (3) durable player-data migration. Browser HTTP caches and service-worker Cache Storage are distinct layers; a cache-busting query string is not a complete PWA update policy.

## How it works

### Three practical deployment approaches

| Approach | Mechanism | Best use | Limit |
| --- | --- | --- | --- |
| Versioned static URLs | Give each changed CSS/JS/image a new filename or query version; HTML points to it | Small static sites without a service worker | An old cached HTML document can still reference old files |
| Manifest-based precache | Release manifest maps logical URLs to content revisions; install new asset set, then activate and clean outdated entries | Installable offline-capable games | Service-worker lifecycle and storage quota add complexity |
| Runtime caching | Network-first for changeable data; stale-while-revalidate for noncritical images; cache-first for immutable versioned assets | Bandwidth reduction after initial visit | Independently refreshed assets can create incompatible combinations |

For a static site, prefer content-hashed filenames where the build pipeline permits them. A manually changed query string is an acceptable interim measure only if it changes whenever content changes. Do not assume a URL query version defeats all intermediate or service-worker caching.

For a PWA, precache a **coherent release manifest** containing the HTML shell, script modules, styles, icons and minimum playable scenes. Download and validate the new set before announcing it ready. Keep the previous active version usable until the new version is complete; then offer an update/reload at a safe point. A service worker may control an already-open tab after activation, but the tab's loaded JavaScript remains the old version until navigation.

### Original implementation sketch

```text
publishRelease(build):
    files = produceAssets(build)
    for each file in files:
        digest = hash(file.bytes)
        url = makeImmutableURL(file.logicalName, digest)
        upload(url, file.bytes)
        manifest.add(file.logicalName, url, digest, file.size)
    upload(manifest.versionedURL, manifest)
    uploadEntrypointLast(manifest.entrypointHTML)
    retainPreviousReleaseAssetsForRollback()

installCandidate(manifest):
    temporary = openCache("candidate:" + manifest.releaseID)
    for each essential in manifest.essentialAssets:
        response = fetch(essential.url)
        require response.ok
        require matchesDigest(response.bytes, essential.digest)
        temporary.put(essential.url, response)
    markCandidateReady(manifest.releaseID)
    // Never delete the active release on a partial install.

activateCandidateAtSafePoint(candidate):
    require candidate.ready
    persistCurrentGameState()
    requestReloadAfterUserAcknowledges()
    // Service-worker activation and page reload are distinct events.

loadSave(rawSave, clientRelease):
    parsed = validateSaveEnvelope(rawSave)
    if parsed.schemaVersion > clientRelease.maxReadableSchema:
        refuseToWriteAndOfferUpgrade()
    else:
        migrated = migrateCopyThroughKnownVersions(parsed)
        validate(migrated)
        atomicallyReplaceLocalSaveAfterBackup(migrated)
```

The digest check is an illustrative integrity gate, not a substitute for transport security. Browser APIs may not support atomically renaming an entire Cache Storage collection: use a candidate cache plus a small committed-release pointer and explicit failure recovery. The pointer itself must be treated as fallible. On platforms without reliable transactional multi-key storage, keep old assets until recovery is confirmed.

### Release and data boundaries

* **Static files:** Use immutable content-addressed URLs, and ensure entrypoint HTML is revalidated on navigation. Publish dependencies before the entrypoint. Preserve previous assets long enough for tabs opened before deployment.
* **Service worker:** Treat install, waiting, activation and page reload as separate states. Never force immediate activation across a running combat/save transaction without a compatibility plan. Avoid caching authenticated or sensitive responses as public assets.
* **Save format:** Include `schemaVersion`, `saveRevision`, last-settled timestamp and checksum/validation fields appropriate to the threat model. Migrations should be pure, repeatable and reversible where feasible. A client-side checksum detects corruption, **not cheating**.
* **Backend:** Client assets are untrusted; authoritative rewards and timestamps must be validated server-side if accounts are introduced. Cache policy never provides anti-cheat protection.

## Costs, pitfalls and alternatives

Let `A` be the number of essential assets, `B` their total bytes, and `R` the number of retained releases. Manifest creation is `O(B)` hashing work during build; a cold install transfers `O(B)` bytes and uses `O(A)` cache entries. Retaining `R` full releases costs up to `O(R × B)` storage, less if unchanged content-addressed files are shared. On a warm visit, unchanged hashed assets can be reused. Runtime-cache bookkeeping, eviction and worker startup cost additional CPU and storage; measure on low-end Android devices.

Pitfalls include: stale HTML with new assets; a worker controlling pages of different generations; an update interrupted by network loss; opaque cross-origin responses that cannot be verified normally; query-parameter normalization accidentally collapsing distinct revisions; disk-quota eviction; cache poisoning from unsafe dynamic URLs; broken offline navigation; and a migration that overwrites the only readable save.

A service worker is **not** automatically better. A tiny static prototype may be more reliable with revalidated HTML, hashed assets and no worker. A full installable offline game benefits from a precache manifest, but only after lifecycle and update testing. Network-first requests may be wrong for expensive authoritative settlement endpoints: use explicit authenticated requests and idempotency rather than caching their side effects.

## Test or performance evidence

No tests were executed for this article; the following is a proposed reproducible acceptance plan:

1. In a fresh browser profile, deploy release A, open the game, save progress, and record the loaded asset URLs.
2. Deploy B while A remains open. Confirm A does not suddenly mix B's incompatible scripts/styles; reload to B and verify complete scenes and controls.
3. Simulate stale HTTP HTML, stale CSS, a controlling old service worker, and a missing asset independently. Confirm update/recovery messaging rather than silent broken UI.
4. Interrupt candidate precaching after each essential file. Confirm the active release still loads offline and incomplete candidate caches can be cleaned.
5. Disconnect network before, during and after activation; test cold/offline launch, old-tab reload and recovery after reconnection.
6. Test local save schemas N-2, N-1, N, N+1; preserve a backup, reject future unknown schemas for writing, and ensure no duplicate offline settlement.
7. Repeat on desktop Chromium/Firefox and low-storage Android Chrome; inspect network transfers, cache entries, storage eviction, paint correctness and update latency.
8. Record a baseline screenshot for each release at narrow phone and wide desktop viewports. Static HTML link checks alone cannot detect visual cropping.

Proposed CI gate: a release smoke test should assert the HTML references only existing versioned assets, then a real-browser update test should exercise A→B with stale caches. Measure cold install bytes, warm update bytes, time-to-play and storage growth; do not claim performance until measured.

## Our-game assessment

`[OUR-GAME: FIT]` A small, dependency-free static prototype benefits immediately from coherent HTML/CSS/scene releases, cache-safe URLs and real-browser screenshot tests. This addresses a class of visual regressions without changing gameplay. The current browser-only save must be backed up before schema migration.

`[OUR-GAME: ADAPT]` A precaching service worker could later support true installable/offline mobile play, but it requires an approved feature scope, cache quota policy, lifecycle UX and save compatibility tests. Unlimited *offline progression* is a simulation rule, not a guarantee that every version of the game's web assets remains cached indefinitely. A future authoritative server must remain the source of truth for rewards.

## Open questions

* What is the minimum supported browser and device storage budget?
* Should the initial game remain a simple static page or become installable?
* How long should previous release assets be retained for open tabs?
* Which saved-state schema changes require explicit backup and user confirmation?

This is research guidance, not an authorized implementation task.

## Rights and originality

This article is independently written synthesis of established browser caching, service-worker and migration patterns. No outside code, assets, names or source URLs are incorporated. Any future imported implementation must comply with its license and preserve mandatory notices.
