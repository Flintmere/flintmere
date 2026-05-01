'use client';

import { useState } from 'react';
import { track } from '@/lib/plausible';

export interface ScanFormProps {
  initialUrl?: string;
  onSubmit: (url: string) => void;
  isSubmitting?: boolean;
}

export function ScanForm({
  initialUrl = '',
  onSubmit,
  isSubmitting = false,
}: ScanFormProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Enter a Shopify store URL.');
      return;
    }
    setError(null);
    track('scan_started', { domain: trimmed, hero_variant: 'dead_inventory_v1' });
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Scan a Shopify store" className="w-full max-w-2xl">
      <label htmlFor="scan-url" className="eyebrow block mb-3">
        Store URL
      </label>
      <div
        className="scan-form__slab flex items-stretch bg-[color:var(--color-paper)]"
        style={{
          border: '2px solid var(--color-ink)',
          boxShadow: 'var(--shadow-paper-1)',
          transition: 'box-shadow 240ms cubic-bezier(0.4, 0, 0.2, 1)',
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
          className="flex-1 bg-transparent outline-none placeholder:text-[color:var(--color-mute-2)]"
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
          className="btn btn-accent"
          style={{
            minWidth: 184,
            borderLeft: '2px solid var(--color-ink)',
            fontSize: 13,
            letterSpacing: '0.08em',
          }}
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
    </form>
  );
}
