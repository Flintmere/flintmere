'use client';

import { useEffect, useRef, useState } from 'react';
import type { Pillar } from '@/lib/methodology-data';

/**
 * PillarTreemap — chapter cover for the seven-pillars section.
 *
 * Mechanic: pinned scroll-driven state (canonical scroll choreography #4).
 * The treemap pins to the top of the viewport as you scroll the pillar
 * chapter; an IntersectionObserver tracks which pillar spread is currently
 * in view, and the matching tile lights up amber. The data viz is the
 * navigation, and the navigation responds to position. This is the page's
 * signature move per the design-extravagant pre-flight (binding 2026-04-28).
 *
 * Why a treemap and not a list: the pillars sum to 100 across seven weighted
 * slices (20/20/15/15/15/10/5). That's structural geometry, and per the
 * extravagant-mode rule (saved memory: "extravagant means non-linear, not
 * just bigger type") the right move is to render the data AS the design —
 * pillar weights become surface area you see, not numbers in a column.
 *
 * References: Hodinkee Reference Points (chapter cadence, ONE decorative
 * anchor per chapter), Bloomberg Businessweek covers (oversized index
 * numerals as load-bearing decoration), The Pudding (data IS the
 * typography).
 *
 * Reduced-motion contract: the soft `prefers-reduced-motion: reduce` block
 * in globals.css disables transitions; the active-tile highlight still
 * applies (it's a state change, not an animation), so the choreography
 * degrades to "the active tile is highlighted, no transition" — the
 * meaning survives the motion strip.
 */

interface PillarTreemapProps {
  pillars: Pillar[];
}

export function PillarTreemap({ pillars }: PillarTreemapProps) {
  const [activeId, setActiveId] = useState<string | null>(pillars[0]?.id ?? null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof IntersectionObserver === 'undefined') return;

    // Watching the spread sections themselves — the in-page pillar chapter
    // headings have id="pillar-<id>". Trigger when the spread crosses the
    // top third of the viewport so the active tile updates as the eye is
    // reading the corresponding spread, not lagging behind.
    const targets = pillars
      .map((p) => document.getElementById(`pillar-${p.id}`))
      .filter((el): el is HTMLElement => el !== null);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Pick the entry whose top is closest to (but past) the trigger
        // line. We sort by intersectionRatio descending so the most-visible
        // spread wins on a tie.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0 && visible[0]) {
          const id = visible[0].target.id.replace('pillar-', '');
          setActiveId(id);
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const t of targets) observerRef.current.observe(t);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [pillars]);

  // Split: top row = first four (highest weights), bottom = remaining three.
  const top = pillars.slice(0, 4);
  const bottom = pillars.slice(4);
  const topWeight = top.reduce((s, p) => s + p.weight, 0);
  const bottomWeight = bottom.reduce((s, p) => s + p.weight, 0);
  const total = topWeight + bottomWeight;

  return (
    <div
      role="img"
      aria-label="Treemap of the seven pillars sized in proportion to their weight in the composite score. The active tile reflects which pillar spread is currently in view."
    >
      <div
        aria-hidden="true"
        className="methodology-treemap-frame border border-[color:var(--color-line)] overflow-hidden flex flex-col"
        style={{
          // Wide ribbon, not a chapter-takeover. When pinned at the top of
          // the viewport, the treemap must coexist with the spread content
          // below it — not eclipse the whole screen.
          aspectRatio: '16 / 4',
          maxHeight: 'min(320px, 38vh)',
          background: 'var(--color-paper)',
        }}
      >
        <TreemapRow
          tiles={top}
          flexBasisPct={(topWeight / total) * 100}
          activeId={activeId}
          isTop
        />
        <TreemapRow
          tiles={bottom}
          flexBasisPct={(bottomWeight / total) * 100}
          activeId={activeId}
          isTop={false}
        />
      </div>

      <table className="sr-only">
        <caption>The seven pillars and their weights.</caption>
        <thead>
          <tr>
            <th scope="col">Pillar</th>
            <th scope="col">Weight</th>
            <th scope="col">Install gated</th>
          </tr>
        </thead>
        <tbody>
          {pillars.map((p) => (
            <tr key={p.id}>
              <th scope="row">{p.name}</th>
              <td>{p.weight}%</td>
              <td>{p.installGated ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TreemapRowProps {
  tiles: Pillar[];
  flexBasisPct: number;
  activeId: string | null;
  isTop: boolean;
}

function TreemapRow({ tiles, flexBasisPct, activeId, isTop }: TreemapRowProps) {
  return (
    <div
      className="flex"
      style={{
        flexBasis: `${flexBasisPct}%`,
        borderTop: isTop ? 'none' : '1px solid var(--color-line)',
      }}
    >
      {tiles.map((p, i) => (
        <TreemapTile
          key={p.id}
          pillar={p}
          isFirstInRow={i === 0}
          isActive={activeId === p.id}
        />
      ))}
    </div>
  );
}

interface TreemapTileProps {
  pillar: Pillar;
  isFirstInRow: boolean;
  isActive: boolean;
}

function TreemapTile({ pillar, isFirstInRow, isActive }: TreemapTileProps) {
  return (
    <a
      href={`#pillar-${pillar.id}`}
      data-active={isActive ? 'true' : 'false'}
      className="group relative flex flex-col justify-between overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]"
      style={{
        flex: `${pillar.weight} 1 0`,
        minWidth: 0,
        borderLeft: isFirstInRow ? 'none' : '1px solid var(--color-line)',
        padding: 'clamp(12px, 1.6vw, 22px)',
        textDecoration: 'none',
        color: 'inherit',
        background: isActive ? 'rgba(248, 191, 36, 0.16)' : 'transparent',
        transition:
          'background-color 320ms cubic-bezier(0.2, 0.6, 0.2, 1)',
      }}
    >
      {/* Hover wash — softer than the active state so hover and active are
          distinguishable. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{
          background: 'rgba(248, 191, 36, 0.06)',
          transition: 'opacity 200ms ease',
        }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <span
          className="font-mono text-[color:var(--color-ink)]"
          style={{ fontSize: 'clamp(11px, 0.95vw, 13px)', letterSpacing: '0.10em' }}
        >
          {pillar.n}
        </span>
        {isActive ? (
          <span
            aria-hidden="true"
            className="font-mono text-[color:var(--color-accent-ink)]"
            style={{
              fontSize: 'clamp(9px, 0.7vw, 10px)',
              letterSpacing: '0.18em',
              padding: '2px 6px',
              background: 'var(--color-accent)',
              borderRadius: 1,
            }}
          >
            READING
          </span>
        ) : null}
      </div>

      <div className="relative flex flex-col gap-1">
        <p
          className="font-medium text-[color:var(--color-ink)] leading-[1.05]"
          style={{
            // Tighter ceiling than the original. The ribbon is shorter
            // now — pillar names that previously rendered at 38px+ would
            // overflow the 96px-tall bottom row. Scaling tops out at ~26px
            // for the heaviest pillars and degrades gracefully on small
            // tiles.
            fontSize: `clamp(13px, ${0.8 + pillar.weight * 0.04}vw, ${15 + pillar.weight * 0.55}px)`,
            letterSpacing: '-0.02em',
          }}
        >
          {pillar.name}
        </p>
        <p
          className="font-mono text-[color:var(--color-mute-2)]"
          style={{ fontSize: 11, letterSpacing: '0.12em' }}
        >
          {pillar.weight}%
          {pillar.installGated ? ' · gated' : ''}
        </p>
      </div>
    </a>
  );
}
