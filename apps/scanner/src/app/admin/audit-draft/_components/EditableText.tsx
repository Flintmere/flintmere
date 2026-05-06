'use client'

import { useEffect, useRef } from 'react'

// Operator-edit primitive used by every editable field across the
// DraftViewer. A contentEditable div with sane keyboard handling +
// onBlur commit so state lands once per field-blur rather than on
// every keystroke (light state churn — the draft is editable for
// minutes; per-keystroke setState would re-render the whole pane).
//
// Defensive plain-text behaviour:
//   - paste → strip HTML, insert text only
//   - enter (no shift) → blur, commit (multi-line=false)
//   - enter (shift) → newline (multi-line=true)
//
// Accessibility:
//   - aria-label is REQUIRED — the contentEditable's accessible name
//     comes from the author, not its contents (a custom widget).
//   - role="textbox", contentEditable, aria-multiline as applicable.
//   - Visible focus ring; tab-stop in DOM order.

interface EditableTextProps {
  value: string
  onCommit: (next: string) => void
  ariaLabel: string
  /** Single-line (default) collapses Enter to blur+commit; multi-line keeps it. */
  multiline?: boolean
  maxLength?: number
  placeholder?: string
  /** Renders a placeholder-style empty hint when value is ''. */
  emptyHint?: string
}

export function EditableText({
  value,
  onCommit,
  ariaLabel,
  multiline = false,
  maxLength,
  placeholder,
  emptyHint,
}: EditableTextProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  // Sync external value -> DOM only when it changes externally (e.g. on
  // server-supplied initial render or after an undo). Don't fight the
  // user's typing.
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])

  return (
    <div
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      aria-label={ariaLabel}
      aria-multiline={multiline}
      data-empty={value.length === 0 ? 'true' : 'false'}
      onPaste={(e) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).blur()
        }
      }}
      onBlur={(e) => {
        let next = (e.currentTarget.textContent ?? '').trim()
        if (maxLength && next.length > maxLength) next = next.slice(0, maxLength)
        if (next !== value) onCommit(next)
        else if (ref.current) ref.current.textContent = value
      }}
      style={{
        outline: 'none',
        minHeight: multiline ? '4.5rem' : '1.5rem',
        padding: '0.4rem 0.6rem',
        margin: '0 -0.6rem',
        borderRadius: 2,
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
        wordBreak: 'break-word',
        cursor: 'text',
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = 'var(--color-ink-ghost)'
        e.currentTarget.style.boxShadow =
          '0 0 0 1px var(--color-ink) inset'
      }}
      onMouseLeave={(e) => {
        if (document.activeElement !== e.currentTarget) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
      onMouseEnter={(e) => {
        if (document.activeElement !== e.currentTarget) {
          e.currentTarget.style.background = 'var(--color-ink-ghost)'
        }
      }}
      data-placeholder={emptyHint ?? placeholder ?? ''}
      title={ariaLabel}
    />
  )
}
