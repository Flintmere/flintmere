'use client';

/**
 * Loading state shown while a scan is in flight. aria-live="polite" so AT
 * users get the status update without interruption.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 (refactor
 * for the 600-line ceiling).
 */

export function ScanningOverlay({ url }: { url: string }) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]"
    >
      <p className="eyebrow mb-4">Scanning</p>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--color-ink-2)',
        }}
      >
        Fetching {url} · this takes 10–55s depending on catalog size
      </p>
    </section>
  );
}
