import { NextRequest, NextResponse } from "next/server";
import { getClientById } from "@/lib/clientStore";
import {
  discoverTikTokConversionEvents,
  fetchTikTokRawConversionEvents,
} from "@/lib/integrations/tiktok";
import { getTikTokConnection } from "@/lib/tiktokConnectionStore";

export async function GET(request: NextRequest) {
  try {
    const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
    const connection = await getTikTokConnection(client.id);
    const accessToken = connection?.accessToken;
    const advertiserId =
      request.nextUrl.searchParams.get("advertiserId") ??
      connection?.selectedAdvertiserId;
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
    const [rawPreview, discoveredEvents] = await Promise.all([
      fetchTikTokRawConversionEvents(accessToken, advertiserId, dateRange),
      discoverTikTokConversionEvents(accessToken, advertiserId, client.id, dateRange),
    ]);

    return NextResponse.json({
      clientId: client.id,
      advertiserId,
      dateRange,
      events: discoveredEvents,
      rawEvents: rawPreview.events,
      rawRowsCount: rawPreview.rawRows.length,
      note:
        "This is a TikTok event discovery preview. Map purchase and purchase value events before using TikTok conversion metrics for decisions.",
    });
  } catch (error) {
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
