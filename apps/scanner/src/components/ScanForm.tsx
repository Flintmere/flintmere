'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/plausible';
import { Honeypot, type HoneypotHandle } from '@/components/Honeypot';
import { TurnstileWidget } from '@/components/TurnstileWidget';

export interface ScanFormProps {
  initialUrl?: string;
  onSubmit: (
    url: string,
    turnstileToken: string,
    antiBot: { website: string; dwellMs: number },
  ) => void;
  isSubmitting?: boolean;
}

export function ScanForm({
  initialUrl = '',
  onSubmit,
  isSubmitting = false,
}: ScanFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const honeypotRef = useRef<HoneypotHandle | null>(null);
  // Reset the Turnstile widget after each scan finishes so the next scan
  // doesn't reuse a spent token. Increment on the submitting → idle
  // transition (covers both success and error paths).
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const wasSubmittingRef = useRef(false);
  useEffect(() => {
    if (wasSubmittingRef.current && !isSubmitting) {
      setTurnstileResetSignal((n) => n + 1);
    }
    wasSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Enter a Shopify store URL.');
      return;
    }
    setError(null);
    const turnstileInput = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="cf-turnstile-response"]',
    );
    const antiBot = honeypotRef.current?.getValues() ?? {
      website: '',
      dwellMs: 0,
    };
    track('scan_started', { domain: trimmed, hero_variant: 'dead_inventory_v1' });
    onSubmit(trimmed, turnstileInput?.value ?? '', antiBot);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} aria-label="Scan a Shopify store" className="w-full max-w-2xl">
      <label htmlFor="scan-url" className="eyebrow block mb-3">
        Store URL
      </label>
      <div
        className="scan-form__slab flex flex-col sm:flex-row items-stretch bg-[color:var(--color-paper)]"
        style={{
          border: '2px solid var(--color-ink)',
          boxShadow: 'var(--shadow-paper-1)',
          transition: 'box-shadow var(--duration-short) var(--ease-sharp)',
        }}
      >
        <input
          id="scan-url"
          type="text"
          inputMode="url"
          placeholder="your-store.myshopify.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isSubmitting}
          aria-describedby={error ? 'scan-url-error' : undefined}
          aria-invalid={error ? 'true' : undefined}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-[color:var(--color-mute-2)]"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            fontWeight: 500,
            padding: '20px 22px',
          }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="scan-form__submit btn btn-accent justify-center"
          style={{ fontSize: 13 }}
        >
          {isSubmitting ? 'Scanning…' : 'Scan my store →'}
        </button>
      </div>
      {error ? (
        <p
          id="scan-url-error"
          role="alert"
          className="mt-3 text-[13px]"
          style={{ color: 'var(--color-alert)' }}
        >
          {error}
        </p>
      ) : (
        <p
          className="mt-3 text-[11px]"
          style={{
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-mute)',
          }}
        >
          Takes 60 seconds · No signup to start · Works on any public Shopify store
        </p>
      )}
      <Honeypot ref={honeypotRef} />
      <div style={{ marginTop: 16 }}>
        <TurnstileWidget resetSignal={turnstileResetSignal} />
      </div>
    </form>
  );
}
