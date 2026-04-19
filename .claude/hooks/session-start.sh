#!/usr/bin/env bash
# Flintmere session-start orientation.
# Prints a short preamble pointing at the load map.
# Read-only. No network calls. No mutations. Idempotent.

set -euo pipefail

cat <<'EOF'
[Flintmere — session start]

Load map (read on demand):
- CLAUDE.md                              entry point
- memory/README.md                       global behaviour index
- memory/PROCESS.md                      workflow rules + Standing Council
- memory/VOICE.md                        banned phrases, tone
- memory/OUTPUT.md                       code conventions, scope discipline
- memory/CONSTRAINTS.md                  hard "do not" rules
- memory/TOOLS.md                        tool policy, permission tiers
- projects/flintmere/PROJECT.md          repo layout, commands, env vars
- projects/flintmere/ARCHITECTURE.md     API routes, DB, integrations, data flow
- projects/flintmere/DESIGN.md           three-surface rules, Polaris island
- projects/flintmere/BUSINESS.md         pricing, tiers, positioning
- projects/flintmere/STATUS.md           current phase
- projects/flintmere/SPEC.md             Product & GTM plan (canonical intent)
- projects/flintmere/decisions/          ADRs 0001–0006

Signature: the legibility bracket. See memory/design/tokens.md §Signature.
Canon: neutral-bold hybrid. Geist Sans + Geist Mono. No Fraunces, no Ledger, no Glass.

Deployment: Coolify on existing DO droplet. See decisions/0002.
LLM stack: Gemini 2.5 Flash primary, Gemini 2.5 Pro hard cases, GPT-4o-mini fallback. See decisions/0005 + 0006.

Permission tiers active — reversible ops auto-allowed, irreversible denied.
See memory/product-engineering/security-posture.md §Permission tiers.
EOF
