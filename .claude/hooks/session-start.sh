#!/usr/bin/env bash
# Allowance Guard session-start orientation.
# Prints a short preamble pointing at the load map + marketing memory.
# Read-only. No network calls. No mutations. Idempotent.

set -euo pipefail

cat <<'EOF'
[Allowance Guard — session start]

Load map (read on demand):
- CLAUDE.md                              entry point
- memory/README.md                       global behaviour index
- projects/allowanceguard/PROJECT.md     repo layout, commands, env vars
- projects/allowanceguard/ARCHITECTURE.md API routes, chains, feature gates
- projects/allowanceguard/DESIGN.md      Ledger + glass canons
- projects/allowanceguard/BUSINESS.md    pricing, tiers, positioning

Marketing managed-agent system:
- memory/marketing/MEMORY.md             marketing memory index
- docs/marketing-agents.md               runbook + autonomy ladder

Autonomy level: 2 (Assisted). User approves every publish, send, and src/ edit.
Deny list in .claude/settings.json blocks deploy, payments, DB, and force-push.
EOF
