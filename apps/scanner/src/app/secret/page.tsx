import type { Metadata } from 'next';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { SecretForm } from './SecretForm';

export const metadata: Metadata = {
  title: 'One-time secret — view-once link',
  description:
    'Share a sensitive value through a single-use URL. Encrypted in your browser before it leaves your device — we never see the key. Burns on first read or 24 hours, whichever comes first.',
  alternates: { canonical: '/secret' },
};

export default function SecretPage() {
  return (
    <main
      id="main"
      className="flintmere-main"
      style={{
        background: 'var(--color-paper)',
        minHeight: '100vh',
        paddingTop: 'clamp(64px, 10vh, 128px)',
        paddingBottom: 'clamp(64px, 10vh, 128px)',
        paddingLeft: 'clamp(24px, 5vw, 64px)',
        paddingRight: 'clamp(24px, 5vw, 64px)',
      }}
    >
      <div className="mx-auto w-full max-w-[640px]">
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1vw, 13px)',
            letterSpacing: '0.18em',
            color: 'var(--color-mute)',
            marginBottom: 'clamp(24px, 3vw, 40px)',
          }}
        >
          // one-time secret
        </p>

        <h1
          className="font-sans tracking-[-0.03em] leading-[0.95] text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 700,
            marginBottom: 'clamp(20px, 2.5vw, 32px)',
          }}
        >
          Share a secret <Bracket>once</Bracket>.
        </h1>

        <p
          className="font-sans"
          style={{
            fontSize: 'clamp(15px, 1.1vw, 17px)',
            lineHeight: 1.6,
            color: 'var(--color-mute)',
            marginBottom: 'clamp(28px, 3.5vw, 48px)',
            maxWidth: '52ch',
          }}
        >
          Paste a sensitive value. We&rsquo;ll give you a single-use URL.
          The first person to open it sees the secret; every click after
          that gets &ldquo;already viewed.&rdquo; Encrypted in your browser
          before it leaves your device — Flintmere holds the ciphertext
          but never the key. Auto-expires in 24 hours.
        </p>

        <p
          className="font-sans"
          style={{
            fontSize: 'clamp(15px, 1.1vw, 17px)',
            lineHeight: 1.6,
            color: 'var(--color-mute)',
            marginBottom: 'clamp(32px, 4vw, 56px)',
            maxWidth: '52ch',
          }}
        >
          A free utility from the Flintmere team. Built originally for
          handing read-only Shopify Admin tokens to the Flintmere team —
          available for any one-shot secret transfer.
        </p>

        <SecretForm />

        <p
          className="font-sans"
          style={{
            fontSize: 'clamp(12px, 0.9vw, 13px)',
            lineHeight: 1.5,
            color: 'var(--color-mute)',
            marginTop: 'clamp(40px, 5vw, 64px)',
            maxWidth: '52ch',
          }}
        >
          For credentials, configuration values, and one-shot secrets between
          consenting parties. Not a paste host or anonymous-publishing tool.
          Abuse — illegal content, harassment, threats, doxxing — will be
          reported and the source IP rate-limit-banned. See{' '}
          <a href="/terms" className="underline">terms</a> and{' '}
          <a href="/privacy" className="underline">privacy</a>.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
