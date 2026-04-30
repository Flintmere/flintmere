import { prisma } from '@/lib/db';
import {
  summariseBenchmark,
  type BenchmarkRow,
} from '@/lib/benchmark-summary';
import { BENCHMARK_FLOOR, BENCHMARK_PUBLISH_FLOOR } from '@/lib/copy';

/**
 * Research-page data + presentation primitives.
 *
 * Owns the v1 benchmark fetch (FlintmereBot scans + opt-in publishedToBenchmark
 * scores) and the helpers that turn raw rows into the shape the chapter
 * components consume. Chapter components are pure-presentational and never
 * touch the DB or the summary helper.
 */

export interface Published {
  available: boolean;
  preview: boolean;
  n: number;
  floor: number;
  publishFloor: number;
  asOfLabel: string;
  overall: {
    median: number | null;
    grade: string | null;
    distribution: { A: number; B: number; C: number; D: number; F: number };
  };
  byVertical: Array<{
    slug: string;
    label: string;
    href: string;
    n: number;
    median: number | null;
    grade: string | null;
  }>;
  allVerticals: Array<{
    slug: string;
    label: string;
    n: number;
    median: number | null;
  }>;
}

// Per-word stagger + beat for headline cascades, shared across chapter
// components so the page reads with one motion register.
export const STAGGER = 110;
export const BEAT = 300;

// Verticals seeded for /for/<vertical> deep-dives. Order matches the
// scanner_scans.vertical column and the per-vertical page order.
const VERTICALS: Array<{ slug: string; label: string; href: string }> = [
  { slug: 'apparel', label: 'Apparel', href: '/for/apparel' },
  { slug: 'beauty', label: 'Beauty', href: '/for/beauty' },
  {
    slug: 'food-and-drink',
    label: 'Food & drink',
    href: '/for/food-and-drink',
  },
];

// Hand-labelled overrides for compound slugs and apostrophes — retail
// taxonomies pair categories ambiguously and title-casing alone gets
// things like "Mens grooming" or "Tools diy" wrong.
const VERTICAL_LABEL_OVERRIDES: Record<string, string> = {
  'food-and-drink': 'Food & drink',
  'candles-fragrance': 'Candles & fragrance',
  'bags-leather': 'Bags & leather',
  'bath-body': 'Bath & body',
  'baby-kids': 'Baby & kids',
  'toys-games': 'Toys & games',
  'books-stationery': 'Books & stationery',
  'tools-diy': 'Tools & DIY',
  'mens-grooming': "Men's grooming",
};

function humanizeSlug(slug: string): string {
  if (VERTICAL_LABEL_OVERRIDES[slug]) return VERTICAL_LABEL_OVERRIDES[slug];
  return slug
    .split('-')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function medianGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function distributionPct(
  dist: Published['overall']['distribution'],
  grade: 'A' | 'B' | 'C' | 'D' | 'F',
  n: number,
): number {
  if (n === 0) return 0;
  return Math.round((dist[grade] / n) * 100);
}

// Share of the sample that grades D or F — the "not agent-ready" cohort.
// Kept separate from distributionPct so the cover copy can reference a
// single number without recomputing.
export function belowCeilingPct(
  dist: Published['overall']['distribution'],
  n: number,
): number {
  if (n === 0) return 0;
  return Math.round(((dist.D + dist.F) / n) * 100);
}

export async function loadBenchmark(): Promise<Published> {
  const rows = await prisma.scan.findMany({
    where: {
      OR: [{ source: 'bot' }, { publishedToBenchmark: true }],
      status: 'complete',
      score: { not: null },
      grade: { not: null },
    },
    select: { score: true, grade: true, vertical: true },
  });
  const typed: BenchmarkRow[] = rows.map((r) => ({
    score: r.score ?? 0,
    grade: r.grade ?? '',
    vertical: r.vertical,
  }));
  const summary = summariseBenchmark(typed);

  const overallAvailable = summary.available;
  const overall = {
    median: overallAvailable ? summary.overall.medianScore : null,
    grade: overallAvailable
      ? medianGrade(summary.overall.medianScore ?? 0)
      : null,
    distribution: summary.overall.gradeDistribution,
  };

  const byVertical = VERTICALS.map((v) => {
    const bucket = summary.byVertical[v.slug];
    const available = !!bucket && bucket.n >= BENCHMARK_FLOOR;
    return {
      slug: v.slug,
      label: v.label,
      href: v.href,
      n: bucket?.n ?? 0,
      median: available ? (bucket?.medianScore ?? null) : null,
      grade: available ? medianGrade(bucket?.medianScore ?? 0) : null,
    };
  });

  // All verticals with enough rows to render a number, flagship cohorts
  // first (so the three deep-sampled cards line up with the grid), then
  // the remainder sorted by sample size descending.
  const flagshipSlugs = new Set(VERTICALS.map((v) => v.slug));
  const flagshipRows = VERTICALS.flatMap((v) => {
    const b = summary.byVertical[v.slug];
    if (!b || b.n < BENCHMARK_FLOOR) return [];
    return [
      {
        slug: v.slug,
        label: v.label,
        n: b.n,
        median: b.medianScore ?? null,
      },
    ];
  });
  const restRows = Object.entries(summary.byVertical)
    .filter(([slug, b]) => !flagshipSlugs.has(slug) && b.n >= BENCHMARK_FLOOR)
    .map(([slug, b]) => ({
      slug,
      label: humanizeSlug(slug),
      n: b.n,
      median: b.medianScore ?? null,
    }))
    .sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  const allVerticals = [...flagshipRows, ...restRows];

  return {
    available: overallAvailable,
    preview: summary.preview,
    n: summary.overall.n,
    floor: BENCHMARK_FLOOR,
    publishFloor: BENCHMARK_PUBLISH_FLOOR,
    asOfLabel: new Date(summary.asOf).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
    }),
    overall,
    byVertical,
    allVerticals,
  };
}
