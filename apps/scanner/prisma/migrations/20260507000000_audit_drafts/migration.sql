-- Audit-assist v0 — one row per Gemini 2.5 Pro draft of a concierge audit.
--
-- Additive only. New table + two B-tree indexes. No existing tables
-- touched, no row transforms, zero impact on prior data. The
-- audit-assist surface is operator-only and gated by FEATURE_AUDIT_ASSIST,
-- so this table accumulates rows only when the operator generates drafts.
--
-- raw_draft is the LLM output as JSONB; edited_draft is the operator's
-- corrected version, persisted on PATCH and intentionally retained as
-- the supervised-correction corpus the eventual ingestion engine
-- inherits (per Gate 1 in `projects/flintmere/decisions/0019` amendment).
--
-- scan_id is a soft reference to scanner_scans (no FK) — keeps the row
-- shape stable if a scan is later archived; symmetrical with
-- scanner_gmc_access_requests.audit_id.
--
-- band_slug matches the canonical AuditBandSlug from
-- `apps/scanner/src/lib/audit-pricing.ts` (`band-1 | band-2 | band-3`),
-- not the brief's `B1 | B2 | B3`. One source of truth.
--
-- Indexes:
--   shop_idx   — "all drafts for this merchant" + draft history lookups.
--   status_idx — "what's pending edit / pending send" admin views.
-- raw_draft and edited_draft are NOT indexed: no GIN, no jsonb_path_ops.
-- v0 access is by id (PK) for read/edit and by shop/status for filters.

CREATE TABLE "scanner_audit_drafts" (
  "id"            TEXT NOT NULL,
  "shop"          TEXT NOT NULL,
  "vertical"      TEXT NOT NULL,
  "band_slug"     TEXT NOT NULL,
  "scan_id"       TEXT,
  "status"        TEXT NOT NULL DEFAULT 'draft',
  "model_used"    TEXT NOT NULL,
  "latency_ms"    INTEGER NOT NULL,
  "raw_draft"     JSONB NOT NULL,
  "edited_draft"  JSONB,
  "generated_at"  TIMESTAMP(3) NOT NULL,
  "edited_at"     TIMESTAMP(3),
  "sent_at"       TIMESTAMP(3),
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "scanner_audit_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scanner_audit_drafts_shop_idx"
  ON "scanner_audit_drafts"("shop");

CREATE INDEX "scanner_audit_drafts_status_idx"
  ON "scanner_audit_drafts"("status");
