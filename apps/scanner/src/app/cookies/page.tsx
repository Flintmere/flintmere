import type { Metadata } from 'next';
import { LegalShell, Clause } from '@/components/LegalShell';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Cookies',
  description:
    'Cookies and similar technologies used by Flintmere. One functional cookie on the scanner; no tracking, analytics, or advertising cookies on the marketing site.',
  alternates: { canonical: '/cookies' },
};

export default function Cookies() {
  return (
    <LegalShell
      eyebrow="Cookies"
      title="Almost none. On purpose."
      summary="The marketing site at flintmere.com sets no cookies. The scanner at audit.flintmere.com sets one functional cookie for CSRF protection. The Shopify app uses Shopify&rsquo;s session cookie, scoped to the embedded admin. We do not use any third-party tracking, advertising, or cross-site analytics cookies, anywhere."
      lastUpdated="2026-04-23"
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

      <Clause n="02" heading="Cookies on flintmere.com (marketing)">
        <p>
          The marketing site sets <strong>no cookies</strong>. No analytics,
          no ad pixels, no A/B testing, no session storage. You can confirm
          this in your browser dev tools. If we ever add a strictly necessary
          cookie (for example, to remember a banner dismissal), we&rsquo;ll
          update this page first.
        </p>
      </Clause>

      <Clause n="03" heading="Cookies on flintmere.com and audit.flintmere.com (marketing + scanner)">
        <p>
          The marketing site and the public scanner set <strong>no cookies</strong>.
          CSRF protection on the scan form is enforced by a request-origin
          check, not by a cookie. Scan results are stored server-side, indexed
          by a short random ID — that ID lives in the URL, not in a cookie.
        </p>
        <p className="mt-4">
          For product analytics we use <strong>Plausible (EU, cookieless)</strong>.
          No cookies are set, no cross-site tracking is performed, no IP
          addresses are stored. Per ADR 0013.
        </p>
      </Clause>

      <Clause n="04" heading="Cookies in the Shopify app (app.flintmere.com)">
        <p>
          The embedded Shopify app relies on Shopify&rsquo;s own session
          token (issued by Shopify Admin) to authenticate requests. This is
          scoped to the Shopify admin and is not accessible from our marketing
          or scanner surfaces.
        </p>
      </Clause>

      <Clause n="05" heading="What we do not use">
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>No Google Analytics, Google Tag Manager, or Google Ads pixels</li>
          <li>No Meta / Facebook pixel</li>
          <li>No LinkedIn, TikTok, X, or Reddit pixels</li>
          <li>No A/B testing or session-replay tools on the marketing site or scanner</li>
          <li>No third-party chat widgets that set cookies</li>
          <li>No fingerprinting or &ldquo;cookieless&rdquo; tracking workarounds</li>
        </ul>
      </Clause>

      <Clause n="06" heading="How to control cookies">
        <p>
          We set no cookies on the marketing site or scanner today, so
          there is nothing to block. For any future non-essential cookie
          (we have none today), we will present a consent banner and
          honour GPC (Global Privacy Control) signals.
        </p>
      </Clause>

      <Clause n="07" heading="Questions">
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
