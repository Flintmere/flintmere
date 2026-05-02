-- Lead idempotency key: at most one row per (email, scan).
--
-- Pre-existing duplicates (from before /api/lead became idempotent) are
-- collapsed to the earliest row by id — cuid() is monotonically encoded
-- so the smallest id is the first insert. Anything with reportSentAt set
-- is preserved by tie-breaking on it before id, so we never delete the
-- copy that actually sent the email.

DELETE FROM "scanner_leads" a
USING "scanner_leads" b
WHERE a.email = b.email
  AND a.scan_id = b.scan_id
  AND (
    -- prefer the row that already sent the report
    (b.report_sent_at IS NOT NULL AND a.report_sent_at IS NULL)
    OR (
      -- otherwise prefer the older id
      (b.report_sent_at IS NOT NULL) = (a.report_sent_at IS NOT NULL)
      AND a.id > b.id
    )
  );

CREATE UNIQUE INDEX "scanner_leads_email_scan_id_key"
  ON "scanner_leads"("email", "scan_id");
