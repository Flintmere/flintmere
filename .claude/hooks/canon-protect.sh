#!/usr/bin/env bash
# Canon-protection PreToolUse hook.
#
# Per CLAUDE.md §Binding 2026-05-09: every dispatch that produces a
# customer-facing artifact opens with a council pre-flight reading 3
# sources from memory/canon-source-register.md.
#
# This hook is the in-context reminder + force-invocation gate. It fires
# on PreToolUse for Edit / Write / MultiEdit. When the target file
# matches a canon-protected path, the hook returns:
#
#   - permissionDecision "ask" with an explanation of what the binding
#     requires + which register section to read for this artifact type.
#   - The operator can approve quickly (they've already read the canon)
#     or deny (run canon-audit first).
#
# Read-only. No mutations. No network calls. Idempotent.
#
# Stdin: PreToolUse hook input JSON (session_id, tool_name, tool_input
# with file_path).
# Stdout: hook output JSON.

set -euo pipefail

# Read stdin once into a variable.
INPUT="$(cat)"

# Extract the tool and the file path. Edit, Write, and MultiEdit all
# carry tool_input.file_path. If jq isn't available or the path can't
# be extracted, fall through with an empty path (no-op).
TOOL="$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)"
FILE_PATH="$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)"

# If the tool isn't an editor or the path is empty, no-op (allow).
if [[ -z "$TOOL" || -z "$FILE_PATH" ]]; then
  exit 0
fi

case "$TOOL" in
  Edit|Write|MultiEdit) ;;
  *) exit 0 ;;
esac

# Strip the leading absolute path if it includes the project root.
# Match against repo-relative paths.
REPO_ROOT="${CLAUDE_PROJECT_DIR:-/Users/abuaa/Projects/Flintmere}"
REL_PATH="${FILE_PATH#$REPO_ROOT/}"

# ---- Canon-protected path matchers ---------------------------------
# Each block: (regex, register-section, artifact-type-label)
# Matched against $REL_PATH. First match wins.

REGISTER_SECTION=""
ARTIFACT_TYPE=""

if [[ "$REL_PATH" =~ ^apps/scanner/src/lib/audit-draft/ ]]; then
  REGISTER_SECTION="A1"
  ARTIFACT_TYPE="Audit-engine prompt or related"
elif [[ "$REL_PATH" =~ ^projects/flintmere/plans/.*(deliverable|spec|audit|outreach) ]]; then
  REGISTER_SECTION="A2"
  ARTIFACT_TYPE="Deliverable / outreach spec"
elif [[ "$REL_PATH" =~ ^apps/scanner/src/lib/(concierge-deliverable|concierge-email|concierge-refund-email)\.ts$ ]]; then
  REGISTER_SECTION="A2"
  ARTIFACT_TYPE="Deliverable copy / post-purchase email (in-code truth surface)"
elif [[ "$REL_PATH" =~ ^apps/scanner/src/app/(audit|methodology|standards|research|for)/ ]]; then
  REGISTER_SECTION="A3"
  ARTIFACT_TYPE="Marketing / landing page"
elif [[ "$REL_PATH" =~ ^data/recruitment/.*(template|outreach|email) ]]; then
  REGISTER_SECTION="A4"
  ARTIFACT_TYPE="Outreach / cold email"
elif [[ "$REL_PATH" =~ ^apps/scanner/src/lib/resend\.ts$ ]] || \
     [[ "$REL_PATH" =~ ^apps/scanner/src/app/api/admin/email-code/ ]] || \
     [[ "$REL_PATH" =~ ^apps/scanner/src/app/api/lead/ ]] || \
     [[ "$REL_PATH" =~ ^apps/scanner/src/app/api/unsubscribe/ ]]; then
  REGISTER_SECTION="A5"
  ARTIFACT_TYPE="Email template / transactional copy"
elif [[ "$REL_PATH" =~ ^apps/scanner/src/(lib/(pricing|audit-pricing)\.ts|app/(pricing|audit)/) ]]; then
  REGISTER_SECTION="A6"
  ARTIFACT_TYPE="Pricing / billing copy"
elif [[ "$REL_PATH" =~ ^apps/scanner/src/app/(about|methodology)/ ]] || \
     [[ "$REL_PATH" =~ ^projects/flintmere/strategy/ ]]; then
  REGISTER_SECTION="A7"
  ARTIFACT_TYPE="Positioning / about / methodology"
elif [[ "$REL_PATH" =~ ^apps/scanner/src/lib/scoring/ ]] || \
     [[ "$REL_PATH" =~ ^packages/scoring/ ]]; then
  REGISTER_SECTION="A9"
  ARTIFACT_TYPE="Pillar / scoring claim"
elif [[ "$REL_PATH" =~ ^apps/scanner/src/app/admin/audit-draft/ ]]; then
  REGISTER_SECTION="A12"
  ARTIFACT_TYPE="Operator console copy (flows into deliverables)"
elif [[ "$REL_PATH" =~ ^projects/flintmere/decisions/ ]]; then
  REGISTER_SECTION="A13"
  ARTIFACT_TYPE="ADR draft"
elif [[ "$REL_PATH" =~ ^memory/canon-source-register\.md$ ]] || \
     [[ "$REL_PATH" =~ ^memory/VOICE\.md$ ]] || \
     [[ "$REL_PATH" =~ ^projects/flintmere/BUSINESS\.md$ ]] || \
     [[ "$REL_PATH" =~ ^CLAUDE\.md$ ]]; then
  REGISTER_SECTION="(canon source itself)"
  ARTIFACT_TYPE="Canon source file"
fi

# Not a canon-protected path → no-op (allow).
if [[ -z "$REGISTER_SECTION" ]]; then
  exit 0
fi

# ---- Build the permission-prompt payload ---------------------------

REASON="CANON-PROTECTED ARTIFACT — $ARTIFACT_TYPE.

Per CLAUDE.md §Binding 2026-05-09: every customer-facing artifact
opens with a council pre-flight reading 3 canonical sources for this
artifact type from memory/canon-source-register.md $REGISTER_SECTION.

If you have NOT yet:
  - read memory/canon-source-register.md $REGISTER_SECTION
  - fetched the published canonical source(s) (typically
    flintmere.com/methodology + the relevant /audit, /pricing, etc.)
  - named 3 sources by URL in a Council pre-flight header

then DENY this prompt and run /canon-audit on the artifact first.

If the canon read IS done and this edit is traced to it, APPROVE.

The 2026-05-09 binding exists because the audit-edit-pass schema v1
was written from generic LLM-deliverable instinct without first
reading flintmere.com/methodology — an external review caught four
corrections that would have been obvious if the canonical source had
been read first. This hook prevents the same failure mode."

# Emit JSON output for the harness.
# permissionDecision "ask" forces a user-in-the-loop confirm.
# additionalContext also emits a system-reminder so the model sees the
# binding context regardless of the user's decision.
jq -nc --arg reason "$REASON" --arg artifact "$ARTIFACT_TYPE" --arg section "$REGISTER_SECTION" '
  {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: $reason,
      additionalContext: ("CANON-PROTECTED PATH (register " + $section + ", " + $artifact + "). Per CLAUDE.md §Binding 2026-05-09, name 3 sources from memory/canon-source-register.md and trace this edit to them, or invoke canon-audit before shipping.")
    }
  }
'
