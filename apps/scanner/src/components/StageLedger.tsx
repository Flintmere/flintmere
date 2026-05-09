'use client'

import { useEffect, useState } from 'react'
import { formatElapsed } from '@/lib/format-elapsed'

export interface StageLedgerStage {
  id: string
  label: string
  description: string
}

export interface StageLedgerProps {
  stages: StageLedgerStage[]
  currentId: StageLedgerStage['id']
  startedAt: number
  onCancel?: () => void
  className?: string
}

/**
 * Stage Ledger — Flintmere's wait-state primitive. Replaces every
 * generic spinner across the product. Spec at
 * `context/design/specs/2026-05-09-stage-ledger.md`.
 *
 * The label and elapsed counter are aria-hidden — the descriptor is
 * the live-region content. Otherwise screen readers would announce
 * the elapsed counter every second.
 */
export function StageLedger({
  stages,
  currentId,
  startedAt,
  onCancel,
  className,
}: StageLedgerProps) {
  const [mounted, setMounted] = useState(false)
  const [, forceTick] = useState(0)

  useEffect(() => {
    setMounted(true)
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const current = stages.find((s) => s.id === currentId) ?? stages[0]
  const elapsed = mounted ? Math.max(0, Date.now() - startedAt) : 0

  const containerClass = className
    ? `flintmere-stage-ledger ${className}`
    : 'flintmere-stage-ledger'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={containerClass}
    >
      <span
        aria-hidden="true"
        className="bracket flintmere-stage-ledger__label"
      >
        {current?.label ?? 'working'}
      </span>
      <span className="flintmere-stage-ledger__description">
        {current?.description ?? '…'}
      </span>
      <span
        aria-hidden="true"
        className="bracket-inline flintmere-stage-ledger__elapsed"
      >
        {formatElapsed(elapsed)}
      </span>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="flintmere-stage-ledger__cancel"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
