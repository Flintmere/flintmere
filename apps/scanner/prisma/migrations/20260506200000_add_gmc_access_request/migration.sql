-- Per ADR 0023 §slice 2b — pre-verification waiting list for GMC OAuth.
--
-- Captured during the Google T&S verification window (typical 4–6
-- weeks). Each row is one merchant who clicked the connect link from
-- their audit delivery email while FEATURE_GMC_OAUTH=false.
-- notified_at is set the day verification clears and we email the
-- merchant. No FK to scanner_concierge_audits — audit_id is a soft
-- reference so the request retains shape even if the audit is later
-- archived.

CREATE TABLE "scanner_gmc_access_requests" (
  "id" TEXT NOT NULL,
  "audit_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "shop_url" TEXT NOT NULL,
  "normalised_domain" TEXT NOT NULL,
  "reason" TEXT,
  "notified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scanner_gmc_access_requests_pkey" PRIMARY KEY ("id")
);

-- Operational lookups: "all requests from this merchant" + "all
-- requests for this audit." Plain B-tree.
CREATE INDEX "scanner_gmc_access_requests_audit_id_idx"
  ON "scanner_gmc_access_requests"("audit_id");

CREATE INDEX "scanner_gmc_access_requests_normalised_domain_idx"
  ON "scanner_gmc_access_requests"("normalised_domain");

-- Notification list: "who hasn't been notified yet" hits
-- notified_at IS NULL. Plain B-tree; small table, partial index
-- unnecessary.
CREATE INDEX "scanner_gmc_access_requests_notified_at_idx"
  ON "scanner_gmc_access_requests"("notified_at");
