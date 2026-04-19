/**
 * Test-only exports. Apps do not import from this entry.
 * Test suites use MockProvider to avoid any network calls.
 */

export { MockProvider } from './providers/mock.js';
export type { MockCall, MockProviderOptions } from './providers/mock.js';
