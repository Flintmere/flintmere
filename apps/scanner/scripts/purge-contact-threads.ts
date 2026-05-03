/**
 * purge-contact-threads
 * ---------------------
 * Daily host-scheduled purge of resolved contact-form threads older
 * than 24 months from last contact. Implements the retention policy
 * disclosed in /privacy clause 04 (Phase 4 of the contact-form
 * rollout).
 *
 * Eligibility lives in `lib/contact-purge.ts` so the policy can be
 * unit-tested without a database. This script is a thin operational
 * wrapper: connect, run the purge, log a structured line, exit.
 *
 * Usage:
 *   pnpm --filter scanner purge:contact-threads          # apply
 *   DRY_RUN=true pnpm --filter scanner purge:contact-threads  # count only
 *   CUTOFF_MONTHS=12 pnpm --filter scanner purge:contact-threads
 *
 * Coolify scheduled-task: daily at 03:15 Europe/London. Idempotent —
 * a second run after a successful purge is a no-op. Failures are
 * surfaced via non-zero exit so the scheduler logs them.
 */

import { PrismaClient } from '../src/generated/prisma';
import {
  DEFAULT_CONTACT_RETENTION_MONTHS,
  purgeResolvedContactThreads,
} from '../src/lib/contact-purge';

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('[purge-contact-threads] DATABASE_URL not set');
    process.exit(1);
  }

  const dryRun = (process.env.DRY_RUN ?? 'false') === 'true';
  const cutoffMonths = process.env.CUTOFF_MONTHS
    ? Number(process.env.CUTOFF_MONTHS)
    : DEFAULT_CONTACT_RETENTION_MONTHS;

  if (!Number.isFinite(cutoffMonths) || cutoffMonths < 1) {
    console.error(
      `[purge-contact-threads] CUTOFF_MONTHS must be a positive integer; got ${process.env.CUTOFF_MONTHS}`,
    );
    process.exit(1);
  }

  const startedAt = new Date();
  const prisma = new PrismaClient();
  try {
    const result = await purgeResolvedContactThreads({
      prisma,
      now: startedAt,
      cutoffMonths,
      dryRun,
    });

    const finishedAt = new Date();
    const log = {
      event: 'purge_contact_threads',
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      cutoffMonths,
      cutoffAt: result.cutoffAt.toISOString(),
      eligibleCount: result.eligibleCount,
      deletedCount: result.deletedCount,
      dryRun: result.dryRun,
      oldestPreservedAt: result.oldestPreservedAt?.toISOString() ?? null,
    };
    console.log(JSON.stringify(log));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        event: 'purge_contact_threads_error',
        startedAt: startedAt.toISOString(),
        message,
      }),
    );
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
}

main();
