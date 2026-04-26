// Derived fix status — reads three columns and returns the merchant-facing label.

export type FixDisplayStatus =
  | 'pending'
  | 'applied'
  | 'reverted'
  | 'expired'
  | 'failed';

export function deriveFixStatus(fix: {
  status: string;
  revertedAt: Date | null;
  revertableUntil: Date;
}): FixDisplayStatus {
  if (fix.status === 'reverted' || fix.revertedAt) return 'reverted';
  if (fix.status === 'failed') return 'failed';
  if (fix.status === 'pending') return 'pending';
  if (fix.status === 'applied') {
    return fix.revertableUntil < new Date() ? 'expired' : 'applied';
  }
  return 'failed';
}

export function statusBadgeTone(
  status: FixDisplayStatus,
): 'success' | 'attention' | 'warning' | 'critical' | 'info' {
  switch (status) {
    case 'applied':
      return 'success';
    case 'pending':
      return 'attention';
    case 'reverted':
      return 'info';
    case 'expired':
      return 'warning';
    case 'failed':
      return 'critical';
  }
}

export function statusLabel(status: FixDisplayStatus): string {
  switch (status) {
    case 'applied':
      return 'Applied';
    case 'pending':
      return 'Queued';
    case 'reverted':
      return 'Reverted';
    case 'expired':
      return 'Revert window closed';
    case 'failed':
      return 'Failed';
  }
}
