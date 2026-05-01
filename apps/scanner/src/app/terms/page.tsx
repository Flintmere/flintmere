import type { Metadata } from 'next';
import { LegalShell, Clause } from '@/components/LegalShell';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The agreement between you and Flintmere (Eazy Access Ltd) for the scanner, Shopify app, and concierge audits.',
};

export default function Terms() {
  return (
    <LegalShell
      eyebrow="Terms"
      title="The rules of the road."
      summary="Plain terms: you pay, we score and fix your catalog. 30-day full refund if you change your mind. You own your data, we own our software. We can&rsquo;t be responsible for more than you paid us in the last 12 months. If we disagree, English law applies."
      lastUpdated="2026-04-23"
      anchorNumeral="02"
    >
      <Clause n="01" heading="Who these terms are with">
        <p>
          These terms form a binding agreement between you (the merchant,
          agency, or visitor) and <strong>Eazy Access Ltd</strong>, trading as
          Flintmere, a company registered in England and Wales (Companies
          House number <strong>13205428</strong>). References to
          &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;Flintmere&rdquo; mean
          Eazy Access Ltd.
        </p>
      </Clause>

      <Clause n="02" heading="What you get">
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Scanner</strong> at <code>audit.flintmere.com</code>: a
            free, public diagnostic of any Shopify store&rsquo;s AI-agent
            readiness. No account required.
          </li>
          <li>
            <strong>Shopify app</strong> at <code>app.flintmere.com</code>: a
            catalog scoring and fixing tool installed from the Shopify App
            Store. Plans are Free, Growth (£79/mo), Scale (£249/mo), Agency
            (£499/mo), and Plus (from £1,500/mo).
          </li>
          <li>
            <strong>Concierge audits</strong>: a £97 one-off written audit
            delivered within three working days, purchased directly via Stripe.
          </li>
        </ul>
      </Clause>

      <Clause n="03" heading="Your account and eligibility">
        <p>
          You must be at least 18 and authorised to bind the business you
          represent. You are responsible for the security of your Shopify
          store&rsquo;s access and for the actions of anyone you grant access
          to Flintmere. Tell us immediately at{' '}
          <a href="mailto:security@flintmere.com" className="underline">
            security@flintmere.com
          </a>{' '}
          if you suspect unauthorised access.
        </p>
      </Clause>

      <Clause n="04" heading="Billing, trials, and refunds">
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Growth and Scale</strong> bill through{' '}
            <strong>Shopify Managed Pricing</strong>. Charges appear on your
            Shopify invoice. A 14-day free trial applies on first subscription
            only.
          </li>
          <li>
            <strong>Agency and Plus</strong> are direct-invoiced via
            Stripe under a separate order form.
          </li>
          <li>
            <strong>Concierge audits</strong> are one-off payments via Stripe.
          </li>
          <li>
            <strong>30-day refund.</strong> If you pay Flintmere directly and
            are not satisfied, email{' '}
            <a href="mailto:billing@flintmere.com" className="underline">
              billing@flintmere.com
            </a>{' '}
            within 30 days of your first payment for a full refund, no
            questions. Shopify-billed charges follow Shopify&rsquo;s refund
            process; we&rsquo;ll approve reasonable requests within the same
            window.
          </li>
          <li>
            Cancel any time. Paid-through access remains until the end of the
            billing period.
          </li>
          <li>
            Prices exclude VAT where applicable.
          </li>
        </ul>
      </Clause>

      <Clause n="05" heading="Acceptable use">
        <p>
          You agree not to:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            Submit URLs to the public scanner that you do not have a legitimate
            reason to analyse, or use the scanner to generate competitive
            intelligence at scale (we rate-limit and ban automated scraping).
          </li>
          <li>
            Reverse-engineer, decompile, or attempt to extract our scoring
            rubric or model prompts.
          </li>
          <li>
            Resell, sublicense, or white-label Flintmere output as your own
            scoring methodology without an Agency or Plus agreement.
          </li>
          <li>
            Use Flintmere to generate content that breaches Shopify&rsquo;s
            Acceptable Use Policy, local consumer protection law, or the
            honesty standards expected of retail advertising (UK ASA, FTC,
            etc.).
          </li>
          <li>
            Submit malware, probe for vulnerabilities outside a disclosed
            programme, or interfere with service availability.
          </li>
        </ul>
      </Clause>

      <Clause n="06" heading="Your data, your catalog">
        <p>
          You retain all rights to your Shopify product data, images, and
          copy. We process it only to provide the service. We do not train
          foundation models on your catalog. We do not share your catalog
          with other merchants. Our Privacy Policy explains retention and
          sub-processors in detail:{' '}
          <a href="/privacy" className="underline">flintmere.com/privacy</a>.
        </p>
        <p className="mt-4">
          Where we write back to your catalog (Growth tier and above), we do
          so only with the actions you approve. Every write is logged. You can
          roll back the last 30 days of changes from the app.
        </p>
      </Clause>

      <Clause n="07" heading="Our intellectual property">
        <p>
          Flintmere, the scanner, the scoring rubric, the fix prompts, and the
          Shopify app are and remain the property of Eazy Access Ltd. You get
          a non-exclusive, non-transferable, revocable licence to use them
          while your subscription is active. The amber bracket signature and
          the Flintmere name are unregistered trade marks of Eazy Access Ltd.
        </p>
      </Clause>

      <Clause n="08" heading="Beta features and changes">
        <p>
          Features marked <em>beta</em> or <em>preview</em> may change,
          regress, or be withdrawn without notice. We aim for 99.5% monthly
          uptime on production features but do not offer a contractual SLA
          below Plus.
        </p>
        <p className="mt-4">
          Material changes to these terms are emailed to Shopify app users at
          least 30 days in advance. Non-material changes (typos, clarifying
          language) are pushed without notice with the &ldquo;Last
          updated&rdquo; date refreshed.
        </p>
      </Clause>

      <Clause n="09" heading="Warranties and liability">
        <p>
          Flintmere is provided on an &ldquo;as is&rdquo; basis. We do not
          warrant that your score will improve by any specific amount or that
          any marketplace (Google, Amazon, Shopify Catalog) will accept your
          feed. Scores reflect current best-practice heuristics and will shift
          as specs evolve.
        </p>
        <p className="mt-4">
          Nothing in these terms limits liability for death or personal injury
          caused by our negligence, fraud, or anything else that cannot be
          limited by English law. Subject to that, our total aggregate
          liability to you in any 12-month period is capped at the fees you
          paid Flintmere in the preceding 12 months, or £100 if you only used
          the free scanner.
        </p>
        <p className="mt-4">
          We are not liable for loss of profit, loss of revenue, loss of
          goodwill, or any indirect or consequential loss.
        </p>
      </Clause>

      <Clause n="10" heading="Termination">
        <p>
          You may terminate any time by cancelling in-app or by email. We may
          suspend or terminate your account for material breach (see
          &ldquo;Acceptable use&rdquo;), non-payment after 14 days&rsquo;
          notice, or if required by law. On termination, your access ends
          immediately; data retention follows the Privacy Policy.
        </p>
      </Clause>

      <Clause n="11" heading="Governing law">
        <p>
          These terms are governed by the laws of England and Wales. The
          courts of England and Wales have exclusive jurisdiction, except
          that we may seek injunctive relief in any competent jurisdiction
          to protect our intellectual property.
        </p>
      </Clause>

      <Clause n="12" heading="Contact">
        <p>
          Billing:{' '}
          <a href="mailto:billing@flintmere.com" className="underline">
            billing@flintmere.com
          </a>
          . Legal:{' '}
          <a href="mailto:legal@flintmere.com" className="underline">
            legal@flintmere.com
          </a>
          . Security:{' '}
          <a href="mailto:security@flintmere.com" className="underline">
            security@flintmere.com
          </a>
          .
        </p>
      </Clause>
    </LegalShell>
  );
}
