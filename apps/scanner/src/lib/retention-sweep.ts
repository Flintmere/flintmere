import { prisma } from './db'

// Periodic data-retention sweeps backing the privacy-policy claims at
// /privacy:
//
//   • Scanner results: 90 days, then deleted.
//   • Email leads: until you unsubscribe, then purged within 30 days.
//   • Stripe webhook idempotency: 30-day retention (per security-posture
//     §Universal webhook rules).
//
// Order matters. Leads have a foreign-key to Scan; deleting a Scan
// without first deleting its leads would raise a FK violation. We
// run the leg-of-leads sweeps before the scan sweep, then let the
// scan sweep clean up everything older than 90 days (which cascades
// any remaining leads via a final cleanup of orphaned-by-scan-window
// leads).
//
// Side effect on the benchmark aggregate: /api/benchmark/summary
// computes over live scans where source='bot' OR publishedToBenchmark.
// The aggregate naturally rolls forward as scans age out — this is
// consistent with the privacy claim and frames the benchmark as a
// "current state" view rather than a historical archive.

const LEAD_UNSUBSCRIBE_RETENTION_DAYS = 30
const SCAN_RETENTION_DAYS = 90
const STRIPE_EVENT_RETENTION_DAYS = 30
const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface RetentionSweepResult {
  unsubscribedLeadsDeleted: number
  expiredScanLeadsDeleted: number
  expiredScansDeleted: number
  expiredStripeEventsDeleted: number
}

export async function runRetentionSweep(
  now: Date = new Date(),
): Promise<RetentionSweepResult> {
  const leadCutoff = new Date(now.getTime() - LEAD_UNSUBSCRIBE_RETENTION_DAYS * MS_PER_DAY)
  const scanCutoff = new Date(now.getTime() - SCAN_RETENTION_DAYS * MS_PER_DAY)
  const stripeCutoff = new Date(now.getTime() - STRIPE_EVENT_RETENTION_DAYS * MS_PER_DAY)

  // Sweep 1: leads past their unsubscribe-retention window.
  const unsubscribedLeads = await prisma.lead.deleteMany({
    where: {
      unsubscribedAt: { not: null, lt: leadCutoff },
    },
  })

  // Sweep 2: leads attached to scans that have aged past 90 days.
  // Without this, the scan-sweep below would FK-fail on those leads.
  // Performed BEFORE the scan delete so the relation resolves cleanly.
  const expiredScanLeads = await prisma.lead.deleteMany({
    where: {
      scan: { createdAt: { lt: scanCutoff } },
    },
  })

  // Sweep 3: scans past 90 days. Deletes scoreJson + everything else.
  const expiredScans = await prisma.scan.deleteMany({
    where: {
      createdAt: { lt: scanCutoff },
    },
  })

  // Sweep 4: Stripe idempotency rows past 30 days. Independent of the
  // scan/lead chain — different table, different retention rationale.
  const expiredStripeEvents = await prisma.stripeProcessedEvent.deleteMany({
    where: {
      processedAt: { lt: stripeCutoff },
    },
  })

  return {
    unsubscribedLeadsDeleted: unsubscribedLeads.count,
    expiredScanLeadsDeleted: expiredScanLeads.count,
    expiredScansDeleted: expiredScans.count,
    expiredStripeEventsDeleted: expiredStripeEvents.count,
  }
}
