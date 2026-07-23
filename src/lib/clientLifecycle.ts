import { clearClientAssignments } from "@/lib/accessStore";
import { deleteClient } from "@/lib/clientStore";
import { clearGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";
import { clearClientMetricMappings } from "@/lib/metricMappingStore";
import { clearClientSyncState } from "@/lib/prototypeSyncStore";
import { clearSnapConnection } from "@/lib/snapConnectionStore";
import { clearClientSourceConversionMappings } from "@/lib/sourceConversionMappingStore";
import { clearTikTokConnection } from "@/lib/tiktokConnectionStore";

export type ClientCleanupStep =
  | "source-conversion-mappings"
  | "metric-mappings"
  | "platform-connections"
  | "sync-state"
  | "access-assignments"
  | "client-record";

export async function deleteClientAndScopedData(clientId: string) {
  const completed: ClientCleanupStep[] = [];

  // Cleanup operations are idempotent. The client record is removed last so
  // an interrupted cleanup can be retried without leaving hidden orphan data.
  await clearClientSourceConversionMappings(clientId);
  completed.push("source-conversion-mappings");

  await clearClientMetricMappings(clientId);
  completed.push("metric-mappings");

  await Promise.all([
    clearTikTokConnection(clientId),
    clearGoogleAdsConnection(clientId),
    clearSnapConnection(clientId),
  ]);
  completed.push("platform-connections");

  await clearClientSyncState(clientId);
  completed.push("sync-state");

  await clearClientAssignments(clientId);
  completed.push("access-assignments");

  await deleteClient(clientId);
  completed.push("client-record");

  return { clientId, completed };
}
