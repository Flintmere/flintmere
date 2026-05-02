import type { ReactNode } from 'react';

/**
 * Small page-local primitives used by /methodology. Pulled out of page.tsx
 * to keep the page under the 600-line ceiling and to make the composition
 * shape obvious at a glance.
 */

interface HeroStatProps {
  label: string;
  value: string;
  suffix: string;
}

export function HeroStat({ label, value, suffix }: HeroStatProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt
        className="font-mono uppercase text-[color:var(--color-mute-2)]"
        style={{ fontSize: 11, letterSpacing: '0.16em' }}
      >
        {label}
      </dt>
      <dd
        className="font-mono font-medium text-[color:var(--color-ink)] leading-none"
        style={{
          fontSize: 'clamp(36px, 4.5vw, 64px)',
          letterSpacing: '-0.04em',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 700,
        }}
      >
        {value}
        <span style={{ color: 'var(--color-mute)', fontWeight: 400 }}>{suffix}</span>
      </dd>
    </div>
  );
}

interface StatusCellProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function StatusCell({ label, value, mono }: StatusCellProps) {
  return (
    <div>
      <p
        className="font-mono uppercase text-[color:var(--color-mute-2)]"
        style={{ fontSize: 11, letterSpacing: '0.16em', marginBottom: 6 }}
      >
        {label}
      </p>
      <p
        className={mono ? 'font-mono text-[color:var(--color-ink)]' : 'text-[color:var(--color-ink)]'}
        style={{ fontSize: 18, fontWeight: 500 }}
      >
        {value}
      </p>
    </div>
  );
}

interface CadenceRowProps {
  label: string;
  body: ReactNode;
}

export function CadenceRow({ label, body }: CadenceRowProps) {
  return (
    <>
      <dt
        className="font-mono uppercase text-[color:var(--color-mute-2)]"
        style={{ fontSize: 11, letterSpacing: '0.16em', alignSelf: 'start' }}
      >
        {label}
      </dt>
      <dd
        className="text-[color:var(--color-ink-2)]"
        style={{ fontSize: 16, lineHeight: 1.7 }}
      >
        {body}
      </dd>
    </>
  );
}

export function DashLi({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" style={{ color: 'var(--color-mute-2)' }}>&mdash;</span>
      <span>{children}</span>
    </li>
  );
}
