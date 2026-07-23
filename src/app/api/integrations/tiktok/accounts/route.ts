import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { fetchTikTokAdvertisers } from "@/lib/integrations/tiktok";
import {
  getTikTokConnection,
  upsertTikTokConnection,
} from "@/lib/tiktokConnectionStore";
import { requireClientAccess, requireClientIntegrationAccess } from "@/lib/serverAccess";
import { withTikTokAccess } from "@/lib/providerAccess";

export async function GET(request: NextRequest) {
  try {
    const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
    if (access.response) return access.response;
    const client = await getRequiredClientById(access.clientId);
    const connection = await getTikTokConnection(client.id);

    if (!connection?.accessToken) {
      return NextResponse.json(
        { error: "Connect TikTok before loading advertiser accounts." },
        { status: 401 }
      );
    }

    const accounts = await withTikTokAccess(client.id, fetchTikTokAdvertisers);

    return NextResponse.json({
      clientId: client.id,
      selectedAdvertiserId: connection.selectedAdvertiserId,
      accounts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load TikTok advertiser accounts.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireClientIntegrationAccess(request.nextUrl.searchParams.get("clientId"));
    if (access.response) return access.response;
    const client = await getRequiredClientById(access.clientId);
    const connection = await getTikTokConnection(client.id);

    if (!connection?.accessToken) {
      return NextResponse.json(
        { error: "Connect TikTok before selecting an advertiser account." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      advertiserId?: string;
      advertiserName?: string | null;
    };
    const advertiserId = body.advertiserId?.trim();

    if (!advertiserId) {
      return NextResponse.json(
        { error: "Choose a TikTok advertiser account first." },
        { status: 400 }
      );
    }

    const accounts = await withTikTokAccess(client.id, fetchTikTokAdvertisers);
    const account = accounts.find((item) => item.advertiserId === advertiserId);

    if (!account) {
      return NextResponse.json(
        { error: "TikTok advertiser account was not found for this connection." },
        { status: 404 }
      );
    }

    const nextConnection = await upsertTikTokConnection({
      ...connection,
      selectedAdvertiserId: account.advertiserId,
      selectedAdvertiserName:
        body.advertiserName?.trim() || account.advertiserName || account.advertiserId,
      lastError: null,
    });

    return NextResponse.json({
      ok: true,
      clientId: client.id,
      selectedAdvertiserId: nextConnection.selectedAdvertiserId,
      selectedAdvertiserName: nextConnection.selectedAdvertiserName,
      accounts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save TikTok advertiser account.",
      },
      { status: 500 }
    );
  }
}
