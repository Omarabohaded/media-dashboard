import { NextResponse } from "next/server";
import { getClientStoreHealth, getMetaConnection, listClients } from "@/lib/clientStore";
import { evaluateIntegrationHealth } from "@/lib/integrationHealth";
import { readSyncStateStore } from "@/lib/prototypeSyncStore";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
import { requireAuthenticatedUser } from "@/lib/serverAccess";
import { getTikTokConnection } from "@/lib/tiktokConnectionStore";

export async function GET() {
  const access = await requireAuthenticatedUser();
  if (access.response) return access.response;
  const [clients, syncState, storage] = await Promise.all([
    listClients(),
    readSyncStateStore(),
    getClientStoreHealth(),
  ]);
  const records = (
    await Promise.all(
      clients.flatMap((client) =>
        (["meta", "tiktok", "google", "snap"] as const).map(async (sourceType) => {
          const [mapping, meta, tiktok] = await Promise.all([
            resolveSourceConversionMapping(sourceType, client.id),
            sourceType === "meta" ? getMetaConnection(client.id) : Promise.resolve(null),
            sourceType === "tiktok" ? getTikTokConnection(client.id) : Promise.resolve(null),
          ]);
          const connection = meta ?? tiktok;
          const runs = syncState.syncRuns.filter(
            (run) => run.clientId === client.id && run.platform === sourceType
          );
          const success = runs.find((run) => run.status === "succeeded");
          const latest = runs[0];
          return evaluateIntegrationHealth({
            clientId: client.id,
            clientName: client.name,
            sourceType,
            connected: Boolean(connection),
            selectedAccountId:
              sourceType === "meta"
                ? meta?.selectedAccountId ?? null
                : sourceType === "tiktok"
                  ? tiktok?.selectedAdvertiserId ?? null
                  : null,
            mappingStatus: mapping.status,
            tokenExpiresAt:
              sourceType === "tiktok" ? tiktok?.accessTokenExpiresAt ?? null : null,
            lastSuccessfulSyncAt: success?.finishedAt ?? null,
            lastAttemptAt: latest?.finishedAt ?? latest?.startedAt ?? null,
            lastError: latest?.error ?? connection?.lastError ?? null,
          });
        })
      )
    )
  ).flat();

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    storage,
    summary: {
      total: records.length,
      healthy: records.filter((record) => record.status === "healthy").length,
      needsAction: records.filter((record) => record.status !== "healthy").length,
      failed: records.filter((record) => record.status === "failed").length,
      expired: records.filter((record) => record.status === "token_expired").length,
      stale: records.filter((record) => record.dataFreshness === "stale").length,
    },
    records,
  });
}
