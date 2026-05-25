export type IntegrationPlatform = "meta" | "shopify" | "google" | "tiktok" | "snap";

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
  health: ConnectionHealth;
  scopes: string[];
  lastError: string | null;
  recommendedNextStep: string;
};

export type SyncRunRecord = {
  platform: IntegrationPlatform;
  status: SyncRunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  recordsProcessed: number;
  notes: string[];
};

export type BusinessTruthSnapshot = {
  source: "shopify" | "ga4" | "manual";
  capturedAt: string;
  grossSales: number;
  taxTotal: number;
  shippingTotal: number;
  netSales: number;
  orders: number;
  averageOrderValue: number;
};
