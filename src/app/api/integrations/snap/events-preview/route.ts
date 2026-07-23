import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { getSupportedSnapMetricCatalog } from "@/lib/integrations/snap";
import { getSnapConnection, upsertSnapConnection } from "@/lib/snapConnectionStore";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
import { requireClientAccess } from "@/lib/serverAccess";
export async function GET(request: NextRequest) {
  const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;
  const client = await getRequiredClientById(access.clientId), connection = await getSnapConnection(client.id);
  if (!connection?.accessToken || !connection.selectedAdAccountId) return NextResponse.json({ error: "Connect Snapchat and select an ad account first." }, { status: 400 });
  const discoveredAt = new Date().toISOString(); await upsertSnapConnection({ ...connection, lastDiscoveryAt: discoveredAt, lastDiscoveryError: null });
  return NextResponse.json({
    events: getSupportedSnapMetricCatalog(client.id),
    discoveredAt,
    mapping: await resolveSourceConversionMapping("snap", client.id),
    catalogSource: "supported_reporting_metric_catalog",
    upstreamDiscovery: false,
    note:
      "Snapchat reporting exposes supported conversion measurement fields rather than discoverable conversion-event objects. This catalog is versioned in code and validated against the reporting contract.",
  });
}
