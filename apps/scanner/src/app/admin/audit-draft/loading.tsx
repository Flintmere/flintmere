// Loading skeleton — single calm frame, no animation.
//
// The audit-draft surface inherits the global `prefers-reduced-motion`
// soft contract from `globals.css`. Even with motion enabled there's
// nothing to animate here — the only meaningful skeleton beat is the
// LLM call (15–25s on Gemini 2.5 Pro), and that's signposted in
// DraftForm itself with an aria-live status. This loading.tsx covers
// the brief Next-router transition only.

export default function Loading() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--color-paper)',
        color: 'var(--color-ink)',
        fontFamily: 'var(--font-sans)',
      }}
      aria-busy="true"
    >
      <div
        style={{
          maxWidth: '64rem',
          margin: '0 auto',
          padding: '3rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <p
          className="eyebrow"
          style={{ color: 'var(--color-mute)' }}
        >
          Loading…
        </p>
        <h1
          className="bracket"
          style={{ margin: 0, fontSize: 'clamp(2rem, 4vw, 3rem)' }}
        >
          Audit draft
        </h1>
      </div>
    </main>
  )
}
