# 0002 — SIWE over magic-link auth

**Status:** Accepted. Magic-link deprecated (retained only for team invites).
**Date:** 2026-04-14 (decision made earlier; ADR written during refactor)
**Council:** #4 Security engineer, #3 Web3 / DeFi domain expert, #13 UX writer, #14 DX engineer

## Context

AllowanceGuard's users are, by definition, wallet holders. Two auth options were viable:

- **Magic-link email auth** — familiar, works without a wallet, low friction for non-crypto-native users.
- **SIWE (EIP-4361, Sign-In with Ethereum)** — cryptographic proof of wallet ownership, no email required, native to the user population.

The product gates Pro/Sentinel/API features but the free scanner must remain unauthenticated. Magic-link introduced:

- Email delivery as a dependency for every login.
- A parallel identity system that didn't map cleanly to the wallet-as-identity model.
- Phishing surface (users trained to click email links).

## Decision

Use **SIWE** as the primary auth method. Cookie-based sessions (30-day, `ag_sess`). Magic-link is `@deprecated` and retained only for team invites (where the invitee may not yet have a wallet connected to their email).

## Consequences

- Every Pro/Sentinel/API feature requires a wallet.
- No email required for core auth — reduces PII surface, simplifies GDPR exposure.
- Session management via HTTP-only cookie; CSRF token for state-changing requests.
- Team invite flow must bridge email → SIWE on first login.

## Alternatives considered

- **Magic-link as primary** — rejected for reasons above.
- **OAuth (Google/GitHub)** — rejected: doesn't bind to wallet identity, introduces third-party dependency.
- **Passkeys** — considered; parked until broader browser support and until we have a story for multi-device wallet binding.
