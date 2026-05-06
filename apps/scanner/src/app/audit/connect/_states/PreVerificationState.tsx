import { HeroSection, HeroBracketShimmer } from '../_shared/HeroSection';
import { RequestAccessForm } from '../RequestAccessForm';

// State A — pre-verification (FEATURE_GMC_OAUTH=false).
// The merchant clicks the link from their audit-delivery email while
// Google's Trust & Safety review is still in flight. We capture interest
// in scanner_gmc_access_requests and notify when access opens.

export function PreVerificationHero() {
  return (
    <HeroSection
      eyebrow="Awaiting Google verification"
      heading={
        <>
          Direct from your{' '}
          <HeroBracketShimmer>Merchant Center</HeroBracketShimmer>.
        </>
      }
      body={
        <>
          We&rsquo;re in Google&rsquo;s Trust &amp; Safety review &mdash;
          typical wait is four to six weeks. Leave your details below and
          we&rsquo;ll write the day access opens. Your audit doesn&rsquo;t
          change in the meantime.
        </>
      }
    />
  );
}

export function PreVerificationBody({
  auditId,
  defaultEmail,
  shopUrl,
}: {
  auditId: string;
  defaultEmail: string;
  shopUrl: string;
}) {
  return (
    <RequestAccessForm
      auditId={auditId}
      defaultEmail={defaultEmail}
      shopUrl={shopUrl}
    />
  );
}
