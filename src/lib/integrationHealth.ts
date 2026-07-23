import type { SourceConversionMappingStatus } from "@/lib/paidMediaContract";

export type IntegrationHealthStatus =
  | "healthy"
  | "needs_connection"
  | "needs_account"
  | "missing_mapping"
  | "token_expired"
  | "failed"
  | "stale"
  | "awaiting_live_validation";

export type IntegrationHealthRecord = {
  clientId: string;
  clientName: string;
  sourceType: "meta" | "tiktok" | "google" | "snap";
  status: IntegrationHealthStatus;
  connected: boolean;
  selectedAccountId: string | null;
  mappingStatus: SourceConversionMappingStatus;
  tokenExpiresAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  dataFreshness: "fresh" | "stale" | "never";
  nextAction: string;
};

export function evaluateIntegrationHealth(input: Omit<IntegrationHealthRecord, "status" | "dataFreshness" | "nextAction"> & {
  now?: string;
  staleAfterHours?: number;
}): IntegrationHealthRecord {
  const now = Date.parse(input.now ?? new Date().toISOString());
  const staleAfterMs = (input.staleAfterHours ?? 26) * 60 * 60 * 1000;
  const syncTime = input.lastSuccessfulSyncAt ? Date.parse(input.lastSuccessfulSyncAt) : NaN;
  const dataFreshness = Number.isNaN(syncTime)
    ? "never"
    : now - syncTime > staleAfterMs
      ? "stale"
      : "fresh";
  const tokenExpired = input.tokenExpiresAt
    ? Date.parse(input.tokenExpiresAt) <= now
    : false;

  let status: IntegrationHealthStatus = "healthy";
  let nextAction = "No action required.";
  if (!input.connected) {
    status = "needs_connection";
    nextAction = "Connect this platform for the client.";
  } else if (tokenExpired) {
    status = "token_expired";
    nextAction = "Reconnect the platform to renew access.";
  } else if (!input.selectedAccountId) {
    status = "needs_account";
    nextAction = "Select and save an advertiser account.";
  } else if (input.lastError) {
    status = "failed";
    nextAction = "Review the latest integration error and retry.";
  } else if (input.mappingStatus !== "mapped") {
    status = "missing_mapping";
    nextAction = "Map exactly one purchases event and one purchase-value event.";
  } else if (dataFreshness === "stale") {
    status = "stale";
    nextAction = "Run or inspect the latest reporting sync.";
  } else if (dataFreshness === "never") {
    status = "awaiting_live_validation";
    nextAction = "Run the first authenticated reporting validation.";
  }

  return {
    ...input,
    status,
    dataFreshness,
    nextAction,
  };
}
