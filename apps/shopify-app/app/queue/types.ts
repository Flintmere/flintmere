/**
 * Job payload types. Keep flat; BullMQ serialises via JSON.
 */

export const QUEUE_NAMES = {
  sync: 'sync',
  score: 'score',
  enrich: 'fix-tier2',
  fixTier1: 'fix-tier1',
  drift: 'drift',
  alerts: 'alerts',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// ---- Sync ----

export interface SyncCatalogJob {
  shopDomain: string;
  /** When the job was enqueued (helps with observability). */
  enqueuedAt: string;
  /** 'install' (first sync) or 'rescan' (merchant-triggered). */
  trigger: 'install' | 'rescan' | 'nightly' | 'weekly';
  /** Optional correlation id to propagate through logs. */
  requestId?: string;
}

// ---- Score ----

export interface ScoreCatalogJob {
  shopDomain: string;
  /** Completion token from the sync job — ensures we score the right snapshot. */
  syncCompletedAt: string;
  requestId?: string;
}

// ---- Enrich ----

export interface EnrichBatchJob {
  shopDomain: string;
  fixType: 'alt-text' | 'title-rewrite' | 'attribute-infer';
  productIds: string[];
  /** 0..1 — skip products whose proposed change lands below this floor. */
  minConfidence: number;
  requestId?: string;
}

// ---- Apply / Revert Tier 1 fix ----

export interface ApplyFixJob {
  shopDomain: string;
  fixId: string;
  op: 'apply' | 'revert';
  requestId?: string;
}

// ---- Drift ----

export interface DriftRescoreJob {
  shopDomain: string;
  productId: string;
  topic: 'products/create' | 'products/update' | 'products/delete';
  webhookId: string;
}

// ---- Alerts ----

export interface AlertJob {
  shopDomain: string;
  kind: 'score-drop' | 'competitor-passed' | 'standards-change';
  payload: Record<string, unknown>;
}
