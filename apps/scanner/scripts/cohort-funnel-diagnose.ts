/**
 * cohort-funnel-diagnose
 * ----------------------
 * Quick exploratory query to surface scanner-lead funnel state when
 * `cohort:design-partners` returns zero. No PII to stdout; only counts.
 *
 * Usage: pnpm --filter scanner cohort:diagnose
 */

import { PrismaClient } from '../src/generated/prisma';

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const totalScans = await prisma.scan.count();
    const totalLeads = await prisma.lead.count();
    const activeLeads = await prisma.lead.count({ where: { unsubscribedAt: null } });
    const benchmarkOptIn = await prisma.scan.count({
      where: { publishedToBenchmark: true },
    });

    const scansByVertical = await prisma.scan.groupBy({
      by: ['vertical'],
      _count: { _all: true },
      orderBy: { _count: { vertical: 'desc' } },
    });

    const scansByGrade = await prisma.scan.groupBy({
      by: ['grade'],
      _count: { _all: true },
      orderBy: { _count: { grade: 'desc' } },
    });

    const scansBySource = await prisma.scan.groupBy({
      by: ['source'],
      _count: { _all: true },
    });

    const scansByStatus = await prisma.scan.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const leadsWithFoodScan = await prisma.lead.count({
      where: { unsubscribedAt: null, scan: { vertical: 'food' } },
    });

    const leadsWithSkuRange = await prisma.lead.count({
      where: {
        unsubscribedAt: null,
        scan: { productCount: { gte: 100, lte: 5000 } },
      },
    });

    const leadsCompleteScans = await prisma.lead.count({
      where: { unsubscribedAt: null, scan: { status: 'complete' } },
    });

    const conciergeAll = await prisma.conciergeAudit.count();
    const conciergeByStatus = await prisma.conciergeAudit.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    console.log('=== Scanner DB funnel snapshot ===');
    console.log(`scans (all):                   ${totalScans}`);
    console.log(`leads (all):                   ${totalLeads}`);
    console.log(`leads (active / not unsub):    ${activeLeads}`);
    console.log(`scans (publishedToBenchmark):  ${benchmarkOptIn}`);
    console.log('');
    console.log('Scans by vertical:');
    for (const v of scansByVertical) {
      console.log(`  ${(v.vertical ?? '<null>').padEnd(20)} ${v._count._all}`);
    }
    console.log('Scans by grade:');
    for (const g of scansByGrade) {
      console.log(`  ${(g.grade ?? '<null>').padEnd(20)} ${g._count._all}`);
    }
    console.log('Scans by source:');
    for (const s of scansBySource) {
      console.log(`  ${s.source.padEnd(20)} ${s._count._all}`);
    }
    console.log('Scans by status:');
    for (const s of scansByStatus) {
      console.log(`  ${s.status.padEnd(20)} ${s._count._all}`);
    }
    console.log('');
    console.log('Active leads × scan filters:');
    console.log(`  scan complete:               ${leadsCompleteScans}`);
    console.log(`  scan vertical = food:        ${leadsWithFoodScan}`);
    console.log(`  scan productCount 100..5000: ${leadsWithSkuRange}`);
    console.log('');
    console.log(`Concierge audits (all):        ${conciergeAll}`);
    for (const s of conciergeByStatus) {
      console.log(`  status ${s.status.padEnd(14)} ${s._count._all}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('cohort-funnel-diagnose fatal', err);
  process.exit(1);
});
