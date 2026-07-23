import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { fetchSnapAdAccounts } from "@/lib/integrations/snap";
import { getSnapConnection, upsertSnapConnection } from "@/lib/snapConnectionStore";
import { requireClientAccess, requireClientIntegrationAccess } from "@/lib/serverAccess";
export async function GET(request: NextRequest) { const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId")); if (access.response) return access.response; const client = await getRequiredClientById(access.clientId), connection = await getSnapConnection(client.id); if (!connection?.accessToken) return NextResponse.json({ error: "Connect Snapchat first." }, { status: 401 }); return NextResponse.json({ accounts: await fetchSnapAdAccounts(connection.accessToken), selectedAccountId: connection.selectedAdAccountId }); }
export async function POST(request: NextRequest) {
  const access = await requireClientIntegrationAccess(request.nextUrl.searchParams.get("clientId"));
  if (access.response) return access.response;
  const client = await getRequiredClientById(access.clientId), connection = await getSnapConnection(client.id);
  if (!connection?.accessToken) return NextResponse.json({ error: "Connect Snapchat first." }, { status: 401 });
  const body = await request.json() as { adAccountId?: string }; const accounts = await fetchSnapAdAccounts(connection.accessToken), account = accounts.find((item) => item.adAccountId === body.adAccountId);
  if (!account) return NextResponse.json({ error: "Accessible Snap ad account not found." }, { status: 404 });
  await upsertSnapConnection({ ...connection, selectedAdAccountId: account.adAccountId, selectedAdAccountName: account.adAccountName, organizationId: account.organizationId, lastError: null }); return NextResponse.json({ ok: true, account });
}
