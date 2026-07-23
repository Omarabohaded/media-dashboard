import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { fetchGoogleAdsConversionEvents } from "@/lib/integrations/googleAds";
import { getGoogleAdsConnection, upsertGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
import { requireClientAccess } from "@/lib/serverAccess";

export async function GET(request: NextRequest) {
  const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;
  const client = await getRequiredClientById(access.clientId);
  const connection = await getGoogleAdsConnection(client.id);
  if (!connection?.accessToken || !connection.selectedCustomerId) return NextResponse.json({ error: "Connect Google Ads and select a customer first." }, { status: 400 });
  try {
    const events = (await fetchGoogleAdsConversionEvents(connection.accessToken, connection.selectedCustomerId, connection.loginCustomerId)).map((event) => ({ ...event, clientId: client.id }));
    const discoveredAt = new Date().toISOString();
    await upsertGoogleAdsConnection({ ...connection, lastDiscoveryAt: discoveredAt, lastDiscoveryError: null });
    return NextResponse.json({ events, discoveredAt, mapping: await resolveSourceConversionMapping("google", client.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Event discovery failed.";
    await upsertGoogleAdsConnection({ ...connection, lastDiscoveryError: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
