'use client';

import { useEffect, useRef } from 'react';

/**
 * TurnstileWidget — Cloudflare Turnstile client component.
 *
 * Loads `https://challenges.cloudflare.com/turnstile/v0/api.js` once
 * per page (deduped by `<script>` tag presence) and renders the widget
 * via implicit auto-render. The widget injects a hidden
 * `cf-turnstile-response` input into the surrounding form on success;
 * the parent component reads it at submit time via the form ref.
 *
 * Why implicit render rather than an explicit `window.turnstile.render`
 * call: we want the widget to live alongside JSON-fetch forms (not
 * traditional form-POST), so the parent reads the token at submit by
 * querying the hidden input. This keeps the widget self-contained and
 * avoids leaking turnstile-specific globals into the form component.
 *
 * Graceful degradation: when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` isn't
 * set (local dev without secrets), the component renders nothing and
 * the form submits without a token. The server-side helper bypasses
 * verification in non-production when the matching secret is unset, so
 * the round-trip stays consistent.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: { sitekey: string; theme?: string },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js';

export interface TurnstileWidgetProps {
  /** Cloudflare theme token. Defaults to `light` to match the paper canon. */
  theme?: 'light' | 'dark' | 'auto';
  /** Optional class for layout positioning. */
  className?: string;
}

export function TurnstileWidget({
  theme = 'light',
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    if (document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)) return;
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`cf-turnstile ${className ?? ''}`.trim()}
      data-sitekey={siteKey}
      data-theme={theme}
    />
  );
}
