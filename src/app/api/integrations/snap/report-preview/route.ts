import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { fetchSnapPaidMediaRows } from "@/lib/integrations/snap";
import { getSnapConnection } from "@/lib/snapConnectionStore";
import { requireClientAccess } from "@/lib/serverAccess";
export async function GET(request: NextRequest) {
  const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;
  const client = await getRequiredClientById(access.clientId), connection = await getSnapConnection(client.id);
  if (!connection?.accessToken || !connection.selectedAdAccountId) return NextResponse.json({ error: "Connect Snapchat and select an ad account first." }, { status: 400 });
  const until = request.nextUrl.searchParams.get("until") ?? new Date().toISOString().slice(0, 10), since = request.nextUrl.searchParams.get("since") ?? new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
  try { return NextResponse.json({ rows: await fetchSnapPaidMediaRows({ accessToken: connection.accessToken, adAccountId: connection.selectedAdAccountId, clientId: client.id, since, until }), implementationStatus: "implemented_awaiting_live_validation" }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Snap report failed." }, { status: 500 }); }
}
