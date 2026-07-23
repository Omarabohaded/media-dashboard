import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { getGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";
import { fetchGoogleAdsPaidMediaRows } from "@/lib/integrations/googleAds";

export async function GET(request: NextRequest) {
  const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId"));
  const connection = await getGoogleAdsConnection(client.id);
  if (!connection?.accessToken || !connection.selectedCustomerId) return NextResponse.json({ error: "Connect Google Ads and select a customer first." }, { status: 400 });
  const until = request.nextUrl.searchParams.get("until") ?? new Date().toISOString().slice(0, 10);
  const since = request.nextUrl.searchParams.get("since") ?? new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  try {
    const rows = await fetchGoogleAdsPaidMediaRows({ accessToken: connection.accessToken, customerId: connection.selectedCustomerId, loginCustomerId: connection.loginCustomerId, clientId: client.id, since, until });
    return NextResponse.json({ rows, implementationStatus: "implemented_awaiting_live_validation" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google Ads report failed." }, { status: 500 });
  }
}
