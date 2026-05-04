/**
 * MaintenanceTimeline — half-yearly publication timeline as a chapter
 * graphic.
 *
 * Mechanic: static lead. The earlier draft of this section was a generic
 * <dl> — competent but invisible. Rendering the cadence as a horizontal
 * timeline makes the half-yearly commitment legible at a glance: the
 * versions are dots on a line, the current beat is amber, the next beat
 * is hairline-pending.
 *
 * Reference: Order Form magazine (typographic grid as design language) +
 * Hodinkee Reference Points (one decorative anchor per chapter, restraint
 * elsewhere). The timeline IS the chapter anchor here; the dl below it
 * carries the cadence detail.
 *
 * The "now" position is a function of LAST_UPDATED — when the operator
 * bumps that constant, the playhead moves. This couples the visual to the
 * canonical date, not a parallel hard-coded marker.
 *
 * Pure SVG, no JS. Inline so the page can server-render and the timeline
 * shows up before any client hydration.
 */

interface TimelineBeat {
  version: string;
  date: string;
  iso: string;
  status: 'past' | 'now' | 'future';
}

const BEATS: TimelineBeat[] = [
  { version: 'v0.x', date: 'Mar 2026', iso: '2026-03-01', status: 'past' },
  { version: 'v1', date: 'Target Q3 2026', iso: '2026-09-01', status: 'future' },
  { version: 'v1.1', date: 'Mar 2027', iso: '2027-03-01', status: 'future' },
  { version: 'v2', date: 'Sep 2027', iso: '2027-09-01', status: 'future' },
  { version: 'v2.1', date: 'Mar 2028', iso: '2028-03-01', status: 'future' },
];

export function MaintenanceTimeline() {
  // Layout maths: SVG viewbox is 1200×140. Beat dots are evenly spaced
  // along an inset axis (60–1140 = 1080 units across).
  const inset = 60;
  const span = 1080;
  const step = span / (BEATS.length - 1);

  return (
    <figure
      className="my-12"
      aria-label="Half-yearly publication timeline. v1 publishes Q3 2026 (pending); v1.1 March 2027; v2 September 2027."
    >
      <svg
        viewBox="0 0 1200 140"
        role="img"
        className="w-full h-auto"
        style={{ overflow: 'visible' }}
      >
        {/* Axis line — single hairline ink. */}
        <line
          x1={inset}
          y1={70}
          x2={inset + span}
          y2={70}
          stroke="var(--color-line)"
          strokeWidth="1"
        />

        {BEATS.map((beat, i) => {
          const cx = inset + i * step;
          const isNow = beat.status === 'now';
          const isPast = beat.status === 'past';
          return (
            <g key={beat.iso}>
              {/* Beat marker — amber-filled for now, ink-stroked for past
                  + future. The "now" beat carries a soft halo so the eye
                  finds it first. */}
              {isNow ? (
                <circle
                  cx={cx}
                  cy={70}
                  r={18}
                  fill="var(--color-accent-strong)"
                />
              ) : null}
              <circle
                cx={cx}
                cy={70}
                r={isNow ? 8 : 5}
                fill={isNow ? 'var(--color-accent)' : isPast ? 'var(--color-ink)' : 'var(--color-paper)'}
                stroke={isNow ? 'var(--color-ink)' : 'var(--color-ink)'}
                strokeWidth={isNow ? 1.5 : 1}
              />

              {/* Version label above. */}
              <text
                x={cx}
                y={36}
                textAnchor="middle"
                fontFamily="var(--geist-mono), ui-monospace, monospace"
                fontSize={isNow ? 18 : 14}
                fontWeight={isNow ? 600 : 500}
                fill="var(--color-ink)"
                style={{ letterSpacing: '-0.02em' }}
              >
                {beat.version}
              </text>

              {/* Date label below. */}
              <text
                x={cx}
                y={106}
                textAnchor="middle"
                fontFamily="var(--geist-mono), ui-monospace, monospace"
                fontSize={11}
                fill={isNow ? 'var(--color-ink)' : 'var(--color-mute)'}
                style={{ letterSpacing: '0.10em', textTransform: 'uppercase' }}
              >
                {beat.date}
              </text>

              {/* "Now" caption. */}
              {isNow ? (
                <text
                  x={cx}
                  y={130}
                  textAnchor="middle"
                  fontFamily="var(--geist-mono), ui-monospace, monospace"
                  fontSize={9}
                  fill="var(--color-accent-ink)"
                  style={{ letterSpacing: '0.18em' }}
                >
                  CURRENT
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        Half-yearly publication cadence. Versions: {BEATS.map((b) => `${b.version} ${b.date}`).join(', ')}. v1 is pending publication (target Q3 2026); v0.x is the operator-internal pre-release.
      </figcaption>
    </figure>
  );
}
