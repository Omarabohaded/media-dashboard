import { NextRequest, NextResponse } from "next/server";
import { getClientById } from "@/lib/clientStore";
import {
  exchangeTikTokCodeForToken,
  fetchTikTokAdvertisers,
  getTikTokConfig,
  TIKTOK_OAUTH_CLIENT_COOKIE,
  TIKTOK_STATE_COOKIE,
} from "@/lib/integrations/tiktok";
import { upsertTikTokConnection } from "@/lib/tiktokConnectionStore";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const config = getTikTokConfig();
  const code = request.nextUrl.searchParams.get("code") ?? request.nextUrl.searchParams.get("auth_code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(TIKTOK_STATE_COOKIE)?.value;
  const oauthClientId = request.cookies.get(TIKTOK_OAUTH_CLIENT_COOKIE)?.value;
  const client = await getClientById(oauthClientId);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL(
        `/admin?clientId=${client.id}&tiktok_error=invalid_oauth_state`,
        origin
      )
    );
  }

  if (config.missingEnv.length > 0) {
    return NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&tiktok_error=missing_config`, origin)
    );
  }

  try {
    const token = await exchangeTikTokCodeForToken(code);

    if (!token.access_token) {
      throw new Error("TikTok did not return an access token.");
    }

    const accounts = await fetchTikTokAdvertisers(token.access_token);
    const selectedAdvertiser = accounts.length === 1 ? accounts[0] : null;
    const response = NextResponse.redirect(
      new URL(`/admin?clientId=${client.id}&tiktok_connected=1`, origin)
    );

    response.cookies.delete(TIKTOK_STATE_COOKIE);
    response.cookies.delete(TIKTOK_OAUTH_CLIENT_COOKIE);

    await upsertTikTokConnection({
      clientId: client.id,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      connectedAt: new Date().toISOString(),
      selectedAdvertiserId: selectedAdvertiser?.advertiserId ?? null,
      selectedAdvertiserName: selectedAdvertiser?.advertiserName ?? null,
      lastError: null,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "TikTok OAuth exchange failed.";

    await upsertTikTokConnection({
      clientId: client.id,
      accessToken: "",
      refreshToken: null,
      connectedAt: new Date().toISOString(),
      selectedAdvertiserId: null,
      selectedAdvertiserName: null,
      lastError: message,
    });

    return NextResponse.redirect(
      new URL(
        `/admin?clientId=${client.id}&tiktok_error=${encodeURIComponent(message)}`,
        origin
      )
    );
  }
}
