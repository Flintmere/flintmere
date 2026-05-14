export type SignalStatus = 'ok' | 'warn' | 'error' | 'unknown';

export interface SignalResult<T = unknown> {
  status: SignalStatus;
  metric: string;
  fetchedAt: string;
  sourceUrl: string;
  data?: T;
  errorMessage?: string;
}
