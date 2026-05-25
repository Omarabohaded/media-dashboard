import { NextRequest, NextResponse } from "next/server";
import {
  exchangeMetaCodeForToken,
  fetchMetaAdAccounts,
  getMetaConfig,
  META_OAUTH_CLIENT_COOKIE,
  META_STATE_COOKIE,
} from "@/lib/integrations/meta";
import { getClientById, upsertMetaConnection } from "@/lib/clientStore";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const config = getMetaConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(META_STATE_COOKIE)?.value;
  const oauthClientId = request.cookies.get(META_OAUTH_CLIENT_COOKIE)?.value;
  const client = await getClientById(oauthClientId);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL(
        `/admin?clientId=${client.id}&meta_error=invalid_oauth_state`,
        origin
      )
    );
  }

  if (config.missingEnv.length > 0) {
    return NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&meta_error=missing_config`, origin)
    );
  }

  try {
    const token = await exchangeMetaCodeForToken(origin, code);
    const accounts = await fetchMetaAdAccounts(token.access_token);
    const response = NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&meta_connected=1`, origin)
    );

    response.cookies.delete(META_STATE_COOKIE);
    response.cookies.delete(META_OAUTH_CLIENT_COOKIE);

    const selectedAccount = accounts.length === 1 ? accounts[0] : null;

    await upsertMetaConnection({
      clientId: client.id,
      accessToken: token.access_token,
      connectedAt: new Date().toISOString(),
      selectedAccountId: selectedAccount?.id ?? null,
      selectedAccountName: selectedAccount?.name ?? null,
      lastError: null,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "oauth_exchange_failed";
    await upsertMetaConnection({
      clientId: client.id,
      accessToken: "",
      connectedAt: new Date().toISOString(),
      selectedAccountId: null,
      selectedAccountName: null,
      lastError: message,
    });
    return NextResponse.redirect(
      new URL(
        `/admin?clientId=${client.id}&meta_error=${encodeURIComponent(message)}`,
        origin
      )
    );
  }
}
