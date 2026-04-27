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
      <div className="flex items-stretch border border-[color:var(--color-ink)] bg-[color:var(--color-paper)]">
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
          className="flex-1 px-5 py-4 bg-transparent outline-none placeholder:text-[color:var(--color-mute-2)]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 14 }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-accent border-l border-[color:var(--color-ink)]"
          style={{ minWidth: 160 }}
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
