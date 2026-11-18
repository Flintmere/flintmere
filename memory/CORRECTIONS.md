# CORRECTIONS

Append-only log of lessons from mistakes. When a rule here conflicts with a rule elsewhere, this file wins until the conflict is resolved in the canonical location.

## Format

```
## YYYY-MM-DD — Short title

**What happened:** one-paragraph description of the mistake.
**Root cause:** why it happened.
**Rule going forward:** the new rule, in imperative mood.
**Canonical home:** which other file this rule belongs in long-term (move it there and shorten this entry to a pointer).
```

## Entries

## 2026-11-09 — Infrastructure moved and nothing in the repository noticed, including a contractual notice clause

**What happened:** production hosting moved from a DigitalOcean droplet in London to a Hetzner
Cloud CCX33 in Nuremberg at some point before 2026-11-09. Nothing recorded it: no ADR, no
`STATUS.md` changelog entry, no vendor-register update. For an unknown period `/privacy` and
`/security` told merchants their data sat on "DigitalOcean (UK region)" while it sat in Germany,
and `vendor-register.md` recorded "DPA in place: yes (DO DPA)" for a vendor no longer in the
path. It surfaced only because the operator happened to read the pages. Worse than the stale
copy: `/dpa` Clause 07 promises 30 days' notice of any **replaced** sub-processor, and swapping
the host is exactly that — the clause was never evaluated. It was owed to nobody, because
Flintmere has no third-party merchants, so the only thing that saved it was having no customers.

**Root cause:** the previous entry in this file is about an ADR retiring something and the
selling artifacts not being swept. This is the mirror image, and it is worse: **there was no ADR
at all.** Every documentation trigger in this repo keys off a decision being *written down*
— `Affects:` lists, canon-source-register update triggers, deliverable-parity checks. An
infrastructure change made in a vendor console produces no commit, no PR and no ADR, so it
enters none of those sweeps. The repository can only notice changes that pass through it.

**Rule going forward:** a change made in a vendor console is not done until it is written down.
Before changing a host, a backup target, a region or an LLM provider, check `/dpa` Clause 07 and
`vendor-register.md` §Sub-processor disclosure **first** — the 30-day notice clock starts
before the change ships, not after someone reads a stale page. Then write the ADR in the same
session as the migration. When a vendor is replaced, grep the three customer-facing surfaces the
DPA declares canonical (`/privacy` Schedule 1, `/security` Schedule 2, `/dpa` itself) plus
`jurisdictions.md` and `vendor-register.md` before closing out. And when correcting records like
these afterwards, correct current-state claims only — dated changelog entries and superseded
ADR bodies are the record of what was true then, and rewriting them destroys the audit trail
that shows when the drift began.

**Canonical home:** `projects/flintmere/decisions/0032-hosting-migration-hetzner.md`
§Consequences (the ADR is the control) and `memory/admin-ops/vendor-register.md`
§Sub-processor disclosure. Shorten this entry to a pointer once a vendor change has gone
through the clause-first order successfully.

## 2026-11-09 — A cited source can exist, be readable, and still be false

**What happened:** `memory/canon-source-register.md` §A4 named
`data/recruitment/cold-email-template-2026-05-09.md` as the canonical outreach template
and instructed every outreach dispatch to "trace its DNA". Between May and November four
ADRs withdrew what that template sells — the £349/month retainer and the subscription
ladder (0029 §5), the estimated suppressed-revenue band (0030), the
`audit.flintmere.com` host and `/audit` route (0028), and the scan-and-show-the-merchant
acquisition mechanic (0031 §6) — plus Plausible as the tracker (0025). The template was
never touched. `data/recruitment/2026-05-10-message-variants.md` sat at
`status: ready to send` for six months carrying the same claims. Any dispatch that had
obeyed the binding would have produced copy with four retired claims in it, and would
have reported a clean pre-flight while doing so.

**Root cause:** the register's update triggers and the 2026-11-08 repair both check that a
cited file **exists**. Nothing checks whether it is still **true**. ADR consequences get
written in terms of code and public surfaces. An `Affects:` list names routes and
components, so the artifacts that *sell* the retired thing never enter the blast radius
anyone sweeps. A sales template is downstream of every pricing and positioning ADR
and upstream of nothing, so it is never the thing that breaks a build or a test.

**Rule going forward:** when an ADR retires an offer, a price, a claim, a host or a route,
sweep the artifacts that **sell** it in the same change as the code that serves it — grep
`data/recruitment/`, `context/outreach/` and any email or DM template for the retired
price, phrase, host and path. Retire a stale template by marking it, not by rewriting it:
a rewrite needs a live offer, and if there is no forward offer there is no copy to write.
Never leave `status: ready to send` on a file whose offer has been withdrawn — that string
is an instruction to a future dispatch.

**Canonical home:** `memory/canon-source-register.md` §Section C update triggers (added
2026-11-09) and §A4. Shorten this entry to a pointer once both have survived a monthly
audit.

## Changelog

- 2026-04-14: File created as part of `CLAUDE.md` refactor.
