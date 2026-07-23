import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import {
  fetchTikTokRawConversionEvents,
  toDiscoveredTikTokConversionEvents,
} from "@/lib/integrations/tiktok";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
import { getTikTokConnection, recordTikTokEventDiscovery } from "@/lib/tiktokConnectionStore";
import { requireClientAccess } from "@/lib/serverAccess";
import { withTikTokAccess } from "@/lib/providerAccess";

export async function GET(request: NextRequest) {
  try {
    const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
    if (access.response) return access.response;
    const client = await getRequiredClientById(access.clientId);
    const connection = await getTikTokConnection(client.id);
    const accessToken = connection?.accessToken;
    const advertiserId = connection?.selectedAdvertiserId;
    const datePreset = request.nextUrl.searchParams.get("datePreset") ?? undefined;
    const since = request.nextUrl.searchParams.get("since") ?? undefined;
    const until = request.nextUrl.searchParams.get("until") ?? undefined;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Connect TikTok before loading conversion events." },
        { status: 401 }
      );
    }

    if (!advertiserId) {
      return NextResponse.json(
        { error: "Select a TikTok advertiser before loading conversion events." },
        { status: 400 }
      );
    }

    const dateRange = { datePreset, since, until };
    const rawPreview = await withTikTokAccess(client.id, (currentAccessToken) =>
      fetchTikTokRawConversionEvents(currentAccessToken, advertiserId, dateRange)
    );
    const discoveredAt = new Date().toISOString();
    const discoveredEvents = toDiscoveredTikTokConversionEvents(
      rawPreview.events,
      client.id,
      discoveredAt
    );
    const mapping = await resolveSourceConversionMapping("tiktok", client.id);
    await recordTikTokEventDiscovery(client.id, { discoveredAt, error: null });

    return NextResponse.json({
      clientId: client.id,
      advertiserId,
      dateRange,
      events: discoveredEvents,
      rawEvents: rawPreview.events,
      rawRowsCount: rawPreview.rawRows.length,
      discoveredAt,
      mapping,
      note:
        "This is a TikTok event discovery preview. Map purchase and purchase value events before using TikTok conversion metrics for decisions.",
    });
  } catch (error) {
    const clientId = request.nextUrl.searchParams.get("clientId");
    const access = await requireClientAccess(clientId);
    if (!access.response) {
      await recordTikTokEventDiscovery(access.clientId, {
        discoveredAt: null,
        error: error instanceof Error ? error.message : "TikTok event discovery failed.",
      });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load TikTok conversion events.",
      },
      { status: 500 }
    );
  }
}
