'use client';

import { useState } from 'react';
import {
  base64Encode,
  encryptForOneTimeSecret,
} from '@/lib/secret-web-crypto';

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok'; url: string; expiresAt: string }
  | { kind: 'error'; message: string };

export function SecretForm() {
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!secret.trim()) return;
    setStatus({ kind: 'submitting' });
    setCopied(false);

    let encrypted;
    try {
      encrypted = await encryptForOneTimeSecret(secret);
    } catch (err) {
      setStatus({
        kind: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Could not encrypt locally. Try a modern browser.',
      });
      return;
    }

    let res: Response;
    try {
      res = await fetch('/api/secret', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ciphertext: base64Encode(encrypted.ciphertext),
          iv: base64Encode(encrypted.iv),
          authTag: base64Encode(encrypted.authTag),
        }),
      });
    } catch (err) {
      setStatus({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'Network error. Try again.',
      });
      return;
    }

    let data: { ok?: boolean; id?: string; expiresAt?: string; code?: string };
    try {
      data = await res.json();
    } catch {
      setStatus({
        kind: 'error',
        message: `Unexpected server response (HTTP ${res.status}).`,
      });
      return;
    }

    if (!res.ok || !data.ok || !data.id || !data.expiresAt) {
      setStatus({
        kind: 'error',
        message: errorMessage(data.code, res.status),
      });
      return;
    }

    const url = `${window.location.origin}/secret/${data.id}#k=${encrypted.keyFragment}`;
    setStatus({ kind: 'ok', url, expiresAt: data.expiresAt });
    setSecret('');
  }

  if (status.kind === 'ok') {
    return (
      <div>
        <p
          className="font-mono uppercase"
          style={{
            fontSize: 'clamp(11px, 1vw, 13px)',
            letterSpacing: '0.18em',
            color: 'var(--color-accent-sage)',
            fontWeight: 600,
            marginBottom: 'clamp(12px, 1.5vw, 20px)',
          }}
        >
          // your one-time url
        </p>

        <div
          style={{
            border: '1px solid var(--color-line)',
            background: 'var(--color-paper-2)',
            padding: 'clamp(16px, 2vw, 24px)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'clamp(13px, 1.05vw, 15px)',
            wordBreak: 'break-all',
            color: 'var(--color-ink)',
            marginBottom: 'clamp(16px, 2vw, 24px)',
          }}
        >
          {status.url}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(12px, 1.5vw, 20px)',
            alignItems: 'center',
            marginBottom: 'clamp(24px, 3vw, 40px)',
          }}
        >
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(status.url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* fall through — user copies manually */
              }
            }}
            className="inline-flex items-center gap-2 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono font-medium uppercase hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors duration-[var(--duration-instant)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
            style={{
              fontSize: 12,
              letterSpacing: '0.14em',
              paddingLeft: 22,
              paddingRight: 22,
              paddingTop: 14,
              paddingBottom: 14,
              minHeight: 44,
            }}
          >
            {copied ? 'Copied' : 'Copy URL'}
            <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus({ kind: 'idle' })}
            className="font-mono uppercase text-[color:var(--color-mute)] hover:text-[color:var(--color-ink)]"
            style={{ fontSize: 12, letterSpacing: '0.14em', fontWeight: 500 }}
          >
            Share another →
          </button>
        </div>

        <p
          className="font-sans"
          style={{
            fontSize: 'clamp(13px, 0.95vw, 14px)',
            lineHeight: 1.6,
            color: 'var(--color-mute)',
            maxWidth: '52ch',
          }}
        >
          The decryption key sits in the part of the URL after the{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--color-paper-2)',
              padding: '0 4px',
            }}
          >
            #
          </code>{' '}
          — your browser keeps it; our server never sees it. Send the URL
          to the recipient. They open it once; the secret burns on first
          read. Auto-expires{' '}
          {new Date(status.expiresAt).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}{' '}
          if not opened by then.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <label
        htmlFor="secret"
        className="font-mono uppercase"
        style={{
          display: 'block',
          fontSize: 'clamp(11px, 1vw, 13px)',
          letterSpacing: '0.18em',
          color: 'var(--color-mute)',
          fontWeight: 500,
          marginBottom: 'clamp(8px, 1vw, 12px)',
        }}
      >
        // paste secret
      </label>

      <textarea
        id="secret"
        name="secret"
        required
        rows={6}
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        className="w-full block"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(13px, 1vw, 15px)',
          lineHeight: 1.5,
          color: 'var(--color-ink)',
          background: 'var(--color-paper-2)',
          border: '1px solid var(--color-line)',
          padding: 'clamp(14px, 1.6vw, 20px)',
          resize: 'vertical',
          marginBottom: 'clamp(16px, 2vw, 24px)',
        }}
      />

      <p
        className="font-sans"
        style={{
          fontSize: 'clamp(12px, 0.9vw, 13px)',
          lineHeight: 1.5,
          color: 'var(--color-mute)',
          marginBottom: 'clamp(20px, 2.5vw, 32px)',
          maxWidth: '52ch',
        }}
      >
        Encrypted in your browser before it leaves your device. The
        decryption key never reaches our server.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 2vw, 24px)',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="submit"
          disabled={status.kind === 'submitting' || !secret.trim()}
          className="inline-flex items-center gap-2 bg-[color:var(--color-accent)] text-[color:var(--color-accent-ink)] font-mono font-medium uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-paper)] transition-colors duration-[var(--duration-instant)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-accent-sage)]"
          style={{
            fontSize: 12,
            letterSpacing: '0.14em',
            paddingLeft: 22,
            paddingRight: 22,
            paddingTop: 14,
            paddingBottom: 14,
            minHeight: 44,
          }}
        >
          {status.kind === 'submitting' ? 'Encrypting…' : 'Generate URL →'}
        </button>

        {status.kind === 'error' ? (
          <p
            className="font-mono"
            role="alert"
            style={{
              fontSize: 13,
              color: 'var(--color-alert)',
            }}
          >
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function errorMessage(code: unknown, status: number): string {
  if (code === 'too-large') return 'Secret too large (10 KB max).';
  if (code === 'empty') return 'Cannot share an empty secret.';
  if (code === 'invalid-payload')
    return 'Encrypted payload was rejected. Refresh and try again.';
  if (code === 'rate-limited')
    return 'Too many requests. Wait a minute and try again.';
  return `Something went wrong (HTTP ${status}). Try again.`;
}
