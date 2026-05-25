import { NextResponse } from "next/server";
import { getSyncStorageMeta } from "@/lib/prototypeSyncStore";
import { readSyncDashboardState } from "@/lib/syncEngine";

export async function GET() {
  const [state, storage] = await Promise.all([
    readSyncDashboardState(),
    getSyncStorageMeta(),
  ]);

  const note = storage.durable
    ? "This sync state is stored in durable runtime storage and will survive refreshes and deployments."
    : "This sync state is still stored in temporary server storage. Add Vercel KV / Upstash REST environment variables so sync history survives refreshes and deployments.";

  return NextResponse.json({
    ...state,
    storage,
    note,
  });
}
