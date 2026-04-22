// Marketing — swiss modern, type-as-graphic, midnight/parchment/sulphur

function WNav({ variant = 'A', dark = false }) {
  return (
    <div className="w-nav" style={dark ? { background: 'var(--ink)', color: 'var(--paper)', borderBottomColor: 'var(--ink-3)' } : {}}>
      <div className="wordmark">flintmere</div>
      <div className="links">
        {variant === 'A' ? (
          <><span>product</span><span>pricing</span><span>research</span><span>contact</span></>
        ) : (
          <><span>the problem</span><span>the method</span><span>pricing</span><span>notes</span></>
        )}
      </div>
      <span className={`w-cta ${dark ? 'accent' : 'accent'}`}>scan my store →</span>
    </div>
  );
}

// ============ A — editorial manifesto, giant type ============
function MarketingA({ mobile }) {
  return (
    <div className={`frame ${mobile ? 'mobile' : ''}`}>
      <div className="frame-bar">
        <span className="dots"><i /><i /><i /></span>
        <span>flintmere.com — variant A · editorial manifesto</span>
        <span>{mobile ? '390' : '1440'}</span>
      </div>
      <div className="sections">
        <WNav variant="A" />

        {/* HERO — giant headline */}
        <div className="section" style={{ padding: mobile ? '36px 18px 48px' : '80px 40px 96px' }}>
          <div className="anno tl">giant type as graphic. headline fills the viewport.</div>
          <div className="eyebrow"><span className="dot">01</span> free scan · no install required</div>
          <h1 className="hhead" style={{ fontSize: mobile ? 38 : 108, maxWidth: '14ch', lineHeight: 0.95 }}>
            Your catalog is invisible to ChatGPT.
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '2fr 1fr', gap: 30, marginTop: 40, alignItems: 'end' }}>
            <p className="lede" style={{ maxWidth: '48ch' }}>
              AI shopping agents now drive measurable commerce traffic on Shopify. Forty percent of
              catalogs get excluded from agent recommendations because their product data isn't
              structured for agents to parse. We tell you where you stand in sixty seconds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: mobile ? 'flex-start' : 'flex-end' }}>
              <span className="w-cta accent">scan my store →</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>60s · no signup</span>
            </div>
          </div>
        </div>

        {/* Giant number band */}
        <div className="section dark" style={{ padding: mobile ? '40px 18px' : '80px 40px', borderBottom: '1px solid var(--ink-3)' }}>
          <div className="anno tr">one breathing stat. the number is the argument.</div>
          <div className="eyebrow" style={{ color: 'var(--mute-2)' }}>
            <span className="dot">02</span> shopify stores invisible to agents · q1 2026
          </div>
          <div className="giant" style={{ color: 'var(--paper)' }}>
            <span className="acc">40</span><span style={{ color: 'var(--mute)' }}>%</span>
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 2fr', gap: 30, alignItems: 'end' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--mute-2)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              source · flintmere scan corpus<br />
              n = 5,612 stores
            </div>
            <div className="lede" style={{ color: 'var(--mute-2)' }}>
              The agents read a catalog as a graph of identifiers, attributes, and relationships.
              What they can't parse, they can't recommend. Invisibility, by default.
            </div>
          </div>
        </div>

        {/* Before / after chapter */}
        <div className="section" style={{ padding: 0 }}>
          <div className="compare">
            <div>
              <div className="anno tl">two declarative paragraphs. no vs.</div>
              <div className="label">before · keyword search</div>
              <h3 className="hhead">Catalogs were lists of pages for humans to scan.</h3>
              <p className="lede sm" style={{ marginTop: 12 }}>
                Shoppers typed queries. Retailers optimised for exact-match titles and meta tags.
                The work was making the page rank. The page did the rest.
              </p>
              <div className="placeholder" style={{ height: 140, marginTop: 18 }}>linear keyword list · visual</div>
            </div>
            <div>
              <div className="label acc">after · machine reasoning</div>
              <h3 className="hhead">Catalogs are graphs. Agents reason on them.</h3>
              <p className="lede sm" style={{ marginTop: 12 }}>
                Agents resolve intent — what, for whom, how — then return one answer. Your product
                either can be reasoned about, or it can't. There is no almost.
              </p>
              <div className="placeholder" style={{ height: 140, marginTop: 18 }}>attribute graph · visual</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat"><div className="num">15<span style={{ fontSize: 26 }}>×</span></div><div className="lab">yoy growth · agent orders</div></div>
          <div className="stat"><div className="num">40<span style={{ fontSize: 26 }}>%</span></div><div className="lab">invisible to agents</div></div>
          <div className="stat"><div className="num">3–4<span style={{ fontSize: 26 }}>×</span></div><div className="lab">lift at 99% attribute</div></div>
          <div className="stat"><div className="num">60<span style={{ fontSize: 26 }}>s</span></div><div className="lab">time to first audit</div></div>
        </div>

        {/* Pillars */}
        <div className="section">
          <div className="anno tr">numbered timeline. the method made plain.</div>
          <div className="eyebrow"><span className="dot">03</span> the six pillars</div>
          <h2 className="hhead">What we measure.</h2>
          <div className="pillars" style={{ marginTop: 28 }}>
            {[
              ['01', 'Identifier completeness', 'GTINs, MPNs, brand — the keys agents use to match products.', '22%'],
              ['02', 'Attribute completeness', 'Material, size, colour, use-case. The vocabulary agents reason with.', '22%'],
              ['03', 'Title and description quality', 'Prose written for machines and humans at once. No keyword salad.', '18%'],
              ['04', 'Catalog mapping coverage', 'How your products connect into Google, Microsoft, and agent graphs.', '16%'],
              ['05', 'Consistency and integrity', 'Checksums, duplicates, drift between channels.', '12%'],
              ['06', 'AI checkout eligibility', 'Returns, payments, shipping — the signals agents need to transact.', '10%'],
            ].map(([n, name, desc, w]) => (
              <div className="pillar-row" key={n}>
                <div className="n">{n}</div>
                <div>
                  <div className="name">{name}</div>
                  <div className="desc">{desc}</div>
                </div>
                <div className="meta">{w} weight</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="section" style={{ padding: 0 }}>
          <div style={{ padding: '40px 32px 20px' }}>
            <div className="eyebrow"><span className="dot">04</span> how flintmere works</div>
            <h2 className="hhead">Audit. Fix. Monitor.</h2>
          </div>
          <div className="three-col" style={{ borderTop: '1px solid var(--line)' }}>
            {[
              ['Audit', 'A sixty-second read of your catalog. Sitemap, sample pages, structured data, checksum integrity. A score out of 100 with the pillars behind it.'],
              ['Fix', 'Every suggested change is previewed and reversible. Apply in batches with confidence thresholds. No black-box writes, no silent ship.'],
              ['Monitor', 'Catalog drift is continuous. We re-scan on a cadence, alert you when a pillar slips, and track your channel health against agent-attributed traffic.'],
            ].map(([t, d], i) => (
              <div key={t} style={{ padding: '32px 24px', borderLeft: i === 0 ? 0 : '1px solid var(--line)' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>0{i + 1}</div>
                <h3 className="hhead" style={{ marginTop: 8 }}>{t}</h3>
                <p className="lede sm" style={{ marginTop: 8 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="section" style={{ padding: 0 }}>
          <div className="anno tl">named quotes. lead with the pain solved.</div>
          <div className="quotes">
            {[
              ["We were invisible to the chat agents our buyers were using. Flintmere gave us a score, a plan, and proof of the lift.", 'Rachel Oduya · Founder, Meridian Supplements'],
              ["The honest guidance on GTINs alone was worth it. Three other vendors had already sold us fakes.", 'Ben Larkspur · Ops Lead, Harth & Sons'],
              ["I can hand a score to a client and a path to improve it. That is the whole sale for an agency.", 'Ines Vermeer · MD, Northleaf Commerce'],
            ].map(([q, a]) => (
              <div key={a}><q>{q}</q><div className="attr">{a}</div></div>
            ))}
          </div>
        </div>

        {/* Contrast */}
        <div className="section" style={{ padding: 0 }}>
          <div style={{ padding: '40px 32px 10px' }}>
            <div className="eyebrow"><span className="dot">05</span> built differently, on purpose</div>
          </div>
          <div className="compare">
            <div>
              <div className="label">others</div>
              <ul>
                <li className="struck">Generic SEO tools</li>
                <li className="struck">Sell fake barcodes</li>
                <li className="struck">Black-box AI fixes</li>
                <li className="struck">One-time audit</li>
              </ul>
            </div>
            <div>
              <div className="label acc">the flintmere way</div>
              <ul>
                <li>Built for agentic commerce</li>
                <li>Honest GTIN guidance — buy from GS1</li>
                <li>Every change previewed, reversible</li>
                <li>Continuous drift monitoring</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="section" style={{ padding: 0 }}>
          <div style={{ padding: '40px 32px 20px' }}>
            <div className="eyebrow"><span className="dot">06</span> pricing</div>
            <h2 className="hhead">Start free. Grow when it pays off.</h2>
          </div>
          <div className="pricing">
            {[
              ['Free', '£0', 'One scan. Public report. Email gate for the full breakdown.'],
              ['Growth', '£49', 'All six pillars. Apply fixes. Weekly re-scan.'],
              ['Scale', '£149', 'Drift monitoring. Variant sampling. CSV export.'],
              ['Agency', '£399', 'Multi-store. Client-ready scorecards. Priority fixes.'],
            ].map(([t, p, c]) => (
              <div key={t}>
                <div className="tier">{t.toLowerCase()}</div>
                <div className="price">{p}<span style={{ fontSize: 12, color: 'var(--mute)', marginLeft: 6 }}>/mo</span></div>
                <p className="copy">{c}</p>
                <span className="btn">choose {t.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Manifesto */}
        <div className="section dark" style={{ padding: mobile ? '48px 18px' : '96px 40px' }}>
          <div className="anno mr">short. declarative. ~60 words.</div>
          <div className="eyebrow" style={{ color: 'var(--mute-2)' }}><span className="dot">07</span> the shape of it</div>
          <h2 className="hhead" style={{ fontSize: mobile ? 28 : 56, maxWidth: '22ch', lineHeight: 1.05 }}>
            Commerce is being re-plumbed. The search-era catalog is being replaced by machine-readable
            structured data that agents can reason about. Most Shopify stores aren't ready. We make them ready.
          </h2>
          <div className="row" style={{ marginTop: 32, gap: 12 }}>
            <span className="w-cta accent">scan my store →</span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--mute-2)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>60s · no install</span>
          </div>
        </div>

        {/* Footer */}
        <div className="section" style={{ padding: mobile ? '28px 18px' : '56px 32px 32px', background: 'var(--ink)', color: 'var(--paper)', borderBottom: 0 }}>
          <div className="giant outline" style={{ fontSize: mobile ? 60 : 200, color: 'transparent', WebkitTextStroke: '1px var(--paper-2)', marginBottom: 30, lineHeight: 0.85 }}>
            flintmere
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: 24, fontSize: 11.5, color: 'var(--mute-2)' }}>
            <div>
              <div style={{ color: 'var(--paper)', marginBottom: 6 }}>AI-readiness for Shopify catalogs.</div>
              <div className="mono" style={{ fontSize: 10, marginTop: 10 }}>flintmere ltd · reg. 14338902 · VAT GB 398 2201</div>
            </div>
            <div><div style={{ color: 'var(--paper)', marginBottom: 8 }}>product</div><div>scanner</div><div>app</div><div>pricing</div></div>
            <div><div style={{ color: 'var(--paper)', marginBottom: 8 }}>resources</div><div>research</div><div>GTIN guide</div><div>changelog</div></div>
            <div><div style={{ color: 'var(--paper)', marginBottom: 8 }}>legal</div><div>privacy</div><div>terms</div><div>contact</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ B — data-forward split hero ============
function MarketingB({ mobile }) {
  return (
    <div className={`frame ${mobile ? 'mobile' : ''}`}>
      <div className="frame-bar">
        <span className="dots"><i /><i /><i /></span>
        <span>flintmere.com — variant B · split hero, data-forward</span>
        <span>{mobile ? '390' : '1440'}</span>
      </div>
      <div className="sections">
        <WNav variant="B" dark />

        {/* Hero — split */}
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.1fr 1fr', borderBottom: '1px solid var(--line)' }}>
          <div className="section dark" style={{ padding: mobile ? '36px 18px' : '72px 40px', borderBottom: 0, borderRight: mobile ? 0 : '1px solid var(--ink-3)' }}>
            <div className="anno tl">left = prose. right = live proof.</div>
            <div className="eyebrow" style={{ color: 'var(--mute-2)' }}>free scan · no install · 60s</div>
            <h1 className="hhead" style={{ fontSize: mobile ? 40 : 84, maxWidth: '14ch', lineHeight: 0.95 }}>
              The agents can't see half of Shopify.
            </h1>
            <p className="lede" style={{ marginTop: 24, color: 'var(--mute-2)' }}>
              ChatGPT, Gemini, Copilot and Perplexity are already making purchase recommendations.
              Yours aren't in them — and you can't tell until someone runs the numbers.
            </p>
            <div className="row" style={{ marginTop: 30, gap: 10, flexWrap: 'wrap' }}>
              <input className="input" placeholder="yourstore.myshopify.com" style={{ maxWidth: 260, background: 'transparent', color: 'var(--paper)', borderColor: 'var(--mute)' }} />
              <span className="w-cta accent">scan →</span>
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', marginTop: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              no signup · works on any shopify store
            </div>
          </div>

          <div className="terminal" style={{ borderTop: 0, padding: mobile ? '24px 18px' : '40px 32px' }}>
            <div className="anno tr">right side is a live scan. proof by demo.</div>
            <div style={{ color: 'var(--accent)', marginBottom: 14, letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: 10 }}>
              sample.scan · meridian-supplements
            </div>
            <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>fetch /sitemap.xml</span><span style={{ marginLeft: 'auto' }} className="ok">ok</span></div>
            <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>sample 128 product pages</span><span style={{ marginLeft: 'auto' }} className="ok">ok</span></div>
            <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>parse json-ld</span><span style={{ marginLeft: 'auto' }} className="ok">ok</span></div>
            <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>validate GTIN checksums</span><span style={{ marginLeft: 'auto' }} className="err">412 missing</span></div>
            <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>attribute completeness</span><span style={{ marginLeft: 'auto' }} className="warn">62%</span></div>
            <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>title &amp; description quality</span><span style={{ marginLeft: 'auto' }} className="ok">84%</span></div>
            <div style={{ borderTop: '1px solid var(--ink-3)', marginTop: 18, paddingTop: 18 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>readiness score</div>
              <div className="disp" style={{ fontSize: 80, color: 'var(--accent)', letterSpacing: '-0.05em', lineHeight: 1, marginTop: 4 }}>
                64<span style={{ fontSize: 22, color: 'var(--mute-2)', marginLeft: 8 }}>/ 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Giant stat wall */}
        <div className="section" style={{ padding: 0, background: 'var(--paper-3)' }}>
          <div style={{ padding: '32px 32px 0' }}>
            <div className="anno mr">stat wall. typography as texture.</div>
            <div className="eyebrow">the reality, in numbers</div>
          </div>
          <div style={{ padding: mobile ? '20px 18px 40px' : '20px 40px 60px' }}>
            <div className="giant outline" style={{ fontSize: mobile ? 64 : 200 }}>
              15× 40% 3–4×
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, marginTop: 24 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>15×</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>yoy growth in ai-agent orders on shopify</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>40%</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>of catalogs ignored by agents</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>3–4×</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>visibility lift at 99% attribute completion</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar grid */}
        <div className="section">
          <div className="eyebrow">method</div>
          <h2 className="hhead">Six pillars. One score.</h2>
          <p className="lede sm" style={{ marginBottom: 24, maxWidth: '56ch' }}>
            Every scan runs the same checks, weighted the same way. No mystery. Every failure points
            at a specific, fixable artefact in your catalog.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(3, 1fr)', border: '1px solid var(--line)', borderRight: 0, borderBottom: 0 }}>
            {[
              ['01', 'Identifier completeness', '22%'],
              ['02', 'Attribute completeness', '22%'],
              ['03', 'Title & description', '18%'],
              ['04', 'Catalog mapping', '16%'],
              ['05', 'Consistency & integrity', '12%'],
              ['06', 'AI checkout eligibility', '10%'],
            ].map(([n, name, w]) => (
              <div key={n} style={{ borderRight: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '22px 20px', background: 'var(--paper)' }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{n} · {w}</div>
                <div className="disp" style={{ fontSize: 22, marginTop: 8 }}>{name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works horizontal */}
        <div className="section" style={{ padding: 0, background: 'var(--paper-3)' }}>
          <div style={{ padding: '40px 32px 20px' }}>
            <div className="eyebrow">the method</div>
            <h2 className="hhead">Diagnose. Remediate. Watch.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr 1fr', borderTop: '1px solid var(--line)' }}>
            {[
              ['01', 'Audit', 'A scan across 200+ signals. Pillar scores, prioritised issues, a revenue-impact ranking.'],
              ['02', 'Fix', 'Previewable, reversible batch edits. Title rewrites, attribute fills, GTIN import, image alt text.'],
              ['03', 'Monitor', 'Daily re-scans. Drift alerts. Channel-health tied to agent-attributed traffic.'],
            ].map(([n, t, d], i) => (
              <div key={t} style={{ padding: '28px 24px', borderLeft: (i === 0 || mobile) ? 0 : '1px solid var(--line)', borderTop: (mobile && i > 0) ? '1px solid var(--line)' : 0 }}>
                <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{n}</div>
                <h3 className="hhead" style={{ marginTop: 8 }}>{t}</h3>
                <p className="lede sm">{d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* One big quote */}
        <div className="section" style={{ padding: mobile ? '40px 18px' : '72px 40px' }}>
          <div className="anno ml">one large quote; three small.</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.5fr 1fr', gap: 32 }}>
            <div>
              <q className="disp" style={{ fontSize: mobile ? 26 : 42, lineHeight: 1.15, display: 'block', quotes: 'none' }}>
                We were invisible to the chat agents our buyers were already using. Flintmere gave us
                a score, a plan, and the proof of lift we needed to defend the work.
              </q>
              <div className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 24 }}>
                Rachel Oduya · founder, meridian supplements
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['Honest GTIN guidance alone paid for it. We had been sold fakes three times.', 'Ben Larkspur · Harth & Sons'],
                ['A score I can hand to a client is the whole sale.', 'Ines Vermeer · Northleaf Commerce'],
                ['We watch drift now. Before, we watched nothing.', 'Tomás Reyes · Kinhouse'],
              ].map(([q, a]) => (
                <div key={a} style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 14 }}>
                  <q className="disp" style={{ fontSize: 16, display: 'block', quotes: 'none', lineHeight: 1.35 }}>{q}</q>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 8 }}>{a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contrast — striped */}
        <div className="section" style={{ padding: 0 }}>
          <div style={{ padding: '40px 32px 20px' }}>
            <div className="eyebrow">contrast</div>
            <h2 className="hhead">Built differently, on purpose.</h2>
          </div>
          <div style={{ borderTop: '1px solid var(--line)' }}>
            {[
              ['Generic SEO tools', 'Built for agentic commerce'],
              ['Sell fake barcodes', 'Honest GTIN guidance — buy from GS1'],
              ['Black-box AI fixes', 'Every change previewed, reversible'],
              ['One-time audit', 'Continuous drift monitoring'],
            ].map(([o, f]) => (
              <div key={f} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--line-soft)' }}>
                <div style={{ padding: '18px 32px', color: 'var(--mute)', textDecoration: 'line-through', textDecorationColor: 'var(--line-soft)', fontSize: 14 }}>{o}</div>
                <div style={{ padding: '18px 32px', borderLeft: '1px solid var(--line)', fontSize: 14 }}>
                  {f}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="section" style={{ padding: 0 }}>
          <div style={{ padding: '40px 32px 20px' }}>
            <div className="eyebrow">pricing</div>
            <h2 className="hhead">Start free. Grow when it pays off.</h2>
          </div>
          <div className="pricing">
            {[
              ['Free', '£0', 'One scan. Public report. Email-gated full breakdown.', ''],
              ['Growth', '£49', 'All six pillars unlocked. Batch fixes. Weekly re-scan.', 'scanner price · £29'],
              ['Scale', '£149', 'Drift monitoring. Variant sampling. CSV export.', ''],
              ['Agency', '£399', 'Multi-store. Client-ready scorecards. Priority fixes.', 'enterprise from £499'],
            ].map(([t, p, c, b]) => (
              <div key={t}>
                <div className="tier">{t.toLowerCase()}</div>
                <div className="price">{p}<span style={{ fontSize: 12, color: 'var(--mute)', marginLeft: 6 }}>/mo</span></div>
                <p className="copy">{c}</p>
                {b && <div className="chip acc" style={{ marginBottom: 12 }}>{b}</div>}
                <span className="btn filled">choose</span>
              </div>
            ))}
          </div>
        </div>

        {/* Manifesto */}
        <div className="section dark" style={{ padding: mobile ? '48px 18px' : '96px 40px' }}>
          <div className="eyebrow" style={{ color: 'var(--mute-2)' }}>the shape of it</div>
          <h2 className="hhead" style={{ fontSize: mobile ? 28 : 52, maxWidth: '26ch', lineHeight: 1.05, color: 'var(--paper)' }}>
            Commerce is being re-plumbed. Most Shopify stores aren't ready. We make them ready.
          </h2>
          <div className="row" style={{ marginTop: 28, gap: 12 }}>
            <span className="w-cta accent">scan my store →</span>
          </div>
        </div>

        {/* Footer */}
        <div className="section" style={{ padding: '28px 32px', background: 'var(--paper-3)', borderBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 11, color: 'var(--mute)' }}>
            <div className="mono">flintmere ltd · reg. 14338902</div>
            <div className="mono">privacy · terms · contact · © 2026</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.MarketingA = MarketingA;
window.MarketingB = MarketingB;
