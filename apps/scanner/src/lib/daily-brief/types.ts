// Shared types for the daily operator brief.
//
// Phase 1 surfaces only the three signals the LLM uses to compose the
// brief: today's playbook block, this week's cadence block, and live
// outreach state. PR / Sentry / BetterStack enrichment lands in Phase 2.

export interface BriefState {
  /** YYYY-MM-DD in Europe/London. */
  date: string;
  /** Short weekday — 'Mon' | 'Tue' | … */
  weekday: string;
  /** Raw markdown from context/operator-daily-playbook.md. Empty when
   *  the file isn't present (always the case in the prod container;
   *  operator-local in dev). */
  playbookContent: string;
  /** Raw markdown from the bundled cadence snapshot
   *  (apps/scanner/src/lib/daily-brief/cadence-snapshot.ts). Always
   *  present; regenerated via `pnpm sync-cadence`. */
  cadenceContent: string;
  /** Filename of the cadence runbook the snapshot was taken from. */
  cadenceSource: string;
  /** ISO timestamp of the snapshot. Surfaced so the LLM knows how stale
   *  the cadence is. */
  cadenceSnapshotAt: string;
  /** Live counts pulled from the scanner DB. */
  outreach: OutreachSnapshot;
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
