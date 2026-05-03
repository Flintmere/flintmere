'use client';

import { useEffect, useState } from 'react';
import {
  base64Decode,
  decryptOneTimeSecret,
} from '@/lib/secret-web-crypto';

type State =
  | { kind: 'ready' } // waiting for the user to click reveal
  | { kind: 'consuming' }
  | { kind: 'revealed'; plaintext: string }
  | { kind: 'no-key' }
  | {
      kind: 'unavailable';
      reason: 'not-found' | 'already-consumed' | 'expired' | 'tampered';
    };

export function SecretRevealClient({ id }: { id: string }) {
  const [state, setState] = useState<State>({ kind: 'ready' });
  const [keyFragment, setKeyFragment] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Read the key from the URL fragment on mount. The fragment is
  // browser-only — it never reached the server.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setState({ kind: 'no-key' });
      return;
    }
    // Accept either `#k=<value>` or a bare fragment `#<value>`.
    const trimmed = hash.startsWith('#') ? hash.slice(1) : hash;
    const eq = trimmed.startsWith('k=') ? trimmed.slice(2) : trimmed;
    if (!eq) {
      setState({ kind: 'no-key' });
      return;
    }
    setKeyFragment(eq);
  }, []);

  async function reveal() {
    if (!keyFragment) {
      setState({ kind: 'no-key' });
      return;
    }
    setState({ kind: 'consuming' });

    let res: Response;
    try {
      res = await fetch(`/api/secret/${id}/consume`, { method: 'POST' });
    } catch {
      setState({ kind: 'unavailable', reason: 'tampered' });
      return;
    }

    if (res.status === 404) {
      setState({ kind: 'unavailable', reason: 'not-found' });
      return;
    }
    if (res.status === 410) {
      const data = await safeJson(res);
      const reason = data?.code === 'expired' ? 'expired' : 'already-consumed';
      setState({ kind: 'unavailable', reason });
      return;
    }
    if (!res.ok) {
      setState({ kind: 'unavailable', reason: 'tampered' });
      return;
    }

    const data = await safeJson(res);
    if (
      !data ||
      typeof data.ciphertext !== 'string' ||
      typeof data.iv !== 'string' ||
      typeof data.authTag !== 'string'
    ) {
      setState({ kind: 'unavailable', reason: 'tampered' });
      return;
    }

    let plaintext: string;
    try {
      plaintext = await decryptOneTimeSecret({
        ciphertext: base64Decode(data.ciphertext),
        iv: base64Decode(data.iv),
        authTag: base64Decode(data.authTag),
        keyFragment,
      });
    } catch {
      setState({ kind: 'unavailable', reason: 'tampered' });
      return;
    }

    setState({ kind: 'revealed', plaintext });
  }

  if (state.kind === 'no-key') {
    return (
      <Unavailable
        headline="No key in URL."
        detail="The decryption key is the part of the URL after the # sign — looks like the link was copied without it. Ask the sender for the full URL."
      />
    );
  }

  if (state.kind === 'unavailable') {
    const map = {
      'not-found': {
        headline: 'Not found.',
        detail: 'No secret with that ID. Check the link.',
      },
      'already-consumed': {
        headline: 'Already viewed.',
        detail:
          'Someone has already opened this link. The secret has been burned and is no longer recoverable. Ask the sender to share a fresh one.',
      },
      expired: {
        headline: 'Expired.',
        detail:
          'This link expired before it was opened. Single-use secrets last 24 hours. Ask the sender to share a fresh one.',
      },
      tampered: {
        headline: 'Tampered.',
        detail:
          'The stored secret failed integrity checks, or the key in the URL is wrong. Ask the sender to share a fresh URL.',
      },
    } as const;
    const { headline, detail } = map[state.reason];
    return <Unavailable headline={headline} detail={detail} />;
  }

  if (state.kind === 'revealed') {
    return (
      <>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1vw, 13px)',
            letterSpacing: '0.18em',
            color: 'var(--color-accent-sage)',
            fontWeight: 600,
            marginBottom: 'clamp(20px, 2.5vw, 32px)',
          }}
        >
          // single-use · revealed
        </p>

        <h1
          className="font-sans tracking-[-0.03em] leading-[0.95] text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(36px, 5.5vw, 64px)',
            fontWeight: 700,
            marginBottom: 'clamp(20px, 2.5vw, 32px)',
          }}
        >
          Here it is.
        </h1>

        <p
          className="font-sans"
          style={{
            fontSize: 'clamp(15px, 1.1vw, 17px)',
            lineHeight: 1.6,
            color: 'var(--color-mute)',
            maxWidth: '52ch',
            marginBottom: 'clamp(28px, 3.5vw, 44px)',
          }}
        >
          Copy it now. The link has been burned and won&rsquo;t reveal the
          secret again.
        </p>

        <pre
          style={{
            border: '1px solid var(--color-line)',
            background: 'var(--color-paper-2)',
            padding: 'clamp(16px, 2vw, 24px)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(13px, 1.05vw, 15px)',
            lineHeight: 1.5,
            color: 'var(--color-ink)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            marginBottom: 'clamp(16px, 2vw, 24px)',
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          {state.plaintext}
        </pre>

        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(state.plaintext);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* user copies manually */
            }
          }}
          className="inline-flex items-center gap-2 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono font-medium uppercase hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors duration-[var(--duration-instant)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
          style={{
            fontSize: 12,
            letterSpacing: '0.14em',
            paddingLeft: 22,
            paddingRight: 22,
            paddingTop: 12,
            paddingBottom: 12,
          }}
        >
          {copied ? 'Copied' : 'Copy secret'}
          <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
        </button>
      </>
    );
  }

  // ready / consuming
  return (
    <>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 'clamp(11px, 1vw, 13px)',
          letterSpacing: '0.18em',
          color: 'var(--color-mute)',
          fontWeight: 500,
          marginBottom: 'clamp(20px, 2.5vw, 32px)',
        }}
      >
        // single-use · waiting
      </p>

      <h1
        className="font-sans tracking-[-0.03em] leading-[0.95] text-[color:var(--color-ink)]"
        style={{
          fontSize: 'clamp(36px, 5.5vw, 64px)',
          fontWeight: 700,
          marginBottom: 'clamp(20px, 2.5vw, 32px)',
        }}
      >
        A secret is waiting.
      </h1>

      <p
        className="font-sans"
        style={{
          fontSize: 'clamp(15px, 1.1vw, 17px)',
          lineHeight: 1.6,
          color: 'var(--color-mute)',
          maxWidth: '52ch',
          marginBottom: 'clamp(32px, 4vw, 48px)',
        }}
      >
        Reveal once, then the link burns. Make sure you&rsquo;re ready to
        copy and store the value before you click — there&rsquo;s no
        second chance, and even Flintmere can&rsquo;t recover it.
      </p>

      <button
        type="button"
        onClick={reveal}
        disabled={state.kind === 'consuming'}
        className="inline-flex items-center gap-2 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono font-medium uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors duration-[var(--duration-instant)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
        style={{
          fontSize: 12,
          letterSpacing: '0.14em',
          paddingLeft: 22,
          paddingRight: 22,
          paddingTop: 12,
          paddingBottom: 12,
        }}
      >
        {state.kind === 'consuming' ? 'Decrypting…' : 'Reveal secret →'}
      </button>
    </>
  );
}

function Unavailable({
  headline,
  detail,
}: {
  headline: string;
  detail: string;
}) {
  return (
    <>
      <p
        className="font-mono uppercase"
        style={{
          fontSize: 'clamp(11px, 1vw, 13px)',
          letterSpacing: '0.18em',
          color: 'var(--color-mute)',
          fontWeight: 500,
          marginBottom: 'clamp(20px, 2.5vw, 32px)',
        }}
      >
        // single-use · unavailable
      </p>

      <h1
        className="font-sans tracking-[-0.03em] leading-[0.95] text-[color:var(--color-ink)]"
        style={{
          fontSize: 'clamp(36px, 5.5vw, 64px)',
          fontWeight: 700,
          marginBottom: 'clamp(20px, 2.5vw, 32px)',
        }}
      >
        {headline}
      </h1>

      <p
        className="font-sans"
        style={{
          fontSize: 'clamp(15px, 1.1vw, 17px)',
          lineHeight: 1.6,
          color: 'var(--color-mute)',
          maxWidth: '52ch',
        }}
      >
        {detail}
      </p>
    </>
  );
}

async function safeJson(res: Response): Promise<{ [k: string]: unknown } | null> {
  try {
    return (await res.json()) as { [k: string]: unknown };
  } catch {
    return null;
  }
}
