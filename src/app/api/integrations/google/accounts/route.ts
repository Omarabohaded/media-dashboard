import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { fetchGoogleAdsCustomers } from "@/lib/integrations/googleAds";
import { getGoogleAdsConnection, upsertGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";
import { requireClientAccess, requireClientIntegrationAccess } from "@/lib/serverAccess";
import { withGoogleAdsAccess } from "@/lib/providerAccess";

export async function GET(request: NextRequest) {
  try {
    const access = await requireClientAccess(request.nextUrl.searchParams.get("clientId"));
    if (access.response) return access.response;
    const client = await getRequiredClientById(access.clientId);
    const connection = await getGoogleAdsConnection(client.id);
    if (!connection?.accessToken) return NextResponse.json({ error: "Connect Google Ads first." }, { status: 401 });
    return NextResponse.json({ accounts: await withGoogleAdsAccess(client.id, fetchGoogleAdsCustomers), selectedAccountId: connection.selectedCustomerId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load Google Ads customers." }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const access = await requireClientIntegrationAccess(request.nextUrl.searchParams.get("clientId"));
    if (access.response) return access.response;
    const client = await getRequiredClientById(access.clientId);
    const connection = await getGoogleAdsConnection(client.id);
    if (!connection?.accessToken) return NextResponse.json({ error: "Connect Google Ads first." }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { customerId?: string; customerName?: string; loginCustomerId?: string | null };
    const accounts = await withGoogleAdsAccess(client.id, fetchGoogleAdsCustomers);
    const account = accounts.find((item) => item.customerId === body.customerId);
    if (!account) return NextResponse.json({ error: "Accessible customer not found." }, { status: 404 });
    await upsertGoogleAdsConnection({ ...connection, selectedCustomerId: account.customerId, selectedCustomerName: body.customerName ?? account.customerName, loginCustomerId: body.loginCustomerId?.trim() || null, lastError: null });
    return NextResponse.json({ ok: true, account });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save the Google Ads customer." }, { status: 500 });
  }
}
