'use client';

/**
 * Error state shown when a scan fails. role="alert" so AT users hear the
 * failure immediately.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 (refactor
 * for the 600-line ceiling).
 */

export function ErrorBlock({ message }: { message: string }) {
  return (
    <section
      role="alert"
      className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]"
    >
      <p className="eyebrow mb-4" style={{ color: 'var(--color-alert)' }}>
        Scan failed
      </p>
      <p style={{ fontSize: 19, lineHeight: 1.5 }}>{message}</p>
    </section>
  );
}
