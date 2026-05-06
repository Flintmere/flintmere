// Pure dispatch fn for /audit/connect. Extracted so the three-state
// decision is testable in node (vitest env is node-only — see
// apps/scanner/vitest.config.ts; component rendering is not tested).

export type ConnectState =
  | 'pre-verification'
  | 'connect'
  | 'connected';

export function pickState({
  featureOn,
  connected,
}: {
  featureOn: boolean;
  connected: boolean;
}): ConnectState {
  if (!featureOn) return 'pre-verification';
  if (connected) return 'connected';
  return 'connect';
}
