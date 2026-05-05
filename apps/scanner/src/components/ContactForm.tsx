'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Bracket } from '@flintmere/ui';
import { ALL_TOPICS, labelForTopic } from '@/lib/contact-routing';
import type { ContactTopic } from '@/generated/prisma';
import { TurnstileWidget } from '@/components/TurnstileWidget';

export interface ContactFormProps {
  /** Preselect a topic (e.g. "security" on /security inline embed). */
  defaultTopic?: ContactTopic;
  /** Caller-provided source label for analytics + ops triage. */
  source?: string;
  /** Hide the topic selector — caller has fixed it via defaultTopic. */
  lockTopic?: boolean;
  /** Compact embed (no surrounding heading). */
  embedded?: boolean;
}

type FormState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'success' }
  | { phase: 'error'; message: string };

export function ContactForm({
  defaultTopic = 'general',
  source,
  lockTopic = false,
  embedded = false,
}: ContactFormProps) {
  const [topic, setTopic] = useState<ContactTopic>(defaultTopic);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [shopifyDomain, setShopifyDomain] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [state, setState] = useState<FormState>({ phase: 'idle' });
  const mountedAt = useRef<number>(Date.now());
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  const messageId = useMemo(
    () => `contact-message-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.phase === 'submitting') return;
    if (message.trim().length < 30) {
      setState({
        phase: 'error',
        message: 'Tell us a bit more — at least a sentence or two.',
      });
      return;
    }
    setState({ phase: 'submitting' });
    const turnstileInput = formRef.current?.querySelector<HTMLInputElement>(
      'input[name="cf-turnstile-response"]',
    );
    const turnstileToken = turnstileInput?.value ?? '';
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topic,
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || null,
          shopifyDomain: shopifyDomain.trim() || null,
          message: message.trim(),
          website,
          dwellMs: Date.now() - mountedAt.current,
          source: source ?? null,
          turnstileToken,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setState({
          phase: 'error',
          message:
            body?.message ?? 'Could not send. Please try again in a moment.',
        });
        return;
      }
      setState({ phase: 'success' });
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Network error.',
      });
    }
  };

  if (state.phase === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: '24px',
          border: '1px solid var(--color-line)',
          background: 'var(--color-paper)',
        }}
      >
        <p
          className="eyebrow"
          style={{ color: 'var(--color-mute)', marginBottom: 8 }}
        >
          Sent
        </p>
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.4,
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          Thanks. We sent a confirmation to your inbox and will reply within
          two working days.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      style={{
        display: 'grid',
        gap: 16,
        padding: embedded ? 0 : 24,
        border: embedded ? 'none' : '1px solid var(--color-line)',
        background: embedded ? 'transparent' : 'var(--color-paper)',
      }}
    >
      {!embedded ? (
        <h2
          style={{
            fontSize: 'clamp(22px, 2.5vw, 28px)',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: 'var(--color-ink)',
            margin: '0 0 8px 0',
          }}
        >
          Talk to <Bracket>Flintmere</Bracket>.
        </h2>
      ) : null}

      {!lockTopic ? (
        <Field label="Topic" htmlFor="contact-topic">
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value as ContactTopic)}
            style={inputStyle}
          >
            {ALL_TOPICS.map((t) => (
              <option key={t} value={t}>
                {labelForTopic(t)}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="topic" value={topic} />
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <Field label="Your name" htmlFor="contact-name">
          <input
            id="contact-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Email" htmlFor="contact-email">
          <input
            id="contact-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <Field label="Company (optional)" htmlFor="contact-company">
          <input
            id="contact-company"
            type="text"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field
          label="Shopify domain (optional)"
          htmlFor="contact-shopify-domain"
        >
          <input
            id="contact-shopify-domain"
            type="text"
            placeholder="yourstore.myshopify.com"
            value={shopifyDomain}
            onChange={(e) => setShopifyDomain(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </div>

      <Field label="Message" htmlFor={messageId}>
        <textarea
          id={messageId}
          required
          rows={6}
          minLength={30}
          maxLength={4000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            ...inputStyle,
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </Field>

      {/* Honeypot — visually offscreen + inert (no a11y, no focus, no
          click). Bots that scrape forms still see the input in the DOM
          and fill it; humans never see or tab into it. `inert` replaces
          the prior aria-hidden + tabIndex={-1} pair which tripped axe
          rule a11y/aria-hidden-focus. */}
      <div inert style={honeypotWrapStyle}>
        <label>
          Website
          <input
            type="text"
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <TurnstileWidget />

      {state.phase === 'error' ? (
        <p
          role="alert"
          style={{
            color: 'var(--color-alert)',
            fontSize: 13,
            margin: 0,
          }}
        >
          {state.message}
        </p>
      ) : null}

      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="submit"
          disabled={state.phase === 'submitting'}
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-ink)',
            padding: '14px 20px',
            minHeight: 44,
            fontFamily: 'var(--font-mono, ui-monospace, Menlo, monospace)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: state.phase === 'submitting' ? 'wait' : 'pointer',
          }}
        >
          {state.phase === 'submitting' ? 'Sending…' : 'Send message →'}
        </button>
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-mute)',
            margin: 0,
          }}
        >
          We reply within two working days.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{ display: 'grid', gap: 6 }}
    >
      <span
        className="eyebrow"
        style={{
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-mute)',
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  appearance: 'none',
  background: 'var(--color-paper)',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-line)',
  padding: '10px 12px',
  fontSize: 15,
  lineHeight: 1.4,
  width: '100%',
  borderRadius: 0,
};

const honeypotWrapStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: 1,
  height: 1,
  overflow: 'hidden',
};
