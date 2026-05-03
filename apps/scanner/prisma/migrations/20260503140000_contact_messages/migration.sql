-- Contact form storage (Phase 1 of task #2 — contact form + 29-mailto sweep).
--
-- Topic enum routes internally to the right inbox in /api/contact:
--   general → support@, privacy → privacy@, security → security@,
--   billing → billing@, legal → legal@, plus|concierge|partnership → john@.
-- The recipient is captured per-row in routed_to so audit + reroute are
-- traceable even if the routing matrix changes later.
--
-- Status enum mirrors the operator inbox workflow: a message starts new,
-- moves to acknowledged when /admin replies (Phase 2), to responded when
-- the actual answer goes out, archived once closed, spam if rejected.
--
-- ip_hash is the same SHA-256 truncation used by lib/hash.ts everywhere
-- else — no raw IPs at rest. user_agent kept for abuse-investigation only.

CREATE TYPE "ContactTopic" AS ENUM (
  'general',
  'privacy',
  'security',
  'billing',
  'legal',
  'plus',
  'concierge',
  'partnership'
);

CREATE TYPE "ContactStatus" AS ENUM (
  'new',
  'acknowledged',
  'responded',
  'archived',
  'spam'
);

CREATE TABLE "scanner_contact_messages" (
  "id"              TEXT NOT NULL,
  "topic"           "ContactTopic" NOT NULL,
  "name"            TEXT NOT NULL,
  "email"           TEXT NOT NULL,
  "company"         TEXT,
  "shopify_domain"  TEXT,
  "message"         TEXT NOT NULL,
  "status"          "ContactStatus" NOT NULL DEFAULT 'new',
  "routed_to"       TEXT NOT NULL,
  "source"          TEXT,
  "ip_hash"         TEXT,
  "user_agent"      TEXT,
  "acknowledged_at" TIMESTAMP(3),
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL,

  CONSTRAINT "scanner_contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scanner_contact_messages_topic_idx"
  ON "scanner_contact_messages"("topic");

CREATE INDEX "scanner_contact_messages_status_idx"
  ON "scanner_contact_messages"("status");

CREATE INDEX "scanner_contact_messages_email_idx"
  ON "scanner_contact_messages"("email");

CREATE INDEX "scanner_contact_messages_created_at_idx"
  ON "scanner_contact_messages"("created_at");
