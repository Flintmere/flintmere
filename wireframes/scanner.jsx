// Scanner — audit.flintmere.com — 2 variants, terminal/technical mono-heavy

function SNav() {
  return (
    <div className="w-nav">
      <div className="wordmark">flintmere<span style={{ color: 'var(--mute)', marginLeft: 8, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}>/ audit</span></div>
      <div className="links"><span>how it works</span><span>pricing</span><span>research</span></div>
      <span className="w-cta ghost">book a demo</span>
    </div>
  );
}

// ============ VARIANT A — Terminal readout, full-bleed ============
function ScannerA({ mobile, width }) {
  return (
    <div className={`frame ${mobile ? 'mobile' : ''}`} style={{ width: width || 'auto' }}>
      <div className="frame-bar">
        <span className="dots"><i /><i /><i /></span>
        <span>audit.flintmere.com — variant A, terminal diagnostic</span>
        <span>{mobile ? '390' : '1440'}</span>
      </div>
      <div className="sections">
        <SNav />

        {/* Hero with input */}
        <div className="section" style={{ padding: mobile ? '26px 16px' : '48px 40px' }}>
          <div className="anno tr">terminal feel. URL + scan is the primary action, above the fold.</div>
          <div className="eyebrow">free scan · no install required · 60 seconds</div>
          <h1 className="hhead" style={{ fontSize: mobile ? 26 : 44, maxWidth: '18ch' }}>
            Is your Shopify catalog invisible to ChatGPT?
          </h1>
          <p className="lede" style={{ maxWidth: '54ch', marginTop: 14 }}>
            Paste your store URL. We read your sitemap, sample product pages, validate your structured
            data, and score six pillars of AI-readiness. No signup to start.
          </p>
          <div className="row" style={{ marginTop: 22, gap: 8, flexWrap: 'wrap' }}>
            <span className="mono" style={{ color: 'var(--mute)', fontSize: 11 }}>$</span>
            <input className="input" placeholder="https://yourstore.myshopify.com" style={{ maxWidth: 360 }} />
            <span className="w-cta accent">scan my store →</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            60s · no signup · works on any shopify store
          </div>
        </div>

        {/* Stats strip */}
        <div className="stats">
          <div className="stat"><div className="num">15×</div><div className="lab">yoy growth, agent orders</div></div>
          <div className="stat"><div className="num">40<span style={{ fontSize: 18 }}>%</span></div><div className="lab">invisible to agents</div></div>
          <div className="stat"><div className="num">5.6<span style={{ fontSize: 18 }}>m</span></div><div className="lab">stores auto-enrolled</div></div>
          <div className="stat"><div className="num">3–4×</div><div className="lab">lift at 99% attribute</div></div>
        </div>

        {/* Terminal progress */}
        <div className="terminal">
          <div className="anno ml" style={{ color: 'var(--accent)' }}>scan state · what users see live.</div>
          <div style={{ color: 'var(--accent)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
            scan.in-progress · meridian-supplements.myshopify.com
          </div>
          <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>fetching product feed</span><span style={{ marginLeft: 'auto' }} className="ok">done · 312 products</span></div>
          <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>parsing sitemap for coverage</span><span style={{ marginLeft: 'auto' }} className="ok">done · 4 sitemaps</span></div>
          <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>pulling sample product pages</span><span style={{ marginLeft: 'auto' }} className="ok">done · 128 sampled</span></div>
          <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>extracting JSON-LD structured data</span><span style={{ marginLeft: 'auto' }} className="ok">done</span></div>
          <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>validating GTIN checksums</span><span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>412 missing</span></div>
          <div className="row"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>analyzing title + description quality</span><span style={{ marginLeft: 'auto' }} className="muted">running</span><span className="cursor" /></div>
          <div className="row muted"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>checking attribute completeness</span><span style={{ marginLeft: 'auto' }}>queued</span></div>
          <div className="row muted"><span className="prompt">→</span><span style={{ marginLeft: 8 }}>computing AI-readiness score</span><span style={{ marginLeft: 'auto' }}>queued</span></div>
        </div>

        {/* Score result */}
        <div className="score-card">
          <div className="anno tl">the result. circular, serif number, one coloured arc.</div>
          <div className="score-ring">
            <div className="of">/ 100 · ai-readiness</div>
            <div className="n">64</div>
          </div>
          <div>
            <div className="eyebrow">your result · grade C · supplements vertical</div>
            <h2 className="hhead" style={{ fontSize: mobile ? 22 : 30, maxWidth: '22ch' }}>
              Your catalog is partially invisible to AI shopping agents.
            </h2>
            <p className="lede sm" style={{ marginTop: 10, maxWidth: '52ch' }}>
              312 products scanned. You rank in the <b>38th percentile</b> vs other UK supplements
              stores on Shopify Plus. The biggest lift is in identifier completeness and attribute
              coverage — addressable in ~3 hours of work.
            </p>
            <div className="pills" style={{ marginTop: 14 }}>
              <span className="pill">grade C</span>
              <span className="pill ghost">percentile 38</span>
              <span className="pill accent">3 critical issues</span>
              <span className="pill">last scan · 00:00:47 ago</span>
            </div>
          </div>
        </div>

        {/* Pillar grid — 3 locked */}
        <div>
          <div style={{ padding: '22px 24px 8px', borderTop: '1px solid var(--line)' }}>
            <div className="anno tr">3 pillars locked behind install. funnel into app.</div>
            <div className="eyebrow">pillar breakdown</div>
            <h3 className="hhead" style={{ fontSize: 22 }}>Six pillars · three revealed, three on install.</h3>
          </div>
          <div className="pillar-grid">
            <div className="pillar-cell">
              <div className="pn">01 · 22% weight</div>
              <div className="pname">Identifier completeness</div>
              <div className="pbar"><span style={{ width: '58%' }} /></div>
              <div style={{ fontSize: 11, color: 'var(--mute)' }}>412 of 312 products missing GTINs. No MPN fallback.</div>
            </div>
            <div className="pillar-cell">
              <div className="pn">02 · 22% weight</div>
              <div className="pname">Attribute completeness</div>
              <div className="pbar"><span style={{ width: '62%' }} /></div>
              <div style={{ fontSize: 11, color: 'var(--mute)' }}>62% of attributes filled across sampled products.</div>
            </div>
            <div className="pillar-cell">
              <div className="pn">03 · 18% weight</div>
              <div className="pname">Title & description quality</div>
              <div className="pbar"><span style={{ width: '84%' }} /></div>
              <div style={{ fontSize: 11, color: 'var(--mute)' }}>Good. 12 products flagged for keyword stuffing.</div>
            </div>
            <div className="pillar-cell locked">
              <span className="lock">🔒 install to unlock</span>
              <div className="pn">04 · 16% weight</div>
              <div className="pname">Catalog mapping coverage</div>
              <div className="pbar"><span style={{ width: '40%', background: 'var(--mute-2)' }} /></div>
              <div style={{ fontSize: 11 }}>Google / Microsoft taxonomy mapping.</div>
            </div>
            <div className="pillar-cell locked">
              <span className="lock">🔒 install to unlock</span>
              <div className="pn">05 · 12% weight</div>
              <div className="pname">Consistency & integrity</div>
              <div className="pbar"><span style={{ width: '40%', background: 'var(--mute-2)' }} /></div>
              <div style={{ fontSize: 11 }}>Drift, duplicates, channel variance.</div>
            </div>
            <div className="pillar-cell locked">
              <span className="lock">🔒 install to unlock</span>
              <div className="pn">06 · 10% weight</div>
              <div className="pname">AI checkout eligibility</div>
              <div className="pbar"><span style={{ width: '40%', background: 'var(--mute-2)' }} /></div>
              <div style={{ fontSize: 11 }}>Returns, payments, shipping signals.</div>
            </div>
          </div>
        </div>

        {/* Critical issues */}
        <div>
          <div style={{ padding: '22px 24px 8px', borderTop: '1px solid var(--line)' }}>
            <div className="anno tl">ranked by revenue × score. plain english.</div>
            <div className="eyebrow">critical issues · ranked by revenue impact</div>
          </div>
          <div className="issue-list">
            <div className="issue">
              <div className="sev" />
              <div>
                <div className="ttl">Missing GTINs on 412 products</div>
                <div className="desc">Products without GS1-registered barcodes are excluded from agent matching. Affects your top 4 revenue categories.</div>
              </div>
              <div className="ct">critical · 412 products</div>
            </div>
            <div className="issue">
              <div className="sev high" />
              <div>
                <div className="ttl">Attribute gaps on 188 products</div>
                <div className="desc">Missing material, size, or use-case. Agents can't reason about fit for user intent.</div>
              </div>
              <div className="ct">high · 188 products</div>
            </div>
            <div className="issue">
              <div className="sev high" />
              <div>
                <div className="ttl">No image alt text on 22 products</div>
                <div className="desc">Visual descriptors help agents disambiguate variants.</div>
              </div>
              <div className="ct">high · 22 products</div>
            </div>
            <div className="issue">
              <div className="sev med" />
              <div>
                <div className="ttl">Keyword stuffing on 12 titles</div>
                <div className="desc">Flagged as low quality by agent ranking. Suggested rewrites available.</div>
              </div>
              <div className="ct">medium · 12 products</div>
            </div>
          </div>
        </div>

        {/* Email gate */}
        <div className="email-gate">
          <div className="anno mr" style={{ color: 'var(--accent)' }}>deep green panel. the gate.</div>
          <div>
            <div className="eyebrow" style={{ color: 'var(--mute-2)' }}>unlock the full report</div>
            <h3 className="hhead" style={{ fontSize: mobile ? 22 : 30 }}>Get the full report — free.</h3>
            <ul>
              <li>Full catalog mapping coverage</li>
              <li>Consistency & integrity details</li>
              <li>Agentic readiness checklist</li>
              <li>Per-product CSV export</li>
              <li>Vertical benchmark · supplements UK</li>
            </ul>
          </div>
          <div className="form">
            <input placeholder="you@meridian-supplements.com" />
            <span className="w-cta accent" style={{ justifyContent: 'center', textAlign: 'center' }}>send me the full report →</span>
            <div style={{ fontSize: 10, color: 'var(--mute-2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              no spam. unsubscribe in one click.
            </div>
          </div>
        </div>

        {/* Shareable badge */}
        <div className="section">
          <div className="anno ml">social share moment. one-way referral.</div>
          <div className="eyebrow">share your score</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 24, alignItems: 'center' }}>
            <div>
              <h3 className="hhead" style={{ fontSize: 22 }}>Share your score on LinkedIn — unlock 7 days of Growth free.</h3>
              <p className="lede sm">An honest score is worth a post. We generate a shareable badge with your grade, rank, and a link back to a fresh scan.</p>
              <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <span className="btn">copy link</span>
                <span className="btn">share · X</span>
                <span className="btn filled">share · LinkedIn</span>
              </div>
            </div>
            <div className="placeholder" style={{ height: 200 }}>
              shareable badge preview · 1200×630
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="section" style={{ background: 'var(--paper-2)' }}>
          <div className="eyebrow">how it works</div>
          <h3 className="hhead" style={{ fontSize: 24 }}>Diagnose. Fix. Monitor.</h3>
          <div className="three-col" style={{ marginTop: 18 }}>
            {[
              ['01 Diagnose', 'A 60-second scan of your public catalog. Six pillars, one score, a ranked issues list.'],
              ['02 Fix', 'Install the Shopify app to apply every fix with preview and rollback. Nothing ships silently.'],
              ['03 Monitor', 'Daily re-scans. Drift alerts. Channel-health dashboard tied to agent-attributed orders.'],
            ].map(([t, d]) => (
              <div key={t}>
                <div className="eyebrow">{t.split(' ')[0]}</div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 20, margin: '4px 0 8px' }}>{t.split(' ').slice(1).join(' ')}</div>
                <div className="lede sm">{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="section" style={{ padding: '22px 24px', borderTop: '1px solid var(--line)', background: 'var(--ink)', color: 'var(--paper-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: 11 }}>
            <div>flintmere · audit</div>
            <div>privacy · terms · contact</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ VARIANT B — Report-style, score-first ============
function ScannerB({ mobile, width }) {
  return (
    <div className={`frame ${mobile ? 'mobile' : ''}`} style={{ width: width || 'auto' }}>
      <div className="frame-bar">
        <span className="dots"><i /><i /><i /></span>
        <span>audit.flintmere.com — variant B, report-first</span>
        <span>{mobile ? '390' : '1440'}</span>
      </div>
      <div className="sections">
        <SNav />

        {/* Hero — minimal, one input */}
        <div className="section" style={{ padding: mobile ? '26px 16px' : '60px 40px', textAlign: mobile ? 'left' : 'center' }}>
          <div className="anno tl">report-first. score is the whole UI; marketing wraps it.</div>
          <div className="eyebrow">free scan · 60 seconds · no install</div>
          <h1 className="hhead" style={{ fontSize: mobile ? 26 : 52, maxWidth: '20ch', margin: mobile ? '0 0 14px' : '0 auto 14px' }}>
            Score your store. See what agents see.
          </h1>
          <p className="lede" style={{ maxWidth: '56ch', margin: mobile ? 0 : '0 auto' }}>
            One URL. Six pillars. A number out of 100 you can defend to your CFO.
          </p>
          <div className="row" style={{ marginTop: 22, gap: 10, justifyContent: mobile ? 'flex-start' : 'center', flexWrap: 'wrap' }}>
            <input className="input" placeholder="yourstore.myshopify.com" style={{ maxWidth: 340 }} />
            <span className="w-cta accent">run scan →</span>
          </div>
        </div>

        {/* Report header — mock report styling */}
        <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--line)', padding: mobile ? '24px 16px' : '40px 40px' }}>
          <div className="anno tr">this is the "report" aesthetic. header block like a consultancy PDF.</div>
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr auto', gap: 20, alignItems: 'end', paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
            <div>
              <div className="eyebrow">ai-readiness report · v1.0</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: mobile ? 24 : 32, letterSpacing: '-0.02em' }}>
                meridian-supplements.myshopify.com
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--mute)', marginTop: 4 }}>
                scan id: 9f3a-88e1 · 2026-04-19 14:22 UTC · 312 products · 128 sampled
              </div>
            </div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: mobile ? 'left' : 'right' }}>
              flintmere / audit<br />
              issued by flintmere ltd
            </div>
          </div>

          {/* Giant number + breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1.4fr', gap: 30, marginTop: 30, alignItems: 'center' }}>
            <div style={{ textAlign: mobile ? 'left' : 'center' }}>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: mobile ? 120 : 200, letterSpacing: '-0.05em', lineHeight: 0.9, color: 'var(--accent)' }}>
                64
              </div>
              <div className="eyebrow" style={{ marginTop: 6 }}>out of 100 · grade C</div>
            </div>
            <div>
              <div className="eyebrow">headline</div>
              <h2 className="hhead" style={{ fontSize: mobile ? 22 : 32, maxWidth: '22ch' }}>
                Partially invisible. Addressable in roughly three hours of work.
              </h2>
              <p className="lede sm" style={{ marginTop: 10 }}>
                Your catalog ranks in the 38th percentile for UK supplements stores on Shopify Plus.
                The biggest lift is in identifier completeness (GTINs) and attribute coverage.
              </p>
            </div>
          </div>
        </div>

        {/* Tabular pillar readout */}
        <div style={{ padding: mobile ? '20px 16px' : '28px 40px', borderTop: '1px solid var(--line)' }}>
          <div className="eyebrow">pillar readout</div>
          <table className="tbl" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Pillar</th>
                <th style={{ width: 70 }}>Weight</th>
                <th style={{ width: 60 }}>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['01', 'Identifier completeness', '22%', '58', 'critical — 412 missing GTINs', 'open'],
                ['02', 'Attribute completeness', '22%', '62', 'gaps on 188 products', 'open'],
                ['03', 'Title & description quality', '18%', '84', '12 flagged for stuffing', 'open'],
                ['04', 'Catalog mapping coverage', '16%', '—', '🔒 install to unlock', 'locked'],
                ['05', 'Consistency & integrity', '12%', '—', '🔒 install to unlock', 'locked'],
                ['06', 'AI checkout eligibility', '10%', '—', '🔒 install to unlock', 'locked'],
              ].map(([n, p, w, s, st, t]) => (
                <tr key={n} style={{ color: t === 'locked' ? 'var(--mute)' : 'var(--ink)' }}>
                  <td className="mono">{n}</td>
                  <td>{p}</td>
                  <td className="mono">{w}</td>
                  <td className="mono" style={{ color: t === 'locked' ? 'var(--mute)' : 'var(--accent)', fontSize: 15, fontFamily: 'Space Grotesk, sans-serif' }}>{s}</td>
                  <td>{st}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Issues as report entries */}
        <div style={{ padding: mobile ? '20px 16px' : '28px 40px', borderTop: '1px solid var(--line)', background: 'var(--paper-2)' }}>
          <div className="anno mr">numbered issue entries, like a consulting report.</div>
          <div className="eyebrow">prioritised findings</div>
          {[
            ['F-01', 'critical', 'Missing GTINs on 412 products', 'Products without GS1-registered barcodes are excluded from agent matching. Affects top 4 revenue categories.', '~2h w/ bulk GTIN import'],
            ['F-02', 'high', 'Attribute gaps on 188 products', 'Missing material, size, or use-case fields. Agents cannot reason about user intent.', '~45m w/ guided completion'],
            ['F-03', 'high', 'No image alt text on 22 products', 'Visual descriptors help agents disambiguate variants.', '~10m, auto-generate'],
            ['F-04', 'medium', 'Keyword stuffing on 12 titles', 'Flagged as low-quality by agent ranking. Suggested rewrites available.', '~15m review'],
          ].map(([id, sev, t, d, fix]) => (
            <div key={id} style={{ padding: '16px 0', borderBottom: '1px solid var(--line-soft)' }}>
              <div className="row" style={{ gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span className="mono" style={{ color: 'var(--mute)', fontSize: 11 }}>{id}</span>
                <span className={`pill ${sev === 'critical' ? 'accent' : ''}`}>{sev}</span>
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18 }}>{t}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 6, maxWidth: '76ch' }}>{d}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', marginTop: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                estimated remediation: {fix}
              </div>
            </div>
          ))}
        </div>

        {/* Email gate — more restrained */}
        <div className="email-gate">
          <div>
            <div className="eyebrow" style={{ color: 'var(--mute-2)' }}>report · full version</div>
            <h3 className="hhead" style={{ fontSize: 26 }}>Send me the full report — free.</h3>
            <p style={{ fontSize: 11.5, color: 'var(--mute-2)', marginTop: 6 }}>
              Signed PDF. Per-product CSV. Full pillar breakdown. Vertical benchmark.
            </p>
          </div>
          <div className="form">
            <input placeholder="you@meridian-supplements.com" />
            <div className="row" style={{ gap: 8 }}>
              <span className="w-cta accent" style={{ flex: 1, justifyContent: 'center' }}>send the report →</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--mute-2)' }}>no spam. unsubscribe in one click.</div>
          </div>
        </div>

        {/* Footer */}
        <div className="section" style={{ padding: '22px 24px', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--mute)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>flintmere · audit · scan id 9f3a-88e1</div>
            <div>privacy · terms · contact · © 2026 flintmere ltd</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScannerA = ScannerA;
window.ScannerB = ScannerB;
