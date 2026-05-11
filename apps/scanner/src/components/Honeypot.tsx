'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

/**
 * Honeypot — visually-hidden "website" trap + page-dwell timer.
 *
 * Two anti-bot signals in one component:
 *  - `website` field is inert + offscreen; humans never see it. Bots that
 *    scrape forms and fill every input populate it, which the server
 *    treats as a silent-drop signal.
 *  - `dwellMs` is the elapsed milliseconds between mount and submit. Real
 *    users take seconds to type a URL; scripted submits fire in under a
 *    hundred ms.
 *
 * Both values are read imperatively via a ref so the parent form can
 * include them in its POST body. Pattern matches `apps/scanner/src/
 * components/ContactForm.tsx` (the original honeypot canon, kept inline
 * there). Server-side check lives in `apps/scanner/src/lib/anti-bot.ts`.
 *
 * Accessibility: the wrapper uses `inert` (React 19 first-class), so the
 * trap input is absent from the a11y tree and the tab order in one
 * attribute — clears axe a11y/aria-hidden-focus, per the 2026-05-05
 * memory note about `inert` over `aria-hidden + tabIndex={-1}`.
 */

export interface HoneypotHandle {
  getValues(): { website: string; dwellMs: number };
}

const wrapStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: 1,
  height: 1,
  overflow: 'hidden',
};

export const Honeypot = forwardRef<HoneypotHandle>(function Honeypot(_, ref) {
  const [website, setWebsite] = useState('');
  const mountedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getValues() {
        return {
          website,
          dwellMs: Date.now() - mountedAtRef.current,
        };
      },
    }),
    [website],
  );

  return (
    <div inert style={wrapStyle}>
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
  );
});
