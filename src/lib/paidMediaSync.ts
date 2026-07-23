import { getSyncStorageMeta, upsertSyncRun } from "@/lib/prototypeSyncStore";
import type { NormalizedPaidMediaRow, PaidMediaSourceType } from "@/lib/paidMediaContract";
import type { SyncRunRecord } from "@/lib/syncContracts";

export async function executePaidMediaSync(input: {
  clientId: string;
  clientName: string;
  sourceType: PaidMediaSourceType;
  request: () => Promise<NormalizedPaidMediaRow[]>;
}) {
  const startedAt = new Date().toISOString();
  const id = `paid-media-${input.sourceType}-${crypto.randomUUID()}`;
  const storageMode = (await getSyncStorageMeta()).storageMode;
  const base: SyncRunRecord = {
    id,
    clientId: input.clientId,
    clientName: input.clientName,
    platform: input.sourceType,
    status: "running",
    startedAt,
    finishedAt: null,
    recordsProcessed: 0,
    storageMode,
    error: null,
    notes: ["Normalized paid-media reporting request."],
  };

  await upsertSyncRun(base);

  try {
    const rows = await input.request();
    await upsertSyncRun({
      ...base,
      status: "succeeded",
      finishedAt: new Date().toISOString(),
      recordsProcessed: rows.length,
    });
    return rows;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Paid-media request failed.";
    await upsertSyncRun({
      ...base,
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: message,
    });
    throw error;
  }
}
