-- Track when the concierge booking confirmation emails have been sent so
-- Stripe webhook retries do not double-fire the Resend calls.
ALTER TABLE "scanner_concierge_audits"
  ADD COLUMN "notification_sent_at" TIMESTAMP(3);
