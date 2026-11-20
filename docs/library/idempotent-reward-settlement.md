# Idempotent Reward Settlement and Crash-Safe Progress Cursors — Engineering guide

**Category:** Server / persistence / offline / multiplayer  
**General-purpose benefit:** Reliable rewards and state transitions despite duplicate requests, retries, competing sessions, server restarts and unknown commit outcomes.  
**Our-game fit:** `[OUR-GAME: FIT]` — long-absent characters and eventual cooperative rewards require a single authoritative advancement.  
**Evidence:** `[EVIDENCE: DESIGN-NOTE]` — independently written synthesis and proposed tests; no game prototype or benchmark executed.  
**Reviewed:** 2026-11-20

## Problem and intended use

A player returns after years. Two browser tabs both request catch-up. A server computes ten million ore and skill XP, commits the update, but loses its connection before replying. The browser retries. If each request applies a fresh grant, the player receives twenty million ore. If the server advances the saved time before granting the ore, a crash may instead erase progress.

A similar problem affects guild encounters, crafting claims, purchases and equipment changes. **An HTTP request is not a unique game event.** The system needs a durable definition of *which progression interval or event has already been applied*. The useful goal is **exactly-once durable effects**, not a promise that the handler or network request executes only once.

This article compares (1) atomic cursor advancement, (2) an idempotency ledger, and (3) a transactional outbox for work that must be delivered elsewhere. These are established distributed-systems patterns, synthesized here for game state; they are not novel inventions.

## How it works

### Identify the thing being settled

For solo offline progress, define a monotonically increasing `settledThroughMs` server-time watermark. A request to settle until `targetMs` is not a claim for a quantity; the server derives rewards from the trusted state and rules over `(settledThroughMs, targetMs]`.

Use a trusted, bounded server timestamp for `targetMs`; never accept an arbitrary client-supplied duration or reward. If rules change over historical time, split at ruleset boundaries. Use the same interval convention for all systems and distinguish completed actions from fractional progress at the right endpoint.

For a discrete event such as a group victory, define a stable server-generated `eventId`, a durable event result, and one `(eventId, recipientId, rewardKind)` grant identity. Do not use a random key generated anew on every retry.

### Data model: small authoritative state plus durable uniqueness

```text
Character:
  id, stateVersion, settledThroughMs, simulationState, inventory, skillXp
  # simulationState includes partial action progress, queue cursor and RNG state

RewardEvent:
  eventId, eventKind, ruleVersion, resolvedAt, immutableResult

RewardGrant:
  eventId, recipientId, rewardKind, amount, appliedAt
  UNIQUE(eventId, recipientId, rewardKind)

RequestReceipt (optional):
  actorId, operationKind, requestKey, requestFingerprint, response, createdAt
  UNIQUE(actorId, operationKind, requestKey)

Outbox (optional):
  messageId, eventId, destination, payload, deliveredAt
  UNIQUE(messageId)
```

Store large quantities in a deliberate integer representation: fixed-width signed 64-bit only when proven sufficient, or arbitrary precision / validated decimal strings otherwise. Never silently round an authoritative quantity through a JavaScript floating-point JSON number. The `RewardGrant` table is for discrete grants, not a row per mining swing or per minute of offline time.

### Approach A: atomic offline cursor advancement

Use a single database transaction, with the character row locked or updated by compare-and-swap. All state, resource, XP and cursor changes commit together. The server must have one canonical simulation implementation.

```text
settleCharacter(characterId, requestedTarget):
  target = min(requestedTarget, trustedServerNow())
  begin transaction
    row = SELECT character FOR UPDATE
    if target <= row.settledThroughMs:
      result = snapshot(row)
    else:
      interval = (row.settledThroughMs, target]
      next = simulateFromSavedState(
        row.simulationState, interval, historicalRules
      )
      assert(next.cursor == target)
      assert(valid(next.inventory, next.skillXp, next.simulationState))
      UPDATE character SET
        simulationState = next.state,
        inventory = next.inventory,
        skillXp = next.skillXp,
        settledThroughMs = target,
        stateVersion = row.stateVersion + 1
      result = snapshot(updated row)
  commit
  return result
```

All reads and writes in the transaction use the same connection. A second concurrent request waits for the first and then settles only any remaining interval. If a commit acknowledgement is lost, the client re-reads the cursor and state rather than assuming rollback or applying the reward again.

**Long computation warning:** Holding a database lock while simulating 20 years may block other requests. Prefer a bounded deterministic settlement computation followed by a short compare-and-swap transaction:

```text
repeat:
  snapshot = read(characterId)
  target = trustedServerNow()
  candidate = simulate(snapshot, target)
  begin transaction
    changed = UPDATE character
      SET state = candidate, settledThroughMs = target,
          stateVersion = snapshot.stateVersion + 1
      WHERE id = characterId AND stateVersion = snapshot.stateVersion
    if changed == 1: commit; return candidate
    rollback
  if retries >= limit: return retryableConflict
```

Here `state` abbreviates **every** simulation-dependent field (inventory, XP, queue position, partial progress, RNG state). Never persist only the cursor. A retry must recompute from the *new* snapshot; it cannot reuse the old candidate. This optimistic strategy reduces lock duration but may waste CPU under contention. Do not run unbounded retries. Large catch-up can be split into durable, transactionally committed intervals, provided each interval is deterministic and contiguous and the saved state captures every boundary needed for resumption.

### Approach B: idempotency receipt for commands and group claims

A client-generated request key is useful for commands whose meaning is not simply "settle to the latest cursor": crafting, changing equipment, or submitting a one-time claim. Scope the key to the authenticated actor and operation, bind it to a canonical request fingerprint, and reject the same key with different parameters. A duplicate should return the original result rather than perform the command again.

```text
executeOnce(actor, kind, key, canonicalCommand):
  requireAuthenticatedAndAuthorized(actor)
  fingerprint = canonicalHash(canonicalCommand)
  begin transaction
    acquireSerializationFor(actor, kind, key)
    receipt = readReceipt(actor, kind, key)
    if receipt exists:
      if receipt.fingerprint != fingerprint: reject KEY_REUSED
      commit; return receipt.response
    result = applyAuthorizedCommandWithinTransaction(canonicalCommand)
    insertReceipt(actor, kind, key, fingerprint, result)
  commit
  return result
```

The uniqueness constraint is essential; a pre-check alone races. Implement the serialization with a database-supported unique-key insertion/lock strategy and handle conflicts by reading the committed winner. Under some isolation levels a conflicting insert or a snapshot read needs a **new transaction** to see that winner. Do not assume every ORM automatically makes the above pseudocode race-safe.

For a group encounter, one authoritative resolution record should be created before or with grants. Each member's grant uses a stable recipient identity and uniqueness constraint. A delayed claim checks the original membership snapshot and event rules, not today's group membership. Define how canceled/replaced events and generations behave: a stale event must not mutate a newer state merely because its key is unique.

### Approach C: transactional outbox for asynchronous effects

A database transaction cannot atomically commit an external push notification, message queue delivery or third-party API call. If such delivery is required, insert an outbox row in the same transaction as the reward. A separate worker sends it and marks delivery. Workers can crash after sending but before marking delivered, so recipients must deduplicate by stable `messageId`. This yields **at-least-once delivery with idempotent consumers**, not magical exactly-once networking.

For a game without external side effects, prefer a simpler single-database transaction and avoid an outbox until needed.

## Implementation sketch: boundaries and failure handling

1. **Trust boundary:** authenticate the account; authorize character, group and inventory operations; compute rewards on the server. Idempotency never replaces authorization.
2. **Clock boundary:** use server time and a monotonic saved cursor; reject future client timestamps and backward progression. Persist action phase and historical rule identifiers.
3. **Concurrency boundary:** choose one lock order (for example character before inventory/grants) across every operation to reduce deadlocks. Compare-and-swap is another option.
4. **Durability boundary:** atomically commit grants and progress cursor. On an uncertain commit, query the database by stable event/key/cursor before deciding what to retry.
5. **Numerical boundary:** validate nonnegative quantities, exact integer division and remainders, integer overflow and JSON serialization.
6. **Retention boundary:** do not delete request receipts while an old key can still be replayed. For indefinite offline promises, the authoritative watermark or permanent event identity is more durable than short-lived HTTP retry caches.
7. **Audit boundary:** store compact aggregate event summaries and recent important changes, not one durable event for each of millions of identical actions.

A settlement must never silently advance `settledThroughMs` past work that was skipped because of a timeout or iteration guard. If simulation cannot finish, commit only the fully processed prefix, including its precise partial-action state, or commit nothing and return a retryable status.

## Tradeoffs and alternatives

| Technique | Best use | Approximate costs | Main risk |
| --- | --- | --- | --- |
| Locked cursor transaction | Simple, low-contention solo progress | One character lock, O(1) DB writes per settlement plus any discrete grants; CPU depends on simulator | Long lock if simulation is slow |
| Optimistic versioned update | Expensive computation, low/moderate write contention | Short write transaction; recomputation on version conflicts | Repeated conflicts waste CPU |
| Durable request receipt | Retried crafting, purchases and one-time commands | One indexed receipt lookup/write per unique command; receipt storage grows with operations | Key reuse with different payloads; unsafe expiry |
| Event/recipient grant ledger | Shared events, multi-recipient rewards | O(m) grant records for m eligible recipients | Missing uniqueness, incorrect eligibility snapshot |
| Transactional outbox | External notifications/queues | Additional writes, worker and retry operations | Duplicate delivery without consumer deduplication |

A local-only single-player game may instead use an atomic local save and a versioned simulation state; it does not need server idempotency. Conversely, a real-time multiplayer game may need serialized command processing or event sourcing. Full event sourcing can improve audits and replay, but storing every mining action for decades is prohibitively expensive. A compact authoritative snapshot plus selected durable events is often more appropriate.

**Rough complexity:** a successful cursor settlement costs O(B + G) simulation work, where B is the number of meaningful state boundaries and G is the number of discrete grants; one character-state write plus O(G) grant writes. With indexed receipt/event lookup, typical lookup cost is O(log N) for N stored keys, subject to database implementation and cache behavior. Actual latency, contention and storage cost require measurement.

## Test or performance evidence

`[EVIDENCE: DESIGN-NOTE]` — the following is a **proposed** reproducible integration test plan, not a claim of execution. Use a real transactional database and separate connections, not only mocks.

- **Same request 100 times:** one cursor advancement, one final inventory/XP total; identical command key returns identical response.
- **Two simultaneous tabs:** barrier-start competing settlements; final cursor and totals match a single serial settlement, with no overlapping interval grants.
- **Crash matrix:** inject failure before commit, during commit acknowledgement, and after commit before HTTP response. Reconnect and reconcile by cursor/receipt; never grant twice or lose committed progress.
- **Changed payload:** reuse a command key with a different item/amount; reject without mutation.
- **Event recipients:** concurrent group claims, duplicated worker messages, member departure, stale generation and entitlement replacement.
- **Twenty-year absence:** verify exact totals and bounded processing with a reference small-step simulator on short windows plus independent long-window invariants; include rule-version changes, queue cycles, input depletion and partial action boundaries.
- **Numeric extremes:** quantities beyond 2^53, zero/negative amounts, serialization round-trips and fixed-width overflow.
- **Performance experiment:** measure P50/P95/P99 CPU and transaction duration for 1, 10, 100 concurrent returns, DB writes, lock waits, conflict retries and storage growth. State hardware and workload before making performance claims.

Suggested command for a future independent prototype: `run database-backed integration tests with two isolated connections and deterministic fault injection`. No executable prototype or measured result is included in this article.

## Our-game assessment

`[OUR-GAME: FIT]` — our unlimited offline progression makes the saved progress cursor the core source of truth. Stone mining and bunny hunting should aggregate long intervals into a compact state transition; no server timer should run continuously for dormant accounts. Group encounters and claims should use durable event IDs and recipient uniqueness, with the planned offline group-expiry boundary handled by the simulator. An optional welcome-back report can summarize aggregate results without storing millions of log entries.

**Not a coding authorization:** this is a candidate architecture, not an approved database, schema, authentication model or implementation task. The owner must approve those choices before gameplay code begins.

## Open questions

- Which database and transaction isolation mode will be selected, and what exact locking/CAS guarantees does it provide?
- How will historical rules and seeded random state be preserved over decades and across deployments?
- How long must command receipts be retained, and can immutable domain event IDs replace them for most operations?
- What happens when a catch-up computation exceeds the request deadline, and how is a resumable prefix committed?
- Which group events require durable per-recipient grants versus aggregate character settlement?

## Rights and originality

This is an independently authored explanation and original pseudocode synthesizing established transaction, idempotency, cursor and outbox concepts. It does not reproduce third-party code, artwork or repository-specific implementation. If future software components are incorporated, applicable licenses and legally required notices must be honored.
