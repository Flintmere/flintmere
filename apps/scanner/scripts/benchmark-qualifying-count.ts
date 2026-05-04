/**
 * benchmark-qualifying-count
 * ---------------------------
 * Counts scans that match GET /api/benchmark/summary row filters (aggregate
 * benchmark pool). Compares per-vertical n to BENCHMARK_PUBLISH_FLOOR (100).
 *
 * Usage:
 *   pnpm --filter scanner benchmark:qualifying
 *
 * Env:
 *   VERTICAL=food-and-drink   optional — print only this slug + gap to floor
 */

import { PrismaClient } from '../src/generated/prisma';
import { BENCHMARK_PUBLISH_FLOOR } from '../src/lib/copy';

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('[benchmark-qualifying-count] DATABASE_URL not set');
    process.exit(1);
  }

  const focusVertical = process.env.VERTICAL?.trim();

  const prisma = new PrismaClient();
  try {
    const baseWhere = {
      OR: [{ source: 'bot' as const }, { publishedToBenchmark: true }],
      status: 'complete' as const,
      score: { not: null },
      grade: { not: null },
    };

    const overall = await prisma.scan.count({ where: baseWhere });

    const byVertical = await prisma.scan.groupBy({
      by: ['vertical'],
      where: baseWhere,
      _count: { _all: true },
      orderBy: { _count: { vertical: 'desc' } },
    });

    console.log('=== Benchmark qualifying scans (same filters as /api/benchmark/summary) ===');
    console.log(`publish floor: ${BENCHMARK_PUBLISH_FLOOR} complete scored rows per vertical page`);
    console.log(`overall (all verticals): ${overall}`);
    console.log('');

    const slugOrder = ['food-and-drink', 'beauty', 'apparel'] as const;
    const primarySlugs = new Set<string>(slugOrder);

    console.log('Per vertical:');
    const rows = [...byVertical].sort((a, b) => {
      const ai = slugOrder.indexOf(a.vertical ?? '');
      const bi = slugOrder.indexOf(b.vertical ?? '');
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return (b.vertical ?? '').localeCompare(a.vertical ?? '');
    });

    for (const row of rows) {
      const slug = row.vertical ?? '<null>';
      const n = row._count._all;
      const gap = Math.max(0, BENCHMARK_PUBLISH_FLOOR - n);
      const ok = n >= BENCHMARK_PUBLISH_FLOOR;
      console.log(
        `  ${slug.padEnd(22)} n=${n.toString().padStart(4)}  gap=${gap.toString().padStart(3)}  ${ok ? '≥ floor' : 'preview'}`,
      );
    }

    if (focusVertical) {
      const n = await prisma.scan.count({
        where: { ...baseWhere, vertical: focusVertical },
      });
      const gap = Math.max(0, BENCHMARK_PUBLISH_FLOOR - n);
      console.log('');
      console.log(`Focus VERTICAL=${focusVertical}: n=${n} gap=${gap}`);
      if (!primarySlugs.has(focusVertical)) {
        console.log(
          `(note: canonical slugs are ${slugOrder.join(', ')} — typo-safe check your CSV.)`,
        );
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[benchmark-qualifying-count] fatal', err);
  process.exit(1);
});
