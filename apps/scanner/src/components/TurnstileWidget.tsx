'use client';

import { useEffect, useRef } from 'react';

/**
 * TurnstileWidget — Cloudflare Turnstile, explicit-render pattern.
 *
 * Uses the canonical SPA pattern from Cloudflare's docs:
 *
 *   1. Load `…/turnstile/v0/api.js?render=explicit&onload=__flintmereTurnstileReady`.
 *   2. Define `window.__flintmereTurnstileReady` before the script lands.
 *   3. Inside that global, call `turnstile.render(container, opts)` and
 *      keep the returned widget id.
 *   4. In the success callback, write the token to a hidden
 *      `cf-turnstile-response` input inside our own container so the
 *      existing parent-side `querySelector('input[name="cf-turnstile-response"]')`
 *      lookups (CheckoutCard, ScanForm, ContactForm) continue to work
 *      with zero contract change.
 *   5. On unmount, `turnstile.remove(widgetId)` so React strict-mode
 *      double-mounts and route changes don't pile up dead iframes.
 *
 * Why explicit over implicit: implicit auto-scan only fires once on
 * initial DOM load; in a Next.js client-component that mounts after
 * hydration, the scan can miss the `cf-turnstile` div, the widget
 * never renders, and every checkout 403s with `missing-token`.
 * Caught 2026-05-05 — operator hit exactly this on a live audit
 * checkout. Explicit render with `?onload=` callback is the docs-
 * recommended pattern for SPAs and gives us error/expired callbacks
 * that the implicit form silently swallowed.
 *
 * Hidden-input note: in implicit mode Cloudflare auto-injects the
 * `cf-turnstile-response` hidden input. In explicit mode it does
 * NOT — we manage the input manually inside the success/error/
 * expired callbacks.
 *
 * Graceful degradation: when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` isn't
 * set, the component renders nothing and the form submits without a
 * token. The server-side helper bypasses verification in non-
 * production when the matching secret is unset, so the round-trip
 * stays consistent for local dev. CheckoutCard's pre-flight guard
 * blocks empty-token submits in production.
 */

declare global {
  interface Window {
    turnstile?: {
      ready: (cb: () => void) => void;
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          appearance?: 'always' | 'execute' | 'interaction-only';
          callback?: (token: string) => void;
          'error-callback'?: (errorCode: string) => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    __flintmereTurnstileReady?: () => void;
    __flintmereTurnstileLoaded?: boolean;
    __flintmereTurnstilePending?: Set<() => void>;
  }
}

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__flintmereTurnstileReady';

const TOKEN_INPUT_NAME = 'cf-turnstile-response';

export interface TurnstileWidgetProps {
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export function TurnstileWidget({
  theme = 'light',
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const renderedRef = useRef(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;
    if (renderedRef.current) return;
    renderedRef.current = true;

    const writeToken = (token: string) => {
      let input = container.querySelector<HTMLInputElement>(
        `input[name="${TOKEN_INPUT_NAME}"]`,
      );
      if (!input) {
        input = document.createElement('input');
        input.type = 'hidden';
        input.name = TOKEN_INPUT_NAME;
        container.appendChild(input);
      }
      input.value = token;
    };

    const clearToken = () => {
      const input = container.querySelector<HTMLInputElement>(
        `input[name="${TOKEN_INPUT_NAME}"]`,
      );
      if (input) input.value = '';
    };

    const renderWidget = () => {
      if (!window.turnstile) return;
      if (widgetIdRef.current) return;
      try {
        const id = window.turnstile.render(container, {
          sitekey: siteKey,
          theme,
          appearance: 'always',
          callback: (token) => writeToken(token),
          'error-callback': (errorCode) => {
            // eslint-disable-next-line no-console
            console.warn(
              JSON.stringify({
                event: 'turnstile-error',
                code: errorCode,
              }),
            );
            clearToken();
          },
          'expired-callback': () => {
            clearToken();
            if (widgetIdRef.current) {
              window.turnstile?.reset(widgetIdRef.current);
            }
          },
          'timeout-callback': () => {
            clearToken();
            if (widgetIdRef.current) {
              window.turnstile?.reset(widgetIdRef.current);
            }
          },
        });
        widgetIdRef.current = id;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          JSON.stringify({
            event: 'turnstile-render-failed',
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
    };

    // The `?onload=__flintmereTurnstileReady` query param tells the
    // Turnstile API to call this global once it's ready. Multiple
    // widget instances on the same page share the queue via the
    // `__flintmereTurnstilePending` set so a second instance mounted
    // after script-load still gets a render call.
    if (!window.__flintmereTurnstilePending) {
      window.__flintmereTurnstilePending = new Set();
    }
    window.__flintmereTurnstilePending.add(renderWidget);

    if (!window.__flintmereTurnstileReady) {
      window.__flintmereTurnstileReady = () => {
        window.__flintmereTurnstileLoaded = true;
        const queue = window.__flintmereTurnstilePending;
        if (!queue) return;
        queue.forEach((fn) => fn());
        queue.clear();
      };
    }

    if (window.__flintmereTurnstileLoaded && window.turnstile) {
      // API already up — render now and clear from the queue.
      renderWidget();
      window.__flintmereTurnstilePending?.delete(renderWidget);
    } else if (
      !document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)
    ) {
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      window.__flintmereTurnstilePending?.delete(renderWidget);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // remove() throws if the widget was already removed; ignore.
        }
        widgetIdRef.current = null;
      }
      renderedRef.current = false;
    };
  }, [siteKey, theme]);

  if (!siteKey) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      data-flintmere-turnstile=""
    />
  );
}
