import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import {
  buildTikTokRedirectUri,
  fetchTikTokAdvertisers,
  getTikTokConfig,
} from "@/lib/integrations/tiktok";
import {
  clearTikTokConnection,
  getTikTokConnection,
} from "@/lib/tiktokConnectionStore";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";

export async function GET(request: NextRequest) {
  const config = getTikTokConfig();
  const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId"));
  const connection = await getTikTokConnection(client.id);
  const accessToken = connection?.accessToken || null;
  const selectedAdvertiserId = connection?.selectedAdvertiserId ?? null;
  const mapping = await resolveSourceConversionMapping("tiktok", client.id);

  let accounts: Awaited<ReturnType<typeof fetchTikTokAdvertisers>> = [];
  let connectionError: string | null = null;

  if (accessToken && config.missingEnv.length === 0) {
    try {
      accounts = await fetchTikTokAdvertisers(accessToken);
    } catch (error) {
      connectionError =
        error instanceof Error ? error.message : "TikTok connection failed.";
    }
  }

  const selectedAdvertiser =
    accounts.find((account) => account.advertiserId === selectedAdvertiserId) ?? null;

  return NextResponse.json({
    client,
    platform: "tiktok",
    configured: config.missingEnv.length === 0,
    connected: Boolean(accessToken),
    accountFetchHealthy: !connectionError,
    scopes: config.scopes,
    callbackUrl: buildTikTokRedirectUri(request.nextUrl.origin),
    missingEnv: config.missingEnv,
    usesMockData: false,
    selectedAdvertiserId,
    selectedAdvertiser:
      selectedAdvertiser ??
      (connection?.selectedAdvertiserId
        ? {
            advertiserId: connection.selectedAdvertiserId,
            advertiserName:
              connection.selectedAdvertiserName ?? connection.selectedAdvertiserId,
          }
        : null),
    accounts,
    connectionError: connectionError ?? connection?.lastError ?? null,
    accessTokenExpiresAt: connection?.accessTokenExpiresAt ?? null,
    tokenExpired: connection?.accessTokenExpiresAt
      ? Date.parse(connection.accessTokenExpiresAt) <= Date.now()
      : false,
    lastDiscoveryAt: connection?.lastDiscoveryAt ?? null,
    lastDiscoveryError: connection?.lastDiscoveryError ?? null,
    mapping,
    mappingHealthy: mapping.status === "mapped",
    syncReady: Boolean(accessToken && selectedAdvertiserId),
    recommendedNextStep:
      !accessToken
        ? "Connect your TikTok app first."
        : !selectedAdvertiserId
        ? "Choose the TikTok advertiser account you want to test."
        : connectionError
        ? "The connection is saved, but TikTok advertiser loading needs attention."
        : "Run event discovery and map purchase events before using TikTok for decisions.",
  });
}

export async function DELETE(request: NextRequest) {
  const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId"));
  await clearTikTokConnection(client.id);
  return NextResponse.json({ ok: true, clientId: client.id });
}
