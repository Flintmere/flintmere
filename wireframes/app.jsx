// Merchant app — app.flintmere.com — 2 variants
// Shopify admin-native feel WITHOUT copying Polaris components. Generic patterns: sidebar, tables, cards.

function AdminTop({ variant }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 11 }}>
      <div className="row" style={{ gap: 14 }}>
        <span className="mono" style={{ color: 'var(--mute)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>shopify admin</span>
        <span style={{ color: 'var(--mute)' }}>/</span>
        <span>apps</span>
        <span style={{ color: 'var(--mute)' }}>/</span>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14 }}>flintmere</span>
      </div>
      <div className="row" style={{ gap: 12, color: 'var(--mute)' }}>
        <span>meridian-supplements.myshopify.com</span>
        <span className="pill">store · plus</span>
      </div>
    </div>
  );
}

function AdminSide({ active = 'dashboard' }) {
  const items = [
    ['dashboard', 'Dashboard', ''],
    ['issues', 'Issues', '18'],
    ['history', 'Fix History', ''],
    ['channel', 'Channel Health', ''],
    ['settings', 'Settings', ''],
  ];
  return (
    <div className="admin-side">
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, padding: '0 8px 10px' }}>flintmere</div>
      <div style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 8px 10px' }}>
        ai-readiness
      </div>
      <div className="group">
        {items.map(([id, label, n]) => (
          <a key={id} className={active === id ? 'on' : ''} href="#">
            <span>{label}</span>
            {n && <span className="mini">{n}</span>}
          </a>
        ))}
      </div>
      <div className="group">
        <h5>resources</h5>
        <a><span>GTIN guide</span></a>
        <a><span>Docs</span></a>
        <a><span>Changelog</span></a>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 20, fontSize: 10, color: 'var(--mute)' }}>
        v1.4.2 · last scan 4h ago
      </div>
    </div>
  );
}

// ============ APP VARIANT A — Conventional admin dashboard ============
function AppA({ mobile, width }) {
  return (
    <div className={`frame ${mobile ? 'mobile' : ''}`} style={{ width: width || 'auto' }}>
      <div className="frame-bar">
        <span className="dots"><i /><i /><i /></span>
        <span>app.flintmere.com · embedded · variant A — conventional admin</span>
        <span>{mobile ? '390' : '1440'}</span>
      </div>
      <AdminTop />
      <div className="admin">
        <AdminSide active="dashboard" />
        <div className="admin-main">
          <div className="anno tr">conventional admin: topbar → title → score → cards → issues table.</div>
          <div className="admin-head">
            <div>
              <div className="eyebrow">overview</div>
              <h2 className="hhead" style={{ fontSize: 26 }}>AI-readiness</h2>
              <div className="sub">312 products scanned · last scan 4h ago · next auto-scan in 20h</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="btn">Export PDF</span>
              <span className="btn filled">Re-scan catalog</span>
            </div>
          </div>

          {/* Big score card */}
          <div className="big-score-card">
            <div className="mini-ring">
              <div className="n">64</div>
            </div>
            <div>
              <div className="eyebrow">your readiness · grade C</div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, margin: '6px 0 8px' }}>Partially visible to AI shopping agents.</div>
              <div className="pills">
                <span className="pill">percentile 38 · supplements UK</span>
                <span className="pill accent">3 critical · 5 high</span>
                <span className="pill">+4 since last scan</span>
              </div>
            </div>
            <div>
              <div className="eyebrow">channel health · 30d</div>
              <div className="channel-health" style={{ marginTop: 8 }}>
                <div className="ch-row"><span className="k">agent clicks</span><span className="v">12,408</span></div>
                <div className="ch-row"><span className="k">attributed orders</span><span className="v">342</span></div>
                <div className="ch-row"><span className="k">attributed revenue</span><span className="v">£28,910</span></div>
              </div>
            </div>
          </div>

          {/* Pillar cards horizontal */}
          <div style={{ marginTop: 18 }}>
            <div className="eyebrow">six pillars</div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(6, 1fr)', gap: 0, border: '1px solid var(--line)', marginTop: 6 }}>
              {[
                ['01', 'Identifier', 58, 'critical'],
                ['02', 'Attribute', 62, 'warn'],
                ['03', 'Title/desc', 84, 'ok'],
                ['04', 'Mapping', 71, 'warn'],
                ['05', 'Consistency', 88, 'ok'],
                ['06', 'Checkout', 92, 'ok'],
              ].map(([n, name, s, st], i) => (
                <div key={n} style={{ padding: 14, borderLeft: i === 0 ? 0 : '1px solid var(--line)' }}>
                  <div className="pn" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{n} {st === 'critical' ? '· !' : ''}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{name}</div>
                  <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, color: st === 'critical' ? 'var(--accent)' : st === 'warn' ? 'var(--warn)' : 'var(--ink)' }}>{s}</div>
                  <div className="pbar" style={{ height: 3, background: 'var(--line-soft)', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${s}%`, background: st === 'critical' ? 'var(--accent)' : st === 'warn' ? 'var(--warn)' : 'var(--ink)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical issues list */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <h4 style={{ margin: 0 }}>critical issues · top 5</h4>
              <span className="mono" style={{ fontSize: 10, color: 'var(--accent)' }}>ranked by revenue × deficit</span>
            </div>
            <table className="tbl" style={{ marginTop: 0 }}>
              <thead>
                <tr><th>Issue</th><th style={{ width: 110 }}>Pillar</th><th style={{ width: 90 }}>Products</th><th style={{ width: 110 }}>Severity</th><th style={{ width: 130 }}></th></tr>
              </thead>
              <tbody>
                {[
                  ['Missing GTINs', '01 Identifier', '412', 'critical'],
                  ['Attribute gaps: material', '02 Attribute', '188', 'high'],
                  ['Image alt text missing', '02 Attribute', '22', 'high'],
                  ['Title keyword stuffing', '03 Title/desc', '12', 'medium'],
                  ['Category mapping gaps', '04 Mapping', '58', 'medium'],
                ].map(([t, p, n, sv]) => (
                  <tr key={t}>
                    <td>{t}</td>
                    <td className="mono" style={{ color: 'var(--mute)' }}>{p}</td>
                    <td className="mono">{n}</td>
                    <td><span className={`pill ${sv === 'critical' ? 'accent' : ''}`}>{sv}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="btn tiny">Review fixes →</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent activity + GTIN nudge */}
          <div className="two-col" style={{ marginTop: 18 }}>
            <div className="card">
              <h4>recent fixes</h4>
              <table className="tbl" style={{ marginTop: 0 }}>
                <tbody>
                  <tr><td className="mono" style={{ color: 'var(--mute)' }}>apr 18</td><td>Image alt text filled</td><td className="mono">38 products</td></tr>
                  <tr><td className="mono" style={{ color: 'var(--mute)' }}>apr 17</td><td>Attribute batch: colour</td><td className="mono">112 products</td></tr>
                  <tr><td className="mono" style={{ color: 'var(--mute)' }}>apr 15</td><td>GTIN import (GS1 UK)</td><td className="mono">208 products</td></tr>
                </tbody>
              </table>
            </div>
            <div className="card">
              <h4>gtin guidance · uk</h4>
              <div style={{ fontSize: 12 }}>412 products missing GTINs.</div>
              <p style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 6 }}>
                We do not sell barcodes. Purchase from GS1 UK — prefix licences scale with catalog size.
                We can import and map your purchased GTINs to SKUs in bulk.
              </p>
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <span className="btn">GS1 UK guide →</span>
                <span className="btn filled">Import GTIN CSV</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 10 }}>
                We are not affiliated with GS1. Barcode requirements vary by marketplace.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ APP VARIANT B — Issue detail + auto-fix flow ============
function AppB({ mobile, width }) {
  return (
    <div className={`frame ${mobile ? 'mobile' : ''}`} style={{ width: width || 'auto' }}>
      <div className="frame-bar">
        <span className="dots"><i /><i /><i /></span>
        <span>app.flintmere.com · issue detail — variant B</span>
        <span>{mobile ? '390' : '1440'}</span>
      </div>
      <AdminTop />
      <div className="admin">
        <AdminSide active="issues" />
        <div className="admin-main">
          <div className="anno tl">issue detail view. preview-fix-apply loop.</div>
          <div style={{ fontSize: 11, color: 'var(--mute)' }}>
            <span>Issues</span> <span>›</span> <span>Attribute</span> <span>›</span> <span style={{ color: 'var(--ink)' }}>Image alt text missing</span>
          </div>
          <div className="admin-head" style={{ marginTop: 6 }}>
            <div>
              <div className="row" style={{ gap: 10, marginBottom: 6 }}>
                <span className="pill accent">high severity</span>
                <span className="pill">02 attribute</span>
                <span className="mono" style={{ color: 'var(--mute)', fontSize: 10 }}>F-03</span>
              </div>
              <h2 className="hhead" style={{ fontSize: 26 }}>Missing image alt text on 22 products</h2>
              <div className="sub" style={{ maxWidth: '68ch', marginTop: 6 }}>
                Visual descriptors help AI agents disambiguate product variants. Our model will draft
                alt text from product metadata — you approve or edit before anything ships.
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="btn">Skip for now</span>
              <span className="btn accent">Apply fix →</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabbar">
            <div className="t on">Affected products</div>
            <div className="t">Preview fix</div>
            <div className="t">History</div>
            <div className="t">Rules</div>
          </div>

          {/* Preview fix content */}
          <div style={{ marginTop: 18 }}>
            <div className="anno mr">before/after, 5 samples. one checkbox, one button. no surprises.</div>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="eyebrow">preview fix · 5 of 22 samples</div>
              <div className="row" style={{ gap: 10, fontSize: 11 }}>
                <span className="mono" style={{ color: 'var(--mute)' }}>confidence threshold</span>
                <span className="pill">≥ 90%</span>
                <span className="mono" style={{ color: 'var(--mute)' }}>model</span>
                <span className="pill">claude-haiku-4-5</span>
              </div>
            </div>

            {/* Before/after table */}
            <div style={{ border: '1px solid var(--line)', marginTop: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1.1fr 1.4fr 80px', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--mute)' }}>
                <div>image</div>
                <div>product · before</div>
                <div>suggested alt · after</div>
                <div style={{ textAlign: 'right' }}>conf.</div>
              </div>
              {[
                ['Ashwagandha Capsules · 60ct', '(empty)', 'Bottle of 60 ashwagandha root extract capsules, 500mg each, amber glass with white label', '96%'],
                ['Magnesium Glycinate · 120ct', 'bottle', 'White HDPE bottle of 120 magnesium glycinate tablets, 200mg, front label facing', '94%'],
                ['Vitamin D3 + K2 Drops · 30ml', 'Vitamin D3 K2', '30ml amber dropper bottle of vitamin D3 2000IU plus K2 100mcg liquid, front label', '97%'],
                ['Electrolyte Hydration Mix · 30 sachets', 'Electrolyte', 'Box of 30 citrus-flavoured electrolyte hydration sachets, front-facing product box', '91%'],
                ['Collagen Peptides · 500g', 'collagen', 'Matte white tub of 500g grass-fed collagen peptides powder with scoop included', '95%'],
              ].map(([name, before, after, conf], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1.1fr 1.4fr 80px', padding: '12px 14px', borderBottom: '1px solid var(--line-soft)', alignItems: 'center', fontSize: 11.5 }}>
                  <div className="placeholder" style={{ height: 44, width: 44 }}>img</div>
                  <div>
                    <div style={{ fontSize: 12 }}>{name}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', marginTop: 2 }}>was: "{before}"</div>
                  </div>
                  <div style={{ color: 'var(--ink-2)' }}>
                    <span className="acc">→ </span>{after}
                  </div>
                  <div className="mono" style={{ textAlign: 'right', color: 'var(--accent)' }}>{conf}</div>
                </div>
              ))}
              <div style={{ padding: '12px 14px', fontSize: 11, color: 'var(--mute)' }}>
                · 17 more products with suggested alt text above 90% confidence.
              </div>
            </div>
          </div>

          {/* Apply bar */}
          <div style={{ border: '1px solid var(--ink)', padding: 16, marginTop: 20, background: 'var(--paper)' }}>
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div className="row" style={{ gap: 10 }}>
                  <input type="checkbox" defaultChecked style={{ width: 14, height: 14 }} />
                  <div style={{ fontSize: 13 }}>Apply to all 22 products with confidence ≥ 90%</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--mute)', marginLeft: 24, marginTop: 4 }}>
                  Dry-run first. 5 will be queued for human review. Fully reversible from Fix History.
                </div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="btn">Dry-run</span>
                <span className="btn accent">Apply fix to 22 products →</span>
              </div>
            </div>
          </div>

          {/* Fix history preview */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h4 style={{ margin: 0 }}>recent batches · fix history</h4>
              <span className="mono" style={{ fontSize: 10, color: 'var(--mute)' }}>every change is reversible</span>
            </div>
            <table className="tbl">
              <thead>
                <tr><th>Date</th><th>Change type</th><th>User</th><th>Products</th><th>Confidence</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mono">apr 18 · 10:22</td>
                  <td>Image alt text</td>
                  <td>r.oduya</td>
                  <td className="mono">38</td>
                  <td className="mono">≥ 92%</td>
                  <td><span className="pill">applied</span></td>
                  <td style={{ textAlign: 'right' }}><span className="btn tiny">Revert batch</span></td>
                </tr>
                <tr>
                  <td className="mono">apr 17 · 16:04</td>
                  <td>Attribute: colour</td>
                  <td>r.oduya</td>
                  <td className="mono">112</td>
                  <td className="mono">≥ 90%</td>
                  <td><span className="pill">applied</span></td>
                  <td style={{ textAlign: 'right' }}><span className="btn tiny">Revert batch</span></td>
                </tr>
                <tr>
                  <td className="mono">apr 15 · 09:47</td>
                  <td>GTIN import (GS1 UK)</td>
                  <td>b.larkspur</td>
                  <td className="mono">208</td>
                  <td className="mono">user-provided</td>
                  <td><span className="pill">applied</span></td>
                  <td style={{ textAlign: 'right' }}><span className="btn tiny">Revert batch</span></td>
                </tr>
                <tr>
                  <td className="mono">apr 14 · 14:12</td>
                  <td>Title rewrites</td>
                  <td>r.oduya</td>
                  <td className="mono">12</td>
                  <td className="mono">≥ 88%</td>
                  <td><span className="pill ghost">reverted</span></td>
                  <td style={{ textAlign: 'right' }}><span className="btn tiny" style={{ opacity: 0.5 }}>Revert batch</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 18, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            nothing ships silently · everything is reversible · log exported weekly
          </div>
        </div>
      </div>
    </div>
  );
}

window.AppA = AppA;
window.AppB = AppB;
