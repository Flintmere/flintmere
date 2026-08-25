'use client';

import { useState } from 'react';
import type { CitableDocument } from '@/lib/standards/citation-formats';
import { allCitationFormats } from '@/lib/standards/citation-formats';

/**
 * "Cite this page" — inline progressive disclosure.
 *
 * Per the binding IA §Per-page "Cite this page" affordance: expands inline,
 * NOT a modal. The IA's rationale is explicit — citation is part of the
 * reading flow for this audience, and a modal interrupts it.
 *
 * The only client component on the standards surface. Everything else
 * renders static so a scanner-side runtime failure can't take the
 * authority surface down with it.
 */
export function CiteThisPage({ doc }: { doc: CitableDocument }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const formats = allCitationFormats(doc);

  async function copy(style: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(style);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked (permissions, insecure context). The text is
      // already on screen and selectable — no fallback UI needed, and a
      // thrown error here would be worse than the no-op.
    }
  }

  return (
    <div style={{ marginTop: 'clamp(32px, 4vw, 56px)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="cite-formats"
        className="font-mono uppercase text-[color:var(--color-ink)]"
        style={{
          fontSize: '11px',
          letterSpacing: '0.16em',
          border: '1px solid var(--color-line)',
          background: 'transparent',
          padding: '12px 18px',
          cursor: 'pointer',
          minHeight: 44,
        }}
      >
        {open ? 'Hide citation formats' : 'Cite this page'}
      </button>

      {open && (
        <div
          id="cite-formats"
          style={{
            marginTop: 24,
            display: 'grid',
            gap: 20,
            maxWidth: '78ch',
          }}
        >
          {formats.map(({ style, label, text }) => (
            <div key={style}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 16,
                  marginBottom: 8,
                }}
              >
                <span
                  className="font-mono uppercase text-[color:var(--color-mute)]"
                  style={{ fontSize: '11px', letterSpacing: '0.16em' }}
                >
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => copy(style, text)}
                  className="font-mono text-[color:var(--color-ink-2)]"
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '10px 4px',
                    minHeight: 44,
                    minWidth: 44,
                    textAlign: 'right',
                  }}
                >
                  {copied === style ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre
                className="font-mono text-[color:var(--color-ink-2)]"
                style={{
                  fontSize: '13px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  padding: '14px 16px',
                  borderLeft: '1px solid var(--color-line)',
                }}
              >
                {text}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
