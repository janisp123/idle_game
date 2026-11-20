# Security policy and current scope

## Current security boundary

This repository currently contains a **public static GitHub Pages landing page**, original design/research documentation and basic validation scripts. **There is no playable game, account system, player database, authoritative game server, payment handling or deployed gameplay API.** Security checks that pass today do **not** establish that a future game is secure.

Everything in the public repository and in the published `site/` folder must be safe to share publicly.

## Reporting a vulnerability

If GitHub offers a **Report a vulnerability** option in this repository's Security tab, use that private reporting feature. If that option is unavailable, open an issue **without exploit details, credentials or personal data** to request a private contact route. Do not publish working exploit instructions or any exposed secret in an issue or pull request.

## Handling code, credentials and data

- **Never commit real credentials:** no API keys, deployment tokens, passwords, private keys, authentication cookies, player records, private messages or user-provided confidential data.
- Keep local credentials in untracked environment variables or the appropriate secret manager. The `.gitignore` is a safeguard against accidental adds, **not** a secret scanner or a guarantee that tracked files cannot contain secrets.
- Treat GitHub Pages as **public client-side hosting**. A browser bundle cannot keep secrets, authorize player rewards, determine balances or securely store authoritative game state.
- If sensitive information is accidentally committed, **revoke/rotate the credential immediately** and assess exposure; deleting a file from the current branch alone does not erase its commit history.
- Before integrating outside libraries, check their licenses, maintenance and dependencies. Keep required notices. Do not embed unpublished or copied third-party code/art.
- Require review and passing checks for changes to `main`. Workflows should keep token permissions as narrow as possible; future workflows adding write permissions need explicit justification.

## Additional requirements before any playable multiplayer launch

The items below are **future security gates, not implemented features or approved game tasks**.

1. Define account authentication, authorization, recovery and session expiration.
2. Make the server authoritative for inventory, time, XP, drops, enchantments and any group settlement; reject client-computed rewards.
3. Validate every server input and enforce rate limits on reward-affecting operations.
4. Design idempotent transactions and audit logs for claims, retries and concurrent devices.
5. Protect player data with access controls, backups, restoration tests and safe schema migrations.
6. Establish reproducible builds, dependency updates, vulnerability review, monitoring and a response plan.
7. Confirm how offline progress settles across game-version changes and long periods of absence; test abuse and numerical overflow.

**Nothing here authorizes implementing gameplay or changing the product's approved design.** Refer to `docs/TD_LIST.md` and `AGENTS.md` before work.
