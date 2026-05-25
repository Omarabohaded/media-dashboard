import { NextRequest, NextResponse } from "next/server";
import {
  buildMetaRedirectUri,
  fetchMetaAdAccounts,
  getMetaConfig,
} from "@/lib/integrations/meta";
import {
  clearMetaConnection,
  getClientById,
  getMetaConnection,
} from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  const config = getMetaConfig();
  const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
  const connection = await getMetaConnection(client.id);
  const accessToken = connection?.accessToken || null;
  const selectedAccountId = connection?.selectedAccountId ?? null;

  let accounts: Awaited<ReturnType<typeof fetchMetaAdAccounts>> = [];
  let connectionError: string | null = null;

  if (accessToken && config.missingEnv.length === 0) {
    try {
      accounts = await fetchMetaAdAccounts(accessToken);
    } catch (error) {
      connectionError =
        error instanceof Error ? error.message : "Meta connection failed.";
    }
  }

  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? null;

  return NextResponse.json({
    client,
    platform: "meta",
    configured: config.missingEnv.length === 0,
    connected: Boolean(accessToken),
    accountFetchHealthy: !connectionError,
    appMode: config.appMode,
    scopes: config.scopes,
    callbackUrl: buildMetaRedirectUri(request.nextUrl.origin),
    missingEnv: config.missingEnv,
    usesMockData: false,
    selectedAccountId,
    selectedAccount:
      selectedAccount ??
      (connection?.selectedAccountId
        ? {
            id: connection.selectedAccountId,
            name: connection.selectedAccountName ?? connection.selectedAccountId,
          }
        : null),
    accounts,
    connectionError: connectionError ?? connection?.lastError ?? null,
    syncReady: Boolean(accessToken && selectedAccountId),
    recommendedNextStep:
      !accessToken
        ? "Connect your Meta app in developer mode first."
        : !selectedAccountId
        ? "Choose the ad account you want to test."
        : connectionError
        ? "The connection is saved, but Meta account loading needs attention."
        : "Run a preview sync and compare Meta against store truth.",
  });
}

export async function DELETE(request: NextRequest) {
  const client = await getClientById(request.nextUrl.searchParams.get("clientId"));
  await clearMetaConnection(client.id);
  return NextResponse.json({ ok: true, clientId: client.id });
}
