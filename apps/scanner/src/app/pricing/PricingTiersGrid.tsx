'use client';

/**
 * PricingTiersGrid — vertical-aware tier card composition for /pricing.
 *
 * Spec: context/design/specs/2026-05-01-pricing-magnitudes-pending-delta.md
 *       (inherits 2026-04-26-pricing-food-first.md §Section 4).
 *
 * Reads URL vertical state via usePricingVertical() — same hook as
 * PricingVerticalTabs so both components stay in lockstep on URL change.
 *
 * Composition by vertical:
 *   - food   → 4-card recurring-tier grid (Free / Food single / Food agency / Plus).
 *              Concierge audit pulled out into its own full-width anchor section
 *              in page.tsx (extravagant-mode rebuild 2026-05-02 — bracket-2 chord
 *              now lands at Saks scale on a dedicated section, not as 1-of-5
 *              competing tier cards).
 *   - beauty → single-message card (standard in development).
 *   - apparel → single-message card (standard in development).
 *   - bundle → single-message card (waiting on beauty cadence).
 *
 * Magnitudes-pending discipline (ADR 0020): forward food tiers carry
 * basePlatform: null in pricing.ts; this component renders them with "—"
 * display + "PRICING FINALISING — MAY–JUNE 2026" sub-line + waitlist mailto
 * CTA. No committed prices. WTP study calibrates magnitudes, not this surface.
 */

import Link from 'next/link';
import { usePricingVertical } from '@/lib/use-vertical';
import { tierBySlug, type Tier } from '@/lib/pricing';
import type { PricingVerticalId } from '@/lib/vertical';

const SALES_EMAIL = 'hello@flintmere.com';

function mailto(subject: string): string {
  return `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export function PricingTiersGrid() {
  const { selected } = usePricingVertical();

  if (selected === 'food') {
    return <FoodTierGrid />;
  }
  return <NonFoodMessage vertical={selected} />;
}

function FoodTierGrid() {
  const free = tierBySlug('free');
  const foodSingle = tierBySlug('food-single');
  const foodAgency = tierBySlug('food-agency');
  const plus = tierBySlug('plus');

  if (!free || !foodSingle || !foodAgency || !plus) return null;

  return (
    <section
      aria-label="Food recurring tiers"
      className="bg-[color:var(--color-paper)]"
    >
      <div
        className="mx-auto max-w-[1280px]"
        style={{
          paddingLeft: 'clamp(24px, 4vw, 64px)',
          paddingRight: 'clamp(24px, 4vw, 64px)',
          paddingTop: 'clamp(48px, 6vw, 96px)',
          paddingBottom: 'clamp(64px, 8vw, 112px)',
        }}
      >
        {/* Calibrating-frame header — anchors the empty price slots in
            calendar time. The "Calibrating" word in MagnitudesPendingCard
            reads against this frame, not as null. */}
        <p className="eyebrow mb-4">Recurring · Calibrating May–June 2026</p>
        <h2
          className="font-medium tracking-[-0.03em] leading-[1.1] text-[color:var(--color-ink)] max-w-[28ch]"
          style={{ fontSize: 'clamp(26px, 3.2vw, 38px)' }}
        >
          Or subscribe — pick the distribution mode.
        </h2>
        <p
          className="text-[color:var(--color-ink-2)] max-w-[64ch]"
          style={{
            marginTop: 'clamp(16px, 2vw, 24px)',
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          We&rsquo;re calibrating sign-up prices with food merchants this May and June. Tiers below show the shape; magnitudes land once the WTP study closes. Existing subscribers stay grandfathered.
        </p>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          style={{ marginTop: 'clamp(40px, 5vw, 64px)' }}
        >
          <FreeCard tier={free} />
          <MagnitudesPendingCard tier={foodSingle} mailtoSubject="Flintmere food single — waitlist" />
          <MagnitudesPendingCard tier={foodAgency} mailtoSubject="Flintmere food agency — waitlist" />
          <PlusAnchorCard tier={plus} />
        </div>
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
      href: mailto('Flintmere — beauty timeline enquiry'),
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
      href: mailto('Flintmere — apparel timeline enquiry'),
    },
  },
  bundle: {
    label: 'Food + Beauty bundle',
    eyebrow: 'FOOD + BEAUTY BUNDLE',
    headline: 'Bundle pricing arrives once the beauty cadence is committed.',
    body:
      'Stores selling both food and beauty SKUs will get a bundle price — second vertical at a discount — once the beauty regulatory standard publishes its first cadence. For now, the food tiers above apply if food is your primary catalog. Talk to the team if you sell both and need unified pricing today.',
    primaryCta: { label: 'See food pricing →', href: '/pricing?vertical=food' },
    secondaryCta: {
      label: 'Talk to the team →',
      href: mailto('Flintmere — food + beauty bundle enquiry'),
    },
  },
};

interface FreeCardProps {
  tier: Tier;
}

function FreeCard({ tier }: FreeCardProps) {
  return (
    <article
      data-hover-lift
      className="border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-6 flex flex-col"
      style={{ minHeight: 360 }}
      aria-labelledby={`tier-${tier.slug}-name`}
    >
      <h3
        id={`tier-${tier.slug}-name`}
        style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}
      >
        {tier.name}
      </h3>
      <p
        className="mt-3"
        style={{
          fontSize: 'clamp(40px, 5vw, 52px)',
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        £0
      </p>
      <p className="eyebrow mt-3 text-[color:var(--color-mute-2)]">PER MONTH</p>
      <p
        className="mt-6 text-[color:var(--color-ink-2)]"
        style={{ fontSize: 14, lineHeight: 1.55 }}
      >
        {tier.blurb}
      </p>
      <ul
        className="mt-6 list-none p-0 m-0 space-y-2 text-[color:var(--color-ink-2)]"
        style={{ fontSize: 13, lineHeight: 1.5 }}
      >
        {tier.features.slice(0, 3).map((f) => (
          <li key={f} className="flex gap-3">
            <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>—</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/scan" className="btn btn-accent mt-auto pt-3" style={{ marginTop: 'auto' }}>
        Run the free scan →
      </Link>
    </article>
  );
}

interface MagnitudesPendingCardProps {
  tier: Tier;
  mailtoSubject: string;
}

function MagnitudesPendingCard({ tier, mailtoSubject }: MagnitudesPendingCardProps) {
  const subId = `tier-${tier.slug}-subprice`;
  return (
    <article
      data-hover-lift
      className="border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-6 flex flex-col"
      style={{ minHeight: 360 }}
      aria-labelledby={`tier-${tier.slug}-name`}
    >
      <h3
        id={`tier-${tier.slug}-name`}
        aria-describedby={subId}
        style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}
      >
        {tier.name}
      </h3>
      {/* Calibrating-state replaces the prior bare em-dash (was reading as
          "no price" — visually identical to a missing field). The amber
          dot + "Calibrating" word reads as in-progress and honest, not
          empty. The full "May–June 2026" timeline lives in the eyebrow
          below to anchor the abstract "calibrating" word in calendar
          time. */}
      <div
        className="mt-3 flex items-center gap-3"
        aria-describedby={subId}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--color-accent)',
          }}
        />
        <p
          style={{
            fontSize: 'clamp(28px, 3.4vw, 36px)',
            fontWeight: 500,
            letterSpacing: '-0.025em',
            lineHeight: 1,
            color: 'var(--color-ink)',
          }}
        >
          Calibrating
        </p>
      </div>
      <p id={subId} className="eyebrow mt-3 text-[color:var(--color-mute-2)]">
        PRICING FINALISES MAY–JUNE 2026
      </p>
      <p
        className="mt-6 text-[color:var(--color-ink-2)]"
        style={{ fontSize: 14, lineHeight: 1.55 }}
      >
        {tier.blurb}
      </p>
      <ul
        className="mt-6 list-none p-0 m-0 space-y-2 text-[color:var(--color-ink-2)]"
        style={{ fontSize: 13, lineHeight: 1.5 }}
      >
        {tier.features.slice(0, 3).map((f) => (
          <li key={f} className="flex gap-3">
            <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>—</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={mailto(mailtoSubject)}
        className="btn mt-auto"
        style={{ marginTop: 'auto' }}
      >
        Join the waitlist →
      </Link>
    </article>
  );
}

interface PlusAnchorCardProps {
  tier: Tier;
}

function PlusAnchorCard({ tier }: PlusAnchorCardProps) {
  const subId = `tier-${tier.slug}-subprice`;
  return (
    <article
      data-hover-lift
      className="border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-6 flex flex-col"
      style={{ minHeight: 360 }}
      aria-labelledby={`tier-${tier.slug}-name`}
    >
      <h3
        id={`tier-${tier.slug}-name`}
        aria-describedby={subId}
        style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}
      >
        {tier.name}
      </h3>
      {/* Plus anchor — "From £1,200/mo" rendered as a real value; the price
          IS published per ADR 0017 (anchor floor disclosed, full ladder on
          enquiry). No "calibrating" treatment needed here — Plus has a
          public floor. */}
      <p
        className="mt-3"
        style={{
          fontSize: 'clamp(28px, 3.4vw, 36px)',
          fontWeight: 500,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          color: 'var(--color-ink)',
        }}
      >
        From £1,200<span style={{ fontSize: '0.5em', color: 'var(--color-mute)', marginLeft: 4 }}>/mo</span>
      </p>
      <p id={subId} className="eyebrow mt-3 text-[color:var(--color-mute-2)]">
        ANCHOR — ON ENQUIRY
      </p>
      <p
        className="mt-6 text-[color:var(--color-ink-2)]"
        style={{ fontSize: 14, lineHeight: 1.55 }}
      >
        {tier.blurb}
      </p>
      <ul
        className="mt-6 list-none p-0 m-0 space-y-2 text-[color:var(--color-ink-2)]"
        style={{ fontSize: 13, lineHeight: 1.5 }}
      >
        {tier.features.slice(0, 3).map((f) => (
          <li key={f} className="flex gap-3">
            <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>—</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={mailto('Flintmere Plus — enquiry')}
        className="btn mt-auto"
        style={{ marginTop: 'auto' }}
      >
        Talk to the team →
      </Link>
    </article>
  );
}
