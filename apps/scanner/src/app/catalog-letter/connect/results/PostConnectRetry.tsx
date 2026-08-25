'use client';

/**
 * Retriable state for the post-connect payoff (connect-friction spec
 * 2026-06-07, fix 1 edge case). When the auto-scan fails, the merchant must
 * see a Retry control — never a silent blank. Retry re-runs the server
 * component (router.refresh), which re-attempts resolvePostConnectScan.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface PostConnectRetryProps {
  auditId: string;
  errorCode: string;
}

function messageFor(code: string): string {
  switch (code) {
    case 'not-shopify':
      return "We couldn't reach a public Shopify catalog for your store.";
    case 'timeout':
      return 'Your store took too long to respond.';
    case 'empty-catalog':
      return 'Your store is reachable but has no public products right now.';
    default:
      return "We couldn't finish reading your store on this attempt.";
  }
}

export function PostConnectRetry({ auditId, errorCode }: PostConnectRetryProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  const retry = () => {
    setRetrying(true);
    router.refresh();
    // router.refresh re-renders the server component; reset the local flag
    // shortly after so the button is usable again if it fails twice.
    setTimeout(() => setRetrying(false), 4000);
  };

  return (
    <section
      aria-label="Scan could not complete"
      className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-24 md:py-28"
    >
      <p className="eyebrow text-[color:var(--color-ink-2)] mb-8">
        Connected · scan didn&rsquo;t complete
      </p>
      <h1 className="max-w-[22ch]">
        Your Merchant Center is connected. The scan didn&rsquo;t finish.
      </h1>
      <p
        className="mt-8 max-w-[56ch] text-[color:var(--color-ink-2)]"
        style={{ fontSize: 18, lineHeight: 1.5 }}
      >
        {messageFor(errorCode)} Your connection is saved &mdash; try the scan
        again, or reply to your catalog letter email and we&rsquo;ll run it for you.
      </p>
      <div className="mt-10 flex gap-4 flex-wrap" style={{ alignItems: 'center' }}>
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          aria-busy={retrying}
          className="btn btn-accent"
        >
          {retrying ? 'Retrying…' : 'Try the scan again →'}
        </button>
        <a
          href={`/catalog-letter/connect?audit=${encodeURIComponent(auditId)}`}
          className="btn"
        >
          Back to connection
        </a>
      </div>
    </section>
  );
}
