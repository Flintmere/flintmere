// Shared types for the daily operator brief.
//
// The brief reports live marketing-pipeline state (ADR 0026): what the
// social queue posted, what's scheduled, what's failed, what outreach
// batches await approval, and a Monday PostHog rollup. The operator does
// not execute marketing tasks — agents draft, the app publishes — so the
// brief only surfaces a human action when state demands one.

export interface BriefState {
  /** YYYY-MM-DD in Europe/London. */
  date: string;
  /** Short weekday — 'Mon' | 'Tue' | … */
  weekday: string;
  /** Live counts pulled from the scanner DB. */
  outreach: OutreachSnapshot;
  /** Social queue state: posted, scheduled, failed. */
  social: SocialSnapshot;
  /** Outreach batches awaiting operator approval. */
  approvals: ApprovalSnapshot;
  /** Monday-only metrics rollup. Null on every other day. */
  posthog: PosthogRollup | null;
  /** Non-fatal collection errors. Surfaced in the brief footer so the
   *  operator can act on silent degradation. */
  warnings: string[];
}

export interface OutreachSnapshot {
  queued: number;
  sent: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  /** Most recent send timestamp across all targets. Null if no sends ever. */
  lastSendAt: Date | null;
  /** Sends fired so far today (Europe/London). */
  todaysSends: number;
}

export interface SocialSnapshot {
  /** Posted in the last 24h: body excerpt + external id. */
  postedLast24h: Array<{ body: string; externalId: string | null }>;
  /** Queued for the next 7 days. */
  queuedNext7d: Array<{ body: string; scheduledAt: Date }>;
  /** Failed, unresolved (status='failed'). Always surfaced. */
  failed: Array<{ body: string; errorMessage: string | null }>;
  /** True when X env credentials are absent — operator setup pending. */
  xCredentialsMissing: boolean;
  /** Newest SocialPost.createdAt — heartbeat proxy for the weekly agent
   *  (it inserts posts every run). Null = agent has never run. */
  lastAgentInsertAt: Date | null;
}

export interface ApprovalSnapshot {
  /** Batches with targets still in ready_for_approval. */
  pending: Array<{ batchId: string; count: number; oldestStagedAt: Date; approveUrl: string | null }>;
}

export interface PosthogRollup {
  visitors7d: number;
  scans7d: number;
  /** False when the Query API call fails — surfaced in warnings. */
  available: boolean;
}

export interface ComposedBrief {
  /** Inbox subject line. Kept short — operator scans on phone. */
  subject: string;
  /** Inbox preheader (visible preview text). One sentence max. */
  preheader: string;
  /** Markdown body. Rendered to HTML by email.ts; the same markdown is
   *  also the plain-text body. Headings, lists, fenced code blocks,
   *  inline code, **bold** supported. No tables, no images, no links
   *  beyond the deterministic footer. */
  bodyMarkdown: string;
}
