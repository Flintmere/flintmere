import { Bracket } from '@flintmere/ui';
import { GmcPanel } from '@/components/scan/GmcPanel';
import {
  GMC_PRIVATE_EMPTY_BODY,
  GMC_PRIVATE_EMPTY_HEADING,
} from '@/lib/gmc-copy';
import type { GmcGroundTruth } from '@/lib/gmc/types';

// Post-connect payoff body (connect-friction spec 2026-06-07, fix 1 + 2).
// Server component. Renders the merchant's score then their private GMC
// ground truth via the shared GmcPanel (surface="private"). When the GMC
// read returned nothing, we show an honest "connected, no data yet" state — never
// a blank. The degraded "modelled, not read" state is handled upstream when
// the modelled estimate is the only thing available.

export interface PostConnectPayoffProps {
  shopDomain: string;
  score: number;
  grade: string;
  gmcGroundTruth: GmcGroundTruth | null;
}

export function PostConnectPayoff({
  shopDomain,
  score,
  grade,
  gmcGroundTruth,
}: PostConnectPayoffProps) {
  return (
    <>
      <section className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-24 md:py-28">
        <p className="eyebrow text-[color:var(--color-ink-2)] mb-8">
          Connected · your private results
        </p>
        <h1 className="max-w-[20ch]">
          <Bracket>{shopDomain}</Bracket>
        </h1>
        <p
          className="mt-8 max-w-[56ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.5 }}
        >
          Your Merchant Center is wired in. Below is your score and what we read
          from your Google account just now — your own data, shown only to you.
        </p>
      </section>

      <section
        aria-label="Score"
        className="border-y border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-20 grid md:grid-cols-[auto_1fr] gap-12 items-end">
          <div>
            <p
              style={{
                fontSize: 'clamp(72px, 12vw, 180px)',
                fontWeight: 500,
                letterSpacing: '-0.045em',
                lineHeight: 0.92,
              }}
            >
              {score}
            </p>
            <p
              className="eyebrow mt-4 text-[color:var(--color-mute)]"
              style={{ fontSize: 12 }}
            >
              / 100
            </p>
          </div>
          <div className="pb-4">
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 'clamp(40px, 6vw, 80px)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {grade}
            </p>
            <p
              className="eyebrow mt-3 text-[color:var(--color-mute)]"
              style={{ fontSize: 12 }}
            >
              Grade
            </p>
          </div>
        </div>
      </section>

      {gmcGroundTruth ? (
        <GmcPanel gmcGroundTruth={gmcGroundTruth} surface="private" />
      ) : (
        <section
          aria-label="Google Merchant Center"
          className="bg-[color:var(--color-paper-2)] border-y border-[color:var(--color-line)]"
        >
          <div className="mx-auto max-w-[1280px] px-8 py-20 md:py-24">
            <p className="eyebrow mb-6 text-[color:var(--color-ink-2)]">
              Google Merchant Center
            </p>
            <h2 className="max-w-[28ch] mb-6">{GMC_PRIVATE_EMPTY_HEADING}</h2>
            <p
              className="max-w-[64ch] text-[color:var(--color-ink-2)]"
              style={{ fontSize: 16, lineHeight: 1.6 }}
            >
              {GMC_PRIVATE_EMPTY_BODY}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
