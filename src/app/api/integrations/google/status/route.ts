import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { clearGoogleAdsConnection, getGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";
import { buildGoogleAdsRedirectUri, fetchGoogleAdsCustomers, getGoogleAdsConfig } from "@/lib/integrations/googleAds";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
import { requireClientAccess, requireClientIntegrationAccess } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;
  const client = await getRequiredClientById(access.clientId);
  const connection = await getGoogleAdsConnection(client.id);
  const config = getGoogleAdsConfig();
  let accounts: Awaited<ReturnType<typeof fetchGoogleAdsCustomers>> = [];
  let connectionError = connection?.lastError ?? null;
  if (connection?.accessToken && !config.missingEnv.length) try { accounts = await fetchGoogleAdsCustomers(connection.accessToken); } catch (error) { connectionError = error instanceof Error ? error.message : "Account discovery failed."; }
  const mapping = await resolveSourceConversionMapping("google", client.id);
  return NextResponse.json({
    platform: "google", client, configured: !config.missingEnv.length, missingEnv: config.missingEnv,
    connected: Boolean(connection?.accessToken), callbackUrl: buildGoogleAdsRedirectUri(request.nextUrl.origin),
    accounts, selectedAccountId: connection?.selectedCustomerId ?? null,
    selectedAccount: accounts.find((item) => item.customerId === connection?.selectedCustomerId) ?? null,
    tokenExpiresAt: connection?.accessTokenExpiresAt ?? null,
    tokenExpired: connection?.accessTokenExpiresAt ? Date.parse(connection.accessTokenExpiresAt) <= Date.now() : false,
    lastDiscoveryAt: connection?.lastDiscoveryAt ?? null, lastDiscoveryError: connection?.lastDiscoveryError ?? null,
    mapping, mappingHealthy: mapping.status === "mapped", connectionError,
    implementationStatus: "implemented_awaiting_live_validation",
  });
}
export async function DELETE(request: NextRequest) {
  const access = await requireClientIntegrationAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;
  const client = await getRequiredClientById(access.clientId);
  await clearGoogleAdsConnection(client.id);
  return NextResponse.json({ ok: true });
}
