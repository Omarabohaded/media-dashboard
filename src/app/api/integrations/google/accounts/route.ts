import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { fetchGoogleAdsCustomers } from "@/lib/integrations/googleAds";
import { getGoogleAdsConnection, upsertGoogleAdsConnection } from "@/lib/googleAdsConnectionStore";

export async function GET(request: NextRequest) {
  const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId"));
  const connection = await getGoogleAdsConnection(client.id);
  if (!connection?.accessToken) return NextResponse.json({ error: "Connect Google Ads first." }, { status: 401 });
  return NextResponse.json({ accounts: await fetchGoogleAdsCustomers(connection.accessToken), selectedAccountId: connection.selectedCustomerId });
}
export async function POST(request: NextRequest) {
  const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId"));
  const connection = await getGoogleAdsConnection(client.id);
  if (!connection?.accessToken) return NextResponse.json({ error: "Connect Google Ads first." }, { status: 401 });
  const body = await request.json() as { customerId?: string; customerName?: string; loginCustomerId?: string | null };
  const accounts = await fetchGoogleAdsCustomers(connection.accessToken);
  const account = accounts.find((item) => item.customerId === body.customerId);
  if (!account) return NextResponse.json({ error: "Accessible customer not found." }, { status: 404 });
  await upsertGoogleAdsConnection({ ...connection, selectedCustomerId: account.customerId, selectedCustomerName: body.customerName ?? account.customerName, loginCustomerId: body.loginCustomerId?.trim() || null, lastError: null });
  return NextResponse.json({ ok: true, account });
}
