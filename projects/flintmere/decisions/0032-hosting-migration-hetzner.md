# ADR 0032 — Hosting moved to Hetzner Cloud (Nuremberg), and the sub-processor notice that was never sent

- **Status:** Accepted — recording, after the fact, a migration that had already happened in infrastructure and nowhere in this repository
- **Date:** 2026-11-09
- **Number note:** Verified against `origin/main`, not the working tree — per the numbering-collision lesson recorded in ADRs 0027, 0028, 0029, 0030 and 0031. `origin/main` carries 0001–0031 (0012 and 0014 absent, the index gap already flagged in `decisions/README.md`); 0032 is the next free number.
- **Council pre-flight (binding 2026-05-09):** `decisions/README.md` — ADR conventions and the index gap, per `canon-source-register.md` §A13. `decisions/0002-coolify-on-do.md` §Decision, §Tradeoffs accepted and §Re-open conditions — the ADR this one supersedes, and the three tradeoffs the new server resolves outright. `memory/compliance-risk/jurisdictions.md` §Data residency — the table this ADR corrects, and its line "UK → EU covered by UK's adequacy decision for EEA", which is why a German region needs no new transfer instrument. (§A13 also names `memory/VOICE.md`; checked, no banned phrase in this record.)
- **Supersedes:** ADR 0002 on the **hosting vendor, region, server spec and backup target only**. ADR 0002's single-server Coolify posture, its Docker + Traefik + Let's Encrypt layer, its "build images in GitHub Actions, never on the box" rule, and its `prisma migrate deploy`-at-container-start consequence all remain authoritative.
- **Affects:** `apps/scanner/src/app/privacy/page.tsx` (sub-processor list), `apps/scanner/src/app/security/page.tsx` (Clause 08), `memory/compliance-risk/jurisdictions.md`, `memory/compliance-risk/platform-rules.md`, `memory/compliance-risk/incident-disclosure.md`, `memory/admin-ops/vendor-register.md`, `memory/admin-ops/ops-calendar.md`, `projects/flintmere/STATUS.md`, `PROJECT.md`, `GLOSSARY.md`, `SPEC.md`, `CLAUDE.md`, `SECURITY.md`, `README.md`, and five `.claude/skills/*` runbooks.
- **Existing customers:** none. Unchanged since ADR 0029. Flintmere has never taken a payment from a third party; the three `ConciergeAudit` rows marked `paid` remain operator test transactions. **That is the only reason §3 below is a process failure and not a breach of contract.**

## Context

Production moved from a DigitalOcean droplet to a Hetzner Cloud server at some point before 2026-11-09. The migration was never recorded: no ADR, no `STATUS.md` changelog entry, no vendor-register update, and no change to the three customer-facing surfaces that name the host.

It surfaced on 2026-11-09 from the wrong end — the operator noticed that `/privacy` and `/security` still named DigitalOcean. At that point every document in the repository still described the DO droplet, including two compliance records of record (`jurisdictions.md`, `vendor-register.md`) and the vendor register's own line *"Alternatives: Hetzner, Vultr, AWS Lightsail"*, which listed the vendor already in production as a rejected option.

### What was verified, and how

The hosting fact was established independently of the operator's report before anything was written:

- All four subdomains (`flintmere.com`, `catalog.flintmere.com`, `app.flintmere.com`, `standards.flintmere.com`) resolve to `178.105.38.117`.
- `whois` returns `Hetzner Online GmbH`, netname `CLOUD-NBG1`, country `DE`, address Gunzenhausen.
- Reverse DNS returns `static.117.38.105.178.clients.your-server.de` — Hetzner's own reverse-DNS domain.

Server identity, backup target, tenancy and DPA status came from the operator on 2026-11-09, as they live in the Hetzner and Coolify consoles rather than in the repository.

## Decision

**Production is a Hetzner Cloud server in Nuremberg. Record it, correct every surface that names the host, and treat the missed sub-processor notice as an open obligation rather than a closed one.**

| | ADR 0002 (superseded) | This ADR |
|---|---|---|
| Vendor | DigitalOcean, LLC (US-incorporated) | Hetzner Online GmbH (German-incorporated) |
| Region | `LON1` (London), `AMS3` failover | `NBG1` (Nuremberg), Germany |
| Server | Basic 4 vCPU / 8 GB shared vCPU | **CCX33**, 8 dedicated vCPU / 32 GB |
| Identity | — | `flintmere-prod`, server `#129742542`, `178.105.38.117` |
| Tenancy | shared with SalafiMasjid + pageperfect | **Flintmere only** |
| Off-site backups | DO Spaces, bucket `flintmere-backups`, `lon1` | Hetzner object storage |
| Transfer basis | UK → UK (domestic) | UK → EEA under the UK's adequacy decision |

Monthly cost is **not recorded** in this ADR or in the vendor register. The operator has not supplied it and Hetzner's price table is loaded client-side, so it is marked to-confirm rather than estimated. A guessed figure in a finance record is worse than an absent one.

## Rationale

The migration decision itself was the operator's and is not re-litigated here. What this ADR can say is which of ADR 0002's accepted tradeoffs the new server settles:

- **Shared-CPU variability** — ADR 0002 accepted this as "the tax for control", and mitigated it by building images in CI. CCX33 is dedicated vCPU, so the variability is gone at the source. The CI-build rule stays anyway: it is good practice independent of the cause.
- **8 GB RAM ceiling** — `STATUS.md` Known Issues flagged RAM as "still tight once shopify-app deploy adds 3 more services". 32 GB retires that concern.
- **Shared-fate risk across three unrelated projects** — the sharpest issue in the register, mitigated only partially in April 2026. A Flintmere-only box resolves it, which means the **Tier 1 promotion** from the 2026-04-25 tiered-infrastructure council session has in effect been executed. Reserved ADR 0014 was never written; it stays reserved, and this ADR notes its trigger has now fired.
- **Data residency** — ADR 0002 sold "our data stays in EU" to the #24 Data protection lens on the basis of a controllable region. That claim still holds, and is now stronger: the vendor is itself EU-incorporated, so the vendor-level US-parent question that DigitalOcean carried does not arise.

### What got worse

- **Region drifted from UK to EU.** ADR 0002 pinned London. Public copy said "UK region". A German region is covered by the UK's adequacy decision for the EEA per `jurisdictions.md`, so no SCC or new transfer instrument is needed — but "UK hosting" is no longer available as a sales answer, and the privacy page's "We host in the UK/EU" now rests entirely on the EU half. Left as written, because it is still true; flagged here so it is a decision and not an oversight.
- **A single-vendor concentration.** Host and off-site backups are now both Hetzner. Under DO they were one vendor too (droplet + Spaces), so this is not a regression — but the 3-2-1 posture's "off-site" leg no longer means "different vendor", and a Hetzner-account-level failure takes both copies' custodian with it.

## Consequences

### 1. DigitalOcean is no longer a sub-processor

Hosting and off-site backups are both Hetzner. DO is removed from the `/privacy` sub-processor list rather than retained for storage. Had backups still landed in DO Spaces, DO would have had to stay listed as backup storage — this was checked explicitly before the entry was removed.

### 2. A Hetzner DPA is not yet in place — open gap

The vendor register recorded *"DPA in place: yes (DO DPA)"*. The operator confirms on 2026-11-09 that **no Hetzner AV-Vertrag has been signed.**

This conflicts with a live promise. `/dpa` Clause 07 commits Flintmere to *"maintain a written agreement with each sub-processor requiring equivalent data protection obligations"*, and the hosting sub-processor is the one that holds all operational personal data. UK GDPR Article 28(4) requires the same. **Operator action: execute Hetzner's AV-Vertrag.** It is available in the Hetzner Cloud console under Legal and is self-serve; this is paperwork, not a negotiation.

### 3. The 30-day sub-processor notice was never sent

`/dpa` Clause 07 also commits to *"at least 30 days' notice of any new or replaced sub-processor via email to the Controller's billing contact"*, with a right to object and to terminate without penalty. Replacing DigitalOcean with Hetzner is squarely a *replaced sub-processor*. No notice was sent, and no record of one exists.

With no third-party merchants on the platform there was no controller to notify, so nothing was owed to anyone in fact. The failure is that the obligation was never evaluated. **This ADR is the control:** any future change of hosting, backup or LLM vendor evaluates Clause 07 before the change ships, not after someone reads a stale page. Recorded in `memory/CORRECTIONS.md`.

### 4. Public surfaces corrected

`/privacy` Clause 05 and `/security` Clause 08 now name Hetzner Online GmbH with the region, and both pages' `lastUpdated` moved to 2026-11-09 — the DPA declares those two pages canonical for Schedule 1 and Schedule 2 respectively, so a silent factual change would have left merchants no signal that the terms moved.

Two claims were checked and deliberately left alone, because they remain true with a German host: `/security` Clause 08's "no cross-region replication outside the UK/EU", and `/privacy` Clause 06's "most processing is within the UK/EU".

### 5. Historical records were not rewritten

`STATUS.md`'s dated changelog, ADR 0002's body, ADR 0013's resource-check notes and `plans/2026-08-26-catalog-host-shipment-2-plan.md` all still say DigitalOcean, correctly — they record what was true on their dates. Only current-state claims were corrected. A new `STATUS.md` changelog entry records the migration going forward.

### 6. A separate staleness, found in passing and not fixed here

`jurisdictions.md` says *"PostHog self-hosted on droplet"*. ADR 0025 moved PostHog to Cloud EU, and `/privacy` already describes it correctly as PostHog, Inc. with EU hosting. That line has been stale since ADR 0025, independently of this migration. Out of scope for this ADR; flagged for a `docs-coherence-audit` pass.

## Rollout

1. ✅ Public surfaces corrected (`/privacy`, `/security`), review dates bumped.
2. ✅ Current-state documentation corrected across 22 files; historical records left intact.
3. ✅ ADR 0002 marked superseded on the hosting axis; index row updated.
4. ⬜ **Operator:** execute Hetzner's AV-Vertrag, then set `DPA in place` in `vendor-register.md` with the date.
5. ⬜ **Operator:** confirm the CCX33 monthly cost; fill the vendor-register cost line and `finance-baseline.md`.
6. ⬜ **Operator:** confirm the old droplet is decommissioned and its Spaces bucket emptied, or record what still runs there. `134.122.102.159` was still in DigitalOcean address space on 2026-11-09; that proves nothing about the account, only about the netblock.
7. ⬜ Re-point BetterStack monitors if any were pinned to the old IP rather than the hostnames.

## Re-open conditions

- A merchant or prospect requires UK-resident hosting specifically — Hetzner has no UK region, so this becomes a vendor question, not a region question.
- The off-site backup leg moves to a second vendor, retiring the single-custodian concentration noted above.
- Coolify multi-server reaches GA with production stories (carried forward unchanged from ADR 0002).
- Any further change of hosting or backup vendor — at which point Clause 07's notice clock is evaluated **before** the change ships.
