import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--color-line)] py-10">
      <div className="mx-auto max-w-[1280px] px-8 flex flex-wrap justify-between gap-6">
        <p className="eyebrow">
          © 2026 Flintmere · a trading name of Eazy Access Ltd
        </p>
        <nav className="flex gap-8" aria-label="Footer">
          <Link href="/privacy" className="eyebrow">
            Privacy
          </Link>
          <Link href="/terms" className="eyebrow">
            Terms
          </Link>
          <Link href="/security" className="eyebrow">
            Security
          </Link>
          <Link href="/scan" className="eyebrow">
            Scan
          </Link>
        </nav>
      </div>
    </footer>
  );
}
