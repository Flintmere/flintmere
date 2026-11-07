'use client';

/**
 * Band picker for /catalog-letter — the control that changes the price.
 *
 * Why this exists (2026-11-07). The band ladder's plumbing has been
 * complete since ADR 0022 Phase 1b: `BandTriptych` holds the state and
 * reads `?band=`, `CheckoutCard` takes `bandSlug` + `onBandChange`, and
 * `api/concierge/checkout` derives the charge from
 * `bandBySlug(slug).pricePence`. Only the control was missing.
 * `CheckoutCard` destructured the handler as `_onBandChange` and never
 * called it, so the band could be changed one way only — by deep-link
 * from /pricing. The bespoke fork's own copy ("pick Band 1 or Band 2
 * above") pointed at a control that was not on the page.
 *
 * Measured 2026-11-07 against the live page at 375x812: first £ at 0.24
 * screens, primary action at 0.82, price-changing control NOT FOUND.
 *
 * Native radios, not `role="radiogroup"` on buttons: arrow-key roving,
 * the required/checked semantics and the group announcement all come
 * free, and a fieldset+legend names the group without an extra aria
 * attribute to keep in sync. The inputs are `sr-only` rather than
 * `hidden` so they stay focusable; `peer-*` carries the visual state.
 *
 * Band 3 is selectable here and swaps CheckoutCard to the bespoke
 * enquiry fork — it never reaches Stripe. That branch is the reason the
 * picker renders above the fork rather than inside the collect form:
 * having chosen Band 3 you must be able to choose your way back out.
 */

import { AUDIT_BANDS, type AuditBandSlug } from '@/lib/audit-pricing';

export function BandPicker({
  bandSlug,
  onBandChange,
}: {
  bandSlug: AuditBandSlug;
  onBandChange: (slug: AuditBandSlug) => void;
}) {
  return (
    <fieldset
      className="m-0 border-0 p-0"
      style={{
        padding: '18px 20px 16px',
        borderBottom: '1px solid var(--color-line)',
      }}
    >
      <legend className="eyebrow" style={{ marginBottom: 12, padding: 0 }}>
        Your catalog size
      </legend>

      <div style={{ display: 'grid', gap: 8 }}>
        {AUDIT_BANDS.map((band) => {
          const id = `band-choice-${band.slug}`;
          return (
            <div key={band.slug} style={{ position: 'relative' }}>
              <input
                type="radio"
                id={id}
                name="auditBand"
                value={band.slug}
                checked={bandSlug === band.slug}
                onChange={() => onBandChange(band.slug)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={[
                  'flex cursor-pointer items-center justify-between gap-3',
                  // 56px clears the 24x24 floor with room for a thumb.
                  'min-h-[56px] px-4',
                  'border border-[color:var(--color-line)]',
                  'peer-checked:border-[color:var(--color-ink)]',
                  'peer-checked:bg-[color:var(--color-paper-2)]',
                  'peer-focus-visible:outline peer-focus-visible:outline-2',
                  'peer-focus-visible:outline-offset-2',
                  'peer-focus-visible:outline-[color:var(--color-ink)]',
                ].join(' ')}
              >
                <span
                  className="text-[color:var(--color-ink)]"
                  style={{ fontSize: 15, lineHeight: 1.3 }}
                >
                  {band.skuRangeLabel}
                </span>
                <span
                  className="font-mono text-[color:var(--color-ink)]"
                  style={{ fontSize: 14, flexShrink: 0 }}
                >
                  {band.priceDisplayShort}
                </span>
              </label>
            </div>
          );
        })}
      </div>

      <p
        className="text-[color:var(--color-mute)]"
        style={{ marginTop: 12, fontSize: 12, lineHeight: 1.5 }}
      >
        You tell us your band &mdash; we don&rsquo;t count your SKUs first.
        Wrong band and we&rsquo;ll settle up within a working day, either way.
      </p>
    </fieldset>
  );
}
