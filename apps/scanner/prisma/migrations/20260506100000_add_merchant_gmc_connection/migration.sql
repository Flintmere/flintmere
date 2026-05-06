-- Per ADR 0023 — GMC OAuth as the audit's ground-truth track.
--
-- One row per merchant; @@unique on normalised_domain. Reconnect after
-- revoke updates in place (revoked_at cleared, ciphertext rewritten).
-- Refresh token at rest is AES-256-GCM with key from env GMC_TOKEN_KEY
-- (32 bytes hex). cipher + iv + auth_tag together; access tokens never
-- persisted — rotated on demand from refresh token, held in memory +
-- short-TTL cache only.
--
-- Disconnect zeros the ciphertext + sets revoked_at; row stays for
-- audit trail. Re-grant from same merchant overwrites the same row
-- and clears revoked_at.

CREATE TABLE "scanner_merchant_gmc_connections" (
  "id" TEXT NOT NULL,
  "normalised_domain" TEXT NOT NULL,
  "gmc_account_id" TEXT,
  "gmc_account_name" TEXT,
  "refresh_token_cipher" BYTEA NOT NULL,
  "refresh_token_iv" BYTEA NOT NULL,
  "refresh_token_auth_tag" BYTEA NOT NULL,
  "scopes" TEXT[],
  "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_synced_at" TIMESTAMP(3),
  "last_error_code" TEXT,
  "last_error_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),

  CONSTRAINT "scanner_merchant_gmc_connections_pkey" PRIMARY KEY ("id")
);

-- Single active connection per merchant. Reconnect updates the row
-- in place rather than creating a parallel one.
CREATE UNIQUE INDEX "scanner_merchant_gmc_connections_normalised_domain_key"
  ON "scanner_merchant_gmc_connections"("normalised_domain");

-- Operational lookup: "which merchants are connected to this GMC
-- account?" (multi-merchant orgs may share an account). Plain B-tree.
CREATE INDEX "scanner_merchant_gmc_connections_gmc_account_id_idx"
  ON "scanner_merchant_gmc_connections"("gmc_account_id");

-- Cron / health-check filter: "list active connections" hits
-- revoked_at IS NULL. Plain B-tree; partial index would be tighter
-- but Prisma's Postgres provider doesn't surface partial-index syntax
-- and the table will stay small (one row per connected merchant).
CREATE INDEX "scanner_merchant_gmc_connections_revoked_at_idx"
  ON "scanner_merchant_gmc_connections"("revoked_at");
