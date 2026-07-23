import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { fetchTikTokPaidMediaRows } from "@/lib/integrations/tiktok";
import { getTikTokConnection } from "@/lib/tiktokConnectionStore";
import { requireClientAccess } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  try {
    const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
    if (access.response) return access.response;
    const client = await getRequiredClientById(access.clientId);
    const connection = await getTikTokConnection(client.id);
    const accessToken = connection?.accessToken;
    const advertiserId = connection?.selectedAdvertiserId;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Connect TikTok before loading normalized reporting data." },
        { status: 401 }
      );
    }

    if (!advertiserId) {
      return NextResponse.json(
        { error: "Select a TikTok advertiser before loading normalized reporting data." },
        { status: 400 }
      );
    }

    const dateRange = {
      datePreset: request.nextUrl.searchParams.get("datePreset") ?? undefined,
      since: request.nextUrl.searchParams.get("since") ?? undefined,
      until: request.nextUrl.searchParams.get("until") ?? undefined,
    };
    const rows = await fetchTikTokPaidMediaRows(
      accessToken,
      advertiserId,
      { clientId: client.id, dateRange }
    );

    return NextResponse.json({
      clientId: client.id,
      advertiserId,
      dateRange,
      rows,
      implementationStatus: "implemented_awaiting_live_validation",
      note:
        "Rows use the shared paid-media contract and exactly the configured purchase and purchase-value events. Live TikTok validation is deferred to the final combined validation stage.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load normalized TikTok reporting data.",
      },
      { status: 500 }
    );
  }
}
