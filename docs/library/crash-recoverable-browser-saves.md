# Crash-recoverable browser saves — validated generations and atomic commits

**Category:** Browser persistence / reliability / security  
**General-purpose benefit:** Preserve idle-game progress through interrupted writes, multiple tabs, bad migrations and damaged local state without a backend.  
**Our-game fit:** `[OUR-GAME: ADAPT]` — relevant when the small local-save prototype outgrows one browser-storage key.  
**Evidence:** `[EVIDENCE: DESIGN-NOTE]` — API behavior and implementation approaches inspected; no game integration or browser fault-injection tests performed.  
**Reviewed:** 2026-11-21

## Problem and intended use

A browser save is not necessarily safe merely because a storage API reports success. Interrupted writes, incompatible schema versions, quota exhaustion, concurrent tabs, browser eviction and a buggy update can destroy the only recoverable state. Distinguish **transaction atomicity** (a group of operations commits together), **durability** (survives power loss), **logical validity** (save invariants hold), and **availability** (browser has not evicted the origin). None implies the others.

A local-only game can provide robust *best-effort* recovery without a server, but cannot guarantee survival of user-cleared site data, device loss or all browser storage failures. Provide an explicit downloadable backup option for irreplaceable progress.

## How it works

### Three designs and their failure boundaries

| Approach | Commit unit | Recovery | Main limitation |
| --- | --- | --- | --- |
| Single `localStorage` value | One synchronous key replacement | Parse and validate one complete envelope | No cross-key atomicity; no retained prior generation; storage can be cleared |
| IndexedDB, one save record | One `readwrite` transaction | Validate committed record | Crash may lose latest relaxed-durability commit; corruption or bad migration still harms the only copy |
| IndexedDB, two validated generations + pointer | One `readwrite` transaction over all involved records | Prefer newest valid committed generation; retain prior generation | Extra storage and complexity; both copies share the same origin/eviction risk |

For the third design, keep two **distinct generation records** and a small metadata record. Each generation contains a monotonically increasing revision, schema version, last-settled timestamp, canonical payload, and a digest of the canonical serialized bytes. A digest detects accidental damage, **not malicious edits**; a player controls the browser and can recompute it. Reject malformed types, nonfinite quantities, negative inventory, invalid timestamps, future schemas and impossible progress before accepting a generation. A strictly increasing revision alone does not prove legitimate rewards.

**Commit ordering:** Prepare and validate the new envelope *outside* the transaction. Inside one IndexedDB `readwrite` transaction, read the current committed pointer, verify the expected revision, replace the inactive generation slot and update the pointer. Wait for **transaction completion**, not merely an individual request's success. Keep the previously active slot untouched until the transaction commits. If the transaction aborts, neither slot promotion nor pointer change should be visible. If the browser loses the latest transaction after a power failure, the older committed generation should remain a recovery candidate where storage survives.

**Important:** Do not perform network calls, unrelated asynchronous work, or a long `await` between IndexedDB requests inside an active transaction; the transaction may become inactive and auto-commit. A promise-based wrapper is useful only if it correctly resolves on transaction completion and handles aborts.

## Implementation sketch

Original, storage-neutral pseudocode; `atomicReadWrite` must be implemented with a real multi-record transaction, not a sequence of independent key-value writes.

```text
prepare(candidate, priorRevision):
    validateDomainInvariants(candidate)
    bytes = canonicalEncode(candidate)
    return {revision: priorRevision + 1,
            schemaVersion: CURRENT_SCHEMA,
            digest: digest(bytes), payload: bytes}

commit(candidate, expectedRevision):
    next = prepare(candidate, expectedRevision)
    atomicReadWrite("save-slots", "save-meta", transaction):
        meta = transaction.read("save-meta", "active")
        require meta.revision == expectedRevision
        inactive = opposite(meta.activeSlot)
        transaction.put("save-slots", inactive, next)
        transaction.put("save-meta", "active",
                        {activeSlot: inactive, revision: next.revision})
    await transactionComplete()  // aborted transaction means no successful save

recover():
    read slots A and B plus metadata in one readonly snapshot
    valid = slots passing digest, schema, and domain validation
    if metadata points to a valid matching revision:
        return that generation
    if valid is empty:
        stop; offer manual backup import; do not overwrite unknown data
    return highest valid revision with a visible recovery warning
```

**Recovery caveat:** An orphaned slot with a higher revision but no matching committed pointer might be from a partially migrated or previously abandoned attempt. Automatic promotion is appropriate only if your application explicitly defines and verifies that recovery policy. Prefer the pointer-matching valid slot when available; otherwise require an explicit recovery choice, especially when a rollback could duplicate previously exported or server-claimed rewards.

**Migration:** Read and validate the old envelope, migrate a copy through known versions, validate the result, then commit it as a new generation. Never destructively rewrite both slots during the same migration. Reject future schemas for writes; a stale open tab must not overwrite a save created by newer code.

**Multiple tabs:** Compare-and-swap the revision *inside the same transaction*; a stale tab should fail, reload and reconcile, not overwrite newer progress. Browser messaging/locks can improve UX but are not a substitute for the transaction. Keep settlement timestamps and activity remainders consistent so replaying an absence cannot grant the same interval twice.

## Costs, security and alternatives

Let `S` be serialized save size. Two slots require roughly `2S + O(1)` payload storage, `O(S)` validation/hash work per save or recovery, and `O(S)` bytes written for each full snapshot; frequent autosaves may increase mobile flash writes and battery use. Debounce noncritical updates and persist on meaningful boundaries, but do not rely solely on page unload callbacks. IndexedDB transactions add operational complexity; for a tiny prototype a **single canonical localStorage key plus explicit export/import** may be more maintainable until data size and loss risk justify migration.

Do not store access tokens, passwords or sensitive personal data in the save. Validate imported backup sizes and schema before parsing; avoid prototype-pollution-prone merges, unbounded decompression, executable deserialization or rendering imported strings as HTML. A checksum is not an anti-cheat signature. For shared economies, the server must authorize reward claims independently.

A successful IndexedDB `complete` event does **not** universally promise physical disk flush: implementations may use relaxed durability. Durability hints are not a portable guarantee. Requesting persistent origin storage may reduce eviction risk but can be denied and does not protect against user deletion or device loss.

## Test or performance evidence

**Not executed:** The following is a test plan, not a test result.

1. Save revisions 1–3; verify the pointer always names the intended generation and the previous valid generation remains recoverable.
2. Inject an abort at each transaction request and quota failure before completion; assert no partial pointer/slot commit.
3. Corrupt the active slot and separately the metadata; assert safe recovery, explicit warning and no silent overwrite.
4. Open two tabs at revision 10, commit from one, then try the other; assert stale revision rejection.
5. Attempt old/new/future schemas and a migration that throws halfway through; assert the old save remains readable.
6. Import maliciously shaped or oversized JSON; assert bounded parsing, strict validation and no HTML/script execution.
7. Test forced browser termination, storage eviction, private browsing and power-loss scenarios where reproducible; distinguish a failed test from untestable physical durability.
8. Compare write latency, bytes, startup recovery time and battery effects on low-end Android Chrome versus desktop browsers.

## Our-game assessment

`[OUR-GAME: ADAPT]` The current local-only browser prototype should not acquire a database or extra dependency solely because this design exists. Start by testing whether its current save is a single validated envelope and offering a human-readable export. If progression becomes substantial, IndexedDB generation slots with atomic pointer promotion provide a plausible upgrade. Do not change the frozen-offline-efficiency rule: the save must preserve the last effective combat snapshot and settle accumulated XP only on return.

## Open questions

- What maximum acceptable progress loss and save frequency should the game support?
- Is local-only storage still the product direction when accounts or guilds arrive?
- What device/browser combinations and storage quotas should be tested?
- Which recovery states may be auto-selected without risking duplicate settlement?

This is independent design guidance, not an authorized implementation task.

## Rights and originality

Original explanation and pseudocode synthesizing established browser storage and transactional patterns; no external code, assets, names or URLs incorporated. Imported software would require a separate license and security review.
