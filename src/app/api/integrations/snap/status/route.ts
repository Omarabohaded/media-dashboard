import { NextRequest, NextResponse } from "next/server";
import { getRequiredClientById } from "@/lib/clientStore";
import { fetchSnapAdAccounts, getSnapConfig } from "@/lib/integrations/snap";
import { clearSnapConnection, getSnapConnection } from "@/lib/snapConnectionStore";
import { resolveSourceConversionMapping } from "@/lib/sourceConversionMappingStore";
export async function GET(request: NextRequest) {
  const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId")), connection = await getSnapConnection(client.id), config = getSnapConfig();
  let accounts: Awaited<ReturnType<typeof fetchSnapAdAccounts>> = [], connectionError = connection?.lastError ?? null;
  if (connection?.accessToken && !config.missingEnv.length) try { accounts = await fetchSnapAdAccounts(connection.accessToken); } catch (error) { connectionError = error instanceof Error ? error.message : "Account discovery failed."; }
  const mapping = await resolveSourceConversionMapping("snap", client.id);
  return NextResponse.json({ platform: "snap", configured: !config.missingEnv.length, missingEnv: config.missingEnv, connected: Boolean(connection?.accessToken), accounts, selectedAccountId: connection?.selectedAdAccountId ?? null, selectedAccount: accounts.find((item) => item.adAccountId === connection?.selectedAdAccountId) ?? null, tokenExpiresAt: connection?.accessTokenExpiresAt ?? null, tokenExpired: connection?.accessTokenExpiresAt ? Date.parse(connection.accessTokenExpiresAt) <= Date.now() : false, lastDiscoveryAt: connection?.lastDiscoveryAt ?? null, lastDiscoveryError: connection?.lastDiscoveryError ?? null, mapping, mappingHealthy: mapping.status === "mapped", connectionError, implementationStatus: "implemented_awaiting_live_validation" });
}
export async function DELETE(request: NextRequest) { const client = await getRequiredClientById(request.nextUrl.searchParams.get("clientId")); await clearSnapConnection(client.id); return NextResponse.json({ ok: true }); }
