# A5 original outcome artwork handoff

Owner approved the two generated illustrations in chat before ALPHA-GEAR-001 implementation. The exact original PNGs were available in chat's container and visually inspected. Optimized WebP copies (960x640, quality 86, full composition, no replacement artwork) were prepared in the downloadable A5-approved-combat-art.zip. Extract its two files at repository root on `alpha/six-month-gear-benchmark` (draft PR #154).

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| site/play/assets/combat/impressive-victory.webp | 162094 | 495d303527e15207aa1252d934491544dbe7972a490c8ca5cff111d760e28f88 |
| site/play/assets/combat/humiliation.webp | 139910 | 6e1df144defacb680963326a69c59f12c885dd995559312a0838c7f33af0a184 |

The first depicts a standing victorious gladiator and a kneeling defeated opponent; the second depicts the defeated foreground fighter and standing victor. Both are symbolic verdict illustrations, not literal weapon/armour/loadout portraits. The actual result comes from the resolver. Source is owner-approved chat-generated art, not third-party stock.

**Pending:** binary transfer into the remote repository. Chat container cannot resolve github.com; the connected GitHub write APIs accept text/inline base64, not container files. Do not mark artwork integrated or activate unavailable URLs.

After committing both verified binary files, set DOMINANCE_ART in `site/play/combat-art.mjs` to `{impressive_victory:"impressive-victory",humiliation:"humiliation"}`, advance the app's module cache revision, and run the existing combat-art/UI and required full CI checks. Tests already check registered special assets' WebP headers. Check both labels and images at real 390px and 1440px browser widths, ordinary results unchanged, and no premature verdict. Update TD/checkpoint/changelog with actual verified evidence. Until then labels use existing appropriate verdict art; unillustrated styles use neutral scene. Do not merge as fully done until this and remaining calibration are resolved.

**Verified code milestone:** 7f12888 passed all four CI workflows, including 107 game/UI tests and 13 systems tests. Labels and safe fallback are verified; new image bytes and real-browser rendering are not. Keep the blocker open.


A9 verification: ZIP contents rechecked against both SHA-256 values above; exact files still absent from remote Git. [Chromium smoke](https://github.com/janisp123/idle_game/actions/runs/45568388725) passed 390/1440px verdict labels, loaded existing greatsword victory/defeat fallback images, no runtime or missing-resource errors, and no horizontal overflow. Screenshots attached in artifact 15001225954. This is NOT verification of missing custom images. Owner may explicitly defer them for playable alpha release while retaining this handoff as open; otherwise upload and activate before merging.


## Owner-approved deferral (2026-11-25)

Owner explicitly approved the playable alpha release using existing verified fallback artwork after final checks. This supersedes the earlier artwork-as-release-blocker instruction for PR #154 only. The two exact images remain a separate open task ALPHA-ART-001 in TD_LIST. When working on it, start a fresh branch from current main; do not reopen or reuse the merged release branch. All original checksum, activation and browser acceptance requirements remain. No artwork integration claimed.


## Integration candidate — PR #156

The owner resumed this work. Branch `alpha/approved-verdict-art` has the activation code, cache updates, exact byte/hash verification and browser checks for the intended asset source and decoded dimensions. Upload both extracted WebP files directly to `site/play/assets/combat/` on this branch (not main). The draft intentionally cannot pass missing-file tests until both originals are uploaded. No save schema or combat formula changes. Existing live release remains unchanged until the PR is verified and merged.
