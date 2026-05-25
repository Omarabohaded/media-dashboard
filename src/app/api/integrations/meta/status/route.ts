import { NextRequest, NextResponse } from "next/server";
import {
  buildMetaRedirectUri,
  fetchMetaAdAccounts,
  getMetaConfig,
  META_ACCOUNT_COOKIE,
  META_STATE_COOKIE,
  META_TOKEN_COOKIE,
} from "@/lib/integrations/meta";

export async function GET(request: NextRequest) {
  const config = getMetaConfig();
  const accessToken = request.cookies.get(META_TOKEN_COOKIE)?.value;
  const selectedAccountId = request.cookies.get(META_ACCOUNT_COOKIE)?.value ?? null;

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
    platform: "meta",
    configured: config.missingEnv.length === 0,
    connected: Boolean(accessToken) && !connectionError,
    appMode: config.appMode,
    scopes: config.scopes,
    callbackUrl: buildMetaRedirectUri(request.nextUrl.origin),
    missingEnv: config.missingEnv,
    usesMockData: true,
    selectedAccountId,
    selectedAccount,
    accounts,
    connectionError,
    syncReady: Boolean(accessToken && selectedAccountId),
    recommendedNextStep:
      !accessToken
        ? "Connect your Meta app in developer mode first."
        : !selectedAccountId
        ? "Choose the ad account you want to test."
        : "Run a preview sync and compare Meta against store truth.",
  });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.delete(META_TOKEN_COOKIE);
  response.cookies.delete(META_ACCOUNT_COOKIE);
  response.cookies.delete(META_STATE_COOKIE);

  return response;
}
