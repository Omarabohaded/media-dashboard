import { NextResponse } from "next/server";
import { getSyncStorageMeta } from "@/lib/prototypeSyncStore";
import { readSyncDashboardState } from "@/lib/syncEngine";

export async function GET() {
  const [state, storage] = await Promise.all([
    readSyncDashboardState(),
    getSyncStorageMeta(),
  ]);

  return NextResponse.json({
    ...state,
    storage,
    note:
      "This is prototype persistence stored in ephemeral server storage. It is useful for testing the sync flow now, and should be replaced by a real database next.",
  });
}
