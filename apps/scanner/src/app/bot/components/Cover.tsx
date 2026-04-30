import { Bracket } from '@flintmere/ui';

/**
 * /bot Chapter 1 — Cover (Saks brand-mark, Pentagram reference).
 *
 * Apple-pattern word-cascade lands "Watch us / read your / storefront,"
 * then BEAT 300ms, then Saks `[ FlintmereBot ]` lands as the punchline at
 * logotype scale (third Saks-bracket page after /audit `[ for you ]` and
 * /research `[ X% ]` — ratifies Saks as the canonical brand-mark move per
 * decisions/2026-04-29-saks-bracket-canon).
 *
 * A24 mono credit pattern at top-left ("Flintmere · FlintmereBot · v1.0").
 * Sage hairline at bottom-left as the section anchor.
 *
 * Cascade timing matches /audit's hero precedent — STAGGER 110ms, BEAT 300ms,
 * ENTRY 400ms — so the page's first chord rhymes with /audit + /research.
 */

const STAGGER = 110;
const BEAT = 300;

export function Cover() {
  const WORDS = ['Watch', 'us', 'read', 'your', 'storefront,'];
  const ENTRY = 400;
  const cascadeEnd = ENTRY + WORDS.length * STAGGER;
  const bracketDelay = cascadeEnd + BEAT;
  const ledeDelay = bracketDelay + 1200;
  const hairlineDelay = ledeDelay + 600;

  return (
    <section
      id="cover"
      aria-labelledby="bot-heading"
      className="relative isolate overflow-hidden bg-[color:var(--color-paper)] flex flex-col"
      style={{ minHeight: '100vh' }}
    >
      <div
        className="relative flex flex-col justify-center mx-auto w-full max-w-[1280px]"
        style={{
          flex: 1,
          paddingLeft: 'clamp(32px, 5vw, 96px)',
          paddingRight: 'clamp(32px, 4vw, 64px)',
          paddingTop: 'clamp(120px, 14vh, 200px)',
          paddingBottom: 'clamp(96px, 12vh, 160px)',
        }}
      >
        <p
          data-reveal
          aria-label="Flintmere FlintmereBot version 1.0"
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1vw, 13px)',
            letterSpacing: '0.18em',
            fontWeight: 500,
            color: 'var(--color-mute)',
            marginBottom: 'clamp(48px, 6vw, 96px)',
            ['--reveal-delay' as string]: '120ms',
          }}
        >
          Flintmere · FlintmereBot · v1.0
        </p>

        <h1
          id="bot-heading"
          className="font-sans font-medium tracking-[-0.04em] leading-[0.88] text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(56px, 8vw, 128px)',
            maxWidth: '14ch',
          }}
        >
          <span className="sr-only">
            Watch us read your storefront, FlintmereBot.
          </span>
          <span aria-hidden="true">
            {WORDS.map((w, i) => (
              <span
                key={`hw-${i}`}
                data-reveal
                style={{
                  display: 'inline-block',
                  marginRight: '0.28em',
                  ['--reveal-delay' as string]: `${ENTRY + i * STAGGER}ms`,
                }}
              >
                {w}
              </span>
            ))}
            <span
              data-reveal
              style={{
                display: 'inline-block',
                ['--reveal-delay' as string]: `${bracketDelay}ms`,
              }}
            >
              <Bracket size="saks">FlintmereBot</Bracket>
            </span>
          </span>
        </h1>

        <p
          data-reveal
          className="font-sans"
          style={{
            marginTop: 'clamp(28px, 3vw, 48px)',
            maxWidth: '54ch',
            fontSize: 'clamp(16px, 1.15vw, 19px)',
            lineHeight: 1.55,
            fontWeight: 400,
            color: 'var(--color-mute)',
            ['--reveal-delay' as string]: `${ledeDelay}ms`,
          }}
        >
          The bot, in plain text. The user-agent it carries. What it reads.
          What it ignores. The leash. The opt-out. Where the data ends up.
        </p>

        <div
          data-reveal
          aria-hidden="true"
          className="absolute h-[2px]"
          style={{
            left: 'clamp(32px, 5vw, 96px)',
            bottom: 'clamp(40px, 5vw, 72px)',
            width: 'clamp(160px, 14vw, 280px)',
            background: 'var(--color-accent-sage)',
            opacity: 0.85,
            ['--reveal-delay' as string]: `${hairlineDelay}ms`,
          }}
        />
      </div>
    </section>
  );
}
