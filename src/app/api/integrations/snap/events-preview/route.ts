import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { discoverSnapConversionEvents } from "@/lib/integrations/snap";
import { getSnapConnection, upsertSnapConnection } from "@/lib/snapConnectionStore";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
export async function GET(request: NextRequest) {
  const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId")), connection = await getSnapConnection(client.id);
  if (!connection?.accessToken || !connection.selectedAdAccountId) return NextResponse.json({ error: "Connect Snapchat and select an ad account first." }, { status: 400 });
  const discoveredAt = new Date().toISOString(); await upsertSnapConnection({ ...connection, lastDiscoveryAt: discoveredAt, lastDiscoveryError: null });
  return NextResponse.json({ events: discoverSnapConversionEvents(client.id), discoveredAt, mapping: await resolveSourceConversionMapping("snap", client.id), catalogSource: "official_measurement_metrics" });
}
