import type { LoaderFunctionArgs } from '@remix-run/node';
import { authenticate } from '../../shopify.server';
import { prisma } from '../../db.server';
import { deriveFixStatus } from '../../lib/fixes/status';
import { getFixTypeMeta } from '../../lib/fixes/registry';

// GET /app/fixes/export.csv
// Streams every Fix row for the calling shop as CSV. Audit trail per
// SPEC §5.2.1. Streams via ReadableStream so 1000+ batch histories
// don't load entirely into memory.

const CHUNK_SIZE = 200;

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(
          'fix_id,fix_type,display_name,tier,status,product_count,applied_at,revertable_until,reverted_at\n',
        ),
      );

      let cursor: string | undefined;
      while (true) {
        const batch = await prisma.fix.findMany({
          where: { shopDomain },
          orderBy: [{ appliedAt: 'desc' }, { id: 'desc' }],
          take: CHUNK_SIZE,
          ...(cursor
            ? { skip: 1, cursor: { id: cursor } }
            : {}),
          select: {
            id: true,
            fixType: true,
            tier: true,
            status: true,
            productCount: true,
            appliedAt: true,
            revertableUntil: true,
            revertedAt: true,
          },
        });

        if (batch.length === 0) break;

        for (const fix of batch) {
          const display = getFixTypeMeta(fix.fixType)?.displayName ?? fix.fixType;
          const status = deriveFixStatus(fix);
          const row = [
            fix.id,
            fix.fixType,
            display,
            String(fix.tier),
            status,
            String(fix.productCount),
            fix.appliedAt.toISOString(),
            fix.revertableUntil.toISOString(),
            fix.revertedAt ? fix.revertedAt.toISOString() : '',
          ]
            .map(csvEscape)
            .join(',');
          controller.enqueue(encoder.encode(row + '\n'));
        }

        if (batch.length < CHUNK_SIZE) break;
        cursor = batch[batch.length - 1]?.id;
        if (!cursor) break;
      }

      controller.close();
    },
  });

  const filename = `flintmere-fixes-${shopDomain}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

function csvEscape(value: string): string {
  if (value === '') return '';
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
