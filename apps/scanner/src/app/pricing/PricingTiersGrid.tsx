'use client';

/**
 * PricingTiersGrid — vertical-aware cohort/message section for /pricing.
 *
 * Re-scoped 2026-05-03 (Standing Council Option B verdict). The page
 * now leads with real-priced anchors (concierge band ladder + Plus) at
 * the top of /pricing/page.tsx; this component handles the demoted
 * vertical-specific surface that follows.
 *
 * Composition by vertical:
 *   - food    → cohort invitation block. No tier cards, no calibrating
 *               number anchors (council binding rule: "joining now
 *               shapes the price you'll pay" framing, no `from £X`
 *               back-door anchoring). Free scan stays as the
 *               affordance for browsers; the calibrating recurring
 *               tiers are framed as cohort joinable, not waitlist.
 *   - beauty  → message-card (standard in development).
 *   - apparel → message-card (standard in development).
 *   - bundle  → message-card (waiting on beauty cadence).
 *
 * Reads URL vertical state via usePricingVertical() — same hook as
 * PricingVerticalTabs so both stay in lockstep on URL change.
 */

import Link from 'next/link';
import { SCAN_URL } from '@/lib/host-routing';
import { Bracket } from '@flintmere/ui';
import { usePricingVertical } from '@/lib/use-vertical';
import type { PricingVerticalId } from '@/lib/vertical';

function contactLink(topic: 'general' | 'plus' | 'billing'): string {
  return `/contact?topic=${topic}`;
}

export function PricingTiersGrid() {
  const { selected } = usePricingVertical();

  if (selected === 'food') {
    return <FoodCohortInvitation />;
  }
  return <NonFoodMessage vertical={selected} />;
}

function FoodCohortInvitation() {
  const explainerId = 'food-cohort-explainer';
  return (
    <section
      aria-labelledby="food-cohort-heading"
      className="bg-[color:var(--color-paper)]"
    >
      <div
        className="mx-auto max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 64px)',
          paddingRight: 'clamp(24px, 4vw, 64px)',
          paddingTop: 'clamp(72px, 9vw, 128px)',
          paddingBottom: 'clamp(72px, 9vw, 128px)',
        }}
      >
        <p className="eyebrow mb-6">Food recurring · Joining the cohort</p>
        <h2
          id="food-cohort-heading"
          className="font-medium tracking-[-0.03em] leading-[1.0] text-[color:var(--color-ink)] max-w-[20ch]"
          style={{ fontSize: 'clamp(36px, 5.2vw, 72px)' }}
        >
          Joining now shapes the{' '}
          <Bracket size="display">price</Bracket>
          {' '}you&rsquo;ll pay.
        </h2>
        <p
          id={explainerId}
          className="text-[color:var(--color-ink-2)] max-w-[64ch]"
          style={{
            marginTop: 'clamp(28px, 3vw, 40px)',
            fontSize: 17,
            lineHeight: 1.55,
          }}
        >
          We&rsquo;re calibrating recurring sign-up prices with the food
          merchants joining May and June 2026. The number lands once we
          know what the work costs us and what the merchants we&rsquo;re
          serving would actually pay. Cohort merchants stay grandfathered
          at the calibration price &mdash; whatever it lands at.
        </p>

        <div
          className="grid md:grid-cols-2 gap-6"
          style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}
        >
          <article
            className="border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-6 flex flex-col"
            style={{ minHeight: 280 }}
            aria-labelledby="food-cohort-free-name"
            aria-describedby={explainerId}
          >
            <p className="eyebrow">Free scan</p>
            <h3
              id="food-cohort-free-name"
              className="mt-3"
              style={{
                fontSize: 'clamp(28px, 3.2vw, 36px)',
                fontWeight: 500,
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
              }}
            >
              Run the scan. Read your score.
            </h3>
            <p
              className="mt-4 text-[color:var(--color-ink-2)]"
              style={{ fontSize: 14, lineHeight: 1.55 }}
            >
              Four public-source pillars, no install, 60 seconds. No
              signup needed. The recurring tiers add daily monitoring,
              auto-fixes, and the seven-pillar score.
            </p>
            <Link
              href={SCAN_URL}
              className="btn btn-accent mt-auto"
              style={{ marginTop: 'auto' }}
            >
              Run the free scan →
            </Link>
          </article>

          <article
            className="border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-6 flex flex-col"
            style={{ minHeight: 280 }}
            aria-labelledby="food-cohort-recurring-name"
            aria-describedby={explainerId}
          >
            <p className="eyebrow">
              Calibration cohort · Single store + agency
            </p>
            <h3
              id="food-cohort-recurring-name"
              className="mt-3"
              style={{
                fontSize: 'clamp(28px, 3.2vw, 36px)',
                fontWeight: 500,
                letterSpacing: '-0.025em',
                lineHeight: 1.05,
              }}
            >
              Reserve a place; help set the price.
            </h3>
            <p
              className="mt-4 text-[color:var(--color-ink-2)]"
              style={{ fontSize: 14, lineHeight: 1.55 }}
            >
              Daily drift monitoring, auto-fixes, the full seven-pillar
              score, and grandfathered cohort pricing once May&ndash;June
              calibration closes. Single-store and agency tiers ship
              together.
            </p>
            <Link
              href={contactLink('general')}
              className="btn mt-auto"
              style={{ marginTop: 'auto' }}
            >
              Join the cohort →
            </Link>
          </article>
        </div>

        <p
          className="text-[color:var(--color-mute)] max-w-[64ch]"
          style={{
            marginTop: 'clamp(32px, 4vw, 48px)',
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          Existing Growth, Scale, Agency, and Plus subscribers from
          before 2026-04-26 stay at their original prices indefinitely.
          Plus is on the anchor above; band-laddered concierge audits
          are the available-now action.
        </p>
      </div>
    </section>
  );
}

function NonFoodMessage({ vertical }: { vertical: PricingVerticalId }) {
  const content = NON_FOOD_CONTENT[vertical];
  if (!content) return null;

  return (
    <section
      aria-label={`${content.label} pricing`}
      aria-labelledby={`vertical-${vertical}-headline`}
      className="bg-[color:var(--color-paper)]"
    >
      <div
        className="mx-auto max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 64px)',
          paddingRight: 'clamp(24px, 4vw, 64px)',
          paddingTop: 'clamp(64px, 8vw, 128px)',
          paddingBottom: 'clamp(64px, 8vw, 128px)',
        }}
      >
        <p className="eyebrow mb-6">{content.eyebrow}</p>
        <h2
          id={`vertical-${vertical}-headline`}
          className="font-medium tracking-[-0.035em] leading-[1.0] text-[color:var(--color-ink)] max-w-[20ch]"
          style={{ fontSize: 'clamp(40px, 6vw, 88px)' }}
        >
          {content.headline}
        </h2>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[62ch]"
          style={{
            marginTop: 'clamp(32px, 4vw, 56px)',
            fontSize: 'clamp(15px, 1.1vw, 17px)',
            lineHeight: 1.7,
          }}
        >
          {content.body}
        </p>
        <div
          className="flex flex-col sm:flex-row gap-4"
          style={{ marginTop: 'clamp(32px, 4vw, 56px)' }}
        >
          <Link href={content.primaryCta.href} className="btn btn-accent whitespace-nowrap">
            {content.primaryCta.label}
          </Link>
          <Link href={content.secondaryCta.href} className="btn whitespace-nowrap">
            {content.secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

interface NonFoodContent {
  label: string;
  eyebrow: string;
  headline: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

const NON_FOOD_CONTENT: Partial<Record<PricingVerticalId, NonFoodContent>> = {
  beauty: {
    label: 'Beauty',
    eyebrow: 'BEAUTY',
    headline: 'Beauty: standard in development.',
    body:
      'Food is our spearhead. The beauty regulatory standard arrives once the food cadence is published and we commit to a beauty cadence — not before. Run a free scan now to see where your beauty catalog stands; talk to the team if you need a beauty timeline.',
    primaryCta: { label: 'Run a free scan →', href: '/scan' },
    secondaryCta: {
      label: 'Talk to the team →',
      href: contactLink('general'),
    },
  },
  apparel: {
    label: 'Apparel',
    eyebrow: 'APPAREL',
    headline: 'Apparel: standard in development.',
    body:
      'Food is our spearhead. The apparel regulatory standard arrives once the food cadence is published and we commit to an apparel cadence — not before. Run a free scan now to see where your apparel catalog stands; talk to the team if you need an apparel timeline.',
    primaryCta: { label: 'Run a free scan →', href: '/scan' },
    secondaryCta: {
      label: 'Talk to the team →',
      href: contactLink('general'),
    },
  },
  bundle: {
    label: 'Food + Beauty bundle',
    eyebrow: 'FOOD + BEAUTY BUNDLE',
    headline: 'Bundle pricing arrives once the beauty cadence is committed.',
    body:
      'Stores selling both food and beauty SKUs will get a bundle price — second vertical at a discount — once the beauty regulatory standard publishes its first cadence. For now, the food cohort applies if food is your primary catalog. Talk to the team if you sell both and need unified pricing today.',
    primaryCta: { label: 'See food pricing →', href: '/pricing?vertical=food' },
    secondaryCta: {
      label: 'Talk to the team →',
      href: contactLink('general'),
    },
  },
};
