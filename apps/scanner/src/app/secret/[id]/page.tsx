import type { Metadata } from 'next';
import { SecretRevealClient } from './SecretRevealClient';

export const metadata: Metadata = {
  title: 'One-time secret',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Params {
  params: Promise<{ id: string }>;
}

export default async function SecretRevealPage({ params }: Params) {
  const { id } = await params;

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
        <SecretRevealClient id={id} />
      </div>
    </main>
  );
}
