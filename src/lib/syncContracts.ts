export type IntegrationPlatform =
  | "meta"
  | "shopify"
  | "wordpress"
  | "google"
  | "tiktok"
  | "snap";

export type ConnectionHealth =
  | "missing_config"
  | "ready_to_connect"
  | "connected"
  | "preview_ready"
  | "sync_ready";

export type SyncRunStatus = "idle" | "queued" | "running" | "succeeded" | "failed";

export type IntegrationConnectionRecord = {
  platform: IntegrationPlatform;
  accountLabel: string;
  accountId: string | null;
  health: ConnectionHealth;
  scopes: string[];
  lastError: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  sourceMode: "live" | "mock" | "ephemeral";
  recommendedNextStep: string;
};

export type SyncRunRecord = {
  id: string;
  platform: IntegrationPlatform;
  status: SyncRunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  recordsProcessed: number;
  storageMode: "ephemeral_tmp";
  error: string | null;
  notes: string[];
};

export type BusinessTruthSnapshot = {
  source: "shopify" | "wordpress" | "ga4" | "manual";
  capturedAt: string;
  grossSales: number;
  taxTotal: number;
  shippingTotal: number;
  netSales: number;
  orders: number;
  averageOrderValue: number;
};

export type MediaPlatformSnapshot = {
  platform: "meta" | "google" | "tiktok" | "snap";
  capturedAt: string;
  accountId: string | null;
  accountLabel: string;
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  purchaseValue: number;
  campaigns: number;
};

export type SyncStateStore = {
  version: 1;
  storageMode: "ephemeral_tmp";
  updatedAt: string | null;
  connections: IntegrationConnectionRecord[];
  syncRuns: SyncRunRecord[];
  businessTruthSnapshots: BusinessTruthSnapshot[];
  mediaSnapshots: MediaPlatformSnapshot[];
};
