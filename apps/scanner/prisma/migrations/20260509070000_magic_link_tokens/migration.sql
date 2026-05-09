-- Magic-link sign-in tokens — replaces the scrypt-password flow at
-- /admin/login (deleted 2026-05-09). One row per POST
-- /api/admin/magic-link/request. `token_hash` is sha256(rawToken) — the
-- raw token lives only in the email body + the URL the operator clicks;
-- a DB leak cannot forge sessions. `consumed_at` flips on first verify.
--
-- Additive only: new table, two indexes, no existing tables touched, no
-- row transforms, zero impact on prior data. The MagicLinkToken model
-- is operator-only; the table accumulates rows only as the operator
-- (or anyone hitting the public /admin/login form) requests links.

CREATE TABLE "scanner_magic_link_tokens" (
  "id"          TEXT NOT NULL,
  "token_hash"  BYTEA NOT NULL,
  "email"       TEXT NOT NULL,
  "expires_at"  TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scanner_magic_link_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scanner_magic_link_tokens_token_hash_key"
  ON "scanner_magic_link_tokens"("token_hash");

CREATE INDEX "scanner_magic_link_tokens_expires_at_idx"
  ON "scanner_magic_link_tokens"("expires_at");
