import type { Metadata } from 'next';
import { LegalShell, Clause } from '@/components/LegalShell';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Privacy — data, retention, deletion',
  description:
    'How Flintmere collects, uses, stores, and protects personal data. UK GDPR and UK DPA 2018 compliant — UK/EU hosting, 60-second token deletion on uninstall, in-browser encryption for one-time secrets.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return (
    <LegalShell
      eyebrow="Privacy"
      title="How we handle your data."
      summary="We collect only what we need to score and fix your product catalog. We do not sell data, ever. We host in the UK/EU, we delete tokens within 60 seconds of uninstall, our free one-time-secret tool at /secret encrypts in your browser so we never hold the key, and if you connect your Google Merchant Center we hold a single read-only refresh token encrypted at rest until you disconnect — full Limited Use attestation in clause 11. You can ask us to delete everything else at any time by sending a message via our contact form (Privacy topic)."
      lastUpdated="2026-05-10"
      anchorNumeral="01"
    >
      <Clause n="01" heading="Who we are">
        <p>
          Flintmere is a trading name of <strong>Eazy Access Ltd</strong>, a
          company registered in England and Wales (Companies House
          number <strong>13205428</strong>). Flintmere is the
          <em> data controller</em> for personal data you share with our
          website, the public scanner at <code>audit.flintmere.com</code>, and
          the Shopify app at <code>app.flintmere.com</code>.
        </p>
        <p className="mt-4">
          Questions, access requests, or complaints: send a message via our{' '}
          <a href="/contact?topic=privacy" className="underline">
            contact form
          </a>{' '}
          (Privacy topic). Accountable director: Abdur-Rahman Morris.
        </p>
      </Clause>

      <Clause n="02" heading="What data we collect">
        <p>We collect five categories of data:</p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Scanner input.</strong> The Shopify store URL you submit,
            the IP address that submitted it (for rate limiting and abuse
            prevention), and the public data we then fetch from that store
            (<code>/products.json</code>, sitemap, JSON-LD samples).
          </li>
          <li>
            <strong>Lead capture.</strong> If you submit your email for the
            full report, we store that email, the scan ID it relates to, and
            your stated consent flags. That&rsquo;s it — we do not ask for
            your name, company size, or phone number.
          </li>
          <li>
            <strong>Contact form messages.</strong> If you send us a message
            via the contact form, we store your name, email, message, optional
            company and Shopify domain, the topic you picked, and a SHA-256
            hash of your IP address (no raw IP) plus your user agent for abuse
            investigation. The IP-hash signal used to rate-limit the form
            itself lives only in process memory and is never written to disk.
          </li>
          <li>
            <strong>Shopify app data.</strong> If you install the Shopify app,
            we receive an OAuth access token, your shop domain, and —
            scope-limited to <code>read_products</code> and{' '}
            <code>write_products</code> — your product catalog, variants, and
            metafields. We do not request customer, order, or financial
            scopes.
          </li>
          <li>
            <strong>Google Merchant Center data (only if you connect).</strong>{' '}
            If you grant us read-only access to your Google Merchant Center
            via Google&rsquo;s OAuth flow, we receive a refresh token plus
            account-level and product-level diagnostic data: your GMC account
            ID, per-product disapproval status, the disapproval reasons
            Google has recorded, and aggregate destination counts. We do
            not request, receive, or store customer-level GMC data or
            financial reports, and we do not call any GMC method that writes
            to your account. Full treatment in clause 11.
          </li>
          <li>
            <strong>GMC pre-verification waiting list (only if you ask).</strong>{' '}
            While Google&rsquo;s Trust &amp; Safety review of our integration
            is still in flight, the connect surface offers a request-access
            form instead of starting the OAuth flow. If you submit, we store
            your email, the read reference that brought you to the page, your shop
            URL, and any optional message you leave. We use this only to
            email you when access opens. Full treatment in clause 11.
          </li>
        </ul>
        <p className="mt-4">
          We <strong>do not</strong> collect special-category data, children&rsquo;s
          data, or payment card data (Stripe handles payment data directly; we
          only see the payment reference).
        </p>
      </Clause>

      <Clause n="03" heading="Lawful basis under UK GDPR">
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Scanner (public fetch + results display):</strong>{' '}
            legitimate interest — you actively entered a URL to have it
            analysed.
          </li>
          <li>
            <strong>Lead capture emails:</strong> consent — you tick the
            box before we send the report.
          </li>
          <li>
            <strong>Contact form messages:</strong> legitimate interest — you
            sent us a message asking for a reply, so we have a clear basis to
            handle it. Where the message becomes a continuing conversation,
            performance of pre-contractual or contractual steps applies.
          </li>
          <li>
            <strong>Shopify app:</strong> contract performance — we cannot
            deliver the service you installed without processing the catalog
            data.
          </li>
          <li>
            <strong>Google Merchant Center integration:</strong> consent —
            your OAuth grant via Google&rsquo;s consent screen is the lawful
            basis. You can revoke at any time and we honour the revoke
            within seconds (clause 11).
          </li>
          <li>
            <strong>Sub-processor sharing:</strong> necessary for performance
            of the contract above.
          </li>
        </ul>
      </Clause>

      <Clause n="04" heading="How long we keep it">
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Scanner results:</strong> 90 days, then deleted.
          </li>
          <li>
            <strong>Email leads:</strong> until you unsubscribe (one-click RFC
            8058 in every report email), then purged within 30 days.
          </li>
          <li>
            <strong>Contact form messages:</strong> kept while the conversation
            is open. Resolved threads (responded, archived, or marked spam)
            are retained for up to 24 months from last contact, then hard-
            deleted by a daily scheduled job. Open threads (new or
            acknowledged) are not purged on a schedule — those still need a
            reply. The IP-hash and user-agent on each row are deleted with
            the row. Right to erasure (clause 09) applies — request deletion
            at any time and we honour it within 30 days.
          </li>
          <li>
            <strong>Shopify access token:</strong> scrubbed within 60 seconds
            of the <code>app/uninstalled</code> webhook.
          </li>
          <li>
            <strong>Shopify catalog snapshot + scores:</strong> 30-day grace
            window after uninstall (so a reinstall is seamless), then fully
            purged.
          </li>
          <li>
            <strong>Google Merchant Center refresh token:</strong> kept until
            you disconnect (or Google revokes access on your behalf), then
            zeroed at rest within seconds and the row purged within 30 days
            for audit-trail purposes.
          </li>
          <li>
            <strong>Google Merchant Center diagnostic data:</strong> joins
            your scan record under the same 90-day retention as scanner
            results; deleted on the same schedule.
          </li>
          <li>
            <strong>GMC pre-verification waiting-list entries:</strong> kept
            until we send the access-opens notification, then deleted within
            30 days. Maximum lifetime 12 months from creation regardless of
            notification status. Right to erasure (clause 09) applies — ask
            via the contact form (Privacy topic) and we honour within 30
            days.
          </li>
          <li>
            <strong>Stripe concierge read records:</strong> kept for 7 years
            (HMRC requirement for invoices).
          </li>
          <li>
            <strong>Server logs:</strong> 90 days hot, then archived to cold
            storage for up to 13 months for fraud and abuse investigations.
          </li>
        </ul>
        <p className="mt-6">
          The retention windows above are enforced automatically. A scheduled
          job runs daily at <code>/api/cron/retention-sweep</code> and deletes
          any rows past their retention window. Deletion is hard delete, not
          soft delete — once a row is past its window, it is gone from the
          database in the next sweep.
        </p>
      </Clause>

      <Clause n="05" heading="Who we share it with (sub-processors)">
        <p>
          We use the following processors. Each is bound by a written data
          processing agreement. None receive more data than required.
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Google Vertex AI</strong> (europe-west1) — LLM inference
            for Tier 2 enrichments.
          </li>
          <li>
            <strong>OpenAI, OpenAI Ireland Operations Limited</strong> (US
            routing) &mdash; LLM fallback when Vertex AI errors. Project-scoped
            key, <code>store: false</code> on every request to suppress
            application-state retention. OpenAI&rsquo;s separate
            abuse-monitoring retention (up to 30 days) applies; we do not have
            a Zero Data Retention amendment on this account tier. Triggered
            on &lt;1% of LLM calls. Per ADR 0010.
          </li>
          <li>
            <strong>Resend</strong> (EU) — transactional email (report
            delivery, app alerts).
          </li>
          <li>
            <strong>Stripe</strong> (UK/Ireland) — payment processing for
            concierge reads, Agency, and Plus tiers. Stripe receives the
            billing email, the shop URL (so it appears on the invoice), the
            read band purchased, and an internal payment-intent reference.
            We do not pass Shopify access tokens, GMC tokens, catalog data,
            or scan results to Stripe. Card data is collected in the Stripe
            Payment Element iframe and never touches our servers.
          </li>
          <li>
            <strong>Sentry</strong> (EU) — error tracking. PII scrubbed at
            source.
          </li>
          <li>
            <strong>PostHog</strong> (PostHog, Inc., US — data hosted in the EU,
            AWS Frankfurt) — product analytics and session replay, configured
            cookieless. No advertising profile, no cross-site tracking. Processing
            is covered by PostHog&apos;s Data Processing Agreement. Per ADR 0025.
          </li>
          <li>
            <strong>BetterStack</strong> (EU) — uptime monitoring (no user
            data).
          </li>
          <li>
            <strong>Digital Ocean</strong> (UK) + <strong>Coolify</strong> —
            infrastructure.
          </li>
          <li>
            <strong>GS1 GEPIR</strong> (optional, rate-limited) — GTIN
            verification.
          </li>
        </ul>
        <p className="mt-4">
          We use session replay on our public sites to understand usability
          problems and debug reported issues. Recordings capture page
          interactions (clicks, scrolling, navigation); all keyboard input is
          masked before it leaves your browser and is never visible to us.
          Recordings carry no persistent identifier and are retained on
          PostHog&apos;s EU infrastructure for a limited period before automatic
          deletion. Lawful basis: legitimate interest (service improvement).
        </p>
      </Clause>

      <Clause n="06" heading="International transfers">
        <p>
          Most processing is within the UK/EU (including our Vertex AI region
          pin to <code>europe-west1</code>). Any transfer outside the UK/EEA
          happens only under an adequacy decision or Standard Contractual
          Clauses (SCCs) as published by the European Commission, supplemented
          where required. We do not transfer data to countries without
          adequate safeguards.
        </p>
      </Clause>

      <Clause n="07" heading="Your rights">
        <p>Under UK GDPR you have the right to:</p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>Ask what we hold about you (subject access request)</li>
          <li>Have inaccurate data corrected</li>
          <li>Have your data deleted (right to be forgotten)</li>
          <li>Restrict or object to our processing</li>
          <li>Receive your data in a machine-readable format (portability)</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p className="mt-4">
          Send a message via our{' '}
          <a href="/contact?topic=privacy" className="underline">contact form</a>{' '}
          (Privacy topic). We respond within 30 days and usually within three working days.
        </p>
        <p className="mt-4">
          Eazy Access Ltd is registered with the Information
          Commissioner&rsquo;s Office (ICO) as a data controller — registration
          number <strong>ZC137268</strong> (issued 2026-05-06).
        </p>
        <p className="mt-4">
          If you&rsquo;re not satisfied with our response you can complain to
          the ICO:{' '}
          <a href="https://ico.org.uk/make-a-complaint/" className="underline">
            ico.org.uk/make-a-complaint
          </a>.
        </p>
      </Clause>

      <Clause n="08" heading="Security">
        <p>
          Shopify access tokens and Google Merchant Center refresh tokens
          are encrypted at rest with AES-256-GCM, each under a separate
          environment-held key isolated from the other (a compromise of one
          key does not expose the other). All webhooks are HMAC-verified.
          All traffic uses TLS 1.2 or higher. We run regular dependency
          scans and follow a documented incident-response procedure. Full
          details:{' '}
          <a href="/security" className="underline">flintmere.com/security</a>.
        </p>
      </Clause>

      <Clause n="09" heading="Cookies">
        <p>
          We use one functional cookie on <code>audit.flintmere.com</code> for
          CSRF protection. We do not use tracking, analytics, or advertising
          cookies on the marketing site. Full details:{' '}
          <a href="/cookies" className="underline">flintmere.com/cookies</a>.
        </p>
      </Clause>

      <Clause n="10" heading="One-time-secret service">
        <p>
          We operate a free one-time-secret tool at{' '}
          <code>flintmere.com/secret</code> for transferring sensitive
          values from sender to recipient through a single-use URL. We
          built it originally for handing read-only Shopify Admin API
          tokens to the read team during concierge fulfilment, and it
          stayed nice enough to publish — anyone can use it for any
          one-shot secret transfer between consenting parties. The flow
          is <strong>zero-knowledge by design</strong>:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            Encryption happens in your browser before anything leaves
            your device. We use AES-256-GCM via the Web Crypto API.
          </li>
          <li>
            The decryption key sits in the URL fragment (the part after{' '}
            <code>#</code>), which by RFC 3986 §3.5 is never sent to our
            servers. We hold the ciphertext only and have no way to
            decrypt past secrets, even with full database access.
          </li>
          <li>
            <strong>Retention:</strong> each secret burns on first read
            (atomic claim — only one viewer wins) or expires 24 hours
            after creation, whichever comes first. After consumption or
            expiry, only an opaque ID and timestamps remain in the
            database for ~30 days for abuse investigation, never the
            ciphertext.
          </li>
          <li>
            <strong>What we log:</strong> a SHA-256 hash of the IP
            address that created the secret (for rate limiting), and the
            consumption timestamp. Never the secret content; we cannot
            log what we cannot read.
          </li>
        </ul>
        <p className="mt-4">
          Acceptable-use rules — what the tool is for, and what gets you
          banned — live in our{' '}
          <a href="/terms" className="underline">Terms</a> (clause 05).
        </p>
      </Clause>

      <Clause n="11" heading="Google Merchant Center integration">
        <p>
          If you choose to connect your Google Merchant Center (GMC) account
          to us, we receive read-only diagnostic data about your product
          feed directly from Google. This integration is optional, granted
          by you through Google&rsquo;s standard OAuth consent screen, and
          revocable at any time.
        </p>
        <p className="mt-4">
          <strong>Pre-verification waiting list.</strong> Until Google&rsquo;s
          verification of our integration completes and the connect flow
          opens, the connect surface captures expressions of interest
          instead of starting the OAuth flow. If you submit your details there, we
          store your email, the read reference that brought you to the page, your
          shop URL, and any optional message you leave. We use this only to
          write to you the day access opens — at most a single email, after
          which the row&rsquo;s purpose is fulfilled. You can ask us to
          delete your row at any time via the contact form (Privacy topic);
          retention details in clause 04.
        </p>
        <p className="mt-4">
          <strong>Scope.</strong> We request a single OAuth scope:{' '}
          <code>https://www.googleapis.com/auth/content</code> — the scope
          Google&rsquo;s Merchant API uses. We restrict our use to read-only
          API methods: <code>accounts.list</code> and{' '}
          <code>products.list</code>. We do not call any
          method that writes to your GMC account, products, settings, or
          feeds. Google does not currently publish a separate read-only
          variant of this scope; the read-only commitment is enforced at
          our call-site.
        </p>
        <p className="mt-4">
          <strong>Data we receive.</strong> Your GMC account ID, per-product
          status (approved / disapproved / pending), the human-readable
          disapproval reasons Google records against each product, and
          aggregate counts. We do not receive customer data, order data,
          financial reports, or any data Google holds about your buyers.
        </p>
        <p className="mt-4">
          <strong>How we use it.</strong> Strictly to produce your read
          deliverable — the report we hand back to you with the issues we
          found and the fixes we recommend. Google&rsquo;s ground-truth
          replaces our modelled estimates where we have it, so you get a
          sharper diagnostic.
        </p>
        <p className="mt-4">
          <strong>Storage.</strong> Your refresh token is encrypted at rest
          using AES-256-GCM with a key held outside the database. Access
          tokens are never written to disk — they are rotated on demand
          from the refresh token and held only in process memory. The
          diagnostic data Google returns joins your scan record under the
          same retention as your other scan results.
        </p>
        <p className="mt-4">
          <strong>Limited Use compliance.</strong> Our use of information
          received from Google APIs adheres to Google API Services User
          Data Policy, including the Limited Use requirements:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            We do not allow humans to read GMC data except (a) with your
            specific consent, (b) for security purposes such as
            investigating abuse, (c) when required by law, or (d) when
            the data has been aggregated and anonymised for product
            improvement.
          </li>
          <li>
            We do not transfer GMC data to others except as necessary to
            provide or improve the read, and only under written contract
            with the same Limited Use commitments.
          </li>
          <li>
            We do not use GMC data for advertising, including retargeting,
            personalised advertising, or interest-based advertising.
          </li>
          <li>
            We do not sell GMC data to anyone, ever, under any
            circumstance.
          </li>
        </ul>
        <p className="mt-4">
          <strong>Your control.</strong> You can disconnect at any time —
          either from your Flintmere dashboard or directly from your
          Google Account at{' '}
          <a
            href="https://myaccount.google.com/permissions"
            className="underline"
          >
            myaccount.google.com/permissions
          </a>
          . When you disconnect, we revoke the token at Google, zero the
          stored ciphertext within seconds, and purge the row within 30
          days. The diagnostic data Google previously returned to us
          continues under its existing 90-day scan retention, or earlier
          if you exercise your right to erasure (clause 07).
        </p>
        <p className="mt-4">
          <strong>Sub-processing.</strong> Google is the upstream source of
          this data, not our sub-processor — you authorise the data flow
          directly via OAuth. The diagnostic data we receive flows through
          the same UK/EU infrastructure listed in clause 05; no additional
          third party sees it.
        </p>
      </Clause>

      <Clause n="12" heading="Changes to this policy">
        <p>
          If we make material changes, we&rsquo;ll email Shopify app users 30
          days in advance and update the &ldquo;Last updated&rdquo; date at
          the top of this page. Non-material corrections (typos, clarifying
          language) are pushed without notice but always reflected in the
          date.
        </p>
      </Clause>
    </LegalShell>
  );
}
