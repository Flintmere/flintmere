import type { Metadata } from 'next';
import { LegalShell, Clause } from '@/components/LegalShell';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Cookies — tracking, analytics, storage',
  description:
    'Cookies and similar technologies used by Flintmere. No first-party cookies on the marketing site or scanner — CSRF protection uses a request-origin check, not a cookie. No tracking, analytics, or advertising cookies anywhere.',
  alternates: { canonical: '/cookies' },
};

export default function Cookies() {
  return (
    <LegalShell
      eyebrow="Cookies"
      title="Almost none. On purpose."
      summary="Neither the marketing site at flintmere.com nor the scanner at audit.flintmere.com sets any first-party cookies — CSRF protection is enforced by a request-origin check, not a cookie. The Shopify app uses Shopify&rsquo;s session cookie, scoped to the embedded admin. We do not use any third-party tracking, advertising, or cross-site analytics cookies, anywhere."
      lastUpdated="2026-05-14"
      anchorNumeral="04"
    >
      <Clause n="01" heading="What is a cookie">
        <p>
          A cookie is a small text file stored by your browser when you visit
          a website. We also group browser <code>localStorage</code> and
          server-issued session tokens under this policy, because
          privacy-wise they do the same thing.
        </p>
      </Clause>

      <Clause n="02" heading="Cookies on flintmere.com and audit.flintmere.com (marketing + scanner)">
        <p>
          The marketing site and the public scanner set <strong>no cookies</strong>.
          No analytics cookies, no ad pixels, and nothing written to{' '}
          <code>localStorage</code> or <code>sessionStorage</code>. You can
          confirm this in your browser dev tools.
        </p>
        <p className="mt-4">
          CSRF protection on the scan form is enforced by a request-origin
          check, not by a cookie. Scan results are stored server-side, indexed
          by a short random ID — that ID lives in the URL, not in a cookie.
        </p>
        <p className="mt-4">
          For product analytics we use <strong>PostHog (EU-hosted, configured
          cookieless)</strong>. Our PostHog configuration stores no cookies and
          no browser-storage identifiers — analytics state lives in page memory
          only. No cross-site tracking is performed. Per ADR 0025.
        </p>
      </Clause>

      <Clause n="03" heading="Cookies in the Shopify app (app.flintmere.com)">
        <p>
          The embedded Shopify app relies on Shopify&rsquo;s own session
          token (issued by Shopify Admin) to authenticate requests. This is
          scoped to the Shopify admin and is not accessible from our marketing
          or scanner surfaces.
        </p>
      </Clause>

      <Clause n="04" heading="What we do not use">
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>No Google Analytics, Google Tag Manager, or Google Ads pixels</li>
          <li>No Meta / Facebook pixel</li>
          <li>No LinkedIn, TikTok, X, or Reddit pixels</li>
          <li>No third-party chat widgets that set cookies</li>
          <li>
            No device fingerprinting, hidden ID regeneration, or ETag / cache
            tracking workarounds
          </li>
        </ul>
      </Clause>

      <Clause n="05" heading="How to control cookies">
        <p>
          We set no cookies on the marketing site or scanner today, so
          there is nothing to block. For any future non-essential cookie
          (we have none today), we will present a consent banner and
          honour GPC (Global Privacy Control) signals.
        </p>
      </Clause>

      <Clause n="06" heading="Questions">
        <p>
          Send a message via our{' '}
          <a href="/contact?topic=privacy" className="underline">
            contact form
          </a>{' '}
          (Privacy topic) if you find a cookie not listed here — it would be a bug.
        </p>
      </Clause>
    </LegalShell>
  );
}
